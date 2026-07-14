/* ============================================================
   Creation Structure — Emergence: Reaction-Diffusion & CA
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('emergence-canvas');
  const ctx = canvas.getContext('2d');

  /* ---- State ---- */
  let simType = 'gray-scott'; // 'gray-scott' | 'game-of-life'
  let playing = true;
  let brushSize = 8;
  let mouseDown = false;

  // Gray-Scott params
  let feedRate = 0.036;
  let killRate = 0.061;
  let Du = 0.16, Dv = 0.08;

  // Game of Life params
  let golFps = 10;
  let golInterval = null;

  let frameCount = 0;

  // Grids
  let gridW, gridH;
  let u, v;   // Gray-Scott
  let golGrid; // Game of Life

  /* ---- Resize ---- */
  function resize() {
    const container = document.getElementById('emergence-container');
    const rect = container.getBoundingClientRect();
    const w = Math.max(400, Math.min(800, Math.floor(rect.width)));
    const h = Math.floor(w * 0.75);
    canvas.width = w;
    canvas.height = h;
    gridW = Math.floor(w / 4);  // 4px cells for performance
    gridH = Math.floor(h / 4);
    initGrids();
  }

  /* ---- Initialize Grids ---- */
  function initGrids() {
    if (simType === 'gray-scott') {
      u = new Float32Array(gridW * gridH);
      v = new Float32Array(gridW * gridH);

      // Fill U with 1.0 (full feed), seed V with random patch
      for (let i = 0; i < gridW * gridH; i++) {
        u[i] = 1.0;
        v[i] = 0.0;
      }

      // Seed a rectangular patch of V in the center
      const cx = Math.floor(gridW / 2);
      const cy = Math.floor(gridH / 2);
      const rw = Math.floor(gridW * 0.15);
      const rh = Math.floor(gridH * 0.15);
      for (let y = cy - rh; y < cy + rh; y++) {
        for (let x = cx - rw; x < cx + rw; x++) {
          if (x >= 0 && x < gridW && y >= 0 && y < gridH) {
            const idx = y * gridW + x;
            v[idx] = 0.5 + Math.random() * 0.2;
            u[idx] = 0.5 + Math.random() * 0.2;
          }
        }
      }
    } else {
      golGrid = new Uint8Array(gridW * gridH);
      // Seed random
      for (let i = 0; i < gridW * gridH; i++) {
        golGrid[i] = Math.random() > 0.75 ? 1 : 0;
      }
    }
    frameCount = 0;
    document.getElementById('emerge-frame').textContent = '0';
  }

  /* ---- Seed Pattern at Position ---- */
  function seedAt(mx, my) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = gridW / rect.width;
    const scaleY = gridH / rect.height;
    const cx = Math.floor((mx - rect.left) * scaleX);
    const cy = Math.floor((my - rect.top) * scaleY);

    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        if (dx * dx + dy * dy > brushSize * brushSize) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 0 || x >= gridW || y < 0 || y >= gridH) continue;
        const idx = y * gridW + x;
        if (simType === 'gray-scott') {
          v[idx] = 0.5 + Math.random() * 0.3;
          u[idx] = 0.3 + Math.random() * 0.4;
        } else {
          golGrid[idx] = 1;
        }
      }
    }
  }

  /* ---- Gray-Scott Step ---- */
  function grayScottStep() {
    const nextU = new Float32Array(gridW * gridH);
    const nextV = new Float32Array(gridW * gridH);

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const idx = y * gridW + x;

        // Laplacian (5-point stencil)
        const xm1 = x > 0 ? x - 1 : gridW - 1;
        const xp1 = x < gridW - 1 ? x + 1 : 0;
        const ym1 = y > 0 ? y - 1 : gridH - 1;
        const yp1 = y < gridH - 1 ? y + 1 : 0;

        const lapU = u[ym1 * gridW + x] + u[yp1 * gridW + x] + u[y * gridW + xm1] + u[y * gridW + xp1] - 4 * u[idx];
        const lapV = v[ym1 * gridW + x] + v[yp1 * gridW + x] + v[y * gridW + xm1] + v[y * gridW + xp1] - 4 * v[idx];

        const uvv = u[idx] * v[idx] * v[idx];
        nextU[idx] = u[idx] + Du * lapU - uvv + feedRate * (1 - u[idx]);
        nextV[idx] = v[idx] + Dv * lapV + uvv - (feedRate + killRate) * v[idx];

        // Clamp
        nextU[idx] = Math.max(0, Math.min(1, nextU[idx]));
        nextV[idx] = Math.max(0, Math.min(1, nextV[idx]));
      }
    }

    u = nextU;
    v = nextV;
  }

  /* ---- Game of Life Step ---- */
  function gameOfLifeStep() {
    const next = new Uint8Array(gridW * gridH);
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const idx = y * gridW + x;
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = (x + dx + gridW) % gridW;
            const ny = (y + dy + gridH) % gridH;
            neighbors += golGrid[ny * gridW + nx];
          }
        }
        if (golGrid[idx] === 1) {
          next[idx] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
        } else {
          next[idx] = (neighbors === 3) ? 1 : 0;
        }
      }
    }
    golGrid = next;
  }

  /* ---- Render ---- */
  function renderGrid() {
    const imageData = ctx.createImageData(gridW, gridH);
    const data = imageData.data;

    if (simType === 'gray-scott') {
      for (let i = 0; i < gridW * gridH; i++) {
        const idx4 = i * 4;
        // Map U to blue, V to red/green
        const r = Math.round(v[i] * 255);
        const g = Math.round(u[i] * v[i] * 180);
        const b = Math.round(u[i] * 255);
        data[idx4] = r;
        data[idx4 + 1] = g;
        data[idx4 + 2] = b;
        data[idx4 + 3] = 255;
      }
    } else {
      for (let i = 0; i < gridW * gridH; i++) {
        const idx4 = i * 4;
        if (golGrid[i] === 1) {
          data[idx4] = 0;
          data[idx4 + 1] = 212;
          data[idx4 + 2] = 170;
          data[idx4 + 3] = 255;
        } else {
          data[idx4] = 8;
          data[idx4 + 1] = 8;
          data[idx4 + 2] = 12;
          data[idx4 + 3] = 255;
        }
      }
    }

    // Scale up from grid to canvas
    ctx.imageSmoothingEnabled = false;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = gridW;
    tempCanvas.height = gridH;
    tempCanvas.getContext('2d').putImageData(imageData, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
  }

  /* ---- Animation Loop ---- */
  let animId;
  function loop() {
    if (playing) {
      if (simType === 'gray-scott') {
        // Run 2 steps per frame for speed
        for (let s = 0; s < 2; s++) grayScottStep();
        frameCount++;
        renderGrid();
        document.getElementById('emerge-frame').textContent = frameCount;
        document.getElementById('emerge-pattern').textContent =
          `F=${feedRate.toFixed(3)} k=${killRate.toFixed(3)}`;
      }
    }
    animId = requestAnimationFrame(loop);
  }

  // Game of Life uses its own interval
  function startGolLoop() {
    stopGolLoop();
    golInterval = setInterval(function () {
      if (playing && simType === 'game-of-life') {
        gameOfLifeStep();
        frameCount++;
        renderGrid();
        document.getElementById('emerge-frame').textContent = frameCount;
        document.getElementById('emerge-pattern').textContent = 'Conway\'s Game of Life';
      }
    }, 1000 / golFps);
  }

  function stopGolLoop() {
    if (golInterval) { clearInterval(golInterval); golInterval = null; }
  }

  /* ---- Mouse Interaction ---- */
  canvas.addEventListener('mousedown', function (e) {
    mouseDown = true;
    seedAt(e.clientX, e.clientY);
  });

  canvas.addEventListener('mousemove', function (e) {
    if (mouseDown) seedAt(e.clientX, e.clientY);
    // Show brush cursor size via CSS
  });

  window.addEventListener('mouseup', function () { mouseDown = false; });

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    brushSize = Math.max(1, Math.min(30, brushSize + (e.deltaY > 0 ? -1 : 1)));
  });

  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    mouseDown = true;
    seedAt(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    if (mouseDown) seedAt(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  canvas.addEventListener('touchend', function () { mouseDown = false; });

  /* ---- Controls ---- */
  document.querySelectorAll('[data-sim]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-sim]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      simType = this.dataset.sim;
      document.getElementById('gs-controls').style.display =
        simType === 'gray-scott' ? 'flex' : 'none';
      document.getElementById('gol-controls').style.display =
        simType === 'game-of-life' ? 'flex' : 'none';
      stopGolLoop();
      initGrids();
      if (simType === 'game-of-life') startGolLoop();
    });
  });

  document.getElementById('gs-feed').addEventListener('input', function () {
    feedRate = parseInt(this.value) / 1000;
    document.getElementById('gs-feed-val').textContent = feedRate.toFixed(3);
  });

  document.getElementById('gs-kill').addEventListener('input', function () {
    killRate = parseInt(this.value) / 1000;
    document.getElementById('gs-kill-val').textContent = killRate.toFixed(3);
  });

  document.getElementById('gol-speed').addEventListener('input', function () {
    golFps = parseInt(this.value);
    document.getElementById('gol-speed-val').textContent = golFps + ' fps';
    stopGolLoop();
    startGolLoop();
  });

  document.getElementById('emerge-play').addEventListener('click', function () {
    playing = !playing;
    this.textContent = playing ? 'Pause' : 'Play';
    if (playing) this.classList.add('accent');
    else this.classList.remove('accent');
  });

  document.getElementById('emerge-reset').addEventListener('click', function () {
    stopGolLoop();
    initGrids();
    if (simType === 'game-of-life') startGolLoop();
  });

  document.getElementById('emerge-random').addEventListener('click', function () {
    stopGolLoop();
    if (simType === 'gray-scott') {
      // Random seed
      for (let i = 0; i < gridW * gridH; i++) {
        u[i] = 1.0;
        v[i] = 0.0;
      }
      // Multiple random patches
      for (let p = 0; p < 8; p++) {
        const cx = Math.floor(Math.random() * gridW);
        const cy = Math.floor(Math.random() * gridH);
        const rr = Math.floor(3 + Math.random() * 10);
        for (let dy = -rr; dy <= rr; dy++) {
          for (let dx = -rr; dx <= rr; dx++) {
            const x = cx + dx, y = cy + dy;
            if (x >= 0 && x < gridW && y >= 0 && y < gridH) {
              const idx = y * gridW + x;
              v[idx] = Math.random() * 0.7;
              u[idx] = 0.3 + Math.random() * 0.4;
            }
          }
        }
      }
    } else {
      for (let i = 0; i < gridW * gridH; i++) {
        golGrid[i] = Math.random() > 0.7 ? 1 : 0;
      }
      initGrids();
    }
    if (simType === 'game-of-life') startGolLoop();
  });

  /* ---- Page Visibility ---- */
  window.addEventListener('page-shown', function (e) {
    if (e.detail.page === 'emergence') {
      resize();
    }
  });

  /* ---- Init ---- */
  window.addEventListener('resize', resize);
  resize();
  initGrids();
  startGolLoop(); // Won't run since current sim is gray-scott
  loop();

})();
