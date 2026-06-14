'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

interface JobStatusResult {
  status: JobStatus;
  error?: string | null;
  transcriptId?: string | null;
}

/**
 * SWR polling hook that checks processing_jobs status every 2 seconds.
 * Stops automatically when status is 'completed' or 'failed'.
 */
export function useJobStatus(jobId: string | null) {
  const supabase = createClient();

  const { data, error, isLoading } = useSWR<JobStatusResult>(
    jobId ? `job-status-${jobId}` : null,
    async () => {
      const { data: job, error: jobError } = await supabase
        .from('processing_jobs')
        .select('status, error, transcript_id')
        .eq('id', jobId!)
        .single();

      if (jobError) throw jobError;

      return {
        status: job.status as JobStatus,
        error: job.error,
        transcriptId: job.transcript_id,
      };
    },
    {
      refreshInterval: (data) => {
        // Stop polling once the job is done
        if (data?.status === 'completed' || data?.status === 'failed') return 0;
        return 2000;
      },
      revalidateOnFocus: false,
    }
  );

  return {
    status: data?.status ?? 'queued',
    jobError: data?.error,
    transcriptId: data?.transcriptId,
    isLoading,
    fetchError: error,
    isComplete: data?.status === 'completed',
    isFailed: data?.status === 'failed',
    isProcessing: data?.status === 'queued' || data?.status === 'running',
  };
}
