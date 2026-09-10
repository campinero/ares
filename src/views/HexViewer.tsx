import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Binary, Crosshair, Locate } from 'lucide-react'
import { ArtifactLenses, ArtifactPicker, CopyTextButton, useArtifact } from '@/components/artifact'
import {
  Badge,
  Button,
  EmptyState,
  FilterChip,
  HashText,
  IconButton,
  Panel,
  PanelHeader,
  TextInput,
  Toolbar,
} from '@/components/ui'
import { sha256 } from '@/lib/sha256'
import { formatBytes, formatNumber, toHexOffset } from '@/lib/format'
import { cn } from '@/lib/cn'

const ROW_BYTES = 16
const ROW_H = 18
const OVERSCAN = 8
const HEX = '0123456789ABCDEF'

/* ----------------------------------------------------------- byte helpers */

function hexByte(b: number): string {
  return HEX[(b >> 4) & 0xf] + HEX[b & 0xf]
}

function asciiByte(b: number): string {
  return b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.'
}

function asciiRun(bytes: Uint8Array, start: number, end: number): string {
  let out = ''
  for (let i = start; i < end && i < bytes.length; i++) out += asciiByte(bytes[i])
  return out
}

function hexRun(bytes: Uint8Array, start: number, end: number): string {
  const parts: string[] = []
  for (let i = start; i < end && i < bytes.length; i++) parts.push(hexByte(bytes[i]))
  return parts.join(' ')
}

/* ------------------------------------------------------ container signature */

interface SignatureDef {
  magic: number[]
  label: string
}

/**
 * Signature table keyed on the leading bytes only. Nothing here is keyed to a
 * specific artifact: the container is named from what the buffer actually
 * starts with, the same way file(1) would do it.
 */
const SIGNATURES: SignatureDef[] = [
  { magic: [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00], label: 'SQLite 3 database' },
  { magic: [0x45, 0x6c, 0x66, 0x46, 0x69, 0x6c, 0x65, 0x00], label: 'Windows EVTX event log' },
  { magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], label: 'PNG image' },
  { magic: [0x45, 0x46, 0x49, 0x20, 0x50, 0x41, 0x52, 0x54], label: 'GPT partition table' },
  { magic: [0x25, 0x50, 0x44, 0x46, 0x2d], label: 'PDF document' },
  { magic: [0x50, 0x4b, 0x03, 0x04], label: 'ZIP / OOXML container' },
  { magic: [0x7f, 0x45, 0x4c, 0x46], label: 'ELF binary' },
  { magic: [0xff, 0xd8, 0xff], label: 'JPEG image' },
  { magic: [0x49, 0x44, 0x33], label: 'MP3 audio (ID3v2)' },
  { magic: [0x1f, 0x8b], label: 'GZIP stream' },
  { magic: [0x4d, 0x5a], label: 'MZ / PE executable' },
]

function detectSignature(bytes: Uint8Array): SignatureDef | null {
  for (const sig of SIGNATURES) {
    if (bytes.length < sig.magic.length) continue
    let ok = true
    for (let i = 0; i < sig.magic.length; i++) {
      if (bytes[i] !== sig.magic[i]) {
        ok = false
        break
      }
    }
    if (ok) return sig
  }
  return null
}

/* ---------------------------------------------------------------- searching */

interface Pattern {
  bytes: number[]
  error: string | null
}

function parseHexPattern(raw: string): Pattern {
  const cleaned = raw.toLowerCase().replace(/0x/g, '').replace(/[^0-9a-f]/g, '')
  if (cleaned.length === 0) return { bytes: [], error: 'Enter hex digits, e.g. 50 4b 03 04' }
  if (cleaned.length % 2 !== 0) return { bytes: [], error: 'Odd number of hex digits' }
  const out: number[] = []
  for (let i = 0; i < cleaned.length; i += 2) out.push(parseInt(cleaned.slice(i, i + 2), 16))
  return { bytes: out, error: null }
}

function parseAsciiPattern(raw: string): Pattern {
  if (raw.length === 0) return { bytes: [], error: null }
  const out: number[] = []
  for (let i = 0; i < raw.length; i++) out.push(raw.charCodeAt(i) & 0xff)
  return { bytes: out, error: null }
}

function findMatches(hay: Uint8Array, needle: number[]): number[] {
  if (needle.length === 0 || needle.length > hay.length) return []
  const out: number[] = []
  const last = hay.length - needle.length
  for (let i = 0; i <= last; i++) {
    let ok = true
    for (let j = 0; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) {
        ok = false
        break
      }
    }
    if (ok) out.push(i)
  }
  return out
}

