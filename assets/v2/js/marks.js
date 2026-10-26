/**
 * marks.js — hand-drawn annotations via Rough.js.
 *
 * WHY SO FEW.
 * This site is a precise instrument: monospaced, tabular, ruled. Rough.js is
 * here to bridge that and the handmade artwork in the hero and the in-flight
 * section — NOT to roughen the interface. One annotation is in use, chosen
 * because it earns its place; sketches everywhere would undo the grid.
 *
 * The other three kinds below (`underline`, `bracket`, `circle`) have no
 * `[data-rough]` target in the current markup. They are retained as this
 * module's small drawing surface, not because they are in use — do not add a
 * mark that does not point at something.
 *
 * SEEDED. Every mark draws from a fixed seed, so the wobble is identical on
 * every load and every machine. Without this the artwork would shimmer on each
 * repaint, which reads as a rendering fault rather than as a drawn line.
 *
 * PROGRESSIVE. If this module never runs — no JS, Rough.js 404, import failure
 * — the <svg> elements simply stay empty. They are decorative and carry no
 * information, so nothing is lost and nothing shifts: the markup reserves the
 * space either way.
 *
 * ACCESSIBILITY. Every mark is aria-hidden and pointer-events:none, so it can
 * neither be announced nor intercept a click.
 */

/**
 * Rough.js is vendored rather than installed: this repo has no package manager,
 * and the existing pattern is one local script per library.
 *
 * It is loaded with a DYNAMIC import on purpose. A static import would let
 * esbuild inline the 28 KB library into the entry chunk, putting it on the
 * critical path for a handful of decorative marks. Only a dynamic import makes
 * esbuild emit it as a separate chunk that is fetched when this module runs —
 * after first paint — and never before.
 */
let roughPromise = null;

function loadRough() {
  if (!roughPromise) {
    roughPromise = import('../vendor/rough.esm.js')
      .then((m) => m.default)
      .catch(() => null);
  }
  return roughPromise;
}

/**
 * The palette, read from the MARK'S OWN computed style.
 *
 * This deliberately does not read `document.documentElement`. Custom properties
 * are inherited, so reading the element resolves the value in force where the
 * mark actually sits — which is the whole point now that each section carries
 * its own ground and its own accent. Reading the root instead would have handed
 * every mark the cream theme's accent, so a stroke chosen to separate from a
 * red ground would have been dropped onto a blue one where it separates at
 * 1.62:1.
 *
 * `--fg` is black on all eight grounds (6.38:1 at the worst), so a mark that
 * cannot resolve a theme still draws legibly rather than invisibly.
 */
function ink(el) {
  const cs = getComputedStyle(el);
  return {
    stroke: cs.getPropertyValue('--fg').trim() || '#000000',
    accent: cs.getPropertyValue('--accent').trim() || '#ff4d3d',
  };
}

/**
 * Draw one annotation into its <svg>.
 *
 * The seed is derived from the mark's role, not from a counter, so the same
 * annotation always draws the same way no matter what order they appear in.
 */
