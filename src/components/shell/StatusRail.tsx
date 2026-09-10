import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, Database, FlaskConical, Users } from 'lucide-react'
import { CASE, SUSPICIOUS_EVENTS } from '@/data'
import { useCase } from '@/store/useCase'
import { formatClock, formatSpan } from '@/lib/time'
import { cn } from '@/lib/cn'

/**
 * Bottom rail. Everything here is derived from the case file rather than
 * decorative: counts move when the analyst works, and the session clock is the
 * only wall-clock value anywhere in the application.
 */
export function StatusRail() {
  const [elapsed, setElapsed] = useState(0)
  const reviewed = useCase((s) => s.reviewed)
  const hypotheses = useCase((s) => s.hypotheses)
  const notes = useCase((s) => s.notes)
  const clockBasis = useCase((s) => s.clockBasis)

  useEffect(() => {
    const started = Date.now()
    const handle = window.setInterval(() => setElapsed(Date.now() - started), 1000)
    return () => window.clearInterval(handle)
  }, [])

  const reviewedCount = Object.values(reviewed).filter(Boolean).length
  const coverage = CASE.evidence.length ? reviewedCount / CASE.evidence.length : 0

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-line bg-abyss/80 px-3 text-[10px] tracking-[0.08em] text-ink-4 uppercase">
      <Item icon={<Database />} label="Artifacts" value={`${CASE.evidence.length}`} />
      <Item
        icon={<AlertTriangle />}
        label="Flagged events"
        value={`${SUSPICIOUS_EVENTS.length}`}
        tone={SUSPICIOUS_EVENTS.length > 0 ? 'alert' : undefined}
      />
      <Item icon={<Users />} label="Persons" value={`${CASE.persons.length}`} />
      <Item icon={<FlaskConical />} label="Hypotheses" value={`${hypotheses.length}`} />
      <Item label="Notes" value={`${notes.length}`} />
      <div className="hidden items-center gap-2 lg:flex">
        <span>Review coverage</span>
        <span className="tabular font-mono text-ink-2">{Math.round(coverage * 100)}%</span>
        <div className="h-[3px] w-20 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-cyan transition-[width] duration-500" style={{ width: `${coverage * 100}%` }} />
        </div>
      </div>

      <div className="flex-1" />

      <span className={cn('hidden md:inline', clockBasis === 'host' && 'text-amber')}>
        Clock: {clockBasis === 'host' ? 'host (+192s)' : 'normalised'}
      </span>
      <Item icon={<Clock />} label="Session" value={formatSpan(elapsed)} />
      <span className="tabular hidden font-mono text-ink-3 sm:inline">
        {formatClock(CASE.meta.opened)} case opened
      </span>
    </footer>
  )
}

function Item({
  icon,
  label,
  value,
  tone,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  tone?: 'alert'
}) {
  return (
    <span className="flex items-center gap-1.5">
      {icon ? <span className="text-ink-4 [&>svg]:size-3">{icon}</span> : null}
      <span>{label}</span>
      <span className={cn('tabular font-mono', tone === 'alert' ? 'text-signal' : 'text-ink-2')}>{value}</span>
    </span>
  )
}
