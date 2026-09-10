import { useMemo, useState } from 'react'
import { ClipboardList, ShieldAlert, ShieldCheck, Signature } from 'lucide-react'
import { CASE, evidenceById } from '@/data'
import type { CustodyAction, CustodyEvent } from '@/data/types'
import { useCase } from '@/store/useCase'
import { useForensicsWorker } from '@/hooks/useForensicsWorker'
import { formatIso, formatTs } from '@/lib/time'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  Badge,
  Button,
  EmptyState,
  FieldRow,
  HashText,
  Panel,
  PanelHeader,
  ProgressSweep,
  SearchInput,
  SectionLabel,
  Stat,
  TextInput,
  Toolbar,
  type Tone,
} from '@/components/ui'
import { CopyTextButton } from '@/components/artifact'

const ACTIONS: CustodyAction[] = ['ACQUIRED', 'TRANSFERRED', 'ANALYZED', 'VERIFIED', 'SEALED', 'RELEASED', 'NOTE']

const ACTION_TONE: Record<CustodyAction, Tone> = {
  ACQUIRED: 'cyan',
  TRANSFERRED: 'azure',
  ANALYZED: 'violet',
  VERIFIED: 'jade',
  SEALED: 'amber',
  RELEASED: 'neutral',
  NOTE: 'neutral',
}

