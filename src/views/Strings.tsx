import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Braces, Minus, Plus, Regex } from 'lucide-react'
import { ArtifactLenses, ArtifactPicker, CopyTextButton, useArtifact } from '@/components/artifact'
import { extractStrings } from '@/data'
import { formatNumber, toHexOffset } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  Badge,
  Button,
  EmptyState,
  FilterChip,
  IconButton,
  Panel,
  PanelHeader,
  SearchInput,
  Toolbar,
} from '@/components/ui'

/** Terms that make a recovered run worth an examiner second look. */
const CASE_TERMS = [
  'halcyon',
  'research_archive',
  'vaultbridge',
  'fieldkit',
  'morgan.reed',
  'meridian',
  'ittools',
  '7z',
  'srv-core-03',
  'dev-0042',
  'wks-0088',
  '60a44c41',
  'e:',
  'h:',
  'lnk',
  'usbstor',
]

/** Runs that are structural filler rather than recovered content. */
function looksLikePadding(text: string): boolean {
  if (text.length < 6) return false
  const unique = new Set(text).size
  if (unique <= 2) return true
  return /^([\x20-\x7e])\1{5,}$/.test(text)
}

const ESCAPE = String.fromCharCode(92)

export function Strings() {
  const { item, bytes } = useArtifact()
  const navigate = useNavigate()

  const [minLength, setMinLength] = useState(4)
  const [query, setQuery] = useState('')
  const [useRegex, setUseRegex] = useState(false)
  const [hidePadding, setHidePadding] = useState(true)
  const [onlyRelevant, setOnlyRelevant] = useState(false)

  const runs = useMemo(() => (bytes.length ? extractStrings(bytes, minLength) : []), [bytes, minLength])

  // A pattern source rather than a RegExp: a shared lastIndex across a filter
  // pass and a render pass is a real bug, so each use compiles its own.
  const { source, error } = useMemo(() => {
    if (!query.trim()) return { source: null as string | null, error: null as string | null }
    if (!useRegex) {
      return { source: [...query].map((c) => (/[a-zA-Z0-9 _-]/.test(c) ? c : ESCAPE + c)).join(''), error: null }
    }
    try {
      new RegExp(query)
      return { source: query, error: null }
    } catch (e) {
      return { source: null, error: e instanceof Error ? e.message : 'Invalid pattern' }
    }
  }, [query, useRegex])

  const filtered = useMemo(() => {
    return runs.filter((run) => {
      if (hidePadding && looksLikePadding(run.text)) return false
      if (onlyRelevant) {
        const lower = run.text.toLowerCase()
        if (!CASE_TERMS.some((term) => lower.includes(term))) return false
      }
      if (!source) return true
      return new RegExp(source, 'i').test(run.text)
    })
  }, [runs, hidePadding, onlyRelevant, source])

  const longest = useMemo(() => filtered.reduce((max, r) => Math.max(max, r.length), 0), [filtered])
  const allText = useMemo(
    () => filtered.map((r) => `${toHexOffset(r.offset)}  ${r.text}`).join('\n'),
    [filtered],
  )

  function highlight(text: string) {
    if (!source) return text
    const parts: Array<{ text: string; hit: boolean }> = []
    let cursor = 0
    for (const match of text.matchAll(new RegExp(source, 'ig'))) {
      const index = match.index ?? 0
      if (index > cursor) parts.push({ text: text.slice(cursor, index), hit: false })
      parts.push({ text: match[0], hit: true })
      cursor = index + match[0].length
      if (match[0].length === 0) break
    }
    if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false })
    return parts.map((part, index) =>
      part.hit ? (
        <mark key={index} className="bg-cyan/30 text-ink">
          {part.text}
        </mark>
      ) : (
        <span key={index}>{part.text}</span>
      ),
    )
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(240px,282px)_minmax(0,1fr)] gap-2">
      <ArtifactPicker />

      <Panel className="min-h-0" lit>
        <PanelHeader
          title="Strings"
          icon={<Braces />}
          subtitle={item ? item.label : 'No artifact selected'}
          readout={item ? `${formatNumber(filtered.length)} / ${formatNumber(runs.length)} runs` : undefined}
        />

        <ArtifactLenses />

        {!item ? (
          <EmptyState
            title="Select an artifact"
            hint="Printable runs are extracted from the same byte buffer the hex viewer and the digests read from."
            icon={<Braces />}
          />
        ) : (
          <>
            <Toolbar>
              <SearchInput value={query} onChange={setQuery} placeholder="Filter runs" className="w-56" />
              <IconButton
                label={useRegex ? 'Regular expression mode on' : 'Regular expression mode off'}
                active={useRegex}
                onClick={() => setUseRegex((v) => !v)}
              >
                <Regex />
              </IconButton>
              {error ? <span className="max-w-[28ch] truncate text-[11px] text-signal">{error}</span> : null}

              <div className="mx-1 h-5 w-px bg-line" />

              <span className="text-[10px] tracking-[0.1em] text-ink-4 uppercase">Min length</span>
              <IconButton label="Decrease minimum length" onClick={() => setMinLength((v) => Math.max(4, v - 1))}>
                <Minus />
              </IconButton>
              <span className="tabular w-6 text-center font-mono text-[12px] text-ink-2">{minLength}</span>
              <IconButton label="Increase minimum length" onClick={() => setMinLength((v) => Math.min(32, v + 1))}>
                <Plus />
              </IconButton>

              <div className="mx-1 h-5 w-px bg-line" />

              <FilterChip active={hidePadding} onClick={() => setHidePadding((v) => !v)}>
                Hide padding
              </FilterChip>
              <FilterChip active={onlyRelevant} onClick={() => setOnlyRelevant((v) => !v)}>
                Case relevant
              </FilterChip>

              <div className="flex-1" />
              <CopyTextButton text={allText} label="Copy all filtered" disabled={filtered.length === 0} />
            </Toolbar>

            {filtered.length === 0 ? (
              <EmptyState
                title="No printable run matches"
                hint="Lower the minimum length, clear the filters, or widen the search."
                action={
                  <Button
                    onClick={() => {
                      setQuery('')
                      setOnlyRelevant(false)
                      setHidePadding(false)
                      setMinLength(4)
                    }}
                  >
                    Reset extraction
                  </Button>
                }
              />
            ) : (
              <div className="min-h-0 flex-1 overflow-auto">
                {filtered.map((run) => {
                  const relevant = CASE_TERMS.some((term) => run.text.toLowerCase().includes(term))
                  return (
                    <div
                      key={`${run.offset}-${run.length}`}
                      className={cn(
                        'group flex items-start gap-3 border-b border-line/40 px-3 py-1 font-mono text-[11px]',
                        relevant ? 'bg-cyan/[0.05]' : 'hover:bg-panel-2/60',
                      )}
                    >
                      <button
                        type="button"
                        title="Reveal this offset in the hex viewer"
                        onClick={() => navigate(`/hex?offset=${run.offset}`)}
                        className="tabular w-[74px] shrink-0 text-left text-ink-4 hover:text-cyan"
                      >
                        {toHexOffset(run.offset)}
                      </button>
                      <span className="tabular w-[38px] shrink-0 text-right text-ink-4">{run.length}</span>
                      <span className="min-w-0 flex-1 break-all whitespace-pre-wrap text-ink-2">
                        {highlight(run.text)}
                      </span>
                      <span className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                        <CopyTextButton text={run.text} label="Copy" />
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex shrink-0 items-center gap-4 border-t border-line bg-panel-2/70 px-3 py-1.5 text-[10px] tracking-[0.1em] text-ink-4 uppercase">
              <span>
                Runs <span className="tabular font-mono text-ink-2">{formatNumber(runs.length)}</span>
              </span>
              <span>
                Shown <span className="tabular font-mono text-ink-2">{formatNumber(filtered.length)}</span>
              </span>
              <span>
                Longest <span className="tabular font-mono text-ink-2">{longest} B</span>
              </span>
              <span>
                Buffer <span className="tabular font-mono text-ink-2">{formatNumber(bytes.length)} B</span>
              </span>
              <div className="flex-1" />
              {item.carved ? <Badge tone="amber">carved sample</Badge> : null}
            </div>
          </>
        )}
      </Panel>
    </div>
  )
}
