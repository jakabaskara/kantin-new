import type * as React from 'react';

import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'rounded-xl border border-slate-200/80 bg-card text-card-foreground shadow-sm shadow-slate-200/60',
                className,
            )}
            data-slot="card"
            {...props}
        />
    );
}

function CardHeader({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex flex-col gap-1.5 p-6', className)}
            data-slot="card-header"
            {...props}
        />
    );
}

function CardTitle({
    className,
    ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={cn('text-lg font-semibold leading-none', className)}
            data-slot="card-title"
            {...props}
        />
    );
}

function CardDescription({
    className,
    ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p
            className={cn('text-sm text-muted-foreground', className)}
            data-slot="card-description"
            {...props}
        />
    );
}

function CardContent({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('p-6 pt-0', className)}
            data-slot="card-content"
            {...props}
        />
    );
}

function CardFooter({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex items-center p-6 pt-0', className)}
            data-slot="card-footer"
            {...props}
        />
    );
}

export {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
};
