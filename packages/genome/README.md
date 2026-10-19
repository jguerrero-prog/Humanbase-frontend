# @humanbase/genome

The genome browser behind the ASD Browser. Pages talk to one interface, `GenomeBrowserEngine`, so the engine can be swapped without changing any screen.

## Engines

- **With the API on**, pages use `defaultGenomeEngine`: Biodalliance, set up as the live Humanbase site sets it up (`src/biodalliance/humanbaseConfig.ts`). It reads the genome, GENCODE genes and data tracks straight from Humanbase's files on S3.
- **With the API off**, pages draw their own score tracks from the sample data and load nothing, so the front end makes no request.

Biodalliance itself is not bundled. `BiodallianceEngine` loads release 0.13 from biodalliance.org at run time, when a page first needs it. Biodalliance is BSD 2-Clause licensed (Copyright 2006-2014, Thomas Down and others).

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
2. **Your own copy of Biodalliance:** pass `baseUrl`, such as `new BiodallianceEngine({ baseUrl: '/biodalliance/' })`. That folder needs `dalliance-compiled.js` and Biodalliance's `css` and `img` folders.
3. **A different engine altogether:** implement `GenomeBrowserEngine` and change `defaultGenomeEngine` in `src/defaultGenomeEngine.ts`, or pass `engine` to `AsdExplorer`.

The page hides Biodalliance's toolbar because it draws its own, and turns off Biodalliance's fetch workers, since browsers only run workers from the page's own origin.
