// Reports every backslash occurrence in src so the halving damage can be repaired safely.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const BS = String.fromCharCode(92)
const root = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
  }
  return out
}

const tally = new Map()
for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8')
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== BS) continue
    const next = text[i + 1] ?? ''
    const key = next
    const rec = tally.get(key) ?? { count: 0, files: new Set(), sample: '' }
    rec.count += 1
    rec.files.add(file.slice(root.length))
    if (!rec.sample) rec.sample = text.slice(Math.max(0, i - 18), i + 14).replace(/\n/g, ' ')
    tally.set(key, rec)
  }
}

const rows = [...tally.entries()].sort((a, b) => b[1].count - a[1].count)
for (const [next, rec] of rows) {
  console.log(
    `[${BS}${next}] x${String(rec.count).padStart(4)}  files=${rec.files.size}  ...${rec.sample}...`,
  )
}
