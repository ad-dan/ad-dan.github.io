/**
 * agency-fx.js — Creative Agency Interactive Animations & Micro-Interactions
 *
 * 1. Cyber Matrix Text Scrambler / Decipher
 * 2. 3D Card Tilt with Holographic Specular Highlight
 * 3. Magnetic Button Attraction
 * 4. Cybernetic Crosshair / Reticle Cursor
 *
 * Respects prefers-reduced-motion and touch device capabilities.
 */

import { gsap } from 'gsap';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;

const GLYPHS = '01#%&_<>[]{}/\\*+=~▲■◆';

/**
 * Scramble text into cyber glyphs and decipher back to original string.
 */
export function scrambleText(element, duration = 0.8) {
  if (!element || REDUCED) return;
  const original = element.getAttribute('data-original-text') || element.textContent.trim();
  element.setAttribute('data-original-text', original);

  let frame = 0;
  const totalFrames = Math.round(duration * 60);
  const len = original.length;

  if (element._scrambleTimer) clearInterval(element._scrambleTimer);

  element._scrambleTimer = setInterval(() => {
    frame++;
    const progress = frame / totalFrames;
    const resolvedChars = Math.floor(progress * len);

    let output = '';
    for (let i = 0; i < len; i++) {
      if (i < resolvedChars) {
        output += original[i];
      } else if (original[i] === ' ') {
        output += ' ';
      } else {
        output += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
    }

    element.textContent = output;

    if (frame >= totalFrames) {
      clearInterval(element._scrambleTimer);
      element.textContent = original;
    }
  }, 1000 / 60);
}

/**
 * Initialize 3D interactive card tilt with holographic radial sheen
 */
function init3DCardTilt() {
  if (IS_TOUCH || REDUCED) return;

  const cards = document.querySelectorAll('.work-card, .bento__card');

  cards.forEach((card) => {
    let bounds = null;
    let rafId = null;

    const onEnter = () => {
      bounds = card.getBoundingClientRect();
      gsap.to(card, { scale: 1.015, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    };

    const onMove = (e) => {
      if (rafId) return;
      const clientX = e.clientX;
      const clientY = e.clientY;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!bounds) bounds = card.getBoundingClientRect();
        const x = clientX - bounds.left;
        const y = clientY - bounds.top;

        // Card-relative normalized coordinates (-1 to 1)
        const nx = (x / bounds.width) * 2 - 1;
        const ny = (y / bounds.height) * 2 - 1;

        // Max tilt angle
        const rotateX = -ny * 6; // degrees
        const rotateY = nx * 6;

        gsap.to(card, {
          rotateX,
          rotateY,
          transformPerspective: 900,
          ease: 'power1.out',
          duration: 0.25,
          overwrite: 'auto',
        });

        // Update CSS variables for holographic sheen
        card.style.setProperty('--sheen-x', `${(x / bounds.width) * 100}%`);
        card.style.setProperty('--sheen-y', `${(y / bounds.height) * 100}%`);
      });
    };

    const onLeave = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      bounds = null;
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: 0.5,
        ease: 'elastic.out(1, 0.6)',
        overwrite: 'auto',
      });
    };

    card.addEventListener('mouseenter', onEnter, { passive: true });
    card.addEventListener('mousemove', onMove, { passive: true });
    card.addEventListener('mouseleave', onLeave, { passive: true });
  });
}

/**
 * Magnetic button pull toward the cursor — batched with RAF
 */
function initMagneticButtons() {
  if (IS_TOUCH || REDUCED) return;

  const targets = document.querySelectorAll('.btn, .copy, .mast__mark');

  targets.forEach((btn) => {
    let bounds = null;
    let rafId = null;

    btn.addEventListener('mouseenter', () => {
      bounds = btn.getBoundingClientRect();
    }, { passive: true });

    btn.addEventListener('mousemove', (e) => {
      if (rafId) return;
      const clientX = e.clientX;
      const clientY = e.clientY;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!bounds) bounds = btn.getBoundingClientRect();
        const x = clientX - bounds.left - bounds.width / 2;
        const y = clientY - bounds.top - bounds.height / 2;

        // Subtle magnetic pull (max 8px)
        gsap.to(btn, {
          x: x * 0.28,
          y: y * 0.28,
          duration: 0.25,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      });
    }, { passive: true });

    btn.addEventListener('mouseleave', () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      bounds = null;
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1.1, 0.4)',
        overwrite: 'auto',
      });
    }, { passive: true });
  });
}

/**
 * Interactive Reality vs Spec Toggle for project cards
 */
function initRealityToggles() {
  const switches = document.querySelectorAll('.reality-switch');
  switches.forEach((switcher) => {
    const card = switcher.closest('.work-card');
    if (!card) return;

    const btns = switcher.querySelectorAll('.reality-btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const target = btn.dataset.target; // 'spec' or 'reality'
        btns.forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));

        const specPane = card.querySelector('.reality-pane--spec');
        const realityPane = card.querySelector('.reality-pane--unvarnished');

        if (target === 'reality') {
          if (specPane) specPane.hidden = true;
          if (realityPane) {
            realityPane.hidden = false;
            gsap.fromTo(realityPane, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
          }
        } else {
          if (realityPane) realityPane.hidden = true;
          if (specPane) {
            specPane.hidden = false;
            gsap.fromTo(specPane, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
          }
        }
      });
    });
  });
}

/**
 * Thoughtful Operational Status Micro-Interaction
 */
function initStatusInteraction() {
  const statusEl = document.querySelector('.hero__status');
  if (!statusEl) return;

  const messages = [
    'Operational // Available for new engagements',
    'Focus // Autonomous agent runtimes & Solana/EVM state simulation',
    'Invariant // Pre-flight Anvil forks before broadcasting raw txs',
    'Philosophy // Less prompt theater, more verifiable uptime'
  ];
  let msgIdx = 0;

  statusEl.style.cursor = 'pointer';
  statusEl.setAttribute('title', 'Click to toggle telemetry status');

  statusEl.addEventListener('click', () => {
    msgIdx = (msgIdx + 1) % messages.length;
    const textSpan = statusEl.querySelector('span');
    if (textSpan) {
      scrambleText(textSpan, 0.45);
      setTimeout(() => {
        textSpan.innerHTML = `<i class="status-dot" aria-hidden="true"></i>${messages[msgIdx]}`;
      }, 250);
    }
  });
}

export function initAgencyFX() {
  init3DCardTilt();
  initMagneticButtons();
  initRealityToggles();
  initStatusInteraction();
}
