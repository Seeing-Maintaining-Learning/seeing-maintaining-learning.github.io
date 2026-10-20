# Plan: Interactive website for "Seeing, Maintaining, and Learning: The Evolution of Multimodal Agent Memory"

## Context
The survey (80 authors, 37 institutions, already on OpenReview `5u8ag6LBFH`) needs a public, interactive site. Readers with different backgrounds should be able to quickly understand the field through three perspectives plus modality:
1. **Representation**: what form stored memory takes.
2. **Formation**: how raw multimodal experience becomes stored content.
3. **Management**: the T1 Static → T2 Dynamic → T3 Self-Evolving tiers.
4. **Modalities**: image, video/streaming, audio/speech, GUI, embodied/3D, used as a cross-cutting lens.

Style references are aisafetyhot.com and personalagenteval.com. What they share:
- Motion is driven by real data and answers the pointer.
- Visuals are hand-built in SVG or Canvas.
- Motion runs only while visible and respects reduced-motion.

Coauthors asked for Google indexability and ranking: robots.txt, sitemap.xml and meta tags. The site must look better than the paper's static figures by rebuilding them as interactive data visualizations.

**Decisions made:**
- Astro static site.
- English only.
- Light and dark themes with a toggle.
- A page for each system and benchmark.
- Hosted at `https://seeing-maintaining-learning.github.io/`. The repo `Seeing-Maintaining-Learning/website` (now public) gets renamed to `seeing-maintaining-learning.github.io`. A custom domain can be added later with a `CNAME` file; GitHub redirects automatically.

## Data sources (verified)
- **Public corpus `Seeing-Maintaining-Learning/multimodal-agent-memory-evolution`.** 297 `architectures/<modality>/*.json` and 82 `benchmarks/**`.
  - Each architecture record has `primary_modality`, `secondary_modalities` and `provenance` (title, authors, date, arXiv/PDF/DOI).
  - `representation_paths[]` has `memory_component`, `leaf` (6 leaves), `storage_indexing` (5 kinds), `retrieval_activation` (5 kinds) and `source_accessibility`, each with page-cited evidence.
  - `t2_operations[]` has 14 operation leaves. `t3_policy_evolution_targets[]` covers write, maintenance and retrieval policy.
  - `derived.highest_management_tier` gives T1 76 / T2 204 / T3 17, which matches the paper.
  - The site fetches this at build time.
- **Private survey repo.** Copied once into the website repo, since it's public content:
  - abstract, author and affiliation lists (`content/frontmatter/affiliations.json`) and institution logos
  - the representative systems per taxonomy leaf (`content/figures/multimodal_memory_lifecycle_tree.tex`)
  - the 4×3 tier × representation counts (`fig_cross_matrix.tex`)
  - the benchmark data (`data/benchmark_coverage.json`, `data/benchmark_scope_review.json`) and the growth counts (`data/line_graph_counts.json`)
  - the SVG sources for the lifecycle figure and the embodied example (Fig. 1 and Fig. 4)
  - the BibTeX entry

## Design
**Concept: "the corpus is the interface".** Every one of the 297 systems is a point. The memorable element is the **hero field**: the points stream in from the five modality edges and settle into the representation layout. A lens switch (Representation · Formation · Management · Modality · Timeline) rearranges the same points with animated transitions. Hovering shows the system's name and tier; clicking opens its page. This is the single orchestrated motion moment; everything else moves only in response to the reader.

**Tokens.** Final hex values will be checked with the dataviz palette validator in both themes.
- **Neutrals.** Light: bg `#F3F5F7`, surface `#FFFFFF`, ink `#16202A`, muted `#5B6672`, rule `#D9DFE5`. Dark: bg `#0E1318`, surface `#151C23`, ink `#E6EBF0`, muted `#93A0AD`.
- **Tier colours (meaningful, used site-wide):**
  - T1 Static: steel `#6B8CB8`
  - T2 Dynamic: teal `#2A9D8F`
  - T3 Self-Evolving: amber `#E0A030`
