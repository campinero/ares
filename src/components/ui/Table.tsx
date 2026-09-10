import { type ReactNode, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface Column<T> {
  key: string
  header: string
  /** Grid track for this column, e.g. "minmax(0,1fr)" or "120px". */
  width: string
  render: (row: T) => ReactNode
  /** Sort accessor. Omit to make the column unsortable. */
  sort?: (row: T) => string | number
  align?: 'left' | 'right'
  /** Full text for a cell whose rendered form may be truncated. */
  title?: (row: T) => string
  mono?: boolean
}

interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  onSelect?: (row: T) => void
  selectedKey?: string | null
  empty?: ReactNode
  className?: string
  /** Row tint callback, e.g. to flag suspicious records. */
  rowTone?: (row: T) => string | undefined
  initialSort?: { key: string; dir: 'asc' | 'desc' }
  dense?: boolean
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onSelect,
  selectedKey,
  empty,
  className,
  rowTone,
  initialSort,
  dense = false,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null)

  const template = useMemo(() => columns.map((c) => c.width).join(' '), [columns])

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sort) return rows
    const accessor = col.sort
    return [...rows].sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      const cmp =
        typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [rows, columns, sort])

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  if (rows.length === 0 && empty) {
    return <div className={cn('flex min-h-0 flex-1 items-center justify-center', className)}>{empty}</div>
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div
        role="row"
        className="sticky top-0 z-10 grid shrink-0 items-center gap-x-3 border-b border-line bg-panel-2/95 px-3 py-1.5 backdrop-blur"
        style={{ gridTemplateColumns: template }}
      >
        {columns.map((col) => (
          <button
            key={col.key}
            type="button"
            disabled={!col.sort}
            onClick={() => col.sort && toggleSort(col.key)}
            className={cn(
              'flex items-center gap-1 text-[10px] font-semibold tracking-[0.12em] text-ink-4 uppercase',
              col.align === 'right' && 'justify-end',
              col.sort ? 'hover:text-ink-2' : 'cursor-default',
              sort?.key === col.key && 'text-cyan',
            )}
          >
            <span className="truncate">{col.header}</span>
            {sort?.key === col.key ? (
              sort.dir === 'asc' ? (
                <ChevronUp className="size-3 shrink-0" />
              ) : (
                <ChevronDown className="size-3 shrink-0" />
              )
            ) : null}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {sorted.map((row) => {
          const key = rowKey(row)
          const selected = selectedKey === key
          return (
            <div
              key={key}
              role="row"
              tabIndex={onSelect ? 0 : -1}
              onClick={() => onSelect?.(row)}
              onKeyDown={(e) => {
                if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onSelect(row)
                }
              }}
              className={cn(
                'grid items-center gap-x-3 border-b border-line/50 px-3 text-[12px] transition-colors',
                dense ? 'py-1' : 'py-1.5',
                onSelect && 'cursor-pointer',
                selected ? 'bg-cyan/10 ring-1 ring-cyan/25 ring-inset' : 'hover:bg-panel-3/70',
                rowTone?.(row),
              )}
              style={{ gridTemplateColumns: template }}
            >
              {columns.map((col) => (
                <div
                  key={col.key}
                  title={col.title?.(row)}
                  className={cn(
                    'min-w-0 truncate',
                    col.align === 'right' && 'text-right',
                    col.mono && 'tabular font-mono text-[11px]',
                  )}
                >
                  {col.render(row)}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
