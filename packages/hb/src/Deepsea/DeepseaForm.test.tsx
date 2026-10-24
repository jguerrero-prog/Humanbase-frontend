import { Humanbase, HumanbaseProvider, JobHistory, SampleClient, type InputKind, type VariantModel } from '@humanbase/data';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeepseaForm } from './DeepseaForm';

function renderForm(model: VariantModel, choices: { models?: readonly VariantModel[]; inputs?: readonly InputKind[] } = {}) {
  const onStarted = vi.fn<(link: string) => void>();
  const onModelChange = vi.fn<(model: VariantModel) => void>();
  render(
    <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
      <DeepseaForm model={model} {...choices} onModelChange={onModelChange} onStarted={onStarted} />
    </HumanbaseProvider>,
  );
  return { onStarted, onModelChange };
}

describe('DeepseaForm', () => {
  beforeEach(() => localStorage.clear());

  it('runs the Beluga example and keeps the job in this browser', async () => {
    const { onStarted } = renderForm('beluga');
    await userEvent.click(screen.getByRole('radio', { name: 'Use the example' }));
    await userEvent.click(screen.getByRole('button', { name: 'Run Beluga on 12 variants' }));
    await waitFor(() => expect(onStarted).toHaveBeenCalledWith('/deepsea/jobs/8b26a498-278c-4c73-a6a4-5f2550c30073/'));
    expect(new JobHistory().list()[0]).toMatchObject({ tool: 'Beluga', detail: 'Beluga, 12 variants', status: 'queued' });
  });

  it('offers Seqweaver alone and points to Variant effects for DNA effects', async () => {
    renderForm('seqweaver');
    expect(screen.getByRole('link', { name: 'Variant effects' })).toHaveAttribute('href', '/variant-effects/');
    expect(screen.getByRole('combobox', { name: 'Model' })).toHaveAccessibleDescription('Seqweaver predicts RNA effects. For DNA effects, use Variant effects.');
    await userEvent.click(screen.getByRole('combobox', { name: 'Model' }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Seqweaver (RNA)']);
  });

  it('tells the page when another model is chosen', async () => {
    const { onModelChange } = renderForm('beluga', { models: ['sei', 'beluga'] });
    await userEvent.click(screen.getByRole('combobox', { name: 'Model' }));
    await userEvent.click(screen.getByRole('option', { name: /^Sei \(DNA, 2021\)/ }));
    expect(onModelChange).toHaveBeenCalledWith('sei');
  });

  it('offers only the models and inputs it is given, and says what can be scored', async () => {
    renderForm('sei', { models: ['sei', 'beluga'], inputs: ['vcf', 'bed'] });
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual(['vcf', 'bed', 'upload', 'paste', 'example']);
    expect(screen.getByText('Variants anywhere in the genome can be scored.')).toBeInTheDocument();
    expect(screen.getByText('Sei is the current model. Beluga, from 2019, is still available.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox', { name: 'Model' }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Sei (DNA, 2021)Current model: 40 sequence classes from 21,907 chromatin profiles',
      'Beluga (DNA, 2019)Earlier model: 2,002 chromatin features',
    ]);
  });

  it('offers the live example for every input kind', async () => {
    renderForm('sei');
    await userEvent.click(screen.getByRole('radio', { name: 'Sequences (FASTA)' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Use the example' }));
    expect(screen.getByRole('button', { name: 'Run Sei on 4 sequences' })).not.toHaveAttribute('aria-disabled');
    for (const kind of ['vcf', 'bed', 'fasta']) expect(screen.getByRole('button', { name: new RegExp(`Download example\\.${kind}`) })).toBeInTheDocument();
  });

  it('runs a region scan on the example sequences, with FASTA as its only input', async () => {
    const { onStarted } = renderForm('insilico');
    expect(screen.queryByRole('radiogroup', { name: 'What are you submitting?' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About region scan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Read the in silico mutagenesis documentation' })).toHaveAttribute('href', '/docs/in-silico-mutagenesis/');
    expect(screen.getByText('Region scan mutates every base of each sequence. It runs on Beluga.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Use the example' }));
    await userEvent.click(screen.getByRole('button', { name: 'Run region scan on 4 sequences' }));
    await waitFor(() => expect(onStarted).toHaveBeenCalledWith('/deepsea/jobs/00000000-0000-4000-8000-000000000151/'));
    expect(new JobHistory().list()[0]).toMatchObject({ tool: 'Region scan', detail: 'Region scan, 4 sequences' });
  });
});
