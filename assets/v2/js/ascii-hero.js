/**
 * ascii-hero.js — Monospaced ASCII Topographic Matrix & Telemetry Stream
 *
 * Full-viewport interactive 2D canvas background for the Hero Command Station.
 * Renders a fluid multi-harmonic mathematical terrain using monospaced ASCII glyphs,
 * mouse gravity ripples, click shockwaves, and full-viewport continuous coverage.
 *
 * PERFORMANCE & ARCHITECTURE CONTRACT:
 * - Pure HTML5 Canvas 2D (zero WebGL context loss, zero 3D library dependencies).
 * - Full-viewport seamless coverage: NO artificial rectangular voids or clipping.
 * - Device pixel ratio capped at 2 for razor-sharp Retina glyphs.
 * - Batched text rendering by color palette (minimizes canvas state switches).
 * - Automatic pause via IntersectionObserver when scrolled out of view (0% CPU/GPU down-page).
 * - Respects prefers-reduced-motion (renders a crisp, balanced static frame).
 */

export function initHeroAscii() {
  const canvas = document.getElementById('hero-ascii') || document.getElementById('hero-gl');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Optical density ramp with natural void spacing
  // Troughs become clean void, while contours and wave crests form glowing topological bands
  const DENSITY_GLYPHS = [' ', ' ', '·', ':', '+', 'x', '*', '#', '@'];
  const NUM_GLYPHS = DENSITY_GLYPHS.length;

  // State Tracking
  let width = 0;
  let height = 0;
  let dpr = 1;
  let cols = 0;
  let rows = 0;

  // Optical grid sizing (minified, high-density monospaced mesh)
  const BASE_FONT_SIZE = 9.5;
  let cellW = 6.8;
  let cellH = 13.0;
  let fontSize = BASE_FONT_SIZE;

  // Pointer & Interactive Waves
  let canvasRect = null;
  let mouseX = -9999;
  let mouseY = -9999;
  let targetMouseX = -9999;
  let targetMouseY = -9999;
  let hasPointer = false;

  // Interactive Click Shockwaves
  const shockwaves = [];

  function updateCanvasRect() {
    const parent = canvas.parentElement;
    if (parent && parent.clientWidth > 0 && parent.clientHeight > 0) {
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvasRect = parent.getBoundingClientRect();
    } else {
      canvasRect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(canvasRect.width));
      height = Math.max(1, Math.floor(canvasRect.height));
    }
  }

  function resize() {
    updateCanvasRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const isMobile = width < 640;
    fontSize = isMobile ? 8.5 : 9.5;
    cellW = isMobile ? 5.8 : 6.8;
    cellH = isMobile ? 11.2 : 13.0;

    cols = Math.ceil(width / cellW) + 1;
    rows = Math.ceil(height / cellH) + 1;

    ctx.font = `${Math.round(fontSize * dpr)}px "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace`;
    ctx.textBaseline = 'top';
  }

  let resizeRaf = null;
  function onResize() {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null;
      resize();
      if (prefersReduced) drawFrame(0);
    });
  }

  window.addEventListener('resize', onResize, { passive: true });

  if ('ResizeObserver' in window && canvas.parentElement) {
    const ro = new ResizeObserver(() => {
      resize();
      if (prefersReduced) drawFrame(0);
    });
    ro.observe(canvas.parentElement);
  }

  resize();

  // Pointer Interactivity (passive window listener ensures zero interference with buttons/links)
  function onPointerMove(e) {
    if (!isVisible) return;
    if (!canvasRect) updateCanvasRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;

    if (x >= -20 && x <= width + 20 && y >= -20 && y <= height + 20) {
      targetMouseX = x;
      targetMouseY = y;
      if (!hasPointer) {
        mouseX = targetMouseX;
        mouseY = targetMouseY;
        hasPointer = true;
      }
    } else {
      hasPointer = false;
      targetMouseX = -9999;
      targetMouseY = -9999;
    }
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // Interactive Shockwave Trigger on Frame Click / Tap
  const frameContainer = canvas.closest('.hero-art-frame') || document.getElementById('index');
  if (frameContainer) {
    frameContainer.addEventListener('pointerdown', (e) => {
      if (e.target && (e.target.closest('a') || e.target.closest('button') || e.target.closest('[role="button"]'))) {
        return;
      }
      if (!canvasRect) updateCanvasRect();
      const clickX = e.clientX - canvasRect.left;
      const clickY = e.clientY - canvasRect.top;

      if (clickX >= 0 && clickX <= width && clickY >= 0 && clickY <= height) {
        shockwaves.push({
          x: clickX,
          y: clickY,
          radius: 0,
          maxRadius: Math.max(width, height) * 1.2,
          speed: 6.5,
          strength: 2.8,
        });

        if (shockwaves.length > 5) shockwaves.shift();
      }
    }, { passive: true });
  }

  // Animation Loop State
  let isVisible = true;
  let animId = null;
  const startTime = performance.now();

  function drawFrame(now) {
    const elapsed = (now - startTime) * 0.001;

    // Smooth cursor interpolation (lerp)
    if (hasPointer) {
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;
    } else {
      mouseX += (-9999 - mouseX) * 0.05;
      mouseY += (-9999 - mouseY) * 0.05;
    }

    // Advance shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.radius += sw.speed;
      sw.strength *= 0.965;
      if (sw.radius > sw.maxRadius || sw.strength < 0.08) {
        shockwaves.splice(i, 1);
      }
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${Math.round(fontSize * dpr)}px "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace`;
    ctx.textBaseline = 'top';

    // Color buckets for batched draw calls (massive performance win)
    const bucketRed = [];      // Swiss Signal Red crests (#ff2b00)
    const bucketWhite = [];    // Stark Paper White high elevation (*, #)
    const bucketMid = [];      // Silver wave (+, x)
    const bucketMuted = [];    // Muted zinc (:)
    const bucketFaint = [];    // Deep background dots (·)

    const actualCellW = cellW * dpr;
    const actualCellH = cellH * dpr;

    for (let r = 0; r < rows; r++) {
      const py = r * cellH;
      const drawY = r * actualCellH;

      for (let c = 0; c < cols; c++) {
        const px = c * cellW;
        const drawX = c * actualCellW;

        // Multi-harmonic mathematical terrain deformation
        const w1 = Math.sin(c * 0.12 + elapsed * 0.75) * Math.cos(r * 0.10 + elapsed * 0.65);
        const w2 = Math.sin((c * 0.07 + r * 0.06) - elapsed * 0.45) * 0.55;
        const w3 = Math.cos(c * 0.18 - elapsed * 0.85) * Math.sin(r * 0.14 + elapsed * 0.7) * 0.25;
        let elevation = w1 + w2 + w3;

        // Interactive mouse attractor & expanding ripple
        if (hasPointer) {
          const dx = px - mouseX;
          const dy = py - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 460) {
            const ripple = Math.sin(dist * 0.038 - elapsed * 3.2) * Math.exp(-dist * 0.0038) * 1.6;
            elevation += ripple;
          }
        }

        // Apply expanding shockwave impulses
        for (let i = 0; i < shockwaves.length; i++) {
          const sw = shockwaves[i];
          const dist = Math.hypot(px - sw.x, py - sw.y);
          const diff = Math.abs(dist - sw.radius);
          if (diff < 50) {
            const impulse = Math.cos((diff / 50) * (Math.PI / 2)) * sw.strength;
            elevation += impulse;
          }
        }

        // Normalize elevation into density index across the whole canvas
        const norm = (elevation + 1.15) / 2.3;
        let glyphIdx = Math.floor(norm * NUM_GLYPHS);
        if (glyphIdx < 0) glyphIdx = 0;
        if (glyphIdx >= NUM_GLYPHS) glyphIdx = NUM_GLYPHS - 1;

        const char = DENSITY_GLYPHS[glyphIdx];
        if (char === ' ') continue;

        // Sort into color buckets
        if (glyphIdx >= 8) {
          // Swiss Signal Red peak crests (@, #)
          bucketRed.push(char, drawX, drawY);
        } else if (glyphIdx >= 6) {
          // Stark Paper White high elevation (*, #)
          bucketWhite.push(char, drawX, drawY);
        } else if (glyphIdx >= 4) {
          // Mid silver wave (+, x)
          bucketMid.push(char, drawX, drawY);
        } else if (glyphIdx >= 3) {
          // Muted zinc (:)
          bucketMuted.push(char, drawX, drawY);
        } else {
          // Subtle ambient dot (·)
          bucketFaint.push(char, drawX, drawY);
        }
      }
    }

    // Render Batches
    // 1. Faint base dots (·)
    if (bucketFaint.length) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      for (let i = 0; i < bucketFaint.length; i += 3) {
        ctx.fillText(bucketFaint[i], bucketFaint[i + 1], bucketFaint[i + 2]);
      }
    }

    // 2. Muted zinc (:)
    if (bucketMuted.length) {
      ctx.fillStyle = 'rgba(161, 161, 170, 0.20)';
      for (let i = 0; i < bucketMuted.length; i += 3) {
        ctx.fillText(bucketMuted[i], bucketMuted[i + 1], bucketMuted[i + 2]);
      }
    }

    // 3. Mid silver (+, x)
    if (bucketMid.length) {
      ctx.fillStyle = 'rgba(228, 228, 231, 0.38)';
      for (let i = 0; i < bucketMid.length; i += 3) {
        ctx.fillText(bucketMid[i], bucketMid[i + 1], bucketMid[i + 2]);
      }
    }

    // 4. Stark Paper White (*, #)
    if (bucketWhite.length) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let i = 0; i < bucketWhite.length; i += 3) {
        ctx.fillText(bucketWhite[i], bucketWhite[i + 1], bucketWhite[i + 2]);
      }
    }

    // 5. Swiss Signal Red (@, #)
    if (bucketRed.length) {
      ctx.fillStyle = '#ff2b00';
      for (let i = 0; i < bucketRed.length; i += 3) {
        ctx.fillText(bucketRed[i], bucketRed[i + 1], bucketRed[i + 2]);
      }
    }

    if (!prefersReduced) {
      animId = requestAnimationFrame(drawFrame);
    }
  }

  // Visibility Optimization: Stop animation when Hero is scrolled out of view
  const heroSection = document.getElementById('index');
  if (heroSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!isVisible) {
            isVisible = true;
            updateCanvasRect();
            if (!prefersReduced) animId = requestAnimationFrame(drawFrame);
          }
        } else {
          isVisible = false;
          if (animId) cancelAnimationFrame(animId);
        }
      });
    }, { threshold: 0.05 });

    observer.observe(heroSection);
  }

  // Initial draw
  if (prefersReduced) {
    drawFrame(startTime + 1500); // Single crisp static snapshot
  } else {
    animId = requestAnimationFrame(drawFrame);
  }
}