- **Modalities:** five categorical hues, used only where colour means modality.
- **Type:** Schibsted Grotesk for headings and UI; Source Serif 4 for long reading text (abstract, definitions). Mono only for the BibTeX block.
- **Layout:** left-aligned, max width 1200px, with a sticky top switcher for the sections. Works on mobile down to 360px, with a 16px side margin.

**Pages** (each with its own targeted title and description):
| Route | Content |
|---|---|
| `/` | Hero field, a one-paragraph framing, a "find your way in" index (by question: *What does memory look like?*, *How is experience written?*, *How does memory change?*, *My modality?*), short previews of each perspective, key findings, cite block |
| `/representation` | Interactive taxonomy: 3 families → 6 leaves, plus Hybrid. Each leaf has a definition, its trade-off (fidelity vs. abstraction vs. integration), representative systems from the paper's tree, and corpus counts. A chord view shows which families hybrid systems combine. |
| `/formation` | **Sankey diagram** from modality → representation leaf → storage/indexing → retrieval/activation, with source accessibility as an overlay. Plus a scroll-stepped walkthrough of the household-robot example (paper Fig. 4), from raw observation to memory units to stored forms. |
| `/management` | T1 → T2 → T3 interactive diagram. Under T2, five operation toggles (Update, Consolidation, Revision, Reorganization, Forgetting) animate memory items being added, merged, corrected, regrouped or removed. T3 animates the policy itself changing (M₍t+1₎=U_{π_t}(M_t,x_t), π₍t+1₎=E(π_t,f_t)). The **4×3 tier × representation mosaic** replaces paper Fig. 8. |
| `/modalities` + `/modalities/[m]` | Cumulative growth lines (by modality or by tier, 2023–2026); for each modality, a tier × family matrix plus the matching benchmarks |
| `/systems` | Explorer for all 297 systems with filters (modality, tier, family, leaf, storage, retrieval, T2 operation, T3 target, year) and search. Filter state is kept in the URL. |
| `/systems/[id]` | One page per system: its representation paths, operations and evidence quotes, links to arXiv/PDF, and related systems in the same leaf |
| `/benchmarks` + `/benchmarks/[id]` | Coverage heatmap of 82 benchmarks × 9 capabilities, filterable by modality family; one detail page per benchmark |
| `/paper` | Abstract, the 80 authors (expandable), institution logos, BibTeX copy button, links (OpenReview, GitHub corpus, arXiv when available) |

**Interaction rules** (taken from the reference sites):
- Hovering an item dims its siblings and shows a tooltip.
- Hover effects apply only on devices with a real mouse.
- Animations run only while visible and pause when the tab is hidden.
- `prefers-reduced-motion` shows the final static state, and there's a visible pause button.
- The theme is set before the page paints, so there's no flash.

## Architecture (files)
```
astro.config.mjs        # site: https://seeing-maintaining-learning.github.io, @astrojs/sitemap, @astrojs/svelte
scripts/sync-corpus.ts  # build-time: download corpus tarball → src/data/generated/{systems,benchmarks,aggregates}.json
scripts/vendor-paper.sh # one-off, local (gh): copy abstract/authors/logos/figures/tree/bench JSON from the private repo
src/data/schema.ts      # zod schemas + types for normalized records; vocab label maps (leaf/storage/retrieval/ops)
src/data/paper/         # vendored paper metadata + taxonomy definitions (hand-curated md/json)
src/lib/seo.ts          # title/description/canonical/OG/JSON-LD builders
src/layouts/Base.astro  # head (meta, theme script), nav, footer
src/components/viz/     # Svelte islands: HeroField(canvas), Sankey, TierMosaic, T2OpsDemo, T3PolicyDemo,
                        #   GrowthLines, CoverageHeatmap, TaxonomyTree, Explorer
src/pages/              # routes in the table above; [id] pages via getStaticPaths
public/robots.txt, public/og/*, public/figures/*
.github/workflows/deploy.yml  # build + deploy to Pages on push, weekly cron, and repository_dispatch from corpus repo
```
- **Libraries:** d3-scale, d3-shape, d3-sankey, d3-force (hero layout); hand-written SVG and Canvas, no chart framework.
- **Code rules:** files stay at 200–400 lines; types everywhere; vocabulary labels live in one map.

