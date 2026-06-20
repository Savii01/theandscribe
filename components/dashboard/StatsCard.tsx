import React from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  progress?: number; // 0-100
  className?: string;
  accent?: boolean;
}

export function StatsCard({ label, value, icon, description, progress, className, accent }: StatsCardProps) {
  return (
    <div className={cn(
      'bg-card border border-border rounded-2xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5',
      accent && 'border-primary/20 bg-primary/5',
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0',
          accent ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          {icon}
        </div>
      </div>
      <p className={cn('text-3xl font-heading font-bold tracking-tighter', accent ? 'text-primary' : 'text-foreground')}>
        {value}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
export default StatsCard;
