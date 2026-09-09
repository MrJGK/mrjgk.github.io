/* Procedural light, pointer depth, and a persistent motion preference. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const button = document.querySelector('[data-motion-toggle]');
  const portrait = document.querySelector('[data-portrait-tilt]');
  const canvas = document.querySelector('[data-light-field]');
  const preferenceKey = 'jgk-motion-paused';
  let userPaused = false;
  try { userPaused = window.localStorage.getItem(preferenceKey) === 'true'; } catch { /* Optional preference. */ }

  const motionAllowed = () => !reducedMotion.matches && !userPaused;
  let frame = 0;
  let lastPaint = 0;
  let elapsed = 0;
  let pointerX = 0;
  let pointerY = 0;
  let smoothX = 0;
  let smoothY = 0;
  let heroVisible = true;
  let renderer = null;

  function resetDepth() {
    pointerX = pointerY = smoothX = smoothY = 0;
    root.style.setProperty('--scene-x', '0px');
    root.style.setProperty('--scene-y', '0px');
    if (portrait) {
      portrait.style.setProperty('--portrait-rx', '0deg');
      portrait.style.setProperty('--portrait-ry', '0deg');
    }
  }

  function createLightField() {
    if (!canvas) return null;
    let gl;
    try {
      gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: 'low-power'
      });
    } catch { return null; }
    if (!gl) return null;

    const vertexSource = `
      attribute vec2 a_position;
      void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
    `;
    const fragmentSource = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      uniform vec2 u_resolution;
      uniform vec2 u_pointer;
      uniform float u_time;

      float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float aspect = u_resolution.x / u_resolution.y;
        vec2 p = (uv - vec2(0.73, 0.53)) * vec2(aspect, 1.0);
        p -= u_pointer * vec2(0.025, 0.018);
        p.x += p.y * 0.21;
        float angle = atan(p.y, p.x);
        float radius = length(p * vec2(0.88, 1.0));
        float wave = sin(angle * 3.0 + u_time * 0.21) * 0.016;
        wave += sin(angle * 5.0 - u_time * 0.13) * 0.009;
        float orbit = abs(radius - (0.34 + wave));
        float secondOrbit = abs(radius - (0.405 - wave * 0.45));
        float thread = pow(0.0035 / (orbit + 0.0035), 1.6);
        float secondThread = pow(0.0018 / (secondOrbit + 0.0018), 1.5);
        float light = 0.017 / (orbit + 0.065);
        float rim = 0.4 + 0.6 * pow(0.5 + 0.5 * sin(angle * 2.0 - u_time * 0.17), 2.0);
        float strength = thread * rim * 0.34 + secondThread * 0.12 + light * 0.16;

        float dust = 0.0;
        for (int i = 0; i < 12; i++) {
          float fi = float(i);
          vec2 seed = vec2(hash(fi + 1.2), hash(fi + 8.7));
          vec2 position = vec2(seed.x, fract(seed.y + u_time * (0.0015 + seed.x * 0.001)));
          vec2 delta = (uv - position) * vec2(aspect, 1.0);
          float distanceToDust = length(delta);
          dust += (1.0 - smoothstep(0.0005, 0.003, distanceToDust)) * 0.15;
        }

        vec3 mint = mix(vec3(0.50, 0.85, 0.72), vec3(0.78, 0.98, 0.55), 0.5 + 0.5 * sin(angle + 0.6));
        float edgeFade = smoothstep(0.0, 0.18, uv.x) * (1.0 - smoothstep(0.87, 1.0, uv.y));
        float alpha = clamp((strength + dust) * edgeFade, 0.0, 0.42);
        gl_FragColor = vec4(mint * alpha, alpha);
      }
    `;

    function compile(type, source) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Shader unavailable');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        throw new Error('Shader compilation unavailable');
      }
      return shader;
    }

    let program;
    let buffer;
    const shaders = [];
    try {
      shaders.push(compile(gl.VERTEX_SHADER, vertexSource));
      shaders.push(compile(gl.FRAGMENT_SHADER, fragmentSource));
      program = gl.createProgram();
      if (!program) throw new Error('Shader program unavailable');
      shaders.forEach((shader) => gl.attachShader(program, shader));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader linking unavailable');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      if (!buffer) throw new Error('Vertex buffer unavailable');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      shaders.forEach((shader) => gl.deleteShader(shader));
    } catch {
      shaders.forEach((shader) => gl.deleteShader(shader));
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      return null;
    }

    const resolution = gl.getUniformLocation(program, 'u_resolution');
    const pointer = gl.getUniformLocation(program, 'u_pointer');
    const time = gl.getUniformLocation(program, 'u_time');
    function resize() {
      // The light is intentionally soft: cap both density and dimensions, especially on phones.
      const scale = Math.min(window.devicePixelRatio || 1, 1.25, 1280 / Math.max(window.innerWidth, window.innerHeight));
      const width = Math.max(1, Math.round(window.innerWidth * scale));
      const height = Math.max(1, Math.round(window.innerHeight * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniform2f(resolution, width, height);
    }
    resize();
    return {
      resize,
      draw(seconds, x, y) {
        if (gl.isContextLost()) return;
        gl.uniform1f(time, seconds);
        gl.uniform2f(pointer, x, y);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    };
  }

  function paintDepth() {
    root.style.setProperty('--scene-x', `${(smoothX * 9).toFixed(2)}px`);
    root.style.setProperty('--scene-y', `${(smoothY * 6).toFixed(2)}px`);
    if (portrait && heroVisible) {
      portrait.style.setProperty('--portrait-rx', `${(-smoothY * 1.8).toFixed(2)}deg`);
      portrait.style.setProperty('--portrait-ry', `${(smoothX * 2.4).toFixed(2)}deg`);
    }
  }

  function tick(now) {
    frame = 0;
    if (!motionAllowed() || document.hidden) return;
    const frameInterval = finePointer.matches ? 1000 / 30 : 1000 / 24;
    const delta = now - lastPaint;
    if (!lastPaint || delta >= frameInterval) {
      elapsed += Math.min(delta || frameInterval, 70) / 1000;
      lastPaint = now;
      if (finePointer.matches) {
        smoothX += (pointerX - smoothX) * 0.12;
        smoothY += (pointerY - smoothY) * 0.12;
        if (Math.abs(pointerX - smoothX) > 0.001 || Math.abs(pointerY - smoothY) > 0.001) paintDepth();
      }
      if (renderer) renderer.draw(elapsed, smoothX, smoothY);
    }
    if (renderer || Math.abs(pointerX - smoothX) > 0.001 || Math.abs(pointerY - smoothY) > 0.001) {
      frame = window.requestAnimationFrame(tick);
    }
  }

  function start() {
    if (!frame && motionAllowed() && !document.hidden) {
      lastPaint = 0;
      frame = window.requestAnimationFrame(tick);
    }
  }

  function stop() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    lastPaint = 0;
  }

  function applyPreference() {
    const paused = !motionAllowed();
    root.classList.toggle('motion-paused', paused);
    if (button) {
      button.hidden = reducedMotion.matches;
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? 'Resume visual effects' : 'Pause visual effects');
      const label = button.querySelector('[data-motion-label]');
      if (label) label.textContent = paused ? 'Resume effects' : 'Pause effects';
    }
    document.dispatchEvent(new CustomEvent('site:motion-change'));
    if (paused) {
      stop();
      resetDepth();
      if (renderer) renderer.draw(elapsed, 0, 0);
    } else start();
  }

  if (button) button.addEventListener('click', () => {
    userPaused = !userPaused;
    try { window.localStorage.setItem(preferenceKey, String(userPaused)); } catch { /* Motion still pauses. */ }
    applyPreference();
  });
  window.addEventListener('pointermove', (event) => {
    if (!motionAllowed() || !finePointer.matches || event.pointerType !== 'mouse') return;
    pointerX = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1));
    pointerY = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1));
    start();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointerX = pointerY = 0; start(); });
  window.addEventListener('blur', () => { pointerX = pointerY = 0; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', applyPreference);
  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      if (renderer) { renderer.resize(); renderer.draw(elapsed, smoothX, smoothY); }
    });
  }, { passive: true });
  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', applyPreference);
    finePointer.addEventListener('change', () => { resetDepth(); applyPreference(); });
  } else if (typeof reducedMotion.addListener === 'function') {
    reducedMotion.addListener(applyPreference);
  }

  const hero = document.querySelector('.portrait-hero');
  if (hero && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => { heroVisible = entries[0].isIntersecting; });
    observer.observe(hero);
  }
  if (canvas) {
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      stop();
      renderer = null;
    });
    canvas.addEventListener('webglcontextrestored', () => {
      renderer = createLightField();
      if (renderer) renderer.draw(elapsed, 0, 0);
      applyPreference();
    });
  }

  try { renderer = createLightField(); } catch { renderer = null; }
  if (renderer) renderer.draw(0, 0, 0);
  applyPreference();
})();
