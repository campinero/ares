import { useMemo, useState } from 'react'
import { CheckCircle2, Flag, FileSearch } from 'lucide-react'
import { CASE, deviceById } from '@/data'
import type { EvidenceCategory, EvidenceItem, EvidenceStatus, Significance } from '@/data/types'
import { SIGNIFICANCE_ORDER } from '@/data/types'
import { useCase } from '@/store/useCase'
import { displayTs, formatTs } from '@/lib/time'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  Button,
  DataTable,
  EmptyState,
  FilterChip,
  Panel,
  PanelHeader,
  SearchInput,
  SignificanceTag,
  Stat,
  StatusPill,
  Toolbar,
  type Column,
} from '@/components/ui'

const CATEGORIES: EvidenceCategory[] = [
  'disk',
  'filesystem',
  'log',
  'browser',
  'network',
  'usb',
  'comms',
  'registry',
  'facility',
]

const STATUSES: EvidenceStatus[] = ['verified', 'analyzed', 'pending', 'contested', 'excluded']
const SIGNIFICANCES: Significance[] = ['critical', 'high', 'moderate', 'low', 'noise']

export function Evidence() {
  const clockBasis = useCase((s) => s.clockBasis)
  const investigationMode = useCase((s) => s.investigationMode)
  const selectedEvidenceId = useCase((s) => s.selectedEvidenceId)
  const selectEvidence = useCase((s) => s.selectEvidence)
  const reviewed = useCase((s) => s.reviewed)
  const flagged = useCase((s) => s.flagged)
  const toggleReviewed = useCase((s) => s.toggleReviewed)
  const toggleFlagged = useCase((s) => s.toggleFlagged)

  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<Set<EvidenceCategory>>(new Set())
  const [statuses, setStatuses] = useState<Set<EvidenceStatus>>(new Set())
  const [significances, setSignificances] = useState<Set<Significance>>(new Set())
  const [onlyFlagged, setOnlyFlagged] = useState(false)
  const [onlyUnreviewed, setOnlyUnreviewed] = useState(false)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CASE.evidence.filter((item) => {
      if (investigationMode && item.significance === 'noise') return false
      if (categories.size > 0 && !categories.has(item.category)) return false
      if (statuses.size > 0 && !statuses.has(item.status)) return false
      if (significances.size > 0 && !significances.has(item.significance)) return false
      if (onlyFlagged && !flagged[item.id]) return false
      if (onlyUnreviewed && reviewed[item.id]) return false
      if (!q) return true
      return `${item.id} ${item.label} ${item.type} ${item.source} ${item.path ?? ''} ${item.tags.join(' ')}`
        .toLowerCase()
        .includes(q)
    })
  }, [query, categories, statuses, significances, onlyFlagged, onlyUnreviewed, investigationMode, flagged, reviewed])

  const columns: Column<EvidenceItem>[] = useMemo(
    () => [
      {
        key: 'id',
        header: 'Evidence ID',
        width: '116px',
        mono: true,
        sort: (r) => r.id,
        render: (r) => <span className="text-cyan">{r.id}</span>,
      },
      {
        key: 'label',
        title: (r) => r.label,
        header: 'Artifact',
        width: 'minmax(0,2.1fr)',
        sort: (r) => r.label,
        render: (r) => (
          <span className="flex items-center gap-1.5">
            {flagged[r.id] ? <Flag className="size-3 shrink-0 text-signal" /> : null}
            {reviewed[r.id] ? <CheckCircle2 className="size-3 shrink-0 text-jade" /> : null}
            <span className="truncate text-ink-2">{r.label}</span>
          </span>
        ),
      },
      {
        key: 'type',
        title: (r) => r.type,
        header: 'Type',
        width: 'minmax(0,1.3fr)',
        sort: (r) => r.type,
        render: (r) => <span className="truncate text-ink-3">{r.type}</span>,
      },
      {
        key: 'device',
        header: 'Device',
        width: '108px',
        sort: (r) => r.deviceId ?? '',
        render: (r) => (
          <span className="truncate text-ink-3">{r.deviceId ? deviceById.get(r.deviceId)?.id ?? r.deviceId : '--'}</span>
        ),
      },
      {
        key: 'modified',
        header: 'Modified',
        width: '148px',
        mono: true,
        sort: (r) => r.modifiedAt,
        render: (r) => (
          <span className={cn(r.hostClock && clockBasis === 'host' ? 'text-amber' : 'text-ink-3')}>
            {formatTs(displayTs(r.modifiedAt, clockBasis, r.hostClock))}
          </span>
        ),
      },
      {
        key: 'size',
        header: 'Size',
        width: '82px',
        align: 'right',
        mono: true,
        sort: (r) => r.sizeBytes ?? 0,
        render: (r) => <span className="text-ink-3">{r.sizeBytes ? formatBytes(r.sizeBytes, 0) : '--'}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        width: '92px',
        sort: (r) => r.status,
        render: (r) => <StatusPill value={r.status} />,
      },
      {
        key: 'significance',
        header: 'Signif.',
        width: '84px',
        sort: (r) => SIGNIFICANCE_ORDER[r.significance],
        render: (r) => <SignificanceTag value={r.significance} />,
      },
    ],
    [clockBasis, flagged, reviewed],
  )

  function toggle<T>(set: Set<T>, value: T, apply: (next: Set<T>) => void) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    apply(next)
  }

  const reviewedCount = rows.filter((r) => reviewed[r.id]).length
  const selected = selectedEvidenceId ? CASE.evidence.find((e) => e.id === selectedEvidenceId) : undefined

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-5">
        <Panel>
          <Stat label="In view" value={String(rows.length)} hint={`of ${CASE.evidence.length} artifacts`} />
        </Panel>
        <Panel>
          <Stat
            label="Critical"
            value={String(rows.filter((r) => r.significance === 'critical').length)}
            tone="alert"
          />
        </Panel>
        <Panel>
          <Stat label="Contested" value={String(rows.filter((r) => r.status === 'contested').length)} tone="warn" />
        </Panel>
        <Panel>
          <Stat label="Reviewed" value={`${reviewedCount}/${rows.length}`} tone="good" />
        </Panel>
        <Panel>
          <Stat label="Flagged" value={String(rows.filter((r) => flagged[r.id]).length)} />
        </Panel>
      </div>

      <Panel className="min-h-0 flex-1" lit>
        <PanelHeader
          title="Evidence register"
          icon={<FileSearch />}
          subtitle="Every data object in the case file, with its provenance and review state"
          readout={`${rows.length} rows`}
          actions={
            selected ? (
              <>
                <Button
                  tone={flagged[selected.id] ? 'danger' : 'default'}
                  onClick={() => toggleFlagged(selected.id)}
                  className="h-6"
                >
                  <Flag />
                  {flagged[selected.id] ? 'Flagged' : 'Flag'}
                </Button>
                <Button
                  tone={reviewed[selected.id] ? 'primary' : 'default'}
                  onClick={() => toggleReviewed(selected.id)}
                  className="h-6"
                >
                  <CheckCircle2 />
                  {reviewed[selected.id] ? 'Reviewed' : 'Mark reviewed'}
                </Button>
              </>
            ) : undefined
          }
        />

        <Toolbar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search id, label, type, source, path, tags"
            className="w-72"
          />
          <FilterChip active={onlyFlagged} onClick={() => setOnlyFlagged((v) => !v)}>
            Flagged
          </FilterChip>
          <FilterChip active={onlyUnreviewed} onClick={() => setOnlyUnreviewed((v) => !v)}>
            Unreviewed
          </FilterChip>
          <div className="mx-1 h-5 w-px bg-line" />
          {SIGNIFICANCES.map((value) => (
            <FilterChip
              key={value}
              active={significances.has(value)}
              onClick={() => toggle(significances, value, setSignificances)}
              count={CASE.evidence.filter((e) => e.significance === value).length}
            >
              {value}
            </FilterChip>
          ))}
        </Toolbar>

        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-line bg-abyss/30 px-3 py-1.5">
          {CATEGORIES.map((category) => {
            const count = CASE.evidence.filter((e) => e.category === category).length
            if (count === 0) return null
            return (
              <FilterChip
                key={category}
                active={categories.has(category)}
                onClick={() => toggle(categories, category, setCategories)}
                count={count}
              >
                {category}
              </FilterChip>
            )
          })}
          <div className="mx-1 h-4 w-px bg-line" />
          {STATUSES.map((status) => (
            <FilterChip
              key={status}
              active={statuses.has(status)}
              onClick={() => toggle(statuses, status, setStatuses)}
              count={CASE.evidence.filter((e) => e.status === status).length}
            >
              {status}
            </FilterChip>
          ))}
          {categories.size + statuses.size + significances.size > 0 ? (
            <button
              type="button"
              onClick={() => {
                setCategories(new Set())
                setStatuses(new Set())
                setSignificances(new Set())
              }}
              className="ml-1 text-[10px] tracking-[0.08em] text-ink-4 uppercase hover:text-cyan"
            >
              clear
            </button>
          ) : null}
        </div>

        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          selectedKey={selectedEvidenceId}
          onSelect={(r) => selectEvidence(r.id)}
          initialSort={{ key: 'id', dir: 'asc' }}
          rowTone={(r) => (r.significance === 'critical' ? 'border-l-2 border-l-signal/60' : undefined)}
          empty={
            <EmptyState
              title="No artifact matches the current filter"
              hint="Clear a facet or widen the search to bring the register back."
              icon={<FileSearch />}
              action={
                <Button
                  onClick={() => {
                    setQuery('')
                    setCategories(new Set())
                    setStatuses(new Set())
                    setSignificances(new Set())
                    setOnlyFlagged(false)
                    setOnlyUnreviewed(false)
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          }
        />
      </Panel>
    </div>
  )
}
