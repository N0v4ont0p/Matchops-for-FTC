import { clsx } from 'clsx'

type BadgeVariant = 'accent' | 'red' | 'blue' | 'success' | 'warning' | 'danger' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export default function Badge({ children, variant = 'muted', className }: BadgeProps) {
  const variantClass: Record<BadgeVariant, string> = {
    accent: 'badge-accent',
    red: 'badge-red',
    blue: 'badge-blue',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge bg-status-danger-dim text-status-danger border border-status-danger/20',
    muted: 'badge-muted',
  }

  return (
    <span className={clsx(variantClass[variant], className)}>
      {children}
    </span>
  )
}
