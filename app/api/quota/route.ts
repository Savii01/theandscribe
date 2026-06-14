import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { seedProviderUsage } from '@/lib/transcription/quota';

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Seed first if missing
  await seedProviderUsage(user.id);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthYear = `${year}-${month}`;

  // Fetch usage
  const { data: usage, error } = await supabase
    .from('provider_usage')
    .select('provider, minutes_used, minutes_limit')
    .eq('user_id', user.id)
    .eq('month_year', monthYear);

  if (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json({ error: 'Failed to fetch quota data' }, { status: 500 });
  }

  // Structure response
  const providersData = (usage ?? []).reduce((acc: any, curr: any) => {
    acc[curr.provider] = {
      used: curr.minutes_used,
      limit: curr.minutes_limit,
      percentage: curr.minutes_limit > 0 ? (curr.minutes_used / curr.minutes_limit) * 100 : 0,
    };
    return acc;
  }, {});

  // Ensure all 4 providers are present
  const defaultProviders = ['groq', 'gladia', 'assemblyai', 'deepgram'];
  defaultProviders.forEach((p) => {
    if (!providersData[p]) {
      providersData[p] = { used: 0, limit: 100, percentage: 0 };
    }
  });

  // Warning if total/any is near limits
  // Let's set warning if ANY provider is >= 80% used
  const warning = Object.values(providersData).some((p: any) => p.percentage >= 80 && p.percentage < 100);
  // Critical if ALL providers are >= 100% used, or if primary (groq) is exhausted and fallback limits reached
  const critical = Object.values(providersData).every((p: any) => p.percentage >= 100);

  return NextResponse.json({
    providers: providersData,
    warning,
    critical,
  });
}
