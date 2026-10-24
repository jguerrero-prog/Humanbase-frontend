# @humanbase/genome

The genome browser behind the ASD Browser. Pages talk to one interface, `GenomeBrowserEngine`, so the engine can be swapped without changing any screen.

## Engines

- **`TrackEngine`, the default** (`defaultGenomeEngine`): the design system's own tracks. It renders `GenomeTrackView` from `@humanbase/ui` (ruler, sequence, score tracks, GENCODE genes and the selected variant, as SVG with tokens, per the Genome browser page's Specs) and reads the data through `GenomeTracks` from `@humanbase/data`. With the API on that is `S3GenomeTracks`, which reads Humanbase's track files on S3 in byte ranges (`gencode.bb`, `hg19.2bit`, and each data track's bigWig); with the API off it is `SampleGenomeTracks`, which answers from windows recorded by `pnpm samples:record` and makes no request. Drag the tracks to move; keys and zoom go through the page's toolbar.
- **`BiodallianceEngine`, the alternative**: Biodalliance, set up as the live Humanbase site sets it up (`src/biodalliance/humanbaseConfig.ts`). It reads the same files itself. To use it, return `new BiodallianceEngine()` from `defaultGenomeEngine`, or pass `engine={() => new BiodallianceEngine()}` to `AsdExplorer` or `VariantGenomeBrowser`.

Biodalliance 0.13 is vendored, unmodified, in `vendor/biodalliance-0.13/` with its licenses: Biodalliance is BSD 2-Clause (Thomas Down and others), and the Bootstrap and Font Awesome files it bundles keep their Apache 2.0, MIT and SIL OFL terms. The web app serves that folder from its own origin at `<base>biodalliance/` (`biodallianceAssets.ts`, a Vite plugin), and `BiodallianceEngine` loads it from there only when a page first needs it. Nothing is requested from biodalliance.org.

## The interface

```ts
interface GenomeBrowserEngine {
  mount(container: HTMLElement, options: GenomeMountOptions): Promise<void>;
  showRegion(region: GenomeRegion): void;
  highlight(position: { chrom: string; position: number } | undefined): void;
  showTracks(hidden: readonly string[]): void;
  arrangeTracks(arrangement: GenomeTrackArrangement): void;
  exportSvg(options: GenomeExportOptions): Promise<Blob>;
  destroy(): void;
}
```

- An engine is made by a `GenomeBrowserEngineFactory`, `(files: GenomeTracks) => GenomeBrowserEngine`; `files` reads the track files, so an engine never builds its own requests. Engines that read the files themselves, like Biodalliance, ignore it.
- `mount` draws into the container and resolves when the engine can take a region. `options` holds a screen reader label, the assembly (`hg19` or `hg38`), the starting region, the page's data tracks and `onRegionChange`. A data track is a score track (a bigWig file with a `range` and a style) or a segment track (a bigBed file, `bigBedUrl`, whose segments are drawn in the file's own itemRgb colors).
- `onRegionChange` fires once a drag or zoom inside the engine settles, never for a region the page set.
- `showRegion` follows the page's own toolbar: search, zoom, Previous and Next variant.
- `highlight` marks the selected variant; `undefined` clears it.
- `showTracks` shows every track but the hidden ones, by id: `sequence`, `genes`, or a data track's name. `mount` takes the first `hidden` list too. `genomeTrackList` lists a browser's tracks in drawing order for the Tracks drawer, and `suggestedTracks` adds the live site's Conservation (`phastCons46way.bw`) and GM12878 ChromHMM (`gm12878.ChromHMM.bb`) tracks on hg19; they start hidden (`hiddenByDefault`). `TrackEngine` draws ChromHMM as 8px boxes in each segment's own color with a 1px ink outline and shows the Data tooltip on hover; Biodalliance uses the live site's ChromHMM style (`chromHmm` in `humanbaseConfig.ts`).
- `arrangeTracks` draws the tracks in `order` (track ids; ids it leaves out keep their usual place, see `inOrder`) and gives score tracks their Track settings by id: a `height` in pixels and a `range` for the bars. Anything left out is drawn as usual. `mount` takes the first `arrangement`. `TrackEngine` passes both to `GenomeTrackView`; Biodalliance reorders its tiers (pinning them all, as it draws pinned tiers first) and sets each tier's `height`, `forceMin` and `forceMax`.
- `trackMenu`, in the mount options, gives each track header its menu by track id; `TrackEngine` reads it on every draw for the headers it draws itself.
- `scoreTrack` makes a score track as the Genome browser page draws it (`viz-seq-6` bars, 60 px tall in both engines, over its range, with the source and range as its meta line, such as "This job, 0 to 3"). The ASD Browser's impact scores, Conservation and each variant result's own score files use it. A variant result draws one track per variant-level score its job has a bigWig for (`variant_dis`, `variant_mean-evalue`, `variant_seqclass` or `variant_expecto`), named as humanbase.io names them and on by default; ExPecto's signed effect spans −0.5 to 0.5 and the others 0 to 3, as on humanbase.io.
- `exportSvg` returns the current view as an SVG file with the Export dialog's options: the tracks' width, the selected variant's highlights, the vertical guideline, and a title line such as the location. `TrackEngine` draws `GenomeTrackFigure` from `@humanbase/ui` with the data on screen; Biodalliance uses its own `makeSVG`.
- Regions are 1-based and inclusive, with the `chr` prefix.
- `onTrackLayout`, when set, receives each track's id, name, `meta`, top and height whenever the engine lays its tracks out, so the page can draw headers beside them.

