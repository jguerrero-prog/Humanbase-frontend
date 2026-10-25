import { Humanbase, HumanbaseProvider, SampleClient } from '@humanbase/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deepseaFormLink } from './DeepseaForm';
import { DeepseaJobView } from './DeepseaJobView';

// The effects card opens on Heatmap, as on humanbase.io.
async function openStrongest() {
  const heatmap = await screen.findByRole('tab', { name: 'Heatmap' }, { timeout: 5000 });
  expect(heatmap).toHaveAttribute('aria-selected', 'true');
  await userEvent.click(screen.getByRole('tab', { name: 'Strongest effects' }));
}

const job = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function renderJob(id: string, variant?: string) {
  render(
    <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
      <DeepseaJobView id={id} variant={variant} />
    </HumanbaseProvider>,
  );
}

describe('DeepseaJobView', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('shows the Seqweaver example: scores, the first variant and its strongest effects', async () => {
    renderJob('76aea8fe-8ec7-4698-a193-a186c7665edb');
    expect(await screen.findByRole('heading', { level: 1, name: 'Untitled Seqweaver job' }, { timeout: 5000 })).toBeInTheDocument();
    expect(await screen.findByText('Molecular effects of chr1:109,817,590 G>T', {}, { timeout: 5000 })).toBeInTheDocument();
    await openStrongest();
    expect(await screen.findByText('LIN28A', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('10 variants, colored by chromosome; position also carries the chromosome.')).toBeInTheDocument();
  });

  it('shows a finished FASTA job as humanbase.io does: its files to download, with no score plot', async () => {
    const id = 'dbebecbe-f58a-4ce4-b4ba-04af819a9ad7';
    renderJob(id);
    expect(await screen.findByRole('heading', { level: 1, name: 'Untitled Seqweaver job' }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getAllByRole('status').map((status) => status.textContent)).toContain('Finished');
    expect(screen.getByRole('link', { name: 'Download everything (tar.gz)' })).toHaveAttribute('href', `https://s3-us-west-2.amazonaws.com/humanbase/deepsea/jobs/${id}/${id}.tar.gz`);
    const files = screen.getByRole('table', { name: 'Result files' });
    expect(within(files).getByRole('link', { name: 'Download Probability' })).toHaveAttribute('href', `https://s3-us-west-2.amazonaws.com/humanbase/deepsea/jobs/${id}/${id}_feature_predictions.tsv.gz`);
    expect(within(files).getByText('Every feature for every sequence')).toBeInTheDocument();
    expect(within(files).getByRole('link', { name: 'Download Your query' })).toBeInTheDocument();
    expect(screen.getByText('Sequences, FASTA')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Score' })).not.toBeInTheDocument();
  });

  it('reads Sei effects as sequence classes', async () => {
    renderJob('2e18fedf-3de7-4d08-a894-9a937a2b860b', 'chr7-49813589-G-C');
    expect(await screen.findByText('Molecular effects of chr7:49,813,589 G>C', {}, { timeout: 5000 })).toBeInTheDocument();
    await openStrongest();
    expect(await screen.findByText('P Promoter', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('Raises, 13 sequence classes')).toBeInTheDocument();
    expect(screen.getByText('strong, 2 or more')).toBeInTheDocument();
  });

  it('colors the Sei plot by sequence class on request, with humanbase.io’s groups', async () => {
    renderJob('2e18fedf-3de7-4d08-a894-9a937a2b860b');
    const style = await screen.findByRole('combobox', { name: 'Color style' }, { timeout: 5000 });
    expect(style).toHaveTextContent('Chromosome');
    expect(screen.queryByRole('group', { name: /^Sequence class$/ })).not.toBeInTheDocument();
    await userEvent.click(style);
    await userEvent.click(screen.getByRole('option', { name: 'Sequence class' }));
    const legend = screen.getByRole('group', { name: /^Sequence class$/ });
    expect(within(legend).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Enhancer', 'CTCF', 'Polycomb', 'Promoter', 'Heterochomatin', 'Transcription', 'Transcription factor', 'Low signal']);
    expect(screen.getByText(/colored by the sequence class each changes most/)).toBeInTheDocument();
  });

  it('offers every Sei score humanbase.io plots, the summary then 40 sequence classes, loading each when chosen', async () => {
    renderJob('2e18fedf-3de7-4d08-a894-9a937a2b860b');
    const [picker] = await screen.findAllByRole('combobox', { name: 'Score' }, { timeout: 5000 });
    if (!picker) throw new Error('No score picker');
    expect(picker).toHaveTextContent('Max sequence class score');
    await userEvent.click(picker);
    const summary = screen.getByRole('group', { name: 'Summary' });
    expect(within(summary).getAllByRole('option').map((option) => option.textContent)).toEqual(['Max sequence class score']);
    const classes = within(screen.getByRole('group', { name: 'Sequence classes' })).getAllByRole('option');
    expect(classes).toHaveLength(40);
    expect(classes[0]).toHaveTextContent('CTCF CTCF-Cohesin');
    await userEvent.type(screen.getByRole('combobox', { name: 'Filter scores' }), 'promoter');
    await userEvent.click(screen.getByRole('option', { name: 'P Promoter' }));
    expect(await screen.findByRole('columnheader', { name: /P Promoter/ }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /Max class score/ })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Variants plotted by P Promoter' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')[1]).toHaveTextContent(/VWC2.*2\.01/);
    await userEvent.click(picker);
    await userEvent.click(screen.getByRole('option', { name: 'TN1 Transcription' }));
    expect(await screen.findByText('The sample data doesn’t include this score', {}, { timeout: 5000 })).toBeInTheDocument();
  }, 20_000);

  it('links each model’s score type documentation, as humanbase.io does', async () => {
    renderJob('76aea8fe-8ec7-4698-a193-a186c7665edb');
    await screen.findByText('Molecular effects of chr1:109,817,590 G>T', {}, { timeout: 5000 });
    const links = await screen.findAllByRole('link', { name: /Score type documentation/ }, { timeout: 5000 });
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/docs/seqweaver/#output', '/docs/seqweaver/#output']);
    expect(screen.queryByRole('combobox', { name: 'Color style' })).not.toBeInTheDocument();
  });

  it('reads ExPecto effects as tissues, with their resource and system', async () => {
    renderJob('e504e3cc-6a9a-4f35-99e3-9185d6f5c4a1', 'chr5-134871851-A-G');
    expect(await screen.findByRole('heading', { level: 1, name: 'Untitled ExPecto job' }, { timeout: 5000 })).toBeInTheDocument();
    await openStrongest();
    expect(await screen.findByText('Fallopian Tube', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getAllByText('GTEx, reproductive system')[0]).toBeInTheDocument();
    expect(screen.getByText('strong, 0.1 or more')).toBeInTheDocument();
  });

  it('sends a failed job back to its form: ExPecto to Submit variants, Beluga and region scan to Variant effects', () => {
    expect(deepseaFormLink('expecto')).toBe('/expression-effects/?tab=submit-variants');
    expect(deepseaFormLink('beluga')).toBe('/variant-effects/?model=beluga');
    expect(deepseaFormLink('insilico')).toBe('/variant-effects/?tab=region-scan');
  });

  it('lists the files a running job will write', async () => {
    renderJob(job(112));
    expect(await screen.findByRole('heading', { level: 1, name: 'Untitled Beluga job' }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: /Your query/ })).toBeInTheDocument();
    const crumbs = within(screen.getByRole('navigation', { name: 'Breadcrumb' }));
    expect(crumbs.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Variants & sequences', 'Beluga', 'Untitled Beluga job']);
    expect(crumbs.getByRole('link', { name: 'Beluga' })).toHaveAttribute('href', '/variant-effects/?model=beluga');
  });

  it('says why a job failed', async () => {
    renderJob(job(121));
    expect(await screen.findByText('Failed: chr23 is not a chromosome on GRCh37/hg19', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Run Beluga again' })).toHaveAttribute('href', '/variant-effects/?model=beluga');
  });

  it('explains a link to no job', async () => {
    renderJob(job(0));
    expect(await screen.findByText('This job isn’t available', {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('shows every substitution of the in silico mutagenesis example for HepG2 / CEBPB', async () => {
    renderJob('0576e894-a2c5-48bb-9bdf-227962495d5f');
    expect(await screen.findByRole('heading', { level: 1, name: 'Untitled region scan job' }, { timeout: 5000 })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Effect of every substitution on HepG2 / CEBPB' }, { timeout: 5000 })).toBeInTheDocument();
    // Opens on the strongest position, 999, with the 91-position window centered on it.
    expect(await screen.findByRole('grid', { name: 'Substitutions at positions 954 to 1,044' }, { timeout: 5000 })).toBeInTheDocument();
    const detail = screen.getByRole('region', { name: 'Position 999' });
    expect(detail).toHaveTextContent('chr1:109,817,590 · reference T');
    expect(detail).toHaveTextContent('A−4.63C−4.00G−4.24TReference');
    expect(screen.getByRole('slider', { name: 'Window along the sequence' })).toHaveAttribute('aria-valuenow', '954');
    expect(screen.getByRole('link', { name: /Log-fold change score documentation/ })).toHaveAttribute('href', '/docs/in-silico-mutagenesis/#output');
  });

  it('colors the in silico mutagenesis map by the feature’s 1st, 50th and 99th percentiles, as humanbase.io does', async () => {
    renderJob('0576e894-a2c5-48bb-9bdf-227962495d5f');
    const legend = await screen.findByRole('group', { name: 'Log2 fold change' }, { timeout: 5000 });
    // The recorded result's percentiles: −0.783, 0.004 and 0.832.
    expect(legend.querySelector('.legend-edges')).toHaveTextContent('−0.783−0.521−0.2580.280.5560.832');
    expect(legend).toHaveTextContent('Mutation lowersMutation raises');
    expect(screen.getByText(/Colors follow this feature’s 1st, 50th and 99th percentiles/)).toBeInTheDocument();
  });

  it('lists the strongest positions under the map and shows one on request', async () => {
    renderJob('0576e894-a2c5-48bb-9bdf-227962495d5f');
    const table = await screen.findByRole('table', { name: 'Strongest changes to HepG2 / CEBPB' }, { timeout: 5000 });
    const [first, next, ...rest] = within(table).getAllByRole('row').slice(1);
    expect(rest).toHaveLength(8);
    expect(first).toHaveTextContent('999chr1:109,817,590T>A−4.63');
    if (!next) throw new Error('No second row');
    const second = within(next).getByRole('rowheader').textContent ?? '';
    await userEvent.click(within(next).getByRole('button', { name: `Show position ${second} in the map` }));
    expect(screen.getByRole('region', { name: `Position ${second}` })).toBeInTheDocument();
    expect(screen.getByText(`Showing position ${second} in the map.`)).toHaveAttribute('role', 'status');
  });

  it('lists an in silico mutagenesis job’s files once per kind while it runs', async () => {
    renderJob(job(151));
    expect(await screen.findByText('Logits', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('4 sequences, FASTA')).toBeInTheDocument();
  });
});
