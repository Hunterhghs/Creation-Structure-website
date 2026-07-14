/* ============================================================
   Creation Structure — Overview: Spectrum Plot
   ============================================================ */

(function () {
  'use strict';

  function renderOverviewPlot() {
    // Systems positioned on the creation structure spectrum
    const data = [
      { system: 'Crystal Lattice',            complexity: 0.5,  predictability: 0.98, category: 'Static Order' },
      { system: 'Pendulum',                   complexity: 1.2,  predictability: 0.95, category: 'Simple Dynamics' },
      { system: 'Planetary Orbit',            complexity: 1.8,  predictability: 0.90, category: 'Simple Dynamics' },
      { system: 'Wolfram Rule 30',            complexity: 5.5,  predictability: 0.30, category: 'Creation Structure' },
      { system: 'Mandelbrot Set',             complexity: 6.8,  predictability: 0.15, category: 'Creation Structure' },
      { system: 'Fractal Plant (L‑System)',   complexity: 5.0,  predictability: 0.45, category: 'Creation Structure' },
      { system: 'Gray‑Scott (spots)',          complexity: 4.5,  predictability: 0.55, category: 'Creation Structure' },
      { system: 'Clifford Attractor',         complexity: 7.0,  predictability: 0.08, category: 'Creation Structure' },
      { system: 'Urban System (NYC)',         complexity: 5.8,  predictability: 0.25, category: 'Creation Structure' },
      { system: 'Supply Chain Network',       complexity: 5.2,  predictability: 0.35, category: 'Creation Structure' },
      { system: 'Innovation Diffusion',       complexity: 5.5,  predictability: 0.30, category: 'Creation Structure' },
      { system: 'Stock Market (daily)',       complexity: 7.5,  predictability: 0.05, category: 'Chaotic' },
      { system: 'Turbulent Fluid',            complexity: 8.5,  predictability: 0.02, category: 'Chaotic' },
      { system: 'Random Noise',               complexity: 10.0, predictability: 0.00, category: 'Chaotic' },
    ];

    const chart = Plot.plot({
      style: {
        background: 'transparent',
        color: '#1a1a26',
        fontSize: '12px',
        fontFamily: "'Inter', -apple-system, sans-serif",
        maxWidth: '100%'
      },
      height: 380,
      marginLeft: 140,
      marginRight: 40,
      grid: true,
      x: {
        label: '→ Structural Complexity (bits)',
        domain: [0, 10.5]
      },
      y: {
        label: '→ Predictability',
        domain: [0, 1.05],
        tickFormat: d => (d * 100).toFixed(0) + '%'
      },
      color: {
        domain: ['Static Order', 'Simple Dynamics', 'Creation Structure', 'Chaotic'],
        range: ['#9494a5', '#0891b2', '#0d7b6e', '#c2780a'],
        legend: true
      },
      marks: [
        // Background bands
        Plot.rectX([{x1: 0, x2: 3}], { y1: 0, y2: 1.05, fill: '#9494a5', fillOpacity: 0.04 }),
        Plot.rectX([{x1: 3, x2: 7.5}], { y1: 0, y2: 1.05, fill: '#0d7b6e', fillOpacity: 0.05 }),
        Plot.rectX([{x1: 7.5, x2: 10.5}], { y1: 0, y2: 1.05, fill: '#c2780a', fillOpacity: 0.04 }),

        // Region labels
        Plot.text([{x: 1.5, y: 1.02}], { text: ['Static'], fill: '#9494a5', fontSize: 11, fontWeight: 500 }),
        Plot.text([{x: 5.25, y: 1.02}], { text: ['Creation Structure'], fill: '#0d7b6e', fontSize: 11, fontWeight: 600 }),
        Plot.text([{x: 9, y: 1.02}], { text: ['Chaotic'], fill: '#c2780a', fontSize: 11, fontWeight: 500 }),

        // Data points
        Plot.dot(data, {
          x: 'complexity',
          y: 'predictability',
          fill: 'category',
          r: 5,
          stroke: '#fff',
          strokeWidth: 1.5,
          title: d => `${d.system}\nComplexity: ${d.complexity.toFixed(1)}\nPredictability: ${(d.predictability*100).toFixed(0)}%`
        }),

        // Labels
        Plot.text(data.filter(d => d.system === 'Mandelbrot Set'), {
          x: 'complexity', y: 'predictability',
          text: ['Mandelbrot Set'],
          dy: -12, fill: '#1a1a26', fontSize: 11, fontWeight: 500
        }),
        Plot.text(data.filter(d => d.system === 'Urban System (NYC)'), {
          x: 'complexity', y: 'predictability',
          text: ['Urban System'],
          dy: -12, fill: '#1a1a26', fontSize: 11, fontWeight: 500
        }),
        Plot.text(data.filter(d => d.system === 'Stock Market (daily)'), {
          x: 'complexity', y: 'predictability',
          text: ['Stock Market'],
          dy: -12, fill: '#1a1a26', fontSize: 11, fontWeight: 500
        }),
        Plot.text(data.filter(d => d.system === 'Crystal Lattice'), {
          x: 'complexity', y: 'predictability',
          text: ['Crystal'],
          dy: 16, fill: '#1a1a26', fontSize: 11, fontWeight: 500
        }),
      ]
    });

    document.getElementById('overview-plot').appendChild(chart);
  }

  /* ---- Render on visibility ---- */
  let rendered = false;
  window.addEventListener('page-shown', function (e) {
    if (e.detail.page === 'overview' && !rendered) {
      renderOverviewPlot();
      rendered = true;
    }
  });

  if (document.getElementById('page-overview').classList.contains('active')) {
    renderOverviewPlot();
    rendered = true;
  }

})();
