import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  CaseNote,
  CustodyAction,
  CustodyEvent,
  EvidenceId,
  Hypothesis,
  HypothesisStance,
  HypothesisStatus,
} from '@/data/types'
import type { ClockBasis } from '@/lib/time'
import { CASE } from '@/data'
import { dexieStorage } from './db'

export type InspectorTab = 'overview' | 'metadata' | 'hash' | 'timeline' | 'relationships' | 'raw'

/**
 * Bump when the shipped case file changes in a way persisted state would mask.
 */
export const CASE_FILE_VERSION = 2

export const REPORT_SECTIONS = [
  'summary',
  'scope',
  'methodology',
  'timeline',
  'evidence',
  'findings',
  'hypotheses',
  'persons',
  'devices',
  'custody',
  'limitations',
  'conclusion',
] as const

export type ReportSectionId = (typeof REPORT_SECTIONS)[number]

export interface ReportConfig {
  title: string
  author: string
  classification: string
  distribution: string
  conclusion: string
  sections: Record<ReportSectionId, boolean>
  /** Evidence explicitly pulled into the exhibit list. Empty means "all cited". */
  exhibits: EvidenceId[]
}

interface CaseState {
  /* selection ------------------------------------------------------------- */
  selectedEvidenceId: EvidenceId | null
  selectedEventId: string | null
  selectedEntityId: string | null
  selectedPersonId: string | null
  selectedDeviceId: string | null
  selectedUsbId: string | null
  inspectorOpen: boolean
  inspectorTab: InspectorTab

  /* preferences ----------------------------------------------------------- */
  clockBasis: ClockBasis
  /** Hides low-signal artifacts across every view. */
  investigationMode: boolean
  paletteOpen: boolean

  /* analyst work product -------------------------------------------------- */
  hypotheses: Hypothesis[]
  custody: CustodyEvent[]
  notes: CaseNote[]
  reviewed: Record<EvidenceId, boolean>
  flagged: Record<EvidenceId, boolean>
  report: ReportConfig

  /* actions --------------------------------------------------------------- */
  selectEvidence: (id: EvidenceId | null, tab?: InspectorTab) => void
  selectEvent: (id: string | null) => void
  selectEntity: (id: string | null) => void
  selectPerson: (id: string | null) => void
  selectDevice: (id: string | null) => void
  selectUsb: (id: string | null) => void
  setInspectorTab: (tab: InspectorTab) => void
  closeInspector: () => void
  setClockBasis: (basis: ClockBasis) => void
  toggleInvestigationMode: () => void
  setPaletteOpen: (open: boolean) => void

  addHypothesis: (input: { title: string; statement: string }) => string
  updateHypothesis: (id: string, patch: Partial<Pick<Hypothesis, 'title' | 'statement' | 'status'>>) => void
  removeHypothesis: (id: string) => void
  linkEvidence: (hypothesisId: string, evidenceId: EvidenceId, stance: HypothesisStance, rationale?: string) => void
  unlinkEvidence: (hypothesisId: string, evidenceId: EvidenceId) => void
  setLinkWeight: (hypothesisId: string, evidenceId: EvidenceId, weight: number) => void
  addOpenQuestion: (hypothesisId: string, question: string) => void

  addCustodyEvent: (input: {
    evidenceId: EvidenceId
    action: CustodyAction
    custodian: string
    to?: string
    from?: string
    method: string
    note: string
    hashVerified: boolean
  }) => void

  addNote: (body: string, refs?: { evidenceIds?: EvidenceId[]; eventIds?: string[] }) => void
  removeNote: (id: string) => void
  togglePinNote: (id: string) => void

  toggleReviewed: (id: EvidenceId) => void
  toggleFlagged: (id: EvidenceId) => void

  setReport: (patch: Partial<ReportConfig>) => void
  toggleReportSection: (id: ReportSectionId) => void
  toggleExhibit: (id: EvidenceId) => void
  /** Pull everything the investigator flagged into the report exhibit schedule. */
  addFlaggedToExhibits: () => number

  resetCase: () => void
}

/**
 * Monotonic ID source. The dataset is deterministic, so analyst-authored
 * records are the only place new identifiers are minted.
 */
let sequence = 0
function nextId(prefix: string): string {
  sequence += 1
  return `${prefix}-${sequence.toString().padStart(4, '0')}-${Math.abs(hashString(prefix + sequence)) % 9973}`
}

