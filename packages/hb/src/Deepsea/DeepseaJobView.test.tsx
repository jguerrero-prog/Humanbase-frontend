import { Humanbase, HumanbaseProvider, SampleClient } from '@humanbase/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deepseaFormLink } from './DeepseaForm';
import { DeepseaJobView } from './DeepseaJobView';

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
    expect(await screen.findByText('LIN28A', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('10 variants. Chromosomes alternate dark and light grey; position carries the chromosome, so color doesn’t have to.')).toBeInTheDocument();
  });

  it('reads Sei effects as sequence classes', async () => {
    renderJob('2e18fedf-3de7-4d08-a894-9a937a2b860b', 'chr7-49813589-G-C');
    expect(await screen.findByText('Molecular effects of chr7:49,813,589 G>C', {}, { timeout: 5000 })).toBeInTheDocument();
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
    expect(within(legend).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Enhancer', 'CTCF', 'Polycomb', 'Promoter', 'Heterochromatin', 'Transcription', 'Transcription factor', 'Low signal']);
    expect(screen.getByText(/colored by the sequence class each changes most/)).toBeInTheDocument();
  });

  it('links each model’s score type documentation, as humanbase.io does', async () => {
    renderJob('76aea8fe-8ec7-4698-a193-a186c7665edb');
    await screen.findByText('Molecular effects of chr1:109,817,590 G>T', {}, { timeout: 5000 });
    const links = await screen.findAllByRole('link', { name: /Score type documentation/ }, { timeout: 5000 });
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['https://humanbase.readthedocs.io/en/latest/seqweaver.html#output', 'https://humanbase.readthedocs.io/en/latest/seqweaver.html#output']);
    expect(screen.queryByRole('combobox', { name: 'Color style' })).not.toBeInTheDocument();
  });

  it('reads ExPecto effects as tissues, with their resource and system', async () => {
    renderJob('e504e3cc-6a9a-4f35-99e3-9185d6f5c4a1', 'chr5-134871851-A-G');
    expect(await screen.findByRole('heading', { level: 1, name: 'Untitled ExPecto job' }, { timeout: 5000 })).toBeInTheDocument();
    expect(await screen.findByText('Fallopian Tube', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getAllByText('GTEx, reproductive system')[0]).toBeInTheDocument();
    expect(screen.getByText('strong, 0.1 or more')).toBeInTheDocument();
  });

  it('sends a failed ExPecto job back to its Submit variants tab', () => {
    expect(deepseaFormLink('expecto')).toBe('/expecto/variants/');
    expect(deepseaFormLink('beluga')).toBe('/beluga/');
  });

  it('lists the files a running job will write', async () => {
    renderJob(job(112));
    expect(await screen.findByRole('heading', { level: 1, name: 'Untitled Beluga job' }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: /Your query/ })).toBeInTheDocument();
  });

  it('says why a job failed', async () => {
    renderJob(job(121));
    expect(await screen.findByText('Failed: chr23 is not a chromosome on GRCh37/hg19', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Run Beluga again' })).toHaveAttribute('href', '/beluga/');
  });

  it('explains a link to no job', async () => {
    renderJob(job(0));
    expect(await screen.findByText('This job isn’t available', {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('shows every substitution of the in silico mutagenesis example for HepG2 / CEBPB', async () => {
    renderJob('0576e894-a2c5-48bb-9bdf-227962495d5f');
    expect(await screen.findByRole('heading', { level: 1, name: 'Untitled in silico mutagenesis job' }, { timeout: 5000 })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Effect of every substitution on HepG2 / CEBPB' }, { timeout: 5000 })).toBeInTheDocument();
    // Opens on the strongest position, 999, with the 91-position window centered on it.
    expect(await screen.findByRole('grid', { name: 'Substitutions at positions 954 to 1,044' }, { timeout: 5000 })).toBeInTheDocument();
    const detail = screen.getByRole('region', { name: 'Position 999' });
    expect(detail).toHaveTextContent('chr1:109,817,590 · reference T');
    expect(detail).toHaveTextContent('A−4.63C−4.00G−4.24TReference');
    expect(screen.getByRole('slider', { name: 'Window along the sequence' })).toHaveAttribute('aria-valuenow', '954');
    expect(screen.getByRole('link', { name: /Log-fold change score documentation/ })).toHaveAttribute('href', 'https://humanbase.readthedocs.io/en/latest/in-silico-mutagenesis.html#output');
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
