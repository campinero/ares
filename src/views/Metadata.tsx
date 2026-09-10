import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tags } from 'lucide-react'
import { ArtifactLenses, ArtifactPicker, CopyTextButton, useArtifact } from '@/components/artifact'
import { accountById, deviceById, eventsForEvidence, personById } from '@/data'
import { useCase } from '@/store/useCase'
import { displayTs, formatIso, formatTs } from '@/lib/time'
import { basename, dirname, extname, formatBytes, formatNumber } from '@/lib/format'
import {
  Badge,
  ConfidenceBar,
  EmptyState,
  FieldRow,
  HashText,
  Panel,
  PanelHeader,
  SEVERITY_TONE,
  SectionLabel,
  SeverityDot,
  SignificanceTag,
  StatusPill,
  Toolbar,
} from '@/components/ui'

export function Metadata() {
  const { item, bytes } = useArtifact()
  const clockBasis = useCase((s) => s.clockBasis)
  const selectEvent = useCase((s) => s.selectEvent)
  const navigate = useNavigate()

  const events = useMemo(() => (item ? eventsForEvidence(item.id) : []), [item])

  const sheet = useMemo(() => {
    if (!item) return ''
    const lines = [
      `EVIDENCE ${item.id}`,
      `Label            ${item.label}`,
      `Type             ${item.type}`,
      `Category         ${item.category}`,
      `Status           ${item.status}`,
      `Significance     ${item.significance}`,
      `Confidence       ${(item.confidence * 100).toFixed(0)}%`,
      `Source           ${item.source}`,
      `Path             ${item.path ?? 'n/a'}`,
      `Size             ${item.sizeBytes ? `${item.sizeBytes} bytes` : 'n/a'}`,
      `MIME             ${item.mimeType ?? 'n/a'}`,
      `Owner            ${item.owner ?? 'n/a'}`,
      `Permissions      ${item.permissions ?? 'n/a'}`,
      `Acquired         ${formatIso(item.acquiredAt)}`,
      `Created          ${formatIso(item.createdAt)}${item.hostClock ? ' (host-written)' : ''}`,
      `Modified         ${formatIso(item.modifiedAt)}${item.hostClock ? ' (host-written)' : ''}`,
      `Accessed         ${formatIso(item.accessedAt)}${item.hostClock ? ' (host-written)' : ''}`,
      `SHA-256          ${item.hashes.sha256}`,
      `SHA-1            ${item.hashes.sha1}`,
      `MD5              ${item.hashes.md5}`,
      `Bytes hashed     ${bytes.length}`,
      `Carved sample    ${item.carved ? 'yes' : 'no'}`,
      `Tags             ${item.tags.join(', ') || 'none'}`,
    ]
    if (item.caveat) lines.push('', `CAVEAT: ${item.caveat}`)
    return lines.join('\n')
  }, [item, bytes.length])

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(240px,282px)_minmax(0,1fr)] gap-2">
      <ArtifactPicker />

      <Panel className="min-h-0" lit>
        <PanelHeader
          title="Metadata sheet"
          icon={<Tags />}
          subtitle={item ? item.label : 'No artifact selected'}
          readout={item ? item.id : undefined}
        />

        <ArtifactLenses />

        {!item ? (
          <EmptyState
            title="Select an artifact"
            hint="The metadata sheet shows provenance, MACB timestamps under both clock bases, and the digests computed from the artifact data object."
            icon={<Tags />}
          />
        ) : (
          <>
            <Toolbar>
              <StatusPill value={item.status} />
              <SignificanceTag value={item.significance} />
              <Badge>{item.category}</Badge>
              {item.carved ? <Badge tone="amber">carved sample</Badge> : null}
              {item.hostClock ? <Badge tone="amber">host clock</Badge> : null}
              <div className="flex-1" />
              <CopyTextButton text={sheet} label="Copy metadata sheet" />
            </Toolbar>

            <div className="min-h-0 flex-1 overflow-auto">
              <div className="p-3">
                <ConfidenceBar value={item.confidence} label="Artifact confidence" />
              </div>

              {item.caveat ? (
                <div className="mx-3 mb-3 rounded-[2px] border border-amber/30 bg-amber/8 px-3 py-2">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-amber uppercase">Examiner caveat</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-2">{item.caveat}</p>
                </div>
              ) : null}

              <SectionLabel>Identity</SectionLabel>
              <dl className="mx-3 rounded-[2px] border border-line">
                <FieldRow label="Evidence ID" value={item.id} mono />
                <FieldRow label="Label" value={item.label} />
                <FieldRow label="Type" value={item.type} />
                <FieldRow label="Description" value={item.description} />
              </dl>

              <SectionLabel>File system</SectionLabel>
              <dl className="mx-3 rounded-[2px] border border-line">
                <FieldRow label="Path" value={item.path ?? 'not a filesystem object'} mono />
                {item.path ? <FieldRow label="Parent directory" value={dirname(item.path)} mono /> : null}
                {item.path ? <FieldRow label="Filename" value={basename(item.path)} mono /> : null}
                {item.path ? <FieldRow label="Extension" value={extname(item.path) || 'none'} mono /> : null}
                <FieldRow label="MIME type" value={item.mimeType ?? 'application/octet-stream'} mono />
                <FieldRow
                  label="Size"
                  value={
                    item.sizeBytes
                      ? `${formatBytes(item.sizeBytes)}  (${formatNumber(item.sizeBytes)} bytes)`
                      : 'not applicable'
                  }
                  mono
                />
                <FieldRow label="Owner" value={item.owner ?? 'n/a'} mono />
                <FieldRow label="Permissions" value={item.permissions ?? 'n/a'} />
              </dl>

              <SectionLabel>MACB timestamps</SectionLabel>
              {item.hostClock ? (
                <p className="px-3 pb-1.5 text-[11px] leading-relaxed text-ink-4">
                  This artifact was timestamped by DEV-0042, whose clock ran 3m12s fast against the domain time
                  source. Both readings are shown so the record can be reconciled with externally sourced evidence.
                </p>
              ) : (
                <p className="px-3 pb-1.5 text-[11px] text-ink-4">
                  Externally sourced record. The timestamps are already aligned to the case reference clock.
                </p>
              )}
              <div className="mx-3 overflow-hidden rounded-[2px] border border-line">
                <div className="grid grid-cols-[minmax(96px,26%)_1fr_1fr] gap-3 border-b border-line bg-panel-2/70 px-3 py-1.5">
                  <span className="text-[10px] tracking-[0.12em] text-ink-4 uppercase">Attribute</span>
                  <span className="text-[10px] tracking-[0.12em] text-ink-4 uppercase">Normalised (NTP)</span>
                  <span className="text-[10px] tracking-[0.12em] text-ink-4 uppercase">
                    {item.hostClock ? 'As recorded on host' : 'Source clock'}
                  </span>
                </div>
                {(
                  [
                    ['Created', item.createdAt],
                    ['Modified', item.modifiedAt],
                    ['Accessed', item.accessedAt],
                    ['Acquired', item.acquiredAt],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[minmax(96px,26%)_1fr_1fr] gap-3 border-b border-line/60 px-3 py-1.5 last:border-0"
                  >
                    <span className="text-[11px] text-ink-4">{label}</span>
                    <span className="tabular font-mono text-[11px] text-ink-2">{formatTs(value)}</span>
                    <span className="tabular font-mono text-[11px] text-amber">
                      {item.hostClock && label !== 'Acquired'
                        ? formatTs(displayTs(value, 'host', true))
                        : formatTs(value)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="px-3 pt-1.5 text-[10px] text-ink-4">
                Current display basis: {clockBasis === 'host' ? 'host clock' : 'normalised'}. Switch it in the header.
              </p>

              <SectionLabel>Digests</SectionLabel>
              <dl className="mx-3 rounded-[2px] border border-line">
                <FieldRow label="SHA-256" value={<HashText value={item.hashes.sha256} />} />
                <FieldRow label="SHA-1" value={<HashText value={item.hashes.sha1} grouped={false} />} />
                <FieldRow label="MD5" value={<HashText value={item.hashes.md5} grouped={false} />} />
                <FieldRow label="Bytes hashed" value={formatNumber(bytes.length)} mono />
                <FieldRow
                  label="Digest scope"
                  value={item.carved ? 'Carved sample carried in the case file' : 'Complete data object'}
                />
              </dl>

              <SectionLabel>Provenance</SectionLabel>
              <dl className="mx-3 rounded-[2px] border border-line">
                <FieldRow label="Source" value={item.source} />
                <FieldRow label="Acquired" value={formatIso(item.acquiredAt)} mono />
                {item.deviceId ? (
                  <FieldRow
                    label="Device"
                    value={`${item.deviceId} - ${deviceById.get(item.deviceId)?.name ?? 'unknown'}`}
                  />
                ) : null}
                {item.personId ? (
                  <FieldRow label="Person" value={personById.get(item.personId)?.name ?? item.personId} />
                ) : null}
                {item.accountId ? (
                  <FieldRow
                    label="Account"
                    value={accountById.get(item.accountId)?.username ?? item.accountId}
                    mono
                  />
                ) : null}
                <FieldRow
                  label="Tags"
                  value={
                    item.tags.length ? (
                      <span className="flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))}
                      </span>
                    ) : (
                      'none'
                    )
                  }
                />
              </dl>

              <SectionLabel>Related events</SectionLabel>
              <div className="mx-3 mb-4 rounded-[2px] border border-line">
                {events.length === 0 ? (
                  <p className="px-3 py-3 text-[11px] text-ink-4">No event in the case file cites this artifact.</p>
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
            </div>
          </>
        )}
      </Panel>
    </div>
  )
}
