import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { FaSpinner } from 'react-icons/fa';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-black hover:bg-accent-hover active:scale-[0.98]',
        secondary: 'bg-secondary text-foreground hover:bg-zinc-800 border border-border',
        ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted',
        danger: 'bg-destructive text-destructive-foreground hover:bg-red-500 active:scale-[0.98]',
        outline: 'bg-transparent border border-primary text-primary hover:bg-accent-muted active:scale-[0.98]',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-lg',
        md: 'h-10 px-4 text-sm rounded-xl',
        lg: 'h-12 px-6 text-base rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading && <FaSpinner className="animate-spin mr-2" size={14} />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
