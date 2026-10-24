import { GenomeLocation, useHumanbase } from '@humanbase/data';
import { defaultGenomeEngine, GenomeEngineView, withChr, type Assembly, type GenomeBrowserEngineFactory, type GenomeDataTrack, type GenomeRegion } from '@humanbase/genome';
import { Alert, GenomeBrowserToolbar } from '@humanbase/ui';
import { useMemo, useState } from 'react';
import { useGenomeBrowserTools } from '../GenomeBrowser/useGenomeBrowserTools';

export interface VariantGenomeBrowserProps {
  assembly: Assembly;
  chromosome: string;
  position: number;
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
}

/** The genome around the selected variant, with the system toolbar and the job's score tracks. With the API off it draws from the recorded track windows. */
export function VariantGenomeBrowser({ assembly, chromosome, position, label, location, tracks, onLocationChange, onPreviousVariant, onNextVariant, engine = defaultGenomeEngine }: VariantGenomeBrowserProps) {
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
  const example = `${chrom}:${(position - 1000).toLocaleString('en-US')}-${(position + 1000).toLocaleString('en-US')}`;
  // Gene names come from the hg19 GENCODE index; hg38 results take regions only.
  const onLocation = async (text: string) => {
    const typed = GenomeLocation.parse(text, assembly);
    if (typed instanceof GenomeLocation) {
      const { location: kept, message } = typed.fit();
      if (kept) move(kept);
      return setLocationError(message);
    }
    if (!typed || assembly !== 'hg19') return setLocationError(`Enter a region such as ${example}.`);
    try {
      const found = await api.asd.find(text);
      if (found) move(new GenomeLocation(found.location.chrom, found.location.start, found.location.end, assembly));
      else setLocationError(GenomeLocation.geneNotFound(typed.gene, assembly));
    } catch {
      setLocationError(`The gene index didn’t answer. Try again, or enter a region such as ${example}.`);
    }
  };
  const onRegionChange = (moved: GenomeRegion) => move(new GenomeLocation(moved.chrom, moved.start, moved.end, assembly).fit().location ?? location);
  const zoomStop = (GenomeLocation.zoomStops as readonly number[]).includes(location.width) ? location.width : undefined;
  const { attach, ...tools } = useGenomeBrowserTools({ browser: 'variant-results', assembly, tracks, location });

  return (
    <section className="variant-genome-browser" aria-label={`Genome around ${label}`}>
      <GenomeBrowserToolbar
        location={location.format()}
        assembly={location.assemblyName}
        widthHelp={`${GenomeLocation.widthInWords(location.width)} shown.${assembly === 'hg19' ? ' A gene name works too.' : ''}`}
        locationError={locationError}
        zoomStop={zoomStop}
        onLocation={(text) => void onLocation(text)}
        onZoom={(direction) => move(location.zoom(direction))}
        onZoomStop={(bases) => move(location.withWidth(bases))}
        {...(onPreviousVariant && { onPreviousVariant })}
        {...(onNextVariant && { onNextVariant })}
        {...tools.toolbar}
      />
      {tools.panels}
      {failure && (
        <Alert tone="error" title="The genome browser couldn’t load">
          {failure.message} The molecular effects below still work.
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
        selected={{ chrom, position }}
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
