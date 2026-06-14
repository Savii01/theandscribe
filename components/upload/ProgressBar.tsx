import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({ value, label, showPercent = true, size = 'md', className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const heights = { sm: 'h-1', md: 'h-2', lg: 'h-3' };

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
          {showPercent && (
            <span className="text-xs font-semibold text-primary">{Math.round(clamped)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-muted overflow-hidden', heights[size])}>
        <div
          className={cn(
            'h-full rounded-full bg-primary transition-all duration-500 ease-out relative overflow-hidden',
          )}
          style={{ width: `${clamped}%` }}
        >
          {/* Shimmer animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  );
}
export default ProgressBar;