## SEO infrastructure
- **robots.txt:** `Allow: /` plus `Sitemap: https://seeing-maintaining-learning.github.io/sitemap-index.xml`.
- **Sitemap:** `@astrojs/sitemap` generates it automatically, about 390 URLs with `lastmod`.
- **Per-page head tags:** unique `<title>` (≤60 characters, keyword first, e.g. "Multimodal Agent Memory Survey: T1–T3 Memory Management"), meta description (≤155 characters), canonical URL, Open Graph and Twitter `summary_large_image`, and `theme-color`.
- **JSON-LD structured data:**
  - `ScholarlyArticle` with authors and affiliations on `/` and `/paper`
  - `Dataset` on `/systems` and `/benchmarks`
  - `WebSite` with a search action pointing to `/systems?q=`
  - `BreadcrumbList` on detail pages
  - `TechArticle` / `CreativeWork` on system pages, linking to the original paper
- **Google Scholar meta tags** (`citation_title`, `citation_author`, `citation_publication_date`, `citation_pdf_url`) on `/paper`.
- **Open Graph images:** one designed image per section, made at build time from the actual charts, plus a template image for system pages.
- **Speed and semantics:** static HTML; interactive parts load only when visible; fonts preloaded and subset; a Lighthouse target of SEO 100 and Performance ≥90. Real HTML headings and text exist under every visualization, so crawlers can read the content.
- **After launch** (needs you or your coauthors):
  - Verify the site in Google Search Console (I'll add the verification meta tag), then submit the sitemap; do the same in Bing Webmaster Tools.
  - Put the site URL in the arXiv abstract comments, the paper's first-page footnote, the OpenReview page, both GitHub repos (README and the "Website" field), coauthors' homepages, HF Papers / Papers with Code, and launch posts.

## Execution order
1. Write the spec to `docs/superpowers/specs/2026-10-19-survey-website-design.md` and commit. Then rename the repo with `gh repo rename seeing-maintaining-learning.github.io` and set Pages to deploy from GitHub Actions.
2. Scaffold Astro, the theme/token CSS, the Base layout, the SEO library, robots.txt and the sitemap. Deploy this skeleton early so Google can start crawling.
3. Data: `sync-corpus.ts` plus the schemas, and vendor the paper metadata. Add tests checking that the counts match the paper (297; T1 76 / T2 204 / T3 17; 82 benchmarks).
4. Pages and visualizations, in this order: systems explorer and per-system pages → `/management` (mosaic, T2/T3 demos) → `/formation` (Sankey, walkthrough) → `/representation` → `/modalities` → `/benchmarks` → hero field → `/paper`.
5. Polish: Open Graph images, a screenshot review in both themes on desktop and mobile, an accessibility pass, Lighthouse.
6. Run the code-reviewer agent on the final changes, then deploy.

## Verification
- `npm run build` and `astro check` pass, and vitest data tests pass (counts match the paper; every system page has its tier, leaf and source URL).
- Playwright screenshots at 1440 / 768 / 375 px in light and dark: no horizontal scroll; the reduced-motion snapshot shows the static state.
- Lighthouse CI on `/`, `/formation` and one system page: SEO 100, Accessibility ≥95, Performance ≥90.
- `curl` the deployed `/robots.txt` and `/sitemap-index.xml`; check the JSON-LD with the schema.org validator and Google's Rich Results test; run a broken-link check (lychee) on the built `dist/`.
- Search Console URL inspection confirms the home page is indexable.
