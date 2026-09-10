/**
 * The master timeline canvas.
 *
 * An SVG scene driven by a viewport in case time. Wheel zooms about the
 * cursor, drag pans, and a click selects the nearest mark. Layout maths is
 * memoised on the viewport and the measured size so a pan frame only walks the
 * event array once.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { EventCategory, TimelineEvent } from '@/data/types'
import { displayTs, formatClock, formatTs, type ClockBasis } from '@/lib/time'
import { SeverityDot } from '@/components/ui'
import {
  buildTicks,
  CATEGORY_LABEL,
  clampView,
  dayBoundaries,
  markColor,
  zoomAt,
  type Viewport,
} from './scale'

const RULER_H = 28
const GUTTER = 104
const PAD_RIGHT = 14
const LANE_MIN = 18
const LANE_MAX = 96
const HIT_X = 9

export interface CanvasProps {
  events: TimelineEvent[]
  lanes: EventCategory[]
  view: Viewport
  limit: Viewport
  incident: Viewport
  clockBasis: ClockBasis
  investigationMode: boolean
  selectedId: string | null
  /** Events citing this artifact are ringed. */
  evidenceId: string | null
  onView: (next: Viewport) => void
  onSelect: (id: string) => void
}

interface Placed {
  ev: TimelineEvent
  at: number
  x: number
  y: number
}

function useMeasured(): [React.RefObject<HTMLDivElement | null>, { w: number; h: number }] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ w: 960, h: 320 })
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (box) setSize({ w: Math.max(240, box.width), h: Math.max(140, box.height) })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, size]
}

