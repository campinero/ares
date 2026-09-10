import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crosshair, Maximize, Minus, Plus, Target } from 'lucide-react'
import { TimelineCanvas } from '@/components/timeline/TimelineCanvas'
import { DensityStrip } from '@/components/timeline/DensityStrip'
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  CATEGORY_TONE,
  clampView,
  centerOn,
  spanLabel,
  zoomAt,
  type Viewport,
} from '@/components/timeline/scale'
import { CASE, CASE_WINDOW, deviceById, evidenceById, personById } from '@/data'
import type { EventCategory, Severity } from '@/data/types'
import { useCase } from '@/store/useCase'
import { displayTs, formatTs } from '@/lib/time'
import { cn } from '@/lib/cn'
import {
  Badge,
  Button,
  ConfidenceBar,
  EmptyState,
  FieldRow,
  FilterChip,
  IconButton,
  Panel,
  PanelHeader,
  SEVERITY_TONE,
  SearchInput,
  SeverityDot,
  Toolbar,
} from '@/components/ui'

const SEVERITIES: Severity[] = ['critical', 'warning', 'notice', 'info']

const FULL: Viewport = { start: CASE_WINDOW.start, end: CASE_WINDOW.end }
const INCIDENT: Viewport = {
  start: CASE_WINDOW.incidentStart - 6 * 60_000,
  end: CASE_WINDOW.incidentEnd + 8 * 60_000,
}

