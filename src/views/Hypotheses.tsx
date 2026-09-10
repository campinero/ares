import { useMemo, useState } from 'react'
import { ListTree, Minus, Plus, Trash2, X } from 'lucide-react'
import { CASE, evidenceById } from '@/data'
import type { Hypothesis, HypothesisStance, HypothesisStatus } from '@/data/types'
import { deriveHypothesisStatus, hypothesisConfidence, useCase } from '@/store/useCase'
import { cn } from '@/lib/cn'
import {
  Badge,
  Button,
  EmptyState,
  FilterChip,
  IconButton,
  Meter,
  Panel,
  PanelHeader,
  SearchInput,
  SectionLabel,
  SignificanceTag,
  TextInput,
  Toolbar,
  type Tone,
} from '@/components/ui'

const STATUS_TONE: Record<HypothesisStatus, Tone> = {
  supported: 'jade',
  refuted: 'signal',
  unresolved: 'amber',
  open: 'neutral',
}

export function Hypotheses() {
  const hypotheses = useCase((s) => s.hypotheses)
  const addHypothesis = useCase((s) => s.addHypothesis)
  const updateHypothesis = useCase((s) => s.updateHypothesis)
  const removeHypothesis = useCase((s) => s.removeHypothesis)
  const linkEvidence = useCase((s) => s.linkEvidence)
  const unlinkEvidence = useCase((s) => s.unlinkEvidence)
  const setLinkWeight = useCase((s) => s.setLinkWeight)
  const addOpenQuestion = useCase((s) => s.addOpenQuestion)
  const selectEvidence = useCase((s) => s.selectEvidence)
  const investigationMode = useCase((s) => s.investigationMode)

  const [activeId, setActiveId] = useState<string | null>(hypotheses[0]?.id ?? null)
  const [showBoard, setShowBoard] = useState(false)
  const [pickerStance, setPickerStance] = useState<HypothesisStance | null>(null)
  const [pickerQuery, setPickerQuery] = useState('')
  const [rationale, setRationale] = useState('')
  const [questionDraft, setQuestionDraft] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newStatement, setNewStatement] = useState('')
  const [creating, setCreating] = useState(false)

  const active = useMemo(
    () => hypotheses.find((h) => h.id === activeId) ?? hypotheses[0] ?? null,
    [hypotheses, activeId],
  )

  const linkedIds = useMemo(() => new Set(active?.links.map((l) => l.evidenceId) ?? []), [active])

  const pickerRows = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase()
    return CASE.evidence.filter((item) => {
      if (linkedIds.has(item.id)) return false
      if (investigationMode && item.significance === 'noise') return false
      if (!q) return true
      return `${item.id} ${item.label} ${item.type}`.toLowerCase().includes(q)
    })
  }, [pickerQuery, linkedIds, investigationMode])

  const supporting = active?.links.filter((l) => l.stance === 'supports') ?? []
  const contradicting = active?.links.filter((l) => l.stance === 'contradicts') ?? []
  const neutral = active?.links.filter((l) => l.stance === 'neutral') ?? []

  function attach(evidenceId: string) {
    if (!active || !pickerStance) return
    linkEvidence(active.id, evidenceId, pickerStance, rationale.trim() || 'Attached by the investigator.')
    setRationale('')
    setPickerQuery('')
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(288px,326px)_minmax(0,1fr)] gap-2">
      <Panel className="min-h-0">
        <PanelHeader
          title="Hypotheses"
          icon={<ListTree />}
          readout={`${hypotheses.length} propositions`}
          actions={
            <Button onClick={() => setCreating((v) => !v)} tone={creating ? 'primary' : 'default'} className="h-6">
              <Plus />
              New
            </Button>
          }
        />

        {creating ? (
          <div className="shrink-0 border-b border-line bg-abyss/50 p-2.5">
            <TextInput
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Hypothesis title"
              className="mb-1.5 w-full"
            />
            <textarea
              value={newStatement}
              onChange={(e) => setNewStatement(e.target.value)}
              placeholder="State the proposition this hypothesis tests"
              rows={3}
              className="w-full rounded-[2px] border border-line bg-abyss/80 px-2 py-1.5 text-[12px] text-ink placeholder:text-ink-4 focus:border-cyan/50 focus:outline-none"
            />
            <div className="mt-1.5 flex gap-1.5">
              <Button
                tone="primary"
                disabled={!newTitle.trim() || !newStatement.trim()}
                onClick={() => {
                  const id = addHypothesis({ title: newTitle.trim(), statement: newStatement.trim() })
                  setActiveId(id)
                  setNewTitle('')
                  setNewStatement('')
                  setCreating(false)
                }}
              >
                Create
              </Button>
              <Button onClick={() => setCreating(false)}>Cancel</Button>
            </div>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto">
          {hypotheses.map((h) => {
            const status = deriveHypothesisStatus(h)
            const confidence = hypothesisConfidence(h)
            const isActive = active?.id === h.id
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  setActiveId(h.id)
                  setShowBoard(false)
                }}
                className={cn(
                  'relative flex w-full flex-col gap-1 border-b border-line/60 px-3 py-2 text-left transition-colors',
                  isActive ? 'bg-cyan/10' : 'hover:bg-panel-2',
                )}
              >
                {isActive ? <span className="absolute inset-y-0 left-0 w-[2px] bg-cyan" /> : null}
                <div className="flex items-center gap-2">
                  <span className="tabular font-mono text-[12px] text-cyan">{h.code}</span>
                  <Badge tone={STATUS_TONE[status]}>{status}</Badge>
                  {!h.builtIn ? <Badge tone="violet">yours</Badge> : null}
                </div>
                <span className={cn('text-[12px] leading-snug', isActive ? 'text-ink' : 'text-ink-2')}>{h.title}</span>
                <div className="mt-0.5 flex items-center gap-2">
                  <Meter
                    value={confidence}
                    tone={status === 'supported' ? 'jade' : status === 'refuted' ? 'signal' : 'amber'}
                    className="flex-1"
                  />
                  <span className="tabular font-mono text-[10px] text-ink-4">
                    {(confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <span className="text-[10px] text-ink-4">
                  {h.links.filter((l) => l.stance === 'supports').length} for /{' '}
                  {h.links.filter((l) => l.stance === 'contradicts').length} against
                </span>
              </button>
            )
          })}
        </div>

        <div className="shrink-0 border-t border-line p-2">
          <Button className="w-full justify-center" onClick={() => setShowBoard((v) => !v)} tone={showBoard ? 'primary' : 'default'}>
            {showBoard ? 'Close comparison board' : 'Compare all hypotheses'}
          </Button>
        </div>
      </Panel>

      <Panel className="min-h-0" lit>
        {showBoard ? (
          <>
            <PanelHeader title="Comparison board" subtitle="Competing explanations weighed against the same evidence set" />
            <div className="min-h-0 flex-1 overflow-auto p-3">
              <div className="grid gap-2 xl:grid-cols-2 2xl:grid-cols-3">
                {hypotheses.map((h) => {
                  const status = deriveHypothesisStatus(h)
                  const confidence = hypothesisConfidence(h)
                  return (
                    <div key={h.id} className="rounded-[2px] border border-line bg-panel-2/40 p-3">
                      <div className="flex items-center gap-2">
                        <span className="tabular font-mono text-[13px] text-cyan">{h.code}</span>
                        <Badge tone={STATUS_TONE[status]}>{status}</Badge>
                      </div>
                      <p className="mt-1 text-[12px] text-ink">{h.title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-ink-4">{h.statement}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Meter
                          value={confidence}
                          tone={status === 'supported' ? 'jade' : status === 'refuted' ? 'signal' : 'amber'}
                          className="flex-1"
                          height={5}
                        />
                        <span className="tabular font-mono text-[11px] text-ink-2">
                          {(confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge tone="jade">{h.links.filter((l) => l.stance === 'supports').length} supporting</Badge>
                        <Badge tone="signal">
                          {h.links.filter((l) => l.stance === 'contradicts').length} contradicting
                        </Badge>
                        <Badge>{h.openQuestions.length} open</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : !active ? (
          <EmptyState title="No hypothesis selected" hint="Create one, or pick a shipped proposition to weigh." />
        ) : (
          <>
            <PanelHeader
              title={`${active.code} - ${active.title}`}
              subtitle={deriveHypothesisStatus(active)}
              readout={`${(hypothesisConfidence(active) * 100).toFixed(0)}% net support`}
              actions={
                <IconButton
                  label={active.builtIn ? 'Shipped hypotheses cannot be deleted' : 'Delete hypothesis'}
                  disabled={active.builtIn}
                  onClick={() => {
                    removeHypothesis(active.id)
                    setActiveId(hypotheses.find((h) => h.id !== active.id)?.id ?? null)
                  }}
                >
                  <Trash2 />
                </IconButton>
              }
            />

            <div className="min-h-0 flex-1 overflow-auto">
              <div className="p-3">
                <textarea
                  value={active.statement}
                  onChange={(e) => updateHypothesis(active.id, { statement: e.target.value })}
                  rows={2}
                  className="w-full rounded-[2px] border border-line bg-abyss/60 px-2.5 py-2 text-[12px] leading-relaxed text-ink-2 focus:border-cyan/50 focus:outline-none"
                />
              </div>

              <div className="grid gap-2 px-3 md:grid-cols-2">
                <StanceColumn
                  title="Supporting evidence"
                  tone="jade"
                  links={supporting}
                  onWeight={(id, w) => setLinkWeight(active.id, id, w)}
                  onRemove={(id) => unlinkEvidence(active.id, id)}
                  onOpen={selectEvidence}
                />
                <StanceColumn
                  title="Contradicting evidence"
                  tone="signal"
                  links={contradicting}
                  onWeight={(id, w) => setLinkWeight(active.id, id, w)}
                  onRemove={(id) => unlinkEvidence(active.id, id)}
                  onOpen={selectEvidence}
                />
              </div>

              {neutral.length > 0 ? (
                <div className="px-3 pt-2">
                  <StanceColumn
                    title="Noted, not decisive"
                    tone="violet"
                    links={neutral}
                    onWeight={(id, w) => setLinkWeight(active.id, id, w)}
                    onRemove={(id) => unlinkEvidence(active.id, id)}
                    onOpen={selectEvidence}
                  />
                </div>
              ) : null}

              <SectionLabel>Attach evidence</SectionLabel>
              <div className="px-3">
                <Toolbar className="rounded-[2px] border border-line bg-panel-2/40">
                  {(['supports', 'contradicts', 'neutral'] as HypothesisStance[]).map((stance) => (
                    <FilterChip
                      key={stance}
                      active={pickerStance === stance}
                      onClick={() => setPickerStance(pickerStance === stance ? null : stance)}
                    >
                      {stance}
                    </FilterChip>
                  ))}
                  {pickerStance ? (
                    <>
                      <SearchInput
                        value={pickerQuery}
                        onChange={setPickerQuery}
                        placeholder="Find artifact"
                        className="w-48"
                      />
                      <TextInput
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        placeholder="Rationale for this link"
                        className="min-w-[220px] flex-1"
                      />
                    </>
                  ) : (
                    <span className="text-[11px] text-ink-4">Choose a stance to attach an artifact.</span>
                  )}
                </Toolbar>

                {pickerStance ? (
                  <div className="mt-1.5 max-h-52 overflow-auto rounded-[2px] border border-line">
                    {pickerRows.length === 0 ? (
                      <p className="px-3 py-3 text-[11px] text-ink-4">No unlinked artifact matches.</p>
                    ) : (
                      pickerRows.slice(0, 60).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => attach(item.id)}
                          className="flex w-full items-center gap-2.5 border-b border-line/50 px-3 py-1.5 text-left last:border-0 hover:bg-cyan/8"
                        >
                          <span className="tabular w-[104px] shrink-0 font-mono text-[10px] text-cyan">{item.id}</span>
                          <span className="min-w-0 flex-1 truncate text-[11px] text-ink-2">{item.label}</span>
                          <SignificanceTag value={item.significance} />
                          <Plus className="size-3 shrink-0 text-ink-4" />
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>

              <SectionLabel>Unresolved questions</SectionLabel>
              <div className="px-3 pb-4">
                <ul className="rounded-[2px] border border-line">
                  {active.openQuestions.length === 0 ? (
                    <li className="px-3 py-2 text-[11px] text-ink-4">No open question recorded.</li>
                  ) : (
                    active.openQuestions.map((question) => (
                      <li key={question} className="flex gap-2.5 border-b border-line/60 px-3 py-1.5 last:border-0">
                        <span className="mt-[6px] size-[4px] shrink-0 rounded-full bg-amber" />
                        <span className="text-[11px] leading-relaxed text-ink-2">{question}</span>
                      </li>
                    ))
                  )}
                </ul>
                <div className="mt-1.5 flex gap-1.5">
                  <TextInput
                    value={questionDraft}
                    onChange={(e) => setQuestionDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && questionDraft.trim()) {
                        addOpenQuestion(active.id, questionDraft.trim())
                        setQuestionDraft('')
                      }
                    }}
                    placeholder="Record an unresolved question"
                    className="flex-1"
                  />
                  <Button
                    disabled={!questionDraft.trim()}
                    onClick={() => {
                      if (!questionDraft.trim()) return
                      addOpenQuestion(active.id, questionDraft.trim())
                      setQuestionDraft('')
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------ pieces */

function StanceColumn({
  title,
  tone,
  links,
  onWeight,
  onRemove,
  onOpen,
}: {
  title: string
  tone: 'jade' | 'signal' | 'violet'
  links: Hypothesis['links']
  onWeight: (evidenceId: string, weight: number) => void
  onRemove: (evidenceId: string) => void
  onOpen: (evidenceId: string) => void
}) {
  const border = tone === 'jade' ? 'border-jade/25' : tone === 'signal' ? 'border-signal/25' : 'border-violet/25'
  const text = tone === 'jade' ? 'text-jade' : tone === 'signal' ? 'text-signal' : 'text-violet'
  const bg = tone === 'jade' ? 'bg-jade/[0.04]' : tone === 'signal' ? 'bg-signal/[0.04]' : 'bg-violet/[0.04]'

  return (
    <div className={cn('rounded-[2px] border', border, bg)}>
      <div className={cn('flex items-center gap-2 border-b px-2.5 py-1.5', border)}>
        <span className={cn('text-[10px] font-semibold tracking-[0.12em] uppercase', text)}>{title}</span>
        <span className="tabular ml-auto font-mono text-[10px] text-ink-4">{links.length}</span>
      </div>
      {links.length === 0 ? (
        <p className="px-2.5 py-2 text-[11px] text-ink-4">Nothing attached.</p>
      ) : (
        links.map((link) => {
          const item = evidenceById.get(link.evidenceId)
          return (
            <div key={link.evidenceId} className="border-b border-line/40 px-2.5 py-1.5 last:border-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpen(link.evidenceId)}
                  className="tabular font-mono text-[10px] text-cyan hover:underline"
                >
                  {link.evidenceId}
                </button>
                <span className="min-w-0 flex-1 truncate text-[11px] text-ink-2">
                  {item ? item.label : 'artifact not in this case file'}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <IconButton label="Decrease weight" onClick={() => onWeight(link.evidenceId, link.weight - 1)}>
                    <Minus />
                  </IconButton>
                  <span className="tabular w-4 text-center font-mono text-[11px] text-ink-2">{link.weight}</span>
                  <IconButton label="Increase weight" onClick={() => onWeight(link.evidenceId, link.weight + 1)}>
                    <Plus />
                  </IconButton>
                  <IconButton label="Remove link" onClick={() => onRemove(link.evidenceId)}>
                    <X />
                  </IconButton>
                </div>
              </div>
              {link.rationale ? (
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-4">{link.rationale}</p>
              ) : null}
            </div>
          )
        })
      )}
    </div>
  )
}
