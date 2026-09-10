import { type ReactNode, useCallback, useState } from 'react'
import { Check, Copy, Inbox } from 'lucide-react'
import { cn } from '@/lib/cn'
import { groupHash } from '@/lib/format'

export function EmptyState({
  title,
  hint,
  icon,
  action,
}: {
  title: string
  hint?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <span className="text-ink-4/60 [&>svg]:size-6">{icon ?? <Inbox />}</span>
      <p className="text-[12px] text-ink-3">{title}</p>
      {hint ? <p className="max-w-[42ch] text-[11px] text-ink-4">{hint}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    void navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1200)
      })
      .catch(() => setCopied(false))
  }, [value])

  return (
    <button
      type="button"
      onClick={copy}
      title={label}
      aria-label={label}
      className="inline-flex size-5 items-center justify-center rounded-[2px] border border-line bg-panel-2 text-ink-4 transition-colors hover:border-line-3 hover:text-cyan [&>svg]:size-3"
    >
      {copied ? <Check className="text-jade" /> : <Copy />}
    </button>
  )
}

/** Monospace digest with grouping and a copy affordance. */
export function HashText({ value, grouped = true, className }: { value: string; grouped?: boolean; className?: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <code className={cn('tabular min-w-0 font-mono text-[11px] break-all text-ink-2', className)}>
        {grouped ? groupHash(value) : value}
      </code>
      <CopyButton value={value} label="Copy digest" />
    </span>
  )
}

export function KeyHint({ combo }: { combo: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {combo.split('+').map((k) => (
        <kbd
          key={k}
          className="rounded-[2px] border border-line-2 bg-panel-3 px-1 py-[1px] font-mono text-[9px] text-ink-3"
        >
          {k}
        </kbd>
      ))}
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[2px] bg-line/70', className)} />
}

/** Thin animated activity bar used while the worker hashes the case file. */
export function ProgressSweep({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div className="relative h-[2px] w-full overflow-hidden bg-line/60">
      <div
        className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-cyan to-transparent"
        style={{ animation: 'ares-sweep 1.1s linear infinite' }}
      />
    </div>
  )
}
