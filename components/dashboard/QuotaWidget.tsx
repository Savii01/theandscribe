'use client';

import React from 'react';
import { useQuotaStatus } from '@/hooks/useQuotaStatus';
import { FaExclamationTriangle, FaTimesCircle, FaCloud } from 'react-icons/fa';

export function QuotaWidget() {
  const { quota, warning, critical, isLoading, error } = useQuotaStatus();

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-1/4"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2 p-3 rounded-xl bg-muted/20">
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-20"></div>
                  <div className="h-3 bg-muted rounded w-12"></div>
                </div>
                <div className="h-2.5 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !quota) return null;

  const providers = Object.entries(quota.providers).map(([name, data]) => ({
    name,
    ...data,
  }));

  const providerNames: Record<string, string> = {
    groq: 'Groq (Whisper)',
    gladia: 'Gladia',
    assemblyai: 'AssemblyAI',
    deepgram: 'Deepgram',
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-heading font-bold tracking-tight text-foreground uppercase tracking-wider">
          Monthly Quota Usage
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FaCloud size={12} className="text-primary animate-pulse" /> Syncing
        </span>
      </div>

      {/* Warning/Critical Banners */}
      {critical && (
        <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400">
          <FaTimesCircle className="mt-0.5 flex-shrink-0 text-red-500" />
          <div className="text-xs">
            <p className="font-semibold">All Quotas Exhausted</p>
            <p>You have reached 100% limit on all transcription providers. New jobs will be queued.</p>
          </div>
        </div>
      )}

      {warning && !critical && (
        <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/25 rounded-xl text-yellow-400">
          <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-yellow-500" />
          <div className="text-xs">
            <p className="font-semibold">Quota Warning</p>
            <p>You have used over 80% of the monthly limit for one or more providers.</p>
          </div>
        </div>
      )}

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => {
          const isOverLimit = p.used >= p.limit;
          const isWarning = p.percentage >= 80;
          
          let barColor = 'bg-primary'; // Yellow Accent
          if (isOverLimit) barColor = 'bg-red-500';
          else if (isWarning) barColor = 'bg-yellow-500';

          return (
            <div key={p.name} className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/40">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">{providerNames[p.name] || p.name}</span>
                <span className="text-muted-foreground font-mono">
                  {p.used.toFixed(1)} / {p.limit} mins
                </span>
              </div>
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all duration-500`}
                  style={{ width: `${Math.min(100, p.percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
