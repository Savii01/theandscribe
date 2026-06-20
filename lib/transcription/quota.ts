import { createServiceClient } from '../supabase/server';

export const PROVIDER_LIMITS = {
  groq: 900,       // 15 hours in minutes
  gladia: 60,      // 1 hour fallback
  assemblyai: 120, // 2 hours fallback
  deepgram: 120,   // 2 hours fallback
};

export type ProviderName = 'groq' | 'gladia' | 'assemblyai' | 'deepgram';

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Seeds the provider_usage rows for the current month if they don't exist.
 */
export async function seedProviderUsage(userId: string) {
  const supabase = await createServiceClient();
  const monthYear = getCurrentMonth();

  const { data: existing, error } = await supabase
    .from('provider_usage')
    .select('provider')
    .eq('user_id', userId)
    .eq('month_year', monthYear);

  if (error) {
    console.error('Error fetching provider usage:', error);
    return;
  }

  const existingProviders = new Set((existing ?? []).map(r => r.provider));
  const toInsert = [];

  for (const provider of Object.keys(PROVIDER_LIMITS) as ProviderName[]) {
    if (!existingProviders.has(provider)) {
      toInsert.push({
        user_id: userId,
        provider,
        month_year: monthYear,
        minutes_used: 0,
        minutes_limit: PROVIDER_LIMITS[provider],
      });
    }
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('provider_usage')
      .insert(toInsert);
    if (insertError) {
      console.error('Error seeding provider usage:', insertError);
    }
  }
}

/**
 * Checks if the user has any remaining quota in any provider.
 * If all are exhausted, returns false.
 */
export async function quotaPreflightCheck(userId: string): Promise<boolean> {
  await seedProviderUsage(userId);
  
  const supabase = await createServiceClient();
  const monthYear = getCurrentMonth();

  const { data: usage, error } = await supabase
    .from('provider_usage')
    .select('provider, minutes_used, minutes_limit')
    .eq('user_id', userId)
    .eq('month_year', monthYear);

  if (error || !usage || usage.length === 0) {
    console.error('Quota preflight failed to read usage:', error);
    return true; // Fallback to true to not block user on DB error
  }

  // Check if at least one provider has remaining minutes
  const hasQuota = usage.some(u => u.minutes_used < u.minutes_limit);
  return hasQuota;
}

/**
 * Resolves the list of providers that have remaining monthly quota.
 */
export async function getAvailableProviders(userId: string): Promise<ProviderName[]> {
  await seedProviderUsage(userId);

  const supabase = await createServiceClient();
  const monthYear = getCurrentMonth();

  const { data: usage, error } = await supabase
    .from('provider_usage')
    .select('provider, minutes_used, minutes_limit')
    .eq('user_id', userId)
    .eq('month_year', monthYear);

  if (error || !usage || usage.length === 0) {
    console.error('Failed to read usage to determine available providers:', error);
    return ['groq', 'gladia', 'assemblyai', 'deepgram']; // Fallback to all on error
  }

  const usageMap = new Map<string, { used: number; limit: number }>();
  usage.forEach((u: any) => {
    usageMap.set(u.provider, { used: u.minutes_used, limit: u.minutes_limit });
  });

  const available: ProviderName[] = [];
  for (const provider of Object.keys(PROVIDER_LIMITS) as ProviderName[]) {
    const usageInfo = usageMap.get(provider);
    if (!usageInfo || usageInfo.used < usageInfo.limit) {
      available.push(provider);
    }
  }

  return available;
}

/**
 * Increments the minutes used for a provider.
 */
export async function incrementProviderUsage(userId: string, provider: ProviderName, durationSeconds: number) {
  const supabase = await createServiceClient();
  const monthYear = getCurrentMonth();
  const minutes = Math.round((durationSeconds / 60) * 100) / 100;

  await seedProviderUsage(userId);

  const { data, error } = await supabase
    .from('provider_usage')
    .select('id, minutes_used')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('month_year', monthYear)
    .single();

  if (error || !data) {
    console.error(`Failed to find provider usage to increment for ${provider}:`, error);
    return;
  }

  const newUsed = Math.round((data.minutes_used + minutes) * 100) / 100;

  const { error: updateError } = await supabase
    .from('provider_usage')
    .update({ minutes_used: newUsed, updated_at: new Date().toISOString() })
    .eq('id', data.id);

  if (updateError) {
    console.error(`Failed to update provider usage for ${provider}:`, updateError);
  }
}
