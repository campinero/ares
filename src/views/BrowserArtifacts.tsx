import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download, Globe } from 'lucide-react'
import { AXIS, BAR_CURSOR, CHART_COLOR, GRID, TOOLTIP } from '@/components/artifacts-review/chart'
import { CASE, deviceById, personById } from '@/data'
import type { BrowserRecord } from '@/data/types'
import { useCase } from '@/store/useCase'
import { displayTs, formatTs } from '@/lib/time'
import { formatBytes } from '@/lib/format'
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
  SignificanceTag,
  Stat,
  Tabs,
  Toolbar,
  type Column,
} from '@/components/ui'

const KIND_TONE = {
  visit: 'cyan',
  search: 'violet',
  download: 'amber',
  form: 'azure',
} as const

export function BrowserArtifacts() {
  const clockBasis = useCase((s) => s.clockBasis)
  const investigationMode = useCase((s) => s.investigationMode)
  const selectEvidence = useCase((s) => s.selectEvidence)

  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [profiles, setProfiles] = useState<Set<string>>(new Set())
  const [domains, setDomains] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const profileList = useMemo(() => [...new Set(CASE.browser.map((r) => r.profile))].sort(), [])

  const domainCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const record of CASE.browser) map.set(record.domain, (map.get(record.domain) ?? 0) + 1)
    return [...map.entries()].map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count)
  }, [])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CASE.browser.filter((record) => {
      if (investigationMode && record.significance === 'noise') return false
      if (tab === 'downloads' && record.kind !== 'download') return false
      if (tab === 'searches' && record.kind !== 'search') return false
      if (profiles.size > 0 && !profiles.has(record.profile)) return false
      if (domains.size > 0 && !domains.has(record.domain)) return false
      if (!q) return true
      return `${record.url} ${record.title} ${record.domain} ${record.transition}`.toLowerCase().includes(q)
    })
  }, [query, profiles, domains, tab, investigationMode])

  const selected = selectedId ? CASE.browser.find((r) => r.id === selectedId) ?? null : null

  const columns: Column<BrowserRecord>[] = useMemo(
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
        key: 'kind',
        header: 'Kind',
        width: '82px',
        sort: (r) => r.kind,
        render: (r) => <Badge tone={KIND_TONE[r.kind]}>{r.kind}</Badge>,
      },
      {
        key: 'title',
        title: (r) => r.title,
        header: 'Title',
        width: 'minmax(0,1.5fr)',
        sort: (r) => r.title,
        render: (r) => <span className="truncate text-ink-2">{r.title}</span>,
      },
      {
        key: 'url',
        title: (r) => r.url,
        header: 'URL',
        width: 'minmax(0,1.8fr)',
        mono: true,
        sort: (r) => r.url,
        render: (r) => <span className="truncate text-[10px] text-ink-4">{r.url}</span>,
      },
      {
        key: 'domain',
        title: (r) => r.domain,
        header: 'Domain',
        width: 'minmax(0,1fr)',
        mono: true,
        sort: (r) => r.domain,
        render: (r) => <span className="truncate text-ink-3">{r.domain}</span>,
      },
      {
        key: 'visits',
        header: 'Visits',
        width: '58px',
        align: 'right',
        mono: true,
        sort: (r) => r.visitCount,
        render: (r) => <span className="text-ink-3">{r.visitCount}</span>,
      },
      {
        key: 'signif',
        header: 'Signif.',
        width: '84px',
        sort: (r) => r.significance,
        render: (r) => <SignificanceTag value={r.significance} />,
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

  const downloads = CASE.browser.filter((r) => r.kind === 'download')

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="grid shrink-0 gap-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.6fr)]">
        <Panel>
          <Stat label="Records" value={String(CASE.browser.length)} hint={`${rows.length} in view`} icon={<Globe />} />
        </Panel>
        <Panel>
          <Stat label="Downloads" value={String(downloads.length)} icon={<Download />} />
        </Panel>
        <Panel>
          <Stat
            label="Case relevant"
            value={String(CASE.browser.filter((r) => r.significance === 'critical' || r.significance === 'high').length)}
            tone="warn"
            hint="the rest is ordinary browsing"
          />
        </Panel>
        <Panel>
          <PanelHeader title="Visits by domain" readout={`${domainCounts.length} domains`} />
          <div className="min-h-0 flex-1" style={{ height: 92 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainCounts.slice(0, 10)} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="domain" {...AXIS} tick={false} />
                <YAxis {...AXIS} width={26} />
                <Tooltip {...TOOLTIP} cursor={BAR_CURSOR} />
                <Bar dataKey="count" fill={CHART_COLOR.cyan} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(292px,336px)] gap-2">
        <Panel className="min-h-0" lit>
          <PanelHeader title="Browser artifacts" icon={<Globe />} readout={`${rows.length} rows`} />

          <Tabs
            tabs={[
              { id: 'all', label: 'All', count: CASE.browser.length },
              { id: 'downloads', label: 'Downloads', count: downloads.length },
              { id: 'searches', label: 'Searches', count: CASE.browser.filter((r) => r.kind === 'search').length },
            ]}
            active={tab}
            onChange={setTab}
          />

          <Toolbar>
            <SearchInput value={query} onChange={setQuery} placeholder="Search URL, title, domain" className="w-64" />
            {profileList.map((profile) => (
              <FilterChip
                key={profile}
                active={profiles.has(profile)}
                onClick={() => toggle(profiles, profile, setProfiles)}
                count={CASE.browser.filter((r) => r.profile === profile).length}
              >
                {profile}
              </FilterChip>
            ))}
            {domains.size > 0 ? (
              <button
                type="button"
                onClick={() => setDomains(new Set())}
                className="text-[10px] tracking-[0.08em] text-ink-4 uppercase hover:text-cyan"
              >
                clear domains
              </button>
            ) : null}
          </Toolbar>

          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            selectedKey={selectedId}
            onSelect={(r) => setSelectedId(r.id)}
            initialSort={{ key: 'at', dir: 'asc' }}
            dense
            rowTone={(r) =>
              r.significance === 'critical' ? 'border-l-2 border-l-signal/60' : undefined
            }
            empty={
              <EmptyState
                title="No browser record matches"
                hint="Clear a facet or widen the search."
                action={
                  <Button
                    onClick={() => {
                      setQuery('')
                      setProfiles(new Set())
                      setDomains(new Set())
                      setTab('all')
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
          <PanelHeader title="Record detail" subtitle={selected ? selected.kind : 'Nothing selected'} />
          <div className="min-h-0 flex-1 overflow-auto">
            {!selected ? (
              <div>
                <EmptyState
                  title="No record selected"
                  hint="Pick a row to see the full URL, referrer and profile. Use the domain facet below to separate case-relevant browsing from routine traffic."
                  icon={<Globe />}
                />
                <SectionLabel>Domains</SectionLabel>
                <div className="px-3 pb-4">
                  {domainCounts.map((entry) => (
                    <button
                      key={entry.domain}
                      type="button"
                      onClick={() => toggle(domains, entry.domain, setDomains)}
                      className={cn(
                        'flex w-full items-center gap-2 border-b border-line/50 px-1 py-1 text-left last:border-0',
                        domains.has(entry.domain) ? 'text-cyan' : 'text-ink-3 hover:text-ink',
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate font-mono text-[11px]">{entry.domain}</span>
                      <span className="tabular font-mono text-[10px] text-ink-4">{entry.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone={KIND_TONE[selected.kind]}>{selected.kind}</Badge>
                    <SignificanceTag value={selected.significance} />
                    {selected.hostClock ? <Badge tone="amber">host clock</Badge> : null}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-snug text-ink">{selected.title}</p>
                  <p className="tabular mt-1 font-mono text-[11px] break-all text-cyan">{selected.url}</p>
                </div>

                <dl className="rounded-[2px] border border-line">
                  <FieldRow label="Time" value={formatTs(displayTs(selected.at, clockBasis, selected.hostClock))} mono />
                  <FieldRow label="Domain" value={selected.domain} mono />
                  <FieldRow label="Browser" value={selected.browser} />
                  <FieldRow label="Profile" value={selected.profile} />
                  <FieldRow label="Transition" value={selected.transition} mono />
                  <FieldRow label="Visit count" value={String(selected.visitCount)} mono />
                  {selected.referrer ? <FieldRow label="Referrer" value={selected.referrer} mono /> : null}
                  {selected.targetPath ? <FieldRow label="Saved to" value={selected.targetPath} mono /> : null}
                  {selected.bytes ? <FieldRow label="Size" value={formatBytes(selected.bytes, 1)} mono /> : null}
                  {selected.deviceId ? (
                    <FieldRow label="Device" value={deviceById.get(selected.deviceId)?.name ?? selected.deviceId} />
                  ) : null}
                  {selected.personId ? (
                    <FieldRow label="Person" value={personById.get(selected.personId)?.name ?? selected.personId} />
                  ) : null}
                </dl>

                {selected.evidenceId ? (
                  <Button tone="primary" onClick={() => selectEvidence(selected.evidenceId as string)}>
                    Open {selected.evidenceId}
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}
