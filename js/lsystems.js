/* ============================================================
   Creation Structure — L-Systems: Recursive Growth Grammars
   ============================================================ */

(function () {
  'use strict';

  const svg = document.getElementById('lsystems-svg');

  /* ---- L-System Presets ---- */
  const presets = {
    dragon: {
      axiom: 'FX',
      rules: { X: 'X+YF+', Y: '-FX-Y' },
      angle: 90, startAngle: 0,
      desc: 'Dragon Curve — space‑filling fractal discovered by NASA physicists'
    },
    sierpinski: {
      axiom: 'F-G-G',
      rules: { F: 'F-G+F+G-F', G: 'GG' },
      angle: 120, startAngle: 0,
      desc: 'Sierpiński Arrowhead — triangle fractal approximating the Sierpiński gasket'
    },
    plant1: {
      axiom: 'X',
      rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' },
      angle: 25, startAngle: -90,
      desc: 'Fractal Plant — classic bracketed L‑system modeling herbaceous growth'
    },
    plant2: {
      axiom: 'Y',
      rules: { X: 'X[-FFF][+FFF]FX', Y: 'YFX[+Y][-Y]' },
      angle: 25.7, startAngle: -90,
      desc: 'Bush — stochastic‑style branching with denser foliage'
    },
    koch: {
      axiom: 'F++F++F',
      rules: { F: 'F-F++F-F' },
      angle: 60, startAngle: 0,
      desc: 'Koch Snowflake — one of the earliest fractal curves described (1904)'
    },
    tree: {
      axiom: '0',
      rules: { '1': '11', '0': '1[+0]-0' },
      angle: 45, startAngle: -90,
      desc: 'Pythagoras Tree — binary branching producing the classic square‑based fractal'
    },
    gosper: {
      axiom: 'A',
      rules: { A: 'A-B--B+A++AA+B-', B: '+A-BB--B-A++A+B' },
      angle: 60, startAngle: 0,
      desc: 'Gosper Curve — flowsnake, a space‑filling curve discovered by Bill Gosper'
    }
  };

  /* ---- State ---- */
  let currentPreset = 'plant1';
  let generations = 4;
  let angle = 25;
  let segmentLength = 8;
  let cachedString = '';

  /* ---- L-System String Generation ---- */
  function generateString(axiom, rules, n) {
    let s = axiom;
    while (n-- > 0) {
      let next = '';
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        next += rules[ch] || ch;
      }
      s = next;
    }
    return s;
  }

  /* ---- Turtle Graphics → SVG Path ---- */
  function renderToPath(s, angleDeg, startAngleDeg) {
    const angleRad = (angleDeg * Math.PI) / 180;
    const startRad = (startAngleDeg * Math.PI) / 180;

    // State stack for bracketed L-systems
    const stack = [];
    let x = 0, y = 0;
    let dir = startRad;

    // Bounding box tracking
    let minX = 0, maxX = 0, minY = 0, maxY = 0;

    // Collect segments
    const segments = [];

    function move() {
      const nx = x + segmentLength * Math.cos(dir);
      const ny = y + segmentLength * Math.sin(dir);
      segments.push({ x1: x, y1: y, x2: nx, y2: ny });
      x = nx; y = ny;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }

    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      switch (ch) {
        case 'F':
        case 'G':
        case 'A':
        case 'B':
        case 'X':
        case 'Y':
          // Forward drawing character — check context
          const isDraw = (ch === 'F' || ch === 'G' || ch === 'A' || ch === 'B');
          if (isDraw) move();
          break;
        case 'f':
          x += segmentLength * Math.cos(dir);
          y += segmentLength * Math.sin(dir);
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          break;
        case '+':
          dir += angleRad;
          break;
        case '-':
          dir -= angleRad;
          break;
        case '[':
          stack.push({ x, y, dir });
          break;
        case ']':
          if (stack.length > 0) {
            const state = stack.pop();
            x = state.x;
            y = state.y;
            dir = state.dir;
          }
          break;
        case '|':
          dir += Math.PI;
          break;
        // Ignore other characters (used for non-drawing expansion)
      }
    }

    // Compute viewBox with padding
    const padX = (maxX - minX) * 0.08 || 20;
    const padY = (maxY - minY) * 0.08 || 20;
    const vbX = minX - padX;
    const vbY = minY - padY;
    const vbW = (maxX - minX) + 2 * padX;
    const vbH = (maxY - minY) + 2 * padY;

    // Build SVG path
    let pathD = '';
    for (const seg of segments) {
      pathD += `M${seg.x1.toFixed(2)},${seg.y1.toFixed(2)}L${seg.x2.toFixed(2)},${seg.y2.toFixed(2)}`;
    }

    return { pathD, viewBox: `${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}` };
  }

  /* ---- SVG Rendering ---- */
  function render() {
    const preset = presets[currentPreset];
    const axiom = preset.axiom;
    const rules = preset.rules;
    const useAngle = angle || preset.angle;
    const startAngle = preset.startAngle;

    cachedString = generateString(axiom, rules, generations);

    // Scale segment length based on string length for visual consistency
    const maxSegments = Math.min(cachedString.length, 50000);
    const scaleFactor = Math.max(0.3, Math.min(3.0, 8 / Math.log2(maxSegments + 1)));
    const displayLength = segmentLength * scaleFactor;
    const origLength = segmentLength;
    // Temporarily set for path gen
    const savedLen = segmentLength;
    segmentLength = displayLength;

    const { pathD, viewBox } = renderToPath(cachedString, useAngle, startAngle);
    segmentLength = savedLen;

    svg.setAttribute('viewBox', viewBox);
    svg.innerHTML = `
      <rect x="-10000" y="-10000" width="20000" height="20000" fill="none" />
      <path d="${pathD}" fill="none" stroke="#00d4aa" stroke-width="${Math.max(0.5, displayLength * 0.08)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
        <animate attributeName="stroke-dashoffset" from="100000" to="0" dur="1.5s" fill="freeze" />
      </path>
    `;

    // Update info
    document.getElementById('lsys-axiom').textContent = axiom;
    document.getElementById('lsys-rules').textContent =
      Object.entries(rules).map(([k, v]) => `${k}→${v}`).join(' · ');
    document.getElementById('lsys-strlen').textContent = cachedString.length.toLocaleString();
  }

  /* ---- Controls ---- */
  document.getElementById('lsys-preset').addEventListener('change', function () {
    currentPreset = this.value;
    const preset = presets[currentPreset];
    angle = preset.angle;
    document.getElementById('lsys-angle').value = preset.angle;
    document.getElementById('lsys-angle-val').textContent = preset.angle + '°';
    render();
  });

  document.getElementById('lsys-generations').addEventListener('input', function () {
    generations = parseInt(this.value);
    document.getElementById('lsys-gen-val').textContent = generations;
    render();
  });

  document.getElementById('lsys-angle').addEventListener('input', function () {
    angle = parseInt(this.value);
    document.getElementById('lsys-angle-val').textContent = angle + '°';
    render();
  });

  document.getElementById('lsys-length').addEventListener('input', function () {
    segmentLength = parseInt(this.value);
    document.getElementById('lsys-len-val').textContent = segmentLength;
    render();
  });

  /* ---- Page Visibility ---- */
  window.addEventListener('page-shown', function (e) {
    if (e.detail.page === 'lsystems') {
      render();
    }
  });

  /* ---- Init ---- */
  render();

})();
