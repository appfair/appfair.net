#!/usr/bin/env node
/**
 * Enumerate every repository in the GitHub `appfair` organization, fetch
 * each one's `appindex.json` from the latest release, and merge the
 * resulting `apps[]` entries into a single `site/appindex.json` suitable for
 * the appland template's multi-app mode.
 *
 * Usage:
 *   node scripts/aggregate.mjs
 *
 * Environment:
 *   GITHUB_TOKEN   (optional)  Bumps the unauthenticated rate limit.
 *   AGGREGATE_ORG  (optional)  Override the GitHub org (default: appfair).
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORG = process.env.AGGREGATE_ORG ?? 'appfair';
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');
const OUTPUT_PATH = resolve(REPO_ROOT, 'site', 'appindex.json');

const GH_TOKEN = process.env.GITHUB_TOKEN;
const HEADERS = {
  'accept': 'application/vnd.github+json',
  'user-agent': 'appfair-aggregator',
  ...(GH_TOKEN ? { 'authorization': `Bearer ${GH_TOKEN}` } : {}),
};

async function listOrgRepos(org) {
  const all = [];
  // Cap at 50 pages (5000 repos) — way beyond any realistic ceiling.
  for (let page = 1; page <= 50; page++) {
    const r = await fetch(
      `https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}&type=public`,
      { headers: HEADERS },
    );
    if (!r.ok) {
      throw new Error(`list ${org}/ repos: HTTP ${r.status} ${r.statusText}`);
    }
    const batch = await r.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all
    .filter((r) => !r.archived && !r.disabled && !r.fork)
    .map((r) => r.name);
}

async function fetchAppIndex(org, repo) {
  // GitHub redirects /releases/latest/download/<asset> to the asset's
  // permanent URL; missing repos / releases / assets all return 404.
  const url = `https://github.com/${org}/${repo}/releases/latest/download/appindex.json`;
  const r = await fetch(url, { redirect: 'follow' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const text = await r.text();
  if (!text.trim().startsWith('{')) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function main() {
  console.log(`[aggregate] enumerating repos in ${ORG}/…`);
  const repos = await listOrgRepos(ORG);
  console.log(`[aggregate] ${repos.length} candidate repo(s)`);

  const merged = {
    $schema: 'https://appfair.org/schemas/appindex/v1.json',
    specVersion: '1',
    generated: new Date().toISOString(),
    generator: `appfair.net (${ORG})`,
    apps: [],
  };

  // Probe in parallel — most attempts will be 404s, so this stays cheap.
  const results = await Promise.all(
    repos.map(async (repo) => {
      try {
        const idx = await fetchAppIndex(ORG, repo);
        if (!idx || !Array.isArray(idx.apps) || idx.apps.length === 0) return null;
        return { repo, idx };
      } catch (err) {
        console.warn(`[aggregate] ${repo}: ${err.message}`);
        return null;
      }
    }),
  );

  for (const r of results) {
    if (!r) continue;
    console.log(`[aggregate] ${r.repo}: ${r.idx.apps.length} app(s)`);
    for (const app of r.idx.apps) {
      // Slug = repo name, so /apps/{slug}/ matches the GitHub repo URL.
      // Most appindexes already use this; the override is defensive.
      app.name = r.repo;
      merged.apps.push(app);
    }
  }

  // De-duplicate by slug (last-wins) and sort for deterministic output.
  const byName = new Map();
  for (const a of merged.apps) byName.set(a.name, a);
  merged.apps = Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(merged, null, 2) + '\n');
  console.log(
    `[aggregate] wrote ${merged.apps.length} app(s) → ${OUTPUT_PATH}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
