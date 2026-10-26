/**
 * main.js — Application entry point.
 *
 * Enforces: FIRST PAINT IS NEVER JS-GATED.
 *
 * Boot sequence:
 *   1. Core navigation, command console, and digital IST clock (immediate, ~6KB)
 *   2. Abstract 3D WebGL background for hero (deferred ESM import)
 *   3. GSAP, ScrollTrigger & Lenis smooth momentum scrolling (idle / deferred)
 *   4. Creative agency interactions (3D card tilt, magnetic buttons) (idle / deferred)
 *   5. GitHub contribution heatmap (lazy on approaching activity section)
 */

import { initNav } from './nav.js';
import { initConsole } from './console.js';

/** The footer clock (IST UTC+05:30) — pauses when footer is offscreen */
function startClock() {
  const out = document.getElementById('clock');
  if (!out) return;

  const tick = () => {
    const ist = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000);
    out.textContent = ist.toTimeString().slice(0, 8);
  };

  tick();

  if ('IntersectionObserver' in window) {
    let timer = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          tick();
          if (!timer) timer = setInterval(tick, 1000);
        } else {
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
        }
      },
      { threshold: 0 }
    );
    const foot = document.querySelector('footer');
    if (foot) observer.observe(foot);
    else setInterval(tick, 1000);
  } else {
    setInterval(tick, 1000);
  }
}

function boot() {
  // 1. Core interaction (immediate, zero third-party dependencies)
  initNav();
  initConsole();
  startClock();

  // 2. Monospaced ASCII Matrix in Hero
  import('./ascii-hero.js')
    .then((m) => m.initHeroAscii())
    .catch((err) => console.warn('Hero ASCII skipped:', err));

  // 3 & 4. GSAP + ScrollTrigger + Lenis smooth scrolling & agency interactions (idle)
  const schedule = window.requestIdleCallback
    ? (cb) => requestIdleCallback(cb, { timeout: 1500 })
    : (cb) => setTimeout(cb, 1);

  schedule(() => {
    import('./motion.js')
      .then((m) => m.initMotion())
      .catch((err) => console.warn('Motion initialization skipped:', err));

    import('./agency-fx.js')
      .then((m) => m.initAgencyFX())
      .catch((err) => console.warn('Agency FX skipped:', err));

    import('./marks.js')
      .then((m) => m.initMarks())
      .catch((err) => console.warn('Marks initialization skipped:', err));
  });

  // 5. GitHub trailing 12-month contributions (dynamic lazy chunk on approaching section)
  const activityEl = document.getElementById('activity');
  if (activityEl && 'IntersectionObserver' in window) {
    const activityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          activityObserver.disconnect();
          import('./contributions.js')
            .then((m) => m.initContributions())
            .catch((err) => console.warn('Contributions skipped:', err));
        }
      },
      { rootMargin: '300px' }
    );
    activityObserver.observe(activityEl);
  } else {
    schedule(() => {
      import('./contributions.js')
        .then((m) => m.initContributions())
        .catch((err) => console.warn('Contributions skipped:', err));
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
