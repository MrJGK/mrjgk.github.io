/* Page-wide signal paths and accessible motion preferences. The profile stays static. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const button = document.querySelector('[data-motion-toggle]');
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
  let renderer = null;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);

  function resetDepth() {
    pointerX = pointerY = smoothX = smoothY = 0;
    root.style.setProperty('--scene-x', '0px');
    root.style.setProperty('--scene-y', '0px');
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
      uniform float u_scroll;

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float aspect = u_resolution.x / u_resolution.y;
        vec2 p = uv + u_pointer * vec2(0.018, 0.012);
        float scrollShift = min(u_scroll, 4.0) * 0.013;
        float signal = 0.0;
        float glow = 0.0;
        for (int i = 0; i < 8; i++) {
          float lane = float(i);
          float phase = lane * 0.48;
          float curve = 0.24 + lane * 0.043 + scrollShift;
          curve += sin(p.x * 6.0 + u_time * 0.12 + phase) * 0.052;
          curve += cos(p.x * 11.0 - u_time * 0.08 + phase) * 0.019;
          float distanceToLane = abs(p.y - curve);
          float beam = pow(0.0014 / (distanceToLane + 0.0014), 1.45);
          float pulse = pow(0.5 + 0.5 * sin(p.x * 9.0 - u_time * 0.6 + phase), 9.0);
          signal += beam * (0.055 + pulse * 0.16);
          glow += 0.0005 / (distanceToLane + 0.045);
        }

        vec2 grid = vec2(p.x * aspect, p.y) * 22.0;
        vec2 cell = fract(grid) - 0.5;
        float dotField = 1.0 - smoothstep(0.018, 0.052, length(cell));
        float gridFade = (1.0 - smoothstep(0.0, 0.5, abs(p.y - 0.4))) * 0.032;
        float edgeFade = smoothstep(0.12, 0.48, uv.x);
        edgeFade *= 1.0 - smoothstep(0.87, 1.0, uv.x);
        edgeFade *= 1.0 - smoothstep(0.7, 0.96, uv.y);
        vec3 color = mix(vec3(0.52, 0.86, 0.70), vec3(0.82, 1.0, 0.31), smoothstep(0.2, 0.9, uv.x));
        float alpha = clamp((signal + glow * 0.3 + dotField * gridFade) * edgeFade, 0.0, 0.35);
        gl_FragColor = vec4(color * alpha, alpha);
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
    const scroll = gl.getUniformLocation(program, 'u_scroll');
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
        gl.uniform1f(scroll, Math.max(0, window.scrollY || 0) / Math.max(1, window.innerHeight));
        gl.uniform2f(pointer, x, y);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    };
  }

  function paintDepth() {
    root.style.setProperty('--scene-x', `${(smoothX * 9).toFixed(2)}px`);
    root.style.setProperty('--scene-y', `${(smoothY * 6).toFixed(2)}px`);
  }

  function tick(now) {
    frame = 0;
    if (!motionAllowed() || document.hidden) return;
    const frameInterval = 1000 / (saveData ? 18 : finePointer.matches ? 40 : 24);
    const delta = now - lastPaint;
    if (!lastPaint || delta >= frameInterval) {
      elapsed += Math.min(delta || frameInterval, 70) / 1000;
      lastPaint = now;
      const easing = 1 - Math.exp(-Math.min(delta || frameInterval, 70) / 150);
      smoothX += (pointerX - smoothX) * easing;
      smoothY += (pointerY - smoothY) * easing;
      paintDepth();
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
    const bounds = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    pointerX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / Math.max(1, bounds.width) * 2 - 1));
    pointerY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / Math.max(1, bounds.height) * 2 - 1));
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
  // Native same-origin page transitions keep normal links, browser history, and fallback navigation.
  ['pageswap', 'pagereveal'].forEach((eventName) => {
    window.addEventListener(eventName, (event) => {
      if (!motionAllowed() && event.viewTransition) event.viewTransition.skipTransition();
    });
  });
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

  if (canvas) {
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      stop();
      renderer = null;
      start();
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
