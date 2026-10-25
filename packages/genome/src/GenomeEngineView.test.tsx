import type { GenomeTracks } from '@humanbase/data';
import { act, render, waitFor } from '@testing-library/react';
import { useState } from 'react';
import type { GenomeBrowserEngine, GenomeDataTrack, GenomeMountOptions, GenomeRegion } from './GenomeBrowserEngine';
import { GenomeEngineView } from './GenomeEngineView';

/** Records each engine the view starts: where it opened and every region it was sent to. */
class FakeEngines {
  readonly started: { options: GenomeMountOptions; shown: GenomeRegion[] }[] = [];

  readonly factory = (): GenomeBrowserEngine => {
    const record = { options: undefined as unknown as GenomeMountOptions, shown: [] as GenomeRegion[] };
    return {
      mount: (_container, options) => {
        record.options = options;
        this.started.push(record);
        return Promise.resolve();
      },
      showRegion: (region) => record.shown.push(region),
      highlight: () => undefined,
      showTracks: () => undefined,
      arrangeTracks: () => undefined,
      exportSvg: () => Promise.resolve(new Blob()),
      destroy: () => undefined,
    };
  };

  get latest() {
    const engine = this.started.at(-1);
    if (!engine) throw new Error('No engine has started.');
    return engine;
  }

  /** A drag or zoom inside the current engine. */
  move(region: GenomeRegion) {
    act(() => this.latest.options.onRegionChange?.(region));
  }
}

const files = { covers: () => Promise.resolve(true) } as unknown as GenomeTracks;
const first: GenomeRegion = { chrom: 'chr5', start: 150_200_000, end: 150_250_000 };
const moved: GenomeRegion = { chrom: 'chr5', start: 150_300_000, end: 150_350_000 };
const remembered: GenomeDataTrack[] = [{ name: 'Your track', bigWigUrl: 'https://example.org/yours.bw' }];

/** A page that follows the engine's moves, as /genome/ does through its URL. */
function Page({ engines, tracks, region: asked }: { engines: FakeEngines; tracks: readonly GenomeDataTrack[]; region?: GenomeRegion }) {
  const [region, setRegion] = useState(first);
  return <GenomeEngineView engine={engines.factory} files={files} label="Genome browser" assembly="hg19" region={asked ?? region} tracks={tracks} onRegionChange={setRegion} />;
}

describe('GenomeEngineView', () => {
  it('restarts where the view was moved to, not where it first opened', async () => {
    const engines = new FakeEngines();
    const page = render(<Page engines={engines} tracks={[]} />);
    await waitFor(() => expect(engines.started).toHaveLength(1));
    engines.move(moved);

    page.rerender(<Page engines={engines} tracks={remembered} />);
    await waitFor(() => expect(engines.started).toHaveLength(2));
    expect(engines.latest.options.region).toEqual(moved);
    expect(engines.latest.shown).toEqual([]);
  });

  it('opens a restarted engine on a region asked for in the same change', async () => {
    const engines = new FakeEngines();
    const page = render(<Page engines={engines} tracks={[]} />);
    await waitFor(() => expect(engines.started).toHaveLength(1));

    page.rerender(<Page engines={engines} tracks={remembered} region={moved} />);
    await waitFor(() => expect(engines.started).toHaveLength(2));
    expect(engines.latest.options.region).toEqual(moved);
  });
});
