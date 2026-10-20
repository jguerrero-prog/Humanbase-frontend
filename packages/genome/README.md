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

`GenomeEngineView` is the React wrapper pages use. It mounts an engine once per assembly and track set, then passes region and selection changes to it.

## Using your own Biodalliance setup

1. **Different tracks or settings:** edit `src/biodalliance/humanbaseConfig.ts`, or create the engine with your own `assemblies` and `browserOptions`.
2. **Your own copy of Biodalliance:** replace `vendor/biodalliance-0.13/`, or pass `baseUrl`, such as `new BiodallianceEngine({ baseUrl: 'https://example.org/dalliance/' })`. That folder needs `dalliance-compiled.js` and Biodalliance's `css`, `img` and `fonts` folders.
3. **A different engine altogether:** implement `GenomeBrowserEngine` and change `defaultGenomeEngine` in `src/defaultGenomeEngine.ts`, or pass `engine` to `AsdExplorer`.

The page hides Biodalliance's toolbar because it draws its own, and keeps Biodalliance's fetch workers off, so tracks load on the main thread.
