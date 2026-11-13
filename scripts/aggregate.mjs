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
 *   4b. Adds the iOS alternative app marketplace: for every app appfair.cloud distributes, the
 *      matching entry's `platforms.ios` gets `distribution.adp` (Apple item and version ids, the
 *      package URL on packages.appfair.cloud) and the notarized version, which is what the App
 *      Fair app installs from. The marketplace being unreachable only leaves those fields out.
 *   4c. Rewrites site/public/altstore.json, App Fair's AltStore source: every marketplace app that
 *      appfair-apps' marketplace.yaml marks `altstore: true` gets an AltStore PAL entry for the same
 *      package, beside the file's hand-written entries.
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
 *   MARKETPLACE_API (optional) The marketplace API (default: https://api.appfair.cloud).
 *   MARKETPLACE_YAML (optional) appfair-apps' marketplace.yaml (default: its main branch on GitHub).
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

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

const MARKETPLACE_API = process.env.MARKETPLACE_API ?? 'https://api.appfair.cloud';

// App Fair's AltStore source, served at https://appfair.net/altstore.json: the committed file's
// entries, plus one for each marketplace app appfair-apps' marketplace.yaml marks `altstore: true`.
const ALTSTORE_PATH = resolve(REPO_ROOT, 'site', 'public', 'altstore.json');
const MARKETPLACE_YAML =
  process.env.MARKETPLACE_YAML ??
  'https://raw.githubusercontent.com/appfair/appfair-apps/main/marketplace.yaml';

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

/**
 * Add `distribution.adp` to each app the marketplace distributes. An app is matched by its iOS
 * bundle identifier; one the catalog has no entry for is left out, since a listing needs the
 * entry's title, description and icon.
 */
export function addMarketplace(merged, marketplace) {
  const byBundle = new Map();
  for (const app of merged.apps) {
    const id = app?.platforms?.ios?.bundleIdentifier;
    if (id) byBundle.set(id, app);
  }
  let added = 0;
  for (const m of marketplace?.apps ?? []) {
    const app = byBundle.get(m.bundleId);
    if (!app) {
      console.warn(`[aggregate] marketplace: no catalog entry for ${m.bundleId} — not listed`);
      continue;
    }
    const ios = app.platforms.ios;
    // The notarized version is the one the marketplace installs.
    ios.version = m.shortVersion;
    ios.buildNumber = m.bundleVersion;
    if (m.minimumSystemVersion) ios.minimumSystemVersion = m.minimumSystemVersion;
    const adp = { appleItemId: m.appleItemId, appleVersionId: m.appleVersionId, url: m.url };
    if (m.size > 0) adp.size = m.size;
    if (m.requiredDeviceCapabilities?.length) adp.requiredDeviceCapabilities = m.requiredDeviceCapabilities;
    ios.distribution = { ...(ios.distribution ?? {}), adp };
    added++;
  }
  return added;
}

/** A package path's key in an AltStore `assetURLs`: its file name without the extension. */
function assetKey(path) {
  return path.split('/').pop().replace(/\.[^.]*$/, '');
}

/** `text` with any markup removed, for AltStore's plain-text fields. */
function plain(text) {
  return typeof text === 'string' ? text.replace(/<[^>]+>/g, '').trim() : undefined;
}

/**
 * App Fair's AltStore source: `base` (the source as committed, whose hand-written entries stay),
 * with an entry for every marketplace app whose Apple item id is in `flagged`, replacing any entry
 * with its bundle identifier. Each points AltStore PAL at the package the App Fair marketplace
 * publishes, through `assetURLs`, AltStore's form for packages hosted on GitHub Releases.
 */
export function altStoreSource(base, merged, marketplace, flagged) {
  const byBundle = new Map();
  for (const app of merged.apps) {
    const id = app?.platforms?.ios?.bundleIdentifier;
    if (id) byBundle.set(id, app);
  }
  const apps = [...(base?.apps ?? [])];
  let listed = 0;
  for (const m of marketplace?.apps ?? []) {
    if (!flagged.has(String(m.appleItemId)) || !m.files) continue;
    const app = byBundle.get(m.bundleId);
    if (!app) continue;
    const ios = app.platforms.ios;
    const assets = app.source?.assets ?? '';
    const at = (a) => (a?.location ? new URL(a.location, assets).href : undefined);
    const shots = ios.assets?.screenshots?.en ?? [];
    const assetURLs = Object.fromEntries(Object.entries(m.files).map(([path, url]) => [assetKey(path), url]));
    const entry = {
      name: app.title?.en ?? app.name,
      bundleIdentifier: m.bundleId,
      marketplaceID: String(m.appleItemId),
      developerName: 'The App Fair Project',
      subtitle: plain(ios.subtitle?.en),
      localizedDescription: plain(ios.description?.en),
      iconURL: at(ios.assets?.icon),
      screenshots: shots.map((s) => ({ imageURL: at(s), width: s.width, height: s.height })).filter((s) => s.imageURL),
      versions: [
        {
          version: m.shortVersion,
          buildVersion: m.bundleVersion,
          date: m.date ?? new Date().toISOString(),
          localizedDescription: plain(app.releaseNotes?.en),
          downloadURL: m.files['manifest.json'] ?? `${m.url}manifest.json`,
          assetURLs,
          size: m.size,
          minOSVersion: m.minimumSystemVersion,
        },
      ],
    };
    const i = apps.findIndex((a) => a.bundleIdentifier === m.bundleId);
    if (i >= 0) apps[i] = entry;
    else apps.push(entry);
    listed++;
  }
  return { source: { ...base, apps }, listed };
}

/** The Apple item ids appfair-apps' marketplace.yaml marks `altstore: true`. */
async function fetchAltStoreFlags() {
  try {
    const res = await fetch(MARKETPLACE_YAML, { headers: { 'user-agent': 'appfair-aggregator' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const apps = parse(await res.text())?.apps ?? {};
    return new Set(Object.entries(apps).filter(([, a]) => a?.altstore === true).map(([id]) => String(id)));
  } catch (err) {
    console.warn(`[aggregate] altstore: ${err.message} — the AltStore source keeps its committed entries`);
    return new Set();
  }
}

async function fetchMarketplace() {
  try {
    const res = await fetch(`${MARKETPLACE_API}/v1/catalog`, { headers: { 'user-agent': 'appfair-aggregator' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[aggregate] marketplace: ${err.message} — iOS marketplace fields left out`);
    return null;
  }
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

  const marketplace = await fetchMarketplace();
  if (marketplace) {
    console.log(`[aggregate] marketplace: ${addMarketplace(merged, marketplace)} iOS app(s) installable`);
    const base = JSON.parse(await readFile(ALTSTORE_PATH, 'utf8'));
    const { source, listed } = altStoreSource(base, merged, marketplace, await fetchAltStoreFlags());
    await writeFile(ALTSTORE_PATH, JSON.stringify(source, null, 2) + '\n');
    console.log(`[aggregate] altstore: ${listed} marketplace app(s) in ${ALTSTORE_PATH}`);
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

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
