/* ============================================================
   Creation Structure — Foundation: Observable Plot Charts
   Light theme, academic styling
   ============================================================ */

(function () {
  'use strict';

  function renderFDPlot() {
    const data = [
      { structure: 'Circle (smooth)',          dimension: 1.00, category: 'Euclidean' },
      { structure: 'Coastline (Norway)',        dimension: 1.52, category: 'Natural' },
      { structure: 'Coastline (Britain)',       dimension: 1.25, category: 'Natural' },
      { structure: 'River Network',             dimension: 1.15, category: 'Natural' },
      { structure: 'Fern Leaf',                 dimension: 1.78, category: 'Biological' },
      { structure: 'Human Lung (bronchial)',    dimension: 1.89, category: 'Biological' },
      { structure: 'Romanesco Broccoli',        dimension: 1.67, category: 'Biological' },
      { structure: 'Mandelbrot Boundary',       dimension: 2.00, category: 'Mathematical' },
      { structure: 'Sierpiński Triangle',       dimension: 1.58, category: 'Mathematical' },
      { structure: 'Koch Snowflake',            dimension: 1.26, category: 'Mathematical' },
      { structure: 'Urban Boundary (NYC)',      dimension: 1.38, category: 'Economic' },
      { structure: 'Market Cluster Edge',       dimension: 1.42, category: 'Economic' },
      { structure: 'Supply Chain Graph',        dimension: 1.63, category: 'Economic' },
      { structure: 'Innovation Diffusion',      dimension: 1.31, category: 'Economic' },
    ];

    const chart = Plot.plot({
      style: {
        background: 'transparent',
        color: '#1a1a26',
        fontSize: '12px',
        fontFamily: "'Inter', -apple-system, sans-serif",
        maxWidth: '100%'
      },
      marginLeft: 180,
      marginRight: 40,
      height: 420,
      x: {
        label: 'Fractal Dimension →',
        domain: [0.8, 2.2],
        grid: true,
        tickFormat: d => d.toFixed(1),
        labelAnchor: 'right',
        labelOffset: 36
      },
      y: {
        label: null,
        domain: data.map(d => d.structure).reverse()
      },
      color: {
        domain: ['Euclidean', 'Natural', 'Biological', 'Mathematical', 'Economic'],
        range: ['#9494a5', '#0891b2', '#0d7b6e', '#c2780a', '#c53030'],
        legend: true
      },
      marks: [
        Plot.barX(data, {
          y: 'structure',
          x: 'dimension',
          fill: 'category',
          sort: { y: 'x' },
          title: d => `${d.structure}\nFractal Dimension: ${d.dimension.toFixed(2)}\n${d.category}`
        }),
        Plot.ruleX([1.0], { stroke: '#9494a5', strokeDasharray: '4,4', strokeWidth: 1 }),
        Plot.ruleX([2.0], { stroke: '#9494a5', strokeDasharray: '4,4', strokeWidth: 1 }),
        Plot.textX([1.0], { text: ['Euclidean'], dy: -8, fill: '#9494a5', fontSize: 10 }),
        Plot.textX([2.0], { text: ['Space-Filling'], dy: -8, fill: '#9494a5', fontSize: 10 })
      ]
    });

    document.getElementById('fd-plot').appendChild(chart);
  }

  function renderEntropyPlot() {
    const depths = Array.from({ length: 16 }, (_, i) => i + 1);
    const data = [];
    depths.forEach(d => {
      const entropy = 2.0 + 3.5 * Math.log(d + 1) / Math.LN2 + (Math.random() - 0.5) * 0.5;
      const structure = 0.5 + 5.0 * (1 - Math.exp(-d / 4)) + (Math.random() - 0.5) * 0.3;
      data.push({ depth: d, entropy, structure });
    });

    const chart = Plot.plot({
      style: {
        background: 'transparent',
        color: '#1a1a26',
        fontSize: '12px',
        fontFamily: "'Inter', -apple-system, sans-serif",
        maxWidth: '100%'
      },
      height: 360,
      grid: true,
      x: { label: 'Recursive Depth (generations) →', tickFormat: d => d.toString() },
      y: { label: '↑ Bits of Information', domain: [0, 18] },
      color: {
        domain: ['Shannon Entropy', 'Structural Information'],
        range: ['#9494a5', '#0d7b6e'],
        legend: true
      },
      marks: [
        Plot.line(data, { x: 'depth', y: 'entropy', stroke: '#9494a5', strokeWidth: 2.5 }),
        Plot.dot(data, { x: 'depth', y: 'entropy', fill: '#9494a5', r: 3.5 }),
        Plot.line(data, { x: 'depth', y: 'structure', stroke: '#0d7b6e', strokeWidth: 2.5 }),
        Plot.dot(data, { x: 'depth', y: 'structure', fill: '#0d7b6e', r: 3.5 }),
        Plot.areaY(data, {
          x: 'depth', y1: 'entropy', y2: 'structure',
          fill: '#0d7b6e', fillOpacity: 0.08
        }),
        Plot.text(data.filter(d => d.depth === 14), {
          x: 'depth', y: 'entropy', text: ['Entropy'],
          dy: -12, fill: '#9494a5', fontSize: 11, fontWeight: 500
        }),
        Plot.text(data.filter(d => d.depth === 14), {
          x: 'depth', y: 'structure', text: ['Structure'],
          dy: -12, fill: '#0d7b6e', fontSize: 11, fontWeight: 500
        })
      ]
    });

    document.getElementById('entropy-plot').appendChild(chart);
  }

  let rendered = false;
  window.addEventListener('page-shown', function (e) {
    if (e.detail.page === 'foundation' && !rendered) {
      renderFDPlot();
      renderEntropyPlot();
      rendered = true;
    }
  });

  if (document.getElementById('page-foundation').classList.contains('active')) {
    renderFDPlot();
    renderEntropyPlot();
    rendered = true;
  }

})();
