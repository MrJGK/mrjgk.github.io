/* Projected 3D light paths, layered portrait motion, and accessible preferences. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const button = document.querySelector('[data-motion-toggle]');
  const portrait = document.querySelector('[data-portrait-tilt]');
  const stage = document.querySelector('[data-portrait-stage]');
  const scene = document.querySelector('[data-portrait-scene]');
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
  let orbitRenderer = null;
  let scrollDepth = 0;
  let smoothScroll = 0;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);

  function resetDepth() {
    pointerX = pointerY = smoothX = smoothY = 0;
    root.style.setProperty('--scene-x', '0px');
    root.style.setProperty('--scene-y', '0px');
    if (portrait) {
      portrait.style.setProperty('--portrait-rx', '0deg');
      portrait.style.setProperty('--portrait-ry', '0deg');
      portrait.style.setProperty('--portrait-drift', '0px');
      portrait.style.setProperty('--portrait-scroll', '0px');
    }
    if (stage) {
      stage.style.setProperty('--light-x', '50%');
      stage.style.setProperty('--light-y', '38%');
    }
    smoothScroll = 0;
  }

  function createPortraitOrbits() {
    if (!stage) return null;
    const back = stage.querySelector('[data-orbits-back]');
    const front = stage.querySelector('[data-orbits-front]');
    if (!back || !front) return null;
    const contexts = [back.getContext('2d'), front.getContext('2d')];
    if (contexts.some((context) => !context)) return null;
    let width = 1;
    let height = 1;
    const circles = [
      { radius: 0.47, tilt: 0.52, roll: -0.42, speed: 0.065, color: '208,255,78' },
      { radius: 0.43, tilt: -0.58, roll: 0.62, speed: -0.045, color: '141,220,200' }
    ];
    const particles = Array.from({ length: saveData ? 14 : 26 }, (_, index) => ({
      angle: index * 2.399963,
      radius: 0.31 + ((index * 17) % 13) / 85,
      elevation: Math.sin(index * 1.79) * 0.75,
      size: index % 5 === 0 ? 1.6 : 0.8
    }));

    function resize() {
      width = Math.max(1, stage.clientWidth);
      height = Math.max(1, stage.clientHeight);
      const density = Math.min(window.devicePixelRatio || 1, saveData ? 1 : 1.5);
      [back, front].forEach((surface, index) => {
        surface.width = Math.round(width * density);
        surface.height = Math.round(height * density);
        contexts[index].setTransform(density, 0, 0, density, 0, 0);
      });
    }

    function project(x, y, z, pointerX, pointerY) {
      const yaw = pointerX * 0.095;
      const pitch = -pointerY * 0.055;
      const rx = x * Math.cos(yaw) + z * Math.sin(yaw);
      const rz = z * Math.cos(yaw) - x * Math.sin(yaw);
      const ry = y * Math.cos(pitch) - rz * Math.sin(pitch);
      const depth = rz * Math.cos(pitch) + y * Math.sin(pitch);
      const perspective = 2.6 / (2.6 - depth);
      return { x: width * (0.5 + rx * perspective), y: height * 0.60 + ry * width * perspective, z: depth, scale: perspective };
    }

    function ringPoint(ring, angle, seconds, x, y) {
      const roll = ring.roll + Math.sin(seconds * 0.12) * 0.055;
      const tilt = ring.tilt + Math.sin(seconds * 0.09) * 0.025;
      const px = Math.cos(angle) * ring.radius;
      const py = Math.sin(angle) * ring.radius * Math.sin(tilt);
      const pz = Math.sin(angle) * ring.radius * Math.cos(tilt);
      return project(px * Math.cos(roll) - py * Math.sin(roll), px * Math.sin(roll) + py * Math.cos(roll), pz, x, y);
    }

    function visible(point, frontPass) {
      // Keep the foreground trails below the face, and all graphics away from page text.
      return frontPass ? point.z >= 0 && point.y > height * 0.53 : point.z < 0;
    }

    function glint(context, point, color, radius, opacity) {
      const gradient = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 5);
      gradient.addColorStop(0, `rgba(${color},${opacity})`);
      gradient.addColorStop(0.2, `rgba(${color},${opacity * 0.5})`);
      gradient.addColorStop(1, `rgba(${color},0)`);
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(point.x, point.y, radius * 5, 0, Math.PI * 2);
      context.fill();
    }

    resize();
    return {
      resize,
      draw(seconds, x, y) {
        contexts.forEach((context, pass) => {
          context.clearRect(0, 0, width, height);
          const frontPass = pass === 1;
          circles.forEach((ring, index) => {
            context.lineWidth = frontPass ? 0.9 : 0.65;
            context.strokeStyle = `rgba(${ring.color},${frontPass ? 0.23 : 0.16})`;
            context.beginPath();
            let connected = false;
            for (let step = 0; step <= 96; step += 1) {
              const point = ringPoint(ring, step / 96 * Math.PI * 2, seconds, x, y);
              if (!visible(point, frontPass)) { connected = false; continue; }
              if (connected) context.lineTo(point.x, point.y);
              else context.moveTo(point.x, point.y);
              connected = true;
            }
            context.stroke();
            const headAngle = seconds * ring.speed + index * 2.1;
            for (let trail = 0; trail < 12; trail += 1) {
              const point = ringPoint(ring, headAngle - trail * 0.018, seconds, x, y);
              if (visible(point, frontPass)) glint(context, point, ring.color, trail === 0 ? 1.7 : 0.75, (1 - trail / 12) * 0.58);
            }
          });
          particles.forEach((particle, index) => {
            const angle = particle.angle + seconds * 0.025;
            const point = project(Math.cos(angle) * particle.radius, particle.elevation * 0.4 + Math.sin(seconds * 0.16 + index) * 0.008, Math.sin(angle) * 0.4, x, y);
            if (visible(point, frontPass)) glint(context, point, index % 3 ? '187,216,150' : '141,220,200', particle.size * point.scale, 0.20 + Math.sin(seconds * 0.3 + index) * 0.055);
          });
        });
      }
    };
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
    if (portrait && heroVisible) {
      portrait.style.setProperty('--portrait-rx', `${(-smoothY * 2.3).toFixed(2)}deg`);
      portrait.style.setProperty('--portrait-ry', `${(smoothX * 4).toFixed(2)}deg`);
      portrait.style.setProperty('--portrait-drift', `${(Math.sin(elapsed * 0.42) * 2.2).toFixed(2)}px`);
      portrait.style.setProperty('--portrait-scroll', `${smoothScroll.toFixed(2)}px`);
      stage.style.setProperty('--light-x', `${(50 + smoothX * 17).toFixed(1)}%`);
      stage.style.setProperty('--light-y', `${(38 + smoothY * 12).toFixed(1)}%`);
    }
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
      smoothScroll += (scrollDepth - smoothScroll) * easing;
      if (heroVisible || Math.abs(pointerX - smoothX) > 0.001 || Math.abs(pointerY - smoothY) > 0.001) paintDepth();
      if (renderer) renderer.draw(elapsed, smoothX, smoothY);
      if (orbitRenderer && heroVisible) orbitRenderer.draw(elapsed, smoothX, smoothY);
    }
    if (renderer || (portrait && heroVisible) || Math.abs(pointerX - smoothX) > 0.001 || Math.abs(pointerY - smoothY) > 0.001) {
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
      if (orbitRenderer) orbitRenderer.draw(elapsed, 0, 0);
    } else start();
  }

  if (button) button.addEventListener('click', () => {
    userPaused = !userPaused;
    try { window.localStorage.setItem(preferenceKey, String(userPaused)); } catch { /* Motion still pauses. */ }
    applyPreference();
  });
  window.addEventListener('pointermove', (event) => {
    if (!motionAllowed() || !finePointer.matches || event.pointerType !== 'mouse') return;
    const bounds = stage && heroVisible ? stage.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    pointerX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / Math.max(1, bounds.width) * 2 - 1));
    pointerY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / Math.max(1, bounds.height) * 2 - 1));
    start();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointerX = pointerY = 0; start(); });
  window.addEventListener('blur', () => { pointerX = pointerY = 0; });
  window.addEventListener('scroll', () => {
    scrollDepth = Math.min(18, Math.max(0, window.scrollY || 0) * 0.04);
    if (heroVisible) start();
  }, { passive: true });
  if (scene) {
    scene.addEventListener('focusin', () => { if (motionAllowed()) { pointerX = 0.18; pointerY = -0.1; start(); } });
    scene.addEventListener('focusout', () => { pointerX = pointerY = 0; start(); });
  }
  const photo = document.querySelector('[data-cutout-portrait]');
  if (photo && portrait) {
    const showFallback = () => portrait.classList.add('is-unavailable');
    photo.addEventListener('error', showFallback);
    photo.addEventListener('load', () => portrait.classList.remove('is-unavailable'));
    if (photo.complete && !photo.naturalWidth) showFallback();
  }
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
      if (orbitRenderer) { orbitRenderer.resize(); orbitRenderer.draw(elapsed, smoothX, smoothY); }
    });
  }, { passive: true });
  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', applyPreference);
    finePointer.addEventListener('change', () => { resetDepth(); applyPreference(); });
  } else if (typeof reducedMotion.addListener === 'function') {
    reducedMotion.addListener(applyPreference);
  }

  const hero = stage;
  if (hero && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible) start();
    });
    observer.observe(hero);
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
  try { orbitRenderer = createPortraitOrbits(); } catch { orbitRenderer = null; }
  if (renderer) renderer.draw(0, 0, 0);
  if (orbitRenderer) orbitRenderer.draw(0, 0, 0);
  applyPreference();
})();
