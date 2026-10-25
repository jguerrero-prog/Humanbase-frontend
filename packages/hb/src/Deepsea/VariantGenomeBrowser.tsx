import { GenomeLocation, useHumanbase } from '@humanbase/data';
import { defaultGenomeEngine, GenomeEngineView, withChr, type Assembly, type GenomeBrowserEngineFactory, type GenomeDataTrack, type GenomeRegion } from '@humanbase/genome';
import { Alert, GenomeBrowserToolbar } from '@humanbase/ui';
import { useMemo, useState } from 'react';
import { useGenomeBrowserTools } from '../GenomeBrowser/useGenomeBrowserTools';

export interface VariantGenomeBrowserProps {
  assembly: Assembly;
  chromosome: string;
  /** The selected variant's position, marked across every track; left out for a view with no variant, such as a gene. */
  position?: number | undefined;
  /** The variant in words, such as chr7:49,813,589 G>C. */
  label: string;
  /** The view, kept by the page so the molecular effects can follow it. */
  location: GenomeLocation;
  /** The job's own score tracks, drawn above the suggested ones. */
  tracks: readonly GenomeDataTrack[];
  onLocationChange: (location: GenomeLocation) => void;
  onPreviousVariant?: (() => void) | undefined;
  onNextVariant?: (() => void) | undefined;
  engine?: GenomeBrowserEngineFactory | undefined;
  /** Names the browser whose track choices are remembered. */
  browser?: string | undefined;
  /** False leaves out Previous variant and Next variant, for a page with no variants to step through. */
  variantSteps?: boolean | undefined;
  /** What Previous and Next step between; variant by default. */
  stepNoun?: string | undefined;
  /** What still works when the browser can't load, said after the error. */
  failureNote?: string | undefined;
}

/** The genome around the selected variant, with the system toolbar and the page's score tracks. With the API off it draws from the recorded track windows. */
export function VariantGenomeBrowser({ assembly, chromosome, position, label, location, tracks, onLocationChange, onPreviousVariant, onNextVariant, engine = defaultGenomeEngine, browser = 'variant-results', variantSteps = true, stepNoun, failureNote = 'The molecular effects below still work.' }: VariantGenomeBrowserProps) {
  const api = useHumanbase();
  const { genomeTracks } = api;
  const [failure, setFailure] = useState<Error>();
  const [locationError, setLocationError] = useState<string>();
  const chrom = withChr(chromosome);
  const region = useMemo(() => ({ chrom: location.chrom, start: location.start, end: location.end }), [location]);

  const move = (to: GenomeLocation) => {
    setLocationError(undefined);
    onLocationChange(to);
  };
  const around = position ?? location.center;
  const example = `${chrom}:${(around - 1000).toLocaleString('en-US')}-${(around + 1000).toLocaleString('en-US')}`;
  // Gene names come from the assembly's own GENCODE index: GENCODE 19 on hg19, GENCODE 21 on hg38.
  const onLocation = async (text: string) => {
    const typed = GenomeLocation.parse(text, assembly);
    if (typed instanceof GenomeLocation) {
      const { location: kept, message } = typed.fit();
      if (kept) move(kept);
      return setLocationError(message);
    }
    if (!typed) return setLocationError(`Enter a region such as ${example}, or a gene name.`);
    try {
      const found = await api.geneLocator.locate(typed.gene, assembly);
      if (found) move(new GenomeLocation(found.chrom, found.start, found.end, assembly));
      else setLocationError(GenomeLocation.geneNotFound(typed.gene, assembly));
    } catch {
      setLocationError(`The gene index didn’t answer. Try again, or enter a region such as ${example}.`);
    }
  };
  const onRegionChange = (moved: GenomeRegion) => move(new GenomeLocation(moved.chrom, moved.start, moved.end, assembly).fit().location ?? location);
  const zoomStop = (GenomeLocation.zoomStops as readonly number[]).includes(location.width) ? location.width : undefined;
  const { attach, ...tools } = useGenomeBrowserTools({ browser, assembly, tracks, location });

  return (
    <section className="variant-genome-browser" aria-label={`Genome around ${label}`}>
      <GenomeBrowserToolbar
        location={location.format()}
        assembly={location.assemblyName}
        widthHelp={`${GenomeLocation.widthInWords(location.width)} shown. A gene name works too.`}
        variantSteps={variantSteps}
        stepNoun={stepNoun}
        locationError={locationError}
        zoomStop={zoomStop}
        onLocation={(text) => void onLocation(text)}
        onZoom={(direction) => move(location.zoom(direction))}
        onZoomStop={(bases) => move(location.withWidth(bases))}
        onPreviousVariant={onPreviousVariant}
        onNextVariant={onNextVariant}
        {...tools.toolbar}
      />
      {tools.panels}
      {failure && (
        <Alert tone="error" title="The genome browser couldn’t load">
          {failure.message} {failureNote}
        </Alert>
      )}
      <GenomeEngineView
        ref={attach}
        engine={engine}
        files={genomeTracks}
        label={location.regionLabel(tools.shownCount)}
        assembly={assembly}
        region={region}
        tracks={tools.tracks}
        hidden={tools.hidden}
        arrangement={tools.arrangement}
        trackMenu={tools.trackMenu}
        selected={position === undefined ? undefined : { chrom, position }}
        onRegionChange={onRegionChange}
        onStatusChange={(status, error) => setFailure(status === 'failed' ? error : undefined)}
        onCommand={(command) => {
          if (tools.onCommand(command)) return;
          if (command === 'moveLeft' || command === 'moveRight') move(location.move(command === 'moveLeft' ? -0.1 : 0.1));
          else if (command === 'zoomIn' || command === 'zoomOut') move(location.zoom(command === 'zoomIn' ? 'in' : 'out'));
          else if (command === 'previousVariant') onPreviousVariant?.();
          else if (command === 'nextVariant') onNextVariant?.();
        }}
      />
    </section>
  );
}