export function ChainOfCustody() {
  const custody = useCase((s) => s.custody)
  const addCustodyEvent = useCase((s) => s.addCustodyEvent)
  const selectEvidence = useCase((s) => s.selectEvidence)
  const worker = useForensicsWorker()

  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(CASE.evidence[0]?.id ?? null)
  const [form, setForm] = useState({
    action: 'ANALYZED' as CustodyAction,
    custodian: '',
    to: '',
    method: '',
    note: '',
    hashVerified: true,
  })

  const chains = useMemo(() => {
    const map = new Map<string, CustodyEvent[]>()
    for (const entry of custody) {
      const list = map.get(entry.evidenceId) ?? []
      list.push(entry)
      map.set(entry.evidenceId, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.at - b.at)
    return map
  }, [custody])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CASE.evidence.filter((item) => {
      if (!q) return true
      return `${item.id} ${item.label} ${item.type}`.toLowerCase().includes(q)
    })
  }, [query])

  const selected = selectedId ? evidenceById.get(selectedId) : undefined
  const chain = selectedId ? chains.get(selectedId) ?? [] : []

  const unverified = custody.filter((c) => !c.hashVerified)
  const sealed = new Set(custody.filter((c) => c.action === 'SEALED').map((c) => c.evidenceId))
  const mismatches = worker.results.filter((r) => !r.match)
  const selectedResult = worker.results.find((r) => r.id === selectedId)

  function currentCustodian(evidenceId: string): string {
    const list = chains.get(evidenceId)
    if (!list || list.length === 0) return 'not yet in custody'
    const last = list[list.length - 1]
    return last.to ?? last.custodian
  }

  function ledgerText(entries: CustodyEvent[]): string {
    return entries
      .map((entry) => {
        const item = evidenceById.get(entry.evidenceId)
        return [
          `${formatIso(entry.at)}  ${entry.action}`,
          `  Evidence   ${entry.evidenceId}${item ? ` - ${item.label}` : ''}`,
          `  Custodian  ${entry.custodian}`,
          entry.from ? `  From       ${entry.from}` : null,
          entry.to ? `  To         ${entry.to}` : null,
          `  Method     ${entry.method}`,
          `  Digest     ${entry.hashVerified ? 'verified' : 'NOT VERIFIED'}`,
          `  Note       ${entry.note}`,
        ]
          .filter(Boolean)
          .join('\n')
      })
      .join('\n\n')
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-5">
        <Panel>
          <Stat label="Artifacts" value={String(CASE.evidence.length)} icon={<ClipboardList />} />
        </Panel>
        <Panel>
          <Stat label="Custody entries" value={String(custody.length)} />
        </Panel>
        <Panel>
          <Stat label="Sealed" value={String(sealed.size)} tone="good" />
        </Panel>
        <Panel>
          <Stat
            label="Digest exceptions"
            value={String(unverified.length + mismatches.length)}
            tone={unverified.length + mismatches.length > 0 ? 'alert' : 'good'}
            icon={<ShieldAlert />}
          />
        </Panel>
        <Panel>
          <Stat
            label="Last sweep"
            value={worker.results.length ? `${worker.results.length} objects` : 'not run'}
            hint={worker.results.length ? `${worker.elapsedMs} ms off-thread` : 'run the integrity sweep'}
          />
        </Panel>
      </div>

      <Panel className="shrink-0">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">
          <Button tone="primary" onClick={worker.verifyAll} disabled={worker.running}>
            <ShieldCheck />
            {worker.running ? 'Verifying' : 'Verify every artifact'}
          </Button>
          <Button onClick={() => selectedId && worker.verifyOne(selectedId)} disabled={worker.running || !selectedId}>
            Verify selected
          </Button>
          {worker.running ? (
            <span className="tabular font-mono text-[11px] text-cyan">
              {worker.current} - {worker.done}/{worker.total}
            </span>
          ) : worker.results.length > 0 ? (
            <span className={cn('text-[11px]', mismatches.length > 0 ? 'text-signal' : 'text-jade')}>
              {mismatches.length > 0
                ? `${mismatches.length} of ${worker.results.length} digests do not match`
                : `all ${worker.results.length} recomputed digests match the case file`}
            </span>
          ) : (
            <span className="text-[11px] text-ink-4">
              Digests are recomputed from the artifact data objects in a worker thread, not read back from storage.
            </span>
          )}
          <div className="flex-1" />
          <CopyTextButton text={ledgerText(custody)} label="Copy whole ledger" />
        </div>
        <ProgressSweep active={worker.running} />
      </Panel>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(320px,376px)_minmax(0,1fr)] gap-2">
        <Panel className="min-h-0">
          <PanelHeader title="Evidence in custody" readout={`${rows.length} items`} />
          <Toolbar>
            <SearchInput value={query} onChange={setQuery} placeholder="Search artifact" className="w-full" />
          </Toolbar>
          <div className="min-h-0 flex-1 overflow-auto">
            {rows.map((item) => {
              const active = item.id === selectedId
              const entries = chains.get(item.id) ?? []
              const result = worker.results.find((r) => r.id === item.id)
              const exception = entries.some((e) => !e.hashVerified) || (result && !result.match)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    'relative flex w-full flex-col gap-0.5 border-b border-line/60 px-3 py-2 text-left transition-colors',
                    active ? 'bg-cyan/10' : 'hover:bg-panel-2',
                  )}
                >
                  {active ? <span className="absolute inset-y-0 left-0 w-[2px] bg-cyan" /> : null}
                  <div className="flex items-center gap-2">
                    <span className="tabular font-mono text-[11px] text-cyan">{item.id}</span>
                    {sealed.has(item.id) ? <Badge tone="amber">sealed</Badge> : null}
                    {exception ? <Badge tone="signal">exception</Badge> : null}
                    {result?.match ? <Badge tone="jade">verified</Badge> : null}
                  </div>
                  <span className="truncate text-[12px] text-ink-2">{item.label}</span>
                  <span className="truncate text-[10px] text-ink-4">
                    {entries.length} entries - {currentCustodian(item.id)}
                  </span>
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel className="min-h-0" lit>
          <PanelHeader
            title={selected ? `Custody ledger - ${selected.id}` : 'Custody ledger'}
            subtitle={selected?.label}
            readout={`${chain.length} entries`}
            actions={selected ? <CopyTextButton text={ledgerText(chain)} label="Copy ledger" /> : undefined}
          />

          <div className="min-h-0 flex-1 overflow-auto">
            {!selected ? (
              <EmptyState title="No artifact selected" hint="Choose an artifact to review its chain of custody." />
            ) : (
              <div className="flex flex-col gap-3 p-3">
                <dl className="rounded-[2px] border border-line">
                  <FieldRow label="Evidence ID" value={selected.id} mono />
                  <FieldRow label="Collector" value={chain[0]?.custodian ?? 'not recorded'} />
                  <FieldRow label="Acquisition" value={formatIso(selected.acquiredAt)} mono />
                  <FieldRow label="Current custodian" value={currentCustodian(selected.id)} />
                  <FieldRow label="SHA-256" value={<HashText value={selected.hashes.sha256} />} />
                  <FieldRow
                    label="Integrity"
                    value={
                      selectedResult ? (
                        selectedResult.match ? (
                          <span className="text-jade">
                            recomputed over {formatNumber(selectedResult.byteLength)} bytes and matched
                          </span>
                        ) : (
                          <span className="text-signal">recomputed digest does not match the case file</span>
                        )
                      ) : (
                        <span className="text-ink-4">not verified this session</span>
                      )
                    }
                  />
                </dl>

                {chain.some((e) => !e.hashVerified) ? (
                  <div className="rounded-[2px] border border-signal/30 bg-signal/[0.06] px-3 py-2">
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-signal uppercase">Open exception</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-2">
                      One or more entries in this chain were recorded without a verified digest. Resolve it before the
                      report is signed.
                    </p>
                  </div>
                ) : null}

                <SectionLabel>Ledger</SectionLabel>
                <ol className="relative border-l border-line pl-4">
                  {chain.length === 0 ? (
                    <p className="text-[11px] text-ink-4">No custody entry exists for this artifact yet.</p>
                  ) : (
                    chain.map((entry) => (
                      <li key={entry.id} className="relative pb-3 last:pb-0">
                        <span
                          className={cn(
                            'absolute top-[6px] -left-[21px] size-[7px] rounded-full border-2 border-void',
                            entry.hashVerified ? 'bg-jade' : 'bg-signal',
                          )}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={ACTION_TONE[entry.action]}>{entry.action}</Badge>
                          <span className="tabular font-mono text-[11px] text-ink-3">{formatTs(entry.at)}</span>
                          {!entry.hashVerified ? <Badge tone="signal">digest unverified</Badge> : null}
                          {!entry.builtIn ? <Badge tone="violet">added by you</Badge> : null}
                        </div>
                        <p className="mt-1 text-[12px] text-ink-2">{entry.note}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-ink-4">
                          <span>
                            Custodian <span className="text-ink-3">{entry.custodian}</span>
                          </span>
                          {entry.from ? (
                            <span>
                              From <span className="text-ink-3">{entry.from}</span>
                            </span>
                          ) : null}
                          {entry.to ? (
                            <span>
                              To <span className="text-ink-3">{entry.to}</span>
                            </span>
                          ) : null}
                          <span>
                            Method <span className="text-ink-3">{entry.method}</span>
                          </span>
                        </div>
                      </li>
                    ))
                  )}
                </ol>

                <SectionLabel>Record a custody event</SectionLabel>
                <div className="rounded-[2px] border border-line p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {ACTIONS.map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, action }))}
                        className={cn(
                          'rounded-[2px] border px-1.5 py-[2px] text-[10px] tracking-[0.08em] uppercase transition-colors',
                          form.action === action
                            ? 'border-cyan/45 bg-cyan/12 text-cyan'
                            : 'border-line bg-panel-2 text-ink-4 hover:text-ink-2',
                        )}
                      >
                        {action}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 grid gap-1.5 md:grid-cols-2">
                    <TextInput
                      value={form.custodian}
                      onChange={(e) => setForm((f) => ({ ...f, custodian: e.target.value }))}
                      placeholder="Custodian (required)"
                    />
                    <TextInput
                      value={form.to}
                      onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
                      placeholder="Transferred to (optional)"
                    />
                    <TextInput
                      value={form.method}
                      onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                      placeholder="Method (required)"
                      className="md:col-span-2"
                    />
                    <TextInput
                      value={form.note}
                      onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                      placeholder="Note"
                      className="md:col-span-2"
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, hashVerified: !f.hashVerified }))}
                      className={cn(
                        'rounded-[2px] border px-2 py-[3px] text-[10px] tracking-[0.08em] uppercase',
                        form.hashVerified
                          ? 'border-jade/40 bg-jade/10 text-jade'
                          : 'border-signal/40 bg-signal/10 text-signal',
                      )}
                    >
                      {form.hashVerified ? 'digest verified' : 'digest not verified'}
                    </button>
                    <div className="flex-1" />
                    <Button
                      tone="primary"
                      disabled={!form.custodian.trim() || !form.method.trim()}
                      onClick={() => {
                        if (!selectedId || !form.custodian.trim() || !form.method.trim()) return
                        addCustodyEvent({
                          evidenceId: selectedId,
                          action: form.action,
                          custodian: form.custodian.trim(),
                          to: form.to.trim() || undefined,
                          method: form.method.trim(),
                          note: form.note.trim() || 'No note recorded.',
                          hashVerified: form.hashVerified,
                        })
                        setForm({ action: 'ANALYZED', custodian: '', to: '', method: '', note: '', hashVerified: true })
                      }}
                    >
                      <Signature />
                      Append entry
                    </Button>
                  </div>
                  <p className="mt-1.5 text-[10px] text-ink-4">
                    Entries you add are stored with the case file in this browser and appear in the report.
                  </p>
                </div>

                <Button onClick={() => selectEvidence(selected.id)}>Open artifact in inspector</Button>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}
