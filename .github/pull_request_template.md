Closes #

## What changed

## How to check it

## Before opening

- [ ] The branch is named after its issue, and this pull request targets `development`.
- [ ] `pnpm check` and `pnpm test:e2e` pass.
- [ ] A change to how a screen reads API data also passes its `pnpm test:live` specs.

## Checklist

- [ ] Semantic HTML: native elements first (`button`, `dialog`, `details`, `table`, form controls), ARIA only where HTML has no answer.
- [ ] Keyboard and screen reader tested; `pnpm test:e2e` accessibility scan passes.
- [ ] No `innerHTML`, `outerHTML`, `dangerouslySetInnerHTML`, `insertAdjacentHTML` or `document.write`.
- [ ] CSS uses tokens only, through `root.css`.
- [ ] No duplicated logic: shared behavior lives in one class, hook or component.
- [ ] Comments only where the code can't explain itself, two lines at most.
- [ ] New API endpoints are listed in `packages/data/endpoints.json`.
