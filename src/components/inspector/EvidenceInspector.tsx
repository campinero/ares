import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Binary, Braces, Flag, Link2, ScrollText, X } from 'lucide-react'
import {
  CASE,
  evidenceBytes,
  evidenceById,
  eventsForEvidence,
  deviceById,
  personById,
  accountById,
  entityById,
} from '@/data'
import { useCase, type InspectorTab } from '@/store/useCase'
import { displayTs, formatIso, formatTs } from '@/lib/time'
import { formatBytes, toHexOffset } from '@/lib/format'
import {
  Badge,
  Button,
  ConfidenceBar,
  FieldRow,
  HashText,
  IconButton,
  SEVERITY_TONE,
  SignificanceTag,
  StatusPill,
  Tabs,
  type TabDef,
} from '@/components/ui'

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'metadata', label: 'Metadata' },
  { id: 'hash', label: 'Hash' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'relationships', label: 'Relations' },
  { id: 'raw', label: 'Raw data' },
]

export function EvidenceInspector() {
  const open = useCase((s) => s.inspectorOpen)
  const id = useCase((s) => s.selectedEvidenceId)
  const tab = useCase((s) => s.inspectorTab)
  const setTab = useCase((s) => s.setInspectorTab)
  const close = useCase((s) => s.closeInspector)
  const clockBasis = useCase((s) => s.clockBasis)
  const flagged = useCase((s) => s.flagged)
  const reviewed = useCase((s) => s.reviewed)
  const toggleFlagged = useCase((s) => s.toggleFlagged)
  const toggleReviewed = useCase((s) => s.toggleReviewed)
  const selectEvent = useCase((s) => s.selectEvent)
  const navigate = useNavigate()

  const item = id ? evidenceById.get(id) : undefined
  const events = useMemo(() => (item ? eventsForEvidence(item.id) : []), [item])
  const relations = useMemo(() => {
    if (!item) return []
    return CASE.relations.filter((r) => r.evidenceIds.includes(item.id))
  }, [item])
  const bytes = useMemo(() => (item ? evidenceBytes(item.id) : new Uint8Array(0)), [item])

  return (
    <AnimatePresence>
      {open && item ? (
        <motion.aside
          key="inspector"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 388, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative z-10 flex shrink-0 flex-col overflow-hidden border-l border-line bg-panel/95 backdrop-blur"
          aria-label="Evidence inspector"
        >
          <header className="flex shrink-0 items-start gap-2 border-b border-line px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="tabular font-mono text-[11px] text-cyan">{item.id}</span>
                <SignificanceTag value={item.significance} />
                <StatusPill value={item.status} />
              </div>
              <h2 className="mt-0.5 truncate text-[13px] font-medium text-ink" title={item.label}>
                {item.label}
              </h2>
              <p className="truncate text-[11px] text-ink-4">{item.type}</p>
            </div>
            <IconButton label="Close inspector" onClick={close}>
              <X />
            </IconButton>
          </header>

          <div className="flex shrink-0 items-center gap-1.5 border-b border-line bg-abyss/40 px-3 py-1.5">
            <Button
              tone={flagged[item.id] ? 'danger' : 'default'}
              onClick={() => toggleFlagged(item.id)}
              className="h-6"
            >
              <Flag />
              {flagged[item.id] ? 'Flagged' : 'Flag'}
            </Button>
            <Button
              tone={reviewed[item.id] ? 'primary' : 'default'}
              onClick={() => toggleReviewed(item.id)}
              className="h-6"
            >
              {reviewed[item.id] ? 'Reviewed' : 'Mark reviewed'}
            </Button>
            <div className="flex-1" />
            <IconButton label="Open in hex viewer" onClick={() => navigate('/hex')}>
              <Binary />
            </IconButton>
            <IconButton label="Open in strings viewer" onClick={() => navigate('/strings')}>
              <Braces />
            </IconButton>
            <IconButton label="Open in metadata viewer" onClick={() => navigate('/metadata')}>
              <ScrollText />
            </IconButton>
          </div>

          <Tabs tabs={TABS} active={tab} onChange={(t) => setTab(t as InspectorTab)} />

          <div className="min-h-0 flex-1 overflow-auto">
            {tab === 'overview' ? (
              <div className="flex flex-col gap-3 p-3">
                <p className="text-[12px] leading-relaxed text-ink-2">{item.description}</p>
                {item.caveat ? (
                  <div className="rounded-[2px] border border-amber/30 bg-amber/8 px-2.5 py-2">
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-amber uppercase">Examiner caveat</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-2">{item.caveat}</p>
                  </div>
                ) : null}
                <ConfidenceBar value={item.confidence} label="Artifact confidence" />
                <dl className="rounded-[2px] border border-line">
                  <FieldRow label="Source" value={item.source} />
                  <FieldRow label="Category" value={item.category} />
                  {item.deviceId ? (
                    <FieldRow label="Device" value={deviceById.get(item.deviceId)?.name ?? item.deviceId} />
                  ) : null}
                  {item.personId ? (
                    <FieldRow label="Person" value={personById.get(item.personId)?.name ?? item.personId} />
                  ) : null}
                  {item.accountId ? (
                    <FieldRow label="Account" value={accountById.get(item.accountId)?.username ?? item.accountId} />
                  ) : null}
                  {item.path ? <FieldRow label="Path" value={item.path} mono /> : null}
                  {item.sizeBytes !== undefined ? (
                    <FieldRow label="Size" value={`${formatBytes(item.sizeBytes)} (${item.sizeBytes.toLocaleString('en-US')} bytes)`} mono />
                  ) : null}
                </dl>
                {item.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === 'metadata' ? (
              <dl className="m-3 rounded-[2px] border border-line">
                <FieldRow label="Evidence ID" value={item.id} mono />
                <FieldRow label="Type" value={item.type} />
                <FieldRow label="MIME" value={item.mimeType ?? 'application/octet-stream'} mono />
                <FieldRow label="Owner" value={item.owner ?? 'n/a'} mono />
                <FieldRow label="Permissions" value={item.permissions ?? 'n/a'} />
                <FieldRow label="Acquired" value={formatIso(item.acquiredAt)} mono />
                <FieldRow
                  label="Created"
                  value={formatTs(displayTs(item.createdAt, clockBasis, item.hostClock))}
                  mono
                />
                <FieldRow
                  label="Modified"
                  value={formatTs(displayTs(item.modifiedAt, clockBasis, item.hostClock))}
                  mono
                />
                <FieldRow
                  label="Accessed"
                  value={formatTs(displayTs(item.accessedAt, clockBasis, item.hostClock))}
                  mono
                />
                <FieldRow
                  label="Clock basis"
                  value={
                    item.hostClock
                      ? `Host-written (${clockBasis === 'host' ? 'showing recorded' : 'showing normalised'})`
                      : 'Externally sourced, already normalised'
                  }
                />
              </dl>
            ) : null}

            {tab === 'hash' ? (
              <div className="flex flex-col gap-3 p-3">
                <div className="rounded-[2px] border border-line p-2.5">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-ink-4 uppercase">SHA-256</p>
                  <div className="mt-1">
                    <HashText value={item.hashes.sha256} />
                  </div>
                </div>
                <dl className="rounded-[2px] border border-line">
                  <FieldRow label="SHA-1" value={<HashText value={item.hashes.sha1} grouped={false} />} />
                  <FieldRow label="MD5" value={<HashText value={item.hashes.md5} grouped={false} />} />
                  <FieldRow label="Digest scope" value={item.carved ? 'Carved sample carried in the case file' : 'Complete data object'} />
                  <FieldRow label="Bytes hashed" value={`${bytes.length.toLocaleString('en-US')}`} mono />
                </dl>
                <p className="text-[11px] leading-relaxed text-ink-4">
                  Digests are computed in this session from the artifact data object, not stored alongside it. The
                  chain of custody module recomputes them to verify integrity.
                </p>
              </div>
            ) : null}

            {tab === 'timeline' ? (
              <div className="flex flex-col p-3">
                {events.length === 0 ? (
                  <p className="py-6 text-center text-[11px] text-ink-4">No events cite this artifact.</p>
                ) : (
                  events.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        selectEvent(event.id)
                        navigate('/timeline')
                      }}
                      className="group flex items-start gap-2.5 border-b border-line/60 py-2 text-left last:border-0 hover:bg-panel-2"
                    >
                      <span className="tabular mt-[2px] shrink-0 font-mono text-[11px] text-cyan">
                        {formatTs(displayTs(event.at, clockBasis, event.hostClock)).slice(11)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[12px] text-ink-2 group-hover:text-ink">{event.title}</span>
                          <Badge tone={SEVERITY_TONE[event.severity]}>{event.severity}</Badge>
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-ink-4">{event.source}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}

            {tab === 'relationships' ? (
              <div className="flex flex-col p-3">
                {relations.length === 0 ? (
                  <p className="py-6 text-center text-[11px] text-ink-4">
                    No graph relation is justified by this artifact yet.
                  </p>
                ) : (
                  relations.map((relation) => (
                    <div key={relation.id} className="border-b border-line/60 py-2 last:border-0">
                      <div className="flex items-center gap-1.5">
                        <Link2 className="size-3 text-ink-4" />
                        <span className="font-mono text-[10px] tracking-[0.1em] text-cyan">{relation.kind}</span>
                        <span className="tabular ml-auto font-mono text-[10px] text-ink-4">w{relation.weight}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-ink-2">
                        {entityById.get(relation.source)?.label ?? relation.source}{' '}
                        <span className="text-ink-4">to</span>{' '}
                        {entityById.get(relation.target)?.label ?? relation.target}
                      </p>
                      {relation.note ? <p className="mt-0.5 text-[10px] text-ink-4">{relation.note}</p> : null}
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {tab === 'raw' ? (
              <div className="p-3">
                <p className="mb-2 text-[10px] tracking-[0.12em] text-ink-4 uppercase">
                  First 256 bytes - open the hex module for the full object
                </p>
                <pre className="tabular overflow-x-auto rounded-[2px] border border-line bg-abyss/70 p-2 font-mono text-[10px] leading-[1.5] text-ink-3">
                  {renderHexPreview(bytes)}
                </pre>
                <Button className="mt-2" onClick={() => navigate('/hex')}>
                  <Binary />
                  Open hex viewer
                </Button>
              </div>
            ) : null}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}

function renderHexPreview(bytes: Uint8Array, limit = 256): string {
  const lines: string[] = []
  const end = Math.min(bytes.length, limit)
  for (let offset = 0; offset < end; offset += 16) {
    const slice = bytes.subarray(offset, Math.min(offset + 16, end))
    const hex = Array.from(slice, (b) => b.toString(16).padStart(2, '0')).join(' ').padEnd(47, ' ')
    const ascii = Array.from(slice, (b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.')).join('')
    lines.push(`${toHexOffset(offset)}  ${hex}  ${ascii}`)
  }
  return lines.join('\n') || 'No data carried for this artifact.'
}
