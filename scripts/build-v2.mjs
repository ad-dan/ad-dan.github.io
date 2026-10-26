#!/usr/bin/env node
/**
 * build-v2.mjs — build the assets/v2 tree that test.html loads.
 *
 * Clones the approach of scripts/build-assets.mjs, but writes ONLY under
 * assets/v2/. The production build (assets/css, assets/js) is never touched,
 * so index.html and its bundle keep building and shipping exactly as before
 * while this draft is in development.
 *
 * USAGE
 *   node scripts/build-v2.mjs
 *
 * OUTPUTS
 *   assets/v2/css/bundle.css       generated, readable
 *   assets/v2/css/bundle.min.css   generated, minified — what test.html loads
 *   assets/v2/js/test.bundle.js    generated, minified ESM entry
 *   assets/v2/js/chunk-*.js        generated lazy chunk (the contributions data)
 *
 * The individual CSS files stay in the repo and stay the source of truth. This
 * script is the only thing that generates the bundles.
 */

import { readFileSync, writeFileSync, statSync, readdirSync, renameSync, rmSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Load order is significant and must not be alphabetised or "tidied": layout
   and components both override base, so the sequence is the contract. */
const ORDER = ['base.css', 'layout.css', 'components.css'];

const CSS_DIR = join(ROOT, 'assets/v2/css');
const JS_DIR = join(ROOT, 'assets/v2/js');
const OUT_CSS = join(CSS_DIR, 'bundle.min.css');

mkdirSync(CSS_DIR, { recursive: true });
mkdirSync(JS_DIR, { recursive: true });

/* ------------------------------------------------------------------ CSS --- */

const parts = ORDER.map((name) => {
  const abs = join(CSS_DIR, name);
  const body = readFileSync(abs, 'utf8');
  return `\n/* ==== ${name} (${(statSync(abs).size / 1024).toFixed(1)} KB) ==== */\n${body}`;
});

const header = `/* ============================================================================
   bundle.css — GENERATED. Do not edit; edit the source files instead.

   Built by scripts/build-v2.mjs from, in cascade order:
${ORDER.map((n) => `     assets/v2/css/${n}`).join('\n')}

   Regenerate with:  node scripts/build-v2.mjs
   ========================================================================= */\n`;

const cssOut = header + parts.join('\n');
writeFileSync(join(CSS_DIR, 'bundle.css'), cssOut);

/* Minify. This is the file test.html actually loads. */
execFileSync(
  'npx',
  ['--yes', 'esbuild', join(CSS_DIR, 'bundle.css'), '--minify', `--outfile=${OUT_CSS}`],
  { stdio: 'inherit' }
);

const kb = (Buffer.byteLength(cssOut) / 1024).toFixed(1);
const minKb = (statSync(OUT_CSS).size / 1024).toFixed(1);
console.log(`built ${relative(ROOT, OUT_CSS)} — ${minKb} KB minified (${kb} KB source) from ${ORDER.length} files`);

/* Fail loudly rather than shipping a bundle that silently dropped a source. */
for (const name of ORDER) {
  if (!cssOut.includes(`==== ${name} `)) {
    console.error(`ERROR: ${name} is missing from the bundle.`);
    process.exit(1);
  }
}

/* ------------------------------------------------------------------- JS --- */

/**
 * `--splitting` is REQUIRED, not optional. Without it esbuild inlines a
 * dynamic import into its entry chunk, which silently ships the contributions
 * data on the critical path — the exact opposite of what the dynamic import is
 * for. With splitting, the data is requested only when the activity section
 * initialises, and the panel still degrades to a real message if it is absent.
 */
const chunkDir = join(JS_DIR, '.bundle');
rmSync(chunkDir, { recursive: true, force: true });

execFileSync(
  'npx',
  [
    '--yes', 'esbuild', join(JS_DIR, 'main.js'),
    '--bundle', '--format=esm', '--splitting', '--minify', '--target=es2020',
    '--legal-comments=none',
    '--outdir=' + chunkDir,
    '--entry-names=test.bundle',
    '--chunk-names=chunk-[hash]',
  ],
  { stdio: 'inherit' }
);

const SOURCES = [
  'main.js',
  'nav.js',
  'motion.js',
  'console.js',
  'contributions.js',
  'marks.js',
  'webgl-hero.js',
  'ascii-hero.js',
  'agency-fx.js',
];

/* Clean up any previously generated chunk files */
for (const f of readdirSync(JS_DIR)) {
  if (f.startsWith('chunk-') && f.endsWith('.js')) {
    rmSync(join(JS_DIR, f), { force: true });
  }
}

/* Move both the entry and its lazy chunks up beside the sources. */
for (const f of readdirSync(chunkDir)) {
  renameSync(join(chunkDir, f), join(JS_DIR, f));
}
rmSync(chunkDir, { recursive: true, force: true });

const jsOut = join(JS_DIR, 'test.bundle.js');
let total = statSync(jsOut).size;

console.log(`built ${relative(ROOT, jsOut)} — ${(total / 1024).toFixed(1)} KB`);

const chunks = readdirSync(JS_DIR).filter(
  (f) => f.endsWith('.js') && f !== 'test.bundle.js' && !SOURCES.includes(f)
);

for (const f of chunks) {
  const size = statSync(join(JS_DIR, f)).size;
  total += size;
  console.log(`  lazy chunk: ${f} — ${(size / 1024).toFixed(1)} KB`);
}

/* Fail loudly rather than shipping an entry that swallowed the data. */
if (!chunks.length) {
  console.error('ERROR: the contributions data was inlined into the entry instead of split.');
  console.error('       --splitting is missing; the activity data would ship on the critical path.');
  process.exit(1);
}

console.log(`total shipped JS: ${(total / 1024).toFixed(1)} KB`);