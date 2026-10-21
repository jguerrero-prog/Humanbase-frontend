import { fireEvent, render, screen } from '@testing-library/react';
import { GenomeTrackView } from './GenomeTrackView';

const gene = { name: 'PEX10', strand: '-' as const, start: 2_336_000, end: 2_345_000, exons: [[2_336_000, 2_336_500]] as const, coding: [[2_336_100, 2_336_400]] as const };
const score = { min: -0.4, max: 3, values: [{ start: 2_337_101, end: 2_337_101, value: 3.427 }] };

describe('GenomeTrackView', () => {
  it('draws headers, genes with strand, and the selected variant’s value and pill', () => {
    const { container } = render(
      <GenomeTrackView
        start={2_230_000}
        end={2_440_000}
        width={1000}
        sequence={{ name: 'Sequence', meta: 'GRCh37/hg19', state: 'ready' }}
        scores={[{ name: 'DNA disease impact score', meta: 'Model score, −0.4 to 3', state: 'ready', data: score }]}
        genes={{ name: 'Genes', meta: 'GENCODE 19', state: 'ready', data: [gene] }}
        selected={{ position: 2_337_101, label: 'chr1:2,337,101' }}
      />,
    );
    expect(screen.getByText('GENCODE 19')).toBeInTheDocument();
    expect(screen.getByText('← PEX10')).toBeInTheDocument();
    expect(screen.getByText('3.43')).toBeInTheDocument();
    expect(screen.getByText('chr1:2,337,101')).toBeInTheDocument();
    expect(screen.getByText('Zoom in to under 142 bp to read the bases.')).toBeInTheDocument();
    expect(container.querySelector('.genome-tracks-bar.is-selected')).not.toBeNull();
  });

  it('says when a track is loading or failed', () => {
    render(<GenomeTrackView start={1} end={100} width={600} genes={{ name: 'Genes', meta: 'GENCODE 19', state: 'loading' }} scores={[{ name: 'RNA disease impact score', meta: '', state: 'failed' }]} />);
    expect(screen.getByText('Loading Genes…')).toBeInTheDocument();
    expect(screen.getByText('RNA disease impact score didn’t load. Move or zoom to try again.')).toBeInTheDocument();
  });

  it('draws segments in the file’s own colors and names each one in the Data tooltip on hover', () => {
    const segments = [
      { start: 101, end: 300, name: 'ReprW', color: '#7F7F7F' },
      { start: 301, end: 400, name: 'Tss', color: '#FF0000' },
    ];
    const { container } = render(<GenomeTrackView start={1} end={1000} width={1000} segments={[{ name: 'GM12878 ChromHMM', meta: 'Genome segmentation', state: 'ready', data: segments }]} />);
    expect(screen.getByText('Genome segmentation')).toBeInTheDocument();
    const boxes = [...container.querySelectorAll('.genome-tracks-segment')];
    expect(boxes.map((box) => [box.getAttribute('fill'), box.getAttribute('width'), box.getAttribute('height')])).toEqual([
      ['#7F7F7F', '200', '8'],
      ['#FF0000', '100', '8'],
    ]);
    fireEvent.pointerEnter(boxes[0] as Element, { clientX: 150 });
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('ReprW');
    expect(tip).toHaveTextContent('GM12878 ChromHMM');
    expect(tip).toHaveTextContent('Start101');
    expect(tip).toHaveTextContent('Length200 bp');
    fireEvent.pointerLeave(boxes[0] as Element);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('says when a segment track has nothing to draw', () => {
    render(<GenomeTrackView start={1} end={100} width={600} segments={[{ name: 'GM12878 ChromHMM', meta: '', state: 'ready', data: [], empty: 'Zoom in to under 5 Mb to see GM12878 ChromHMM.' }]} />);
    expect(screen.getByText('Zoom in to under 5 Mb to see GM12878 ChromHMM.')).toBeInTheDocument();
  });

  it('reports a drag in pixels', () => {
    const onPan = vi.fn();
    const { container } = render(<GenomeTrackView start={1} end={100} width={600} onPan={onPan} />);
    const area = container.querySelector('svg') as SVGSVGElement;
    area.setPointerCapture = vi.fn();
    fireEvent.pointerDown(area, { button: 0, clientX: 300, pointerId: 1 });
    fireEvent.pointerMove(area, { clientX: 250, pointerId: 1 });
    fireEvent.pointerUp(area, { clientX: 200, pointerId: 1 });
    expect(onPan).toHaveBeenNthCalledWith(1, -50, false);
    expect(onPan).toHaveBeenLastCalledWith(-100, true);
  });
});
