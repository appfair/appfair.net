# appfair.net

The App Fair Project catalog site. Aggregates every published app in the
[`appfair`](https://github.com/appfair) GitHub org into a single landing
page, with a per-app sub-page for each one — generated from the appindex.json
that each app's release pipeline ships.

## How it works

1. `scripts/aggregate.mjs` lists every repository in the
   [`appfair`](https://github.com/appfair) GitHub org via the API, keeps
   only the **forks** (which is how App Fair catalogues each app — e.g.
   [`appfair/Net-Skip`](https://github.com/appfair/Net-Skip) is a fork of
   [`Net-Skip/Net-Skip`](https://github.com/Net-Skip/Net-Skip)), fetches
   `https://github.com/appfair/<repo>/releases/latest/download/appindex.json`
   from each, and merges them. The result is written to two places:
   - `site/appindex.json` — build input for the appland template
     (multi-app mode).
   - `site/public/appindex.v1.json` — copy that ships with the static
     site, downloadable from
     <https://appfair.net/appindex.v1.json>.

   Forks whose latest release doesn't yet publish an appindex.json are
   silently skipped.
2. The [`appfair/appland`](https://github.com/appfair/appland) Astro template
   is checked out into `site/appland`.
3. `astro build` reads `site/siteinfo.yaml` and `site/appindex.json` and
   emits a localized landing page at `/{locale}/` plus per-app pages at
   `/{locale}/apps/{repo}/`.
4. `.github/workflows/aggregate.yml` runs the above hourly on a cron.

## Layout

```
appfair.net/
├── .github/workflows/aggregate.yml   # hourly poll + build + deploy
├── scripts/aggregate.mjs             # GH org → site/appindex.json
└── site/
    ├── siteinfo.yaml                 # template config (title, host, etc.)
    ├── public/                       # static files copied into the build
    │   └── appindex.v1.json          # generated copy — served at /appindex.v1.json
    ├── appindex.json                 # generated build input; gitignored
    └── appland/                      # template; gitignored, fetched in CI
```

## Local development

```sh
# 1. Aggregate the catalog (writes site/appindex.json)
node scripts/aggregate.mjs

# 2. Vendor the template
git clone https://github.com/appfair/appland site/appland

# 3. Run the dev server
cd site/appland
npm install
npm run dev
```

## License

CC0 1.0 Universal — see [LICENSE](LICENSE).
