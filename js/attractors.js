/* ============================================================
   Creation Structure — Attractors: Strange Attractors & Chaos
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('attractors-canvas');
  const ctx = canvas.getContext('2d');

  /* ---- State ---- */
  let attractorType = 'clifford';
  let numPoints = 200000;
  let opacity = 0.08;
  let paramA = -1.40, paramB = 1.50, paramC = 0.80, paramD = -1.00;
  let rendering = false;
  let abortFlag = false;

  // Accumulation buffer
  let accCanvas, accCtx;

  /* ---- Resize ---- */
  function resize() {
    const container = document.getElementById('attractors-container');
    const rect = container.getBoundingClientRect();
    const w = Math.max(600, Math.min(1200, Math.floor(rect.width)));
    const h = Math.floor(w * 0.58);
    canvas.width = w;
    canvas.height = h;

    // Accumulation buffer
    accCanvas = document.createElement('canvas');
    accCanvas.width = w;
    accCanvas.height = h;
    accCtx = accCanvas.getContext('2d');
  }

  /* ---- Attractor Functions ---- */
  function stepDeJong(x, y) {
    // x_{n+1} = sin(a * y_n) - cos(b * x_n)
    // y_{n+1} = sin(c * x_n) - cos(d * y_n)
    const nx = Math.sin(paramA * y) - Math.cos(paramB * x);
    const ny = Math.sin(paramC * x) - Math.cos(paramD * y);
    return [nx, ny];
  }

  function stepClifford(x, y) {
    // x_{n+1} = sin(a * y_n) + c * cos(a * x_n)
    // y_{n+1} = sin(b * x_n) + d * cos(b * y_n)
    const nx = Math.sin(paramA * y) + paramC * Math.cos(paramA * x);
    const ny = Math.sin(paramB * x) + paramD * Math.cos(paramB * y);
    return [nx, ny];
  }

  function stepSprott(x, y) {
    // Generalized 2D quadratic map from Sprott-Linz
    const a = paramA, b = paramB, c = paramC, d = paramD;
    const nx = a + b * x + c * x * x + d * x * y + 0.1 * y + 0.05 * y * y;
    const ny = 0.2 + 0.3 * x + 0.4 * x * x + a * x * y + b * y + c * y * y;
    return [nx, ny];
  }

  function stepHenon(x, y) {
    // Hénon map
    const nx = 1 - paramA * x * x + y;
    const ny = paramB * x;
    return [nx, ny];
  }

  function stepIkeda(x, y) {
    // Ikeda map
    const t = 0.4 - 6 / (1 + x * x + y * y);
    const nx = 1 + paramB * (x * Math.cos(t) - y * Math.sin(t));
    const ny = paramB * (x * Math.sin(t) + y * Math.cos(t));
    return [nx, ny];
  }

  function stepLorenz(x, y, z) {
    // Lorenz system (dt ~ 0.005)
    const sigma = 10, rho = 28, beta = 8 / 3;
    const dt = 0.005;
    const dx = sigma * (y - x) * dt;
    const dy = (x * (rho - z) - y) * dt;
    const dz = (x * y - beta * z) * dt;
    return [x + dx, y + dy, z + dz];
  }

  /* ---- Color Mapping ---- */
  // Map a point's progression through the attractor to color
  function lerpColor(ratio) {
    // Gradient: deep blue → teal → gold → deep red → dark blue
    const stops = [
      [0.0,   [8,   8,   60]],
      [0.25,  [0,   180, 160]],
      [0.5,   [240, 200, 60]],
      [0.75,  [220, 60,  40]],
      [1.0,   [40,  10,  80]]
    ];

    let prev = stops[0];
    for (let i = 1; i < stops.length; i++) {
      if (ratio <= stops[i][0]) {
        const f = (ratio - prev[0]) / (stops[i][0] - prev[0]);
        return [
          Math.round(prev[1][0] + (stops[i][1][0] - prev[1][0]) * f),
          Math.round(prev[1][1] + (stops[i][1][1] - prev[1][1]) * f),
          Math.round(prev[1][2] + (stops[i][1][2] - prev[1][2]) * f)
        ];
      }
      prev = stops[i];
    }
    return stops[stops.length - 1][1];
  }

  /* ---- Render Attractor ---- */
  function render() {
    if (rendering) {
      abortFlag = true;
      setTimeout(render, 50);
      return;
    }

    rendering = true;
    abortFlag = false;
    resize();

    const w = canvas.width;
    const h = canvas.height;

    // Clear accumulation buffer
    accCtx.fillStyle = 'rgba(8, 8, 12, 1)';
    accCtx.fillRect(0, 0, w, h);

    const alpha = opacity;

    // Find bounds by doing a few thousand preliminary iterations
    let x = Math.random() * 2 - 1;
    let y = Math.random() * 2 - 1;
    let z = Math.random() * 2 - 1;

    const preIter = 5000;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    // Quick preliminary survey
    for (let i = 0; i < preIter; i++) {
      switch (attractorType) {
        case 'dejong':  [x, y] = stepDeJong(x, y); break;
        case 'clifford': [x, y] = stepClifford(x, y); break;
        case 'sprott':   [x, y] = stepSprott(x, y); break;
        case 'henon':    [x, y] = stepHenon(x, y); break;
        case 'iked':     [x, y] = stepIkeda(x, y); break;
        case 'lorenz':   [x, y, z] = stepLorenz(x, y, z); break;
      }
      if (i > 500) { // Skip transient
        if (attractorType === 'lorenz') {
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, z); maxY = Math.max(maxY, z);
        } else {
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    }

    // Handle degenerate bounds
    if (minX === maxX) { minX -= 1; maxX += 1; }
    if (minY === maxY) { minY -= 1; maxY += 1; }

    const padX = (maxX - minX) * 0.05;
    const padY = (maxY - minY) * 0.05;
    minX -= padX; maxX += padX;
    minY -= padY; maxY += padY;

    // Render function uses chunking for responsiveness
    const chunkSize = 20000;
    let pointIdx = 0;

    function renderChunk() {
      if (abortFlag) {
        rendering = false;
        return;
      }

      const chunkEnd = Math.min(pointIdx + chunkSize, numPoints);
      const imageData = accCtx.createImageData(w, h);
      const data = imageData.data;

      for (let i = pointIdx; i < chunkEnd; i++) {
        switch (attractorType) {
          case 'dejong':  [x, y] = stepDeJong(x, y); break;
          case 'clifford': [x, y] = stepClifford(x, y); break;
          case 'sprott':   [x, y] = stepSprott(x, y); break;
          case 'henon':    [x, y] = stepHenon(x, y); break;
          case 'iked':     [x, y] = stepIkeda(x, y); break;
          case 'lorenz':   [x, y, z] = stepLorenz(x, y, z); break;
        }

        let px, py;
        if (attractorType === 'lorenz') {
          px = ((x - minX) / (maxX - minX)) * w;
          py = ((z - minY) / (maxY - minY)) * h;
        } else {
          px = ((x - minX) / (maxX - minX)) * w;
          py = ((y - minY) / (maxY - minY)) * h;
        }

        if (px >= 0 && px < w && py >= 0 && py < h) {
          const ratio = i / numPoints;
          const [cr, cg, cb] = lerpColor(ratio);
          const idx = (Math.floor(py) * w + Math.floor(px)) * 4;

          // Additive blending to accumulation buffer
          data[idx] = Math.min(255, data[idx] + cr * alpha);
          data[idx + 1] = Math.min(255, data[idx + 1] + cg * alpha);
          data[idx + 2] = Math.min(255, data[idx + 2] + cb * alpha);
          data[idx + 3] = 255;
        }
      }

      // Composite onto accumulation canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.putImageData(imageData, 0, 0);
      accCtx.globalCompositeOperation = 'lighter';
      accCtx.drawImage(tempCanvas, 0, 0);
      accCtx.globalCompositeOperation = 'source-over';

      pointIdx = chunkEnd;
      document.getElementById('attr-rendered').textContent = pointIdx.toLocaleString();

      if (pointIdx < numPoints) {
        requestAnimationFrame(renderChunk);
      } else {
        // Done — copy to main canvas
        ctx.drawImage(accCanvas, 0, 0);
        rendering = false;
        document.getElementById('attr-rendered').textContent = numPoints.toLocaleString();
      }
    }

    document.getElementById('attr-rendered').textContent = '0';
    document.getElementById('attr-coeffs').textContent =
      `a=${paramA.toFixed(2)} b=${paramB.toFixed(2)} c=${paramC.toFixed(2)} d=${paramD.toFixed(2)}`;
    renderChunk();
  }

  /* ---- Controls ---- */
  document.getElementById('attr-type').addEventListener('change', function () {
    attractorType = this.value;
    // Set sensible defaults per type
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
    document.getElementById('attr-parama-val').textContent = a.toFixed(2);
    document.getElementById('attr-paramb-val').textContent = b.toFixed(2);
    document.getElementById('attr-paramc-val').textContent = c.toFixed(2);
    document.getElementById('attr-paramd-val').textContent = d.toFixed(2);

    // Hide param controls for Lorenz (uses fixed params)
    const showParams = attractorType !== 'lorenz';
    document.getElementById('attr-param-controls').style.display = showParams ? 'flex' : 'none';

    render();
  });

  document.getElementById('attr-points').addEventListener('change', function () {
    numPoints = parseInt(this.value);
    render();
  });

  document.getElementById('attr-opacity').addEventListener('input', function () {
    opacity = parseInt(this.value) / 100;
    document.getElementById('attr-opacity-val').textContent = opacity.toFixed(2);
    render();
  });

  const paramSliders = ['a', 'b', 'c', 'd'];
  paramSliders.forEach(p => {
    document.getElementById('attr-param-' + p).addEventListener('input', function () {
      const val = parseInt(this.value) / 100;
      switch (p) {
        case 'a': paramA = val; break;
        case 'b': paramB = val; break;
        case 'c': paramC = val; break;
        case 'd': paramD = val; break;
      }
      document.getElementById('attr-param' + p + '-val').textContent = val.toFixed(2);
    });
  });

  document.getElementById('attr-regenerate').addEventListener('click', render);

  document.getElementById('attr-randomize').addEventListener('click', function () {
    // Generate random coefficients in a range known to produce interesting attractors
    paramA = (Math.random() * 4 - 2);
    paramB = (Math.random() * 4 - 2);
    paramC = (Math.random() * 2 - 1);
    paramD = (Math.random() * 2 - 1);

    // Quantize to slider precision
    document.getElementById('attr-param-a').value = Math.round(paramA * 100);
    document.getElementById('attr-param-b').value = Math.round(paramB * 100);
    document.getElementById('attr-param-c').value = Math.round(paramC * 100);
    document.getElementById('attr-param-d').value = Math.round(paramD * 100);
    document.getElementById('attr-parama-val').textContent = paramA.toFixed(2);
    document.getElementById('attr-paramb-val').textContent = paramB.toFixed(2);
    document.getElementById('attr-paramc-val').textContent = paramC.toFixed(2);
    document.getElementById('attr-paramd-val').textContent = paramD.toFixed(2);
    render();
  });

  /* ---- Page Visibility ---- */
  window.addEventListener('page-shown', function (e) {
    if (e.detail.page === 'attractors') {
      render();
    }
  });

  /* ---- Init ---- */
  window.addEventListener('resize', function () {
    // Debounce resize
    clearTimeout(window._attrResizeTimeout);
    window._attrResizeTimeout = setTimeout(render, 300);
  });
  resize();
  render();

})();
