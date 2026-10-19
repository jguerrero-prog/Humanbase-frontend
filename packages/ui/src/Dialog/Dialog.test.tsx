import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Button } from '../Button/Button';
import { TextInput } from '../TextInput/TextInput';
import { Dialog, type DialogKind } from './Dialog';

function DeleteJob({ kind = 'destructive' }: { kind?: DialogKind }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete</Button>
      <Dialog
        title="Delete this job?"
        kind={kind}
        open={open}
        onClose={close}
        actions={
          <>
            <Button variant="ghost" onClick={close}>Keep job</Button>
            <Button variant="destructive" onClick={close}>Delete job</Button>
          </>
        }
      >
        <p>“BMI GWAS, adipose tissue” and its results will be removed.</p>
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('opens as a modal named by its title, with focus on the least destructive action', async () => {
    render(<DeleteJob />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete this job?' });
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAttribute('data-modal');
    expect(screen.getByRole('button', { name: 'Keep job' })).toHaveFocus();
  });

  it('closes on Escape and returns focus to the button that opened it', async () => {
    render(<DeleteJob />);
    const opener = screen.getByRole('button', { name: 'Delete' });
    await userEvent.click(opener);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('closes from the Close button', async () => {
    render(<DeleteJob />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on a backdrop click only for Confirm dialogs', async () => {
    const { unmount } = render(<DeleteJob />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('dialog'));
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
    unmount();

    render(<DeleteJob kind="confirm" />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('puts focus in the first field of a form dialog', () => {
    render(
      <Dialog title="Rename job" kind="form" open actions={<Button>Save</Button>}>
        <TextInput label="Job title" defaultValue="BMI GWAS" />
      </Dialog>,
    );
    expect(screen.getByRole('textbox', { name: 'Job title' })).toHaveFocus();
  });

  it('leaves Escape alone when a control inside has already handled it', () => {
    const onClose = vi.fn();
    render(
      <Dialog title="Rename job" open onClose={onClose} actions={null}>
        <input aria-label="Name" onKeyDown={(event) => event.preventDefault()} />
      </Dialog>,
    );
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders open in the page flow when inline, for documentation', () => {
    render(
      <Dialog title="Share this result" inline actions={null}>
        <p>Anyone with the link can view these results.</p>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Share this result' });
    expect(dialog).toHaveAttribute('open');
    expect(dialog).not.toHaveAttribute('data-modal');
  });
});
