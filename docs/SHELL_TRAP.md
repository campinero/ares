# Shell trap - read before writing any file

The authoring shell collapses a doubled backslash into a single one, which
silently corrupts every Windows path literal. Do NOT type backslashes in a
heredoc.

Write the token `%%B%%` wherever the final TypeScript source needs an escaped
backslash (one rendered backslash inside a string), then run:

    node tools/bsub.mjs

What you type in the heredoc, and what you get after the pass:

    'C:%%B%%Users%%B%%morgan.reed'        ->  'C:\Users\morgan.reed'
    '%%B%%%%B%%SRV-CORE-03%%B%%ittools$'  ->  '\\SRV-CORE-03\ittools$'
    'MERIDIAN%%B%%morgan.reed'            ->  'MERIDIAN\morgan.reed'

Heredocs also truncate past roughly 120 lines. Write every file in chunks:
`cat > f.ts <<'ARESEOF'` for the first chunk, then `cat >> f.ts <<'ARESEOF'`
for each subsequent chunk, checking `wc -l` after each one.

Run `node tools/bsub.mjs` and then `npx tsc -b` before reporting done.
