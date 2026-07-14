/* ============================================================
   Creation Structure — Strange Attractors: HD Interactive
   Histogram-based density rendering for millions of points
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('attractors-canvas');
  const ctx = canvas.getContext('2d');

  /* ---- State ---- */
  let attractorType = 'clifford';
  let numPoints = 300000;
  let paramA = -1.40, paramB = 1.50, paramC = 0.80, paramD = -1.00;
  let rendering = false;
  let abortToken = 0; // Increment to abort current render

  /* ---- Attractor Step Functions ---- */
  function stepDeJong(x, y) {
    const nx = Math.sin(paramA * y) - Math.cos(paramB * x);
    const ny = Math.sin(paramC * x) - Math.cos(paramD * y);
    return [nx, ny];
  }

  function stepClifford(x, y) {
    const nx = Math.sin(paramA * y) + paramC * Math.cos(paramA * x);
    const ny = Math.sin(paramB * x) + paramD * Math.cos(paramB * y);
    return [nx, ny];
  }

  function stepSprott(x, y) {
    const a = paramA, b = paramB, c = paramC, d = paramD;
    const nx = a + b * x + c * x * x + d * x * y + 0.3 * y + 0.05 * y * y;
    const ny = 0.2 + 0.3 * x + 0.4 * x * x + a * x * y + b * y + c * y * y;
    return [nx, ny];
  }

  function stepHenon(x, y) {
    const nx = 1 - 1.4 * x * x + y;
    const ny = 0.3 * x;
    return [nx, ny];
  }

  function stepIkeda(x, y) {
    const t = 0.4 - 6.0 / (1.0 + x * x + y * y);
    const ct = Math.cos(t), st = Math.sin(t);
    const nx = 1.0 + 0.9 * (x * ct - y * st);
    const ny = 0.9 * (x * st + y * ct);
    return [nx, ny];
  }

  function stepLorenz(x, y, z) {
    const sigma = 10.0, rho = 28.0, beta = 8.0 / 3.0;
    const dt = 0.003;
    const dx = sigma * (y - x) * dt;
    const dy = (x * (rho - z) - y) * dt;
    const dz = (x * y - beta * z) * dt;
    return [x + dx, y + dy, z + dz];
  }

  /* ---- Color Mapping ---- */
  // Map log-density to a color. Light theme: dark ink on light background.
  function densityColor(logDensity, maxLog) {
    const t = Math.max(0, Math.min(1, logDensity / Math.max(1, maxLog)));

    if (t < 0.01) return [250, 248, 245, 255]; // bg color — nearly invisible

    // Gradient: pale teal → medium teal → dark teal → charcoal
    // This produces a beautiful ink-wash effect on light background
    const r = Math.round(13 + (30 - 13) * (1 - t));
    const g = Math.round(123 + (30 - 123) * (1 - t));
    const b = Math.round(110 + (30 - 110) * (1 - t));

    // Add some warmth at high density
    const warmR = Math.round(13 + 40 * t * t);
    const warmG = Math.round(123 * (1 - 0.6 * t));
    const warmB = Math.round(110 * (1 - 0.5 * t));

    return [
      Math.round(r * (1 - t * t) + warmR * t * t),
      Math.round(g * (1 - t) + warmG * t),
      Math.round(b * (1 - t) + warmB * t),
      255
    ];
  }

  /* ---- Render with Histogram ---- */
  function render() {
    abortToken++; // Invalidate any in-progress render
    const token = abortToken;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(0, 0, w, h);

    rendering = true;

    // Choose step function
    let stepFn, use3D = false;
    switch (attractorType) {
      case 'dejong':  stepFn = stepDeJong; break;
      case 'clifford': stepFn = stepClifford; break;
      case 'sprott':   stepFn = stepSprott; break;
      case 'henon':    stepFn = stepHenon; break;
      case 'ikon':     stepFn = stepIkeda; break;
      case 'lorenz':   stepFn = stepLorenz; use3D = true; break;
    }

    // ---- Phase 1: Survey to find bounds ----
    let x = Math.random() * 2 - 1;
    let y = Math.random() * 2 - 1;
    let z = Math.random() * 2 - 1;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    const surveyIters = 8000;
    for (let i = 0; i < surveyIters; i++) {
      if (use3D) {
        const [nx, ny, nz] = stepFn(x, y, z);
        x = nx; y = ny; z = nz;
      } else {
        const [nx, ny] = stepFn(x, y);
        x = nx; y = ny;
      }
      if (i > 500) {
        if (use3D) {
          if (isFinite(x)) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
          if (isFinite(z)) { minY = Math.min(minY, z); maxY = Math.max(maxY, z); }
        } else {
          if (isFinite(x)) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
          if (isFinite(y)) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
        }
      }
    }

    // Handle degenerate bounds
    if (!isFinite(minX) || minX === maxX) { minX = -2; maxX = 2; }
    if (!isFinite(minY) || minY === maxY) { minY = -2; maxY = 2; }

    const padX = (maxX - minX) * 0.06 || 0.1;
    const padY = (maxY - minY) * 0.06 || 0.1;
    minX -= padX; maxX += padX;
    minY -= padY; maxY += padY;

    // ---- Phase 2: Histogram accumulation ----
    // Use a histogram array sized to the canvas
    const histW = w;
    const histH = h;
    const histogram = new Uint32Array(histW * histH);

    // Reset starting position
    x = Math.random() * 2 - 1;
    y = Math.random() * 2 - 1;
    z = Math.random() * 2 - 1;

    const skipTransient = 200;

    for (let i = 0; i < numPoints + skipTransient; i++) {
      if (use3D) {
        const [nx, ny, nz] = stepFn(x, y, z);
        x = nx; y = ny; z = nz;
      } else {
        const [nx, ny] = stepFn(x, y);
        x = nx; y = ny;
      }

      if (i < skipTransient) continue;

      // Map to canvas coordinates
      let px, py;
      if (use3D) {
        px = Math.floor(((x - minX) / (maxX - minX)) * histW);
        py = Math.floor(((z - minY) / (maxY - minY)) * histH);
      } else {
        px = Math.floor(((x - minX) / (maxX - minX)) * histW);
        py = Math.floor(((y - minY) / (maxY - minY)) * histH);
      }

      if (px >= 0 && px < histW && py >= 0 && py < histH) {
        const idx = py * histW + px;
        if (histogram[idx] < 4294967295) histogram[idx]++; // prevent overflow
      }

      // Update progress every 50K points
      if (i % 50000 === 0) {
        document.getElementById('attr-rendered').textContent =
          Math.min(i - skipTransient, numPoints).toLocaleString();
      }
    }

    // Check abort
    if (token !== abortToken) { rendering = false; return; }

    // ---- Phase 3: Convert histogram to image ----
    const imageData = ctx.createImageData(histW, histH);
    const data = imageData.data;

    // Find max for normalization
    let maxCount = 0;
    for (let i = 0; i < histogram.length; i++) {
      if (histogram[i] > maxCount) maxCount = histogram[i];
    }
    const maxLog = Math.log(maxCount + 1);

    for (let i = 0; i < histogram.length; i++) {
      const idx4 = i * 4;
      const logVal = Math.log(histogram[i] + 1);
      const [r, g, b, a] = densityColor(logVal, maxLog);
      data[idx4] = r;
      data[idx4 + 1] = g;
      data[idx4 + 2] = b;
      data[idx4 + 3] = a;
    }

    ctx.putImageData(imageData, 0, 0);

    rendering = false;
    document.getElementById('attr-rendered').textContent = numPoints.toLocaleString();
    document.getElementById('attr-coeffs').textContent =
      `a=${paramA.toFixed(2)} b=${paramB.toFixed(2)} c=${paramC.toFixed(2)} d=${paramD.toFixed(2)}`;
  }

  /* ---- Controls ---- */
  document.getElementById('attr-type').addEventListener('change', function () {
    attractorType = this.value;
    const defaults = {
      dejong:  [-2.01, -2.53, 0.33, 2.72],
      clifford: [-1.40, 1.50, 0.80, -1.00],
      sprott:  [-1.20, 0.50, -0.60, 0.10],
      lorenz:  [0, 0, 0, 0],
      henon:   [1.40, 0.30, 0, 0],
      ikon:    [0.90, 0.90, 0, 0]
    };
    const [a, b, c, d] = defaults[attractorType];
    paramA = a; paramB = b; paramC = c; paramD = d;

    document.getElementById('attr-param-a').value = Math.round(a * 100);
    document.getElementById('attr-param-b').value = Math.round(b * 100);
    document.getElementById('attr-param-c').value = Math.round(c * 100);
    document.getElementById('attr-param-d').value = Math.round(d * 100);
    updateParamDisplay();

    const showParams = attractorType !== 'lorenz';
    document.getElementById('attr-param-controls').style.display = showParams ? 'flex' : 'none';

    render();
  });

  function updateParamDisplay() {
    document.getElementById('attr-parama-val').textContent = paramA.toFixed(2);
    document.getElementById('attr-paramb-val').textContent = paramB.toFixed(2);
    document.getElementById('attr-paramc-val').textContent = paramC.toFixed(2);
    document.getElementById('attr-paramd-val').textContent = paramD.toFixed(2);
  }

  ['a', 'b', 'c', 'd'].forEach(p => {
    document.getElementById('attr-param-' + p).addEventListener('input', function () {
      const val = parseInt(this.value) / 100;
      if (p === 'a') paramA = val;
      if (p === 'b') paramB = val;
      if (p === 'c') paramC = val;
      if (p === 'd') paramD = val;
      updateParamDisplay();
      // Real-time parameter update — re-render immediately
      if (!rendering) {
        clearTimeout(window._attrTimeout);
        window._attrTimeout = setTimeout(render, 150);
      }
    });
  });

  document.getElementById('attr-points').addEventListener('change', function () {
    numPoints = parseInt(this.value);
    render();
  });

  document.getElementById('attr-generate').addEventListener('click', render);

  document.getElementById('attr-randomize').addEventListener('click', function () {
    paramA = Math.round((Math.random() * 5 - 2.5) * 100) / 100;
    paramB = Math.round((Math.random() * 5 - 2.5) * 100) / 100;
    paramC = Math.round((Math.random() * 3 - 1.5) * 100) / 100;
    paramD = Math.round((Math.random() * 3 - 1.5) * 100) / 100;

    document.getElementById('attr-param-a').value = Math.round(paramA * 100);
    document.getElementById('attr-param-b').value = Math.round(paramB * 100);
    document.getElementById('attr-param-c').value = Math.round(paramC * 100);
    document.getElementById('attr-param-d').value = Math.round(paramD * 100);
    updateParamDisplay();
    render();
  });

  /* ---- Resize ---- */
  window.addEventListener('resize', function () {
    clearTimeout(window._attrResizeTimeout);
    window._attrResizeTimeout = setTimeout(render, 400);
  });

  /* ---- Page Visibility ---- */
  window.addEventListener('page-shown', function (e) {
    if (e.detail.page === 'attractors') render();
  });

  /* ---- Init ---- */
  render();

})();
