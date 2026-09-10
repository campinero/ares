import { beforeEach, describe, expect, it } from 'vitest'
import { deriveHypothesisStatus, hypothesisConfidence, useCase } from './useCase'
import type { Hypothesis } from '@/data/types'

function make(links: Hypothesis['links']): Hypothesis {
  return {
    id: 'H-TEST',
    code: 'HX',
    title: 'test',
    statement: 'test',
    status: 'open',
    createdAt: 0,
    author: 'test',
    links,
    openQuestions: [],
    builtIn: false,
  }
}

describe('hypothesis scoring', () => {
  it('reports no confidence for an unevidenced hypothesis', () => {
    expect(hypothesisConfidence(make([]))).toBe(0)
    expect(deriveHypothesisStatus(make([]))).toBe('open')
  })

  it('weighs supporting against contradicting evidence', () => {
    const supported = make([
      { evidenceId: 'A', stance: 'supports', weight: 3, rationale: '' },
      { evidenceId: 'B', stance: 'supports', weight: 3, rationale: '' },
      { evidenceId: 'C', stance: 'contradicts', weight: 1, rationale: '' },
    ])
    expect(hypothesisConfidence(supported)).toBeCloseTo(6 / 7, 5)
    expect(deriveHypothesisStatus(supported)).toBe('supported')

    const refuted = make([
      { evidenceId: 'A', stance: 'supports', weight: 1, rationale: '' },
      { evidenceId: 'B', stance: 'contradicts', weight: 3, rationale: '' },
      { evidenceId: 'C', stance: 'contradicts', weight: 3, rationale: '' },
    ])
    expect(deriveHypothesisStatus(refuted)).toBe('refuted')
  })

  it('treats a balanced link set as unresolved rather than decided', () => {
    const balanced = make([
      { evidenceId: 'A', stance: 'supports', weight: 2, rationale: '' },
      { evidenceId: 'B', stance: 'contradicts', weight: 2, rationale: '' },
    ])
    expect(hypothesisConfidence(balanced)).toBe(0.5)
    expect(deriveHypothesisStatus(balanced)).toBe('unresolved')
  })

  it('ignores neutral links when weighing, but still counts them as linked', () => {
    const noted = make([
      { evidenceId: 'A', stance: 'neutral', weight: 3, rationale: '' },
      { evidenceId: 'B', stance: 'neutral', weight: 3, rationale: '' },
    ])
    expect(hypothesisConfidence(noted)).toBe(0.35)
  })
})

describe('analyst work product', () => {
  beforeEach(() => {
    useCase.getState().resetCase()
  })

  it('creates a hypothesis and links evidence to it', () => {
    const store = useCase.getState()
    const before = store.hypotheses.length
    const id = store.addHypothesis({ title: 'Working theory', statement: 'A proposition to test.' })
    expect(useCase.getState().hypotheses.length).toBe(before + 1)

    useCase.getState().linkEvidence(id, 'ARES-E-0010', 'supports', 'because')
    const created = useCase.getState().hypotheses.find((h) => h.id === id)
    expect(created?.links).toHaveLength(1)
    expect(created?.links[0].stance).toBe('supports')

    useCase.getState().setLinkWeight(id, 'ARES-E-0010', 9)
    expect(useCase.getState().hypotheses.find((h) => h.id === id)?.links[0].weight).toBe(3)

    useCase.getState().unlinkEvidence(id, 'ARES-E-0010')
    expect(useCase.getState().hypotheses.find((h) => h.id === id)?.links).toHaveLength(0)
  })

  it('re-linking the same artifact replaces the stance rather than duplicating', () => {
    const id = useCase.getState().addHypothesis({ title: 't', statement: 's' })
    useCase.getState().linkEvidence(id, 'ARES-E-0030', 'supports', 'a')
    useCase.getState().linkEvidence(id, 'ARES-E-0030', 'contradicts', 'b')
    const links = useCase.getState().hypotheses.find((h) => h.id === id)?.links ?? []
    expect(links).toHaveLength(1)
    expect(links[0].stance).toBe('contradicts')
  })

  it('refuses to delete a hypothesis shipped with the case file', () => {
    const builtIn = useCase.getState().hypotheses.find((h) => h.builtIn)
    expect(builtIn).toBeDefined()
    if (!builtIn) return
    useCase.getState().removeHypothesis(builtIn.id)
    expect(useCase.getState().hypotheses.some((h) => h.id === builtIn.id)).toBe(true)
  })

  it('appends custody entries and marks them as analyst authored', () => {
    const before = useCase.getState().custody.length
    useCase.getState().addCustodyEvent({
      evidenceId: 'ARES-E-0001',
      action: 'ANALYZED',
      custodian: 'Test Examiner',
      method: 'Read-only mount',
      note: 'Reviewed',
      hashVerified: true,
    })
    const custody = useCase.getState().custody
    expect(custody.length).toBe(before + 1)
    expect(custody[custody.length - 1].builtIn).toBe(false)
  })

  it('tracks review and flag state per artifact', () => {
    useCase.getState().toggleReviewed('ARES-E-0010')
    expect(useCase.getState().reviewed['ARES-E-0010']).toBe(true)
    useCase.getState().toggleFlagged('ARES-E-0010')
    expect(useCase.getState().flagged['ARES-E-0010']).toBe(true)
    useCase.getState().toggleReviewed('ARES-E-0010')
    expect(useCase.getState().reviewed['ARES-E-0010']).toBe(false)
  })

  it('opens the inspector when an artifact is selected and closes on demand', () => {
    useCase.getState().selectEvidence('ARES-E-0010')
    expect(useCase.getState().inspectorOpen).toBe(true)
    expect(useCase.getState().selectedEvidenceId).toBe('ARES-E-0010')
    useCase.getState().closeInspector()
    expect(useCase.getState().inspectorOpen).toBe(false)
  })
})
