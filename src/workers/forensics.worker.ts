/// <reference lib="webworker" />
import { CASE, evidenceBytes, extractStrings } from '@/data'
import { sha256 } from '@/lib/sha256'

/**
 * Off-thread forensic work.
 *
 * Re-hashing every artifact and extracting printable runs is real computation.
 * Doing it on the main thread would stall the timeline and the graph, so the
 * chain-of-custody sweep and the strings extractor run here instead.
 */

export interface VerifyResult {
  id: string
  label: string
  expected: string
  actual: string
  match: boolean
  byteLength: number
}

export type WorkerRequest =
  | { kind: 'verify-all' }
  | { kind: 'verify-one'; id: string }
  | { kind: 'strings'; id: string; minLength: number }

export type WorkerResponse =
  | { kind: 'progress'; done: number; total: number; current: string }
  | { kind: 'verify-complete'; results: VerifyResult[]; elapsedMs: number }
  | { kind: 'strings-complete'; id: string; strings: Array<{ offset: number; text: string; length: number }> }

const ctx = self as unknown as DedicatedWorkerGlobalScope

function verifyOne(id: string): VerifyResult | null {
  const item = CASE.evidence.find((e) => e.id === id)
  if (!item) return null
  const bytes = evidenceBytes(item.id)
  const actual = sha256(bytes)
  return {
    id: item.id,
    label: item.label,
    expected: item.hashes.sha256,
    actual,
    match: actual === item.hashes.sha256,
    byteLength: bytes.length,
  }
}

ctx.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const request = event.data

  if (request.kind === 'verify-all') {
    const started = performance.now()
    const results: VerifyResult[] = []
    const total = CASE.evidence.length
    CASE.evidence.forEach((item, index) => {
      const result = verifyOne(item.id)
      if (result) results.push(result)
      ctx.postMessage({
        kind: 'progress',
        done: index + 1,
        total,
        current: item.id,
      } satisfies WorkerResponse)
    })
    ctx.postMessage({
      kind: 'verify-complete',
      results,
      elapsedMs: Math.round(performance.now() - started),
    } satisfies WorkerResponse)
    return
  }

  if (request.kind === 'verify-one') {
    const result = verifyOne(request.id)
    ctx.postMessage({
      kind: 'verify-complete',
      results: result ? [result] : [],
      elapsedMs: 0,
    } satisfies WorkerResponse)
    return
  }

  if (request.kind === 'strings') {
    const bytes = evidenceBytes(request.id)
    const runs = extractStrings(bytes, request.minLength).map((s) => ({
      offset: s.offset,
      text: s.text,
      length: s.length,
    }))
    ctx.postMessage({ kind: 'strings-complete', id: request.id, strings: runs } satisfies WorkerResponse)
  }
})
