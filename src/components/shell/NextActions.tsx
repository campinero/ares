import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ListChecks } from 'lucide-react'
import { CASE } from '@/data'
import { deriveHypothesisStatus, useCase } from '@/store/useCase'
import { Badge, EmptyState, Panel, PanelHeader, type Tone } from '@/components/ui'

interface Action {
  id: string
  label: string
  detail: string
  tone: Tone
  run: () => void
}

/**
 * The work queue.
 *
 * Derived entirely from the current state of the case: what has not been
 * reviewed, which artifacts carry an open digest, which hypotheses are not yet
 * decided, and whether the report can be signed. Every row is a jump into the
 * module that resolves it, so the overview drives the investigation rather than
 * just describing it.
 */
export function NextActions() {
  const navigate = useNavigate()
  const reviewed = useCase((s) => s.reviewed)
  const hypotheses = useCase((s) => s.hypotheses)
  const custody = useCase((s) => s.custody)
  const report = useCase((s) => s.report)
  const selectEvidence = useCase((s) => s.selectEvidence)

  const actions = useMemo<Action[]>(() => {
    const out: Action[] = []

    const unreviewedCritical = CASE.evidence.filter((e) => e.significance === 'critical' && !reviewed[e.id])
    if (unreviewedCritical.length > 0) {
      out.push({
        id: 'review-critical',
        label: `Review ${unreviewedCritical.length} critical artifact${unreviewedCritical.length === 1 ? '' : 's'}`,
        detail: `Next: ${unreviewedCritical[0].id} ${unreviewedCritical[0].label}`,
        tone: 'signal',
        run: () => {
          selectEvidence(unreviewedCritical[0].id)
          navigate('/evidence')
        },
      })
    }

    const contested = CASE.evidence.filter((e) => e.status === 'contested')
    if (contested.length > 0) {
      out.push({
        id: 'contested',
        label: `${contested.length} artifact${contested.length === 1 ? '' : 's'} contested`,
        detail: 'Reconstructed or inferred material - confirm what it can carry before relying on it',
        tone: 'violet',
        run: () => {
          selectEvidence(contested[0].id)
          navigate('/evidence')
        },
      })
    }

    const openDigest = custody.filter((c) => !c.hashVerified)
    if (openDigest.length > 0) {
      out.push({
        id: 'digest',
        label: `${openDigest.length} custody entr${openDigest.length === 1 ? 'y' : 'ies'} with an open digest`,
        detail: 'The report should not be signed while an artifact digest is unconfirmed',
        tone: 'amber',
        run: () => navigate('/custody'),
      })
    }

    const undecided = hypotheses.filter((h) => {
      const status = deriveHypothesisStatus(h)
      return status === 'open' || status === 'unresolved'
    })
    if (undecided.length > 0) {
      out.push({
        id: 'hypotheses',
        label: `${undecided.length} hypothes${undecided.length === 1 ? 'is' : 'es'} undecided`,
        detail: `Attach evidence for or against ${undecided.map((h) => h.code).join(', ')}`,
        tone: 'cyan',
        run: () => navigate('/hypotheses'),
      })
    }

    if (!report.conclusion.trim()) {
      out.push({
        id: 'conclusion',
        label: 'Conclusion not written',
        detail: 'State the supported findings and the residual uncertainty separately',
        tone: 'azure',
        run: () => navigate('/report'),
      })
    }

    return out
  }, [reviewed, hypotheses, custody, report.conclusion, navigate, selectEvidence])

  return (
    <Panel className="min-h-[168px]">
      <PanelHeader
        title="Next actions"
        icon={<ListChecks />}
        readout={actions.length === 0 ? 'clear' : `${actions.length} open`}
      />
      {actions.length === 0 ? (
        <EmptyState
          title="Nothing outstanding"
          hint="Every critical artifact is reviewed, no digest is open, every hypothesis is decided and a conclusion is on file."
        />
      ) : (
        <div className="flex flex-col">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={action.run}
              className="group flex items-center gap-3 border-b border-line/50 px-3 py-2 text-left transition-colors last:border-0 hover:bg-panel-2"
            >
              <Badge tone={action.tone}>open</Badge>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] text-ink-2 group-hover:text-ink">{action.label}</span>
                <span className="block truncate text-[10px] text-ink-4">{action.detail}</span>
              </span>
              <ArrowRight className="size-3.5 shrink-0 text-ink-4 group-hover:text-cyan" />
            </button>
          ))}
        </div>
      )}
    </Panel>
  )
}
