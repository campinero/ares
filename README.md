# ARES - Autonomous Digital Forensics Command Center

An interactive digital-forensics investigation simulator built as a single-page
workstation. It ships one complete synthetic case, **OPERATION NIGHTFALL**
(`ARES-2026-0817`), and seventeen analysis modules for working it.

Everything in the case file is fictional and generated. There is no real
personal data, no real organisation, and no real incident. The application
performs no network scanning, no exploitation and no offensive capability of any
kind - it is a read-only analysis surface over a synthetic dataset.

## Running it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`).

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Type-check and produce a production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript project build, no emit |
| `npm run lint` | oxlint |
| `npm test` | Vitest suite |

Desktop-first. Designed for 1920x1080 and 2560x1440, usable down to 1366x768.

## The case

A fictional technology company believes Project HALCYON research data was copied
from an engineering workstation shortly before the assigned employee account was
disabled. Three machines were imaged, and logs were pulled from a file server, a
proxy, a VPN concentrator, a directory service and a facility access system.

The investigator has to answer what happened, when, on which device, which files
were touched, whether removable media or the network carried the data, which
account was used, what the evidence supports, what it does not, and in what
order events actually occurred.

The case is designed to resist a first-pass reading:

- Every on-host action is attributed to one account, but an account is not a person.
- The subject workstation ran **+3m12s fast** against the domain time source. Host
  MACB values and event records disagree with proxy, VPN and badge records until
  they are normalised. The header toggle switches between the normalised case
  clock and the host clock so the two can be reconciled.
- Roughly a third of the artifact set is ordinary noise. Filtering is real work.
- Several artifacts look incriminating and are not, including one MACB
  inconsistency that resembles timestomping but is a copy artifact.
- One artifact is marked `contested` because the media it describes was never
  recovered.

The ground truth lives in `src/data/solution.ts`. It is never imported by any
view, component, store or hook, and a test enforces that.

## Modules

Case Overview, Evidence, File System, Hex Viewer, Strings, Metadata, Browser
Artifacts, USB Devices, Network Activity, Timeline, Evidence Graph, Persons,
Devices, Hypotheses, Chain of Custody, Incident Reconstruction, Forensic Report.

## Keyboard

| Key | Action |
| --- | --- |
| `Ctrl`/`Cmd` + `K` | Command palette - search evidence, persons, devices, events, run commands |
| `E` | Evidence |
| `T` | Timeline |
| `G` | Evidence graph |
| `R` | Incident reconstruction |
| `H` | Hypotheses |
| `Esc` | Close the palette, then the inspector |
| `Space` | Play / pause (reconstruction) |
| `←` `→` | Step between events (timeline and reconstruction) |
| `F` | Fit the timeline to the whole case span |

## How it is built

React 19, TypeScript 6 (strict), Vite 8, Tailwind CSS v4, Framer Motion,
React Flow (`@xyflow/react`), Recharts, React Three Fiber, Zustand, Dexie,
Vitest.

```
src/
  data/        the case file - types, clock, entities, artifacts, graph, solution
  lib/         sha256, seeded PRNG, case time, formatting
  store/       Zustand state + Dexie-backed persistence
  workers/     off-thread digest verification and strings extraction
  components/  ui primitives, shell, inspector, per-module components
  views/       the seventeen modules
```

Three design decisions carry most of the weight:

**Digests are real.** Every artifact owns a deterministic synthetic byte buffer
built from a seeded generator. SHA-256 is computed over those actual bytes, so
the hex viewer, the strings extractor, the metadata sheet and the chain-of-
custody integrity sweep all read from one source. "Verify every artifact" in the
custody module genuinely re-hashes all 41 objects in a Web Worker and compares
the result against the case file. It is not a scripted animation.

**Determinism.** No `Math.random()` and no `Date.now()` anywhere in the dataset
or the layouts. The evidence set, the graph layout and the synthetic file
contents are byte-identical on every load, so two people looking at the same
case see exactly the same thing.

**One clock model.** Every timestamp is stored normalised, and records written by
the drifted host are flagged. The UI re-applies the offset only for display.
That keeps the reconciliation an investigative exercise rather than a data bug.

Analyst work product - hypotheses, custody entries, notes, review and flag state,
and report configuration - persists to IndexedDB. The evidence set itself is
immutable.

## Known limitations

- The evidence set is fixed. There is one case and no case authoring UI.
- Artifact buffers are carved samples of a few kilobytes, not full objects; the
  inspector labels which artifacts are carved and what the digest covers.
- PDF export goes through the browser print dialog rather than a PDF library.
  A Markdown export is also provided.
- The reconstruction scene needs WebGL. Without it the module falls back to a
  flat plan view carrying the same information.
- The graph layout is force-relaxed at load. Above a few hundred entities it
  would want a worker.
- No multi-user, no server, no auth. Everything runs in the browser.

## Suggested next work

- Case authoring: a second scenario, and a generator so instructors can vary the
  dataset per cohort.
- Grade an investigator conclusion against `solution.ts` and report which
  criteria were met.
- Carve-and-recover exercises: deliberately damaged artifacts the student has to
  reconstruct.
- Timeline diffing between two clock hypotheses, side by side.
- Move graph layout and strings extraction fully into the worker pool.
- Export the report to a signed PDF with an embedded exhibit manifest.
