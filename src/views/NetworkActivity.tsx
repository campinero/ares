import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Cable, ShieldX } from 'lucide-react'
import { AXIS, BAR_CURSOR, CHART_COLOR, GRID, TOOLTIP, bucketOf, bucketRange } from '@/components/artifacts-review/chart'
import { CASE, T } from '@/data'
import type { NetworkFlow } from '@/data/types'
import { useCase } from '@/store/useCase'
import { displayTs, formatClock, formatTs } from '@/lib/time'
import { formatBytes, formatNumber, truncateMiddle } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  FieldRow,
  FilterChip,
  Panel,
  PanelHeader,
  SearchInput,
  SectionLabel,
  Stat,
  Toolbar,
  type Column,
} from '@/components/ui'

const STATUS_TONE = {
  blocked: 'signal',
  reset: 'amber',
  timeout: 'amber',
  allowed: 'jade',
  established: 'cyan',
  closed: 'neutral',
} as const

export function NetworkActivity() {
  const clockBasis = useCase((s) => s.clockBasis)
  const investigationMode = useCase((s) => s.investigationMode)
  const selectEvidence = useCase((s) => s.selectEvidence)

  const [query, setQuery] = useState('')
  const [protocols, setProtocols] = useState<Set<string>>(new Set())
  const [statuses, setStatuses] = useState<Set<string>>(new Set())
  const [sources, setSources] = useState<Set<string>>(new Set())
  const [minScore, setMinScore] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [chartScope, setChartScope] = useState<'incident' | 'all'>('incident')

  const protocolList = useMemo(() => [...new Set(CASE.network.map((f) => f.protocol))].sort(), [])
  const statusList = useMemo(() => [...new Set(CASE.network.map((f) => f.status))].sort(), [])
  const sourceList = useMemo(() => [...new Set(CASE.network.map((f) => f.sourceHost))].sort(), [])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CASE.network.filter((flow) => {
      if (investigationMode && flow.significance === 'noise') return false
      if (protocols.size > 0 && !protocols.has(flow.protocol)) return false
      if (statuses.size > 0 && !statuses.has(flow.status)) return false
      if (sources.size > 0 && !sources.has(flow.sourceHost)) return false
      if (flow.anomalyScore < minScore) return false
      if (!q) return true
      return `${flow.sourceHost} ${flow.sourceIp} ${flow.destHost} ${flow.destIp} ${flow.domain ?? ''} ${flow.protocol} ${flow.rule ?? ''}`
        .toLowerCase()
        .includes(q)
    })
  }, [query, protocols, statuses, sources, minScore, investigationMode])

  const selected = selectedId ? CASE.network.find((f) => f.id === selectedId) ?? null : null

  const blocked = rows.filter((f) => f.status === 'blocked')
  const totalOut = rows.reduce((sum, f) => sum + f.bytesOut, 0)
  const peakScore = rows.reduce((max, f) => Math.max(max, f.anomalyScore), 0)

  const chartRows = useMemo(() => {
    if (chartScope === 'all') return rows
    const from = T.rdpSessionStart - 20 * 60_000
    const to = T.whitfieldBadgeExit + 20 * 60_000
    const scoped = rows.filter((f) => f.at >= from && f.at <= to)
    return scoped.length > 0 ? scoped : rows
  }, [rows, chartScope])

  const talkers = useMemo(() => {
    const map = new Map<string, number>()
    for (const flow of chartRows) map.set(flow.destHost, (map.get(flow.destHost) ?? 0) + flow.bytesOut + flow.bytesIn)
    return [...map.entries()]
      .map(([host, bytes]) => ({ host, bytes }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 8)
  }, [chartRows])

  const volume = useMemo(() => {
    if (chartRows.length === 0) return []
    const range = bucketRange(chartRows.map((f) => f.at), 20)
    const buckets = Array.from({ length: range.count }, (_, i) => ({
      t: range.start + i * range.size,
      out: 0,
      in: 0,
    }))
    for (const flow of chartRows) {
      const index = bucketOf(flow.at, range)
      if (index < 0 || index >= buckets.length) continue
      buckets[index].out += flow.bytesOut
      buckets[index].in += flow.bytesIn
    }
    return buckets.map((b) => ({ label: formatClock(b.t).slice(0, 5), out: b.out, in: b.in }))
  }, [chartRows])

  const columns: Column<NetworkFlow>[] = useMemo(
    () => [
      {
        key: 'at',
        header: 'Time',
        width: '138px',
        mono: true,
        sort: (r) => r.at,
        render: (r) => (
          <span className={cn(r.hostClock && clockBasis === 'host' ? 'text-amber' : 'text-ink-3')}>
            {formatTs(displayTs(r.at, clockBasis, r.hostClock))}
          </span>
        ),
      },
      {
        key: 'source',
        title: (r) => `${r.sourceHost} ${r.sourceIp}`,
        header: 'Source',
        width: 'minmax(0,1fr)',
        sort: (r) => r.sourceHost,
        render: (r) => (
          <span className="truncate text-ink-2">
            {r.sourceHost} <span className="tabular font-mono text-[10px] text-ink-4">{r.sourceIp}</span>
          </span>
        ),
      },
      {
        key: 'dest',
        title: (r) => `${r.domain ?? r.destHost} ${r.destIp}`,
        header: 'Destination',
        width: 'minmax(0,1.4fr)',
        sort: (r) => r.destHost,
        render: (r) => (
          <span className="truncate text-ink-2">
            {r.domain ?? r.destHost} <span className="tabular font-mono text-[10px] text-ink-4">{r.destIp}</span>
          </span>
        ),
      },
      {
        key: 'proto',
        header: 'Proto',
        width: '68px',
        mono: true,
        sort: (r) => r.protocol,
        render: (r) => <span className="text-ink-3">{r.protocol}</span>,
      },
      {
        key: 'port',
        header: 'Port',
        width: '54px',
        align: 'right',
        mono: true,
        sort: (r) => r.port,
        render: (r) => <span className="text-ink-3">{r.port}</span>,
      },
      {
        key: 'out',
        header: 'Bytes out',
        width: '92px',
        align: 'right',
        mono: true,
        sort: (r) => r.bytesOut,
        render: (r) => (
          <span className={r.bytesOut > 1_000_000 ? 'text-amber' : 'text-ink-3'}>{formatBytes(r.bytesOut, 1)}</span>
        ),
      },
      {
        key: 'in',
        header: 'Bytes in',
        width: '92px',
        align: 'right',
        mono: true,
        sort: (r) => r.bytesIn,
        render: (r) => (
          <span className={r.bytesIn > 1_000_000 ? 'text-amber' : 'text-ink-3'}>{formatBytes(r.bytesIn, 1)}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '96px',
        sort: (r) => r.status,
        render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>,
      },
      {
        key: 'score',
        header: 'Anomaly',
        width: '86px',
        align: 'right',
        mono: true,
        sort: (r) => r.anomalyScore,
        render: (r) => (
          <span className={r.anomalyScore >= 70 ? 'text-signal' : r.anomalyScore >= 40 ? 'text-amber' : 'text-ink-4'}>
            {r.anomalyScore}
          </span>
        ),
      },
    ],
    [clockBasis],
  )

  function toggle(set: Set<string>, value: string, apply: (next: Set<string>) => void) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    apply(next)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        <Panel>
          <Stat label="Flows in view" value={String(rows.length)} hint={`of ${CASE.network.length}`} icon={<Cable />} />
        </Panel>
        <Panel>
          <Stat label="Blocked" value={String(blocked.length)} tone="alert" icon={<ShieldX />} />
        </Panel>
        <Panel>
          <Stat label="Bytes out" value={formatBytes(totalOut, 1)} hint="aggregate egress in view" />
        </Panel>
        <Panel>
          <Stat label="Peak anomaly" value={String(peakScore)} tone={peakScore >= 70 ? 'alert' : 'default'} />
        </Panel>
      </div>

      <div className="grid shrink-0 gap-2 lg:grid-cols-2" style={{ height: 186 }}>
        <Panel>
          <PanelHeader
            title="Egress volume"
            readout={chartScope === 'incident' ? 'incident window' : 'full case span'}
            actions={
              <>
                <FilterChip active={chartScope === 'incident'} onClick={() => setChartScope('incident')}>
                  Incident
                </FilterChip>
                <FilterChip active={chartScope === 'all'} onClick={() => setChartScope('all')}>
                  Full span
                </FilterChip>
              </>
            }
          />
          <div className="min-h-0 flex-1 px-1 pb-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volume} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" {...AXIS} />
                <YAxis {...AXIS} tickFormatter={(v) => formatBytes(Number(v), 0)} width={58} />
                <Tooltip
                  {...TOOLTIP}
                  cursor={BAR_CURSOR}
                  formatter={((value: unknown, name: unknown) => [formatBytes(Number(value), 1), String(name)]) as never}
                />
                <Bar dataKey="in" stackId="v" fill={CHART_COLOR.cyanDim} />
                <Bar dataKey="out" stackId="v" fill={CHART_COLOR.cyan} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Top destinations by volume" readout={`${talkers.length} hosts`} />
          <div className="min-h-0 flex-1 px-1 pb-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={talkers} layout="vertical" margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid {...GRID} horizontal={false} />
                <XAxis type="number" {...AXIS} tickFormatter={(v) => formatBytes(Number(v), 0)} />
                <YAxis
                  type="category"
                  dataKey="host"
                  {...AXIS}
                  width={150}
                  tickFormatter={(v) => truncateMiddle(String(v), 22)}
                />
                <Tooltip {...TOOLTIP} cursor={BAR_CURSOR} formatter={((value: unknown) => [formatBytes(Number(value), 1), 'total']) as never} />
                <Bar dataKey="bytes" fill={CHART_COLOR.azure} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(292px,336px)] gap-2">
        <Panel className="min-h-0" lit>
          <PanelHeader title="Flow log" icon={<Cable />} readout={`${rows.length} rows`} />

          <Toolbar>
            <SearchInput value={query} onChange={setQuery} placeholder="Search host, address, domain, rule" className="w-64" />
            <div className="mx-1 h-5 w-px bg-line" />
            {statusList.map((status) => (
              <FilterChip
                key={status}
                active={statuses.has(status)}
                onClick={() => toggle(statuses, status, setStatuses)}
                count={CASE.network.filter((f) => f.status === status).length}
              >
                {status}
              </FilterChip>
            ))}
            <div className="flex-1" />
            <span className="text-[10px] tracking-[0.1em] text-ink-4 uppercase">Anomaly &gt;= {minScore}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              aria-label="Minimum anomaly score"
              className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-line accent-cyan"
            />
          </Toolbar>

          <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-line bg-abyss/30 px-3 py-1.5">
            {protocolList.map((protocol) => (
              <FilterChip
                key={protocol}
                active={protocols.has(protocol)}
                onClick={() => toggle(protocols, protocol, setProtocols)}
                count={CASE.network.filter((f) => f.protocol === protocol).length}
              >
                {protocol}
              </FilterChip>
            ))}
            <div className="mx-1 h-4 w-px bg-line" />
            {sourceList.slice(0, 6).map((host) => (
              <FilterChip
                key={host}
                active={sources.has(host)}
                onClick={() => toggle(sources, host, setSources)}
                count={CASE.network.filter((f) => f.sourceHost === host).length}
              >
                {host}
              </FilterChip>
            ))}
          </div>

          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            selectedKey={selectedId}
            onSelect={(r) => setSelectedId(r.id)}
            initialSort={{ key: 'at', dir: 'asc' }}
            dense
            rowTone={(r) => (r.status === 'blocked' ? 'border-l-2 border-l-signal/70' : undefined)}
            empty={
              <EmptyState
                title="No flow matches the current filter"
                hint="Lower the anomaly threshold or clear a facet."
                action={
                  <Button
                    onClick={() => {
                      setQuery('')
                      setProtocols(new Set())
                      setStatuses(new Set())
                      setSources(new Set())
                      setMinScore(0)
                    }}
                  >
                    Reset filters
                  </Button>
                }
              />
            }
          />
        </Panel>

        <Panel className="min-h-0">
          <PanelHeader
            title="Flow detail"
            subtitle={selected ? `${selected.protocol} port ${selected.port}` : 'Nothing selected'}
          />
          <div className="min-h-0 flex-1 overflow-auto">
            {!selected ? (
              <EmptyState
                title="No flow selected"
                hint="Select a row to see the full record and the artifact it was exported from. Compare bytes out against the size of the object under investigation."
                icon={<Cable />}
              />
            ) : (
              <div className="flex flex-col gap-3 p-3">
                <FlowDiagram flow={selected} />

                <dl className="rounded-[2px] border border-line">
                  <FieldRow label="Time" value={formatTs(displayTs(selected.at, clockBasis, selected.hostClock))} mono />
                  <FieldRow label="Source" value={`${selected.sourceHost} (${selected.sourceIp})`} mono />
                  <FieldRow label="Destination" value={`${selected.destHost} (${selected.destIp})`} mono />
                  {selected.domain ? <FieldRow label="Domain" value={selected.domain} mono /> : null}
                  <FieldRow label="Protocol" value={`${selected.protocol} / ${selected.port}`} mono />
                  <FieldRow
                    label="Bytes out"
                    value={`${formatBytes(selected.bytesOut, 1)} (${formatNumber(selected.bytesOut)})`}
                    mono
                  />
                  <FieldRow
                    label="Bytes in"
                    value={`${formatBytes(selected.bytesIn, 1)} (${formatNumber(selected.bytesIn)})`}
                    mono
                  />
                  <FieldRow label="Duration" value={`${formatNumber(selected.durationMs)} ms`} mono />
                  <FieldRow label="Status" value={<Badge tone={STATUS_TONE[selected.status]}>{selected.status}</Badge>} />
                  <FieldRow label="Anomaly score" value={`${selected.anomalyScore} / 100`} mono />
                  {selected.rule ? <FieldRow label="Rule" value={selected.rule} /> : null}
                </dl>

                {selected.status === 'blocked' ? (
                  <div className="rounded-[2px] border border-signal/30 bg-signal/[0.06] px-3 py-2">
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-signal uppercase">Egress denied</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-2">
                      {formatNumber(selected.bytesOut)} bytes left the estate on this flow. Compare that against the
                      size of any object suspected of having been transferred before treating the network as the
                      exfiltration path.
                    </p>
                  </div>
                ) : null}

                {selected.evidenceId ? (
                  <>
                    <SectionLabel>Backing artifact</SectionLabel>
                    <Button tone="primary" onClick={() => selectEvidence(selected.evidenceId as string)}>
                      Open {selected.evidenceId}
                    </Button>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}

/** Source to destination diagram, laid out deterministically. */
function FlowDiagram({ flow }: { flow: NetworkFlow }) {
  const denied = flow.status === 'blocked' || flow.status === 'reset' || flow.status === 'timeout'
  const stroke = denied ? '#ef5340' : '#33c9de'
  const ratio = Math.max(0.06, Math.min(1, Math.log10(Math.max(10, flow.bytesOut)) / 9))

  return (
    <svg viewBox="0 0 300 92" className="w-full rounded-[2px] border border-line bg-abyss/50">
      <line x1="46" y1="46" x2="254" y2="46" stroke="#16202c" strokeWidth="1.5" />
      <line
        x1="46"
        y1="46"
        x2={denied ? 168 : 254}
        y2="46"
        stroke={stroke}
        strokeWidth={1 + ratio * 7}
        opacity="0.75"
      />
      {denied ? (
        <>
          <line x1="168" y1="30" x2="168" y2="62" stroke="#ef5340" strokeWidth="2" />
          <text x="168" y="24" textAnchor="middle" fill="#ef5340" style={{ fontSize: 8, fontFamily: 'ui-monospace' }}>
            DENIED
          </text>
        </>
      ) : null}

      <circle cx="46" cy="46" r="9" fill="#0d131c" stroke="#33c9de" strokeWidth="1.5" />
      <circle cx="254" cy="46" r="9" fill="#0d131c" stroke={denied ? '#ef5340' : '#34c98b'} strokeWidth="1.5" />

      <text x="46" y="70" textAnchor="middle" fill="#a3b4c7" style={{ fontSize: 8, fontFamily: 'ui-monospace' }}>
        {flow.sourceHost}
      </text>
      <text x="46" y="80" textAnchor="middle" fill="#6a7f96" style={{ fontSize: 7, fontFamily: 'ui-monospace' }}>
        {flow.sourceIp}
      </text>
      <text x="254" y="70" textAnchor="middle" fill="#a3b4c7" style={{ fontSize: 8, fontFamily: 'ui-monospace' }}>
        {(flow.domain ?? flow.destHost).slice(0, 26)}
      </text>
      <text x="254" y="80" textAnchor="middle" fill="#6a7f96" style={{ fontSize: 7, fontFamily: 'ui-monospace' }}>
        {flow.destIp}
      </text>
      <text x="150" y="16" textAnchor="middle" fill={stroke} style={{ fontSize: 8, fontFamily: 'ui-monospace' }}>
        {formatBytes(flow.bytesOut, 1)} out / {formatBytes(flow.bytesIn, 1)} in
      </text>
    </svg>
  )
}
