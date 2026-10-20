/**
 * Build-time data sync.
 *
 * Downloads the public corpus (Seeing-Maintaining-Learning/multimodal-agent-memory-evolution),
 * joins benchmark records with the paper's Table 2 coverage, and writes normalized JSON
 * to src/data/generated/. Set CORPUS_DIR to use a local checkout instead of downloading.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { normalizeBenchmark, normalizeSystem } from '../src/data/normalize.ts';

const REPO = 'Seeing-Maintaining-Learning/multimodal-agent-memory-evolution';
const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'src/data/generated');
const VENDOR = join(ROOT, 'vendor/paper/raw');
const LOGOS = join(ROOT, 'public/logos');

async function fetchCorpus(): Promise<{ dir: string; revision: string }> {
  if (process.env.CORPUS_DIR) return { dir: process.env.CORPUS_DIR, revision: 'local' };
  const api = await fetch(`https://api.github.com/repos/${REPO}/commits/main`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });
  if (!api.ok) throw new Error(`GitHub API ${api.status} while resolving corpus revision`);
  const revision = ((await api.json()) as { sha: string }).sha;
  const res = await fetch(`https://codeload.github.com/${REPO}/tar.gz/${revision}`);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const dir = mkdtempSync(join(tmpdir(), 'corpus-'));
  const tarball = join(dir, 'corpus.tgz');
  writeFileSync(tarball, Buffer.from(await res.arrayBuffer()));
  execFileSync('tar', ['-xzf', tarball, '-C', dir, '--strip-components=1']);
  return { dir, revision };
}

function readRecords(dir: string): unknown[] {
  if (!existsSync(dir)) throw new Error(`Missing corpus folder: ${dir}`);
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) =>
      readdirSync(join(dir, d.name))
        .filter((f) => f.endsWith('.json'))
        .map((f) => JSON.parse(readFileSync(join(dir, d.name, f), 'utf8')) as unknown),
    );
}

async function main(): Promise<void> {
  const { dir, revision } = await fetchCorpus();
  const systems = readRecords(join(dir, 'architectures'))
    .map(normalizeSystem)
    .sort((a, b) => a.name.localeCompare(b.name));

  const coverage = JSON.parse(readFileSync(join(VENDOR, 'benchmark_coverage.json'), 'utf8'));
  const scope = JSON.parse(readFileSync(join(VENDOR, 'benchmark_scope_review.json'), 'utf8'));
  const corpusBench = new Map<string, unknown>();
  for (const sub of readdirSync(join(dir, 'benchmarks'))) {
    for (const f of readdirSync(join(dir, 'benchmarks', sub)).filter((x) => x.endsWith('.json'))) {
      corpusBench.set(`benchmarks/${sub}/${f}`, JSON.parse(readFileSync(join(dir, 'benchmarks', sub, f), 'utf8')));
    }
  }
  const scopeByCite = new Map<string, Record<string, unknown>>(
    scope.records.map((r: Record<string, unknown>) => [r.cite as string, r]),
  );
  const benchmarks = coverage.rows
    .map((row: Record<string, unknown>) => {
      const review = scopeByCite.get(row.citation as string);
      const record = review ? corpusBench.get(review.path as string) : undefined;
      return normalizeBenchmark(row, review, record);
    })
    .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

  mkdirSync(LOGOS, { recursive: true });
  const logoDir = join(dir, 'assets/institutions');
  for (const f of existsSync(logoDir) ? readdirSync(logoDir).filter((f) => f.endsWith('.png')) : []) copyFileSync(join(logoDir, f), join(LOGOS, f));

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'systems.json'), JSON.stringify(systems));
  writeFileSync(join(OUT, 'benchmarks.json'), JSON.stringify(benchmarks));
  writeFileSync(
    join(OUT, 'meta.json'),
    JSON.stringify({ corpusRepo: REPO, revision, syncedAt: new Date().toISOString() }, null, 2),
  );
  console.log(`Synced ${systems.length} systems, ${benchmarks.length} benchmarks @ ${revision.slice(0, 7)}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
