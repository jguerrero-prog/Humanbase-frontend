import { Humanbase, HumanbaseProvider, JobHistory, SampleClient } from '@humanbase/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NetwasForm } from './NetwasForm';

function renderForm() {
  const onStarted = vi.fn<(link: string) => void>();
  render(
    <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
      <NetwasForm docsHref="/docs/netwas/" onStarted={onStarted} />
    </HumanbaseProvider>,
  );
  return { onStarted };
}

describe('NetwasForm', () => {
  beforeEach(() => localStorage.clear());

  it('says what to fix when run without a file', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Run NetWAS' }));
    expect(screen.getByText('1 thing to fix before submitting')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add a GWAS file.' })).toBeInTheDocument();
    expect(screen.getByText('Add a GWAS file to run NetWAS: VEGAS, MAGMA or 2-column, tab-separated.')).toBeInTheDocument();
  });

  it('checks the example, then starts the job and saves it in this browser', async () => {
    const { onStarted } = renderForm();
    await userEvent.click(screen.getByRole('radio', { name: 'Use the example' }));
    expect(await screen.findByText('17,692 genes with p-values, VEGAS format, ready to run', {}, { timeout: 5000 })).toBeInTheDocument();
    await screen.findByRole('combobox', { name: 'Tissue network' });
    await userEvent.click(screen.getByRole('button', { name: 'Run NetWAS on 17,692 genes' }));
    await vi.waitFor(() => expect(onStarted).toHaveBeenCalledWith('/netwas/00000000-0000-4000-8000-000000000001/'));
    expect(new JobHistory().list()[0]).toMatchObject({ tool: 'NetWAS', status: 'queued', detail: 'NetWAS, Adipose tissue' });
  });

  it('flags a threshold no gene is below', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('radio', { name: 'Use the example' }));
    await screen.findByText(/ready to run/, {}, { timeout: 5000 });
    const threshold = screen.getByRole('textbox', { name: 'p-value threshold' });
    await userEvent.clear(threshold);
    await userEvent.type(threshold, '0.0000000000001');
    await userEvent.click(screen.getByRole('button', { name: /^Run NetWAS/ }));
    expect(screen.getAllByText(/No gene in this file is below 0.0000000000001/).length).toBeGreaterThan(0);
  });

  it('switches to MAGE-WAS with the MHC choice instead of a threshold', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('combobox', { name: 'Data version' }));
    await userEvent.click(screen.getByRole('option', { name: 'MAGE' }));
    expect(screen.getByRole('button', { name: 'Run MAGE-WAS' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'MHC region' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'p-value threshold' })).not.toBeInTheDocument();
  });
});
