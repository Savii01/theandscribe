import { NextRequest, NextResponse } from 'next/server';
import { createUserClient, createServiceClient } from '@/lib/supabase/server';
import { transcribeAudio } from '@/lib/transcription';
import { extractAudio } from '@/lib/extractors';
import { transcribeUrlApiSchema } from '@/lib/validators/api';
import { quotaPreflightCheck, incrementProviderUsage } from '@/lib/transcription/quota';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Auth: cookie-aware client for session resolution
  const authClient = await createUserClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // DB: service client
  const supabase = await createServiceClient();

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = transcribeUrlApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 422 });
  }

  const { url, jobId, language, model } = parsed.data;

  // Get transcript ID from job first
  const { data: job } = await supabase
    .from('processing_jobs')
    .select('transcript_id')
    .eq('id', jobId)
    .single();

  if (!job?.transcript_id) {
    return NextResponse.json({ error: 'Could not find transcript for job' }, { status: 404 });
  }
  const transcriptId = job.transcript_id;

  // Quota preflight check
  const hasQuota = await quotaPreflightCheck(user.id);
  if (!hasQuota) {
    // Queue the job
    await supabase.from('transcription_jobs').insert({
      user_id: user.id,
      transcript_id: transcriptId,
      status: 'queued',
      audio_url: url, // Store the URL as audio_url
      language,
      model,
    });

    // Notify user
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Transcription Queued',
      message: 'Your URL transcription job was queued because daily/monthly API limits are reached.',
      type: 'warning',
    });

    // Update transcript status
    await supabase.from('transcripts').update({
      status: 'pending',
      error_message: 'Queued due to daily/monthly limits.',
    }).eq('id', transcriptId);

    // Update processing job
    await supabase.from('processing_jobs').update({
      status: 'queued',
      error: 'Queued due to daily/monthly limits.',
    }).eq('id', jobId);

    return NextResponse.json({
      success: true,
      queued: true,
      transcriptId,
      message: 'Transcription queued due to limits.',
    });
  }

  // Mark job running
  await supabase.from('processing_jobs').update({ status: 'running', attempts: 1 }).eq('id', jobId);

  try {
    // Extract audio from URL (YouTube or direct)
    const { buffer: audioBuffer, ext } = await extractAudio(url, jobId);
    const filename = `audio.${ext}`;

    // Transcribe
    const result = await transcribeAudio(user.id, audioBuffer, filename, language, model);

    // Save transcript version
    await supabase.from('transcript_versions').insert({
      transcript_id: transcriptId,
      version_number: 1,
      content: result.text,
      segments: result.segments as any,
    });

    const wordCount = result.text.trim().split(/\s+/).filter(Boolean).length;

    // Update transcript
    await supabase.from('transcripts').update({
      status: 'completed',
      language_detected: result.language,
      duration_seconds: Math.round(result.duration),
      word_count: wordCount,
      transcription_provider: result.provider,
      updated_at: new Date().toISOString(),
    }).eq('id', transcriptId);

    // Complete the job
    await supabase.from('processing_jobs').update({
      status: 'completed',
      provider_used: result.provider,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    // Increment provider usage minutes
    await incrementProviderUsage(user.id, result.provider, result.duration);

    return NextResponse.json({ success: true, transcriptId, language: result.language, duration: result.duration, wordCount, provider: result.provider });

  } catch (err: any) {
    console.error('URL transcription failed:', err);

    const isRateLimit = err.message?.includes('RATE_LIMIT_ALL_PROVIDERS') || err.message?.includes('429');

    if (isRateLimit) {
      // Queue the job when all providers are exhausted
      await supabase.from('transcription_jobs').insert({
        user_id: user.id,
        transcript_id: transcriptId,
        status: 'queued',
        audio_url: url,
        language,
        model,
      });

      // Notify the user
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Transcription Queued',
        message: 'Your URL transcription job was queued because all providers are currently rate-limited.',
        type: 'warning',
      });

      await supabase.from('transcripts').update({
        status: 'pending',
        error_message: 'Queued due to provider rate limit.',
        updated_at: new Date().toISOString(),
      }).eq('id', transcriptId);

      await supabase.from('processing_jobs').update({
        status: 'queued',
        error: 'Providers rate-limited. Queued.',
      }).eq('id', jobId);

      return NextResponse.json({
        success: true,
        queued: true,
        transcriptId,
        message: 'All providers rate-limited. Job queued.',
      });
    }

    try {
      await supabase.from('transcripts').update({ status: 'failed', error_message: err.message, updated_at: new Date().toISOString() }).eq('id', transcriptId);
    } catch {}

    await supabase.from('processing_jobs').update({ status: 'failed', error: err.message, completed_at: new Date().toISOString() }).eq('id', jobId);

    return NextResponse.json(
      { error: err.message?.includes('Unsupported URL') ? 'Could not download URL. Try uploading the file directly.' : err.message },
      { status: 500 }
    );
  }
}
