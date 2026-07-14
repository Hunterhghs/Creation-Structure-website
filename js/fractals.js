/* ============================================================
   Creation Structure — Fractals: Mandelbrot & Julia HD Explorer
   Light theme, HD canvas (1520×950), pan & zoom
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('fractals-canvas');
  const ctx = canvas.getContext('2d');

  /* ---- State ---- */
  let fractalType = 'mandelbrot';
  let juliaReal = -0.70, juliaImag = 0.27;
  let maxIter = 128;
  let paletteName = 'plasma';

  // Viewport (complex plane)
  let cx = -0.5, cy = 0.0;
  let scale = 3.0;

  let width, height;
  let isDragging = false;
  let dragStartX, dragStartY, dragStartCx, dragStartCy;

  /* ---- Color Palettes (Light Theme: in-set = warm off-white) ---- */
  const IN_SET = [250, 248, 245]; // warm off-white matching bg

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }

  function paletteInferno(t) {
    const stops = [[0,0,0,4],[0.15,40,10,60],[0.35,140,25,115],[0.55,210,60,70],[0.75,240,130,25],[0.92,252,210,40],[1,252,255,164]];
    return interpStops(stops, t);
  }
  function paletteViridis(t) {
    return [clamp(255*(0.267+0.933*t-2.8*t*t+2.6*t*t*t)), clamp(255*(0.005+1.17*t-0.5*t*t-0.6*t*t*t)), clamp(255*(0.329-1.1*t+1.8*t*t-1.0*t*t*t))];
  }
  function palettePlasma(t) {
    return [clamp(255*(0.050+4.0*t-10.5*t*t+6.5*t*t*t)), clamp(255*(0.030+2.0*t-4.0*t*t+2.0*t*t*t)), clamp(255*(0.530+2.0*t-9.0*t*t+6.5*t*t*t))];
  }
  function paletteMagma(t) {
    return [clamp(255*(0.01+2.5*t-3.8*t*t+1.7*t*t*t)), clamp(255*(0.01+2.0*t-2.8*t*t+1.2*t*t*t)), clamp(255*(0.10+6.0*t-14.0*t*t+8.0*t*t*t))];
  }
  function paletteOcean(t) {
    return [clamp(255*t*t*t), clamp(255*(0.15+0.85*t)), clamp(255*(0.5+0.5*Math.sqrt(t)))];
  }
  function paletteIce(t) {
    return [clamp(255*t*t*t), clamp(255*(0.2+0.7*t)), clamp(255*(0.4+0.6*t))];
  }

  function interpStops(stops, t) {
    let prev = stops[0];
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const f = (t - prev[0]) / (stops[i][0] - prev[0]);
        return [clamp(lerp(prev[1], stops[i][1], f)), clamp(lerp(prev[2], stops[i][2], f)), clamp(lerp(prev[3], stops[i][3], f))];
      }
      prev = stops[i];
    }
    const s = stops[stops.length-1];
    return [s[1], s[2], s[3]];
  }

  function getColor(iter) {
    if (iter === maxIter) return IN_SET;
    const t = Math.sqrt(iter / maxIter);
    const fn = { inferno: paletteInferno, viridis: paletteViridis, magma: paletteMagma, plasma: palettePlasma, ocean: paletteOcean, ice: paletteIce }[paletteName] || palettePlasma;
    return fn(t);
  }

  /* ---- Compute ---- */
  function compute() {
    width = canvas.width;
    height = canvas.height;
    const imageData = ctx.createImageData(width, height);
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
            if (x2 + y2 > 4.0) break;
            y = 2.0 * x * y + y0;
            x = x2 - y2 + x0;
          }
        } else {
          x = x0; y = y0;
          for (iteration = 0; iteration < maxIter; iteration++) {
            const x2 = x * x, y2 = y * y;
            if (x2 + y2 > 4.0) break;
            y = 2.0 * x * y + juliaImag;
            x = x2 - y2 + juliaReal;
          }
        }

        const [r, g, b] = getColor(iteration);
        const idx = (py * width + px) * 4;
        data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    updateInfo();
  }

  function updateInfo() {
    document.getElementById('frac-center').textContent = `(${cx.toFixed(8)}, ${cy.toFixed(8)})`;
    document.getElementById('frac-scale').textContent = scale.toExponential(4);
    document.getElementById('frac-points').textContent = (width * height).toLocaleString();
  }

  /* ---- Pan ---- */
  canvas.addEventListener('mousedown', function(e) {
    isDragging = true;
    dragStartX = e.clientX; dragStartY = e.clientY;
    dragStartCx = cx; dragStartCy = cy;
    canvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    const aspect = width / height;
    cx = dragStartCx - (dx / width) * scale;
    cy = dragStartCy - (dy / height) * (scale / aspect);
    compute();
  });
  window.addEventListener('mouseup', function() {
    isDragging = false;
    canvas.style.cursor = 'crosshair';
  });

  /* ---- Zoom ---- */
  canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.2 : 1 / 1.2;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    const aspect = width / height;

    const xRange = scale;
    const xWorld = cx + (mx - 0.5) * xRange;
    const yWorld = cy + (my - 0.5) * (scale / aspect);

    scale *= factor;
    cx = xWorld - (mx - 0.5) * scale;
    cy = yWorld - (my - 0.5) * (scale / aspect);
    compute();
  });

  /* ---- Touch ---- */
  canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      isDragging = true;
      dragStartX = e.touches[0].clientX; dragStartY = e.touches[0].clientY;
      dragStartCx = cx; dragStartCy = cy;
    }
  });
  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (isDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - dragStartX;
      const dy = e.touches[0].clientY - dragStartY;
      const aspect = width / height;
      cx = dragStartCx - (dx / width) * scale;
      cy = dragStartCy - (dy / height) * (scale / aspect);
      compute();
    }
  }, { passive: false });
  canvas.addEventListener('touchend', function() { isDragging = false; });

  /* ---- Controls ---- */
  document.querySelectorAll('[data-fractal]').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-fractal]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      fractalType = this.dataset.fractal;
      document.getElementById('julia-controls').style.display =
        fractalType === 'julia' ? 'flex' : 'none';
      compute();
    });
  });

  document.getElementById('frac-iterations').addEventListener('input', function() {
    maxIter = parseInt(this.value);
    document.getElementById('frac-iter-val').textContent = maxIter;
    compute();
  });

  document.getElementById('frac-palette').addEventListener('change', function() {
    paletteName = this.value;
    compute();
  });

  document.getElementById('julia-real').addEventListener('input', function() {
    juliaReal = parseInt(this.value) / 100;
    document.getElementById('julia-real-val').textContent = juliaReal.toFixed(2);
    if (fractalType === 'julia') compute();
  });

  document.getElementById('julia-imag').addEventListener('input', function() {
    juliaImag = parseInt(this.value) / 100;
    document.getElementById('julia-imag-val').textContent = juliaImag.toFixed(2);
    if (fractalType === 'julia') compute();
  });

  document.getElementById('frac-reset').addEventListener('click', function() {
    cx = -0.5; cy = 0; scale = 3.0;
    compute();
  });

  /* ---- Page Visibility ---- */
  window.addEventListener('page-shown', function(e) {
    if (e.detail.page === 'fractals') compute();
  });

  /* ---- Init ---- */
  compute();

})();
