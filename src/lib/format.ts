/** Presentation helpers shared across every ARES panel. */

const UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB']

export function formatBytes(bytes: number, precision = 1): string {
  if (bytes === 0) return '0 B'
  const exp = Math.min(UNITS.length - 1, Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)))
  const value = bytes / 1024 ** exp
  return `${exp === 0 ? value : value.toFixed(precision)} ${UNITS[exp]}`
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

export function formatPercent(value01: number, digits = 0): string {
  return `${(value01 * 100).toFixed(digits)}%`
}

/** Break a hash into readable groups: "cbfb79c0 006bef47 ..." */
export function groupHash(hash: string, size = 8): string {
  const out: string[] = []
  for (let i = 0; i < hash.length; i += size) out.push(hash.slice(i, i + size))
  return out.join(' ')
}

export function truncateMiddle(text: string, max = 48): string {
  if (text.length <= max) return text
  const head = Math.ceil((max - 1) / 2)
  const tail = Math.floor((max - 1) / 2)
  return `${text.slice(0, head)}...${text.slice(text.length - tail)}`
}

export function toHexOffset(offset: number, width = 8): string {
  return offset.toString(16).toUpperCase().padStart(width, '0')
}

/** Windows-style path leaf. */
export function basename(path: string): string {
  const parts = path.split(/[\\/]/)
  return parts[parts.length - 1] || path
}

export function dirname(path: string): string {
  const idx = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('/'))
  return idx <= 0 ? path : path.slice(0, idx)
}

export function extname(path: string): string {
  const base = basename(path)
  const idx = base.lastIndexOf('.')
  return idx <= 0 ? '' : base.slice(idx + 1).toLowerCase()
}

/** Stable, human-sortable comparator for table columns. */
export function compareBy<T>(get: (row: T) => string | number, dir: 'asc' | 'desc' = 'asc') {
  return (a: T, b: T): number => {
    const av = get(a)
    const bv = get(b)
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return dir === 'asc' ? cmp : -cmp
  }
}
