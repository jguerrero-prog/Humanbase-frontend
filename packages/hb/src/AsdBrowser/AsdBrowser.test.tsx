import { fireEvent, render, screen } from '@testing-library/react';
import { AsdBrowser, type AsdBrowserProps } from './AsdBrowser';

const props: AsdBrowserProps = {
  crumbs: [{ label: 'Sequence analysis', href: '#' }, { label: 'ASD Browser' }],
  subtitle: 'Predicted effects of de novo noncoding variants in autism.',
  context: [{ name: 'Variants', value: '127,140' }],
  variants: [
    { chromosome: 'chr1', position: 778_112, ref: 'G', alt: 'A', individual: '13373-p1', dnaScore: 1.62, nearestGene: 'SAMD11', tssDistance: 99_381, rnaScore: null, rnaGene: '' },
  ],
  total: 127_133,
  location: 'chr1:2,230,000-2,440,000',
  assembly: 'GRCh37/hg19',
  widthHelp: '210 kb shown.',
  heatmap: {
    title: 'z-score',
    summary: 'Illustrative values.',
    scale: { title: 'z-score', kind: 'diverging', edges: [-5, -3, -2, 2, 3, 5], words: ['Lowers', 'Raises'] },
    columns: [{ label: '2,232,996', position: 2_232_996 }],
    rows: [{ label: 'DNA feature 1', values: [2.4] }],
  },
  heatmapNote: 'Illustrative values.',
  examples: ['CHD8'],
  notice: 'Data use terms.',
  noticeKey: 'test:asd-notice',
};

describe('AsdBrowser', () => {
  afterEach(() => window.localStorage.clear());

  it('switches between the browser and the table on one page', () => {
    render(<AsdBrowser {...props} />);
    expect(screen.getByRole('region', { name: 'Genome browser and heatmap' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Table' }));
    expect(screen.getByRole('rowheader', { name: 'chr1:778,112' })).toBeInTheDocument();
    expect(screen.getByText('1.620').tagName).toBe('STRONG');
    expect(screen.getAllByText('Not available')).toHaveLength(2);
    expect(screen.getByText('127,133 variants')).toBeInTheDocument();
  });

  it('fills the search from an example', () => {
    render(<AsdBrowser {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'CHD8' }));
    expect(screen.getByRole('searchbox', { name: 'Find a gene, region or position' })).toHaveValue('CHD8');
  });

  it('remembers a dismissed data-use notice in this browser', () => {
    const { unmount } = render(<AsdBrowser {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByText('Data use terms.')).not.toBeInTheDocument();
    unmount();
    render(<AsdBrowser {...props} />);
    expect(screen.queryByText('Data use terms.')).not.toBeInTheDocument();
  });
});