function hashString(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0
  return h
}

/** Clock for analyst-authored records only; never used by the evidence set. */
function now(): number {
  return Date.now()
}

const DEFAULT_REPORT: ReportConfig = {
  title: 'Digital Forensic Examination Report - OPERATION NIGHTFALL',
  author: 'C. Vasquez, GCFA - Digital Forensics Unit',
  classification: 'INTERNAL - INVESTIGATION SENSITIVE',
  distribution: 'Head of Investigations; General Counsel; CISO',
  conclusion: '',
  sections: {
    summary: true,
    scope: true,
    methodology: true,
    timeline: true,
    evidence: true,
    findings: true,
    hypotheses: true,
    persons: true,
    devices: false,
    custody: true,
    limitations: true,
    conclusion: true,
  },
  exhibits: [],
}

function initialState() {
  return {
    selectedEvidenceId: null,
    selectedEventId: null,
    selectedEntityId: null,
    selectedPersonId: null,
    selectedDeviceId: null,
    selectedUsbId: null,
    inspectorOpen: false,
    inspectorTab: 'overview' as InspectorTab,
    clockBasis: 'normalized' as ClockBasis,
    investigationMode: false,
    paletteOpen: false,
    hypotheses: CASE.hypotheses,
    custody: CASE.custody,
    notes: CASE.notes,
    reviewed: {} as Record<EvidenceId, boolean>,
    flagged: {} as Record<EvidenceId, boolean>,
    report: DEFAULT_REPORT,
  }
}

