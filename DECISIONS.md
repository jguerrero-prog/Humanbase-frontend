# Decisions

The product and design decisions behind this front end, and why they were made. Read this before changing how something looks, what data it shows or how the repo is run. To change a decision, open an issue that says which one and why, and update this file in the same pull request.

## Scope

- **This repo is the interface only.** The Humanbase API stays as it is; the front end reads it through a relative `/api` path, so any Humanbase deployment can run it. *(October 18, 2026)*
- **There are no accounts.** Humanbase has no sign-in or profiles. Jobs are kept per browser in job history, with emailed result links, and preferences such as reduced motion, table density and theme are stored in the browser under Display settings. Don't add account, profile or saved-query features. *(October 16, 2026)*
- **API off means fully off.** With the API switched off, every screen shows bundled sample data and makes no requests at all, so a fork can work on the interface without a server. *(October 19, 2026)*
- **Samples come from real API responses.** `pnpm samples:record` saves them from the live API. Samples show how a screen looks; only the live API shows whether real data fits it, so a feature isn't done until it has been checked against live data (`pnpm test:live`). *(October 20, 2026)*
- **The API is never stress-tested.** Tests and recordings make read requests only. The one exception was a single example job per tool, run once to record real results. *(October 20, 2026)*

## Science and data

- **Science matches humanbase.io exactly.** How scientific output is shown (scales, ranges, labels, groupings, names of biological categories, colors that encode data) copies the live site and its real data files. Changing any of it needs a research issue answered by the Humanbase team, not a design decision. *(October 21, 2026)*
- **A model's own paper names its output.** For example, ExPecto's card is "Expression effects", following the ExPecto manuscript (#385). *(October 22, 2026)*
- **Genome tracks come only from real files.** The Tracks drawer lists only tracks read from a real source, such as Humanbase's S3 files or UCSC. There are no placeholder or suggested tracks without a confirmed file. *(October 21, 2026)*
- **No outside gene details.** Gene details in the genome browser stay as humanbase.io lists them, without GTEx or UCSC data, links or charts. *(October 26, 2026)*
- **The docs mirror readthedocs.** `/docs/` reproduces https://humanbase.readthedocs.io word for word, with the same page names and anchors so existing links keep working. Re-import it when the live docs change; never edit the science text here. *(October 21, 2026)*

## Visual design

- **The design system replaces humanbase.io's look, not its function.** Colors, controls, layout and type come from this design system. What each tool computes, its inputs, outputs and flows stay exactly as on humanbase.io. *(October 16, 2026)*
- **The coded design system is the source of truth.** Specs come from the docs site, the tokens and the `packages/ui` components. The Figma file is the design record and can lag behind; use it only where the code has no answer. *(October 20, 2026)*
- **Legends are always stepped.** Heatmaps and score scales use stepped (binned) legends for accessibility, even where humanbase.io shows a continuous ramp. The range and outer edges match the live site; the inner steps are a design system choice. *(October 25, 2026)*
- **Graph colors follow accessibility standards, not the papers.** The network and module graphs look and respond like humanbase.io's, but connection strength uses the stepped sequential blue scale and modules use a color-blind-safe categorical palette, instead of the green-to-red scale (#613). *(October 27, 2026)*
- **The graphs have their own renderer.** `packages/graph` draws them with d3 behind the `GraphRenderer` interface, so another renderer can be swapped in. The layout settles before the graph is drawn and never moves afterwards. *(October 19 and 27, 2026)*
- **No decorative accents.** Selection is shown by a control, a check or bold text, not by colored accent bars or tinted fills, and icons carry no ornamental dots. *(October 16, 2026)*
- **The product name is "Humanbase"**, with a lowercase b, in copy, code and design files. Package scopes stay `@humanbase/...`. *(October 19, 2026)*
- **Copy is direct mid-task and instructive on arrival.** Mid-task, lead with the action and its reason. On first use, empty states and repeated errors, explain why and how with an example. The voice principles end with "Considerate". *(October 16, 2026)*
- **Illustrations stay in the design system.** They are hidden in the app behind `showIllustrations = false` in `packages/hb/src/content/illustrations.ts` (#564), pending the Humanbase team's scientific review. *(October 26, 2026)*
- **Docs pages keep the Figma frames' sizes.** The design system site is built for 1920px; a narrow-screen layout stacks the menu and never scrolls sideways. *(October 18, 2026)*

## Running the repo

- **One issue, one branch, one pull request.**
  - Each change starts as a labeled issue: feature, bug, enhancement, accessibility, code quality, documentation or api. The api label marks anything that needs the Humanbase API team.
  - Work happens on a branch named after the issue, and the pull request targets `development` with "Closes #n".
  - `development` is merged into `master` for releases.
  - Nothing is pushed directly to `development` or `master`. *(October 18, 2026)*
- **Retire, don't delete.** A retired feature keeps its code, tests, docs and Figma screens. It leaves the menus and routes, old links land on a notice, and it can be switched back on. The ASD Browser is the first example (#400). *(October 23, 2026)*
- **Owner details live in one file.** Maintainer, contact email, repository, demo and Figma links are only in `apps/docs/src/data/site.ts`. CI uses no personal secrets. *(October 19, 2026)*
- **New design system pieces are agreed first.** A screen uses only documented components and patterns; anything new is specified and agreed before it is built. Routine questions, such as number formats, truncation or spacing, follow established UX practice. *(October 17 and 23, 2026)*

## Open

- **Palette.** The final palette is undecided. Theme 1 (emerald and Simons Yellow) and Theme 2 (blue) can both be chosen in Display settings so reviewers can compare (#564). Full color themes (#323) wait until the palette is chosen and every page is built.
- **On hold until the Humanbase team is ready.** SEEK, Seal, and the Scores guide and Network versions pages (#403).
- **Questions for the Humanbase team.** These are the build questions in #175 (Homepage and Networks), #191 (NetWAS) and #207 (ExPecto and ExPecto SC). In the meantime, the shipped pages work around them.
