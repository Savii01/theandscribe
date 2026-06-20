'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook to retrieve the user's daily transcription count and calculate remaining quota.
 * Uses SWR to fetch and cache data.
 */
export function useDailyUsage() {
  const supabase = createClient();

  const { data, error, mutate, isLoading } = useSWR(
    'daily-usage-today-v2',
    async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { usageCount: 0, dailyLimit: 10 };

      // Start of today in UTC/local boundary
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { count, error: countError } = await supabase
        .from('transcripts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfToday.toISOString());

      if (countError) throw countError;

      let dailyLimit = 10;
      let dailyUsageOffset = 0;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('daily_limit, daily_usage_offset')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (typeof profile.daily_limit === 'number') {
            dailyLimit = profile.daily_limit;
          }
          if (typeof profile.daily_usage_offset === 'number') {
            dailyUsageOffset = profile.daily_usage_offset;
          }
        }
      } catch (err) {
        console.warn('Failed to query profiles details, using default fallbacks:', err);
      }

      const totalCount = count || 0;
      const usageCount = Math.max(0, totalCount - dailyUsageOffset);

      return {
        usageCount,
        dailyLimit,
      };
    },
    {
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true,
    }
  );

  const usageCount = data?.usageCount ?? 0;
  const dailyLimit = data?.dailyLimit ?? 10;

  return {
    usageCount,
    dailyLimit,
    remaining: Math.max(0, dailyLimit - usageCount),
    isFull: usageCount >= dailyLimit,
    isLoading,
    error,
    mutate,
  };
}
