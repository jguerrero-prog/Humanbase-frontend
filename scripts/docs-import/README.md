# Docs import

Copies the Humanbase documentation from https://humanbase.readthedocs.io/en/latest/ (built from FunctionLab/humanbase-docs) into this repository, so the website can show it at `/docs/` without fetching anything at runtime.

The live docs are the source of truth. The import changes no wording except one: "HumanBase" becomes "Humanbase" in prose. Code, URLs, external link text (such as paper titles) and text in quotation marks keep the original spelling.

## Running an import

```sh
pnpm install
pnpm docs:import
```

The script fetches each page in `pages.ts` once, one at a time with a short pause between requests, then each image the pages use. It writes:

- Markdown pages to `packages/hb/src/content/docs/pages/` (use cases under `use-cases/`)
- images to `apps/web/public/docs/img/`

Options:

- `--check` compares with the files in the repository and exits with 1 if anything changed, without writing.
- `--cache <dir>` keeps a copy of every fetched page and image in `<dir>` and reads from it on later runs. Use it while working on the converter, so the live site is fetched only once.

## Reviewing an import

Each run prints what changed against the files on disk:

```
Pages: 30 total, 0 added, 0 removed, 2 changed
  ~ sei.md
  ~ use-cases/sei-use-case.md
Images: 62 total, 1 added, 0 removed, 0 changed
  + sei-5.png
```

Then read `git diff` before committing. Text changes should match the live pages; anything else is a converter change and needs a reason.

If the live docs link to a page that is not in `pages.ts`, the import stops and names it. Add it to `pages.ts` with a slug, a group and, for the sidebar, a label.

## What the converter does

- Takes the article body only (`[itemprop=articleBody]`), without Sphinx's permalink icons.
- Front matter is JSON (also valid YAML): title, slug, group, sidebar label, order, live URL, section ids and titles, and the pixel size of each image.
- Headings keep their live id, written as `## Output {#output}`, so `sei.html#output` works as `/docs/sei/#output`.
- Links between docs pages become `/docs/` routes with their anchors. Other links stay as they are.
- Figures become Markdown images at `/docs/img/<file>`. When Sphinx's alt text is only the file path, the alt text names the screenshot instead: "Sei use case, screenshot 1".
- MathJax formulas become `$…$` and `$$…$$`. Sphinx `<sub>` and `<sup>` become `$_{…}$` and `$^{…}$`. The app renders formulas that are only text with subscripts as text with real `<sub>` and `<sup>` elements, and the rest (fractions, sums, logs) as native MathML, both built as React elements by `TexMath` in `packages/ui`.
- A preformatted block whose lines are all a pipe table with a separator line, such as Sei's sequence classes, becomes a Markdown table with the same cells. Only number columns keep right alignment. Any other preformatted text stays a code block.
- Definition lists become a paragraph for each term followed by its content. Sphinx's lower-roman list markers (i, ii, iii) become 1, 2, 3, since Markdown has only numbered lists.
- Notes and warnings (Sphinx admonitions) become `> [!NOTE]` blockquotes, which the app shows as Alerts. The docs have none today.

Unit tests for the converter are in `convert.test.ts` and run with `pnpm test`.
