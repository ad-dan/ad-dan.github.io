#!/usr/bin/env node
/**
 * Dev-time only. Never shipped, never imported by the page.
 *
 * Pulls the GitHub contributions calendar ONCE and bakes it into
 * data/contributions.js. The site then has zero runtime third-party
 * dependencies: no fetch, no CORS, no rate-limit, no upstream outage.
 *
 * Re-run when the contribution data needs refreshing:
 *   node scripts/fetch-contributions.mjs
 *   node scripts/fetch-contributions.mjs --user someone-else
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const USER = process.argv.includes('--user')
  ? process.argv[process.argv.indexOf('--user') + 1]
  : 'ad-dan';

const API = `https://github-contributions-api.jogruber.de/v4/${USER}?y=last`;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'contributions.js');

const res = await fetch(API);
if (!res.ok) throw new Error(`Upstream ${res.status} ${res.statusText} for ${API}`);

const raw = await res.json();
const days = raw.contributions;

if (!Array.isArray(days) || days.length === 0) {
  throw new Error(`Upstream returned no contributions for ${USER} — refusing to write an empty dataset.`);
}

// --- integrity checks -------------------------------------------------------
// The API returns a rolling 365-day window, NOT GitHub's 53x7 = 371 cell grid.
// Rendering 365 cells straight into a column-major 7-row layout leaves the last
// column ragged, so the grid is padded out to 53 full weeks with blank cells
// (encoded '-') exactly the way GitHub leaves leading/trailing days empty.
//
// Anything short, gappy, or out-of-range means the upstream shape changed. A
// broken calendar renders silently, so fail loudly instead of baking it.

const REAL_DAYS = 365;
const COLUMNS = 53;
const CELLS = COLUMNS * 7;

if (days.length !== REAL_DAYS) {
  throw new Error(`Expected ${REAL_DAYS} days, got ${days.length}. Refusing to bake.`);
}

const start = new Date(days[0].date + 'T00:00:00Z');
const end = new Date(days[days.length - 1].date + 'T00:00:00Z');
const spanDays = Math.round((end - start) / 86400000) + 1;
if (spanDays !== REAL_DAYS) {
  throw new Error(`Date span is ${spanDays} days, expected ${REAL_DAYS}. Refusing to bake.`);
}

for (const d of days) {
  if (!Number.isInteger(d.level) || d.level < 0 || d.level > 4) {
    throw new Error(`Bad level ${d.level} on ${d.date}. Refusing to bake.`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) {
    throw new Error(`Bad date "${d.date}". Refusing to bake.`);
  }
}

// Pad the front so column 0 row 0 is a Sunday, and the back so the final column
// is a complete week. GitHub's own graph does exactly this.
const padStart = start.getUTCDay(); // 0 = Sunday
const padEnd = (7 - ((padStart + days.length) % 7)) % 7;

if (padStart + days.length + padEnd !== CELLS) {
  throw new Error(
    `Padding produced ${padStart + days.length + padEnd} cells, expected ${CELLS}. Refusing to bake.`
  );
}

// --- stats -----------------------------------------------------------------
// Computed once here so the page never has to walk 371 records at runtime.

let total = 0;
let activeDays = 0;
let longest = 0;
let run = 0;

for (const d of days) {
  total += d.count;
  if (d.count > 0) {
    activeDays++;
    run++;
    if (run > longest) longest = run;
  } else {
    run = 0;
  }
}

// Current streak: consecutive non-zero days ending at the most recent day.
let current = 0;
for (let i = days.length - 1; i >= 0 && days[i].count > 0; i--) current++;

// --- encode ----------------------------------------------------------------
// levels: one char per grid cell, "0".."4" for real days and "-" for blank.
//         Fixed width by construction, so a cell index maps 1:1 onto a character.
//
// counts: comma-separated decimals for the REAL days only, in order. Blanks are
//         implicit from `levels`, so this channel needs no sentinel and no
//         padding. An earlier attempt used one base36 char per cell, which is
//         wrong: base36 of 40 is "14", so any count >= 36 silently became two
//         characters and desynchronised the whole channel.

const padHead = '-'.repeat(padStart);
const padTail = '-'.repeat(padEnd);
const realLevels = days.map((d) => String(d.level)).join('');
const countsCsv = days.map((d) => Math.max(0, Math.trunc(d.count))).join(',');

const levels = padHead + realLevels + padTail;

if (levels.length !== CELLS) {
  throw new Error(`Encoding produced ${levels.length} level cells, expected ${CELLS}. Aborting.`);
}

// Every cell must be a legal character, and the blank count must be exact.
if (/[^0-4-]/.test(levels)) throw new Error('Levels contain an unexpected character. Aborting.');

const blankCount = [...levels].filter((c) => c === '-').length;
if (blankCount !== padStart + padEnd) {
  throw new Error(`Found ${blankCount} blanks, expected ${padStart + padEnd}. Aborting.`);
}

// Assert the real days are contiguous by SLICING at the known pad offsets, not by
// stripping leading/trailing '-'. Regex-stripping looks like it would also work,
// but it eats a real level-0 day sitting at either edge of the window and then
// reports a false "interior gap".
const head = levels.slice(0, padStart);
const tail = levels.slice(CELLS - padEnd);
const body_ = levels.slice(padStart, CELLS - padEnd);

if (head.includes('-') === false && padStart > 0) throw new Error('Leading pad is not blank. Aborting.');
if (padEnd > 0 && /[^-]/.test(tail)) throw new Error('Trailing pad is not blank. Aborting.');
if (body_.length !== REAL_DAYS || body_.includes('-')) {
  throw new Error(`Real-day run is ${body_.length} cells with ${body_.includes('-') ? 'an interior gap' : 'no gap'}; expected ${REAL_DAYS}. Aborting.`);
}

// Round-trip the CSV before writing: a counts channel that does not decode back
// to exactly the real days, summing to the same total, is worse than no data.
// Map to Number immediately — split() yields strings, and leaving them as
// strings makes any downstream `+=` silently concatenate instead of add.
const decodedRaw = countsCsv.split(',');
if (decodedRaw.length !== REAL_DAYS) {
  throw new Error(`Counts decoded to ${decodedRaw.length} entries, expected ${REAL_DAYS}. Aborting.`);
}
if (decodedRaw.some((n) => !/^\d+$/.test(n))) {
  throw new Error('Counts contain a non-numeric entry. Aborting.');
}
const decoded = decodedRaw.map(Number);
if (decoded.some((n) => !Number.isInteger(n) || n < 0)) {
  throw new Error('Counts contain a negative or fractional value. Aborting.');
}
const decodedTotal = decoded.reduce((a, n) => a + n, 0);
if (decodedTotal !== total) {
  throw new Error(`Counts round-trip sums to ${decodedTotal}, expected ${total}. Aborting.`);
}

// The upstream aggregate is NOT trusted. Its own daily array was observed to sum
// to a different number than its own `total.lastYear` field (390 vs 397), so the
// two disagree upstream. The daily array wins, because it is the data that gets
// rendered: a stat panel reading 397 above a grid of cells that visibly add up to
// 390 is a defect a user can catch by counting. Disagreement is surfaced loudly
// rather than silently resolved, but it does not block the bake.
const upstreamTotal = raw.total?.lastYear;
if (Number.isFinite(upstreamTotal) && upstreamTotal !== total) {
  console.warn(
    `  ! warning: upstream total.lastYear=${upstreamTotal} but its daily array sums to ${total}.\n` +
      `    Using the daily sum. The rendered stat now matches the rendered cells.`
  );
}
if (total === 0) {
  throw new Error('Every day is zero — refusing to bake an empty heatmap.');
}

const payload = {
  user: USER,
  start: days[0].date,
  end: days[days.length - 1].date,
  columns: COLUMNS,
  days: CELLS,
  // Pad offsets are stored separately because they answer different questions.
  // `padStart` is how many LEADING cells are padding (so real day 0 lives at
  // grid index padStart); `padTail` is trailing padding only. Deriving the
  // leading offset from "are there any blanks at all" is wrong — this window has
  // zero leading and six trailing, and that conflation silently pointed
  // firstRealIndex at index 366 instead of 0.
  padStart,
  padTail,
  levels,
  counts: decoded,
  stats: { total, activeDays, currentStreak: current, longestStreak: longest },
};

const body = `/**
 * GitHub contributions — BAKED DATA. Do not hand-edit.
 *
 * Generated by scripts/fetch-contributions.mjs from the public contributions
 * calendar API. Shipping this as a module means the page makes no third-party
 * request at runtime: no CORS, no rate limit, no upstream outage taking a
 * whole section down with it.
 *
 * Regenerate:  node scripts/fetch-contributions.mjs
 *
 * user       @${USER}
 * range      ${payload.start} .. ${payload.end}
 * grid       ${COLUMNS} columns x 7 rows = ${CELLS} cells
 * padStart   ${padStart} leading blank cells, so real day 0 sits at grid index ${padStart}
 * padTail    ${padEnd} trailing blank cells
 * levels     one char per CELL, "0".."4" for a real day and "-" for a padded one
 * counts     ${REAL_DAYS} integers, for the real days only, in date order
 * stats      precomputed so the page never walks ${CELLS} records
 *
 * NOTE: grid index is COLUMN-major — index = week * 7 + weekday — matching the
 * grid-auto-flow: column layout that renders it.
 */

