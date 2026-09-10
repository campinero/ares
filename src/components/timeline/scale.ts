/**
 * Timeline scale maths.
 *
 * The canvas is a pure function of a viewport - a normalized [start, end]
 * epoch window - and a pixel width. Tick density adapts so that a major tick
 * lands roughly every 120 px, walking a fixed ladder from one second up to
 * four weeks. Every label is produced by the shared case-time formatters so a
 * viewer in any host time zone reads the same axis.
 */
import type { EventCategory, Severity } from '@/data/types'
import { CASE_UTC_OFFSET_MINUTES, formatClock, formatDateLong, formatDuration } from '@/lib/time'

export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

const OFFSET_MS = CASE_UTC_OFFSET_MINUTES * 60_000

/** Tightest window the investigator can zoom to: ten seconds across the canvas. */
export const MIN_SPAN = 10 * SECOND

export interface Viewport {
  start: number
  end: number
}

export interface Tick {
  t: number
  major: boolean
  label: string
}

const STEPS: number[] = [
  SECOND,
  2 * SECOND,
  5 * SECOND,
  10 * SECOND,
  15 * SECOND,
  30 * SECOND,
  MINUTE,
  2 * MINUTE,
  5 * MINUTE,
  10 * MINUTE,
  15 * MINUTE,
  30 * MINUTE,
  HOUR,
  2 * HOUR,
  3 * HOUR,
  6 * HOUR,
  12 * HOUR,
  DAY,
  2 * DAY,
  7 * DAY,
  14 * DAY,
  28 * DAY,
]

/** Smallest ladder step whose on-screen spacing clears the target pixel gap. */
export function pickStep(span: number, width: number, targetPx = 120): number {
  const wanted = (span * targetPx) / Math.max(width, 1)
  for (const step of STEPS) if (step >= wanted) return step
  return STEPS[STEPS.length - 1]
}

function minorDivisor(step: number): number {
  if (step === 15 * SECOND || step === 15 * MINUTE || step === 3 * HOUR) return 3
  if (step === 7 * DAY || step === 14 * DAY) return 7
  if (step === 5 * SECOND || step === 5 * MINUTE) return 5
  return 4
}

/** Axis unit currently in play, shown in the header readout. */
export function stepUnit(step: number): string {
  if (step < MINUTE) return 'SECONDS'
  if (step < HOUR) return 'MINUTES'
  if (step < DAY) return 'HOURS'
  if (step < 7 * DAY) return 'DAYS'
  return 'WEEKS'
}

function tickLabel(t: number, step: number): string {
  if (step < MINUTE) return formatClock(t)
  if (step < DAY) return formatClock(t).slice(0, 5)
  return formatDateLong(t).slice(0, 6)
}

/** Major and minor ticks covering [start, end], aligned to case-local time. */
export function buildTicks(view: Viewport, width: number): { ticks: Tick[]; step: number } {
  const span = Math.max(1, view.end - view.start)
  const step = pickStep(span, width)
  const minor = step / minorDivisor(step)
  const ticks: Tick[] = []
  const first = Math.ceil((view.start + OFFSET_MS) / minor) * minor - OFFSET_MS
  for (let t = first; t <= view.end; t += minor) {
    const major = (t + OFFSET_MS) % step === 0
    ticks.push({ t, major, label: major ? tickLabel(t, step) : '' })
    if (ticks.length >= 640) break
  }
  return { ticks, step }
}

/** Case-local midnights inside the window, used for day separators. */
export function dayBoundaries(view: Viewport): number[] {
  const out: number[] = []
  const first = Math.ceil((view.start + OFFSET_MS) / DAY) * DAY - OFFSET_MS
  for (let t = first; t <= view.end; t += DAY) {
    out.push(t)
    if (out.length >= 64) break
  }
  return out
}

/** Compact span readout. Sub-two-day windows use the shared duration format. */
export function spanLabel(ms: number): string {
  if (ms >= 2 * DAY) {
    const days = Math.floor(ms / DAY)
    const hours = Math.round((ms - days * DAY) / HOUR)
    return `${days}d ${String(hours).padStart(2, '0')}h`
  }
  return formatDuration(ms)
}

/** Zoom about a fixed pixel anchor so the time under the cursor does not move. */
export function zoomAt(view: Viewport, factor: number, anchor01: number, limit: Viewport): Viewport {
  const span = view.end - view.start
  const maxSpan = limit.end - limit.start
  const next = Math.max(MIN_SPAN, Math.min(maxSpan, span * factor))
  const pivot = view.start + span * anchor01
  return clampView({ start: pivot - next * anchor01, end: pivot - next * anchor01 + next }, limit)
}

/** Keep the window inside the case span without ever changing its width. */
export function clampView(view: Viewport, limit: Viewport): Viewport {
  const maxSpan = limit.end - limit.start
  const span = Math.max(MIN_SPAN, Math.min(maxSpan, view.end - view.start))
  let start = view.start
  if (start < limit.start) start = limit.start
  if (start + span > limit.end) start = limit.end - span
  return { start, end: start + span }
}

/** Centre the window on an instant, optionally tightening the span first. */
export function centerOn(view: Viewport, at: number, limit: Viewport, maxSpan?: number): Viewport {
  const span = Math.max(MIN_SPAN, Math.min(view.end - view.start, maxSpan ?? Number.POSITIVE_INFINITY))
  return clampView({ start: at - span / 2, end: at + span / 2 }, limit)
}

/* ------------------------------------------------------------------- lanes */

export const CATEGORY_ORDER: EventCategory[] = [
  'authentication',
  'account',
  'process',
  'filesystem',
  'removable-media',
  'network',
  'browser',
  'communication',
  'facility',
  'system',
]

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  authentication: 'AUTH',
  account: 'ACCOUNT',
  process: 'PROCESS',
  filesystem: 'FILESYSTEM',
  'removable-media': 'REMOVABLE',
  network: 'NETWORK',
  browser: 'BROWSER',
  communication: 'COMMS',
  facility: 'FACILITY',
  system: 'SYSTEM',
}

/** Muted lane accents. Marks stay severity-coded; this only tints the chips. */
export const CATEGORY_TONE: Record<EventCategory, string> = {
  authentication: 'var(--color-azure)',
  account: 'var(--color-azure)',
  process: 'var(--color-amber)',
  filesystem: 'var(--color-cyan)',
  'removable-media': 'var(--color-violet)',
  network: 'var(--color-jade)',
  browser: 'var(--color-cyan-dim)',
  communication: 'var(--color-ink-3)',
  facility: 'var(--color-ink-3)',
  system: 'var(--color-ink-4)',
}

export const SEVERITY_ORDER: Severity[] = ['critical', 'warning', 'notice', 'info']

export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: 'var(--color-signal)',
  warning: 'var(--color-amber)',
  notice: 'var(--color-cyan)',
  info: 'var(--color-ink-3)',
}

/** Suspicious records are always red; everything else follows severity. */
export function markColor(severity: Severity, suspicious: boolean): string {
  return suspicious ? 'var(--color-signal)' : SEVERITY_COLOR[severity]
}
