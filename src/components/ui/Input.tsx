import { forwardRef, type InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  wrapperClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, wrapperClassName, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className={clsx('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'input-field',
            error && 'border-status-danger/60 focus:ring-status-danger/40',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-status-danger mt-0.5">{error}</p>}
        {!error && hint && <p className="text-xs text-ink-muted mt-0.5">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
