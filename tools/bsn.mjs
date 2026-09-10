// Restore the few escapes that the blanket doubling over-corrected.
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

const DOUBLE_N = BS + BS + 'n'
const SINGLE_N = BS + 'n'
const PATTERNS = [
  ["'" + DOUBLE_N + "'", "'" + SINGLE_N + "'"],
  ['/' + DOUBLE_N + '/g', '/' + SINGLE_N + '/g'],
  ['`' + DOUBLE_N + '`', '`' + SINGLE_N + '`'],
]

for (const file of walk(root)) {
  const before = readFileSync(file, 'utf8')
  let after = before
  for (const [from, to] of PATTERNS) after = after.split(from).join(to)
  if (after !== before) {
    writeFileSync(file, after)
    console.log(`adjusted ${file.slice(root.length)}`)
  }
}
console.log('done')
