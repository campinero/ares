import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, File, FolderClosed, FolderOpen, FolderTree, Trash2 } from 'lucide-react'
import { CASE, evidenceById, fsById } from '@/data'
import type { FsNode } from '@/data/types'
import { useCase } from '@/store/useCase'
import { displayTs, formatTs } from '@/lib/time'
import { extname, formatBytes, formatNumber } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  Badge,
  Button,
  EmptyState,
  FieldRow,
  FilterChip,
  Panel,
  PanelHeader,
  SearchInput,
  SectionLabel,
  SignificanceTag,
  Stat,
  Toolbar,
} from '@/components/ui'

interface TreeRow {
  node: FsNode
  depth: number
  hasChildren: boolean
  expanded: boolean
}

const SEP = String.fromCharCode(92)

export function FileSystem() {
  const clockBasis = useCase((s) => s.clockBasis)
  const investigationMode = useCase((s) => s.investigationMode)
  const selectEvidence = useCase((s) => s.selectEvidence)

  const [query, setQuery] = useState('')
  const [onlyDeleted, setOnlyDeleted] = useState(false)
  const [onlyEvidence, setOnlyEvidence] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Open the spine down to the project directory on first paint.
    const open = new Set<string>()
    for (const node of CASE.filesystem) {
      if (node.kind !== 'directory') continue
      const depth = node.path.split(SEP).length
      if (depth <= 5) open.add(node.id)
    }
    return open
  })

  const childrenOf = useMemo(() => {
    const map = new Map<string, FsNode[]>()
    for (const node of CASE.filesystem) {
      const key = node.parentId ?? '__root__'
      const list = map.get(key) ?? []
      list.push(node)
      map.set(key, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
    }
    return map
  }, [])

  const filtering = query.trim().length > 0 || onlyDeleted || onlyEvidence

  const matches = useMemo(() => {
    if (!filtering) return null
    const q = query.trim().toLowerCase()
    const hits = new Set<string>()
    for (const node of CASE.filesystem) {
      if (investigationMode && node.significance === 'noise') continue
      if (onlyDeleted && !node.deleted) continue
      if (onlyEvidence && !node.evidenceId) continue
      if (q && !`${node.name} ${node.path}`.toLowerCase().includes(q)) continue
      hits.add(node.id)
      // keep ancestors so the hit stays reachable in the tree
      let cursor = node.parentId
      while (cursor) {
        hits.add(cursor)
        cursor = fsById.get(cursor)?.parentId
      }
    }
    return hits
  }, [query, onlyDeleted, onlyEvidence, filtering, investigationMode])

  const rows = useMemo(() => {
    const out: TreeRow[] = []
    const visit = (parentKey: string, depth: number) => {
      for (const node of childrenOf.get(parentKey) ?? []) {
        if (matches && !matches.has(node.id)) continue
        if (!matches && investigationMode && node.significance === 'noise') continue
        const kids = (childrenOf.get(node.id) ?? []).filter((c) => !matches || matches.has(c.id))
        const isOpen = filtering || expanded.has(node.id)
        out.push({ node, depth, hasChildren: kids.length > 0, expanded: isOpen })
        if (kids.length > 0 && isOpen) visit(node.id, depth + 1)
      }
    }
    visit('__root__', 0)
    return out
  }, [childrenOf, expanded, matches, filtering, investigationMode])

  const selected = selectedId ? fsById.get(selectedId) ?? null : null
  const deletedCount = CASE.filesystem.filter((n) => n.deleted).length
  const fileCount = CASE.filesystem.filter((n) => n.kind === 'file').length
  const totalBytes = CASE.filesystem.reduce((sum, n) => sum + n.sizeBytes, 0)

  function toggleNode(id: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        <Panel>
          <Stat label="Objects" value={formatNumber(CASE.filesystem.length)} hint={`${fileCount} files`} icon={<FolderTree />} />
        </Panel>
        <Panel>
          <Stat label="Deleted recovered" value={String(deletedCount)} tone="warn" icon={<Trash2 />} />
        </Panel>
        <Panel>
          <Stat label="Allocated" value={formatBytes(totalBytes, 1)} />
        </Panel>
        <Panel>
          <Stat
            label="With evidence record"
            value={String(CASE.filesystem.filter((n) => n.evidenceId).length)}
            tone="good"
          />
        </Panel>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(300px,344px)] gap-2">
        <Panel className="min-h-0" lit>
          <PanelHeader
            title="File system"
            icon={<FolderTree />}
            subtitle="NTFS system volume and the referenced removable volume"
            readout={`${rows.length} rows`}
          />

          <Toolbar>
            <SearchInput value={query} onChange={setQuery} placeholder="Search name or path" className="w-64" />
            <FilterChip active={onlyDeleted} onClick={() => setOnlyDeleted((v) => !v)} count={deletedCount}>
              Deleted
            </FilterChip>
            <FilterChip active={onlyEvidence} onClick={() => setOnlyEvidence((v) => !v)}>
              Has evidence record
            </FilterChip>
            <div className="flex-1" />
            <Button onClick={() => setExpanded(new Set(CASE.filesystem.filter((n) => n.kind === 'directory').map((n) => n.id)))}>
              Expand all
            </Button>
            <Button onClick={() => setExpanded(new Set())}>Collapse</Button>
          </Toolbar>

          {rows.length === 0 ? (
            <EmptyState
              title="No object matches"
              hint="Clear the filters to bring the tree back."
              action={
                <Button
                  onClick={() => {
                    setQuery('')
                    setOnlyDeleted(false)
                    setOnlyEvidence(false)
                  }}
                >
                  Reset
                </Button>
              }
            />
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              {rows.map(({ node, depth, hasChildren, expanded: isOpen }) => {
                const active = node.id === selectedId
                return (
                  <div
                    key={node.id}
                    role="row"
                    tabIndex={0}
                    onClick={() => setSelectedId(node.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSelectedId(node.id)
                      if (e.key === 'ArrowRight' && hasChildren && !isOpen) toggleNode(node.id)
                      if (e.key === 'ArrowLeft' && hasChildren && isOpen) toggleNode(node.id)
                    }}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 border-b border-line/40 py-[3px] pr-3 text-[12px] transition-colors',
                      active ? 'bg-cyan/12' : 'hover:bg-panel-2/70',
                      node.deleted && 'text-ink-4',
                    )}
                    style={{ paddingLeft: 10 + depth * 14 }}
                  >
                    {hasChildren ? (
                      <button
                        type="button"
                        aria-label={isOpen ? 'Collapse' : 'Expand'}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleNode(node.id)
                        }}
                        className="text-ink-4 hover:text-cyan"
                      >
                        {isOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                      </button>
                    ) : (
                      <span className="w-3" />
                    )}

                    {node.kind === 'directory' ? (
                      isOpen ? (
                        <FolderOpen className="size-3.5 shrink-0 text-azure" />
                      ) : (
                        <FolderClosed className="size-3.5 shrink-0 text-azure/70" />
                      )
                    ) : node.deleted ? (
                      <Trash2 className="size-3.5 shrink-0 text-signal/80" />
                    ) : (
                      <File className="size-3.5 shrink-0 text-ink-4" />
                    )}

                    <span className={cn('min-w-0 flex-1 truncate', node.deleted && 'line-through')}>{node.name}</span>

                    {node.evidenceId ? (
                      <span className="tabular shrink-0 font-mono text-[9px] text-cyan">{node.evidenceId}</span>
                    ) : null}
                    {node.significance === 'critical' ? <SignificanceTag value={node.significance} /> : null}
                    <span className="tabular w-[76px] shrink-0 text-right font-mono text-[10px] text-ink-4">
                      {node.kind === 'file' ? formatBytes(node.sizeBytes, 1) : ''}
                    </span>
                    <span className="tabular hidden w-[128px] shrink-0 text-right font-mono text-[10px] text-ink-4 xl:block">
                      {formatTs(displayTs(node.modified, clockBasis, node.hostClock))}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>

        <Panel className="min-h-0">
          <PanelHeader
            title={selected ? selected.name : 'Object detail'}
            subtitle={selected ? selected.kind : 'Nothing selected'}
            readout={selected?.mftRecord ? `MFT ${selected.mftRecord}` : undefined}
          />
          <div className="min-h-0 flex-1 overflow-auto">
            {!selected ? (
              <EmptyState
                title="No object selected"
                hint="Pick a file or directory to review its MACB times, ownership and the evidence record carved from it."
                icon={<FolderTree />}
              />
            ) : (
              <div className="flex flex-col gap-3 p-3">
                {selected.deleted ? (
                  <div className="rounded-[2px] border border-signal/30 bg-signal/[0.06] px-3 py-2">
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-signal uppercase">Deleted object</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-2">
                      {selected.recoverable
                        ? 'Content was recovered from unallocated clusters. Recovery does not establish intent behind the deletion.'
                        : 'Metadata only. The content was not recoverable.'}
                    </p>
                  </div>
                ) : null}

                <dl className="rounded-[2px] border border-line">
                  <FieldRow label="Path" value={selected.path} mono />
                  <FieldRow label="Kind" value={selected.kind} />
                  {selected.kind === 'file' ? (
                    <>
                      <FieldRow label="Extension" value={extname(selected.path) || 'none'} mono />
                      <FieldRow
                        label="Size"
                        value={`${formatBytes(selected.sizeBytes)} (${formatNumber(selected.sizeBytes)} bytes)`}
                        mono
                      />
                    </>
                  ) : null}
                  <FieldRow label="Owner" value={selected.owner} mono />
                  <FieldRow label="Permissions" value={selected.permissions} />
                  <FieldRow label="Attributes" value={selected.attributes.join(', ') || 'none'} mono />
                  {selected.mftRecord ? <FieldRow label="MFT record" value={String(selected.mftRecord)} mono /> : null}
                </dl>

                <SectionLabel>MACB</SectionLabel>
                <dl className="rounded-[2px] border border-line">
                  <FieldRow label="Modified" value={formatTs(displayTs(selected.modified, clockBasis, selected.hostClock))} mono />
                  <FieldRow label="Accessed" value={formatTs(displayTs(selected.accessed, clockBasis, selected.hostClock))} mono />
                  <FieldRow label="Changed" value={formatTs(displayTs(selected.changed, clockBasis, selected.hostClock))} mono />
                  <FieldRow label="Birth" value={formatTs(displayTs(selected.created, clockBasis, selected.hostClock))} mono />
                </dl>
                {selected.changed !== selected.modified ? (
                  <div className="rounded-[2px] border border-amber/30 bg-amber/[0.06] px-3 py-2">
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-amber uppercase">
                      Timestamp inconsistency
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-2">
                      The $FILE_NAME changed time does not match the $STANDARD_INFORMATION modified time. That pattern
                      is produced both by anti-forensic timestomping and by ordinary copy operations, so it is not by
                      itself evidence of either. Check the evidence record for the examiner assessment.
                    </p>
                  </div>
                ) : null}

                {selected.hostClock ? (
                  <p className="text-[11px] leading-relaxed text-ink-4">
                    Timestamps written by DEV-0042. Normalised values shown when the header basis is set to
                    normalised; the host recorded them 3m12s later.
                  </p>
                ) : null}

                {selected.evidenceId ? (
                  <>
                    <SectionLabel>Evidence record</SectionLabel>
                    <Button tone="primary" onClick={() => selectEvidence(selected.evidenceId as string)}>
                      Open {selected.evidenceId}
                    </Button>
                    <p className="text-[11px] text-ink-4">
                      {evidenceById.get(selected.evidenceId)?.label ?? 'artifact not resident in this case file'}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge>no evidence record</Badge>
                    <span className="text-[11px] text-ink-4">This object was catalogued but not carved into the case file.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}