/* --------------------------------------------------------- offset + decode */

function parseOffset(raw: string, max: number): { offset: number | null; error: string | null } {
  const text = raw.trim().toLowerCase()
  if (text.length === 0) return { offset: null, error: 'Enter a decimal or 0x offset' }
  const isHex = text.startsWith('0x')
  const body = isHex ? text.slice(2) : text
  const valid = body.length > 0 && (isHex ? /^[0-9a-f]+$/.test(body) : /^[0-9]+$/.test(body))
  if (!valid) return { offset: null, error: isHex ? 'Not a hex number' : 'Not a decimal number' }
  const value = parseInt(body, isHex ? 16 : 10)
  if (!Number.isFinite(value)) return { offset: null, error: 'Unparsable offset' }
  if (max === 0) return { offset: null, error: 'Buffer is empty' }
  if (value < 0 || value >= max) return { offset: null, error: `Out of range (0 - ${max - 1})` }
  return { offset: value, error: null }
}

function decodeAt(bytes: Uint8Array, start: number): Array<{ label: string; value: string }> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const room = bytes.length - start
  const read = (label: string, need: number, get: () => number) => ({
    label,
    value: room >= need ? formatNumber(get()) : '--',
  })
  return [
    read('int8', 1, () => view.getInt8(start)),
    read('uint8', 1, () => view.getUint8(start)),
    read('int16LE', 2, () => view.getInt16(start, true)),
    read('uint16LE', 2, () => view.getUint16(start, true)),
    read('int32LE', 4, () => view.getInt32(start, true)),
    read('uint32LE', 4, () => view.getUint32(start, true)),
  ]
}

/* ------------------------------------------------------------------- view */