function draw(el, rough) {
  const kind = el.dataset.rough;
  if (!kind) return;

  // Clear previous rendered children (crucial for debounced resize rerenders)
  el.textContent = '';

  const { stroke, accent } = ink(el);
  const seed = hash(el.dataset.seed || kind);

  // SVG canvas: resolution-independent, scales with the grid, and needs no
  // pixel dimensions at all — which is what makes it safe inside a fluid layout.
  const rc = rough.svg(el);
  const parent = el.parentElement;
  let w = el.viewBox && el.viewBox.baseVal && el.viewBox.baseVal.width ? el.viewBox.baseVal.width : 0;
  let h = el.viewBox && el.viewBox.baseVal && el.viewBox.baseVal.height ? el.viewBox.baseVal.height : 0;

  if (kind === 'frame' || !w || !h) {
    w = Math.round(el.clientWidth) || (parent ? Math.round(parent.clientWidth) : 100);
    h = Math.round(el.clientHeight) || (parent ? Math.round(parent.clientHeight) : 32);
    el.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }

  const opts = { seed, stroke, strokeWidth: 2 };
  const nodes = [];

  switch (kind) {
    case 'underline': {
      // One pass, slightly overshooting the right end like a real underline.
      nodes.push(rc.line(2, h / 2, w - 6, h / 2, opts));
      break;
    }
    case 'strike': {
      // Auditor's redline strike-through: angled, deliberate slash
      const yMid = h / 2;
      nodes.push(rc.line(2, yMid + 2, w - 2, yMid - 2, { ...opts, stroke: accent, strokeWidth: 2, roughness: 1.1 }));
      break;
    }
    case 'arrow': {
      const y = h / 2;
      nodes.push(rc.line(4, y, w - 16, y, opts));
      nodes.push(rc.line(w - 20, y - 6, w - 8, y, opts));
      nodes.push(rc.line(w - 20, y + 6, w - 8, y, opts));
      break;
    }
    case 'bracket': {
      const a = { ...opts, stroke: accent, strokeWidth: 2, roughness: 0.9 };
      nodes.push(rc.line(6, 2, 6, h - 2, a));
      nodes.push(rc.line(6, 2, 16, 2, a));
      nodes.push(rc.line(6, h - 2, 16, h - 2, a));
      break;
    }
    case 'stamp': {
      // Engineering inspection double-rectangle stamp
      const a = { ...opts, stroke: accent, strokeWidth: 1.5, roughness: 1.1, bowing: 0.5 };
      nodes.push(rc.rectangle(2, 2, w - 4, h - 4, a));
      nodes.push(rc.rectangle(5, 5, w - 10, h - 10, { ...a, strokeWidth: 1, roughness: 0.8 }));
      break;
    }
    case 'circle': {
      nodes.push(rc.ellipse(w / 2, h / 2, w - 10, h - 10, { ...opts, stroke: accent }));
      break;
    }
    case 'flagship-box': {
      // Architectural framing box with corner ticks for flagship system
      const a = { ...opts, stroke: accent, strokeWidth: 1.5, roughness: 0.9 };
      nodes.push(rc.rectangle(2, 2, w - 4, h - 4, a));
      const tick = 6;
      nodes.push(rc.line(0, 2, tick, 2, a));
      nodes.push(rc.line(2, 0, 2, tick, a));
      nodes.push(rc.line(w - tick, 2, w, 2, a));
      nodes.push(rc.line(w - 2, 0, w - 2, tick, a));
      nodes.push(rc.line(0, h - 2, tick, h - 2, a));
      nodes.push(rc.line(2, h - tick, 2, h, a));
      nodes.push(rc.line(w - tick, h - 2, w, h - 2, a));
      nodes.push(rc.line(w - 2, h - tick, w - 2, h, a));
      break;
    }
    case 'schematic': {
      // Architectural micro-flow: [ INTENT ] ──▶ [ FORK SIM ] ──▶ [ ATOMIC TX ]
      const boxOpts = { ...opts, stroke: accent, strokeWidth: 1.5, roughness: 0.85 };
      const lineOpts = { ...opts, stroke, strokeWidth: 1.2, roughness: 0.7 };

      // Box 1: Intent
      nodes.push(rc.rectangle(2, 6, 88, 30, boxOpts));
      // Arrow 1
      nodes.push(rc.line(94, 21, 126, 21, lineOpts));
      nodes.push(rc.line(120, 17, 127, 21, lineOpts));
      nodes.push(rc.line(120, 25, 127, 21, lineOpts));

      // Box 2: Fork Sim
      nodes.push(rc.rectangle(132, 6, 100, 30, boxOpts));
      // Arrow 2
      nodes.push(rc.line(236, 21, 268, 21, lineOpts));
      nodes.push(rc.line(262, 17, 269, 21, lineOpts));
      nodes.push(rc.line(262, 25, 269, 21, lineOpts));

      // Box 3: Atomic Tx
      nodes.push(rc.rectangle(274, 6, 96, 30, boxOpts));

      const labels = [
        { text: 'INTENT', x: 46, y: 25 },
        { text: 'FORK SIM', x: 182, y: 25 },
        { text: 'ATOMIC TX', x: 322, y: 25 },
      ];
      for (const l of labels) {
        const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.setAttribute('x', String(l.x));
        textEl.setAttribute('y', String(l.y));
        textEl.setAttribute('text-anchor', 'middle');
        textEl.setAttribute('font-family', 'var(--font-mono)');
        textEl.setAttribute('font-size', '10px');
        textEl.setAttribute('font-weight', '700');
        textEl.setAttribute('letter-spacing', '0.05em');
        textEl.setAttribute('fill', stroke);
        el.appendChild(textEl);
        textEl.textContent = l.text;
      }
      break;
    }
    case 'hachure': {
      // Drafting architectural hachure pattern inside the badge
      const hachureOpts = {
        seed,
        stroke: 'none',
        fill: accent,
        fillStyle: 'hachure',
        hachureAngle: -45,
        hachureGap: 4,
        fillWeight: 1.2,
        roughness: 0.8,
      };
      nodes.push(rc.rectangle(1, 1, w - 2, h - 2, hachureOpts));
      break;
    }
    case 'frame': {
      // Architectural hand-sketched drafting frame
      const frameOpts = {
        seed: 420,
        stroke: accent,
        strokeWidth: 2,
        roughness: 1.2,
        bowing: 0.8,
      };

      // 1. Sketched perimeter rectangle (with hand-drawn architectural nuance)
      nodes.push(rc.rectangle(4, 4, w - 8, h - 8, frameOpts));

      // 2. Drafting corner crosshairs / registration marks
      const tickOpts = {
        seed: 421,
        stroke: accent,
        strokeWidth: 1.5,
        roughness: 0.7,
      };

      const tick = 12;
      // Top-left
      nodes.push(rc.line(0, 4, 4 + tick, 4, tickOpts));
      nodes.push(rc.line(4, 0, 4, 4 + tick, tickOpts));

      // Top-right
      nodes.push(rc.line(w - 4 - tick, 4, w, 4, tickOpts));
      nodes.push(rc.line(w - 4, 0, w - 4, 4 + tick, tickOpts));

      // Bottom-left
      nodes.push(rc.line(0, h - 4, 4 + tick, h - 4, tickOpts));
      nodes.push(rc.line(4, h - 4 - tick, 4, h, tickOpts));

      // Bottom-right
      nodes.push(rc.line(w - 4 - tick, h - 4, w, h - 4, tickOpts));
      nodes.push(rc.line(w - 4, h - 4 - tick, w - 4, h, tickOpts));
      break;
    }
    default:
      return;
  }

  for (const n of nodes) {
    if (n) el.appendChild(n);
  }
}

/** Small deterministic string hash, so seeds are stable and order-independent. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100000;
}

export async function initMarks() {
  const marks = document.querySelectorAll('[data-rough]');
  if (!marks.length) return;

  const rough = await loadRough();
  if (!rough) return;

  const drawAll = () => {
    for (const el of marks) {
      try {
        draw(el, rough);
      } catch {
        /* A mark that will not draw is not worth reporting. */
      }
    }
  };

  drawAll();

  // Re-draw responsive marks on resize with debouncing
  let resizeTimer = null;
  window.addEventListener(
    'resize',
    () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(drawAll, 120);
    },
    { passive: true }
  );
}