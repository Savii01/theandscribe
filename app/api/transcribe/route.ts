import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { transcribeAudio } from '@/lib/transcription';
import { transcribeApiSchema } from '@/lib/validators/api';
import { quotaPreflightCheck, incrementProviderUsage } from '@/lib/transcription/quota';

export const maxDuration = 60; // seconds (Vercel Pro supports 60s)

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = transcribeApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 422 });
  }

  const { storageKey, jobId, language, model } = parsed.data;

  // Resolve transcript ID first
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
      audio_url: storageKey,
      language,
      model,
    });

    // Notify user
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Transcription Queued',
      message: 'Your transcription job was queued because daily/monthly API limits are reached.',
      type: 'warning',
    });

    // Update transcript status to pending (queued message)
    await supabase.from('transcripts').update({
      status: 'pending',
      error_message: 'Queued due to daily/monthly limits.',
    }).eq('id', transcriptId);

    // Complete the processing job as failed/queued? Keep it as queued
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

  // Update job to running
  await supabase.from('processing_jobs').update({ status: 'running', attempts: 1 }).eq('id', jobId);

  try {
    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('media-uploads')
      .download(storageKey);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file from storage: ${downloadError?.message}`);
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    const filename = storageKey.split('/').pop() ?? 'audio.mp3';

    // Transcribe
    const result = await transcribeAudio(audioBuffer, filename, language, model);

    // Insert transcript version
    await supabase.from('transcript_versions').insert({
      transcript_id: transcriptId,
      version_number: 1,
      content: result.text,
      segments: result.segments as any,
    });

    // Update transcript status
    const wordCount = result.text.trim().split(/\s+/).filter(Boolean).length;
    await supabase.from('transcripts').update({
      status: 'completed',
      language_detected: result.language,
      duration_seconds: Math.round(result.duration),
      word_count: wordCount,
      transcription_provider: result.provider,
      updated_at: new Date().toISOString(),
    }).eq('id', transcriptId);

    // Update job to completed
    await supabase.from('processing_jobs').update({
      status: 'completed',
      provider_used: result.provider,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    // Increment provider usage minutes
    await incrementProviderUsage(user.id, result.provider, result.duration);

    // Delete media file from storage (keep storage free)
    await supabase.storage.from('media-uploads').remove([storageKey]);

    return NextResponse.json({
      success: true,
      transcriptId,
      language: result.language,
      duration: result.duration,
      wordCount,
      provider: result.provider,
    });
  } catch (err: any) {
    console.error('Transcription failed:', err);

    const isRateLimit = err.message?.includes('RATE_LIMIT_ALL_PROVIDERS') || err.message?.includes('429');

    if (isRateLimit) {
      // Queue the job when all providers are exhausted
      await supabase.from('transcription_jobs').insert({
        user_id: user.id,
        transcript_id: transcriptId,
        status: 'queued',
        audio_url: storageKey,
        language,
        model,
      });

      // Notify the user
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Transcription Queued',
        message: 'Your transcription job was queued because all providers are currently rate-limited.',
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

    // Mark job and transcript as failed for non-rate limit errors
    try {
      await supabase.from('transcripts').update({
        status: 'failed',
        error_message: err.message,
        updated_at: new Date().toISOString(),
      }).eq('id', transcriptId);
    } catch {}

    await supabase.from('processing_jobs').update({
      status: 'failed',
      error: err.message,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    // Clean up storage file on failure
    try {
      await supabase.storage.from('media-uploads').remove([storageKey]);
    } catch {}

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
