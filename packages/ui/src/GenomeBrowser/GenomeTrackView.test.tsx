import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  describe('item details', () => {
    const details = [['Method', 'protein_coding'], ['Location', 'chr1:2,336,000-2,345,000'], ['Score', '1000']] as const;
    const segments = [
      { start: 101, end: 300, name: 'ReprW', color: '#7F7F7F', details: [['Location', 'chr1:101-300'], ['Score', '1000']] as const },
      { start: 301, end: 400, name: 'Tss', color: '#FF0000', details: [['Location', 'chr1:301-400'], ['Score', '900']] as const },
    ];
    const view = (start = 1, onPan?: (pixels: number, done: boolean) => void) => (
      <GenomeTrackView
        start={start}
        end={1000}
        width={1000}
        onPan={onPan}
        segments={[{ name: 'GM12878 ChromHMM', meta: 'Genome segmentation', state: 'ready', data: segments }]}
        genes={{ name: 'Genes', meta: 'GENCODE 19', state: 'ready', data: [{ ...gene, start: 500, end: 900, details }] }}
      />
    );

    it('opens on click with the track name and only the item’s fields, and moves focus into it', async () => {
      const { container } = render(view());
      await userEvent.click(container.querySelector('.genome-tracks-gene-name') as Element);
      const popover = screen.getByRole('dialog', { name: 'Genes' });
      expect([...popover.querySelectorAll('dt')].map((term) => term.textContent)).toEqual(['Method', 'Location', 'Score']);
      expect(popover).toHaveTextContent('protein_coding');
      expect(popover).toHaveTextContent('chr1:2,336,000-2,345,000');
      expect(popover.querySelector('.data-tooltip-hint')).toBeNull();
      expect(within(popover).getByRole('button', { name: 'Close' })).toHaveFocus();
      expect(screen.getByRole('button', { name: 'PEX10' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('opens on Enter from the keyboard, moves between a track’s items with arrow keys, and returns focus on Escape', async () => {
      render(view());
      const reprW = screen.getByRole('button', { name: 'ReprW, 101 to 300' });
      const tss = screen.getByRole('button', { name: 'Tss, 301 to 400' });
      expect(reprW).toHaveAttribute('tabindex', '0');
      expect(tss).toHaveAttribute('tabindex', '-1');
      reprW.focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(tss).toHaveFocus();
      expect(tss).toHaveAttribute('tabindex', '0');
      await userEvent.keyboard('{Enter}');
      const popover = screen.getByRole('dialog', { name: 'GM12878 ChromHMM' });
      expect(popover).toHaveTextContent('chr1:301-400');
      expect(popover).toHaveTextContent('900');
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(tss).toHaveFocus();
    });

    it('shows one at a time, and closes on the close button, a click outside, a drag or a move of the view', async () => {
      const onPan = vi.fn();
      const { container, rerender } = render(view(1, onPan));
      const area = container.querySelector('.genome-tracks-area') as SVGSVGElement;
      area.setPointerCapture = vi.fn();
      const [first, second] = [...container.querySelectorAll('.genome-tracks-segment')] as Element[];
      await userEvent.click(first as Element);
      await userEvent.click(second as Element);
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
      expect(screen.getByRole('dialog')).toHaveTextContent('chr1:301-400');
      await userEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.getByRole('button', { name: 'Tss, 301 to 400' })).toHaveFocus();

      await userEvent.click(first as Element);
      await userEvent.click(document.body);
      expect(screen.queryByRole('dialog')).toBeNull();

      await userEvent.click(first as Element);
      fireEvent.pointerDown(area, { button: 0, clientX: 300, pointerId: 1 });
      fireEvent.pointerMove(area, { clientX: 250, pointerId: 1 });
      fireEvent.pointerUp(area, { clientX: 250, pointerId: 1 });
      fireEvent.click(first as Element);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(onPan).toHaveBeenLastCalledWith(-50, true);

      await userEvent.click(first as Element);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      rerender(view(11, onPan));
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('leaves items without details out of the keyboard and the popover', async () => {
      const { container } = render(<GenomeTrackView start={1} end={1000} width={1000} genes={{ name: 'Genes', meta: 'GENCODE 19', state: 'ready', data: [gene] }} />);
      expect(screen.queryByRole('button')).toBeNull();
      expect(container.querySelector('[data-item]')).toBeNull();
    });

    it('opens a score bar’s details on click or from the keyboard, with the value as given, and nothing between bars', async () => {
      const values = [
        { start: 200, end: 200, value: 3.6189358234405518, details: [['Location', 'chr1:200-200'], ['Score', '3.6189358234405518']] as const },
        { start: 600, end: 600, value: -0.25, details: [['Location', 'chr1:600-600'], ['Score', '-0.25']] as const },
        { start: 800, end: 900, value: 0.8728139370302611, details: [['Location', 'chr1:800-900'], ['Score', '0.8728139370302611']] as const },
      ];
      const { container } = render(<GenomeTrackView start={1} end={1000} width={1000} scores={[{ name: 'DNA disease impact score', meta: 'Model score, −0.4 to 3', state: 'ready', data: { min: -0.4, max: 3, values } }]} />);
      const bars = [...container.querySelectorAll('.genome-tracks-bar')];
      expect(bars.map((bar) => bar.getAttribute('data-item'))).toEqual(['DNA disease impact score 200', 'DNA disease impact score 600', 'DNA disease impact score 800']);

      await userEvent.click(container.querySelector('.genome-tracks-area') as Element);
      expect(screen.queryByRole('dialog')).toBeNull();

      await userEvent.click(bars[0] as Element);
      const popover = screen.getByRole('dialog', { name: 'DNA disease impact score' });
      expect([...popover.querySelectorAll('dl > div')].map((row) => row.textContent)).toEqual(['Locationchr1:200-200', 'Score3.6189358234405518']);
      await userEvent.keyboard('{Escape}');

      const first = screen.getByRole('button', { name: '3.62 at 200' });
      expect(first).toHaveFocus();
      expect(within(screen.getByRole('group', { name: 'DNA disease impact score, items' })).getAllByRole('button').map((button) => button.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
      await userEvent.keyboard('{End}');
      const last = screen.getByRole('button', { name: '0.87 at 800 to 900' });
      expect(last).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}');
      expect(screen.getByRole('button', { name: '-0.25 at 600' })).toHaveFocus();
      await userEvent.keyboard('{Home}');
      expect(first).toHaveFocus();
      await userEvent.keyboard('{End}{ }');
      expect(screen.getByRole('dialog', { name: 'DNA disease impact score' })).toHaveTextContent('0.8728139370302611');
      expect(last).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
