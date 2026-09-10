/**
 * Case time handling.
 *
 * Two clocks matter in OPERATION NIGHTFALL:
 *
 *  - NORMALIZED : the NTP-correct case timeline, all evidence reconciled
 *  - HOST       : the DEV-0042 workstation clock, documented at acquisition as
 *                 running +3m12s fast (W32Time Event ID 37)
 *
 * Filesystem MACB timestamps and Windows event records carry HOST time. Proxy,
 * DNS, VPN, file-server and facility badge records carry NORMALIZED time. An
 * investigator who compares the two without normalizing will build a sequence
 * that is three minutes and twelve seconds wrong.
 */

/** Case locale is US Eastern Daylight Time on 2026-08-17. */
export const CASE_UTC_OFFSET_MINUTES = -240
export const CASE_TZ_LABEL = 'UTC-04:00 (EDT)'

/** DEV-0042 host clock offset versus NTP, in seconds. Positive means host is fast. */
export const HOST_CLOCK_DRIFT_SECONDS = 192

export type ClockBasis = 'normalized' | 'host'

const OFFSET_MS = CASE_UTC_OFFSET_MINUTES * 60_000
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function parseTs(iso: string): number {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) throw new Error(`ARES: unparsable timestamp "${iso}"`)
  return ms
}

/** Convert a normalized epoch to the value the DEV-0042 clock recorded. */
export function toHostClock(epochMs: number): number {
  return epochMs + HOST_CLOCK_DRIFT_SECONDS * 1000
}

/** Convert a DEV-0042 recorded epoch back to normalized case time. */
export function fromHostClock(epochMs: number): number {
  return epochMs - HOST_CLOCK_DRIFT_SECONDS * 1000
}

function shifted(epochMs: number): Date {
  return new Date(epochMs + OFFSET_MS)
}

/** "2026-08-17 23:43:50" in case-local time, independent of the viewer time zone. */
export function formatTs(epochMs: number, opts: { seconds?: boolean; millis?: boolean } = {}): string {
  const iso = shifted(epochMs).toISOString()
  const date = iso.slice(0, 10)
  const time = opts.millis ? iso.slice(11, 23) : opts.seconds === false ? iso.slice(11, 16) : iso.slice(11, 19)
  return `${date} ${time}`
}

/** "23:43:50" */
export function formatClock(epochMs: number, opts: { millis?: boolean } = {}): string {
  const iso = shifted(epochMs).toISOString()
  return opts.millis ? iso.slice(11, 23) : iso.slice(11, 19)
}

/** "2026-08-17" */
export function formatDate(epochMs: number): string {
  return shifted(epochMs).toISOString().slice(0, 10)
}

/** "17 AUG 2026" */
export function formatDateLong(epochMs: number): string {
  const d = shifted(epochMs)
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** ISO 8601 with the case offset: "2026-08-17T23:43:50-04:00" */
export function formatIso(epochMs: number): string {
  const sign = CASE_UTC_OFFSET_MINUTES <= 0 ? '-' : '+'
  const abs = Math.abs(CASE_UTC_OFFSET_MINUTES)
  const off = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
  return `${shifted(epochMs).toISOString().slice(0, 19)}${off}`
}

/** "3m 12s", "1h 04m", "412ms" */
export function formatDuration(ms: number): string {
  const abs = Math.abs(ms)
  if (abs < 1000) return `${Math.round(abs)}ms`
  const totalSeconds = Math.round(abs / 1000)
  const s = totalSeconds % 60
  const m = Math.floor(totalSeconds / 60) % 60
  const h = Math.floor(totalSeconds / 3600)
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

/** Span between two epochs as "HH:MM:SS". */
export function formatSpan(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor(total / 60) % 60
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

/**
 * Render a timestamp under the selected clock basis. Records that were written
 * by DEV-0042 carry the drift; everything else is already normalized.
 */
export function displayTs(epochMs: number, basis: ClockBasis, hostBound: boolean): number {
  if (!hostBound) return epochMs
  return basis === 'host' ? toHostClock(epochMs) : epochMs
}