const DAY = 86400000;
const BLANK = '-'.charCodeAt(0);

export const contributions = ${JSON.stringify(payload, null, 2)};

const START_MS = Date.parse(contributions.start + 'T00:00:00Z');

/** Grid index of the first cell holding real data (skips leading padding). */
export const firstRealIndex = contributions.padStart;

/** True when grid index i is a padded / not-yet-reached cell. */
export function isBlank(i) {
  return contributions.levels.charCodeAt(i) === BLANK;
}

/** Absolute date string for grid index i. */
export function dateAt(i) {
  return new Date(START_MS + (i - firstRealIndex) * DAY).toISOString().slice(0, 10);
}

/** Contribution count for grid index i, or -1 when blank. */
export function countAt(i) {
  return isBlank(i) ? -1 : contributions.counts[i - firstRealIndex];
}

/** Heatmap level 0-4 for grid index i, or -1 when blank. */
export function levelAt(i) {
  const c = contributions.levels.charCodeAt(i);
  return c === BLANK ? -1 : c - 48;
}

export const stats = contributions.stats;
`;

writeFileSync(OUT, body, 'utf8');

console.log(`Baked ${USER} -> data/contributions.js`);
console.log(`  range   ${payload.start} .. ${payload.end}`);
console.log(`  grid    ${COLUMNS} x 7 = ${CELLS} cells (${padStart} lead + ${padEnd} tail blank)`);
console.log(`  total   ${total}`);
console.log(`  active  ${activeDays} days`);
console.log(`  streak  current ${current}, longest ${longest}`);
console.log(`  size    ${(Buffer.byteLength(body) / 1024).toFixed(1)} KB`);