export function TimelineCanvas(props: CanvasProps) {
  const { events, lanes, view, limit, incident, clockBasis, investigationMode, selectedId, evidenceId } = props
  const { onView, onSelect } = props
  const [wrapRef, size] = useMeasured()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [cursorX, setCursorX] = useState<number | null>(null)
  const drag = useRef<{ pointerId: number; x: number; view: Viewport; moved: boolean } | null>(null)

  const plotW = Math.max(80, size.w - GUTTER - PAD_RIGHT)
  const laneH = Math.max(LANE_MIN, Math.min(LANE_MAX, (size.h - RULER_H - 8) / Math.max(1, lanes.length)))
  const bodyH = laneH * lanes.length
  const span = Math.max(1, view.end - view.start)

  const toX = useCallback(
    (t: number) => GUTTER + ((t - view.start) / span) * plotW,
    [view.start, span, plotW],
  )
  const toTime = useCallback(
    (x: number) => view.start + ((x - GUTTER) / plotW) * span,
    [view.start, span, plotW],
  )

  const laneIndex = useMemo(() => {
    const map = new Map<EventCategory, number>()
    lanes.forEach((c, i) => map.set(c, i))
    return map
  }, [lanes])

  const placed = useMemo<Placed[]>(() => {
    const out: Placed[] = []
    for (const ev of events) {
      const row = laneIndex.get(ev.category)
      if (row === undefined) continue
      const at = displayTs(ev.at, clockBasis, ev.hostClock)
      out.push({ ev, at, x: toX(at), y: RULER_H + row * laneH + laneH / 2 })
    }
    return out
  }, [events, laneIndex, clockBasis, toX, laneH])

  const onScreen = useMemo(
    () => placed.filter((p) => p.x >= GUTTER - 4 && p.x <= GUTTER + plotW + 4),
    [placed, plotW],
  )

  const { ticks, step } = useMemo(() => buildTicks(view, plotW), [view, plotW])
  const days = useMemo(() => (span < 4 * 86_400_000 ? dayBoundaries(view) : []), [view, span])

  const hit = useCallback(
    (mx: number, my: number): Placed | null => {
      let best: Placed | null = null
      let bestDx = HIT_X
      for (const p of onScreen) {
        const dx = Math.abs(p.x - mx)
        if (dx > bestDx) continue
        if (Math.abs(p.y - my) > laneH / 2) continue
        best = p
        bestDx = dx
      }
      return best
    },
    [onScreen, laneH],
  )

  /* Wheel must be non-passive to cancel page scroll, so it is bound by hand. */
  useEffect(() => {
    const node = svgRef.current
    if (!node) return
    function onWheel(event: WheelEvent) {
      event.preventDefault()
      const rect = node?.getBoundingClientRect()
      if (!rect) return
      const anchor = Math.max(0, Math.min(1, (event.clientX - rect.left - GUTTER) / plotW))
      const factor = Math.exp(event.deltaY * 0.0016)
      onView(zoomAt(view, factor, anchor, limit))
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [view, limit, plotW, onView])

  const localX = useCallback((clientX: number): number => {
    const rect = svgRef.current?.getBoundingClientRect()
    return rect ? clientX - rect.left : 0
  }, [])

  function onPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { pointerId: event.pointerId, x: event.clientX, view, moved: false }
  }

  function onPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const mx = localX(event.clientX)
    const rect = svgRef.current?.getBoundingClientRect()
    const my = rect ? event.clientY - rect.top : 0
    const active = drag.current
    if (active) {
      const dx = event.clientX - active.x
      if (Math.abs(dx) > 3) active.moved = true
      if (active.moved) {
        const dt = (dx / plotW) * (active.view.end - active.view.start)
        onView(clampView({ start: active.view.start - dt, end: active.view.end - dt }, limit))
      }
      return
    }
    setCursorX(mx >= GUTTER && mx <= GUTTER + plotW ? mx : null)
    const found = hit(mx, my)
    setHoverId(found ? found.ev.id : null)
  }

  function onPointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    const active = drag.current
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (!active || active.moved) return
    const rect = svgRef.current?.getBoundingClientRect()
    const found = hit(localX(event.clientX), rect ? event.clientY - rect.top : 0)
    if (found) onSelect(found.ev.id)
  }

  function onPointerLeave() {
    setHoverId(null)
    setCursorX(null)
  }

  const hovered = hoverId ? (placed.find((p) => p.ev.id === hoverId) ?? null) : null
  const selected = selectedId ? (placed.find((p) => p.ev.id === selectedId) ?? null) : null
  const cursorTime = cursorX === null ? null : toTime(cursorX)
  const height = RULER_H + bodyH + 6
  const showDays = step < 86_400_000

  return (
    <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-auto">
      <svg
        ref={svgRef}
        width={size.w}
        height={height}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
        className="block cursor-crosshair touch-none select-none"
        role="application"
        aria-label="Case timeline canvas"
      >
        <rect x={0} y={0} width={size.w} height={RULER_H} fill="var(--color-panel-2)" />
        <line x1={0} y1={RULER_H} x2={size.w} y2={RULER_H} stroke="var(--color-line-2)" />
        <line x1={GUTTER} y1={0} x2={GUTTER} y2={height} stroke="var(--color-line-2)" />

        {lanes.map((cat, i) => (
          <g key={cat}>
            {i % 2 === 1 ? (
              <rect
                x={GUTTER}
                y={RULER_H + i * laneH}
                width={plotW + PAD_RIGHT}
                height={laneH}
                fill="var(--color-panel-2)"
                opacity={0.4}
              />
            ) : null}
            <line
              x1={0}
              y1={RULER_H + (i + 1) * laneH}
              x2={size.w}
              y2={RULER_H + (i + 1) * laneH}
              stroke="var(--color-line)"
              opacity={0.7}
            />
            <text
              x={8}
              y={RULER_H + i * laneH + laneH / 2 + 3}
              className="font-mono"
              fontSize={9}
              letterSpacing="0.1em"
              fill="var(--color-ink-4)"
            >
              {CATEGORY_LABEL[cat]}
            </text>
          </g>
        ))}

        {incident.end > view.start && incident.start < view.end ? (
          <g>
            <rect
              x={Math.max(GUTTER, toX(incident.start))}
              y={RULER_H}
              width={Math.max(1, Math.min(GUTTER + plotW, toX(incident.end)) - Math.max(GUTTER, toX(incident.start)))}
              height={bodyH}
              fill="var(--color-cyan)"
              opacity={0.05}
            />
            <line
              x1={toX(incident.start)}
              y1={RULER_H}
              x2={toX(incident.start)}
              y2={RULER_H + bodyH}
              stroke="var(--color-cyan)"
              opacity={0.35}
              strokeDasharray="2 3"
            />
            <line
              x1={toX(incident.end)}
              y1={RULER_H}
              x2={toX(incident.end)}
              y2={RULER_H + bodyH}
              stroke="var(--color-cyan)"
              opacity={0.35}
              strokeDasharray="2 3"
            />
          </g>
        ) : null}

        {ticks.map((tick) => (
          <g key={tick.t}>
            <line
              x1={toX(tick.t)}
              y1={tick.major ? RULER_H - 9 : RULER_H - 4}
              x2={toX(tick.t)}
              y2={tick.major ? RULER_H + bodyH : RULER_H}
              stroke={tick.major ? 'var(--color-line-2)' : 'var(--color-line)'}
              opacity={tick.major ? 0.75 : 1}
            />
            {tick.major ? (
              <text
                x={toX(tick.t) + 3}
                y={12}
                className="tabular font-mono"
                fontSize={9}
                fill="var(--color-ink-3)"
              >
                {tick.label}
              </text>
            ) : null}
          </g>
        ))}

        {showDays
          ? days.map((t) => (
              <g key={`day-${t}`}>
                <line
                  x1={toX(t)}
                  y1={0}
                  x2={toX(t)}
                  y2={RULER_H + bodyH}
                  stroke="var(--color-line-3)"
                />
                <text
                  x={toX(t) + 3}
                  y={24}
                  className="font-mono"
                  fontSize={8}
                  letterSpacing="0.12em"
                  fill="var(--color-ink-4)"
                >
                  {formatTs(t).slice(0, 10)}
                </text>
              </g>
            ))
          : null}

        {selected ? (
          <line
            x1={selected.x}
            y1={RULER_H}
            x2={selected.x}
            y2={RULER_H + bodyH}
            stroke="var(--color-cyan)"
            opacity={0.4}
          />
        ) : null}

        {onScreen.map((p) => {
          const color = markColor(p.ev.severity, p.ev.suspicious)
          const dim = investigationMode && p.ev.severity === 'info'
          const isSelected = p.ev.id === selectedId
          const isHover = p.ev.id === hoverId
          const citesEvidence = evidenceId !== null && p.ev.evidenceIds.includes(evidenceId)
          return (
            <g key={p.ev.id} opacity={dim ? 0.32 : 1}>
              {p.ev.suspicious ? (
                <line x1={p.x} y1={p.y - 6} x2={p.x} y2={p.y - 13} stroke={color} opacity={0.5} />
              ) : null}
              <rect
                x={p.x - (p.ev.suspicious ? 1.5 : 1)}
                y={p.y - (p.ev.suspicious ? 6 : 5)}
                width={p.ev.suspicious ? 3 : 2}
                height={p.ev.suspicious ? 12 : 10}
                fill={color}
                opacity={p.ev.suspicious ? 1 : 0.85}
              />
              {p.ev.hostClock ? (
                <rect x={p.x - 1} y={p.y + 8} width={2} height={2} fill="var(--color-amber)" opacity={0.75} />
              ) : null}
              {citesEvidence ? (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={9}
                  fill="none"
                  stroke="var(--color-violet)"
                  strokeWidth={1.2}
                  opacity={0.85}
                />
              ) : null}
              {isSelected || isHover ? (
                <rect
                  x={p.x - 4}
                  y={p.y - 9}
                  width={8}
                  height={18}
                  fill="none"
                  stroke={isSelected ? 'var(--color-cyan)' : 'var(--color-ink-3)'}
                  opacity={isSelected ? 0.9 : 0.6}
                />
              ) : null}
            </g>
          )
        })}

        {cursorX !== null && cursorTime !== null ? (
          <g pointerEvents="none">
            <line x1={cursorX} y1={0} x2={cursorX} y2={RULER_H + bodyH} stroke="var(--color-cyan)" opacity={0.22} />
            <rect x={Math.min(cursorX + 2, size.w - 62)} y={RULER_H + bodyH - 13} width={60} height={12} fill="var(--color-abyss)" />
            <text
              x={Math.min(cursorX + 5, size.w - 59)}
              y={RULER_H + bodyH - 4}
              className="tabular font-mono"
              fontSize={9}
              fill="var(--color-cyan)"
            >
              {formatClock(cursorTime)}
            </text>
          </g>
        ) : null}
      </svg>

      {hovered ? (
        <div
          className="pointer-events-none absolute z-10 w-[264px] rounded-[3px] border border-line-3 bg-abyss/95 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
          style={{
            left: Math.max(6, Math.min(hovered.x + 14, size.w - 274)),
            top: Math.max(4, Math.min(hovered.y + 12, height - 96)),
          }}
        >
          <div className="tabular flex items-center gap-2 font-mono text-[10px] text-cyan">
            {formatTs(hovered.at)}
            {hovered.ev.hostClock ? <span className="text-amber">HOST</span> : null}
          </div>
          <p className="mt-1 text-[12px] leading-snug text-ink">{hovered.ev.title}</p>
          <p className="mt-1 truncate font-mono text-[10px] text-ink-4">{hovered.ev.source}</p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] tracking-[0.1em] text-ink-3 uppercase">
            <SeverityDot severity={hovered.ev.severity} />
            {hovered.ev.severity}
            {hovered.ev.suspicious ? <span className="text-signal">SUSPICIOUS</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
