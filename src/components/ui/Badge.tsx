import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { EvidenceStatus, Severity, Significance } from '@/data/types'

export type Tone = 'neutral' | 'cyan' | 'azure' | 'jade' | 'amber' | 'signal' | 'violet'

const TONE: Record<Tone, string> = {
  neutral: 'border-line-2 bg-panel-3 text-ink-3',
  cyan: 'border-cyan/30 bg-cyan/10 text-cyan',
  azure: 'border-azure/30 bg-azure/10 text-azure',
  jade: 'border-jade/30 bg-jade/10 text-jade',
  amber: 'border-amber/30 bg-amber/10 text-amber',
  signal: 'border-signal/35 bg-signal/12 text-signal',
  violet: 'border-violet/30 bg-violet/10 text-violet',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
  title,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
  title?: string
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-[1px] text-[10px] font-medium tracking-[0.08em] uppercase',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export const SEVERITY_TONE: Record<Severity, Tone> = {
  critical: 'signal',
  warning: 'amber',
  notice: 'cyan',
  info: 'neutral',
}

export const SIGNIFICANCE_TONE: Record<Significance, Tone> = {
  critical: 'signal',
  high: 'amber',
  moderate: 'cyan',
  low: 'azure',
  noise: 'neutral',
}

export const STATUS_TONE: Record<EvidenceStatus, Tone> = {
  verified: 'jade',
  analyzed: 'cyan',
  pending: 'amber',
  contested: 'violet',
  excluded: 'neutral',
}

export function SeverityDot({ severity, className }: { severity: Severity; className?: string }) {
  const color =
    severity === 'critical'
      ? 'bg-signal'
      : severity === 'warning'
        ? 'bg-amber'
        : severity === 'notice'
          ? 'bg-cyan'
          : 'bg-ink-4'
  return (
    <span
      title={severity}
      className={cn('inline-block size-[6px] shrink-0 rounded-full', color, className)}
      aria-label={severity}
    />
  )
}

export function SignificanceTag({ value }: { value: Significance }) {
  return <Badge tone={SIGNIFICANCE_TONE[value]}>{value}</Badge>
}

export function StatusPill({ value }: { value: EvidenceStatus }) {
  return <Badge tone={STATUS_TONE[value]}>{value}</Badge>
}
