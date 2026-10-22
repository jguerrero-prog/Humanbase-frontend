import { SampleClient, SampleGenomeTracks } from '@humanbase/data';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { hiddenByDefault, suggestedTracks } from '../genomeTrackList';
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

  it('hides and shows tracks by id, and exports the tracks it shows as one svg', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('score-tracks-column') ? 220 : 1220;
    });
    const container = document.createElement('div');
    document.body.append(container);
    const engine = new TrackEngine(new SampleGenomeTracks(SampleClient.bundled()));
    const region = { chrom: 'chr1', start: 2_230_000, end: 2_440_000 };
    await act(() => engine.mount(container, { label: 'Genome browser', assembly: 'hg19', region, tracks: [], hidden: ['sequence'] }));
    expect(await screen.findByText('← PEX10')).toBeInTheDocument();
    expect(screen.queryByText('Sequence')).toBeNull();
    act(() => engine.highlight({ chrom: 'chr1', position: 2_337_101 }));
    const file = await act(() => engine.exportSvg({ width: 600, highlights: true, guideline: false, title: 'chr1:2,230,000-2,440,000, GRCh37/hg19' }));
    const svg = await file.text();
    expect(file.type).toBe('image/svg+xml');
    expect(svg).toContain('width="820"');
    expect(svg).toContain('chr1:2,230,000-2,440,000, GRCh37/hg19');
    expect(svg).toContain('← PEX10');
    expect(svg).toContain('chr1:2,337,101');
    expect(svg).not.toContain('genome-tracks-guide');
    expect(svg).not.toContain('Sequence');
    expect(container.querySelector('.track-engine-export')).toBeNull();
    act(() => engine.showTracks(['genes']));
    expect(screen.getByText('Sequence')).toBeInTheDocument();
    expect(screen.queryByText('← PEX10')).toBeNull();
    engine.destroy();
    container.remove();
    vi.restoreAllMocks();
  });

  it('draws GM12878 ChromHMM from the file once it is turned on, and exports it', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('score-tracks-column') ? 220 : 1220;
    });
    const container = document.createElement('div');
    document.body.append(container);
    const engine = new TrackEngine(new SampleGenomeTracks(SampleClient.bundled()));
    const region = { chrom: 'chr1', start: 109_792_590, end: 109_842_590 };
    await act(() => engine.mount(container, { label: 'Genome browser', assembly: 'hg19', region, tracks: suggestedTracks.hg19, hidden: hiddenByDefault('hg19') }));
    expect(screen.queryByText('Genome segmentation')).toBeNull();
    act(() => engine.showTracks(['Conservation']));
    expect(screen.getByText('Genome segmentation')).toBeInTheDocument();
    await waitFor(() => expect(container.querySelectorAll('.genome-tracks-segment')).toHaveLength(39));
    expect(container.querySelector('.genome-tracks-segment')).toHaveAttribute('fill', '#CF0BC6');
    const svg = await (await act(() => engine.exportSvg({ width: 600, highlights: true, guideline: true }))).text();
    expect(svg).toContain('GM12878 ChromHMM');
    expect(svg.match(/class="genome-tracks-segment"/g)).toHaveLength(39);
    engine.destroy();
    container.remove();
    vi.restoreAllMocks();
  });

  it('opens each gene’s and segment’s details with the fields humanbase.io shows, read from the files', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('score-tracks-column') ? 220 : 1220;
    });
    const container = document.createElement('div');
    document.body.append(container);
    const engine = new TrackEngine(new SampleGenomeTracks(SampleClient.bundled()));
    const region = { chrom: 'chr1', start: 2_230_000, end: 2_440_000 };
    await act(() => engine.mount(container, { label: 'Genome browser', assembly: 'hg19', region, tracks: suggestedTracks.hg19, hidden: ['Conservation'] }));
    fireEvent.click(await screen.findByRole('button', { name: 'MORN1' }));
    const gene = screen.getByRole('dialog', { name: 'Genes' });
    expect([...gene.querySelectorAll('dl > div')].map((row) => row.textContent)).toEqual(['Methodprotein_coding', 'Locationchr1:2,252,692-2,323,146', 'Score1000']);
    fireEvent.click(await screen.findByRole('button', { name: 'Pol2, 2,303,401 to 2,313,000' }));
    const segment = screen.getByRole('dialog', { name: 'GM12878 ChromHMM' });
    expect([...within(segment).getAllByRole('definition')].map((value) => value.textContent)).toEqual(['chr1:2,303,401-2,313,000', '1000']);
    engine.destroy();
    container.remove();
    vi.restoreAllMocks();
  });
});
