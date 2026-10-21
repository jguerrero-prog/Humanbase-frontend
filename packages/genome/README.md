# @humanbase/genome

The genome browser behind the ASD Browser. Pages talk to one interface, `GenomeBrowserEngine`, so the engine can be swapped without changing any screen.

## Engines

- **With the API on**, pages use `defaultGenomeEngine`: Biodalliance, set up as the live Humanbase site sets it up (`src/biodalliance/humanbaseConfig.ts`). It reads the genome, GENCODE genes and data tracks straight from Humanbase's files on S3.
- **With the API off**, pages draw their own score tracks from the sample data and load nothing, so the front end makes no request.

Biodalliance 0.13 is vendored, unmodified, in `vendor/biodalliance-0.13/` with its licenses: Biodalliance is BSD 2-Clause (Thomas Down and others), and the Bootstrap and Font Awesome files it bundles keep their Apache 2.0, MIT and SIL OFL terms. The web app serves that folder from its own origin at `<base>biodalliance/` (`biodallianceAssets.ts`, a Vite plugin), and `BiodallianceEngine` loads it from there only when a page first needs it. Nothing is requested from biodalliance.org.

## The interface

```ts
interface GenomeBrowserEngine {
  mount(container: HTMLElement, options: GenomeMountOptions): Promise<void>;
  showRegion(region: GenomeRegion): void;
  highlight(position: { chrom: string; position: number } | undefined): void;
  destroy(): void;
}
```

- `mount` draws into the container and resolves when the engine can take a region. `options` holds a screen reader label, the assembly (`hg19` or `hg38`), the starting region, the page's data tracks (bigWig files with a style) and `onRegionChange`.
- `onRegionChange` fires once a drag or zoom inside the engine settles, never for a region the page set.
- `showRegion` follows the page's own toolbar: search, zoom, Previous and Next variant.
- `highlight` marks the selected variant; `undefined` clears it.
- Regions are 1-based and inclusive, with the `chr` prefix.
- `onTrackLayout`, when set, receives each track's name, `meta`, top and height whenever the engine lays its tracks out, so the page can draw headers beside them.

`GenomeEngineView` is the React wrapper pages use. It mounts an engine once per assembly and track set, then passes region and selection changes to it. It draws the design system's `TrackHeader` for each track the engine reports, in the 220 px header column (120 px under 48rem). With `onCommand`, the tracks take keyboard focus and keys map through `genomeCommand` from `@humanbase/ui`, so arrows, + and −, and Ctrl+arrows act through the page's own toolbar.

## Theming

The engine looks like the design system's Genome browser page. The values come from that page's Specs, `GenomeTracksSketch` and `ScoreTracks`, never from Biodalliance's defaults.

- **Options and track styles take tokens.** Any string such as `'var(--viz-seq-6)'` in `browserOptions`, a source or a track style is read from the page's computed tokens when the engine mounts (`resolveTokens`), because the canvas can't read CSS. A theme change applies on the next mount.
- **What `humanbaseConfig.ts` sets:** `noSourceCSS` and `noTrackEditor`, so Bootstrap, Font Awesome and the track editor never load; no ruler; `surface-page` track backgrounds; a 60 px minimum track pitch; the selected variant as a `text-default` line at 50%; gene exons in `text-secondary`, pseudogenes in `text-muted`; and the GENCODE gene style inline instead of the live site's stylesheet file.
- **Data tracks** get a `border-subtle` zero line. The ASD Browser draws its scores as `viz-seq-6` bars, 50 px tall.
- **`src/genome.css`** reaches what options can't: it hides Biodalliance's toolbar, labels, guides and score axis, removes its graph paper and checkerboard backgrounds, and sets its fonts and notices from tokens. With `noSourceCSS`, only Biodalliance's layout stylesheet, `css/dalliance-scoped.css`, loads.

Some things are drawn on Biodalliance's canvas and keep its look: the position ruler's black and white stripes and sans-serif numbers, 10 px sans-serif gene labels with `<` and `>` strand marks, faint grid lines inside score tracks, and no value label or mono pill on the selected variant. A different engine can draw these as the Genome browser page shows them.

## Using your own Biodalliance setup

1. **Different tracks or settings:** edit `src/biodalliance/humanbaseConfig.ts`, or create the engine with your own `assemblies` and `browserOptions`.
2. **Your own copy of Biodalliance:** replace `vendor/biodalliance-0.13/`, or pass `baseUrl`, such as `new BiodallianceEngine({ baseUrl: 'https://example.org/dalliance/' })`. That folder needs `dalliance-compiled.js` and Biodalliance's `css`, `img` and `fonts` folders.
3. **A different engine altogether:** implement `GenomeBrowserEngine` and change `defaultGenomeEngine` in `src/defaultGenomeEngine.ts`, or pass `engine` to `AsdExplorer`.

Biodalliance's fetch workers stay off, so tracks load on the main thread. To restyle another engine, give it the same tokens; to restyle this one, change `humanbaseConfig.ts` and `src/genome.css` and leave `vendor/` unmodified.