export function HexViewer() {
  const { item, bytes } = useArtifact()
  const [params, setParams] = useSearchParams()

  const [mode, setMode] = useState<'hex' | 'ascii'>('hex')
  const [needleText, setNeedleText] = useState('')
  const [matchIndex, setMatchIndex] = useState(0)
  const [jumpText, setJumpText] = useState('')
  const [jumpError, setJumpError] = useState<string | null>(null)
  const [flashRow, setFlashRow] = useState<number | null>(null)
  const [anchor, setAnchor] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportH, setViewportH] = useState(520)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const flashTimer = useRef<number | null>(null)

  const rowCount = Math.ceil(bytes.length / ROW_BYTES)
  const signature = useMemo(() => detectSignature(bytes), [bytes])
  const digest = useMemo(() => (bytes.length > 0 ? sha256(bytes) : ''), [bytes])

  const pattern = useMemo(
    () => (mode === 'hex' ? parseHexPattern(needleText) : parseAsciiPattern(needleText)),
    [mode, needleText],
  )
  const matches = useMemo(
    () => (needleText.length === 0 || pattern.error ? [] : findMatches(bytes, pattern.bytes)),
    [bytes, pattern, needleText],
  )
  const needleLength = pattern.bytes.length

  /** O(1) per-byte highlight lookup - cheaper than scanning matches per cell. */
  const matchMask = useMemo(() => {
    const mask = new Uint8Array(bytes.length)
    for (const offset of matches) {
      for (let i = 0; i < needleLength && offset + i < mask.length; i++) mask[offset + i] = 1
    }
    return mask
  }, [bytes.length, matches, needleLength])

  useEffect(() => {
    setMatchIndex(0)
  }, [needleText, mode, item?.id])

  useEffect(() => {
    setAnchor(null)
    setFocus(null)
    setJumpError(null)
  }, [item?.id])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setViewportH(el.clientHeight))
    observer.observe(el)
    setViewportH(el.clientHeight)
    return () => observer.disconnect()
  }, [item?.id])

  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current)
    }
  }, [])

  const revealOffset = useCallback((offset: number) => {
    const el = scrollRef.current
    const row = Math.floor(offset / ROW_BYTES)
    if (el) {
      const centre = Math.max(0, el.clientHeight / 2 - ROW_H)
      el.scrollTo({ top: Math.max(0, row * ROW_H - centre), behavior: 'smooth' })
    }
    setFlashRow(row)
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlashRow(null), 1100)
  }, [])

  /* A jump arriving from the strings workspace: /hex?offset=1234 */
  useEffect(() => {
    const raw = params.get('offset')
    if (raw === null || bytes.length === 0) return
    const parsed = Number.parseInt(raw, 10)
    if (Number.isFinite(parsed) && parsed >= 0 && parsed < bytes.length) {
      setAnchor(parsed)
      setFocus(parsed)
      revealOffset(parsed)
    }
    const next = new URLSearchParams(params)
    next.delete('offset')
    setParams(next, { replace: true })
  }, [params, setParams, bytes.length, revealOffset])

  const gotoMatch = useCallback(
    (index: number) => {
      if (matches.length === 0) return
      const wrapped = ((index % matches.length) + matches.length) % matches.length
      const offset = matches[wrapped]
      setMatchIndex(wrapped)
      setAnchor(offset)
      setFocus(offset + Math.max(1, needleLength) - 1)
      revealOffset(offset)
    },
    [matches, needleLength, revealOffset],
  )

  function runJump() {
    const { offset, error } = parseOffset(jumpText, bytes.length)
    setJumpError(error)
    if (offset === null) return
    setAnchor(offset)
    setFocus(offset)
    revealOffset(offset)
  }

  function onByteClick(offset: number, extend: boolean) {
    if (extend && anchor !== null) {
      setFocus(offset)
      return
    }
    setAnchor(offset)
    setFocus(offset)
  }

  const selStart = anchor !== null && focus !== null ? Math.min(anchor, focus) : null
  const selEnd = anchor !== null && focus !== null ? Math.max(anchor, focus) : null
  const selLength = selStart !== null && selEnd !== null ? selEnd - selStart + 1 : 0
  const currentStart = matches.length > 0 ? matches[Math.min(matchIndex, matches.length - 1)] : -1
  const signatureLength = signature ? signature.magic.length : 0

  const selectionHex = selStart !== null && selEnd !== null ? hexRun(bytes, selStart, selEnd + 1) : ''
  const selectionAscii = selStart !== null && selEnd !== null ? asciiRun(bytes, selStart, selEnd + 1) : ''
  const decoded = selStart !== null ? decodeAt(bytes, selStart) : []

  const firstRow = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN)
  const lastRow = Math.min(rowCount, firstRow + Math.ceil(viewportH / ROW_H) + OVERSCAN * 2)
  const windowRows: number[] = []
  for (let r = firstRow; r < lastRow; r++) windowRows.push(r)

  function cellTone(offset: number): string {
    if (selStart !== null && selEnd !== null && offset >= selStart && offset <= selEnd) {
      return 'bg-amber/25 text-ink'
    }
    if (currentStart >= 0 && offset >= currentStart && offset < currentStart + needleLength) {
      return 'bg-cyan/40 text-ink'
    }
    if (matchMask[offset] === 1) return 'bg-cyan/14 text-cyan'
    if (offset < signatureLength) return 'bg-violet/15 text-violet'
    if (bytes[offset] === 0) return 'text-ink-4'
    return 'text-ink-2'
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(240px,282px)_minmax(0,1fr)] gap-2">
      <ArtifactPicker />

      <Panel className="min-h-0" lit>
        <PanelHeader
          title="Hex viewer"
          subtitle={item ? item.label : 'No artifact selected'}
          icon={<Binary />}
          readout={item ? `${formatNumber(bytes.length)} bytes carried` : undefined}
        />

        <ArtifactLenses />

        {!item ? (
          <EmptyState
            title="Select an artifact"
            hint="Choose a data object from the list to inspect its bytes. Every buffer here is the same one the digests and the strings workspace read from."
            icon={<Binary />}
          />
        ) : (
          <>
            <Toolbar>
              <div className="flex items-center gap-1">
                <FilterChip active={mode === 'hex'} onClick={() => setMode('hex')}>
                  Hex
                </FilterChip>
                <FilterChip active={mode === 'ascii'} onClick={() => setMode('ascii')}>
                  ASCII
                </FilterChip>
              </div>

              <TextInput
                value={needleText}
                onChange={(e) => setNeedleText(e.target.value)}
                placeholder={mode === 'hex' ? '50 4b 03 04' : 'search text'}
                className="w-52"
                aria-label="Search bytes"
              />

              <span
                className={cn(
                  'tabular font-mono text-[11px]',
                  needleText.length === 0 ? 'text-ink-4' : pattern.error ? 'text-signal' : matches.length > 0 ? 'text-cyan' : 'text-ink-4',
                )}
              >
                {needleText.length === 0
                  ? 'no query'
                  : pattern.error
                    ? pattern.error
                    : matches.length === 0
                      ? 'no match'
                      : `${matchIndex + 1} / ${matches.length}`}
              </span>

              <IconButton
                label="Previous match"
                disabled={matches.length === 0}
                onClick={() => gotoMatch(matchIndex - 1)}
              >
                <ArrowUp />
              </IconButton>
              <IconButton
                label="Next match"
                disabled={matches.length === 0}
                onClick={() => gotoMatch(matchIndex + 1)}
              >
                <ArrowDown />
              </IconButton>

              <div className="mx-1 h-5 w-px bg-line" />

              <TextInput
                value={jumpText}
                onChange={(e) => setJumpText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runJump()
                }}
                placeholder="offset 0x1A0"
                className="w-32"
                aria-label="Jump to offset"
              />
              <Button onClick={runJump}>
                <Locate />
                Jump
              </Button>
              {jumpError ? <span className="text-[11px] text-signal">{jumpError}</span> : null}

              <div className="flex-1" />

              {signature ? <Badge tone="violet">{signature.label}</Badge> : <Badge>unrecognised container</Badge>}
              {item.carved ? <Badge tone="amber">carved sample</Badge> : null}
            </Toolbar>

            <div
              ref={scrollRef}
              onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
              className="min-h-0 flex-1 overflow-auto bg-abyss/40"
            >
              <div style={{ height: rowCount * ROW_H, position: 'relative' }}>
                {windowRows.map((row) => {
                  const base = row * ROW_BYTES
                  const end = Math.min(base + ROW_BYTES, bytes.length)
                  return (
                    <div
                      key={row}
                      className={cn(
                        'absolute inset-x-0 flex items-center gap-4 px-3 font-mono text-[11px] leading-none',
                        flashRow === row && 'bg-cyan/12',
                      )}
                      style={{ top: row * ROW_H, height: ROW_H }}
                    >
                      <span className="tabular w-[68px] shrink-0 text-ink-4 select-none">{toHexOffset(base)}</span>

                      <span className="flex shrink-0 gap-[3px]">
                        {Array.from({ length: ROW_BYTES }, (_, i) => {
                          const offset = base + i
                          if (offset >= end) {
                            return (
                              <span key={i} className="w-[17px] text-transparent select-none">
                                00
                              </span>
                            )
                          }
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={(e) => onByteClick(offset, e.shiftKey)}
                              title={`offset ${offset} (0x${toHexOffset(offset, 4)})`}
                              className={cn(
                                'w-[17px] rounded-[1px] text-center transition-colors',
                                i === 8 && 'ml-2',
                                cellTone(offset),
                              )}
                            >
                              {hexByte(bytes[offset])}
                            </button>
                          )
                        })}
                      </span>

                      <span className="flex gap-0">
                        {Array.from({ length: end - base }, (_, i) => {
                          const offset = base + i
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={(e) => onByteClick(offset, e.shiftKey)}
                              className={cn('w-[8px] text-center transition-colors', cellTone(offset))}
                            >
                              {asciiByte(bytes[offset])}
                            </button>
                          )
                        })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="shrink-0 border-t border-line bg-panel-2/70 px-3 py-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] text-ink-4 uppercase">
                  <Crosshair className="size-3" />
                  Selection
                </span>
                {selStart === null ? (
                  <span className="text-[11px] text-ink-4">
                    Click a byte to select, shift-click to extend a range.
                  </span>
                ) : (
                  <>
                    <span className="tabular font-mono text-[11px] text-ink-2">
                      start 0x{toHexOffset(selStart, 6)} ({formatNumber(selStart)})
                    </span>
                    <span className="tabular font-mono text-[11px] text-ink-2">
                      length {formatNumber(selLength)} B
                    </span>
                    {decoded.map((row) => (
                      <span key={row.label} className="tabular font-mono text-[11px] text-ink-3">
                        <span className="text-ink-4">{row.label}</span> {row.value}
                      </span>
                    ))}
                    <span className="tabular max-w-[28ch] truncate font-mono text-[11px] text-ink-3">
                      <span className="text-ink-4">ascii</span> {selectionAscii || '--'}
                    </span>
                    <CopyTextButton text={selectionHex} label="Copy hex" />
                    <CopyTextButton text={selectionAscii} label="Copy ASCII" />
                  </>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line/60 pt-1.5">
                <span className="text-[10px] tracking-[0.12em] text-ink-4 uppercase">SHA-256 of this buffer</span>
                <HashText value={digest} />
                <span className="tabular font-mono text-[11px] text-ink-4">
                  {formatBytes(bytes.length)} hashed
                </span>
                <span
                  className={cn(
                    'text-[11px]',
                    digest === item.hashes.sha256 ? 'text-jade' : 'text-signal',
                  )}
                >
                  {digest === item.hashes.sha256
                    ? 'matches the digest held in the case file'
                    : 'does not match the case file digest'}
                </span>
              </div>
            </div>
          </>
        )}
      </Panel>
    </div>
  )
}
