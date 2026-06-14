import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServiceClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: job, error } = await supabase
    .from('processing_jobs')
    .select('status, error, transcript_id, provider_used, completed_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    error: job.error,
    transcriptId: job.transcript_id,
    provider: job.provider_used,
    completedAt: job.completed_at,
  });
}
