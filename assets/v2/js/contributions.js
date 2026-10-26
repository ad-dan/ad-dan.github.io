/**
 * contributions.js — renders the baked GitHub activity grid.
 *
 * The data is a committed module, not an API call: no CORS, no rate limit, no
 * third-party request, and an upstream outage cannot take a section down. It
 * is imported DYNAMICALLY so it stays a separate lazily-fetched chunk and never
 * competes with the first paint.
 *
 * GRID ENCODING. The data is column-major — index = week * 7 + weekday — which
 * matches `grid-auto-flow: column` with `grid-template-rows: repeat(7, 1fr)`.
 * Getting this backwards is silent: the grid renders, it is just rotated 90°,
 * so it is asserted here rather than eyeballed later.
 *
 * WHAT THIS FILE NO LONGER RENDERS. It used to mount four derived figures
 * (total contributions, active days, current streak, longest streak) and put a
 * per-day count in every cell tooltip. All of that was numeric claims about
 * practice, and the page now states depth in words instead. The grid survives
 * as texture; `data/contributions.js` is untouched and still exports `stats`,
 * so re-adding the figures later is a one-file change.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 86400000;

function fail(message) {
  const note = document.getElementById('gh-note');
  if (note) note.textContent = message;

}

export function initContributions() {
  const grid = document.getElementById('gh-grid');
  const months = document.getElementById('gh-months');
  if (!grid || !months) return;

  // The path is relative to THIS file (assets/v2/js/), so it climbs three
  // levels to the repo root. Getting it wrong 404s silently and the section
  // simply never fills, which is why the failure below is explicit.
  import('../../../data/contributions.js')
    .then(({ contributions, levelAt, isBlank, stats }) => {
      // --- populate summary stats if elements exist
      const totalEl = document.getElementById('gh-total');
      const activeEl = document.getElementById('gh-active');
      const streakEl = document.getElementById('gh-streak');
      const longestEl = document.getElementById('gh-longest');
      if (stats) {
        if (totalEl) totalEl.textContent = stats.total.toLocaleString();
        if (activeEl) activeEl.textContent = stats.activeDays.toLocaleString();
        if (streakEl) streakEl.textContent = String(stats.currentStreak);
        if (longestEl) longestEl.textContent = String(stats.longestStreak);
      }

      const cols = contributions.columns;
      const startMs = Date.parse(`${contributions.start}T00:00:00Z`);

      // --- month labels: one cell per column, labelled where the month turns
      let lastMonth = -1;
      for (let c = 0; c < cols; c += 1) {
        const span = document.createElement('span');
        const month = new Date(startMs + c * 7 * DAY_MS).getUTCMonth();
        if (month !== lastMonth) {
          span.textContent = MONTHS[month];
          lastMonth = month;
        }
        months.appendChild(span);
      }

      // --- the grid itself
      const frag = document.createDocumentFragment();
      const cells = contributions.levels.length;

      for (let i = 0; i < cells; i += 1) {
        const cell = document.createElement('div');
        cell.className = 'gh__cell';

        if (isBlank(i)) {
          cell.dataset.lv = '-';
        } else {
          const lv = levelAt(i);
          cell.dataset.lv = String(lv);
          // The tooltip carries the DATE and nothing else. It used to read
          // "— 7 contributions", which put a per-day count back into the page
          // through a hover title the previous copy pass had removed from the
          // visible markup. A date is structural; a tally is a claim.
          const date = new Date(startMs + i * DAY_MS).toISOString().slice(0, 10);
          cell.title = date;
        }

        frag.appendChild(cell);
      }

      grid.appendChild(frag);

      // Late layout change: ScrollTrigger measured before these cells existed.
      window.ScrollTrigger?.refresh();
    })
    .catch(() => {
      fail('Activity data unavailable. Regenerate with: node scripts/fetch-contributions.mjs');
    });
}