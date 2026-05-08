#!/usr/bin/env node
/**
 * Build the appindex.json artefacts for the App Fair catalog site.
 *
 * The App Fair Project mirrors each app it catalogues as a fork inside the
 * `appfair` GitHub org (e.g. https://github.com/appfair/Net-Skip is a fork
 * of https://github.com/Net-Skip/Net-Skip). The fork's release pipeline is
 * what publishes the canonical appindex.json artefact.
 *
 * This script:
 *   1. Lists every repository in the `appfair` org via the GitHub API.
 *   2. Keeps only the forks (skipping archived / disabled / non-fork repos).
 *   3. Fetches each fork's
 *        https://github.com/appfair/<repo>/releases/latest/download/appindex.json
 *      Forks that haven't published one yet (HTTP 404) are silently skipped.
 *   4. Merges every retrieved `apps[]` entry into a single object.
 *   5. Writes the result to two locations:
 *        - site/appindex.json            (build input for the appland template)
 *        - site/public/appindex.v1.json  (downloadable artefact, served at
 *                                         https://appfair.net/appindex.v1.json)
 *
 * Usage:
 *   node scripts/aggregate.mjs
 *
 * Environment:
 *   GITHUB_TOKEN   (optional)  Bearer token for higher rate limits.
 *   AGGREGATE_ORG  (optional)  Override the GitHub org (default: appfair).
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORG = process.env.AGGREGATE_ORG ?? 'appfair';
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');

// Two output paths, same content:
//   - the build input the appland template reads via siteinfo.appindex
//   - the publicly downloadable copy that ships in site/public/ (and so
//     ends up at https://appfair.net/appindex.v1.json after Astro builds).
const BUILD_INPUT_PATH = resolve(REPO_ROOT, 'site', 'appindex.json');
const PUBLIC_OUTPUT_PATH = resolve(
  REPO_ROOT,
  'site',
  'public',
  'appindex.v1.json',
);

const GH_TOKEN = process.env.GITHUB_TOKEN;
const API_HEADERS = {
  accept: 'application/vnd.github+json',
  'user-agent': 'appfair-aggregator',
  ...(GH_TOKEN ? { authorization: `Bearer ${GH_TOKEN}` } : {}),
};

/** Returns the names of every active fork inside the org. */
async function listForks(org) {
  const all = [];
  for (let page = 1; page <= 50; page++) {
    const r = await fetch(
      `https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}&type=public`,
      { headers: API_HEADERS },
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
    .filter((r) => r.fork && !r.archived && !r.disabled)
    .map((r) => r.name);
}

async function fetchAppIndex(org, repo) {
  // GitHub redirects /releases/latest/download/<asset> to the asset blob;
  // missing repo / release / asset all surface as 404.
  const url = `https://github.com/${org}/${repo}/releases/latest/download/appindex.json`;
  const r = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'appfair-aggregator' },
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  const text = await r.text();
  if (!text.trim().startsWith('{')) return null;
  return JSON.parse(text);
}

async function main() {
  console.log(`[aggregate] listing forks in ${ORG}/…`);
  const forks = await listForks(ORG);
  console.log(`[aggregate] ${forks.length} fork(s): ${forks.join(', ') || '(none)'}`);

  // Probe in parallel — most attempts may 404, so this stays cheap.
  const results = await Promise.all(
    forks.map(async (repo) => {
      try {
        const idx = await fetchAppIndex(ORG, repo);
        if (!idx || !Array.isArray(idx.apps) || idx.apps.length === 0) {
          console.warn(`[aggregate] ${repo}: no appindex.json published yet — skipped`);
          return null;
        }
        return { repo, idx };
      } catch (err) {
        console.warn(`[aggregate] ${repo}: ${err.message}`);
        return null;
      }
    }),
  );

  const merged = {
    $schema: 'https://appfair.org/schemas/appindex/v1.json',
    specVersion: '1',
    generated: new Date().toISOString(),
    generator: `appfair.net (${ORG})`,
    apps: [],
  };

  for (const r of results) {
    if (!r) continue;
    console.log(`[aggregate] ${r.repo}: ${r.idx.apps.length} app(s)`);
    for (const app of r.idx.apps) {
      // Slug = fork repo name, so /apps/{slug}/ matches the GitHub URL.
      app.name = r.repo;
      merged.apps.push(app);
    }
  }

  if (merged.apps.length === 0) {
    throw new Error(
      `aggregated 0 apps — every fork in ${ORG}/ returned 404 or empty. ` +
        `Refusing to write an empty appindex.json (the appland template ` +
        `rejects it). Forks probed: ${forks.join(', ') || '(none)'}`,
    );
  }

  // De-duplicate by slug (last-wins) and sort for deterministic output.
  const byName = new Map();
  for (const a of merged.apps) byName.set(a.name, a);
  merged.apps = Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const body = JSON.stringify(merged, null, 2) + '\n';
  for (const out of [BUILD_INPUT_PATH, PUBLIC_OUTPUT_PATH]) {
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, body);
    console.log(`[aggregate] wrote ${merged.apps.length} app(s) → ${out}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
