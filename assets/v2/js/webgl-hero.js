/**
 * webgl-hero.js — Abstract 3D Cybernetic Topological Lattice & Neural Mesh
 *
 * Full-screen interactive WebGL background for the Hero Command Station.
 * Renders an undulating 3D mathematical wireframe lattice, glowing neural nodes,
 * and traveling energy packets with real-time mouse gravity distortion and depth fog.
 *
 * PERFORMANCE CONTRACT:
 * - Pure WebGL (zero heavy 3D library dependencies).
 * - Device pixel ratio capped at 2 to preserve 60-120 FPS on Retina displays.
 * - Auto-pauses animation via IntersectionObserver when offscreen (0% GPU when reading below).
 * - Respects prefers-reduced-motion (renders a subtle static snapshot).
 */

export function initHeroWebGL() {
  const canvas = document.getElementById('hero-gl');
  if (!canvas) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initialize WebGL context (WebGL2 preferred, WebGL1 fallback)
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'high-performance' }) ||
             canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'high-performance' });

  if (!gl) return;

  // Vertex Shader
  const vsSource = `
    precision highp float;
    attribute vec3 a_position;
    attribute float a_type; // 0 = line vertex, 1 = node, 2 = particle

    uniform mat4 u_mvp;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform float u_point_size;

    varying float v_type;
    varying float v_elevation;
    varying float v_dist;

    void main() {
      v_type = a_type;
      vec3 pos = a_position;

      // Distance to interactive mouse attractor in normalized space
      float distToMouse = length(pos.xy - u_mouse * vec2(2.2, 1.4));
      float ripple = sin(distToMouse * 5.0 - u_time * 2.5) * exp(-distToMouse * 1.8) * 0.38;

      // Multi-harmonic mathematical wave deformation
      float wave1 = sin(pos.x * 2.2 + u_time * 0.75) * cos(pos.y * 1.8 + u_time * 0.65);
      float wave2 = sin((pos.x + pos.y) * 1.5 - u_time * 0.5) * 0.45;
      float wave3 = cos(pos.x * 3.8 - u_time * 0.9) * sin(pos.y * 3.2 + u_time * 0.8) * 0.18;

      pos.z += (wave1 + wave2 + wave3) * 0.32 + ripple;

      // Pass elevation and distance for coloring & fog
      v_elevation = pos.z;
      v_dist = length(pos.xy);

      gl_Position = u_mvp * vec4(pos, 1.0);
      gl_PointSize = u_point_size * (1.6 + 1.2 * sin(pos.z * 3.5 + u_time * 2.0));
    }
  `;

  // Fragment Shader
  const fsSource = `
    precision highp float;

    varying float v_type;
    varying float v_elevation;
    varying float v_dist;

    uniform vec3 u_color_cyan;
    uniform vec3 u_color_purple;
    uniform float u_time;

    void main() {
      // Depth fog fading out smoothly into dark black void
      float alpha = clamp(1.0 - (v_dist / 3.8), 0.0, 1.0);
      alpha = pow(alpha, 1.35);

      if (v_type > 2.5) {
        // Nostalgic vector oscilloscope Lissajous trace
        vec3 oscCol = mix(u_color_cyan, vec3(1.0, 1.0, 0.9), 0.35 + 0.25 * sin(u_time * 2.0));
        gl_FragColor = vec4(oscCol, alpha * 0.92);
      } else if (v_type > 0.5) {
        // Point sprite circular glowing falloff
        vec2 coord = gl_PointCoord - vec2(0.5);
        float r = length(coord);
        if (r > 0.5) discard;
        float glow = pow(1.0 - r * 2.0, 1.4);

        // Neon node color mix: acid lime and electric violet pulses
        float mixVal = 0.5 + 0.5 * sin(v_elevation * 3.5 + u_time * 1.5);
        vec3 col = mix(u_color_cyan, u_color_purple, mixVal);
        gl_FragColor = vec4(col, glow * alpha);
      } else {
        // Line styling: wireframe with dark carbon troughs and Swiss Signal Red crests
        float crest = smoothstep(-0.25, 0.45, v_elevation);
        vec3 lineCol = mix(vec3(0.08, 0.08, 0.09), u_color_cyan, crest * 0.95);
        gl_FragColor = vec4(lineCol, alpha * (0.42 + crest * 0.58));
      }
    }
  `;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);

  // Geometry Generation: 3D Grid Topology (44 x 26 divisions)
  const COLS = 44;
  const ROWS = 26;
  const X_SPAN = 5.6;
  const Y_SPAN = 3.2;

  const positions = [];
  const types = [];

  // 1. Grid Lines (Horizontal & Vertical)
  const lineIndices = [];
  const gridNodes = [];

  for (let r = 0; r <= ROWS; r++) {
    for (let c = 0; c <= COLS; c++) {
      const x = ((c / COLS) - 0.5) * X_SPAN;
      const y = ((r / ROWS) - 0.5) * Y_SPAN;
      const z = 0.0;
      gridNodes.push({ x, y, z });
    }
  }

  // Horizontal line segments
  for (let r = 0; r <= ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx1 = r * (COLS + 1) + c;
      const idx2 = idx1 + 1;
      const n1 = gridNodes[idx1];
      const n2 = gridNodes[idx2];
      positions.push(n1.x, n1.y, n1.z, n2.x, n2.y, n2.z);
      types.push(0.0, 0.0);
    }
  }

  // Vertical line segments
  for (let c = 0; c <= COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const idx1 = r * (COLS + 1) + c;
      const idx2 = (r + 1) * (COLS + 1) + c;
      const n1 = gridNodes[idx1];
      const n2 = gridNodes[idx2];
      positions.push(n1.x, n1.y, n1.z, n2.x, n2.y, n2.z);
      types.push(0.0, 0.0);
    }
  }

  const lineVertexCount = positions.length / 3;

  // 2. Luminous Nodes (Points at key intersections)
  for (let r = 1; r < ROWS; r += 2) {
    for (let c = 1; c < COLS; c += 2) {
      const idx = r * (COLS + 1) + c;
      const n = gridNodes[idx];
      positions.push(n.x, n.y, n.z);
      types.push(1.0);
    }
  }

  const pointVertexCount = (positions.length / 3) - lineVertexCount;

  // 3. Nostalgic 3D Vector Oscilloscope Lissajous Harmonic Knot
  const KNOT_STEPS = 240;
  for (let i = 0; i < KNOT_STEPS; i++) {
    const t1 = (i / KNOT_STEPS) * Math.PI * 2;
    const t2 = ((i + 1) / KNOT_STEPS) * Math.PI * 2;
    // Harmonic frequencies 3:2:5
    const x1 = Math.sin(t1 * 3.0) * 1.9;
    const y1 = Math.cos(t1 * 2.0) * 1.05;
    const z1 = Math.sin(t1 * 5.0) * 0.4 + 0.35;

    const x2 = Math.sin(t2 * 3.0) * 1.9;
    const y2 = Math.cos(t2 * 2.0) * 1.05;
    const z2 = Math.sin(t2 * 5.0) * 0.4 + 0.35;

    positions.push(x1, y1, z1, x2, y2, z2);
    types.push(3.0, 3.0);
  }

  const lissajousVertexCount = (positions.length / 3) - lineVertexCount - pointVertexCount;

  // Create Buffers
  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

  const typeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(types), gl.STATIC_DRAW);

  const aType = gl.getAttribLocation(program, 'a_type');
  gl.enableVertexAttribArray(aType);
  gl.vertexAttribPointer(aType, 1, gl.FLOAT, false, 0, 0);

  // Uniform Locations
  const uMvp = gl.getUniformLocation(program, 'u_mvp');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uMouse = gl.getUniformLocation(program, 'u_mouse');
  const uPointSize = gl.getUniformLocation(program, 'u_point_size');
  const uColorCyan = gl.getUniformLocation(program, 'u_color_cyan');
  const uColorPurple = gl.getUniformLocation(program, 'u_color_purple');

  // Set Static Uniforms (Swiss Signal Red #ff2b00 and Stark Paper White #ffffff)
  gl.uniform3f(uColorCyan, 1.0, 0.17, 0.0);
  gl.uniform3f(uColorPurple, 0.96, 0.96, 0.98);

  // 4x4 Matrix Math Helpers
  function createMatrix() {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  function multiplyMatrix(out, a, b) {
    const ae = a, be = b, te = new Float32Array(16);
    const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
    const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
    const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
    const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

    const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
    const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
    const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
    const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

    te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
    te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
    te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
    te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

    te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
    te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
    te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
    te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

    te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
    te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
    te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
    te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

    te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
    te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
    te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
    te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

    for (let i = 0; i < 16; i++) out[i] = te[i];
    return out;
  }

  function perspectiveMatrix(out, fovRad, aspect, near, far) {
    const f = 1.0 / Math.tan(fovRad / 2);
    const rangeInv = 1 / (near - far);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (near + far) * rangeInv; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = near * far * rangeInv * 2; out[15] = 0;
    return out;
  }

  // State Tracking
  let width = 0;
  let height = 0;
  let dpr = 1;

  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  let canvasRect = null;
  function updateCanvasRect() {
    canvasRect = canvas.getBoundingClientRect();
  }

  function resize() {
    updateCanvasRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(canvasRect.width * dpr));
    height = Math.max(1, Math.floor(canvasRect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    gl.viewport(0, 0, width, height);
  }

  let resizeRaf = null;
  function onResize() {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null;
      resize();
    });
  }

  window.addEventListener('resize', onResize, { passive: true });
  resize();

  // Mouse Interactivity — cached rect, passive listener, zero layout thrashing
  function onPointerMove(e) {
    if (!isVisible) return;
    if (!canvasRect) updateCanvasRect();
    const nx = ((e.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
    const ny = -(((e.clientY - canvasRect.top) / canvasRect.height) * 2 - 1);
    targetMouseX = nx;
    targetMouseY = ny;
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // Camera and Projection Configuration
  const projMat = createMatrix();
  const viewMat = createMatrix();
  const mvpMat = createMatrix();

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive cyber blending
  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  let isVisible = true;
  let animId = null;
  const startTime = performance.now();

  function render(now) {
    if (!isVisible) return;

    const elapsed = (now - startTime) * 0.001;

    // Mouse Damping (Lerp)
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    // Projection & Perspective Matrix
    const aspect = width / height;
    perspectiveMatrix(projMat, (55 * Math.PI) / 180, aspect, 0.1, 100.0);

    // Camera 3D View with subtle pitch/yaw tilting
    const pitch = 0.85 + mouseY * 0.18; // 3D isometric angle
    const yaw = mouseX * 0.15;

    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);

    // Construct view matrix with camera looking at center from (0, -2.4, 1.8)
    viewMat[0] = cosY;
    viewMat[1] = sinY * sinP;
    viewMat[2] = -sinY * cosP;
    viewMat[3] = 0;

    viewMat[4] = 0;
    viewMat[5] = cosP;
    viewMat[6] = sinP;
    viewMat[7] = 0;

    viewMat[8] = sinY;
    viewMat[9] = -cosY * sinP;
    viewMat[10] = cosY * cosP;
    viewMat[11] = 0;

    viewMat[12] = 0;
    viewMat[13] = -0.12;
    viewMat[14] = -2.65;
    viewMat[15] = 1;

    multiplyMatrix(mvpMat, projMat, viewMat);

    // Clear and Update Uniforms
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniformMatrix4fv(uMvp, false, mvpMat);
    gl.uniform1f(uTime, elapsed);
    gl.uniform2f(uMouse, mouseX, mouseY);
    gl.uniform1f(uPointSize, 6.0 * dpr);

    // 1. Draw Grid Lines
    gl.drawArrays(gl.LINES, 0, lineVertexCount);

    // 2. Draw Luminous Nodes
    gl.drawArrays(gl.POINTS, lineVertexCount, pointVertexCount);

    // 3. Draw Nostalgic Oscilloscope Lissajous Knot
    gl.drawArrays(gl.LINES, lineVertexCount + pointVertexCount, lissajousVertexCount);

    if (!prefersReduced) {
      animId = requestAnimationFrame(render);
    }
  }

  // Visibility Optimization: Stop render loop when hero is scrolled out of view
  const heroSection = document.getElementById('index');
  if (heroSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!isVisible) {
            isVisible = true;
            updateCanvasRect();
            if (!prefersReduced) animId = requestAnimationFrame(render);
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
    render(startTime + 1000); // One static frame
  } else {
    animId = requestAnimationFrame(render);
  }
}
