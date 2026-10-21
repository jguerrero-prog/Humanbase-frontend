import { SampleClient, SampleGenomeTracks } from '@humanbase/data';
import { act, screen } from '@testing-library/react';
import { TrackEngine } from './TrackEngine';

describe('TrackEngine', () => {
  it('draws the genes in view from the track files and follows the page’s region and selection', async () => {
    // jsdom has no layout: the panel is 1220px wide with its 220px header column.
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('score-tracks-column') ? 220 : 1220;
    });
    const container = document.createElement('div');
    document.body.append(container);
    const engine = new TrackEngine(new SampleGenomeTracks(SampleClient.bundled()));
    const onRegionChange = vi.fn();
    await act(() => engine.mount(container, { label: 'Genome browser', assembly: 'hg19', region: { chrom: 'chr1', start: 2_230_000, end: 2_440_000 }, tracks: [], onRegionChange }));
    expect(screen.getByText('Loading Genes…')).toBeInTheDocument();
    expect(await screen.findByText('← PEX10')).toBeInTheDocument();
    act(() => engine.highlight({ chrom: 'chr1', position: 2_337_101 }));
    expect(screen.getByText('chr1:2,337,101')).toBeInTheDocument();
    act(() => engine.showRegion({ chrom: 'chr14', start: 21_853_352, end: 21_905_457 }));
    expect(await screen.findByText('← CHD8')).toBeInTheDocument();
    expect(screen.queryByText('chr1:2,337,101')).toBeNull();
    expect(onRegionChange).not.toHaveBeenCalled();
    engine.destroy();
    container.remove();
    vi.restoreAllMocks();
  });
});
