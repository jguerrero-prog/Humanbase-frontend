import { Humanbase, HumanbaseProvider, SampleClient } from '@humanbase/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hes1List } from '../HomeSearch/recordedLists.testdata';
import { EditGenesDialog } from './EditGenesDialog';

function renderDialog() {
  const onApply = vi.fn<(entrez: number[]) => void>();
  render(
    <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
      <EditGenesDialog open symbols={['IL1B', 'TNF']} version="v1" onClose={() => undefined} onApply={onApply} />
    </HumanbaseProvider>,
  );
  return onApply;
}

describe('EditGenesDialog', () => {
  it('starts from the genes on screen and applies an added gene', async () => {
    const onApply = renderDialog();
    const genes = screen.getByRole('textbox', { name: 'Genes' });
    expect(genes).toHaveValue('IL1B\nTNF');
    expect(await screen.findByText('2 matched: IL1B, TNF')).toBeInTheDocument();
    await userEvent.type(genes, '{Enter}ICAM1');
    expect(await screen.findByText('3 matched: IL1B, TNF, ICAM1', {}, { timeout: 2000 })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show network for 3 genes' }));
    expect(onApply).toHaveBeenCalledWith([3553, 7124, 3383]);
  });

  it('lists terms that need attention and leaves out those not found', async () => {
    renderDialog();
    const genes = screen.getByRole('textbox', { name: 'Genes' });
    await userEvent.clear(genes);
    await userEvent.type(genes, 'IL1B TNF AUTS12 NOTAGENE123 p53');
    expect(await screen.findByRole('table', { name: 'How your genes matched' }, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getByText(/1 not found, left out/, { selector: '.edit-genes-status' })).toBeInTheDocument();
    expect(screen.getByText(/AUTS12 is a recognized gene, but it is not part of any Humanbase network/)).toBeInTheDocument();
  });

  it('counts the first gene of a term that matched several on the button', async () => {
    const onApply = renderDialog();
    const genes = screen.getByRole('textbox', { name: 'Genes' });
    await userEvent.clear(genes);
    await userEvent.click(genes);
    await userEvent.paste(hes1List.join('\n'));
    expect(await screen.findByRole('radio', { name: /^HES1,/ }, { timeout: 2000 })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Show network for 25 genes' }));
    expect(onApply.mock.calls[0]?.[0]).toContain(3280);
  });
});
