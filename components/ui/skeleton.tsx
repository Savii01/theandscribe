import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'block' | 'circle';
  width?: string;
  height?: string;
  lines?: number;
}

export function Skeleton({ className, variant = 'line', width, height, lines = 1, ...props }: SkeletonProps) {
  if (variant === 'circle') {
    return (
      <div
        className={cn('rounded-full bg-muted animate-pulse', className)}
        style={{ width: width ?? '40px', height: height ?? '40px' }}
        {...props}
      />
    );
  }

  if (variant === 'block') {
    return (
      <div
        className={cn('rounded-xl bg-muted animate-pulse', className)}
        style={{ width: width ?? '100%', height: height ?? '120px' }}
        {...props}
      />
    );
  }

  // Default: line(s)
  if (lines > 1) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded-full bg-muted animate-pulse"
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('h-4 rounded-full bg-muted animate-pulse', className)}
      style={{ width: width ?? '100%', height: height }}
      {...props}
    />
  );
}
export default Skeleton;
