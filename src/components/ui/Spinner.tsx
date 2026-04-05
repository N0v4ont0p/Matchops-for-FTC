import { clsx } from 'clsx'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClass = {
    sm: 'h-3.5 w-3.5 border-[1.5px]',
    md: 'h-5 w-5 border-2',
    lg: 'h-7 w-7 border-2',
  }[size]

  return (
    <span
      className={clsx(
        'inline-block rounded-full border-current border-r-transparent animate-spin',
        sizeClass,
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  )
}
