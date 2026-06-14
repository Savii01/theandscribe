import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { seedProviderUsage } from '@/lib/transcription/quota';

export async function GET(req: NextRequest) {
  // Validate CRON_SECRET
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createServiceClient();

    // Fetch all users
    const { data: users, error } = await supabase.from('profiles').select('id');
    if (error) throw error;

    // Seed usage for all users for the current month
    for (const u of (users ?? [])) {
      await seedProviderUsage(u.id);
    }

    return NextResponse.json({ success: true, message: 'Monthly reset completed.' });
  } catch (err: any) {
    console.error('Monthly reset cron failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
