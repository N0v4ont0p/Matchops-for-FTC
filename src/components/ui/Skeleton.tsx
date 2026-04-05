import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'rounded bg-surface-3 shimmer',
        className,
      )}
    />
  )
}

export function SkeletonLines({ lines = 3, className }: SkeletonProps) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('card p-4 space-y-3', className)}>
      <Skeleton className="h-5 w-2/5" />
      <SkeletonLines lines={3} />
    </div>
  )
}
