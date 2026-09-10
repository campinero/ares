import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Stat({
  label,
  value,
  hint,
  tone = 'default',
  icon,
  className,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'alert' | 'good' | 'warn'
  icon?: ReactNode
  className?: string
}) {
  const valueTone =
    tone === 'alert' ? 'text-signal' : tone === 'good' ? 'text-jade' : tone === 'warn' ? 'text-amber' : 'text-ink'
  return (
    <div className={cn('relative flex flex-col gap-0.5 px-3 py-2.5', className)}>
      <div className="flex items-center gap-1.5">
        {icon ? <span className="text-ink-4 [&>svg]:size-3">{icon}</span> : null}
        <span className="text-[10px] font-medium tracking-[0.14em] text-ink-4 uppercase">{label}</span>
      </div>
      <span className={cn('tabular font-mono text-[20px] leading-tight font-semibold', valueTone)}>{value}</span>
      {hint ? <span className="truncate text-[11px] text-ink-4">{hint}</span> : null}
    </div>
  )
}

/** Horizontal 0..1 meter used for confidence and coverage readouts. */
export function Meter({
  value,
  tone = 'cyan',
  className,
  height = 4,
}: {
  value: number
  tone?: 'cyan' | 'jade' | 'amber' | 'signal' | 'violet'
  className?: string
  height?: number
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  const bar =
    tone === 'jade'
      ? 'bg-jade'
      : tone === 'amber'
        ? 'bg-amber'
        : tone === 'signal'
          ? 'bg-signal'
          : tone === 'violet'
            ? 'bg-violet'
            : 'bg-cyan'
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-line', className)}
      style={{ height }}
      role="meter"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', bar)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function ConfidenceBar({ value, label = 'Confidence' }: { value: number; label?: string }) {
  const tone = value >= 0.85 ? 'jade' : value >= 0.6 ? 'cyan' : value >= 0.4 ? 'amber' : 'signal'
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] tracking-[0.1em] text-ink-4 uppercase">{label}</span>
      <Meter value={value} tone={tone} className="max-w-[120px] flex-1" />
      <span className="tabular font-mono text-[11px] text-ink-2">{(value * 100).toFixed(0)}%</span>
    </div>
  )
}

/** Compact labelled divider used inside dense side panels. */
export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="my-2 h-px bg-line" />
  return (
    <div className="my-2 flex items-center gap-2">
      <div className="h-px flex-1 bg-line" />
      <span className="text-[9px] tracking-[0.18em] text-ink-4 uppercase">{label}</span>
      <div className="h-px flex-1 bg-line" />
    </div>
  )
}