export function Timeline() {
  const clockBasis = useCase((s) => s.clockBasis)
  const investigationMode = useCase((s) => s.investigationMode)
  const selectedEventId = useCase((s) => s.selectedEventId)
  const selectEvent = useCase((s) => s.selectEvent)
  const selectEvidence = useCase((s) => s.selectEvidence)
  const selectedEvidenceId = useCase((s) => s.selectedEvidenceId)
  const navigate = useNavigate()

  const [view, setView] = useState<Viewport>(INCIDENT)
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<Set<EventCategory>>(new Set())
  const [severities, setSeverities] = useState<Set<Severity>>(new Set())
  const [suspiciousOnly, setSuspiciousOnly] = useState(false)

  const setViewClamped = useCallback((next: Viewport) => setView(clampView(next, FULL)), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CASE.events.filter((event) => {
      if (suspiciousOnly && !event.suspicious) return false
      if (categories.size > 0 && !categories.has(event.category)) return false
      if (severities.size > 0 && !severities.has(event.severity)) return false
      if (investigationMode && event.severity === 'info' && !event.suspicious) return false
      if (!q) return true
      return `${event.title} ${event.summary} ${event.source}`.toLowerCase().includes(q)
    })
  }, [query, categories, severities, suspiciousOnly, investigationMode])

  const hidden = CASE.events.length - filtered.length
  const lanes = useMemo(
    () => CATEGORY_ORDER.filter((c) => filtered.some((e) => e.category === c)),
    [filtered],
  )

  const inView = useMemo(
    () => filtered.filter((e) => e.at >= view.start && e.at <= view.end).sort((a, b) => a.at - b.at),
    [filtered, view],
  )

  const listRef = useRef<HTMLDivElement>(null)

  const selected = selectedEventId ? CASE.events.find((e) => e.id === selectedEventId) ?? null : null

  // A selection arriving from elsewhere (palette, reconstruction) brings the
  // event into view rather than leaving the investigator to hunt for it.
  useEffect(() => {
    if (!selected) return
    if (selected.at >= view.start && selected.at <= view.end) return
    setView(centerOn(view, selected.at, FULL, 45 * 60_000))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId])

  // Keep the list and the canvas pointing at the same record.
  useEffect(() => {
    if (!selectedEventId) return
    const node = listRef.current?.querySelector<HTMLElement>(`[data-event="${selectedEventId}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [selectedEventId, inView])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.isContentEditable)) return
      if (event.key === 'f') {
        event.preventDefault()
        setView(FULL)
        return
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      const ordered = [...filtered].sort((a, b) => a.at - b.at)
      if (ordered.length === 0) return
      const index = ordered.findIndex((e) => e.id === selectedEventId)
      const nextIndex =
        event.key === 'ArrowRight'
          ? Math.min(ordered.length - 1, index < 0 ? 0 : index + 1)
          : Math.max(0, index < 0 ? 0 : index - 1)
      selectEvent(ordered[nextIndex].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtered, selectedEventId, selectEvent])

  function toggle<T>(set: Set<T>, value: T, apply: (next: Set<T>) => void) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    apply(next)
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(300px,346px)] gap-2">
      <Panel className="min-h-0" lit>
        <PanelHeader
          title="Master timeline"
          subtitle={`${formatTs(view.start)} to ${formatTs(view.end)}`}
          readout={`${spanLabel(view.end - view.start)} visible`}
          actions={
            <>
              <IconButton label="Zoom out" onClick={() => setViewClamped(zoomAt(view, 1.6, 0.5, FULL))}>
                <Minus />
              </IconButton>
              <IconButton label="Zoom in" onClick={() => setViewClamped(zoomAt(view, 1 / 1.6, 0.5, FULL))}>
                <Plus />
              </IconButton>
              <IconButton label="Fit whole case" onClick={() => setView(FULL)}>
                <Maximize />
              </IconButton>
              <IconButton label="Jump to incident window" onClick={() => setView(INCIDENT)}>
                <Target />
              </IconButton>
            </>
          }
        />

        <Toolbar>
          <SearchInput value={query} onChange={setQuery} placeholder="Search events" className="w-56" />
          <FilterChip active={suspiciousOnly} onClick={() => setSuspiciousOnly((v) => !v)}>
            Suspicious only
          </FilterChip>
          <div className="mx-1 h-5 w-px bg-line" />
          {SEVERITIES.map((severity) => (
            <FilterChip
              key={severity}
              active={severities.has(severity)}
              onClick={() => toggle(severities, severity, setSeverities)}
              count={filtered.filter((e) => e.severity === severity).length}
            >
              {severity}
            </FilterChip>
          ))}
          <div className="flex-1" />
          <span className="tabular font-mono text-[10px] text-ink-4">
            {filtered.length} shown{hidden > 0 ? ` / ${hidden} hidden` : ''}
          </span>
        </Toolbar>

        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-line bg-abyss/30 px-3 py-1.5">
          {CATEGORY_ORDER.map((category) => {
            const count = CASE.events.filter((e) => e.category === category).length
            if (count === 0) return null
            return (
              <FilterChip
                key={category}
                active={categories.has(category)}
                onClick={() => toggle(categories, category, setCategories)}
                count={count}
                tone={CATEGORY_TONE[category]}
              >
                {CATEGORY_LABEL[category]}
              </FilterChip>
            )
          })}
          {categories.size > 0 ? (
            <button
              type="button"
              onClick={() => setCategories(new Set())}
              className="ml-1 text-[10px] tracking-[0.08em] text-ink-4 uppercase hover:text-cyan"
            >
              clear
            </button>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No events match the current filter"
            hint="Widen the category or severity filter, or clear the search, to bring events back into the view."
            action={
              <Button
                onClick={() => {
                  setQuery('')
                  setCategories(new Set())
                  setSeverities(new Set())
                  setSuspiciousOnly(false)
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <TimelineCanvas
            events={filtered}
            lanes={lanes}
            view={view}
            limit={FULL}
            incident={INCIDENT}
            clockBasis={clockBasis}
            investigationMode={investigationMode}
            selectedId={selectedEventId}
            evidenceId={selectedEvidenceId}
            onView={setViewClamped}
            onSelect={selectEvent}
          />
        )}
        <DensityStrip events={CASE.events} limit={FULL} view={view} onView={setViewClamped} />
      </Panel>

      <div className="flex min-h-0 flex-col gap-2">
      <Panel className="min-h-0 flex-[0_0_46%]">
        <PanelHeader
          title="Events in view"
          readout={`${inView.length} of ${filtered.length}`}
        />
        <div ref={listRef} className="min-h-0 flex-1 overflow-auto">
          {inView.length === 0 ? (
            <EmptyState title="No event in this window" hint="Pan or zoom out to bring events into view." />
          ) : (
            inView.map((event) => (
              <button
                key={event.id}
                type="button"
                data-event={event.id}
                onClick={() => selectEvent(event.id)}
                className={cn(
                  'relative flex w-full items-start gap-2 border-b border-line/50 px-3 py-1.5 text-left transition-colors',
                  event.id === selectedEventId ? 'bg-cyan/12' : 'hover:bg-panel-2',
                )}
              >
                {event.id === selectedEventId ? <span className="absolute inset-y-0 left-0 w-[2px] bg-cyan" /> : null}
                <SeverityDot severity={event.severity} className="mt-[5px]" />
                <span className="tabular mt-[1px] w-[62px] shrink-0 font-mono text-[11px] text-cyan">
                  {formatTs(displayTs(event.at, clockBasis, event.hostClock)).slice(11, 19)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] text-ink-2" title={event.title}>
                    {event.title}
                  </span>
                  <span className="block truncate text-[10px] text-ink-4">{event.source}</span>
                </span>
                {event.suspicious ? <Badge tone="signal">flag</Badge> : null}
              </button>
            ))
          )}
        </div>
      </Panel>

      <Panel className="min-h-0 flex-1">
        <PanelHeader
          title="Event detail"
          subtitle={selected ? selected.category : 'Nothing selected'}
          readout={selected ? selected.id : undefined}
        />
        <div className="min-h-0 flex-1 overflow-auto">
          {!selected ? (
            <EmptyState
              title="No event selected"
              hint="Click a mark on the timeline to see its record, the artifacts that evidence it, and the people and devices it touches."
              icon={<Crosshair />}
            />
          ) : (
            <div className="flex flex-col gap-3 p-3">
              <div>
                <div className="flex items-center gap-2">
                  <SeverityDot severity={selected.severity} />
                  <span className="tabular font-mono text-[12px] text-cyan">
                    {formatTs(displayTs(selected.at, clockBasis, selected.hostClock))}
                  </span>
                  <Badge tone={SEVERITY_TONE[selected.severity]}>{selected.severity}</Badge>
                  {selected.suspicious ? <Badge tone="signal">flagged</Badge> : null}
                </div>
                <h3 className="mt-1 text-[13px] text-ink">{selected.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{selected.summary}</p>
              </div>

              <ConfidenceBar value={selected.confidence} label="Event confidence" />

              {selected.hostClock ? (
                <div className="rounded-[2px] border border-amber/30 bg-amber/8 px-2.5 py-2">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-amber uppercase">Host-written record</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-2">
                    Recorded by DEV-0042, whose clock ran 3m12s fast. Normalised {formatTs(selected.at)}; as recorded{' '}
                    {formatTs(displayTs(selected.at, 'host', true))}.
                  </p>
                </div>
              ) : null}

              <dl className="rounded-[2px] border border-line">
                <FieldRow label="Source" value={selected.source} />
                {selected.deviceId ? (
                  <FieldRow label="Device" value={deviceById.get(selected.deviceId)?.name ?? selected.deviceId} />
                ) : null}
                {selected.personId ? (
                  <FieldRow label="Person" value={personById.get(selected.personId)?.name ?? selected.personId} />
                ) : null}
                {selected.detail.map((row) => (
                  <FieldRow key={row.label} label={row.label} value={row.value} mono />
                ))}
              </dl>

              <div>
                <p className="mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-ink-4 uppercase">
                  Linked evidence
                </p>
                <div className="flex flex-col gap-1">
                  {selected.evidenceIds.length === 0 ? (
                    <p className="text-[11px] text-ink-4">No artifact is linked to this event.</p>
                  ) : (
                    selected.evidenceIds.map((id) => {
                      const item = evidenceById.get(id)
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => selectEvidence(id)}
                          className="flex items-center gap-2 rounded-[2px] border border-line bg-panel-2 px-2 py-1.5 text-left transition-colors hover:border-cyan/40 hover:bg-cyan/8"
                        >
                          <span className="tabular font-mono text-[10px] text-cyan">{id}</span>
                          <span className="min-w-0 flex-1 truncate text-[11px] text-ink-2">
                            {item ? item.label : 'Artifact not present in this case file'}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Button
                  onClick={() => {
                    setView(centerOn(view, selected.at, FULL, 20 * 60_000))
                  }}
                >
                  Centre on timeline
                </Button>
                {selected.reconstruction ? (
                  <Button tone="primary" onClick={() => navigate('/reconstruction')}>
                    Open in reconstruction
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </Panel>
      </div>
    </div>
  )
}
