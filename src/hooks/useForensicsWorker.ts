import { useCallback, useEffect, useRef, useState } from 'react'
import type { VerifyResult, WorkerRequest, WorkerResponse } from '@/workers/forensics.worker'

interface VerifyState {
  running: boolean
  done: number
  total: number
  current: string
  results: VerifyResult[]
  elapsedMs: number
}

const IDLE: VerifyState = { running: false, done: 0, total: 0, current: '', results: [], elapsedMs: 0 }

/**
 * Drives the off-thread integrity sweep. The worker recomputes SHA-256 over
 * every artifact data object and reports each result against the digest held in
 * the case file.
 */
export function useForensicsWorker() {
  const workerRef = useRef<Worker | null>(null)
  const [state, setState] = useState<VerifyState>(IDLE)

  useEffect(() => {
    const worker = new Worker(new URL('../workers/forensics.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      if (message.kind === 'progress') {
        setState((s) => ({ ...s, running: true, done: message.done, total: message.total, current: message.current }))
      } else if (message.kind === 'verify-complete') {
        setState((s) => ({
          ...s,
          running: false,
          results: message.results,
          elapsedMs: message.elapsedMs,
          done: message.results.length || s.done,
        }))
      }
    }

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  const verifyAll = useCallback(() => {
    if (!workerRef.current) return
    setState({ ...IDLE, running: true })
    workerRef.current.postMessage({ kind: 'verify-all' } satisfies WorkerRequest)
  }, [])

  const verifyOne = useCallback((id: string) => {
    if (!workerRef.current) return
    setState({ ...IDLE, running: true, total: 1 })
    workerRef.current.postMessage({ kind: 'verify-one', id } satisfies WorkerRequest)
  }, [])

  const reset = useCallback(() => setState(IDLE), [])

  return { ...state, verifyAll, verifyOne, reset }
}
