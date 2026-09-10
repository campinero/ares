import type { ContentSpec } from './types'
import { rngFrom } from '@/lib/prng'
import { utf8 } from '@/lib/sha256'

/**
 * Synthetic artifact bodies.
 *
 * Each evidence item owns a byte stream built deterministically from its ID.
 * The stream carries a plausible container header, the strings the analyst
 * would expect to recover, and seeded filler. Hex view, strings view and every
 * digest in the case file all read from this one buffer.
 */

const HEADERS: Record<string, number[]> = {
  zip: [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00],
  docx: [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00, 0x08, 0x00],
  xlsx: [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00, 0x08, 0x00],
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52],
  jpeg: [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01],
  mp3: [0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00],
  exe: [0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00],
  sqlite: [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00],
  evtx: [0x45, 0x6c, 0x66, 0x46, 0x69, 0x6c, 0x65, 0x00],
  raw: [],
}

/** Extra literal text placed straight after the header for realism. */
const PREAMBLE: Record<string, string> = {
  exe: 'This program cannot be run in DOS mode.',
  pdf: '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
  png: 'IHDR sRGB pHYs tEXtSoftware Meridian SpectraCap 4.2',
  sqlite: 'CREATE TABLE urls(id INTEGER PRIMARY KEY, url LONGVARCHAR, title LONGVARCHAR, visit_count INTEGER)',
  evtx: 'Microsoft-Windows-Security-Auditing',
  zip: '',
  docx: 'word/document.xml',
  xlsx: 'xl/workbook.xml',
  jpeg: 'Exif MM Meridian SpectraCap',
  mp3: 'TIT2 TPE1 TALB Lavf60.16.100',
  raw: '',
}

/** Deterministic byte stream for one artifact. */
export function buildBytes(id: string, spec: ContentSpec): Uint8Array {
  if (spec.kind === 'text') return utf8(spec.text)

  const size = Math.max(64, spec.sampleSize)
  const out = new Uint8Array(size)
  const rng = rngFrom(`${id}:${spec.format}:${spec.logicalSize}`)

  let cursor = 0
  const header = HEADERS[spec.format] ?? []
  for (const b of header) {
    if (cursor < size) out[cursor++] = b
  }

  const write = (text: string, terminator = 0x00) => {
    const bytes = utf8(text)
    if (cursor + bytes.length + 1 >= size) return false
    out.set(bytes, cursor)
    cursor += bytes.length
    out[cursor++] = terminator
    return true
  }

  const preamble = PREAMBLE[spec.format]
  if (preamble) write(preamble)

  // Interleave the recoverable strings with seeded binary filler so the hex
  // pane looks like a real container rather than a text file with a header.
  for (const value of spec.strings) {
    const gap = rng.int(4, 24)
    for (let i = 0; i < gap && cursor < size; i++) out[cursor++] = rng.byte()
    if (!write(value)) break
  }

  while (cursor < size) out[cursor++] = rng.byte()
  return out
}

export interface ExtractedString {
  offset: number
  text: string
  /** Printable run length. */
  length: number
  encoding: 'ascii' | 'utf-16le'
}

/**
 * Printable-run extraction, the same idea as strings(1): walk the buffer and
 * emit any run of printable bytes at or above the minimum length.
 */
export function extractStrings(bytes: Uint8Array, minLength = 4): ExtractedString[] {
  const out: ExtractedString[] = []
  let start = -1
  let run: number[] = []

  const flush = () => {
    if (start >= 0 && run.length >= minLength) {
      out.push({
        offset: start,
        text: String.fromCharCode(...run),
        length: run.length,
        encoding: 'ascii',
      })
    }
    start = -1
    run = []
  }

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]
    const printable = b >= 0x20 && b <= 0x7e
    if (printable) {
      if (start < 0) start = i
      run.push(b)
    } else {
      flush()
    }
  }
  flush()
  return out
}
