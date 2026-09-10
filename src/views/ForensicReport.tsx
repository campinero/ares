import { useMemo, useState } from 'react'
import { Download, FileText, Printer } from 'lucide-react'
import { CASE, CASE_META, SUSPICIOUS_EVENTS, evidenceById } from '@/data'
import { REPORT_SECTIONS, deriveHypothesisStatus, hypothesisConfidence, useCase, type ReportSectionId } from '@/store/useCase'
import { formatDateLong, formatIso, formatTs } from '@/lib/time'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  Badge,
  Button,
  Panel,
  PanelHeader,
  SearchInput,
  SectionLabel,
  TextInput,
  Toggle,
  Toolbar,
} from '@/components/ui'

const SECTION_LABEL: Record<ReportSectionId, string> = {
  summary: 'Executive summary',
  scope: 'Scope and mandate',
  methodology: 'Methodology',
  timeline: 'Timeline of significant events',
  evidence: 'Evidence schedule',
  findings: 'Findings',
  hypotheses: 'Competing hypotheses',
  persons: 'Persons of interest',
  devices: 'Devices examined',
  custody: 'Chain of custody',
  limitations: 'Limitations and uncertainty',
  conclusion: 'Conclusion',
}

export function ForensicReport() {
  const report = useCase((s) => s.report)
  const setReport = useCase((s) => s.setReport)
  const toggleReportSection = useCase((s) => s.toggleReportSection)
  const toggleExhibit = useCase((s) => s.toggleExhibit)
  const hypotheses = useCase((s) => s.hypotheses)
  const custody = useCase((s) => s.custody)
  const notes = useCase((s) => s.notes)
  const flagged = useCase((s) => s.flagged)
  const addFlaggedToExhibits = useCase((s) => s.addFlaggedToExhibits)
  const flaggedCount = Object.values(flagged).filter(Boolean).length

  const [exhibitQuery, setExhibitQuery] = useState('')
  const [exhibitNotice, setExhibitNotice] = useState<string | null>(null)

  const exhibits = useMemo(() => {
    if (report.exhibits.length > 0) {
      return report.exhibits.map((id) => evidenceById.get(id)).filter((e) => e !== undefined)
    }
    return CASE.evidence.filter((e) => e.significance === 'critical' || e.significance === 'high')
  }, [report.exhibits])

  const exhibitPool = useMemo(() => {
    const q = exhibitQuery.trim().toLowerCase()
    return CASE.evidence.filter((e) => !q || `${e.id} ${e.label}`.toLowerCase().includes(q))
  }, [exhibitQuery])

  const exhibitNumber = useMemo(() => {
    const map = new Map<string, number>()
    exhibits.forEach((item, index) => map.set(item.id, index + 1))
    return map
  }, [exhibits])

  const citeExhibits = (ids: string[]): string => {
    const numbered = ids.map((id) => exhibitNumber.get(id)).filter((n): n is number => n !== undefined)
    if (numbered.length === 0) return 'not scheduled'
    return numbered.sort((a, b) => a - b).map((n) => `Exhibit ${n}`).join(', ')
  }

  const timelineEvents = useMemo(() => [...SUSPICIOUS_EVENTS].sort((a, b) => a.at - b.at), [])

  const findings = useMemo(
    () =>
      CASE.events
        .filter((e) => e.severity === 'critical')
        .sort((a, b) => a.at - b.at)
        .map((event) => ({
          at: event.at,
          title: event.title,
          summary: event.summary,
          confidence: event.confidence,
          evidenceIds: event.evidenceIds,
        })),
    [],
  )

  const caveats = useMemo(
    () => CASE.evidence.filter((e) => e.caveat).map((e) => ({ id: e.id, label: e.label, caveat: e.caveat as string })),
    [],
  )

  const markdown = useMemo(
    () => buildMarkdown({ report, exhibits, timelineEvents, findings, hypotheses, custody, caveats }),
    [report, exhibits, timelineEvents, findings, hypotheses, custody, caveats],
  )

  function downloadMarkdown() {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${CASE_META.id}-report.md`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(300px,346px)_minmax(0,1fr)] gap-2">
      <Panel className="ares-no-print min-h-0">
        <PanelHeader title="Report builder" icon={<FileText />} readout={`${exhibits.length} exhibits`} />

        <Toolbar>
          <Button tone="primary" onClick={() => window.print()}>
            <Printer />
            Print / Save as PDF
          </Button>
          <Button onClick={downloadMarkdown}>
            <Download />
            Markdown
          </Button>
        </Toolbar>

        <div className="min-h-0 flex-1 overflow-auto">
          <SectionLabel>Document</SectionLabel>
          <div className="flex flex-col gap-1.5 px-3">
            <TextInput
              value={report.title}
              onChange={(e) => setReport({ title: e.target.value })}
              placeholder="Report title"
            />
            <TextInput
              value={report.author}
              onChange={(e) => setReport({ author: e.target.value })}
              placeholder="Examiner"
            />
            <TextInput
              value={report.classification}
              onChange={(e) => setReport({ classification: e.target.value })}
              placeholder="Classification"
            />
            <TextInput
              value={report.distribution}
              onChange={(e) => setReport({ distribution: e.target.value })}
              placeholder="Distribution"
            />
          </div>

          <SectionLabel>Sections</SectionLabel>
          <div className="px-3">
            {REPORT_SECTIONS.map((id) => (
              <Toggle
                key={id}
                checked={report.sections[id]}
                onChange={() => toggleReportSection(id)}
                label={SECTION_LABEL[id]}
              />
            ))}
          </div>

          <SectionLabel>Conclusion</SectionLabel>
          <div className="px-3">
            <textarea
              value={report.conclusion}
              onChange={(e) => setReport({ conclusion: e.target.value })}
              rows={6}
              placeholder="State the findings the evidence supports, then state separately what remains uncertain and why. Distinguish what an artifact shows from what it implies."
              className="w-full rounded-[2px] border border-line bg-abyss/70 px-2.5 py-2 text-[12px] leading-relaxed text-ink placeholder:text-ink-4 focus:border-cyan/50 focus:outline-none"
            />
          </div>

          <SectionLabel>Exhibits</SectionLabel>
          <div className="px-3 pb-4">
            <p className="mb-1.5 text-[10px] leading-relaxed text-ink-4">
              {report.exhibits.length === 0
                ? 'No exhibit chosen, so the schedule lists every critical and high significance artifact automatically.'
                : `${report.exhibits.length} artifacts pinned to the schedule.`}
            </p>
            <div className="mb-1.5 flex gap-1.5">
              <Button
                onClick={() => {
                  const added = addFlaggedToExhibits()
                  setExhibitNotice(
                    added === 0
                      ? 'Nothing new - every flagged artifact is already scheduled.'
                      : `Added ${added} flagged artifact${added === 1 ? '' : 's'} to the schedule.`,
                  )
                }}
              >
                Pull in flagged ({flaggedCount})
              </Button>
              <Button disabled={report.exhibits.length === 0} onClick={() => setReport({ exhibits: [] })}>
                Clear
              </Button>
            </div>
            {exhibitNotice ? <p className="mb-1.5 text-[10px] text-cyan">{exhibitNotice}</p> : null}
            <SearchInput value={exhibitQuery} onChange={setExhibitQuery} placeholder="Find artifact" className="mb-1.5" />
            <div className="max-h-64 overflow-auto rounded-[2px] border border-line">
              {exhibitPool.map((item) => {
                const picked = report.exhibits.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleExhibit(item.id)}
                    className={cn(
                      'flex w-full items-center gap-2 border-b border-line/50 px-2.5 py-1.5 text-left last:border-0',
                      picked ? 'bg-cyan/10 text-cyan' : 'text-ink-3 hover:bg-panel-2',
                    )}
                  >
                    <span className="tabular w-[100px] shrink-0 font-mono text-[10px]">{item.id}</span>
                    <span className="min-w-0 flex-1 truncate text-[11px]">{item.label}</span>
                    {picked ? <Badge tone="cyan">in</Badge> : null}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="min-h-0">
        <PanelHeader
          title="Preview"
          subtitle="Rendered from the live case file"
          readout={`${Object.values(report.sections).filter(Boolean).length} sections`}
          className="ares-no-print"
        />
        <div className="min-h-0 flex-1 overflow-auto bg-[#0a0d13] p-6 ares-print-root">
          <article className="ares-report mx-auto max-w-[860px] bg-[#f6f4ef] px-14 py-12 text-[#161a20] shadow-2xl shadow-black/40">
            <header className="border-b-2 border-[#161a20] pb-4">
              <p className="text-[10px] font-semibold tracking-[0.24em] text-[#8a2b20] uppercase">
                {report.classification}
              </p>
              <h1 className="mt-2 font-serif text-[26px] leading-tight font-semibold">{report.title}</h1>
              <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-[11px]">
                <Meta label="Case reference" value={CASE_META.id} />
                <Meta label="Operation" value={CASE_META.codename} />
                <Meta label="Examiner" value={report.author} />
                <Meta label="Case opened" value={formatDateLong(CASE_META.opened)} />
                <Meta label="Organisation" value={CASE_META.organization} />
                <Meta label="Distribution" value={report.distribution} />
                <Meta label="Reference clock" value={CASE_META.timezone} />
                <Meta label="Status" value={CASE_META.status} />
              </div>
            </header>

            <Section n={1} id="summary" report={report} title={SECTION_LABEL.summary}>
              <p>{CASE_META.synopsis}</p>
              <p className="mt-2">
                The case file holds {CASE.evidence.length} artifacts across {CASE.devices.length} devices, and{' '}
                {CASE.events.length} reconstructed events of which {SUSPICIOUS_EVENTS.length} are flagged for review.
                All timestamps in this report are stated on the normalised reference clock unless marked otherwise.
              </p>
            </Section>

            <Section n={2} id="scope" report={report} title={SECTION_LABEL.scope}>
              <ol className="ml-5 list-decimal space-y-1">
                {CASE_META.mandate.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <p className="mt-2 text-[11px] italic">Jurisdiction: {CASE_META.jurisdiction}</p>
            </Section>

            <Section n={3} id="methodology" report={report} title={SECTION_LABEL.methodology}>
              <p>
                Devices were acquired behind a hardware write blocker and verified against the acquisition manifest
                before analysis. Working copies were mounted read-only. Digests quoted in this report are recomputed
                from the artifact data objects at the time of writing rather than read back from the acquisition
                record.
              </p>
              <table className="mt-3 w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-[#161a20]">
                    <th className="py-1 text-left">Device</th>
                    <th className="py-1 text-left">Acquisition</th>
                    <th className="py-1 text-left">Clock offset</th>
                    <th className="py-1 text-left">Custodian</th>
                  </tr>
                </thead>
                <tbody>
                  {CASE.devices.map((device) => (
                    <tr key={device.id} className="border-b border-[#c9c4ba]">
                      <td className="py-1 pr-2">
                        {device.id} - {device.name}
                      </td>
                      <td className="py-1 pr-2">{device.imaged ? 'Full image' : 'Logs only'}</td>
                      <td className="py-1 pr-2">
                        {device.clockDriftSeconds === 0 ? 'in sync' : `+${device.clockDriftSeconds} s`}
                      </td>
                      <td className="py-1">{device.custodian}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[11px]">
                One workstation was measured running ahead of the domain time source. Its records were normalised
                before being ordered against externally sourced evidence; failing to do so shifts its events by more
                than three minutes.
              </p>
            </Section>

            <Section n={4} id="timeline" report={report} title={SECTION_LABEL.timeline}>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-[#161a20]">
                    <th className="py-1 text-left">Normalised time</th>
                    <th className="py-1 text-left">Event</th>
                    <th className="py-1 text-left">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineEvents.map((event) => (
                    <tr key={event.id} className="border-b border-[#c9c4ba] align-top">
                      <td className="py-1 pr-2 whitespace-nowrap">
                        {formatTs(event.at)}
                        {event.hostClock ? <span className="ml-1 text-[#8a2b20]">*</span> : null}
                      </td>
                      <td className="py-1 pr-2">{event.title}</td>
                      <td className="py-1">{event.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[10px] italic">
                * Recorded by a host whose clock ran ahead of the reference; the value shown has been normalised.
              </p>
            </Section>

            <Section n={5} id="evidence" report={report} title={SECTION_LABEL.evidence}>
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-[#161a20]">
                    <th className="py-1 text-left">No. / Exhibit</th>
                    <th className="py-1 text-left">Description</th>
                    <th className="py-1 text-left">Type</th>
                    <th className="py-1 text-left">SHA-256 (first 32)</th>
                  </tr>
                </thead>
                <tbody>
                  {exhibits.map((item) => (
                    <tr key={item.id} className="border-b border-[#c9c4ba] align-top">
                      <td className="py-1 pr-2 whitespace-nowrap">
                        <span className="font-semibold">{exhibitNumber.get(item.id)}</span> {item.id}
                      </td>
                      <td className="py-1 pr-2">
                        {item.label}
                        {item.sizeBytes ? ` (${formatBytes(item.sizeBytes, 1)})` : ''}
                      </td>
                      <td className="py-1 pr-2">{item.type}</td>
                      <td className="py-1 font-mono">{item.hashes.sha256.slice(0, 32)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section n={6} id="findings" report={report} title={SECTION_LABEL.findings}>
              <ol className="ml-5 list-decimal space-y-2">
                {findings.map((finding) => (
                  <li key={finding.title}>
                    <span className="font-semibold">{formatTs(finding.at)}</span> - {finding.title}.{' '}
                    {finding.summary}{' '}
                    <span className="text-[10px] italic">
                      (confidence {(finding.confidence * 100).toFixed(0)}%, {citeExhibits(finding.evidenceIds)})
                    </span>
                  </li>
                ))}
              </ol>
            </Section>

            <Section n={7} id="hypotheses" report={report} title={SECTION_LABEL.hypotheses}>
              {hypotheses.map((h) => {
                const status = deriveHypothesisStatus(h)
                return (
                  <div key={h.id} className="mb-3">
                    <p className="font-semibold">
                      {h.code} - {h.title}{' '}
                      <span className="text-[10px] font-normal uppercase">
                        [{status}, {(hypothesisConfidence(h) * 100).toFixed(0)}% net support]
                      </span>
                    </p>
                    <p className="mt-0.5">{h.statement}</p>
                    <p className="mt-0.5 text-[10px]">
                      {h.links.filter((l) => l.stance === 'supports').length} supporting exhibits,{' '}
                      {h.links.filter((l) => l.stance === 'contradicts').length} contradicting.
                      {h.openQuestions.length > 0 ? ` Open questions: ${h.openQuestions.join(' ')}` : ''}
                    </p>
                  </div>
                )
              })}
            </Section>

            <Section n={8} id="persons" report={report} title={SECTION_LABEL.persons}>
              <p className="mb-2 text-[11px] italic">
                Association strength expresses how strongly the recovered artifacts point at an identity. It is not a
                measure of culpability, and it does not distinguish an account from the person operating it.
              </p>
              {CASE.persons.map((person) => (
                <div key={person.id} className="mb-2">
                  <p className="font-semibold">
                    {person.name} - {person.role}{' '}
                    <span className="text-[10px] font-normal">
                      [association {(person.confidence * 100).toFixed(0)}%]
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px]">{person.summary}</p>
                  <p className="mt-0.5 text-[10px]">
                    Indicators: {person.indicators.length}. Exculpatory: {person.exculpatory.length}.
                  </p>
                </div>
              ))}
            </Section>

            <Section n={9} id="devices" report={report} title={SECTION_LABEL.devices}>
              <ul className="ml-5 list-disc space-y-1">
                {CASE.devices.map((device) => (
                  <li key={device.id}>
                    <span className="font-semibold">{device.id}</span> {device.name} - {device.os}. {device.notes}
                  </li>
                ))}
              </ul>
            </Section>

            <Section n={10} id="custody" report={report} title={SECTION_LABEL.custody}>
              <p>
                {custody.length} custody entries are recorded across {new Set(custody.map((c) => c.evidenceId)).size}{' '}
                artifacts. {custody.filter((c) => !c.hashVerified).length} entries carry an unverified digest and remain
                open.
              </p>
              <table className="mt-2 w-full border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-[#161a20]">
                    <th className="py-1 text-left">Time</th>
                    <th className="py-1 text-left">Exhibit</th>
                    <th className="py-1 text-left">Action</th>
                    <th className="py-1 text-left">Custodian</th>
                    <th className="py-1 text-left">Digest</th>
                  </tr>
                </thead>
                <tbody>
                  {[...custody]
                    .sort((a, b) => a.at - b.at)
                    .slice(0, 24)
                    .map((entry) => (
                      <tr key={entry.id} className="border-b border-[#c9c4ba]">
                        <td className="py-1 pr-2 whitespace-nowrap">{formatIso(entry.at).slice(0, 16)}</td>
                        <td className="py-1 pr-2">{entry.evidenceId}</td>
                        <td className="py-1 pr-2">{entry.action}</td>
                        <td className="py-1 pr-2">{entry.custodian}</td>
                        <td className="py-1">{entry.hashVerified ? 'verified' : 'OPEN'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Section>

            <Section n={11} id="limitations" report={report} title={SECTION_LABEL.limitations}>
              <p className="font-semibold">Unresolved questions</p>
              <ul className="mt-1 ml-5 list-disc space-y-1">
                {CASE_META.unresolvedQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
              <p className="mt-3 font-semibold">Artifact caveats</p>
              <ul className="mt-1 ml-5 list-disc space-y-1">
                {caveats.map((c) => (
                  <li key={c.id}>
                    <span className="font-semibold">{c.id}</span> {c.label} - {c.caveat}
                  </li>
                ))}
              </ul>
              {notes.length > 0 ? (
                <p className="mt-3 text-[10px] italic">
                  {notes.length} examiner working notes are held with the case file and are available on request.
                </p>
              ) : null}
            </Section>

            <Section n={12} id="conclusion" report={report} title={SECTION_LABEL.conclusion}>
              {report.conclusion.trim() ? (
                <p className="whitespace-pre-wrap">{report.conclusion}</p>
              ) : (
                <p className="italic">
                  No conclusion has been recorded. The examination is not complete until the supported findings and the
                  residual uncertainty are both stated.
                </p>
              )}
              <div className="mt-8 border-t border-[#c9c4ba] pt-3 text-[11px]">
                <p>Prepared by {report.author}</p>
                <p className="mt-6">Signature ______________________________ Date ____________________</p>
              </div>
            </Section>
          </article>
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------ pieces */

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-semibold tracking-[0.06em] uppercase">{label}:</span> {value}
    </p>
  )
}

function Section({
  n,
  id,
  report,
  title,
  children,
}: {
  n: number
  id: ReportSectionId
  report: { sections: Record<ReportSectionId, boolean> }
  title: string
  children: React.ReactNode
}) {
  if (!report.sections[id]) return null
  return (
    <section className="mt-7 break-inside-avoid">
      <h2 className="font-serif text-[15px] font-semibold">
        {n}. {title}
      </h2>
      <div className="mt-1.5 text-[12px] leading-relaxed">{children}</div>
    </section>
  )
}

interface MarkdownInput {
  report: { title: string; author: string; classification: string; distribution: string; conclusion: string; sections: Record<ReportSectionId, boolean> }
  exhibits: Array<{ id: string; label: string; type: string; hashes: { sha256: string } }>
  timelineEvents: Array<{ at: number; title: string; source: string }>
  findings: Array<{ at: number; title: string; summary: string; confidence: number }>
  hypotheses: Array<{ code: string; title: string; statement: string }>
  custody: Array<{ hashVerified: boolean }>
  caveats: Array<{ id: string; label: string; caveat: string }>
}

function buildMarkdown(input: MarkdownInput): string {
  const { report, exhibits, timelineEvents, findings, hypotheses, custody, caveats } = input
  const lines: string[] = []
  lines.push(`# ${report.title}`, '')
  lines.push(`**${report.classification}**`, '')
  lines.push(`- Case reference: ${CASE_META.id}`)
  lines.push(`- Operation: ${CASE_META.codename}`)
  lines.push(`- Examiner: ${report.author}`)
  lines.push(`- Distribution: ${report.distribution}`)
  lines.push(`- Reference clock: ${CASE_META.timezone}`, '')

  if (report.sections.summary) lines.push('## Executive summary', '', CASE_META.synopsis, '')
  if (report.sections.scope) {
    lines.push('## Scope and mandate', '')
    CASE_META.mandate.forEach((m, i) => lines.push(`${i + 1}. ${m}`))
    lines.push('')
  }
  if (report.sections.timeline) {
    lines.push('## Timeline of significant events', '', '| Normalised time | Event | Source |', '| --- | --- | --- |')
    for (const e of timelineEvents) lines.push(`| ${formatTs(e.at)} | ${e.title} | ${e.source} |`)
    lines.push('')
  }
  if (report.sections.evidence) {
    lines.push('## Evidence schedule', '', '| Exhibit | Description | Type | SHA-256 |', '| --- | --- | --- | --- |')
    for (const e of exhibits) lines.push(`| ${e.id} | ${e.label} | ${e.type} | ${e.hashes.sha256} |`)
    lines.push('')
  }
  if (report.sections.findings) {
    lines.push('## Findings', '')
    findings.forEach((f, i) =>
      lines.push(`${i + 1}. **${formatTs(f.at)}** ${f.title}. ${f.summary} (confidence ${(f.confidence * 100).toFixed(0)}%)`),
    )
    lines.push('')
  }
  if (report.sections.hypotheses) {
    lines.push('## Competing hypotheses', '')
    for (const h of hypotheses) lines.push(`- **${h.code} ${h.title}** - ${h.statement}`)
    lines.push('')
  }
  if (report.sections.custody) {
    lines.push('## Chain of custody', '')
    lines.push(`${custody.length} entries recorded, ${custody.filter((c) => !c.hashVerified).length} with an open digest.`, '')
  }
  if (report.sections.limitations) {
    lines.push('## Limitations and uncertainty', '')
    for (const q of CASE_META.unresolvedQuestions) lines.push(`- ${q}`)
    for (const c of caveats) lines.push(`- ${c.id} ${c.label}: ${c.caveat}`)
    lines.push('')
  }
  if (report.sections.conclusion) {
    lines.push('## Conclusion', '', report.conclusion.trim() || '_No conclusion recorded._', '')
  }
  lines.push('---', '', 'All content is synthetic and generated for forensic training.')
  return lines.join('\n')
}