`GenomeEngineView` is the React wrapper pages use; it takes `hidden`, `arrangement` and `trackMenu`, and its `ref` gets `exportSvg`; pages pass it `files`, `useHumanbase().genomeTracks`. It mounts an engine once per assembly, file reader and track set, then passes region and selection changes to it. It draws the design system's `TrackHeader`, with its menu, for each track the engine reports, in the 220 px header column (120 px under 48rem). With `onCommand`, the tracks take keyboard focus and keys map through `genomeCommand` from `@humanbase/ui`, so arrows, + and −, and Ctrl+arrows act through the page's own toolbar. Under the tracks, it lists each shown segment track's segments in view with `SegmentTable` (View as table), whichever engine draws them.

## Theming Biodalliance

When chosen, Biodalliance looks like the design system's Genome browser page. The values come from that page's Specs, `GenomeTracksSketch` and `ScoreTracks`, never from Biodalliance's defaults.

- **Options and track styles take tokens.** Any string such as `'var(--viz-seq-6)'` in `browserOptions`, a source or a track style is read from the page's computed tokens when the engine mounts (`resolveTokens`), because the canvas can't read CSS. A theme change applies on the next mount.
- **What `humanbaseConfig.ts` sets:** `noSourceCSS` and `noTrackEditor`, so Bootstrap, Font Awesome and the track editor never load; no ruler; `surface-page` track backgrounds; a 60 px minimum track pitch; the selected variant as a `text-default` line at 50%; gene exons in `text-secondary`, pseudogenes in `text-muted`; and the GENCODE gene style inline instead of the live site's stylesheet file.
- **Data tracks** get a `border-subtle` zero line. Score tracks from `scoreTrack` are 60 px tall, the Track settings default, as in `TrackEngine`.
- **`src/genome.css`** reaches what options can't: it hides Biodalliance's toolbar, labels, guides and score axis, removes its graph paper and checkerboard backgrounds, and sets its fonts and notices from tokens. With `noSourceCSS`, only Biodalliance's layout stylesheet, `css/dalliance-scoped.css`, loads.

Some things are drawn on Biodalliance's canvas and keep its look: the position ruler's black and white stripes and sans-serif numbers, 10 px sans-serif gene labels with `<` and `>` strand marks, faint grid lines inside score tracks, and no value label or mono pill on the selected variant. `TrackEngine` draws these as the Genome browser page shows them.

## Using your own Biodalliance setup

1. **Different tracks or settings:** edit `src/biodalliance/humanbaseConfig.ts`, or create the engine with your own `assemblies` and `browserOptions`.
2. **Your own copy of Biodalliance:** replace `vendor/biodalliance-0.13/`, or pass `baseUrl`, such as `new BiodallianceEngine({ baseUrl: 'https://example.org/dalliance/' })`. That folder needs `dalliance-compiled.js` and Biodalliance's `css`, `img` and `fonts` folders.
3. **A different engine altogether:** implement `GenomeBrowserEngine` and change `defaultGenomeEngine` in `src/defaultGenomeEngine.ts`, or pass `engine` to `AsdExplorer`.

Biodalliance's fetch workers stay off, so tracks load on the main thread. To restyle another engine, give it the same tokens; to restyle this one, change `humanbaseConfig.ts` and `src/genome.css` and leave `vendor/` unmodified.
