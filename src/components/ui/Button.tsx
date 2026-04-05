import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import Spinner from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const variantClass = {
      primary: 'btn-primary',
      ghost: 'btn-ghost',
      outline: 'btn-outline',
      danger: 'btn-danger',
    }[variant]

    const sizeClass = {
      sm: 'h-7 px-2.5 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm',
      lg: 'h-11 px-5 text-base',
    }[size]

    return (
      <button
        ref={ref}
        className={clsx(variantClass, sizeClass, className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
        {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    )
  },
)

Button.displayName = 'Button'
export default Button
