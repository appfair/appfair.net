# App Fair curated F-Droid repository

A filtered, re-signed mirror of the official [F-Droid](https://f-droid.org)
catalog, served at **https://appfair.net/repo** — the ~100 apps in
[`allowlist.txt`](allowlist.txt) that are:

1. **Reproducibly built and upstream-signed.** Only apps enrolled in
   F-Droid's [reproducible builds](https://f-droid.org/docs/Reproducible_Builds/)
   pipeline (`Binaries:` / `AllowedAPKSigningKeys:` in
   [fdroiddata](https://gitlab.com/fdroid/fdroiddata) metadata), additionally
   cross-checked so the live index's `preferredSigner` matches the pinned
   upstream certificate. Every APK the catalog points at is signed by its
   original developer, not by F-Droid's build infrastructure.
2. **Relatively popular or well-known** — ranked by GitHub stars of the
   upstream project plus editorial judgment for off-GitHub projects
   (Briar, Öffi, Bitcoin Wallet, …).
3. **Non-controversial** — no VPN/proxy or censorship-circumvention tools,
   no BitTorrent clients, no unauthorized clients for proprietary services
   (YouTube/YT-Music frontends, scraper downloaders, third-party Reddit or
   Bilibili clients, covert-recording tools, and similar are excluded even
   when they meet criteria 1–2).

## How it works

```
f-droid.org/repo/entry.jar ──verify sig + pinned fingerprint──┐
f-droid.org/repo/index-v2.json ──verify sha256 from entry─────┤
                                                              ▼
                     scripts/fdroid-mirror.mjs  (hourly, in CI)
                       · keep only allowlist.txt packages
                       · rewrite repo section: address=appfair.net/repo,
                         mirrors=official f-droid.org mirror pool
                       · timestamp: propagated from upstream (monotonic)
                                                              ▼
                     site/public/repo/{index-v2.json, entry.json}
                                                              ▼
                     scripts/fdroid-sign.sh  (zip + jarsigner, v1 JAR
                       signature, SHA-256 digests, SHA256withRSA)
                                                              ▼
                     site/public/repo/entry.jar  → deployed to GitHub Pages
```

Only the **index** is hosted on appfair.net. The F-Droid client resolves
every file reference (`/org.example_1.apk`, icons, screenshots) against the
repo address *and* the `mirrors` list, falling back across mirrors on 404 —
so binaries are served by the official f-droid.org mirror network while the
client verifies each download against the sha256 recorded in *our signed
index*. Mirrors therefore don't need to be trusted; the trust chain is:

    our entry.jar (signed, cert pinned by client)
      → sha256(index-v2.json) → sha256(every APK/icon)

## One-time setup: signing key

F-Droid clients identify a repo by the SHA-256 fingerprint of its signing
certificate, so the key must be generated once and kept forever (a new key
is a new repo as far as clients are concerned).

```sh
# 1. Generate the keystore (same parameters fdroidserver uses)
export FDROID_KEYSTORE_PASS="$(head -c 32 /dev/urandom | base64)"
keytool -genkeypair -keystore keystore.p12 -alias appfair \
  -keyalg RSA -keysize 4096 -sigalg SHA256withRSA -validity 10000 \
  -storetype pkcs12 -storepass "$FDROID_KEYSTORE_PASS" \
  -dname "CN=appfair.net, OU=F-Droid"

# 2. Store both as GitHub Actions secrets (and back them up somewhere safe —
#    a password manager — before deleting the local files!)
gh secret set FDROID_KEYSTORE_P12_B64 --body "$(base64 -i keystore.p12)"
gh secret set FDROID_KEYSTORE_PASS --body "$FDROID_KEYSTORE_PASS"

# 3. Print the repo fingerprint to publish on the site (SHA-256 of the DER
#    certificate — also echoed by scripts/fdroid-sign.sh on every CI run)
keytool -exportcert -keystore keystore.p12 -alias appfair \
  -storepass "$FDROID_KEYSTORE_PASS" | shasum -a 256
```

Users add the repo in any F-Droid client (v1.16+, 2023) via:

    https://appfair.net/repo?fingerprint=<FINGERPRINT-UPPERCASE-HEX>

Until the secrets are set, CI publishes the index unsigned (no `entry.jar`)
and prints a workflow warning; clients cannot add the repo in that state.

## Curation

`allowlist.txt` is the single source of truth — one package id per line.
To re-derive the candidate pool when revisiting the list:

1. Clone [fdroiddata](https://gitlab.com/fdroid/fdroiddata) and collect
   package ids whose metadata has `Binaries:` or `AllowedAPKSigningKeys:`
   (and no `NoSourceSince`/`Disabled`).
2. Download https://f-droid.org/repo/index-v2.json and keep only candidates
   whose `metadata.preferredSigner` equals one of the pinned
   `AllowedAPKSigningKeys` values — i.e. the *published* APK really is
   upstream-signed today (~1300 apps as of July 2026).
3. Rank by GitHub stars of `sourceCode` (batch GraphQL) and apply the
   exclusion policy above, plus: prefer stable over beta variants, one entry
   per app family, and drop apps not updated in over a year.

`scripts/fdroid-mirror.mjs` warns (but does not fail) when an allowlisted
app disappears from the upstream index — apps do get unpublished or lose
reproducibility, so check the CI logs occasionally and prune.

## Caveats

- **Allowlist-only changes propagate on upstream's schedule.** The repo
  timestamp is propagated from f-droid.org (it must increase strictly
  monotonically, and reusing it keeps runs idempotent), so clients that
  already fetched today's timestamp pick up an allowlist change with the
  next upstream index rotation — normally well under a day.
- **No `index-v1.jar`.** Clients older than F-Droid 1.16 (early 2023) can't
  use this repo.
- **No diffs.** `entry.json` publishes an empty `diffs` map; clients fetch
  the full ~4 MB index on every change, which is fine at this size.
- **appfair.net must stay up.** Clients pin index downloads to the canonical
  address (no mirror fallback for `entry.jar`/`index-v2.json` — only for
  APKs and graphics).
- **F-Droid archives old APKs.** Referenced files rotate into
  https://f-droid.org/archive when superseded; since CI regenerates hourly
  from the current index this only bites if CI stops running for weeks.
