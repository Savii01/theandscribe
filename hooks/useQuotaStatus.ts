import useSWR from 'swr';

interface ProviderQuota {
  used: number;
  limit: number;
  percentage: number;
}

interface QuotaStatusResponse {
  providers: {
    groq: ProviderQuota;
    gladia: ProviderQuota;
    assemblyai: ProviderQuota;
    deepgram: ProviderQuota;
  };
  warning: boolean;
  critical: boolean;
}

export function useQuotaStatus() {
  const { data, error, mutate, isLoading } = useSWR<QuotaStatusResponse>(
    '/api/quota',
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch quota status');
      return res.json();
    },
    {
      refreshInterval: 60000, // Refresh every 60 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    quota: data,
    warning: data?.warning ?? false,
    critical: data?.critical ?? false,
    isLoading,
    error,
    mutate,
  };
}
