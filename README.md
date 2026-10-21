# Humanbase front end

The redesigned front end for [Humanbase](https://hb.flatironinstitute.org) and the design system it is built from. It talks to the Humanbase API without changing it, so any Humanbase deployment can fork this repository and point it at its own API.

## What is in the repository

| Folder | What it holds | Runs at |
| --- | --- | --- |
| `apps/web` | The Humanbase front end (React 19, TypeScript, Vite) | http://localhost:5173 |
| `apps/docs` | The design system site (Astro, MDX, Shiki, Pagefind) | http://localhost:4321 |
| `packages/tokens` | Design tokens from Figma, in the W3C Design Tokens format, and the generated `tokens.css` | |
| `packages/ui` | Pure components and `root.css`, the single stylesheet entry point | |
| `packages/data` | The only code that talks to the API: `ApiClient`, models, services, React provider and hooks | |
| `packages/hb` | Connected components: a pure component plus a data hook | |
| `packages/graph` | The network and module graph renderer, swappable through `GraphRenderer` | |
| `packages/genome` | The genome browser engine, swappable through `GenomeBrowserEngine`: the design system's own track engine by default, Biodalliance as an alternative | |

## Live preview

Every merge to `master` publishes both apps to GitHub Pages: the design system at https://jguerrero-prog.github.io/Humanbase-frontend/ and the front end, with the API off, at https://jguerrero-prog.github.io/Humanbase-frontend/app/. A fork gets its own Pages address once Pages is turned on with GitHub Actions as the source.

## Getting started

You need Node 24. pnpm comes with Node through Corepack.

```sh
corepack enable pnpm
pnpm install
pnpm dev:web    # the front end
pnpm dev:docs   # the design system site
```

Before the first `pnpm test:e2e` or `pnpm test:live`, install the browser the tests use: `pnpm exec playwright install chromium`.

| Command | What it does |
| --- | --- |
| `pnpm check` | Type checks, lints and runs unit tests. CI runs the same. |
| `pnpm build` | Builds both apps. The docs build also indexes search. |
| `pnpm test:e2e` | Builds both apps and scans every page for WCAG 2.2 AA issues, with the API off. |
| `pnpm test:live` | Runs every screen against the live Humanbase API. See below. |
| `pnpm test:live:jobs` | Submits one example job per tool through the forms and checks each result. |
| `pnpm tokens` | Regenerates `tokens.css` after the token files change. |
| `pnpm api:generate` | Regenerates the API types from an API's `/api/schema/`. |
| `pnpm api:verify` | Calls every endpoint the front end uses and reports which ones work. |
| `pnpm samples:record` | Saves the sample data shown when the API is off. Read requests only. Samples over 100 KB are saved without indentation; `pnpm samples:record --compact` applies that to the samples already saved, without asking the API. |

## Connecting your own Humanbase API

The front end always calls a relative `/api` path, so the API never needs extra settings.

1. **Hosting on the same domain as the API** (for example humanbase.io): build with `pnpm build` and serve `apps/web/dist`. Requests to `/api` already reach your API. Send unknown routes to `index.html`.
2. **Local development:** the dev servers forward `/api` to the public API. To use yours, set `HB_API_PROXY_TARGET`, for example `HB_API_PROXY_TARGET=https://humanbase.io pnpm dev:web`.
3. **Check the connection:** run `pnpm api:verify https://humanbase.io` and `pnpm api:generate https://humanbase.io`. A type error after generating points to exactly where your API differs.

`apps/web/public/config.json` is read when the page loads, so the API path can change without rebuilding.

## Deploying

`pnpm --filter @humanbase/web build` writes the whole front end to `apps/web/dist`: static files with no server code. To run it beside the Humanbase API, for example on humanbase.io:

1. Serve `apps/web/dist` from the same origin as the API and send `/api` to the API. The API sends no CORS headers, so it can't be called from another domain.
2. Send every path that isn't a file to `index.html`, so links such as `/networks/?entrez=3553` open on a refresh.
3. Cache `assets/` for a year (every name has a content hash), and never cache `index.html` or `config.json`. The vendored Biodalliance, the alternative genome browser engine, lives in `biodalliance/`.
4. Set `config.json`: `"api": true` beside the API, `"api": false` for the API-off demo. To serve under a path such as `/app/`, build with `WEB_BASE=/app/`.

The [Deploying page](apps/docs/src/pages/resources/deploying.astro) on the design system site has an example nginx configuration and the checks to run before switching over. The GitHub Pages demo, built by `.github/workflows/pages.yml`, is the API-off example.

### A live-API demo on Cloudflare Pages

When the front end can't sit on the API's domain, Cloudflare Pages can serve it and forward `/api` for it. `functions/api/[[path]].ts` is a Pages Function that sends every `/api/*` request to the Humanbase API, as the dev server's proxy does; set `HB_API_PROXY_TARGET` in the Pages project to use another API. Cloudflare Pages already sends unknown paths to `index.html`.

1. Run `pnpm exec wrangler login` once.
2. Run `pnpm deploy:cloudflare`. It builds the app with the API on and deploys it, with the function, to the `humanbase-frontend` Pages project on its `master` branch.

`pnpm exec wrangler pages dev apps/web/dist` runs the same setup locally. Anyone with the link can submit real jobs through it, as on the live site.

## Turning the API off

`apps/web/public/config.json` has one switch:

```json
{ "api": false, "apiBase": "/api" }
```

With `"api": false` the front end never calls an API. Every screen shows sample data bundled in `packages/data/samples`, so you get the whole interface and design system with nothing behind it. Set it back to `true` to use the API at `apiBase`. The file is read when the page loads, so no rebuild is needed.

The sample data is real Humanbase API responses, plus files the API links to, such as the NetWAS example GWAS files. Where a response can only come from submitting a job, the sample is hand-built in the same shape and says so in its `note`. `packages/data/endpoints.json` lists, for each endpoint, the requests the screens make, including not-found cases. `pnpm samples:record` fetches them from the public API, or from the origin you pass, and saves one file per request. It only sends read requests; it never submits a job. Gene lookups and genome browser tracks read static files on S3 instead of the API; the genes listed under `geneLookups` and the windows listed under `genomeTracks` are recorded the same way, so those stay off too. Add `--only=/api/terms` to record only the samples whose path starts with that prefix. An endpoint can list `omit`, field names dropped from its samples wherever they appear, such as long term descriptions the screens never show.

To connect your own engine instead of the Humanbase API, write a class that implements `DataClient` (`get`, `post`, and `text` for files the API links to, such as job results) and pass it to `new Humanbase(yourClient)` in `apps/web/src/main.tsx`. Services and screens don't change.

## Testing against the live API

`pnpm test:e2e` uses the bundled sample data, so it shows how the screens render but not whether real API data lands in them. `pnpm test:live` runs the app with the API on, against the public Humanbase API or `HB_API_PROXY_TARGET`, and opens every screen with real data. Each screen must show real values, log no console errors, get no failed API responses, fit 1440 and 390 pixel widths without sideways scrolling, and pass a WCAG 2.2 AA scan.

`pnpm test:live:jobs` also submits one real example job per tool and checks the result page once it finishes. It never retries a failed submission.

Neither runs on pull requests, so a slow or unavailable API never blocks a merge. The **Live API** workflow runs `pnpm test:live` every Monday, and both on demand from the Actions tab. When the Monday run fails, it opens an issue titled "Live API run failed on" the date, listing the failing tests and linking to the run; while that issue is open, later failures add a comment to it instead of a new issue.

## Using the design system

Import `@humanbase/ui/root.css` once. It loads the fonts, the tokens and the base element styles. In your CSS, use semantic tokens such as `var(--action-primary)` and `var(--text-default)`, never hex colors; Stylelint enforces this.

Components come in two kinds. **Pure** components take props and render markup. **Connected** components wrap a pure one and load their own data through `@humanbase/data`. Every connected component's pure version is exported too.

The design system site (`pnpm dev:docs`) documents every token and component.

## How we work

Every change starts as a GitHub issue, labeled feature, bug, enhancement, accessibility, code quality, documentation or api. Work happens on a branch named after the issue, such as `feature/12-gene-search`, and merges into `development` through a pull request once CI passes. `development` merges into `master` for releases. Both branches are protected.

The code standards are in [AGENTS.md](AGENTS.md). They apply to people and coding agents alike.

## License

The front end and design system in this repository are [MIT licensed](LICENSE). The license does not cover the Humanbase API, the data it serves, or any graph renderer added to `packages/graph` under its own license; those belong to their owners. Vendored third-party code keeps its own licenses: Biodalliance 0.13 and the Bootstrap and Font Awesome files it bundles, listed in `packages/genome/vendor/biodalliance-0.13/`.
