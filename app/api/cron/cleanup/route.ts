import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  // Validate CRON_SECRET
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createServiceClient();

    // 3 days ago timestamp
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Find transcripts created more than 3 days ago
    const { data: transcripts, error: fetchError } = await supabase
      .from('transcripts')
      .select('id')
      .lt('created_at', threeDaysAgo.toISOString());

    if (fetchError) throw fetchError;

    if (transcripts && transcripts.length > 0) {
      const transcriptIds = transcripts.map(t => t.id);

      // Update transcript_versions content for these transcripts
      const { error: updateError } = await supabase
        .from('transcript_versions')
        .update({
          content: '[Content deleted after 3 days due to storage quota limits]',
          segments: null,
        })
        .in('transcript_id', transcriptIds);

      if (updateError) throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: `Daily cleanup completed. Cleared content for ${transcripts?.length ?? 0} transcripts.`,
    });
  } catch (err: any) {
    console.error('Daily cleanup cron failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
