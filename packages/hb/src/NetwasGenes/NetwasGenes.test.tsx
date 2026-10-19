import { fireEvent, render, screen, within } from '@testing-library/react';
import { NetwasGenes } from './NetwasGenes';

const file = `# Tissue: adipose tissue
KRT6B\t-1\t0.561327
LEP\t1\t0.42
ZNF1\t0\t-0.2
`;

const genes = () =>
  within(screen.getByRole('table'))
    .queryAllByRole('rowheader')
    .map((cell) => cell.querySelector('strong')?.textContent);

describe('NetwasGenes', () => {
  it('filters rows without renumbering and links each gene to Networks', () => {
    render(<NetwasGenes file={file} names={{ KRT6B: 'keratin 6B' }} networkHref="/networks/?genes={gene}" />);
    expect(genes()).toEqual(['KRT6B', 'LEP', 'ZNF1']);
    expect(screen.getByRole('link', { name: 'Open in Networks for KRT6B' })).toHaveAttribute('href', '/networks/?genes=KRT6B');
    expect(screen.getByText('(−1)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'GWAS hits' }));
    expect(genes()).toEqual(['LEP']);
    expect(screen.getByRole('cell', { name: '2' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'New candidates' }));
    expect(genes()).toEqual(['KRT6B']);
  });

  it('finds genes by symbol or name and says when nothing matches', () => {
    render(<NetwasGenes file={file} names={{ KRT6B: 'keratin 6B' }} networkHref="/networks/?genes={gene}" />);
    const search = screen.getByRole('searchbox', { name: 'Find a gene' });
    fireEvent.change(search, { target: { value: 'keratin' } });
    expect(genes()).toEqual(['KRT6B']);
    fireEvent.change(search, { target: { value: 'XYZ' } });
    expect(screen.getByText('No genes match “XYZ”')).toBeInTheDocument();
  });
});
