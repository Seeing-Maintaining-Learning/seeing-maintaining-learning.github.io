# Multimodal Agent Memory Survey: website

Interactive companion site for **Seeing, Maintaining, and Learning: The Evolution of Multimodal Agent Memory**.
Live at <https://seeing-maintaining-learning.github.io/>.

## How it works

- **Astro** static site with **Svelte** islands for the interactive visualizations (hand-built SVG/Canvas with d3 helpers).
- **Data** comes from the public corpus
  [`multimodal-agent-memory-evolution`](https://github.com/Seeing-Maintaining-Learning/multimodal-agent-memory-evolution).
  `npm run sync` downloads it and writes normalized JSON to `src/data/generated/` (not committed).
- Paper metadata and Table 2 benchmark coverage are vendored in `vendor/paper/raw/` (see `scripts/vendor-paper.sh`).
- Tests in `tests/` check that the synced data reproduces the paper's numbers (297 systems; T1 76 / T2 204 / T3 17; the 4×3 matrix; 82 benchmarks).

## Develop

```bash
npm ci
npm run sync      # fetch the corpus
npm test          # data checks
npm run dev       # http://localhost:4321
npm run build     # sync + static build into dist/
```

Helpers: `node scripts/shot.mjs <outDir> /path/` takes screenshots of a running preview; `node scripts/og.mjs`
regenerates the social preview images in `public/og/`.

## Deploy

Pushing to `main` deploys via GitHub Actions (`.github/workflows/deploy.yml`). The site also rebuilds weekly, on manual
dispatch, and on a `corpus-updated` repository dispatch, so corpus changes appear without code changes.

## Search engines

- `robots.txt` and `sitemap-index.xml` are served from the domain root.
- Each page has its own title, description, canonical URL, Open Graph image, and JSON-LD.
- To verify Google Search Console with a meta tag, set the repository variable `PUBLIC_GOOGLE_SITE_VERIFICATION`
  (passed to the build) or use the HTML-file method by adding the file to `public/`.
