import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return null;
  }

  return user;
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const serviceClient = await createServiceClient();

  try {
    // 1. Get total users count
    const { count: totalUsers, error: usersError } = await serviceClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // 2. Get total transcripts count
    const { count: totalTranscripts, error: transcriptsError } = await serviceClient
      .from('transcripts')
      .select('*', { count: 'exact', head: true });

    if (transcriptsError) throw transcriptsError;

    // 3. Get transcript breakdown by status
    const { data: statusBreakdown, error: statusError } = await serviceClient
      .from('transcripts')
      .select('status');

    if (statusError) throw statusError;

    // 4. Get transcript breakdown by provider
    const { data: providerBreakdown, error: providerError } = await serviceClient
      .from('transcripts')
      .select('transcription_provider');

    if (providerError) throw providerError;

    // In-memory aggregations
    const statusCounts = (statusBreakdown ?? []).reduce((acc: Record<string, number>, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    const providerCounts = (providerBreakdown ?? []).reduce((acc: Record<string, number>, t) => {
      const p = t.transcription_provider || 'unknown';
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});

    // 5. Get transcripts created in the last 14 days grouped by day
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const { data: recentTranscripts, error: recentError } = await serviceClient
      .from('transcripts')
      .select('created_at')
      .gte('created_at', fourteenDaysAgo.toISOString());

    if (recentError) throw recentError;

    // Group by date
    const dailyCounts: Record<string, number> = {};
    // Pre-populate last 14 days with 0
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyCounts[dateStr] = 0;
    }

    (recentTranscripts ?? []).forEach((t) => {
      if (t.created_at) {
        const dateStr = t.created_at.split('T')[0];
        if (dailyCounts[dateStr] !== undefined) {
          dailyCounts[dateStr]++;
        }
      }
    });

    const chartData = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalTranscripts: totalTranscripts || 0,
        statusBreakdown: {
          pending: statusCounts.pending || 0,
          processing: statusCounts.processing || 0,
          completed: statusCounts.completed || 0,
          failed: statusCounts.failed || 0,
        },
        providerBreakdown: {
          groq: providerCounts.groq || 0,
          gladia: providerCounts.gladia || 0,
          assemblyai: providerCounts.assemblyai || 0,
          deepgram: providerCounts.deepgram || 0,
        },
        chartData,
      }
    });
  } catch (error: any) {
    console.error('Error generating admin stats:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch admin stats' }, { status: 500 });
  }
}
