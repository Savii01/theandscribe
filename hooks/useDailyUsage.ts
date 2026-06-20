'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';

const DAILY_LIMIT = 10;

/**
 * Hook to retrieve the user's daily transcription count and calculate remaining quota.
 * Uses SWR to fetch and cache data.
 */
export function useDailyUsage() {
  const supabase = createClient();

  const { data, error, mutate, isLoading } = useSWR(
    'daily-usage-today',
    async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Start of today in UTC/local boundary
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { count, error: countError } = await supabase
        .from('transcripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfToday.toISOString());

      if (countError) throw countError;
      return count || 0;
    },
    {
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    usageCount: data ?? 0,
    dailyLimit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - (data ?? 0)),
    isFull: (data ?? 0) >= DAILY_LIMIT,
    isLoading,
    error,
    mutate,
  };
}
