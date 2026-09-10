import type { CSSProperties } from 'react'

/**
 * Recharts theming for the artifact-review workspaces.
 *
 * Recharts ships a light palette, a white grid and a white tooltip card. None
 * of that belongs on a near-black instrument surface, so every chart in the
 * browser, USB and network views draws its colours, axes and tooltip chrome
 * from here and never falls back to a library default.
 */

export const CHART_COLOR = {
  cyan: '#33c9de',
  cyanDim: '#1d7f8f',
  azure: '#4a90f0',
  jade: '#34c98b',
  amber: '#edb04a',
  signal: '#ef5340',
  violet: '#8f7df2',
  ink2: '#a3b4c7',
  ink3: '#6a7f96',
  ink4: '#47596d',
  line: '#16202c',
  line2: '#1e2b3a',
  panel2: '#0d131c',
} as const

const MONO = "ui-monospace, 'Cascadia Mono', 'JetBrains Mono', Consolas, monospace"

/** Shared axis chrome. Spread onto every XAxis / YAxis. */
export const AXIS = {
  stroke: CHART_COLOR.ink4,
  tickLine: false,
  axisLine: { stroke: CHART_COLOR.line },
  tick: { fill: CHART_COLOR.ink4, fontSize: 9, fontFamily: MONO },
}

export const GRID = {
  stroke: CHART_COLOR.line,
  strokeDasharray: '2 4',
}

export const TOOLTIP: {
  contentStyle: CSSProperties
  labelStyle: CSSProperties
  itemStyle: CSSProperties
  wrapperStyle: CSSProperties
  animationDuration: number
} = {
  contentStyle: {
    background: CHART_COLOR.panel2,
    border: `1px solid ${CHART_COLOR.line2}`,
    borderRadius: 3,
    padding: '5px 8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
  },
  labelStyle: {
    color: CHART_COLOR.ink4,
    fontSize: 9,
    fontFamily: MONO,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  itemStyle: {
    color: CHART_COLOR.ink2,
    fontSize: 11,
    fontFamily: MONO,
    padding: 0,
  },
  wrapperStyle: { outline: 'none', zIndex: 30 },
  animationDuration: 160,
}

/** Bar-chart hover band. Line and area charts take the default vertical rule. */
export const BAR_CURSOR = { fill: 'rgba(51,201,222,0.07)' }

/** Fixed-width buckets covering the span of `times`. Deterministic, no sampling. */
export function bucketRange(times: number[], count = 24): { start: number; size: number; count: number } {
  if (times.length === 0) return { start: 0, size: 1, count }
  let min = times[0]
  let max = times[0]
  for (const t of times) {
    if (t < min) min = t
    if (t > max) max = t
  }
  const span = Math.max(1, max - min)
  return { start: min, size: span / count, count }
}

export function bucketOf(at: number, range: { start: number; size: number; count: number }): number {
  const idx = Math.floor((at - range.start) / range.size)
  return Math.max(0, Math.min(range.count - 1, idx))
}
