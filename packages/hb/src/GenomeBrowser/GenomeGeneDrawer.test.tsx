import { Humanbase, HumanbaseProvider, SampleClient } from '@humanbase/data';
import type { GenomeGene } from '@humanbase/genome';
import { render, screen, within } from '@testing-library/react';
import { GenomeGeneDrawer } from './GenomeGeneDrawer';

const celsr2: GenomeGene = { name: 'CELSR2', chrom: 'chr1', start: 109_792_641, end: 109_818_372, strand: '+', type: 'protein_coding', source: 'GENCODE 19' };

const renderDrawer = (gene = celsr2) =>
  render(
    <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
      <GenomeGeneDrawer gene={gene} assembly="hg19" onClose={() => {}} />
    </HumanbaseProvider>,
  );

describe('GenomeGeneDrawer', () => {
  it('shows where the genes track places the gene, then its recorded name, aliases and IDs, and opens it in Networks', async () => {
    renderDrawer();
    const drawer = screen.getByRole('dialog', { name: 'CELSR2' });
    expect(drawer).toHaveTextContent('chr1:109,792,641-109,818,372, forward strand (GRCh37/hg19)');
    // While the record loads, its sections show skeleton lines where the aliases and IDs will be.
    expect(within(drawer).getByRole('region', { name: 'Also known as' }).querySelectorAll('.skeleton')).toHaveLength(1);
    expect(within(drawer).getByRole('region', { name: 'Gene IDs' }).querySelectorAll('.skeleton')).toHaveLength(4);
    expect(drawer).toHaveTextContent('protein_coding (GENCODE 19)');
    expect(await within(drawer).findByText('cadherin EGF LAG seven-pass G-type receptor 2')).toBeInTheDocument();
    expect(drawer).toHaveTextContent('CDHF10, ADGRC2, EGFL2, Flamingo1, MEGF3');
    expect(within(drawer).getByRole('link', { name: /^Ensembl ENSG00000143126/ })).toHaveAttribute('href', 'https://www.ensembl.org/Gene/Summary?g=ENSG00000143126');
    expect(within(drawer).getByRole('link', { name: 'Open CELSR2 in Networks' })).toHaveAttribute('href', expect.stringContaining('entrez=1952'));
  });

  it('keeps the track’s details and says why when the sample data has no record for the gene', async () => {
    renderDrawer({ ...celsr2, name: 'MYBPHL', start: 109_838_000, end: 109_843_000, strand: '-' });
    expect(await screen.findByText('Sample data covers a few genes')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'MYBPHL' })).toHaveTextContent('reverse strand');
    expect(screen.queryByRole('link', { name: /in Networks/ })).toBeNull();
  });
});
