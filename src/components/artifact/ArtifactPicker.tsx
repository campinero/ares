import { useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import { CASE, evidenceById, evidenceBytes } from '@/data'
import type { EvidenceCategory, EvidenceItem } from '@/data/types'
import { useCase } from '@/store/useCase'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/format'
import {
  EmptyState,
  FilterChip,
  Panel,
  PanelBody,
  PanelHeader,
  SearchInput,
  SignificanceTag,
  Toolbar,
} from '@/components/ui'

const EMPTY_BYTES = new Uint8Array(0)

const CATEGORIES: EvidenceCategory[] = Array.from(new Set(CASE.evidence.map((e) => e.category))).sort()

/**
 * The artifact currently under the low-level tools. Selection lives in the
 * store, so a pick made in hex carries into strings, metadata and the global
 * inspector without any local mirror state.
 */
export function useArtifact(): { item: EvidenceItem | undefined; bytes: Uint8Array } {
  const id = useCase((s) => s.selectedEvidenceId)
  const item = id ? evidenceById.get(id) : undefined
  const bytes = useMemo(() => (item ? evidenceBytes(item.id) : EMPTY_BYTES), [item])
  return { item, bytes }
}

function haystack(item: EvidenceItem): string {
  return [item.id, item.label, item.type, item.source, item.path ?? '', item.tags.join(' ')]
    .join(' ')
    .toLowerCase()
}

/** Left rail shared by the hex, strings and metadata workspaces. */
export function ArtifactPicker({ className }: { className?: string }) {
  const selectedId = useCase((s) => s.selectedEvidenceId)
  const selectEvidence = useCase((s) => s.selectEvidence)
  const investigationMode = useCase((s) => s.investigationMode)
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<EvidenceCategory[]>([])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CASE.evidence.filter((item) => {
      if (investigationMode && item.significance === 'noise') return false
      if (categories.length > 0 && !categories.includes(item.category)) return false
      if (q && !haystack(item).includes(q)) return false
      return true
    })
  }, [query, categories, investigationMode])

  const counts = useMemo(() => {
    const map = new Map<EvidenceCategory, number>()
    for (const item of CASE.evidence) {
      if (investigationMode && item.significance === 'noise') continue
      map.set(item.category, (map.get(item.category) ?? 0) + 1)
    }
    return map
  }, [investigationMode])

  function toggleCategory(cat: EvidenceCategory) {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))
  }

  return (
    <Panel className={cn('w-[286px] shrink-0', className)}>
      <PanelHeader
        title="Artifacts"
        icon={<Layers />}
        readout={`${visible.length}/${CASE.evidence.length}`}
        subtitle={investigationMode ? 'Investigation mode - noise hidden' : undefined}
      />
      <Toolbar className="flex-col items-stretch gap-1.5">
        <SearchInput value={query} onChange={setQuery} placeholder="ID, label, path, tag" />
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              active={categories.includes(cat)}
              onClick={() => toggleCategory(cat)}
              count={counts.get(cat) ?? 0}
            >
              {cat}
            </FilterChip>
          ))}
        </div>
      </Toolbar>
      <PanelBody>
        {visible.length === 0 ? (
          <EmptyState title="No artifact matches" hint="Relax the search or clear the category filters." />
        ) : (
          <ul>
            {visible.map((item) => {
              const selected = item.id === selectedId
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => selectEvidence(item.id)}
                    aria-current={selected}
                    className={cn(
                      'w-full border-b border-line/50 px-2.5 py-1.5 text-left transition-colors',
                      selected ? 'bg-cyan/10 ring-1 ring-cyan/25 ring-inset' : 'hover:bg-panel-3/70',
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="tabular font-mono text-[10px] text-cyan">{item.id}</span>
                      <span className="flex-1" />
                      <SignificanceTag value={item.significance} />
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-ink-2" title={item.label}>
                      {item.label}
                    </p>
                    <p className="tabular truncate font-mono text-[10px] text-ink-4">
                      {item.category} - {formatBytes(evidenceBytes(item.id).length)} carried
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </PanelBody>
    </Panel>
  )
}
