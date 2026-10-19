import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneMatchList } from '../GeneMatch/GeneMatchList';
import { EditGenesDialog } from './EditGenesDialog';
import { GeneIdsMenu } from './GeneIdsMenu';
import { GraphToolbar } from './GraphToolbar';
import { JobDetails } from './JobDetails';
import { NetwasGeneTable } from './NetwasGeneTable';
import { RankedAnnotationTable } from './RankedAnnotationTable';
import { ResultHeader } from './ResultHeader';
import { ResultLayout } from './ResultLayout';

describe('ResultHeader', () => {
  it('names the result, its settings and its views', () => {
    render(
      <ResultHeader
        crumbs={[{ label: 'Networks', href: '/networks/' }, { label: 'IL1B' }]}
        title="IL1B"
        subtitle="interleukin 1 beta"
        context={[{ name: 'Data version', value: 'GIANT' }]}
        tabs={[
          { value: 'network', label: 'Tissue network' },
          { value: 'expression', label: 'Tissue expression' },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'IL1B interleukin 1 beta' })).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Settings behind this result' })).getByText('GIANT')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tissue network', selected: true })).toBeInTheDocument();
  });
});

describe('ResultLayout', () => {
  it('labels the main view and the companion', () => {
    render(<ResultLayout header={<p>Header</p>} mainLabel="Network" main={<p>Graph</p>} companionLabel="Genes" companion={<p>Table</p>} />);
    expect(screen.getByRole('region', { name: 'Network' })).toHaveTextContent('Graph');
    expect(screen.getByRole('region', { name: 'Genes' })).toHaveTextContent('Table');
  });
});

describe('GraphToolbar', () => {
  it('names each icon button and offers the table', async () => {
    const onViewTable = vi.fn();
    const onZoom = vi.fn();
    render(<GraphToolbar label="Graph controls" groups={[[{ label: 'Zoom in', icon: 'zoom-in', onSelect: onZoom }], [{ label: 'Pause layout', icon: 'pause', pressed: true }]]} onViewTable={onViewTable} />);
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onZoom).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Pause layout' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'View as table' }));
    expect(onViewTable).toHaveBeenCalled();
  });
});

describe('GeneIdsMenu', () => {
  it('opens a list of outside links and closes on Escape', async () => {
    render(<GeneIdsMenu gene="IL1B" links={[{ source: 'MIM', id: '147720', href: 'https://omim.org/entry/147720', site: 'OMIM' }]} />);
    const button = screen.getByRole('button', { name: 'Gene IDs' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /MIM 147720/ })).toHaveAttribute('target', '_blank');
    await userEvent.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });
});

describe('EditGenesDialog', () => {
  const gene = (symbol: string, entrez: string) => ({ id: symbol, typed: [symbol], status: 'matched' as const, candidates: [{ entrez, symbol, name: `${symbol} gene` }] });

  it('removes genes until one is left', async () => {
    const onRemove = vi.fn();
    const { rerender } = render(<EditGenesDialog inline list={new GeneMatchList([gene('IL1B', '3553'), gene('TNF', '7124')])} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove TNF' }));
    expect(onRemove).toHaveBeenCalledWith('TNF');
    rerender(<EditGenesDialog inline list={new GeneMatchList([gene('IL1B', '3553')])} onRemove={onRemove} />);
    expect(screen.queryByRole('button', { name: 'Remove IL1B' })).not.toBeInTheDocument();
    expect(screen.getByText(/The last gene can’t be removed/)).toBeInTheDocument();
  });
});

describe('RankedAnnotationTable', () => {
  const assay = { source: 'UniProt-GOA', code: 'IDA', meaning: 'Inferred from direct assay', publication: { title: 'A study', authors: 'A Author', journal: 'J, 2006' } };
  const rows = [
    {
      name: 'drug metabolic process',
      identifier: 'GO:0017144',
      confidence: 1,
      evidence: [assay],
    },
    { name: 'cervical cancer', identifier: 'DOID:4362', confidence: 0.92 },
  ];

  it('opens experimental rows and marks predicted ones', async () => {
    render(<RankedAnnotationTable caption="Processes" termLabel="Process" scoreLabel="IL1B confidence" rows={rows} />);
    const toggle = screen.getByRole('button', { name: 'drug metabolic process' });
    expect(screen.queryByRole('list', { name: 'Evidence for drug metabolic process' })).not.toBeInTheDocument();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('list', { name: 'Evidence for drug metabolic process' })).toHaveTextContent('Inferred from direct assay');
    expect(screen.queryByRole('button', { name: 'cervical cancer' })).not.toBeInTheDocument();
    expect(screen.getByText('Predicted')).toBeInTheDocument();
  });

  it('lists a source that has no publication', async () => {
    const electronic = { source: 'UniProt-GOA', code: 'IEA', meaning: 'Inferred from electronic annotation' };
    const row = { name: 'drug metabolic process', identifier: 'GO:0017144', confidence: 1, sources: 2, evidence: [assay, electronic] };
    render(<RankedAnnotationTable caption="Processes" termLabel="Process" scoreLabel="IL1B confidence" rows={[row]} />);
    await userEvent.click(screen.getByRole('button', { name: 'drug metabolic process' }));
    const items = within(screen.getByRole('list', { name: 'Evidence for drug metabolic process' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[1]).toHaveTextContent('IEAInferred from electronic annotation');
    expect(items[1]).toHaveTextContent('No publication listed');
  });

  it('leaves out the code badge when a source gives no evidence code', async () => {
    const omim = { source: 'OMIM', code: '', meaning: '' };
    render(<RankedAnnotationTable caption="Diseases" termLabel="Disease" scoreLabel="TNF confidence" rows={[{ name: 'asthma', identifier: 'DOID:2841', confidence: 1, sources: 1, evidence: [omim] }]} />);
    await userEvent.click(screen.getByRole('button', { name: 'asthma' }));
    const item = within(screen.getByRole('list', { name: 'Evidence for asthma' })).getByRole('listitem');
    expect(item).toHaveTextContent('OMIMNo publication listed');
  });
});

describe('NetwasGeneTable', () => {
  it('shows the label in words with the raw value, and signs negative scores', () => {
    render(<NetwasGeneTable caption="Genes" rows={[{ rank: 7, symbol: 'ZNF1', label: 0, gwas: 'Not used', score: -0.2, href: '#ZNF1' }]} />);
    const row = screen.getByRole('row', { name: /ZNF1/ });
    expect(row).toHaveTextContent('Not used (0)');
    expect(row).toHaveTextContent('−0.200');
    expect(within(row).getByRole('cell', { name: '7' })).toBeInTheDocument();
  });

  it('says so when no rows match', () => {
    render(<NetwasGeneTable caption="Genes" rows={[]} empty={{ title: 'No GWAS hits in this result' }} />);
    expect(screen.getByText('No GWAS hits in this result')).toBeInTheDocument();
  });
});

describe('JobDetails', () => {
  it('pairs each field with its value', () => {
    render(<JobDetails items={[{ term: 'GWAS file', value: 'bmi-2012.out.txt', mono: true }]} />);
    expect(screen.getByText('GWAS file').nextElementSibling).toHaveTextContent('bmi-2012.out.txt');
  });
});
