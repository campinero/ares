import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Rewind,
  FastForward,
} from 'lucide-react'
import { Stage3D } from '@/components/reconstruction/Stage3D'
import { StagePlan } from '@/components/reconstruction/StagePlan'
import { EvidenceReactor } from '@/components/reconstruction/EvidenceReactor'
import { EVENT_STAGE, STAGE_NODES } from '@/components/reconstruction/stage'
import { SPEEDS, usePlayback, type Speed } from '@/components/reconstruction/usePlayback'
import { CASE, evidenceById, deviceById, personById } from '@/data'
import { useCase } from '@/store/useCase'
import { displayTs, formatClock, formatSpan, formatTs } from '@/lib/time'
import { cn } from '@/lib/cn'
import {
  Badge,
  Button,
  ConfidenceBar,
  EmptyState,
  FieldRow,
  IconButton,
  Panel,
  PanelHeader,
  SEVERITY_TONE,
  SeverityDot,
} from '@/components/ui'

/**
 * Incident reconstruction.
 *
 * The sequence is not scripted: it is assembled from the events flagged for
 * reconstruction in the case file, played against a real clock, and every beat
 * carries the evidence that justifies it.
 */
export function Reconstruction() {
  const playback = usePlayback()
  const clockBasis = useCase((s) => s.clockBasis)
  const selectEvidence = useCase((s) => s.selectEvidence)
  const selectedEvidenceId = useCase((s) => s.selectedEvidenceId)
  const selectEvent = useCase((s) => s.selectEvent)
  const navigate = useNavigate()

  const [focusedNode, setFocusedNode] = useState<string | null>(null)
  const [webglFailed, setWebglFailed] = useState(false)
  const ledgerRef = useRef<HTMLDivElement>(null)

  const activeEvent = playback.activeEventId
    ? CASE.events.find((e) => e.id === playback.activeEventId) ?? null
    : null

  const beat = playback.activeEventId ? EVENT_STAGE[playback.activeEventId] : undefined

  const linkedEvidence = useMemo(() => {
    if (!activeEvent) return []
    return activeEvent.evidenceIds.map((id) => evidenceById.get(id)).filter((e) => e !== undefined)
  }, [activeEvent])

  useEffect(() => {
    if (!playback.activeEventId || !ledgerRef.current) return
    const node = ledgerRef.current.querySelector<HTMLElement>(`[data-event="${playback.activeEventId}"]`)
    node?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [playback.activeEventId])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.isContentEditable)) return
      if (event.code === 'Space') {
        event.preventDefault()
        playback.toggle()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        playback.stepEvent(1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        playback.stepEvent(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playback])

  if (playback.events.length === 0) {
    return (
      <Panel className="h-full">
        <PanelHeader title="Incident reconstruction" />
        <EmptyState
          title="No reconstruction sequence available"
          hint="No events in this case file are flagged for reconstruction."
        />
      </Panel>
    )
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(268px,300px)_minmax(0,1fr)_minmax(288px,330px)] gap-2">
      {/* ------------------------------------------------------------ ledger */}
      <Panel className="min-h-0">
        <PanelHeader
          title="Sequence"
          subtitle={`${playback.events.length} beats - ${formatSpan(playback.end - playback.start)} window`}
          readout={clockBasis === 'host' ? 'HOST +192s' : 'NORMALISED'}
        />
        <div ref={ledgerRef} className="min-h-0 flex-1 overflow-auto">
          {playback.events.map((event, index) => {
            const fired = playback.firedEventIds.includes(event.id)
            const active = event.id === playback.activeEventId
            return (
              <button
                key={event.id}
                type="button"
                data-event={event.id}
                onClick={() => {
                  playback.seek(event.at)
                  selectEvent(event.id)
                }}
                className={cn(
                  'relative flex w-full items-start gap-2.5 border-b border-line/50 px-3 py-2 text-left transition-colors',
                  active ? 'bg-cyan/12' : fired ? 'bg-panel-2/40 hover:bg-panel-3' : 'hover:bg-panel-2',
                )}
              >
                {active ? <span className="absolute inset-y-0 left-0 w-[2px] bg-cyan" /> : null}
                <span
                  className={cn(
                    'tabular mt-[1px] shrink-0 font-mono text-[11px]',
                    active ? 'text-cyan' : fired ? 'text-ink-2' : 'text-ink-4',
                  )}
                >
                  {formatClock(displayTs(event.at, clockBasis, event.hostClock))}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate text-[12px] tracking-[0.04em] uppercase',
                      active ? 'text-ink' : fired ? 'text-ink-2' : 'text-ink-4',
                    )}
                  >
                    {event.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5">
                    <SeverityDot severity={event.severity} />
                    <span className="truncate text-[10px] text-ink-4">{event.source}</span>
                  </span>
                </span>
                <span className="tabular shrink-0 font-mono text-[10px] text-ink-4">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </button>
            )
          })}
        </div>
      </Panel>

      {/* ------------------------------------------------------------- stage */}
      <Panel className="min-h-0" lit scan>
        <PanelHeader
          title="Incident reconstruction"
          subtitle={beat?.caption ?? 'Standing by - press play to run the sequence'}
          readout={formatTs(displayTs(playback.at, clockBasis, true))}
          actions={
            <IconButton
              label={focusedNode ? 'Clear actor focus' : 'No actor focused'}
              onClick={() => setFocusedNode(null)}
              active={Boolean(focusedNode)}
              disabled={!focusedNode}
            >
              <Maximize2 />
            </IconButton>
          }
        />

        <div className="relative min-h-0 flex-1">
          {webglFailed ? (
            <StagePlan
              activeEventId={playback.activeEventId}
              beatProgress={playback.beatProgress}
              focusedNode={focusedNode}
              onSelectNode={setFocusedNode}
            />
          ) : (
            <ErrorBoundary onError={() => setWebglFailed(true)}>
              <Stage3D
                activeEventId={playback.activeEventId}
                beatProgress={playback.beatProgress}
                playing={playback.playing}
                onSelectNode={(id) => setFocusedNode((current) => (current === id ? null : id))}
                focusedNodes={focusedNode ? [focusedNode] : []}
              />
            </ErrorBoundary>
          )}

          {activeEvent ? (
            <motion.div
              key={activeEvent.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="pointer-events-none absolute top-3 left-3 max-w-[62%] rounded-[2px] border border-line-2 bg-void/80 px-3 py-2 backdrop-blur"
            >
              <div className="flex items-center gap-2">
                <span className="tabular font-mono text-[13px] text-cyan">
                  {formatClock(displayTs(activeEvent.at, clockBasis, activeEvent.hostClock))}
                </span>
                <Badge tone={SEVERITY_TONE[activeEvent.severity]}>{activeEvent.severity}</Badge>
                {activeEvent.hostClock ? <Badge tone="amber">host clock</Badge> : null}
              </div>
              <p className="mt-1 text-[13px] tracking-[0.06em] text-ink uppercase">{activeEvent.title}</p>
              <p className="mt-0.5 text-[11px] text-ink-3">{beat?.caption}</p>
            </motion.div>
          ) : null}
        </div>

        <EvidenceReactor
          firedEventIds={playback.firedEventIds}
          activeEventId={playback.activeEventId}
          onSelect={selectEvidence}
          selectedEvidenceId={selectedEvidenceId}
        />

        {/* ------------------------------------------------------- transport */}
        <div className="shrink-0 border-t border-line bg-abyss/70 px-3 py-2">
          <Scrubber
            events={playback.events}
            start={playback.start}
            end={playback.end}
            at={playback.at}
            activeId={playback.activeEventId}
            onSeek={playback.seek}
          />

          <div className="mt-2 flex items-center gap-1.5">
            <IconButton label="Restart sequence" onClick={playback.restart}>
              <RotateCcw />
            </IconButton>
            <IconButton label="Previous event" onClick={() => playback.stepEvent(-1)}>
              <ChevronLeft />
            </IconButton>
            <IconButton label="Rewind 30 case seconds" onClick={() => playback.seek(playback.at - 30_000)}>
              <Rewind />
            </IconButton>
            <button
              type="button"
              onClick={playback.toggle}
              aria-label={playback.playing ? 'Pause' : 'Play'}
              className="inline-flex h-7 items-center gap-1.5 rounded-[2px] border border-cyan/45 bg-cyan/15 px-3 text-[11px] font-medium tracking-[0.1em] text-cyan uppercase transition-colors hover:bg-cyan/25 [&>svg]:size-3.5"
            >
              {playback.playing ? <Pause /> : <Play />}
              {playback.playing ? 'Pause' : 'Play'}
            </button>
            <IconButton label="Fast forward 30 case seconds" onClick={() => playback.seek(playback.at + 30_000)}>
              <FastForward />
            </IconButton>
            <IconButton label="Next event" onClick={() => playback.stepEvent(1)}>
              <ChevronRight />
            </IconButton>

            <div className="mx-2 h-5 w-px bg-line" />

            <Gauge className="size-3.5 text-ink-4" />
            <div className="flex items-center gap-[2px] rounded-[2px] border border-line bg-panel-2 p-[2px]">
              {SPEEDS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => playback.setSpeed(value as Speed)}
                  className={cn(
                    'tabular rounded-[2px] px-1.5 py-[2px] font-mono text-[10px] transition-colors',
                    playback.speed === value ? 'bg-cyan/15 text-cyan' : 'text-ink-4 hover:text-ink-2',
                  )}
                >
                  {value}x
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <span className="tabular font-mono text-[11px] text-ink-3">
              {formatSpan(playback.at - playback.start)} / {formatSpan(playback.end - playback.start)}
            </span>
          </div>
        </div>
      </Panel>

      {/* ------------------------------------------------------------ detail */}
      <Panel className="min-h-0">
        <PanelHeader
          title="Beat detail"
          subtitle={activeEvent ? activeEvent.category : 'No beat reached yet'}
          readout={activeEvent ? activeEvent.id : undefined}
        />
        <div className="min-h-0 flex-1 overflow-auto">
          {!activeEvent ? (
            <EmptyState
              title="Sequence has not started"
              hint="Press play, or click any beat in the sequence list, to begin the reconstruction."
              action={
                <Button tone="primary" onClick={playback.restart}>
                  <Play />
                  Run sequence
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3 p-3">
              <p className="text-[12px] leading-relaxed text-ink-2">{activeEvent.summary}</p>
              <ConfidenceBar value={activeEvent.confidence} label="Event confidence" />

              <dl className="rounded-[2px] border border-line">
                <FieldRow label="Source" value={activeEvent.source} />
                <FieldRow
                  label="Normalised"
                  value={formatTs(activeEvent.at)}
                  mono
                />
                {activeEvent.hostClock ? (
                  <FieldRow label="Host recorded" value={`${formatTs(displayTs(activeEvent.at, 'host', true))} (+192 s)`} mono />
                ) : null}
                {activeEvent.deviceId ? (
                  <FieldRow label="Device" value={deviceById.get(activeEvent.deviceId)?.name ?? activeEvent.deviceId} />
                ) : null}
                {activeEvent.personId ? (
                  <FieldRow label="Person" value={personById.get(activeEvent.personId)?.name ?? activeEvent.personId} />
                ) : null}
                {activeEvent.detail.map((row) => (
                  <FieldRow key={row.label} label={row.label} value={row.value} mono />
                ))}
              </dl>

              <div>
                <p className="mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-ink-4 uppercase">
                  Evidence supporting this beat
                </p>
                <div className="flex flex-col gap-1">
                  {linkedEvidence.length === 0 ? (
                    <p className="text-[11px] text-ink-4">No artifact is linked to this beat.</p>
                  ) : (
                    linkedEvidence.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectEvidence(item.id)}
                        className="flex items-center gap-2 rounded-[2px] border border-line bg-panel-2 px-2 py-1.5 text-left transition-colors hover:border-cyan/40 hover:bg-cyan/8"
                      >
                        <span className="tabular font-mono text-[10px] text-cyan">{item.id}</span>
                        <span className="min-w-0 flex-1 truncate text-[11px] text-ink-2">{item.label}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <Button
                onClick={() => {
                  selectEvent(activeEvent.id)
                  navigate('/timeline')
                }}
              >
                Open beat in timeline
              </Button>

              {beat ? (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-ink-4 uppercase">
                    Actors involved
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {beat.active.map((nodeId) => {
                      const node = STAGE_NODES.find((n) => n.id === nodeId)
                      if (!node) return null
                      return (
                        <button key={nodeId} type="button" onClick={() => setFocusedNode(nodeId)}>
                          <Badge tone={focusedNode === nodeId ? 'cyan' : 'neutral'}>{node.label}</Badge>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------ pieces */

function Scrubber({
  events,
  start,
  end,
  at,
  activeId,
  onSeek,
}: {
  events: typeof CASE.events
  start: number
  end: number
  at: number
  activeId: string | null
  onSeek: (value: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const span = Math.max(1, end - start)
  const progress = (at - start) / span

  function seekFromPointer(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    onSeek(start + ratio * span)
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label="Reconstruction position"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        seekFromPointer(e.clientX)
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) seekFromPointer(e.clientX)
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onSeek(at + span * 0.02)
        if (e.key === 'ArrowLeft') onSeek(at - span * 0.02)
      }}
      className="relative h-8 cursor-pointer touch-none select-none"
    >
      <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-line" />
      <div
        className="absolute top-1/2 left-0 h-[3px] -translate-y-1/2 rounded-full bg-cyan/70"
        style={{ width: `${progress * 100}%` }}
      />

      {events.map((event) => {
        const left = ((event.at - start) / span) * 100
        const passed = event.at <= at
        const isActive = event.id === activeId
        return (
          <span
            key={event.id}
            title={`${formatClock(event.at)} ${event.title}`}
            className={cn(
              'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all',
              isActive
                ? 'size-[9px] bg-cyan ring-2 ring-cyan/30'
                : event.severity === 'critical'
                  ? passed
                    ? 'size-[6px] bg-signal'
                    : 'size-[6px] bg-signal/40'
                  : passed
                    ? 'size-[5px] bg-ink-2'
                    : 'size-[5px] bg-ink-4/50',
            )}
            style={{ left: `${left}%` }}
          />
        )
      })}

      <span
        className="pointer-events-none absolute top-0 bottom-0 w-px bg-cyan"
        style={{ left: `${progress * 100}%` }}
      />
    </div>
  )
}

interface BoundaryProps {
  children: React.ReactNode
  onError: () => void
}

interface BoundaryState {
  failed: boolean
}

/** Falls back to the flat plan view when WebGL is unavailable. */
class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false }

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}
