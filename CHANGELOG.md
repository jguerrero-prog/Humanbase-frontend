# Changelog

What changed in each release, newest first. The first tagged release, v1.0.0, marks the handoff to the Humanbase team; everything before it is the initial build, recorded in the closed issues and pull requests.

## Unreleased

- Network and module graphs look and respond like humanbase.io's, with curved connections, label pills, hover tooltips and color-blind-safe module colors (#613).
- The module graph's View as table lists one gene per row (#618).
- The decisions behind the front end are recorded in DECISIONS.md (#626).
- HomeSearch keeps every gene when searches finish out of order (#628).
- The Biodalliance genome browser stops listening when it is closed while loading (#630).
- Keyboard focus stays visible in Windows High Contrast (#632).
- Screens explain sample-data limits through `SampleMissingError` and `api.examplesOnly` instead of checking which data client is in use (#634).
- Dependabot, CODEOWNERS, a security policy and this changelog (#636).

## Releasing

1. When `development` is promoted to `master`, move the Unreleased entries under a new version heading with the date.
2. Choose the version:
   - **Major:** a change a fork has to adapt to, in `DataClient`, `GraphRenderer`, `GenomeBrowserEngine` or `config.json`.
   - **Minor:** new screens or features.
   - **Patch:** fixes.
3. After the promotion merges, tag the merge commit and publish the release: `gh release create vX.Y.Z --target master --title vX.Y.Z --notes-file <the section>`.
