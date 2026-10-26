/**
 * motion.js — GSAP, ScrollTrigger & Lenis Orchestration
 *
 * Implements high-end creative agency motion:
 * - Lenis buttery-smooth momentum inertia scrolling
 * - Synchronized GSAP ScrollTrigger timeline
 * - Hero entrance choreography with staggered cyber reveal
 * - Interactive telemetry count-up on scroll
 * - Dynamic capability & in-flight progress bar filling
 * - Bento card scroll-driven entrance and screenshot parallax
 *
 * Strictly adheres to prefers-reduced-motion.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { scrambleText } from './agency-fx.js';

gsap.registerPlugin(ScrollTrigger);

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis = null;

export function getLenis() {
  return lenis;
}

export function refreshMotion() {
  ScrollTrigger.refresh();
}

/**
 * Initialize Lenis Smooth Inertia Scrolling
 */
export function initLenis() {
  if (REDUCED) return null;

  try {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Intercept in-page anchor links for buttery-smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#' || targetId === '') return;
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl, {
            offset: -60,
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          });
        }
      });
    });

    return lenis;
  } catch (err) {
    console.warn('Lenis init skipped:', err);
    return null;
  }
}

/**
 * The reading rule: thin neon bar tracking document scroll depth
 */
function initProgress() {
  const bar = document.getElementById('progress');
  if (!bar) return;

  ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      bar.style.inlineSize = `${(self.progress * 100).toFixed(2)}%`;
    },
  });
}

/**
 * Hero Load Choreography — Staggered cybernetic arrival
 */
function initHeroEntrance() {
  if (REDUCED) return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.fromTo(
    '.hero__status span',
    { y: -18, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, delay: 0.05 }
  );

  tl.fromTo(
    '.hero__title span',
    { y: 35, opacity: 0, skewY: 1.5 },
    { y: 0, opacity: 1, skewY: 0, duration: 0.75, stagger: 0.1 },
    '-=0.25'
  );

  tl.fromTo(
    '.hero__kicker',
    { opacity: 0, x: -15 },
    { opacity: 1, x: 0, duration: 0.45 },
    '-=0.35'
  );

  tl.fromTo(
    '.hero__lede',
    { opacity: 0, y: 15 },
    { opacity: 1, y: 0, duration: 0.5 },
    '-=0.3'
  );

  tl.fromTo(
    '.hero__acts > *',
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.45, stagger: 0.06 },
    '-=0.25'
  );

  tl.fromTo(
    '.hero__visual',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.5 },
    '-=0.3'
  );

  tl.fromTo(
    '.toc li',
    { opacity: 0, y: 15 },
    { opacity: 1, y: 0, duration: 0.4, stagger: 0.04 },
    '-=0.2'
  );
}

/**
 * Metrics Bento Live Count-Up
 */
function initMetricsCountUp() {
  const metricElements = document.querySelectorAll('.metric__v[data-count]');
  if (!metricElements.length) return;

  ScrollTrigger.create({
    trigger: '#metrics',
    start: 'top 75%',
    once: true,
    onEnter: () => {
      metricElements.forEach((el) => {
        const targetVal = parseFloat(el.getAttribute('data-count'));
        const suffix = el.getAttribute('data-suffix') || '';
        const pad = parseInt(el.getAttribute('data-pad') || '0', 10);
        const isComma = el.getAttribute('data-format') === 'comma';
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);

        const counter = { val: 0 };
        gsap.to(counter, {
          val: targetVal,
          duration: 1.8,
          ease: 'power3.out',
          onUpdate: () => {
            let str;
            if (decimals > 0) {
              str = counter.val.toFixed(decimals);
            } else {
              const rounded = Math.round(counter.val);
              if (isComma) {
                str = rounded.toLocaleString('en-US');
              } else if (pad > 0) {
                str = String(rounded).padStart(pad, '0');
              } else {
                str = String(rounded);
              }
            }
            el.textContent = str + suffix;
          },
        });
      });
    },
  });
}

/**
 * Capability & In-Flight Progress Meters
 */
function initMeters() {
  const profileFills = document.querySelectorAll('#profile .meter__fill');
  if (profileFills.length) {
    profileFills.forEach((fill) => {
      fill.style.transformOrigin = 'left center';
      gsap.set(fill, { scaleX: 0 });
    });

    ScrollTrigger.create({
      trigger: '#profile',
      start: 'top 70%',
      once: true,
      onEnter: () => {
        gsap.to(profileFills, {
          scaleX: 1,
          duration: 1.2,
          ease: 'power2.out',
          stagger: 0.08,
        });
      },
    });
  }
}

/**
 * Work Bento Cards Reveal & Subtle Screenshot Parallax
 */
function initWorkCards() {
  const cards = document.querySelectorAll('.work-card');
  if (!cards.length) return;

  ScrollTrigger.batch('.work-card', {
    start: 'top 85%',
    once: true,
    onEnter: (batch) => {
      gsap.fromTo(
        batch,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.1,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
        }
      );
    },
  });
}

/**
 * Section Title Scramble on Scroll Trigger
 */
function initSectionScrambles() {
  const sections = document.querySelectorAll('section[data-panel]');
  sections.forEach((sec) => {
    const title = sec.querySelector('.compartment__title');
    if (title) {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          scrambleText(title, 0.55);
        },
      });
    }
  });
}

/**
 * Primary Motion Initializer
 */
export function initMotion() {
  if (REDUCED) return;

  initLenis();
  initProgress();
  initHeroEntrance();
  initMetricsCountUp();
  initMeters();
  initWorkCards();
  initSectionScrambles();

  // Re-measure ScrollTrigger once images have finished loading
  const imgs = document.querySelectorAll('img');
  let pending = imgs.length;
  if (!pending) return;

  const onImageDone = () => {
    pending--;
    if (pending === 0) ScrollTrigger.refresh();
  };

  imgs.forEach((img) => {
    if (img.complete) {
      pending--;
    } else {
      img.addEventListener('load', onImageDone, { once: true });
      img.addEventListener('error', onImageDone, { once: true });
    }
  });

  if (pending === 0) ScrollTrigger.refresh();
}