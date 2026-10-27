# Working in this repository

Read this before changing anything. It applies to people and coding agents alike.

## Code standards

- **HTML is semantic and accessible.** Use native elements first: `button`, `a`, `dialog`, `details`, `table`, `search`, form controls with labels, the `popover` attribute. Add ARIA only where HTML has no answer. Every page must pass `pnpm test:e2e`.
- **No raw HTML strings.** Never use `innerHTML`, `outerHTML`, `dangerouslySetInnerHTML`, `insertAdjacentHTML` or `document.write`. Build DOM with React, or with `createElement` and `textContent`. ESLint blocks these.
- **CSS uses tokens.** All styles build on `packages/ui/src/root.css`. Use semantic tokens (`--text-default`, `--action-primary`), never hex or named colors. Use plain CSS files, not CSS-in-JS.
- **Comments are rare.** Write one only when the code can't explain itself, in plain English, two lines at most. If a comment only restates a name, rename instead.
- **Build once, reuse.** Shared behavior lives in one class, hook or component. Search before writing; never copy a function.
- **Keep it simple.** Prefer a small class or function over a framework of abstractions. Models and services are classes (`Gene`, `GeneService`, `ApiClient`); React components are small functions that render.

## Where things go

- **API calls** happen only in `packages/data`, through a `DataClient`: `ApiClient` when the API is on, `SampleClient` when it is off. Components never call `fetch` or build URLs, and never check which client is in use. A screen that explains sample-data limits checks `error instanceof SampleMissingError` (no sample was recorded) or `api.examplesOnly` (the client answers only for recorded examples), never the client's type.
- **New endpoints** need four things: a method on the right service, an entry in `packages/data/endpoints.json` (mark `documented: false` if the endpoint is missing from `/api/schema/`), the `samples` that endpoint's screens request, recorded with `pnpm samples:record`, and a test. Every state a screen shows with the API on (found, empty, not found) needs a sample so it also shows with the API off. Mark a POST `readOnly: true` only if it never creates a job.
- **Pure components** go in `packages/ui`: props in, markup out, every state (loading, empty, error) controlled by props.
- **Connected components** go in `packages/hb`: a hook from `packages/data` plus a pure component from `packages/ui`.
- **Design system pages** go in `apps/docs/src/pages` and are added to `apps/docs/src/navigation.ts`.
- **Owner details** (maintainer, contact email, repository and Figma links) live only in `apps/docs/src/data/site.ts`. A new owner or fork edits that file.

## Generated files: do not edit by hand

- `packages/tokens/tokens.css`: edit `packages/tokens/src/*.tokens.json`, then run `pnpm tokens`.
- `packages/data/src/schema.d.ts`: run `pnpm api:generate`.

## Connecting this front end to another Humanbase API

1. Run `pnpm api:verify <your-api-origin>` and note any failing endpoints.
2. Run `pnpm api:generate <your-api-origin>`, then `pnpm typecheck`. Fix type errors in `packages/data` only.
3. For local development, set `HB_API_PROXY_TARGET=<your-api-origin>`. In production, serve the app on the API's domain so `/api` reaches it, or proxy `/api` there.
4. Never change components to switch data sources.

## Before opening a pull request

- `pnpm check` and `pnpm test:e2e` pass.
- A change to how a screen reads API data also passes its `pnpm test:live` specs. Sample data shows how a screen renders; only live data shows whether the API lands in it correctly.
- The branch is named after its issue, and the pull request says `Closes #<issue>`.
- Pull requests target `development`. Nothing is pushed to `development` or `master` directly.

## Authorship

Commits, pull requests, issues and comments are written as the repository owner. Coding agents, Claude and others, never list themselves as authors or contributors, even when their tool adds attribution by default:

- **Commits:** no `Co-Authored-By:` trailers. Commit as the repository owner's GitHub noreply address, currently `jguerrero-prog <234269224+jguerrero-prog@users.noreply.github.com>`, set in the repo's local git config or per commit with `git -c user.name=… -c user.email=…`. Never commit with a personal or work email.
- **Pull requests:** no agent named as an author or co-author, in the description, the title or the squash-merge message. No "Generated with" lines or AI badges.
- **Issues and comments:** no agent signatures, "Generated with" lines or AI badges.

## Notes for coding agents

Astro starts its dev and preview servers in the background when it detects a coding agent. Use `astro dev status` and `astro dev stop`, or `pnpm test:e2e`, which keeps them in the foreground.
