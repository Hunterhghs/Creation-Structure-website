# Creation Structure

**Interactive exploration of the mathematics that generates form — from Mandelbrot to reaction-diffusion.**

Five interactive visualizations embedded within a clean, academic website. Light theme, HD rendering, built with Canvas 2D, D3.js, and Observable Plot.

---

### Pages

| Tab | Description | Visualization |
|-----|-------------|--------------|
| **Fractals** | Mandelbrot & Julia set explorer | HD Canvas (1520×950) — pan, zoom, 6 palettes, iteration control |
| **L‑Systems** | Recursive turtle graphics | SVG renderer — 7 presets, animated reveal, generations/angle controls |
| **Emergence** | Gray‑Scott reaction‑diffusion + Game of Life | Canvas simulation — brush seeding, live parameter tuning |
| **Attractors** | Strange attractors (6 types) | Histogram-based HD rendering — up to 1M points, real‑time coefficient sliders |
| **Foundation** | Philosophy & economic connection | Observable Plot charts — fractal dimension comparison, iteration depth analysis |

### Design

- **Light theme** — warm off-white (#fafaf8), teal accent (#0d7b6e), white surface cards
- **Framed visualizations** — each interactive viz lives in a bordered card (max 760px) within the page content
- **HD canvases** — Fractals & Attractors render at 1520×950; Emergence at 760×520
- **Responsive** — mobile/tablet/desktop with nav collapse at 480px
- **Accessible** — skip link, ARIA landmarks, focus-visible, prefers-reduced-motion

### Local Dev

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

### Deploy

Push to `main` — GitHub Pages deploys via `.github/workflows/pages.yml`.

---

© 2025 [H Heuristics](https://hheuristics.com)
