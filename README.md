# Creation Structure

**Interactive exploration of the mathematics that generates form.**

Fractals · L‑Systems · Emergence · Strange Attractors

---

Built with Canvas 2D, D3.js, Observable Plot, and vanilla JavaScript. Five interactive visualizations in a single-page application with Veles design system (dark mathematical aesthetic).

### Pages

| Tab | Visualization | Tech |
|-----|--------------|------|
| **Fractals** | Mandelbrot/Julia set explorer — pan, zoom, 6 color palettes, iteration control | Canvas pixels |
| **L‑Systems** | 7 presets (Dragon, Sierpiński, Plant, Bush, Koch, Tree, Gosper) — generations, angle, length controls | SVG turtle graphics |
| **Emergence** | Gray‑Scott reaction‑diffusion + Conway's Game of Life — brush seeding, real‑time simulation | Canvas simulation |
| **Attractors** | 6 attractor types (De Jong, Clifford, Sprott‑Linz, Lorenz, Hénon, Ikeda) — up to 1M points | Canvas additive blending |
| **Foundation** | Fractal dimension comparison chart + iteration depth analysis | Observable Plot |

### Deploy

Push to `main`, GitHub Pages deploys automatically via `.github/workflows/pages.yml`.

### Local Dev

Serve the root directory with any static server:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

---

© 2025 [H Heuristics](https://hheuristics.com)
