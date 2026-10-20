#!/usr/bin/env bash
# One-off, local: copy public-facing paper material from the private survey repo.
# Requires: gh (authenticated with access), poppler (pdftocairo).
set -euo pipefail
REPO="QingyueJ-nd/Multimodal-Agent-Memory-Survey-Arxiv"
OUT="$(cd "$(dirname "$0")/.." && pwd)/vendor/paper"
mkdir -p "$OUT/raw" "$OUT/logos"

fetch() { gh api "repos/$REPO/contents/$1" -H "Accept: application/vnd.github.raw" > "$2"; }

for f in main.tex content/frontmatter/affiliations.json content/frontmatter/authors.tex \
         content/frontmatter/institutions.tex content/figures/multimodal_memory_lifecycle_tree.tex \
         content/figures/fig_cross_matrix.tex content/tables/representation_bottleneck_tiers.tex \
         data/benchmark_coverage.json data/benchmark_scope_review.json data/line_graph_counts.json \
         content/sections/03_formation_and_representation.tex content/sections/04_memory_management.tex \
         content/sections/05_cross_axis_analysis.tex content/sections/07_evaluation.tex; do
  fetch "$f" "$OUT/raw/$(basename "$f")"
done

for f in multimodal-memory-lifecycle-illustrated.svg embodied-memory-lifecycle-taxonomy.svg \
         memory-management-progression-editable.svg; do
  fetch "content/figures/$f" "$OUT/raw/$f"
done

for name in $(gh api "repos/$REPO/contents/content/figures/logos" --jq '.[].name | select(endswith(".pdf"))'); do
  fetch "content/figures/logos/$name" "$OUT/logos/$name"
  pdftocairo -svg "$OUT/logos/$name" "$OUT/logos/${name%.pdf}.svg" && rm "$OUT/logos/$name"
done
fetch content/figures/logos/SOURCES.json "$OUT/logos/SOURCES.json"
echo "Vendored into $OUT"
