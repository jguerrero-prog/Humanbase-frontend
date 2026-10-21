import { render, screen, within } from '@testing-library/react';
import { SegmentTable } from './SegmentTable';

const track = { name: 'GM12878 ChromHMM', meta: 'Genome segmentation', state: 'ready' as const, data: [{ start: 109_816_601, end: 109_818_400, name: 'ReprW', color: '#7F7F7F' }] };

describe('SegmentTable', () => {
  it('lists each segment’s state, start, end and length behind View as table', () => {
    render(<SegmentTable track={track} where="chr1:109,792,590-109,842,590, GRCh37/hg19" />);
    expect(screen.getByText('View as table')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'GM12878 ChromHMM segments in chr1:109,792,590-109,842,590, GRCh37/hg19', hidden: true });
    expect(within(table).getByRole('rowheader', { name: 'ReprW', hidden: true })).toBeInTheDocument();
    expect(within(table).getAllByRole('cell', { hidden: true }).map((cell) => cell.textContent)).toEqual(['109,816,601', '109,818,400', '1,800 bp']);
  });

  it('says when nothing is in view or the file didn’t load', () => {
    const { rerender } = render(<SegmentTable track={{ ...track, data: [] }} where="chr1" />);
    expect(screen.getByText('No segments in view.')).toBeInTheDocument();
    rerender(<SegmentTable track={{ ...track, state: 'failed', data: undefined }} where="chr1" />);
    expect(screen.getByText('GM12878 ChromHMM didn’t load.')).toBeInTheDocument();
  });
});
