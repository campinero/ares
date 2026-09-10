import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  Cpu,
  Database,
  FlaskConical,
  HelpCircle,
  Pin,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react'
import { CASE, CASE_META, CASE_SPAN, SUSPICIOUS_EVENTS, evidenceById } from '@/data'
import { deriveHypothesisStatus, useCase } from '@/store/useCase'
import { useForensicsWorker } from '@/hooks/useForensicsWorker'
import { NextActions } from '@/components/shell/NextActions'
import { displayTs, formatDateLong, formatSpan, formatTs } from '@/lib/time'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  Badge,
  Button,
  Divider,
  EmptyState,
  IconButton,
  Meter,
  Panel,
  PanelHeader,
  SEVERITY_TONE,
  SeverityDot,
  Stat,
  TextInput,
} from '@/components/ui'

export function CaseOverview() {
  const navigate = useNavigate()
  const clockBasis = useCase((s) => s.clockBasis)
  const reviewed = useCase((s) => s.reviewed)
  const flagged = useCase((s) => s.flagged)
  const notes = useCase((s) => s.notes)
  const hypotheses = useCase((s) => s.hypotheses)
  const addNote = useCase((s) => s.addNote)
  const removeNote = useCase((s) => s.removeNote)
  const togglePinNote = useCase((s) => s.togglePinNote)
  const selectEvent = useCase((s) => s.selectEvent)
  const selectEvidence = useCase((s) => s.selectEvidence)

  const worker = useForensicsWorker()
  const [draft, setDraft] = useState('')

  const reviewedCount = Object.values(reviewed).filter(Boolean).length
  const flaggedCount = Object.values(flagged).filter(Boolean).length
  const coverage = CASE.evidence.length ? reviewedCount / CASE.evidence.length : 0

  const criticalArtifacts = useMemo(
    () => CASE.evidence.filter((e) => e.significance === 'critical').length,
    [],
  )

  const hypothesisStatus = useMemo(() => {
    const counts = { supported: 0, refuted: 0, unresolved: 0, open: 0 }
    for (const h of hypotheses) counts[deriveHypothesisStatus(h)] += 1
    return counts
  }, [hypotheses])

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at - a.at),
    [notes],
  )

  const topEvents = useMemo(
    () => [...SUSPICIOUS_EVENTS].sort((a, b) => b.at - a.at).slice(0, 9),
    [],
  )

  const mismatches = worker.results.filter((r) => !r.match).length

  useEffect(() => {
    document.title = `ARES - ${CASE_META.id} ${CASE_META.codename}`
  }, [])

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(300px,352px)] gap-2">
      <div className="flex min-h-0 flex-col gap-2 overflow-auto pr-0.5">
        <Panel lit scan className="shrink-0">
          <div className="relative px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="tabular font-mono text-[22px] tracking-[0.08em] text-ink">{CASE_META.id}</span>
              <span className="text-[15px] tracking-[0.24em] text-amber uppercase">{CASE_META.codename}</span>
              <Badge tone="signal">{CASE_META.status}</Badge>
              <Badge>{CASE_META.classification}</Badge>
            </div>
            <p className="mt-1 max-w-[110ch] text-[12px] leading-relaxed text-ink-2">{CASE_META.synopsis}</p>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-ink-4">
              <span>
                Opened <span className="text-ink-3">{formatDateLong(CASE_META.opened)}</span>
              </span>
              <span>
                Lead <span className="text-ink-3">{CASE_META.lead}</span>
              </span>
              <span>
                Examiner <span className="text-ink-3">{CASE_META.examiner}</span>
              </span>
              <span>
                Timezone <span className="text-ink-3">{CASE_META.timezone}</span>
              </span>
            </div>
          </div>
        </Panel>

        <div className="grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-4">
          <Panel>
            <Stat
              label="Artifacts"
              value={formatNumber(CASE.evidence.length)}
              hint={`${criticalArtifacts} critical`}
              icon={<Database />}
            />
          </Panel>
          <Panel>
            <Stat
              label="Flagged events"
              value={formatNumber(SUSPICIOUS_EVENTS.length)}
              hint={`of ${CASE.events.length} total`}
              tone="alert"
              icon={<AlertTriangle />}
            />
          </Panel>
          <Panel>
            <Stat
              label="Devices"
              value={formatNumber(CASE.devices.length)}
              hint={`${CASE.devices.filter((d) => d.imaged).length} imaged`}
              icon={<Cpu />}
            />
          </Panel>
          <Panel>
            <Stat
              label="Persons"
              value={formatNumber(CASE.persons.length)}
              hint={`${CASE.accounts.length} accounts`}
              icon={<Users />}
            />
          </Panel>
        </div>

        <div className="grid shrink-0 gap-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Panel>
            <PanelHeader title="System status" icon={<Activity />} readout={worker.running ? 'SWEEP RUNNING' : 'IDLE'} />
            <div className="flex flex-col gap-2 p-3">
              <SystemLine
                label="Evidence index"
                value={`${CASE.evidence.length} objects resident`}
                state="ok"
                progress={1}
              />
              <SystemLine
                label="Digest engine"
                value={
                  worker.running
                    ? `hashing ${worker.current} - ${worker.done}/${worker.total}`
                    : worker.results.length > 0
                      ? `${worker.results.length} verified in ${worker.elapsedMs} ms`
                      : 'idle - no sweep run this session'
                }
                state={worker.running ? 'busy' : mismatches > 0 ? 'alert' : worker.results.length ? 'ok' : 'idle'}
                progress={worker.total > 0 ? worker.done / worker.total : 0}
              />
              <SystemLine
                label="Clock normalisation"
                value={
                  clockBasis === 'host'
                    ? 'host basis - displayed times carry the +192 s workstation drift'
                    : 'normalised basis - host records offset to NTP'
                }
                state={clockBasis === 'host' ? 'warn' : 'ok'}
                progress={1}
              />
              <SystemLine
                label="Link chart"
                value={`${CASE.entities.length} entities, ${CASE.relations.length} evidenced relations`}
                state="ok"
                progress={1}
              />
              <SystemLine
                label="Case persistence"
                value={`${notes.length} notes, ${hypotheses.length} hypotheses, ${CASE.custody.length} custody entries`}
                state="ok"
                progress={1}
              />

              <div className="mt-1 flex items-center gap-2">
                <Button tone="primary" onClick={worker.verifyAll} disabled={worker.running}>
                  <ShieldCheck />
                  {worker.running ? 'Sweeping' : 'Run integrity sweep'}
                </Button>
                {worker.results.length > 0 ? (
                  <span className={cn('text-[11px]', mismatches > 0 ? 'text-signal' : 'text-jade')}>
                    {mismatches > 0
                      ? `${mismatches} digest mismatch`
                      : `all ${worker.results.length} digests match the case file`}
                  </span>
                ) : null}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Case progress" icon={<FlaskConical />} />
            <div className="flex flex-col gap-3 p-3">
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-ink-3">Artifacts reviewed</span>
                  <span className="tabular font-mono text-[12px] text-ink-2">
                    {reviewedCount} / {CASE.evidence.length}
                  </span>
                </div>
                <Meter value={coverage} className="mt-1" height={5} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <MiniStat label="Flagged by you" value={String(flaggedCount)} />
                <MiniStat label="Timeline span" value={formatSpan(CASE_SPAN.end - CASE_SPAN.start)} />
                <MiniStat label="Open questions" value={String(CASE_META.unresolvedQuestions.length)} />
                <MiniStat label="Hypotheses" value={String(hypotheses.length)} />
              </div>

              <Divider label="Hypothesis standing" />
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="jade">supported {hypothesisStatus.supported}</Badge>
                <Badge tone="signal">refuted {hypothesisStatus.refuted}</Badge>
                <Badge tone="amber">unresolved {hypothesisStatus.unresolved}</Badge>
                <Badge>open {hypothesisStatus.open}</Badge>
              </div>
              <Button onClick={() => navigate('/hypotheses')}>Open hypothesis workbench</Button>
            </div>
          </Panel>
        </div>

        <NextActions />

        <div className="grid gap-2 lg:grid-cols-2">
          <Panel className="min-h-[240px]">
            <PanelHeader title="Investigation mandate" readout={`${CASE_META.mandate.length} objectives`} />
            <ol className="flex flex-col p-3 pt-2">
              {CASE_META.mandate.map((item, index) => (
                <li key={item} className="flex gap-2.5 border-b border-line/50 py-1.5 last:border-0">
                  <span className="tabular mt-[1px] font-mono text-[11px] text-cyan">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[12px] leading-relaxed text-ink-2">{item}</span>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel className="min-h-[240px]">
            <PanelHeader
              title="Unresolved questions"
              icon={<HelpCircle />}
              readout={`${CASE_META.unresolvedQuestions.length} open`}
            />
            <ul className="flex flex-col p-3 pt-2">
              {CASE_META.unresolvedQuestions.map((item) => (
                <li key={item} className="flex gap-2.5 border-b border-line/50 py-1.5 last:border-0">
                  <span className="mt-[6px] size-[5px] shrink-0 rounded-full bg-amber" />
                  <span className="text-[12px] leading-relaxed text-ink-2">{item}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel className="min-h-[200px]">
          <PanelHeader
            title="Most recent flagged activity"
            readout={`${SUSPICIOUS_EVENTS.length} flagged`}
            actions={<Button onClick={() => navigate('/timeline')}>Open timeline</Button>}
          />
          <div className="flex flex-col">
            {topEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => {
                  selectEvent(event.id)
                  navigate('/timeline')
                }}
                className="flex items-center gap-3 border-b border-line/50 px-3 py-1.5 text-left transition-colors last:border-0 hover:bg-panel-2"
              >
                <SeverityDot severity={event.severity} />
                <span className="tabular w-[132px] shrink-0 font-mono text-[11px] text-ink-3">
                  {formatTs(displayTs(event.at, clockBasis, event.hostClock))}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{event.title}</span>
                <Badge tone={SEVERITY_TONE[event.severity]}>{event.severity}</Badge>
                <span className="hidden w-[190px] shrink-0 truncate text-[10px] text-ink-4 xl:block">
                  {event.source}
                </span>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      {/* --------------------------------------------------------- notes rail */}
      <Panel className="min-h-0">
        <PanelHeader title="Investigator notes" readout={`${notes.length} entries`} />

        <div className="shrink-0 border-b border-line bg-abyss/40 p-2">
          <TextInput
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) {
                addNote(draft.trim())
                setDraft('')
              }
            }}
            placeholder="Add a note, press Enter"
            className="w-full"
            aria-label="New examiner note"
          />
          <div className="mt-1.5 flex items-center gap-1.5">
            <Button
              tone="primary"
              disabled={!draft.trim()}
              onClick={() => {
                if (!draft.trim()) return
                addNote(draft.trim())
                setDraft('')
              }}
            >
              Add note
            </Button>
            <span className="text-[10px] text-ink-4">Notes persist to this browser</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {sortedNotes.length === 0 ? (
            <EmptyState title="No notes yet" hint="Working notes you add here are saved with the case file." />
          ) : (
            sortedNotes.map((note) => (
              <motion.article
                key={note.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                className={cn('border-b border-line/60 px-3 py-2', note.pinned && 'bg-cyan/[0.04]')}
              >
                <div className="flex items-center gap-2">
                  <span className="tabular font-mono text-[10px] text-ink-4">{formatTs(note.at)}</span>
                  {note.pinned ? <Badge tone="cyan">pinned</Badge> : null}
                  <div className="flex-1" />
                  <IconButton
                    label={note.pinned ? 'Unpin note' : 'Pin note'}
                    active={note.pinned}
                    onClick={() => togglePinNote(note.id)}
                  >
                    <Pin />
                  </IconButton>
                  <IconButton label="Delete note" onClick={() => removeNote(note.id)}>
                    <Trash2 />
                  </IconButton>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{note.body}</p>
                {note.evidenceIds.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {note.evidenceIds.map((id) => (
                      <button key={id} type="button" onClick={() => selectEvidence(id)} title={evidenceById.get(id)?.label}>
                        <Badge tone="neutral">{id}</Badge>
                      </button>
                    ))}
                  </div>
                ) : null}
                <p className="mt-1 text-[10px] text-ink-4">{note.author}</p>
              </motion.article>
            ))
          )}
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------ pieces */

function SystemLine({
  label,
  value,
  state,
  progress,
}: {
  label: string
  value: string
  state: 'ok' | 'busy' | 'warn' | 'alert' | 'idle'
  progress: number
}) {
  const tone =
    state === 'alert'
      ? 'signal'
      : state === 'warn'
        ? 'amber'
        : state === 'busy'
          ? 'cyan'
          : state === 'idle'
            ? 'violet'
            : 'jade'
  const dot =
    state === 'alert'
      ? 'bg-signal'
      : state === 'warn'
        ? 'bg-amber'
        : state === 'busy'
          ? 'bg-cyan'
          : state === 'idle'
            ? 'bg-ink-4'
            : 'bg-jade'

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn('size-[6px] shrink-0 rounded-full', dot)}
        style={state === 'busy' ? { animation: 'ares-blink 1s ease-in-out infinite' } : undefined}
      />
      <span className="w-[132px] shrink-0 text-[10px] font-semibold tracking-[0.12em] text-ink-4 uppercase">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] text-ink-2">{value}</span>
      <Meter value={progress} tone={tone} className="w-16 shrink-0" height={3} />
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[2px] border border-line bg-panel-2/60 px-2.5 py-1.5">
      <p className="text-[9px] tracking-[0.14em] text-ink-4 uppercase">{label}</p>
      <p className="tabular font-mono text-[13px] text-ink">{value}</p>
    </div>
  )
}
