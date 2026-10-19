import { Humanbase, HumanbaseProvider, JobHistory, SampleClient, type VariantModel } from '@humanbase/data';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeepseaForm } from './DeepseaForm';

function renderForm(model: VariantModel) {
  const onStarted = vi.fn<(link: string) => void>();
  const onModelChange = vi.fn<(model: VariantModel) => void>();
  render(
    <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
      <DeepseaForm model={model} onModelChange={onModelChange} onStarted={onStarted} />
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
    await waitFor(() => expect(onStarted).toHaveBeenCalledWith('/deepsea/jobs/00000000-0000-4000-8000-000000000112/'));
    expect(new JobHistory().list()[0]).toMatchObject({ tool: 'Beluga', detail: 'Beluga, 12 variants', status: 'queued' });
  });

  it('opens another tool when the model changes', async () => {
    const { onModelChange } = renderForm('seqweaver');
    await userEvent.click(screen.getByRole('combobox', { name: 'Model' }));
    await userEvent.click(screen.getByRole('option', { name: 'Sei (DNA, 2021)' }));
    expect(onModelChange).toHaveBeenCalledWith('sei');
  });

  it('offers only the examples that exist', async () => {
    renderForm('sei');
    await userEvent.click(screen.getByRole('radio', { name: 'Sequences (FASTA)' }));
    expect(screen.queryByRole('radio', { name: 'Use the example' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download example\.vcf/ })).toBeInTheDocument();
  });

  it('runs in silico mutagenesis on the example sequences, with FASTA as its only input', async () => {
    const { onStarted } = renderForm('insilico');
    expect(screen.queryByRole('radiogroup', { name: 'What are you submitting?' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About in silico mutagenesis' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Use the example' }));
    await userEvent.click(screen.getByRole('button', { name: 'Run in silico mutagenesis on 4 sequences' }));
    await waitFor(() => expect(onStarted).toHaveBeenCalledWith('/deepsea/jobs/00000000-0000-4000-8000-000000000151/'));
    expect(new JobHistory().list()[0]).toMatchObject({ tool: 'In silico mutagenesis', detail: 'In silico mutagenesis, 4 sequences' });
  });
});
