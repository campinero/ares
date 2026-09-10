/**
 * Backslash substitution pass.
 *
 * The authoring shell collapses doubled backslashes, so contributors write the
 * token %%B%% wherever the TypeScript source needs an escaped backslash - that
 * is, one rendered backslash inside a string literal. Run this after writing
 * any file that contains Windows paths.
 *
 *   'C:%%B%%Users%%B%%morgan.reed'  ->  'C:\Users\morgan.reed'
 *   '%%B%%%%B%%SRV-CORE-03'         ->  '\\SRV-CORE-03'   (renders \SRV-CORE-03)
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BS = String.fromCharCode(92)
const TOKEN = '%%B%%'
const roots = [new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')]

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
  }
  return out
}

let files = 0
let replacements = 0
for (const root of roots) {
  for (const file of walk(root)) {
    const before = readFileSync(file, 'utf8')
    if (!before.includes(TOKEN)) continue
    const count = before.split(TOKEN).length - 1
    writeFileSync(file, before.split(TOKEN).join(BS + BS))
    files += 1
    replacements += count
    console.log(`substituted ${count} tokens in ${file.slice(root.length)}`)
  }
}
console.log(`${replacements} tokens replaced across ${files} files`)