export const useCase = create<CaseState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      selectEvidence: (id, tab) =>
        set((s) => ({
          selectedEvidenceId: id,
          inspectorOpen: id !== null,
          inspectorTab: tab ?? (id === s.selectedEvidenceId ? s.inspectorTab : 'overview'),
        })),
      selectEvent: (id) => set({ selectedEventId: id }),
      selectEntity: (id) => set({ selectedEntityId: id }),
      selectPerson: (id) => set({ selectedPersonId: id }),
      selectDevice: (id) => set({ selectedDeviceId: id }),
      selectUsb: (id) => set({ selectedUsbId: id }),
      setInspectorTab: (tab) => set({ inspectorTab: tab }),
      closeInspector: () => set({ inspectorOpen: false }),
      setClockBasis: (basis) => set({ clockBasis: basis }),
      toggleInvestigationMode: () => set((s) => ({ investigationMode: !s.investigationMode })),
      setPaletteOpen: (open) => set({ paletteOpen: open }),

      addHypothesis: ({ title, statement }) => {
        const existing = get().hypotheses
        const id = nextId('HYP')
        const code = `H${existing.length + 1}`
        const hypothesis: Hypothesis = {
          id,
          code,
          title,
          statement,
          status: 'open',
          createdAt: now(),
          author: get().report.author,
          links: [],
          openQuestions: [],
          builtIn: false,
        }
        set({ hypotheses: [...existing, hypothesis] })
        return id
      },

      updateHypothesis: (id, patch) =>
        set((s) => ({ hypotheses: s.hypotheses.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),

      removeHypothesis: (id) =>
        set((s) => ({ hypotheses: s.hypotheses.filter((h) => h.id !== id || h.builtIn) })),

      linkEvidence: (hypothesisId, evidenceId, stance, rationale = '') =>
        set((s) => ({
          hypotheses: s.hypotheses.map((h) => {
            if (h.id !== hypothesisId) return h
            const others = h.links.filter((l) => l.evidenceId !== evidenceId)
            return {
              ...h,
              links: [...others, { evidenceId, stance, weight: 2, rationale }],
            }
          }),
        })),

      unlinkEvidence: (hypothesisId, evidenceId) =>
        set((s) => ({
          hypotheses: s.hypotheses.map((h) =>
            h.id === hypothesisId ? { ...h, links: h.links.filter((l) => l.evidenceId !== evidenceId) } : h,
          ),
        })),

      setLinkWeight: (hypothesisId, evidenceId, weight) =>
        set((s) => ({
          hypotheses: s.hypotheses.map((h) =>
            h.id === hypothesisId
              ? {
                  ...h,
                  links: h.links.map((l) =>
                    l.evidenceId === evidenceId ? { ...l, weight: Math.max(1, Math.min(3, weight)) } : l,
                  ),
                }
              : h,
          ),
        })),

      addOpenQuestion: (hypothesisId, question) =>
        set((s) => ({
          hypotheses: s.hypotheses.map((h) =>
            h.id === hypothesisId ? { ...h, openQuestions: [...h.openQuestions, question] } : h,
          ),
        })),

      addCustodyEvent: (input) =>
        set((s) => ({
          custody: [
            ...s.custody,
            { id: nextId('COC'), at: now(), builtIn: false, ...input },
          ],
        })),

      addNote: (body, refs) =>
        set((s) => ({
          notes: [
            {
              id: nextId('NOTE'),
              at: now(),
              author: s.report.author,
              body,
              pinned: false,
              evidenceIds: refs?.evidenceIds ?? [],
              eventIds: refs?.eventIds ?? [],
            },
            ...s.notes,
          ],
        })),

      removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
      togglePinNote: (id) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)) })),

      toggleReviewed: (id) => set((s) => ({ reviewed: { ...s.reviewed, [id]: !s.reviewed[id] } })),
      toggleFlagged: (id) => set((s) => ({ flagged: { ...s.flagged, [id]: !s.flagged[id] } })),

      setReport: (patch) => set((s) => ({ report: { ...s.report, ...patch } })),
      toggleReportSection: (id) =>
        set((s) => ({ report: { ...s.report, sections: { ...s.report.sections, [id]: !s.report.sections[id] } } })),
      toggleExhibit: (id) =>
        set((s) => ({
          report: {
            ...s.report,
            exhibits: s.report.exhibits.includes(id)
              ? s.report.exhibits.filter((e) => e !== id)
              : [...s.report.exhibits, id],
          },
        })),

      addFlaggedToExhibits: () => {
        const state = get()
        const flagged = Object.entries(state.flagged)
          .filter(([, on]) => on)
          .map(([id]) => id)
        const merged = [...new Set([...state.report.exhibits, ...flagged])]
        set({ report: { ...state.report, exhibits: merged } })
        return merged.length - state.report.exhibits.length
      },

      resetCase: () => set(initialState()),
    }),
    {
      name: 'ares/case-state/v1',
      version: CASE_FILE_VERSION,
      storage: createJSONStorage(() => dexieStorage),
      /**
       * Shipped case data lives in code, not in storage. When the case file
       * changes, re-seed the built-in records and carry forward only what the
       * investigator authored, so a stale browser never masks a dataset fix.
       */
      migrate: (persisted, from) => {
        const state = persisted as Partial<CaseState> | undefined
        if (!state || from === CASE_FILE_VERSION) return state as CaseState
        return {
          ...state,
          hypotheses: [...CASE.hypotheses, ...(state.hypotheses ?? []).filter((h) => !h.builtIn)],
          custody: [...CASE.custody, ...(state.custody ?? []).filter((c) => !c.builtIn)],
          notes: [
            ...CASE.notes,
            ...(state.notes ?? []).filter((n) => !CASE.notes.some((seed) => seed.id === n.id)),
          ],
        } as CaseState
      },
      partialize: (s) => ({
        hypotheses: s.hypotheses,
        custody: s.custody,
        notes: s.notes,
        reviewed: s.reviewed,
        flagged: s.flagged,
        report: s.report,
        clockBasis: s.clockBasis,
        investigationMode: s.investigationMode,
      }),
    },
  ),
)

/**
 * Net evidentiary weight of a hypothesis, expressed 0..1.
 *
 * Analyst weight is scaled by how much the artifact itself can bear. A
 * contested reconstruction and a verified acquisition should not push a
 * hypothesis equally hard just because the analyst rated both a 3.
 */
export function hypothesisConfidence(h: Hypothesis): number {
  if (h.links.length === 0) return 0
  let support = 0
  let against = 0
  for (const link of h.links) {
    const artifact = CASE.evidence.find((e) => e.id === link.evidenceId)
    const reliability = artifact ? artifact.confidence : 0.6
    const weighted = link.weight * reliability
    if (link.stance === 'supports') support += weighted
    if (link.stance === 'contradicts') against += weighted
  }
  const total = support + against
  if (total === 0) return 0.35
  return Math.max(0, Math.min(1, support / total))
}

export function deriveHypothesisStatus(h: Hypothesis): HypothesisStatus {
  if (h.links.length < 2) return 'open'
  const c = hypothesisConfidence(h)
  if (c >= 0.75) return 'supported'
  if (c <= 0.3) return 'refuted'
  return 'unresolved'
}
