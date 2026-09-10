import type { InputHTMLAttributes, ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className,
  autoFocus,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="pointer-events-none absolute left-2 size-3.5 text-ink-4" />
      <input
        value={value}
        autoFocus={autoFocus}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-7 w-full rounded-[2px] border border-line bg-abyss/80 pr-7 pl-7 text-[12px] text-ink placeholder:text-ink-4 focus:border-cyan/50 focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-1.5 text-ink-4 hover:text-ink-2"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      spellCheck={false}
      {...props}
      className={cn(
        'h-7 rounded-[2px] border border-line bg-abyss/80 px-2 text-[12px] text-ink placeholder:text-ink-4 focus:border-cyan/50 focus:outline-none',
        className,
      )}
    />
  )
}

export function FilterChip({
  active,
  onClick,
  children,
  count,
  tone,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  count?: number
  tone?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-[2px] border px-1.5 py-[2px] text-[10px] tracking-[0.08em] uppercase transition-colors',
        active
          ? 'border-cyan/45 bg-cyan/12 text-cyan'
          : 'border-line bg-panel-2 text-ink-4 hover:border-line-3 hover:text-ink-2',
      )}
    >
      {tone ? <span className="size-[6px] rounded-full" style={{ background: tone }} /> : null}
      {children}
      {count !== undefined ? <span className="tabular font-mono text-[10px] opacity-70">{count}</span> : null}
    </button>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center gap-2.5 px-1 py-1 text-left"
    >
      <span
        className={cn(
          'relative h-[14px] w-[26px] shrink-0 rounded-full border transition-colors',
          checked ? 'border-cyan/50 bg-cyan/25' : 'border-line-2 bg-panel-3',
        )}
      >
        <span
          className={cn(
            'absolute top-[1px] size-[10px] rounded-full transition-all',
            checked ? 'left-[13px] bg-cyan' : 'left-[1px] bg-ink-4',
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] text-ink-2">{label}</span>
        {hint ? <span className="block truncate text-[10px] text-ink-4">{hint}</span> : null}
      </span>
    </button>
  )
}

export function IconButton({
  label,
  onClick,
  children,
  active,
  disabled,
  className,
}: {
  label: string
  onClick?: () => void
  children: ReactNode
  active?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex size-6 items-center justify-center rounded-[2px] border transition-colors [&>svg]:size-3.5',
        disabled
          ? 'cursor-not-allowed border-line bg-panel-2 text-ink-4/40'
          : active
            ? 'border-cyan/45 bg-cyan/12 text-cyan'
            : 'border-line bg-panel-2 text-ink-3 hover:border-line-3 hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Button({
  children,
  onClick,
  tone = 'default',
  disabled,
  className,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  tone?: 'default' | 'primary' | 'danger'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-[2px] border px-2.5 text-[11px] font-medium tracking-[0.06em] uppercase transition-colors [&>svg]:size-3.5',
        disabled && 'cursor-not-allowed opacity-40',
        tone === 'primary'
          ? 'border-cyan/45 bg-cyan/15 text-cyan hover:bg-cyan/25'
          : tone === 'danger'
            ? 'border-signal/40 bg-signal/12 text-signal hover:bg-signal/20'
            : 'border-line-2 bg-panel-2 text-ink-2 hover:border-line-3 hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}
