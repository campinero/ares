/**
 * One-shot repair for backslash halving.
 *
 * The shell used to author these files collapses a doubled backslash to a
 * single one, which silently broke every Windows path literal in the dataset.
 * Doubling every backslash restores the intended source, after which a short
 * allow-list restores the handful of escapes that really were meant to be
 * single (newlines in join/replace, and one regex quantifier).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
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

// Sequences that were genuinely intended as single-character escapes.
const RESTORE = [
  [BS + BS + BS + BS + "n')", BS + BS + "n')"],
  ['/' + BS + BS + BS + BS + 'n/g', '/' + BS + BS + 'n/g'],
  ['/' + BS + BS + BS + BS + '+$/', '/' + BS + BS + '+$/'],
  [BS + BS + BS + BS + 'n' + BS + BS + BS + BS + 'n', BS + BS + 'n' + BS + BS + 'n'],
]

let touched = 0
let added = 0
for (const file of walk(root)) {
  const before = readFileSync(file, 'utf8')
  if (!before.includes(BS)) continue

  let after = before.split(BS).join(BS + BS)
  for (const [from, to] of RESTORE) after = after.split(from).join(to)

  if (after !== before) {
    writeFileSync(file, after)
    touched += 1
    added += (after.length - before.length)
    console.log(`repaired ${file.slice(root.length)}`)
  }
}
console.log(`\n${touched} files repaired, ${added} backslashes restored`)
