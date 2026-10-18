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

- **API calls** happen only in `packages/data`, through `ApiClient`. Components never call `fetch` or build URLs.
- **New endpoints** need three things: a method on the right service, an entry in `packages/data/endpoints.json` (mark `documented: false` if the endpoint is missing from `/api/schema/`), and a test.
- **Pure components** go in `packages/ui`: props in, markup out, every state (loading, empty, error) controlled by props.
- **Connected components** go in `packages/hb`: a hook from `packages/data` plus a pure component from `packages/ui`.
- **Design system pages** go in `apps/docs/src/pages` and are added to `apps/docs/src/navigation.ts`.

## Generated files: do not edit by hand

- `packages/tokens/tokens.css`: edit `packages/tokens/src/*.tokens.json`, then run `pnpm tokens`.
- `packages/data/src/schema.d.ts`: run `pnpm api:generate`.

## Connecting this front end to another HumanBase API

1. Run `pnpm api:verify <your-api-origin>` and note any failing endpoints.
2. Run `pnpm api:generate <your-api-origin>`, then `pnpm typecheck`. Fix type errors in `packages/data` only.
3. For local development, set `HB_API_PROXY_TARGET=<your-api-origin>`. In production, serve the app on the API's domain so `/api` reaches it, or proxy `/api` there.
4. Never change components to switch data sources.

## Before opening a pull request

- `pnpm check` and `pnpm test:e2e` pass.
- The branch is named after its issue, and the pull request says `Closes #<issue>`.
- Pull requests target `development`. Nothing is pushed to `development` or `master` directly.

## Notes for coding agents

Astro starts its dev and preview servers in the background when it detects a coding agent. Use `astro dev status` and `astro dev stop`, or `pnpm test:e2e`, which keeps them in the foreground.
