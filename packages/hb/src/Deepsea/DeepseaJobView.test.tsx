import { Humanbase, HumanbaseProvider, SampleClient } from '@humanbase/data';
import { render, screen } from '@testing-library/react';
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
    renderJob(job(101), 'chr7-49813589-G-C');
    expect(await screen.findByText('Molecular effects of chr7:49,813,589 G>C', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(await screen.findByText('P Promoter', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('Raises, 13 sequence classes')).toBeInTheDocument();
    expect(screen.getByText('strong, 2 or more')).toBeInTheDocument();
  });

  it('reads ExPecto effects as tissues, with their resource and system', async () => {
    renderJob(job(141), 'chr5-134871851-A-G');
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
    expect(await screen.findByRole('grid', { name: 'Substitutions at positions 984 to 1,013' }, { timeout: 5000 })).toBeInTheDocument();
    const strongest = screen.getByRole('table', { name: 'Strongest changes to HepG2 / CEBPB' });
    expect(strongest.querySelector('tbody tr')).toHaveTextContent('999chr1:109,817,590T>A−4.63');
  });

  it('lists an in silico mutagenesis job’s files once per kind while it runs', async () => {
    renderJob(job(151));
    expect(await screen.findByText('Logits', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('4 sequences, FASTA')).toBeInTheDocument();
  });
});
