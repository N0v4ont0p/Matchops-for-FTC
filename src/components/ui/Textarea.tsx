import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  wrapperClassName?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, wrapperClassName, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className={clsx('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={clsx(
            'input-field resize-none',
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

Textarea.displayName = 'Textarea'
export default Textarea
