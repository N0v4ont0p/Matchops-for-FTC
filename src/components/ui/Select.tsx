import { forwardRef, type SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  wrapperClassName?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, wrapperClassName, className, options, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className={clsx('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={clsx(
            'input-field appearance-none cursor-pointer',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-3 text-ink">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-status-danger mt-0.5">{error}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'
export default Select
