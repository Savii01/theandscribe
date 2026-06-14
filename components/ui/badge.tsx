import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20',
  {
    variants: {
      variant: {
        default: 'bg-primary text-black border-transparent',
        secondary: 'bg-secondary text-foreground border-border hover:bg-zinc-800',
        outline: 'text-foreground border-border bg-transparent',
        
        // Status badges
        pending: 'bg-zinc-900 text-zinc-400 border-zinc-800',
        processing: 'bg-yellow-500/10 text-primary border-primary/20 animate-pulse',
        completed: 'bg-green-500/10 text-green-400 border-green-500/20',
        failed: 'bg-red-500/10 text-red-400 border-red-500/20',
        
        // Source type badges
        upload: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
        youtube: 'bg-red-500/10 text-red-500 border-red-500/25',
        url: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
export default Badge;
