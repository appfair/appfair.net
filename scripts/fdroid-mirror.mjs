#!/usr/bin/env node
/**
 * Derive the curated App Fair F-Droid repository index from the official
 * F-Droid catalog.
 *
 * Downloads https://f-droid.org/repo/index-v2.json, keeps only the packages
 * listed in fdroid/allowlist.txt (the curated subset: reproducible-build,
 * upstream-signed, popular, non-controversial apps), rewrites the repo
 * metadata to identify the App Fair repo, and writes:
 *
 *   - site/public/repo/index-v2.json   the filtered index
 *   - site/public/repo/entry.json      unsigned entry describing the index
 *                                      (sha256 + size + timestamp); the CI
 *                                      workflow packages and signs this into
 *                                      entry.jar — see .github/workflows/
 *
 * The APK/icon/screenshot files referenced by the index are NOT mirrored:
 * every file path in index-v2.json is resolved by F-Droid clients relative
 * to the repo address *or any mirror*, so we list the official f-droid.org
 * mirror pool and clients fetch artifacts from there. Because F-Droid
 * verifies every download against the sha256 recorded in the (re-signed)
 * index, the mirrors need not be trusted.
 *
 * Only apps built reproducibly and published with their upstream developer
 * signature are eligible for the allowlist, so every APK this index points
 * at is signed by its author, not by the F-Droid build infrastructure.
 *
 * Integrity: the script fetches upstream's signed entry.jar, verifies its
 * JAR signature and pins the signing certificate to the published f-droid.org
 * fingerprint (jarsigner/keytool, so a JDK must be on PATH), then verifies
 * the downloaded index-v2.json against the sha256 the entry declares.
 *
 * Usage:
 *   node scripts/fdroid-mirror.mjs
 *
 * Environment:
 *   FDROID_REPO_URL  (optional)  Upstream repo base (default https://f-droid.org/repo)
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');
const ALLOWLIST_PATH = resolve(REPO_ROOT, 'fdroid', 'allowlist.txt');
const OUT_DIR = resolve(REPO_ROOT, 'site', 'public', 'repo');

const UPSTREAM = process.env.FDROID_REPO_URL ?? 'https://f-droid.org/repo';

/** Upstream f-droid.org repo signing certificate (SHA-256 fingerprint). */
export const FDROID_FINGERPRINT =
  '43238d512c1e5eb2d6569f4a3afbf5523418b82e0a3ed1552770abb9a9c9ccab';

async function fetchBytes(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'appfair-fdroid-mirror' } });
  if (!r.ok) throw new Error(`GET ${url}: HTTP ${r.status} ${r.statusText}`);
  return Buffer.from(await r.arrayBuffer());
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/**
 * Verify the upstream entry.jar: intact v1 JAR signature AND signing
 * certificate matching the published f-droid.org fingerprint, so a
 * compromised CDN/mirror can't feed us a forged index.
 */
function verifyUpstreamJar(jarPath) {
  // no -strict: it fails on self-signed certs, and F-Droid's repo cert is
  // self-signed by design — identity comes from the fingerprint pin below
  const verify = execFileSync('jarsigner', ['-verify', jarPath], {
    encoding: 'utf8',
  });
  if (!verify.includes('jar verified')) {
    throw new Error(`upstream entry.jar signature not verified:\n${verify}`);
  }
  const certs = execFileSync('keytool', ['-printcert', '-jarfile', jarPath], {
    encoding: 'utf8',
  });
  const fp = certs
    .match(/SHA256:\s*([0-9A-F:]+)/i)?.[1]
    ?.replaceAll(':', '')
    .toLowerCase();
  if (fp !== FDROID_FINGERPRINT) {
    throw new Error(
      `upstream entry.jar signer fingerprint mismatch: got ${fp}, ` +
        `expected ${FDROID_FINGERPRINT}`,
    );
  }
}

/** Parse allowlist.txt: one package id per line, '#' comments allowed. */
async function readAllowlist() {
  const text = await readFile(ALLOWLIST_PATH, 'utf8');
  const pkgs = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*$/, '').trim();
    if (line) pkgs.push(line);
  }
  const dupes = pkgs.filter((p, i) => pkgs.indexOf(p) !== i);
  if (dupes.length) throw new Error(`duplicate allowlist entries: ${dupes.join(', ')}`);
  return pkgs;
}

