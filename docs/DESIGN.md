# ARES build contract - visual system and shared API

Target look: **a 2035 forensic laboratory workstation**. Dense, instrument-like,
quiet. Not a hacker theme. No neon slogans, no binary rain, no skulls, no
gratuitous glow, no fake terminal spam.

## Non-negotiables

- Near-black surfaces, thin 1px borders, restrained cyan illumination, red only
  for genuinely critical findings.
- Information density over whitespace. This is a workstation, not a landing page.
- Every control does something real. No decorative buttons. No dead links.
- Motion is functional: state transitions, selection feedback, playback. 150-260 ms,
  ease-out. Never loop an animation just to look busy.
- Respect `prefers-reduced-motion` (already handled globally in `index.css`).
- Desktop first at 1920x1080 and 2560x1440; must remain usable at 1366x768.

## Tokens (Tailwind v4, defined in `src/index.css`)

Surfaces `bg-void bg-abyss bg-panel bg-panel-2 bg-panel-3`
Borders `border-line border-line-2 border-line-3`
Text `text-ink text-ink-2 text-ink-3 text-ink-4`
Signal `text-cyan text-azure text-jade text-amber text-signal text-violet`
Fonts `font-sans` (UI) and `font-mono` (all identifiers, hashes, times, sizes)
Utilities `grid-field`, `panel-sheen`, `tabular`, `.ares-scanlines`, `.ares-vignette`

Type scale actually used: 10px uppercase tracked labels, 11px secondary, 12px body,
13px base, 20px stat numerals. Never exceed 28px except the case ID in the header.

## Shared primitives - `@/components/ui`

`Panel PanelHeader PanelBody Toolbar SectionLabel FieldRow`
`Badge SeverityDot SignificanceTag StatusPill` + `SEVERITY_TONE SIGNIFICANCE_TONE STATUS_TONE`
`Stat Meter ConfidenceBar Divider`
`SearchInput TextInput FilterChip Toggle IconButton Button`
`DataTable` with `Column<T>` (grid-based, sortable, selectable)
`Tabs` with `TabDef`
`EmptyState CopyButton HashText KeyHint Skeleton ProgressSweep`

Use them. Do not re-implement a table, a badge or a panel chrome.
Icons come from `lucide-react` at `size-3` / `size-3.5`.

## Data access - `@/data`

```ts
import { CASE, EVIDENCE, evidenceById, eventById, personById, deviceById,
         usbById, entityById, fsById, evidenceBytes, extractStrings,
         eventsForEvidence, evidenceForEvent, evidenceForPerson,
         evidenceForDevice, eventsForPerson, relationsForEntity,
         SUSPICIOUS_EVENTS, RECONSTRUCTION_EVENTS, CASE_META, CASE_WINDOW, T } from '@/data'
```

`evidenceBytes(id)` returns the deterministic `Uint8Array` behind an artifact -
the hex viewer, the strings viewer and every digest read from it.

## Time - `@/lib/time`

Always render through `formatTs/formatClock/formatDate/formatDateLong/formatIso/
formatDuration/formatSpan`. Never `toLocaleString` on a raw epoch: the case is
fixed to UTC-04:00 and must render identically on any machine.

Clock basis: read `clockBasis` from the store and call
`displayTs(event.at, clockBasis, event.hostClock)` before formatting. Host-bound
records shift +192 s in host basis. Surface which basis is active wherever times
are shown.

## Store - `@/store/useCase`

Selection: `selectedEvidenceId selectedEventId selectedEntityId selectedPersonId
selectedDeviceId selectedUsbId inspectorOpen inspectorTab`
Actions: `selectEvidence(id, tab?) selectEvent selectEntity selectPerson
selectDevice selectUsb setInspectorTab closeInspector`
Prefs: `clockBasis setClockBasis`, `investigationMode toggleInvestigationMode`,
`paletteOpen setPaletteOpen`
Work product: `hypotheses custody notes reviewed flagged report` plus
`addHypothesis updateHypothesis removeHypothesis linkEvidence unlinkEvidence
setLinkWeight addOpenQuestion addCustodyEvent addNote removeNote togglePinNote
toggleReviewed toggleFlagged setReport toggleReportSection toggleExhibit resetCase`
Helpers: `hypothesisConfidence(h)`, `deriveHypothesisStatus(h)`

`investigationMode` = hide `significance: 'noise'` records everywhere and tighten
the view to case-relevant material. Honour it in every list.

## Routes

`/` overview, `/evidence`, `/filesystem`, `/hex`, `/strings`, `/metadata`,
`/browser`, `/usb`, `/network`, `/timeline`, `/graph`, `/persons`, `/devices`,
`/hypotheses`, `/custody`, `/reconstruction`, `/report`

## Rules for every contributor

1. TypeScript strict, no `any`, no non-null `!` on possibly-missing lookups.
2. `export function ViewName()` - default exports only where a route needs lazy.
3. Write files with Bash heredocs in chunks of at most ~120 lines
   (`cat > f.tsx <<'ARESEOF'` then `cat >> f.tsx <<'ARESEOF'`). The Write tool is
   gated in this environment and large single heredocs get truncated.
4. Do not edit files owned by another agent. Do not touch `src/index.css`,
   `src/App.tsx`, `src/main.tsx`, `src/components/ui/*`, `src/data/types.ts`,
   `src/data/clock.ts`, `src/store/*` unless the task says so.
5. Run `npx tsc -b` in the project root before reporting done, and fix your own
   type errors.
