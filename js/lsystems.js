/* ============================================================
   Creation Structure — L‑Systems: Recursive Turtle Graphics
   Rewritten for reliability, HD rendering, and interactivity
   ============================================================ */

(function () {
  'use strict';

  const svgEl = document.getElementById('lsystems-svg');

  /* ---- L‑System Presets ---- */
  const presets = {
    plant1: {
      axiom: 'X',
      rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' },
      angle: 25, startAngle: -85,
      name: 'Fractal Plant',
      desc: 'X→F+[[X]-X]-F[-FX]+X, F→FF'
    },
    dragon: {
      axiom: 'FX',
      rules: { X: 'X+YF+', Y: '-FX-Y' },
      angle: 90, startAngle: 0,
      name: 'Dragon Curve',
      desc: 'X→X+YF+, Y→-FX-Y'
    },
    sierpinski: {
      axiom: 'F-G-G',
      rules: { F: 'F-G+F+G-F', G: 'GG' },
      angle: 120, startAngle: 0,
      name: 'Sierpiński Arrowhead',
      desc: 'F→F-G+F+G-F, G→GG'
    },
    plant2: {
      axiom: 'Y',
      rules: { X: 'X[-FFF][+FFF]FX', Y: 'YFX[+Y][-Y]' },
      angle: 25.7, startAngle: -90,
      name: 'Bush',
      desc: 'X→X[-FFF][+FFF]FX, Y→YFX[+Y][-Y]'
    },
    koch: {
      axiom: 'F++F++F',
      rules: { F: 'F-F++F-F' },
      angle: 60, startAngle: 0,
      name: 'Koch Snowflake',
      desc: 'F→F-F++F-F'
    },
    tree: {
      axiom: '0',
      rules: { '1': '11', '0': '1[+0]-0' },
      angle: 45, startAngle: -90,
      name: 'Pythagoras Tree',
      desc: '1→11, 0→1[+0]-0'
    },
    gosper: {
      axiom: 'A',
      rules: { A: 'A-B--B+A++AA+B-', B: '+A-BB--B-A++A+B' },
      angle: 60, startAngle: 0,
      name: 'Gosper Curve',
      desc: 'A→A-B--B+A++AA+B-, B→+A-BB--B-A++A+B'
    }
  };

  /* ---- Drawing characters: those that produce a line segment ---- */
  const DRAW_CHARS = new Set(['F', 'G', 'A', 'B', '0', '1']);

  /* ---- State ---- */
  let currentPreset = 'plant1';
  let generations = 4;
  let angleDeg = 25;

  /* ---- L‑System Expansion ---- */
  function expand(axiom, rules, n) {
    let s = axiom;
    for (let g = 0; g < n; g++) {
      let next = '';
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        next += rules[ch] || ch;
      }
      s = next;
      // Safety: cap string length to prevent browser freeze
      if (s.length > 200000) break;
    }
    return s;
  }

  /* ---- Turtle → Segments ---- */
  function turtleWalk(s, angleRad, startRad, stepLen) {
    const cos = Math.cos, sin = Math.sin;
    const stack = [];
    let x = 0, y = 0;
    let dir = startRad;

    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    const segments = [];

    for (let i = 0; i < s.length; i++) {
      const ch = s[i];

      if (DRAW_CHARS.has(ch)) {
        // Draw forward
        const nx = x + stepLen * cos(dir);
        const ny = y + stepLen * sin(dir);
        segments.push({ x1: x, y1: y, x2: nx, y2: ny });
        x = nx; y = ny;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;

      } else if (ch === '+') {
        dir += angleRad;
      } else if (ch === '-') {
        dir -= angleRad;
      } else if (ch === '[') {
        stack.push({ x, y, dir });
      } else if (ch === ']') {
        if (stack.length > 0) {
          const state = stack.pop();
          x = state.x; y = state.y; dir = state.dir;
        }
      } else if (ch === '|') {
        dir += Math.PI;
      } else if (ch === 'f') {
        // Move forward without drawing
        x += stepLen * cos(dir);
        y += stepLen * sin(dir);
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      // Characters like X, Y are non-terminals — skip silently
    }

    return { segments, bounds: { minX, maxX, minY, maxY } };
  }

  /* ---- Render to SVG ---- */
  function render() {
    const preset = presets[currentPreset];
    const axiom = preset.axiom;
    const rules = preset.rules;
    const angleRad = (angleDeg * Math.PI) / 180;
    const startRad = (preset.startAngle * Math.PI) / 180;

    // Expand
    const lstring = expand(axiom, rules, generations);

    // Choose step length — scale inversely with complexity
    const estimatedSegments = Math.min(lstring.length, 200000);
    const stepLen = Math.max(0.3, Math.min(15, 12 / Math.log2(estimatedSegments / 100 + 2)));

    // Walk
    const { segments, bounds } = turtleWalk(lstring, angleRad, startRad, stepLen);

    // Compute viewBox with padding
    const bw = bounds.maxX - bounds.minX || 1;
    const bh = bounds.maxY - bounds.minY || 1;
    const pad = Math.max(bw, bh) * 0.1 || 10;
    const vbX = bounds.minX - pad;
    const vbY = bounds.minY - pad;
    const vbW = bw + 2 * pad;
    const vbH = bh + 2 * pad;

    // Build path
    let pathD = '';
    for (const seg of segments) {
      pathD += `M${seg.x1.toFixed(2)} ${seg.y1.toFixed(2)}L${seg.x2.toFixed(2)} ${seg.y2.toFixed(2)}`;
    }

    const strokeW = Math.max(0.3, stepLen * 0.12);
    const pathLen = segments.length; // rough

    svgEl.setAttribute('viewBox', `${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`);

    svgEl.innerHTML = `
      <rect x="${vbX - 100}" y="${vbY - 100}" width="${vbW + 200}" height="${vbH + 200}" fill="#fafaf8" />
      <path d="${pathD}"
            fill="none"
            stroke="#0d7b6e"
            stroke-width="${strokeW}"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.85"
            stroke-dasharray="${pathLen * stepLen}"
            stroke-dashoffset="${pathLen * stepLen}">
        <animate attributeName="stroke-dashoffset"
                 from="${pathLen * stepLen}" to="0"
                 dur="0.6s" fill="freeze" />
      </path>
    `;

    // Update info bar
    document.getElementById('lsys-axiom').textContent = axiom;
    document.getElementById('lsys-rules').textContent = preset.desc;
    document.getElementById('lsys-strlen').textContent = lstring.length.toLocaleString();
  }

  /* ---- Controls ---- */
  document.getElementById('lsys-preset').addEventListener('change', function () {
    currentPreset = this.value;
    const preset = presets[currentPreset];
    angleDeg = preset.angle;
    document.getElementById('lsys-angle').value = preset.angle;
    document.getElementById('lsys-angle-val').textContent = preset.angle + '°';
    // Cap generations for complex presets
    const maxGen = (currentPreset === 'plant2' || currentPreset === 'dragon') ? 6 : 7;
    document.getElementById('lsys-generations').max = maxGen;
    if (generations > maxGen) {
      generations = maxGen;
      document.getElementById('lsys-generations').value = maxGen;
      document.getElementById('lsys-gen-val').textContent = maxGen;
    }
    render();
  });

  document.getElementById('lsys-generations').addEventListener('input', function () {
    generations = parseInt(this.value);
    document.getElementById('lsys-gen-val').textContent = generations;
    render();
  });

  document.getElementById('lsys-angle').addEventListener('input', function () {
    angleDeg = parseInt(this.value);
    document.getElementById('lsys-angle-val').textContent = angleDeg + '°';
    // Don't auto-rerender — user clicks Draw
  });

  document.getElementById('lsys-redraw').addEventListener('click', render);

  /* ---- Page Visibility ---- */
  window.addEventListener('page-shown', function (e) {
    if (e.detail.page === 'lsystems') render();
  });

  /* ---- Init ---- */
  render();

})();
