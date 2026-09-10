import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CASE_SOLUTION } from './solution'
import { CASE, evidenceById } from './index'

const SRC = join(process.cwd(), 'src')

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full))
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
  }
  return out
}

describe('the solution stays out of the interface', () => {
  it('is imported only by tests', () => {
    const offenders: string[] = []
    for (const file of sourceFiles(SRC)) {
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue
      if (file.endsWith(join('data', 'solution.ts'))) continue
      const text = readFileSync(file, 'utf8')
      if (/from ['"][^'"]*solution['"]/.test(text) || text.includes('CASE_SOLUTION')) {
        offenders.push(file.slice(SRC.length + 1))
      }
    }
    expect(offenders, `solution leaked into: ${offenders.join(', ')}`).toEqual([])
  })

  it('never states the culprit name in any rendered string', () => {
    // The dataset may name a person as a subject; it must never assert guilt.
    const banned = /is the culprit|was responsible for the theft|committed the exfiltration|is guilty/i
    for (const file of sourceFiles(SRC)) {
      if (file.endsWith('solution.ts') || file.endsWith('.test.ts')) continue
      expect(banned.test(readFileSync(file, 'utf8')), `verdict language in ${file}`).toBe(false)
    }
  })
})

describe('the solution is consistent with the evidence set', () => {
  it('names a real person, account, device and medium', () => {
    expect(CASE.persons.some((p) => p.id === CASE_SOLUTION.culpritPersonId)).toBe(true)
    expect(CASE.accounts.some((a) => a.id === CASE_SOLUTION.culpritAccountUsed)).toBe(true)
    expect(CASE.devices.some((d) => d.id === CASE_SOLUTION.subjectDeviceId)).toBe(true)
    expect(CASE.usbDevices.some((u) => u.id === CASE_SOLUTION.mediaId)).toBe(true)
  })

  it('cites only artifacts that exist in the case file', () => {
    for (const id of CASE_SOLUTION.provingChain) {
      expect(evidenceById.has(id), `proving chain cites missing ${id}`).toBe(true)
    }
    for (const step of CASE_SOLUTION.sequence) {
      for (const id of step.evidenceIds) {
        expect(evidenceById.has(id), `step ${step.order} cites missing ${id}`).toBe(true)
      }
    }
  })

  it('attributes the account to someone other than the operator', () => {
    const account = CASE.accounts.find((a) => a.id === CASE_SOLUTION.culpritAccountUsed)
    expect(account).toBeDefined()
    expect(account?.personId).not.toBe(CASE_SOLUTION.culpritPersonId)
  })

  it('does not make the answer the most obvious reading on first pass', () => {
    const culprit = CASE.persons.find((p) => p.id === CASE_SOLUTION.culpritPersonId)
    const accountHolder = CASE.persons.find(
      (p) => p.id === CASE.accounts.find((a) => a.id === CASE_SOLUTION.culpritAccountUsed)?.personId,
    )
    expect(culprit && accountHolder).toBeTruthy()
    if (!culprit || !accountHolder) return
    // The account holder must look more implicated than the operator initially.
    expect(accountHolder.confidence).toBeGreaterThan(culprit.confidence)
  })

  it('keeps the sequence ordered and fully evidenced', () => {
    const orders = CASE_SOLUTION.sequence.map((s) => s.order)
    expect([...orders].sort((a, b) => a - b)).toEqual(orders)
    for (const step of CASE_SOLUTION.sequence) expect(step.evidenceIds.length).toBeGreaterThan(0)
  })

  it('records red herrings and residual uncertainty', () => {
    expect(CASE_SOLUTION.redHerrings.length).toBeGreaterThanOrEqual(4)
    expect(CASE_SOLUTION.residualUncertainty.length).toBeGreaterThanOrEqual(3)
    expect(CASE_SOLUTION.gradingCriteria.length).toBeGreaterThanOrEqual(5)
  })
})
