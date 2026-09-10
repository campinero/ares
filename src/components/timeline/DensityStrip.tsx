import { useMemo, useRef } from 'react'
import type { TimelineEvent } from '@/data/types'
import type { Viewport } from './scale'
import { formatDate } from '@/lib/time'

/**
 * Whole-case overview strip.
 *
 * Shows where events actually sit across the full span and which slice the main
 * canvas is looking at, so an investigator zoomed into a fifteen minute window
 * never loses their place in a month of data. Drag the viewport box to travel.
 */
export function DensityStrip({
  events,
  limit,
  view,
  onView,
  buckets = 160,
}: {
  events: TimelineEvent[]
  limit: Viewport
  view: Viewport
  onView: (next: Viewport) => void
  buckets?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const span = Math.max(1, limit.end - limit.start)

  const bars = useMemo(() => {
    const counts = new Array<number>(buckets).fill(0)
    const flagged = new Array<number>(buckets).fill(0)
    for (const event of events) {
      const index = Math.min(buckets - 1, Math.max(0, Math.floor(((event.at - limit.start) / span) * buckets)))
      counts[index] += 1
      if (event.suspicious) flagged[index] += 1
    }
    const peak = Math.max(1, ...counts)
    return counts.map((count, index) => ({
      height: count === 0 ? 0 : 0.25 + 0.75 * (count / peak),
      flagged: flagged[index] > 0,
    }))
  }, [events, limit.start, span, buckets])

  const left = ((view.start - limit.start) / span) * 100
  const width = Math.max(0.6, ((view.end - view.start) / span) * 100)

  function travel(clientX: number) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const centre = limit.start + ratio * span
    const half = (view.end - view.start) / 2
    onView({ start: centre - half, end: centre + half })
  }

  return (
    <div className="shrink-0 border-t border-line bg-abyss/50 px-3 py-1.5">
      <div className="mb-1 flex items-center justify-between text-[9px] tracking-[0.14em] text-ink-4 uppercase">
        <span>{formatDate(limit.start)}</span>
        <span>Case span - drag to travel</span>
        <span>{formatDate(limit.end)}</span>
      </div>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Timeline overview"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(left + width / 2)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          travel(e.clientX)
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) travel(e.clientX)
        }}
        onKeyDown={(e) => {
          const step = (view.end - view.start) * 0.5
          if (e.key === 'ArrowLeft') onView({ start: view.start - step, end: view.end - step })
          if (e.key === 'ArrowRight') onView({ start: view.start + step, end: view.end + step })
        }}
        className="relative h-9 cursor-pointer touch-none select-none rounded-[2px] border border-line bg-void/60"
      >
        <div className="absolute inset-0 flex items-end gap-px px-px pb-px">
          {bars.map((bar, index) => (
            <div
              key={index}
              className={bar.flagged ? 'bg-signal/80' : 'bg-cyan/45'}
              style={{ height: `${bar.height * 100}%`, flex: '1 1 0' }}
            />
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 rounded-[1px] border border-cyan/70 bg-cyan/10"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      </div>
    </div>
  )
}
