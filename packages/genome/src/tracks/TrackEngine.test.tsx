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

  it('draws each score file on its own, so one that fails leaves the others drawn', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('score-tracks-column') ? 220 : 1220;
    });
    const container = document.createElement('div');
    document.body.append(container);
    const files = new SampleGenomeTracks(SampleClient.bundled());
    vi.spyOn(files, 'scores').mockImplementation((url) => (url.endsWith('missing.bw') ? Promise.reject(new Error('blocked')) : Promise.resolve([{ start: 2_300_000, end: 2_300_000, value: 1 }])));
    vi.spyOn(files, 'covers').mockResolvedValue(true);
    const engine = new TrackEngine(files);
    const tracks = [
      { name: 'Missing', bigWigUrl: 'https://example.org/missing.bw', range: [0, 1] as const },
      { name: 'Yours', bigWigUrl: 'file:1/yours.bw', range: [0, 1] as const },
    ];
    await act(() => engine.mount(container, { label: 'Genome browser', assembly: 'hg19', region: { chrom: 'chr1', start: 2_230_000, end: 2_440_000 }, tracks }));
    expect(await screen.findByText('Missing didn’t load. Move or zoom to try again.')).toBeInTheDocument();
    expect(screen.queryByText('Yours didn’t load. Move or zoom to try again.')).toBeNull();
    expect(container.querySelectorAll('.genome-tracks-bar')).toHaveLength(1);
    engine.destroy();
    container.remove();
    vi.restoreAllMocks();
  });

  it('draws nothing past the recorded sample windows, except the tracks the person added', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('score-tracks-column') ? 220 : 1220;
    });
    const container = document.createElement('div');
    document.body.append(container);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const files = new SampleGenomeTracks(SampleClient.bundled());
    const recorded = files.scores.bind(files);
    const covers = files.covers.bind(files);
    vi.spyOn(files, 'scores').mockImplementation((url, span) => (url.startsWith('file:') ? Promise.resolve([{ start: 3_000_000, end: 3_000_000, value: 1 }]) : recorded(url, span)));
    vi.spyOn(files, 'covers').mockImplementation((assembly, span, file) => (file?.startsWith('file:') ? Promise.resolve(true) : covers(assembly, span, file)));
    const engine = new TrackEngine(files);
    const tracks = [
      { name: 'Conservation', bigWigUrl: 'https://humanbase.s3.amazonaws.com/tracks/phastCons46way.bw', range: [0, 1] as const },
      { name: 'Yours', bigWigUrl: 'file:1/yours.bw', range: [0, 1] as const },
    ];
    await act(() => engine.mount(container, { label: 'Genome browser', assembly: 'hg19', region: { chrom: 'chr3', start: 2_990_000, end: 3_010_000 }, tracks }));
    await waitFor(() => expect(container.querySelectorAll('.genome-tracks-bar')).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect([...container.querySelectorAll('.genome-tracks-note')].map((note) => note.textContent)).toEqual(['Zoom in to under 142 bp to read the bases.']);
    expect(screen.queryByText(/didn’t load/)).toBeNull();
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

  it('draws the tracks in the page’s order, with a score track’s height and range, and gives each header its menu', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('score-tracks-column') ? 220 : 1220;
    });
    const container = document.createElement('div');
    document.body.append(container);
    const engine = new TrackEngine(new SampleGenomeTracks(SampleClient.bundled()));
    const dna = { name: 'DNA disease impact score', bigWigUrl: 'https://s3-us-west-2.amazonaws.com/humanbase/tracks/dis_dna.bw', range: [-0.4, 3] as const };
    const region = { chrom: 'chr1', start: 2_230_000, end: 2_440_000 };
    const trackMenu = (id: string) => [{ label: `Remove ${id}` }];
    await act(() => engine.mount(container, { label: 'Genome browser', assembly: 'hg19', region, tracks: [dna], arrangement: { order: ['genes'], settings: {} }, trackMenu }));
    const names = () => [...container.querySelectorAll('.track-header-name')].map((name) => name.textContent);
    expect(names()).toEqual(['Genes', 'Sequence', 'DNA disease impact score']);
    expect(screen.getByRole('button', { name: 'DNA disease impact score track options' })).toBeInTheDocument();
    const rows = () => (container.querySelector('.score-tracks-column') as HTMLElement).style.gridTemplateRows;
    expect(rows()).toContain('30px 60px 60px 60px');
    act(() => engine.arrangeTracks({ order: [], settings: { 'DNA disease impact score': { height: 120, range: [0, 4] } } }));
    expect(names()).toEqual(['Sequence', 'DNA disease impact score', 'Genes']);
    expect(rows()).toContain('30px 60px 120px');
    engine.destroy();
    container.remove();
    vi.restoreAllMocks();
  });

  it('opens a score bar’s details with Location and the value read from the file', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('score-tracks-column') ? 220 : 1220;
    });
    const container = document.createElement('div');
    document.body.append(container);
    const engine = new TrackEngine(new SampleGenomeTracks(SampleClient.bundled()));
    const dna = { name: 'DNA disease impact score', bigWigUrl: 'https://s3-us-west-2.amazonaws.com/humanbase/tracks/dis_dna.bw', range: [-0.4, 3] as const };
    const region = { chrom: 'chr1', start: 2_230_000, end: 2_440_000 };
    await act(() => engine.mount(container, { label: 'Genome browser', assembly: 'hg19', region, tracks: [dna] }));
    const scores = await screen.findByRole('group', { name: 'DNA disease impact score, items' });
    fireEvent.click(within(scores).getByRole('button', { name: '3.62 at 2,346,202' }));
    const popover = screen.getByRole('dialog', { name: 'DNA disease impact score' });
    // The bundled sample is rounded to 3 decimals; the live file gives 3.6189358234405518.
    expect([...popover.querySelectorAll('dl > div')].map((row) => row.textContent)).toEqual(['Locationchr1:2,346,202-2,346,202', 'Score3.619']);
    engine.destroy();
    container.remove();
    vi.restoreAllMocks();
  });
});
