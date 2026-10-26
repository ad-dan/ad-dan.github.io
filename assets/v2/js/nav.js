/**
 * nav.js — masthead state, section index, mobile overlay.
 *
 * No network dependency and no library. Scroll position is read through an
 * IntersectionObserver rather than a `scroll` event, because a scroll listener
 * forces layout on every frame and the engineering rules forbid it outright.
 *
 * The observer's only job is to mark the current section. It never hides,
 * fades or reveals anything — the page is readable whether or not this file
 * ever runs.
 */

/**
 * The sections to spy on, read from the document rather than from a literal
 * list.
 *
 * This used to be a hardcoded array of ids. That is a trap: it silently kept
 * working when a section was renamed (the `filter(Boolean)` below swallowed the
 * missing id, so the marker just stopped tracking it) and it still carried ids
 * for a section that no longer existed. Deriving from `[data-panel]` — the same
 * thing the command console already does — means the list can never drift from
 * the markup, and adding or removing a section needs no edit here at all.
 */
function sectionIds() {
  return Array.from(document.querySelectorAll('[data-panel]'), (el) => el.id).filter(Boolean);
}

/** Set the current-section marker in the masthead and the table of contents. */
function markCurrent(id) {
  for (const link of document.querySelectorAll('[data-section-link]')) {
    // Only anchors can be "current" in a set of links. The hero's <h1> carries
    // the attribute too, and marking a heading `aria-current` is invalid — it
    // announces a state on a node that is not a navigation item.
    if (!(link instanceof HTMLAnchorElement)) continue;

    if (link.dataset.sectionLink === id) {
      link.setAttribute('aria-current', 'true');
    } else {
      link.removeAttribute('aria-current');
    }
  }
}

function initSpy() {
  const sections = sectionIds().map((id) => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;

  // A band across the upper third of the viewport decides what is "current",
  // so the marker changes when a section genuinely occupies the screen rather
  // than when its top edge happens to cross a line.
  const visible = new Map();

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      }

      let best = null;
      let bestRatio = 0;
      for (const [id, ratio] of visible) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = id;
        }
      }

      if (best) markCurrent(best);
    },
    { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
  );

  for (const section of sections) io.observe(section);
}

/** The mobile index overlay: open, close, restore focus, trap Escape. */
function initOverlay() {
  const toggle = document.getElementById('menu-toggle');
  const overlay = document.getElementById('overlay');
  if (!toggle || !overlay) return;

  let invoker = null;

  const open = () => {
    invoker = document.activeElement;
    overlay.dataset.open = 'true';
    toggle.setAttribute('aria-expanded', 'true');
    overlay.querySelector('a')?.focus();
  };

  const close = () => {
    overlay.dataset.open = 'false';
    toggle.setAttribute('aria-expanded', 'false');
    // Focus goes back where it came from, not to the top of the document.
    invoker?.focus();
    invoker = null;
  };

  toggle.addEventListener('click', () => {
    if (overlay.dataset.open === 'true') close();
    else open();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target.closest('a')) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.dataset.open === 'true') {
      close();
      return;
    }

    if (e.key === 'Tab' && overlay.dataset.open === 'true') {
      // Focus stays inside the overlay while it is open.
      //
      // The toggle button is deliberately NOT in this list. It lives in the
      // masthead beneath the overlay's opaque full-viewport panel, so trapping
      // onto it put the focus ring on a fully occluded element and lost the
      // user's place — WCAG 2.4.7 Focus Visible. Wrapping last→first among the
      // overlay's own links keeps every stop visible.
      const items = [...overlay.querySelectorAll('a')];
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

export function initNav() {
  initSpy();
  initOverlay();
}