import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient();

  try {
    const payload = await req.json();
    const { jobId, status, result, error } = payload;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    console.log(`Webhook received for job ${jobId}: status=${status}`);

    // Update job status if webhook triggered
    if (status === 'completed') {
      const { data: job } = await supabase
        .from('processing_jobs')
        .select('transcript_id')
        .eq('id', jobId)
        .single();

      if (job?.transcript_id) {
        // Insert version
        await supabase.from('transcript_versions').insert({
          transcript_id: job.transcript_id,
          version_number: 1,
          content: result?.text || '',
          segments: result?.segments || [],
        });

        // Update transcript
        await supabase.from('transcripts').update({
          status: 'completed',
          language_detected: result?.language,
          duration_seconds: Math.round(result?.duration || 0),
          word_count: (result?.text || '').trim().split(/\s+/).filter(Boolean).length,
          updated_at: new Date().toISOString(),
        }).eq('id', job.transcript_id);
      }

      await supabase.from('processing_jobs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', jobId);
    } else if (status === 'failed') {
      const { data: job } = await supabase
        .from('processing_jobs')
        .select('transcript_id')
        .eq('id', jobId)
        .single();

      if (job?.transcript_id) {
        await supabase.from('transcripts').update({
          status: 'failed',
          error_message: error || 'Failed via webhook',
          updated_at: new Date().toISOString(),
        }).eq('id', job.transcript_id);
      }

      await supabase.from('processing_jobs').update({
        status: 'failed',
        error: error || 'Failed via webhook',
        completed_at: new Date().toISOString(),
      }).eq('id', jobId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
