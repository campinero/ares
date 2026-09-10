import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Columns2, ShieldAlert, ShieldCheck, Users, X } from 'lucide-react'
import { CASE, deviceById, evidenceForPerson, eventsForPerson } from '@/data'
import type { Person } from '@/data/types'
import { useCase } from '@/store/useCase'
import { displayTs, formatTs } from '@/lib/time'
import { cn } from '@/lib/cn'
import {
  Badge,
  Button,
  EmptyState,
  FieldRow,
  IconButton,
  Meter,
  Panel,
  PanelHeader,
  SEVERITY_TONE,
  SectionLabel,
  SeverityDot,
  SignificanceTag,
  Stat,
} from '@/components/ui'

const BACKSLASH = String.fromCharCode(92)

export function Persons() {
  const clockBasis = useCase((s) => s.clockBasis)
  const selectedPersonId = useCase((s) => s.selectedPersonId)
  const selectPerson = useCase((s) => s.selectPerson)
  const selectEvidence = useCase((s) => s.selectEvidence)
  const selectEvent = useCase((s) => s.selectEvent)
  const navigate = useNavigate()

  const [compareIds, setCompareIds] = useState<string[]>([])

  const selected = selectedPersonId ? CASE.persons.find((p) => p.id === selectedPersonId) ?? null : null
  const comparing = compareIds.length === 2

  const accounts = useMemo(
    () => (selected ? CASE.accounts.filter((a) => a.personId === selected.id) : []),
    [selected],
  )
  const events = useMemo(() => (selected ? eventsForPerson(selected.id) : []), [selected])
  const evidence = useMemo(() => (selected ? evidenceForPerson(selected.id) : []), [selected])

  function togglePin(id: string) {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((c) => c !== id)
      if (current.length >= 2) return [current[1], id]
      return [...current, id]
    })
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(296px,340px)_minmax(0,1fr)] gap-2">
      <Panel className="min-h-0">
        <PanelHeader
          title="Persons of interest"
          icon={<Users />}
          readout={`${CASE.persons.length} subjects`}
          actions={
            compareIds.length > 0 ? (
              <IconButton label="Clear comparison" onClick={() => setCompareIds([])}>
                <X />
              </IconButton>
            ) : undefined
          }
        />
        <div className="border-b border-line bg-abyss/40 px-3 py-1.5">
          <p className="text-[10px] leading-relaxed text-ink-4">
            The meter shows evidentiary association strength, not culpability. A high value means the artifacts point
            at this identity, which is a different question from who was operating the account.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {CASE.persons.map((person) => {
            const active = person.id === selectedPersonId
            const pinned = compareIds.includes(person.id)
            return (
              <div
                key={person.id}
                className={cn(
                  'relative border-b border-line/60 px-3 py-2 transition-colors',
                  active ? 'bg-cyan/10' : 'hover:bg-panel-2',
                )}
              >
                {active ? <span className="absolute inset-y-0 left-0 w-[2px] bg-cyan" /> : null}
                <button type="button" onClick={() => selectPerson(person.id)} className="w-full text-left">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[13px]', active ? 'text-ink' : 'text-ink-2')}>{person.name}</span>
                    <SignificanceTag value={person.significance} />
                  </div>
                  <p className="truncate text-[11px] text-ink-4">
                    {person.role} - {person.department}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Meter
                      value={person.confidence}
                      tone={person.confidence >= 0.6 ? 'amber' : 'cyan'}
                      className="flex-1"
                    />
                    <span className="tabular font-mono text-[11px] text-ink-3">
                      {(person.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </button>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge tone={person.employment === 'contractor' ? 'violet' : 'neutral'}>{person.employment}</Badge>
                  <Badge tone={person.status === 'offboarding' ? 'amber' : 'neutral'}>{person.status}</Badge>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => togglePin(person.id)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-[1px] text-[10px] tracking-[0.08em] uppercase transition-colors',
                      pinned
                        ? 'border-cyan/45 bg-cyan/12 text-cyan'
                        : 'border-line bg-panel-2 text-ink-4 hover:text-ink-2',
                    )}
                  >
                    <Columns2 className="size-3" />
                    {pinned ? 'pinned' : 'compare'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      <Panel className="min-h-0" lit>
        <PanelHeader
          title={comparing ? 'Comparison' : selected ? selected.name : 'Person detail'}
          subtitle={comparing ? 'Indicators and exculpatory facts side by side' : selected?.role}
          readout={selected && !comparing ? selected.id : undefined}
        />

        <div className="min-h-0 flex-1 overflow-auto">
          {comparing ? (
            <ComparisonBoard
              people={compareIds
                .map((id) => CASE.persons.find((p) => p.id === id))
                .filter((p): p is Person => p !== undefined)}
              onClear={() => setCompareIds([])}
            />
          ) : !selected ? (
            <EmptyState
              title="No person selected"
              hint="Choose a subject to review their accounts, devices, activity and the facts that cut both ways."
              icon={<Users />}
            />
          ) : (
            <div className="flex flex-col gap-3 p-3">
              <p className="text-[12px] leading-relaxed text-ink-2">{selected.summary}</p>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-[2px] border border-signal/25 bg-signal/[0.05]">
                  <div className="flex items-center gap-1.5 border-b border-signal/20 px-2.5 py-1.5">
                    <ShieldAlert className="size-3.5 text-signal" />
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-signal uppercase">
                      Indicators
                    </span>
                    <span className="tabular ml-auto font-mono text-[10px] text-ink-4">
                      {selected.indicators.length}
                    </span>
                  </div>
                  <ul className="p-2.5">
                    {selected.indicators.map((fact) => (
                      <li key={fact} className="flex gap-2 border-b border-line/40 py-1.5 last:border-0">
                        <span className="mt-[6px] size-[4px] shrink-0 rounded-full bg-signal" />
                        <span className="text-[11px] leading-relaxed text-ink-2">{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[2px] border border-jade/25 bg-jade/[0.05]">
                  <div className="flex items-center gap-1.5 border-b border-jade/20 px-2.5 py-1.5">
                    <ShieldCheck className="size-3.5 text-jade" />
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-jade uppercase">
                      Exculpatory
                    </span>
                    <span className="tabular ml-auto font-mono text-[10px] text-ink-4">
                      {selected.exculpatory.length}
                    </span>
                  </div>
                  <ul className="p-2.5">
                    {selected.exculpatory.map((fact) => (
                      <li key={fact} className="flex gap-2 border-b border-line/40 py-1.5 last:border-0">
                        <span className="mt-[6px] size-[4px] shrink-0 rounded-full bg-jade" />
                        <span className="text-[11px] leading-relaxed text-ink-2">{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid gap-2 lg:grid-cols-3">
                <Panel>
                  <Stat label="Linked artifacts" value={String(evidence.length)} />
                </Panel>
                <Panel>
                  <Stat label="Attributed events" value={String(events.length)} />
                </Panel>
                <Panel>
                  <Stat label="Accounts" value={String(accounts.length)} hint={`${selected.deviceIds.length} devices`} />
                </Panel>
              </div>

              <SectionLabel>Accounts</SectionLabel>
              <div className="rounded-[2px] border border-line">
                {accounts.length === 0 ? (
                  <p className="px-3 py-2 text-[11px] text-ink-4">No account is registered to this person.</p>
                ) : (
                  accounts.map((account) => (
                    <dl key={account.id} className="border-b border-line/60 last:border-0">
                      <FieldRow label="Username" value={[account.domain, account.username].join(BACKSLASH)} mono />
                      <FieldRow label="Type" value={account.type} />
                      <FieldRow
                        label="Enabled"
                        value={
                          account.enabled ? (
                            <span className="text-jade">enabled</span>
                          ) : (
                            <span className="text-signal">
                              disabled{account.disabledAt ? ` ${formatTs(account.disabledAt)}` : ''}
                            </span>
                          )
                        }
                      />
                      <FieldRow label="SID" value={account.sid} mono />
                      <FieldRow label="Privileges" value={account.privileges.join('; ')} />
                      {account.lastLogon ? (
                        <FieldRow label="Last logon" value={formatTs(account.lastLogon)} mono />
                      ) : null}
                    </dl>
                  ))
                )}
              </div>

              <SectionLabel>Devices</SectionLabel>
              <div className="flex flex-wrap gap-1.5 px-3">
                {selected.deviceIds.length === 0 ? (
                  <p className="text-[11px] text-ink-4">No device assigned.</p>
                ) : (
                  selected.deviceIds.map((id) => (
                    <Button key={id} onClick={() => navigate('/devices')}>
                      {deviceById.get(id)?.name ?? id}
                    </Button>
                  ))
                )}
              </div>

              <SectionLabel>Timeline activity</SectionLabel>
              <div className="rounded-[2px] border border-line">
                {events.length === 0 ? (
                  <p className="px-3 py-2 text-[11px] text-ink-4">No event is attributed to this person.</p>
                ) : (
                  events.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        selectEvent(event.id)
                        navigate('/timeline')
                      }}
                      className="flex w-full items-center gap-2.5 border-b border-line/60 px-3 py-1.5 text-left last:border-0 hover:bg-panel-2"
                    >
                      <SeverityDot severity={event.severity} />
                      <span className="tabular w-[132px] shrink-0 font-mono text-[11px] text-ink-3">
                        {formatTs(displayTs(event.at, clockBasis, event.hostClock))}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{event.title}</span>
                      <Badge tone={SEVERITY_TONE[event.severity]}>{event.severity}</Badge>
                    </button>
                  ))
                )}
              </div>

              <SectionLabel>Linked evidence</SectionLabel>
              <div className="mb-3 rounded-[2px] border border-line">
                {evidence.length === 0 ? (
                  <p className="px-3 py-2 text-[11px] text-ink-4">No artifact is associated with this person.</p>
                ) : (
                  evidence.map((artifact) => (
                    <button
                      key={artifact.id}
                      type="button"
                      onClick={() => selectEvidence(artifact.id)}
                      className="flex w-full items-center gap-2.5 border-b border-line/60 px-3 py-1.5 text-left last:border-0 hover:bg-panel-2"
                    >
                      <span className="tabular w-[104px] shrink-0 font-mono text-[10px] text-cyan">{artifact.id}</span>
                      <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{artifact.label}</span>
                      <SignificanceTag value={artifact.significance} />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  )
}

function ComparisonBoard({ people, onClear }: { people: Person[]; onClear: () => void }) {
  if (people.length < 2) return null
  return (
    <div className="p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] text-ink-4">
          Comparing two subjects. The same artifact set can point at more than one identity, which is why the two
          columns rarely mirror each other.
        </span>
        <div className="flex-1" />
        <Button onClick={onClear}>Clear</Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {people.map((person) => (
          <div key={person.id} className="rounded-[2px] border border-line">
            <div className="border-b border-line bg-panel-2/70 px-3 py-2">
              <p className="text-[13px] text-ink">{person.name}</p>
              <p className="text-[11px] text-ink-4">{person.role}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Meter value={person.confidence} tone={person.confidence >= 0.6 ? 'amber' : 'cyan'} className="flex-1" />
                <span className="tabular font-mono text-[11px] text-ink-3">
                  {(person.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="px-3 py-2">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-signal uppercase">
                Indicators ({person.indicators.length})
              </p>
              <ul className="mt-1">
                {person.indicators.map((fact) => (
                  <li key={fact} className="border-b border-line/40 py-1 text-[11px] leading-relaxed text-ink-2 last:border-0">
                    {fact}
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-[10px] font-semibold tracking-[0.12em] text-jade uppercase">
                Exculpatory ({person.exculpatory.length})
              </p>
              <ul className="mt-1">
                {person.exculpatory.map((fact) => (
                  <li key={fact} className="border-b border-line/40 py-1 text-[11px] leading-relaxed text-ink-2 last:border-0">
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
