/* ============================================================
   Creation Structure — Emergence: Reaction-Diffusion & CA
   Light theme, framed viz card, HD grid
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('emergence-canvas');
  const ctx = canvas.getContext('2d');

  /* ---- State ---- */
  let simType = 'gray-scott';
  let playing = true;
  let brushSize = 6;
  let mouseDown = false;

  let feedRate = 0.036, killRate = 0.061;
  const Du = 0.16, Dv = 0.08;
  let golFps = 10, golTimer = null;

  let frameCount = 0;
  let gridW, gridH;
  let u, v, golGrid;

  /* ---- Init Grids ---- */
  function resizeGrid() {
    gridW = Math.floor(canvas.width / 3);   // 3px cells ≈ 507 cells for 1520-wide
    gridH = Math.floor(canvas.height / 3);  // ≈ 317 cells for 950-tall
    // Actually use canvas dimensions: 760 × 520 → ~253 × 173 at 3px
    gridW = Math.floor(canvas.width / 2.5);
    gridH = Math.floor(canvas.height / 2.5);
  }

  function initGrids() {
    resizeGrid();
    if (simType === 'gray-scott') {
      u = new Float32Array(gridW * gridH);
      v = new Float32Array(gridW * gridH);
      for (let i = 0; i < gridW * gridH; i++) { u[i] = 1.0; v[i] = 0.0; }
      // Seed center patch
      const cx = Math.floor(gridW / 2), cy = Math.floor(gridH / 2);
      const r = Math.floor(Math.min(gridW, gridH) * 0.08);
      for (let y = cy - r; y < cy + r; y++) {
        for (let x = cx - r; x < cx + r; x++) {
          if (x >= 0 && x < gridW && y >= 0 && y < gridH) {
            const idx = y * gridW + x;
            v[idx] = 0.5 + Math.random() * 0.25;
            u[idx] = 0.4 + Math.random() * 0.3;
          }
        }
      }
    } else {
      golGrid = new Uint8Array(gridW * gridH);
      for (let i = 0; i < gridW * gridH; i++) golGrid[i] = Math.random() > 0.78 ? 1 : 0;
    }
    frameCount = 0;
    document.getElementById('emerge-frame').textContent = '0';
  }

  /* ---- Seed at Mouse ---- */
  function seedAt(mx, my) {
    const rect = canvas.getBoundingClientRect();
    const sx = gridW / rect.width, sy = gridH / rect.height;
    const cx = Math.floor((mx - rect.left) * sx);
    const cy = Math.floor((my - rect.top) * sy);
    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        if (dx*dx + dy*dy > brushSize*brushSize) continue;
        const x = cx+dx, y = cy+dy;
        if (x<0||x>=gridW||y<0||y>=gridH) continue;
        const idx = y*gridW + x;
        if (simType==='gray-scott') {
          v[idx] = 0.5+Math.random()*0.35;
          u[idx] = 0.3+Math.random()*0.4;
        } else { golGrid[idx]=1; }
      }
    }
  }

  /* ---- Gray-Scott Step ---- */
  function gsStep() {
    const nu = new Float32Array(gridW*gridH), nv = new Float32Array(gridW*gridH);
    for (let y=0; y<gridH; y++) {
      for (let x=0; x<gridW; x++) {
        const i = y*gridW+x;
        const xm=(x>0?x-1:gridW-1), xp=(x<gridW-1?x+1:0);
        const ym=(y>0?y-1:gridH-1), yp=(y<gridH-1?y+1:0);
        const lu = u[ym*gridW+x]+u[yp*gridW+x]+u[y*gridW+xm]+u[y*gridW+xp]-4*u[i];
        const lv = v[ym*gridW+x]+v[yp*gridW+x]+v[y*gridW+xm]+v[y*gridW+xp]-4*v[i];
        const uvv = u[i]*v[i]*v[i];
        nu[i] = Math.max(0,Math.min(1, u[i]+Du*lu-uvv+feedRate*(1-u[i])));
        nv[i] = Math.max(0,Math.min(1, v[i]+Dv*lv+uvv-(feedRate+killRate)*v[i]));
      }
    }
    u=nu; v=nv;
  }

  /* ---- GoL Step ---- */
  function golStep() {
    const next = new Uint8Array(gridW*gridH);
    for (let y=0; y<gridH; y++) {
      for (let x=0; x<gridW; x++) {
        const i=y*gridW+x; let n=0;
        for (let dy=-1; dy<=1; dy++)
          for (let dx=-1; dx<=1; dx++) {
            if (dx===0&&dy===0) continue;
            n += golGrid[((y+dy+gridH)%gridH)*gridW+((x+dx+gridW)%gridW)];
          }
        next[i] = golGrid[i]===1 ? (n===2||n===3?1:0) : (n===3?1:0);
      }
    }
    golGrid=next;
  }

  /* ---- Render ---- */
  function renderGrid() {
    // Create image at grid resolution, then scale up
    const offCanvas = document.createElement('canvas');
    offCanvas.width = gridW; offCanvas.height = gridH;
    const octx = offCanvas.getContext('2d');
    const img = octx.createImageData(gridW, gridH);
    const d = img.data;

    for (let i=0; i<gridW*gridH; i++) {
      const i4=i*4;
      if (simType==='gray-scott') {
        // U→blue channel, V→red/green channels, light bg
        d[i4]   = Math.round(v[i]*200 + 40);
        d[i4+1] = Math.round(u[i]*v[i]*140 + 20);
        d[i4+2] = Math.round(u[i]*180 + 20);
        d[i4+3] = 255;
      } else {
        if (golGrid[i]===1) {
          d[i4]=13; d[i4+1]=123; d[i4+2]=110; d[i4+3]=255;
        } else {
          d[i4]=250; d[i4+1]=248; d[i4+2]=245; d[i4+3]=255;
        }
      }
    }
    octx.putImageData(img,0,0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(offCanvas,0,0,canvas.width,canvas.height);
  }

  /* ---- Loop ---- */
  let animId;
  function loop() {
    if (playing && simType==='gray-scott') {
      for (let s=0; s<2; s++) gsStep();
      frameCount++;
      renderGrid();
      document.getElementById('emerge-frame').textContent = frameCount;
      document.getElementById('emerge-pattern').textContent =
        `F=${feedRate.toFixed(3)} k=${killRate.toFixed(3)}`;
    }
    animId = requestAnimationFrame(loop);
  }

  function startGol() { stopGol(); golTimer=setInterval(()=>{
    if (playing && simType==='game-of-life') { golStep(); frameCount++; renderGrid();
    document.getElementById('emerge-frame').textContent=frameCount;
    document.getElementById('emerge-pattern').textContent='Game of Life'; }
  },1000/golFps);}
  function stopGol() { if(golTimer){clearInterval(golTimer);golTimer=null;} }

  /* ---- Mouse ---- */
  canvas.addEventListener('mousedown',e=>{mouseDown=true;seedAt(e.clientX,e.clientY);});
  canvas.addEventListener('mousemove',e=>{if(mouseDown)seedAt(e.clientX,e.clientY);});
  window.addEventListener('mouseup',()=>{mouseDown=false;});
  canvas.addEventListener('wheel',e=>{e.preventDefault(); brushSize=Math.max(1,Math.min(25,brushSize+(e.deltaY>0?-1:1)));});
  canvas.addEventListener('touchstart',e=>{e.preventDefault();mouseDown=true;seedAt(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
  canvas.addEventListener('touchmove',e=>{e.preventDefault();if(mouseDown)seedAt(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
  canvas.addEventListener('touchend',()=>{mouseDown=false;});

  /* ---- Controls ---- */
  document.querySelectorAll('[data-sim]').forEach(btn=>{btn.addEventListener('click',function(){
    document.querySelectorAll('[data-sim]').forEach(b=>b.classList.remove('active'));
    this.classList.add('active');
    simType=this.dataset.sim;
    document.getElementById('gs-controls').style.display=simType==='gray-scott'?'flex':'none';
    document.getElementById('gol-controls').style.display=simType==='game-of-life'?'flex':'none';
    stopGol(); initGrids(); if(simType==='game-of-life')startGol();
  })});

  document.getElementById('gs-feed').addEventListener('input',function(){feedRate=parseInt(this.value)/1000;document.getElementById('gs-feed-val').textContent=feedRate.toFixed(3);});
  document.getElementById('gs-kill').addEventListener('input',function(){killRate=parseInt(this.value)/1000;document.getElementById('gs-kill-val').textContent=killRate.toFixed(3);});
  document.getElementById('gol-speed').addEventListener('input',function(){golFps=parseInt(this.value);document.getElementById('gol-speed-val').textContent=golFps+' fps';stopGol();startGol();});

  document.getElementById('emerge-play').addEventListener('click',function(){playing=!playing;this.textContent=playing?'Pause':'Play';if(playing)this.classList.add('accent');else this.classList.remove('accent');});
  document.getElementById('emerge-reset').addEventListener('click',()=>{stopGol();initGrids();if(simType==='game-of-life')startGol();});
  document.getElementById('emerge-random').addEventListener('click',()=>{
    stopGol();
    if(simType==='gray-scott'){for(let i=0;i<gridW*gridH;i++){u[i]=1;v[i]=0;}
      for(let p=0;p<8;p++){const cx=Math.floor(Math.random()*gridW),cy=Math.floor(Math.random()*gridH),rr=Math.floor(3+Math.random()*10);
        for(let dy=-rr;dy<=rr;dy++)for(let dx=-rr;dx<=rr;dx++){const x=cx+dx,y=cy+dy;if(x>=0&&x<gridW&&y>=0&&y<gridH){const idx=y*gridW+x;v[idx]=Math.random()*0.7;u[idx]=0.3+Math.random()*0.4;}}}
    }else{for(let i=0;i<gridW*gridH;i++)golGrid[i]=Math.random()>0.7?1:0;}
    if(simType==='game-of-life')startGol();
  });

  /* ---- Page ---- */
  window.addEventListener('page-shown',e=>{if(e.detail.page==='emergence'){resizeGrid();initGrids();}});

  /* ---- Init ---- */
  resizeGrid(); initGrids(); loop();

})();