async function main() {
  const allowlist = await readAllowlist();
  console.log(`[fdroid-mirror] allowlist: ${allowlist.length} package(s)`);

  // The signed entry.jar tells us the authoritative name + sha256 of the
  // current index, which lets us verify the 50+ MB index download.
  console.log(`[fdroid-mirror] fetching ${UPSTREAM}/entry.jar…`);
  const entryJar = await fetchBytes(`${UPSTREAM}/entry.jar`);
  const tmp = await mkdtemp(join(tmpdir(), 'fdroid-mirror-'));
  const jarPath = join(tmp, 'upstream-entry.jar');
  await writeFile(jarPath, entryJar);
  verifyUpstreamJar(jarPath);
  console.log('[fdroid-mirror] upstream entry.jar signature + fingerprint OK');
  const upstreamEntry = JSON.parse(
    execFileSync('unzip', ['-p', jarPath, 'entry.json'], { maxBuffer: 1 << 24 }),
  );
  await rm(tmp, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const indexName = upstreamEntry.index.name.replace(/^\//, '');
  console.log(`[fdroid-mirror] fetching ${UPSTREAM}/${indexName}…`);
  const indexBytes = await fetchBytes(`${UPSTREAM}/${indexName}`);
  if (sha256(indexBytes) !== upstreamEntry.index.sha256) {
    throw new Error('index-v2.json sha256 does not match upstream entry.json');
  }
  const upstream = JSON.parse(indexBytes.toString('utf8'));
  console.log(
    `[fdroid-mirror] upstream: ${Object.keys(upstream.packages).length} packages, ` +
      `timestamp ${upstream.repo.timestamp}`,
  );

  // ---- filter packages -------------------------------------------------
  const packages = {};
  const missing = [];
  for (const pkg of allowlist) {
    if (upstream.packages[pkg]) packages[pkg] = upstream.packages[pkg];
    else missing.push(pkg);
  }
  if (missing.length) {
    // An app can drop out upstream (unpublished, renamed); keep going with a
    // loud warning rather than failing the whole catalog.
    console.warn(`[fdroid-mirror] WARNING: not in upstream index: ${missing.join(', ')}`);
  }
  if (Object.keys(packages).length === 0) {
    throw new Error('filtered index would contain 0 packages — refusing to publish');
  }

  // Keep only the category definitions the filtered apps actually use.
  const usedCategories = new Set(
    Object.values(packages).flatMap((p) => p.metadata.categories ?? []),
  );
  const categories = Object.fromEntries(
    Object.entries(upstream.repo.categories ?? {}).filter(([k]) => usedCategories.has(k)),
  );

  // ---- repo metadata ---------------------------------------------------
  // Canonical address is our repo; the official F-Droid mirror pool serves
  // the APKs/icons (we only host the index). Client resolves every `file`
  // path against address + mirrors and falls back on failure.
  const mirrors = [
    { url: 'https://appfair.net/repo', isPrimary: true },
    ...(upstream.repo.mirrors ?? [])
      .filter((m) => m.url.startsWith('https://'))
      .map(({ url, countryCode }) => (countryCode ? { url, countryCode } : { url })),
  ];

  const repo = {
    name: { 'en-US': 'App Fair F-Droid Catalog' },
    description: {
      'en-US':
        'A curated subset of the official F-Droid catalog: popular apps with ' +
        'reproducible builds, published with their original developer signatures. ' +
        'App binaries are served from the official f-droid.org mirror network.',
    },
    icon: upstream.repo.icon,
    address: 'https://appfair.net/repo',
    mirrors,
    webBaseUrl: upstream.repo.webBaseUrl,
    timestamp: upstream.repo.timestamp,
    antiFeatures: upstream.repo.antiFeatures,
    categories,
    releaseChannels: upstream.repo.releaseChannels,
  };

  const index = { repo, packages };
  const body = Buffer.from(JSON.stringify(index));
  await writeFile(join(OUT_DIR, 'index-v2.json'), body);

  // entry.json: what the client fetches first (inside signed entry.jar).
  // Reuse the upstream timestamp so it is monotonic and re-runs against the
  // same upstream index are byte-identical. No diffs: clients that see an
  // unknown timestamp just fetch the full (small) index.
  const entry = {
    timestamp: upstream.repo.timestamp,
    version: upstreamEntry.version,
    maxAge: upstreamEntry.maxAge,
    index: {
      name: '/index-v2.json',
      sha256: sha256(body),
      size: body.length,
      numPackages: Object.keys(packages).length,
    },
    diffs: {},
  };
  await writeFile(join(OUT_DIR, 'entry.json'), JSON.stringify(entry));

  console.log(
    `[fdroid-mirror] wrote ${Object.keys(packages).length} package(s), ` +
      `${(body.length / 1024 / 1024).toFixed(1)} MiB index → ${OUT_DIR}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
