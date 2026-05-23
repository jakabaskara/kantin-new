import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
    {
        variants: {
            variant: {
                default:
                    'border-transparent bg-primary text-primary-foreground',
                secondary:
                    'border-transparent bg-secondary text-secondary-foreground',
                destructive:
                    'border-transparent bg-destructive text-destructive-foreground',
                outline: 'text-foreground',
                success:
                    'border-green-200 bg-green-50 text-green-950 dark:border-green-800 dark:bg-green-950 dark:text-green-50',
                warning:
                    'border-yellow-200 bg-yellow-50 text-yellow-950 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-50',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

function Badge({
    className,
    variant,
    ...props
}: React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof badgeVariants>) {
    return (
        <div
            className={cn(badgeVariants({ variant }), className)}
            data-slot="badge"
            {...props}
        />
    );
}

export { Badge, badgeVariants };
