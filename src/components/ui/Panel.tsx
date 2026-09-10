import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PanelProps {
  children: ReactNode
  className?: string
  /** Adds the faint top illumination used on primary surfaces. */
  lit?: boolean
  scan?: boolean
}

export function Panel({ children, className, lit = false, scan = false }: PanelProps) {
  return (
    <section
      className={cn(
        'relative flex min-h-0 flex-col overflow-hidden rounded-[3px] border border-line bg-panel/80 backdrop-blur-[2px]',
        lit && 'panel-sheen',
        scan && 'ares-scanlines',
        className,
      )}
    >
      {children}
    </section>
  )
}

interface PanelHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
  className?: string
  /** Small right-aligned monospace readout, e.g. a record count. */
  readout?: string
}

export function PanelHeader({ title, subtitle, icon, actions, readout, className }: PanelHeaderProps) {
  return (
    <header
      className={cn(
        'flex shrink-0 items-center gap-3 border-b border-line bg-panel-2/60 px-3 py-2',
        className,
      )}
    >
      {icon ? <span className="text-cyan/80 [&>svg]:size-3.5">{icon}</span> : null}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[11px] font-semibold tracking-[0.14em] text-ink-2 uppercase">{title}</h2>
        {subtitle ? <p className="truncate text-[11px] text-ink-4">{subtitle}</p> : null}
      </div>
      {readout ? <span className="tabular shrink-0 font-mono text-[10px] text-ink-4">{readout}</span> : null}
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </header>
  )
}

export function PanelBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('min-h-0 flex-1 overflow-auto', className)}>{children}</div>
}

export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-abyss/40 px-3 py-2',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-3 pt-3 pb-1 text-[10px] font-semibold tracking-[0.16em] text-ink-4 uppercase', className)}>
      {children}
    </div>
  )
}

/** Two column key/value readout used across inspectors. */
export function FieldRow({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(96px,34%)_1fr] gap-3 border-b border-line/60 px-3 py-1.5 last:border-0">
      <dt className="truncate text-[11px] text-ink-4">{label}</dt>
      <dd className={cn('min-w-0 break-words text-[12px] text-ink-2', mono && 'tabular font-mono text-[11px]')}>
        {value}
      </dd>
    </div>
  )
}
