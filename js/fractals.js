/* ============================================================
   Creation Structure — Fractals: Mandelbrot & Julia Explorer
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('fractals-canvas');
  const ctx = canvas.getContext('2d');

  /* ---- State ---- */
  let fractalType = 'mandelbrot'; // 'mandelbrot' | 'julia'
  let juliaReal = -0.7;
  let juliaImag = 0.27;
  let maxIter = 128;
  let paletteName = 'plasma';

  // Viewport (complex plane coordinates)
  let cx = -0.5, cy = 0;   // center
  let scale = 3.0;          // width of view in complex plane

  let width, height;
  let imageData;
  let isDragging = false;
  let dragStartX, dragStartY;
  let dragStartCx, dragStartCy;

  /* ---- Palette Functions (Scientific Color Maps) ---- */
  function lerp(a, b, t) { return a + (b - a) * t; }

  function paletteInferno(t) {
    // Inferno colormap — simplified
    const stops = [
      [0, 0, 0], [0.1, 25, 10, 50], [0.3, 100, 20, 100],
      [0.5, 180, 50, 60], [0.7, 230, 110, 20], [0.9, 250, 200, 30],
      [1, 252, 255, 164]
    ];
    let prev = stops[0];
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const frac = (t - prev[0]) / (stops[i][0] - prev[0]);
        return [
          Math.round(lerp(prev[1], stops[i][1], frac)),
          Math.round(lerp(prev[2], stops[i][2], frac)),
          Math.round(lerp(prev[3], stops[i][3], frac))
        ];
      }
      prev = stops[i];
    }
    return [252, 255, 164];
  }

  function paletteViridis(t) {
    const r = Math.round(255 * (0.267 + 0.933 * t - 2.8 * t * t + 2.6 * t * t * t));
    const g = Math.round(255 * (0.005 + 1.17 * t - 0.5 * t * t - 0.6 * t * t * t));
    const b = Math.round(255 * (0.329 - 1.1 * t + 1.8 * t * t - 1.0 * t * t * t));
    return [Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b))];
  }

  function palettePlasma(t) {
    const r = Math.round(255 * (0.050 + 4.0 * t - 10.5 * t * t + 6.5 * t * t * t));
    const g = Math.round(255 * (0.030 + 2.0 * t - 4.0 * t * t + 2.0 * t * t * t));
    const b = Math.round(255 * (0.530 + 2.0 * t - 9.0 * t * t + 6.5 * t * t * t));
    return [Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b))];
  }

  function paletteMagma(t) {
    const r = Math.round(255 * (0.01 + 2.5 * t - 3.8 * t * t + 1.7 * t * t * t));
    const g = Math.round(255 * (0.01 + 2.0 * t - 2.8 * t * t + 1.2 * t * t * t));
    const b = Math.round(255 * (0.100 + 6.0 * t - 14.0 * t * t + 8.0 * t * t * t));
    return [Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b))];
  }

  function paletteOcean(t) {
    // Deep ocean → teal → cyan → white
    const r = Math.round(255 * Math.pow(t, 2.5));
    const g = Math.round(255 * (0.1 + 0.9 * t));
    const b = Math.round(255 * (0.4 + 0.6 * Math.sqrt(t)));
    return [Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b))];
  }

  function paletteIce(t) {
    // Dark blue → cyan → white
    const r = Math.round(255 * Math.pow(t, 3));
    const g = Math.round(255 * (0.1 + 0.8 * t));
    const b = Math.round(255 * (0.3 + 0.7 * t));
    return [Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b))];
  }

  function getColor(iter, maxIter) {
    if (iter === maxIter) return [0, 0, 0]; // In set: black
    const t = Math.sqrt(iter / maxIter); // Smooth gradient
    const fn = {
      inferno: paletteInferno, viridis: paletteViridis, magma: paletteMagma,
      plasma: palettePlasma, ocean: paletteOcean, ice: paletteIce
    }[paletteName] || palettePlasma;
    return fn(t);
  }

  /* ---- Fractal Computation ---- */
  function computeFractal() {
    width = canvas.width;
    height = canvas.height;
    imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    const aspect = width / height;

    const xMin = cx - scale / 2;
    const xMax = cx + scale / 2;
    const yMin = cy - scale / (2 * aspect);
    const yMax = cy + scale / (2 * aspect);

    const dx = (xMax - xMin) / width;
    const dy = (yMax - yMin) / height;

    for (let py = 0; py < height; py++) {
      const y0 = yMin + py * dy;
      for (let px = 0; px < width; px++) {
        const x0 = xMin + px * dx;

        let x, y, iteration;
        if (fractalType === 'mandelbrot') {
          x = 0; y = 0;
          for (iteration = 0; iteration < maxIter; iteration++) {
            const x2 = x * x, y2 = y * y;
            if (x2 + y2 > 4) break;
            y = 2 * x * y + y0;
            x = x2 - y2 + x0;
          }
        } else {
          // Julia set
          x = x0; y = y0;
          for (iteration = 0; iteration < maxIter; iteration++) {
            const x2 = x * x, y2 = y * y;
            if (x2 + y2 > 4) break;
            y = 2 * x * y + juliaImag;
            x = x2 - y2 + juliaReal;
          }
        }

        const [r, g, b] = getColor(iteration, maxIter);
        const idx = (py * width + px) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    updateInfo();
  }

  /* ---- Info Display ---- */
  function updateInfo() {
    document.getElementById('frac-center').textContent =
      `(${cx.toFixed(8)}, ${cy.toFixed(8)})`;
    document.getElementById('frac-scale').textContent = scale.toExponential(4);
    document.getElementById('frac-points').textContent =
      (width * height).toLocaleString();
  }

  /* ---- Resize Handler ---- */
  function resize() {
    const container = document.getElementById('fractals-container');
    const rect = container.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.max(400, Math.floor(w * 0.58));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      computeFractal();
    }
  }

  /* ---- Interaction: Pan ---- */
  canvas.addEventListener('mousedown', function (e) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartCx = cx;
    dragStartCy = cy;
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    const aspect = width / height;
    cx = dragStartCx - (dx / width) * scale;
    cy = dragStartCy - (dy / height) * (scale / aspect);
    computeFractal();
  });

  window.addEventListener('mouseup', function () {
    if (isDragging) {
      isDragging = false;
      canvas.style.cursor = 'crosshair';
    }
  });

  /* ---- Interaction: Zoom ---- */
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / width;
    const mouseY = (e.clientY - rect.top) / height;
    const aspect = width / height;

    // Zoom toward mouse position
    const xRange = scale;
    const yRange = scale / aspect;
    const mx = cx + (mouseX - 0.5) * xRange;
    const my = cy + (mouseY - 0.5) * yRange;

    scale *= zoomFactor;
    cx = mx - (mouseX - 0.5) * scale;
    cy = my - (mouseY - 0.5) * (scale / aspect);

    computeFractal();
  });

  /* ---- Touch Support ---- */
  canvas.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) {
      isDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      dragStartCx = cx;
      dragStartCy = cy;
    }
  });

  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    if (isDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - dragStartX;
      const dy = e.touches[0].clientY - dragStartY;
      const aspect = width / height;
      cx = dragStartCx - (dx / width) * scale;
      cy = dragStartCy - (dy / height) * (scale / aspect);
      computeFractal();
    }
  }, { passive: false });

  canvas.addEventListener('touchend', function () { isDragging = false; });

  /* ---- Controls ---- */
  document.querySelectorAll('[data-fractal]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-fractal]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      fractalType = this.dataset.fractal;
      document.getElementById('julia-controls').style.display =
        fractalType === 'julia' ? 'flex' : 'none';
      computeFractal();
    });
  });

  document.getElementById('frac-iterations').addEventListener('input', function () {
    maxIter = parseInt(this.value);
    document.getElementById('frac-iter-val').textContent = maxIter;
    computeFractal();
  });

  document.getElementById('frac-palette').addEventListener('change', function () {
    paletteName = this.value;
    computeFractal();
  });

  document.getElementById('julia-real').addEventListener('input', function () {
    juliaReal = parseInt(this.value) / 100;
    document.getElementById('julia-real-val').textContent = juliaReal.toFixed(2);
    if (fractalType === 'julia') computeFractal();
  });

  document.getElementById('julia-imag').addEventListener('input', function () {
    juliaImag = parseInt(this.value) / 100;
    document.getElementById('julia-imag-val').textContent = juliaImag.toFixed(2);
    if (fractalType === 'julia') computeFractal();
  });

  document.getElementById('frac-reset').addEventListener('click', function () {
    cx = -0.5; cy = 0; scale = 3.0;
    computeFractal();
  });

  /* ---- Page Visibility ---- */
  window.addEventListener('page-shown', function (e) {
    if (e.detail.page === 'fractals') {
      resize();
      computeFractal();
    }
  });

  /* ---- Init ---- */
  window.addEventListener('resize', resize);
  resize();
  computeFractal();

})();
