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
    // 1. Fetch profiles
    const { data: profiles, error: profilesError } = await serviceClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // 2. Fetch auth users
    const { data: { users: authUsers }, error: authError } = await serviceClient.auth.admin.listUsers();
    if (authError) throw authError;

    // Create auth map for O(1) lookup
    const authMap = new Map(authUsers.map((u) => [u.id, u]));

    // 3. Count daily transcripts for all users today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data: todayTranscripts, error: transcriptsError } = await serviceClient
      .from('transcripts')
      .select('user_id')
      .gte('created_at', startOfToday.toISOString());

    if (transcriptsError) throw transcriptsError;

    const todayTranscriptsMap = (todayTranscripts ?? []).reduce((acc: Record<string, number>, t) => {
      acc[t.user_id] = (acc[t.user_id] || 0) + 1;
      return acc;
    }, {});

    // 4. Count total transcripts for all users
    const { data: totalTranscripts, error: totalTranscriptsError } = await serviceClient
      .from('transcripts')
      .select('user_id');

    if (totalTranscriptsError) throw totalTranscriptsError;

    const totalTranscriptsMap = (totalTranscripts ?? []).reduce((acc: Record<string, number>, t) => {
      acc[t.user_id] = (acc[t.user_id] || 0) + 1;
      return acc;
    }, {});

    // 5. Combine data
    const usersList = (profiles ?? []).map((profile) => {
      const authUser = authMap.get(profile.id);
      const rawTodayCount = todayTranscriptsMap[profile.id] || 0;
      const offset = profile.daily_usage_offset || 0;
      
      return {
        id: profile.id,
        fullName: profile.full_name || 'No name',
        avatarUrl: profile.avatar_url,
        role: profile.role || 'user',
        createdAt: profile.created_at,
        email: authUser?.email || 'N/A',
        dailyLimit: profile.daily_limit !== undefined ? profile.daily_limit : 10,
        dailyUsage: Math.max(0, rawTodayCount - offset),
        totalTranscripts: totalTranscriptsMap[profile.id] || 0,
      };
    });

    return NextResponse.json({ users: usersList });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch admin users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const serviceClient = await createServiceClient();

  try {
    const body = await req.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (action === 'update_limit') {
      const { dailyLimit } = body;
      if (typeof dailyLimit !== 'number' || dailyLimit < 0) {
        return NextResponse.json({ error: 'Invalid dailyLimit parameter' }, { status: 400 });
      }

      const { error } = await serviceClient
        .from('profiles')
        .update({ daily_limit: dailyLimit })
        .eq('id', userId);

      if (error) throw error;
      return NextResponse.json({ message: 'Daily limit updated successfully' });
    }

    if (action === 'update_role') {
      const { role } = body;
      if (role !== 'admin' && role !== 'user') {
        return NextResponse.json({ error: 'Invalid role parameter' }, { status: 400 });
      }

      const { error } = await serviceClient
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
      return NextResponse.json({ message: 'User role updated successfully' });
    }

    if (action === 'reset_usage') {
      // 1. Get raw transcription count for user today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { count, error: countError } = await serviceClient
        .from('transcripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfToday.toISOString());

      if (countError) throw countError;

      // 2. Set daily_usage_offset to that count
      const { error: updateError } = await serviceClient
        .from('profiles')
        .update({ daily_usage_offset: count || 0 })
        .eq('id', userId);

      if (updateError) throw updateError;
      return NextResponse.json({ message: 'User daily usage count reset successfully' });
    }

    return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
  } catch (error: any) {
    console.error('Error handling admin user update:', error);
    return NextResponse.json({ error: error.message || 'Action execution failed' }, { status: 500 });
  }
}
