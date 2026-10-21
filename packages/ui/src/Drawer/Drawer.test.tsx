import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Button } from '../Button/Button';
import { Drawer, DrawerSection } from './Drawer';

function GeneDetail({ sheet }: { sheet?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>IL1R1</Button>
      <Drawer title="IL1R1" subtitle="interleukin 1 receptor type 1" open={open} onClose={() => setOpen(false)} {...(sheet ? { sheet } : {})}>
        <DrawerSection label="Connection to IL1B">
          <p>0.97</p>
        </DrawerSection>
      </Drawer>
    </>
  );
}

function ModuleDetail() {
  const [gene, setGene] = useState<string>();
  return (
    <Drawer open title={gene ?? 'M1'} {...(gene ? { back: { label: 'Back to M1', onSelect: () => setGene(undefined) } } : {})}>
      {gene ? <p>{gene} terms</p> : <Button onClick={() => setGene('HNF1B')}>HNF1B</Button>}
    </Drawer>
  );
}

describe('Drawer', () => {
  it('goes one level deeper and back in the same drawer, moving focus to the new title', async () => {
    render(<ModuleDetail />);
    await userEvent.click(screen.getByRole('button', { name: 'HNF1B' }));
    expect(screen.getByRole('dialog', { name: 'HNF1B' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'HNF1B' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Back to M1' }));
    expect(screen.getByRole('heading', { level: 2, name: 'M1' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Back to M1' })).not.toBeInTheDocument();
  });

  it('opens over the page without trapping focus, and focuses its title', async () => {
    render(<GeneDetail />);
    await userEvent.click(screen.getByRole('button', { name: 'IL1R1' }));
    const drawer = screen.getByRole('dialog', { name: 'IL1R1' });
    expect(drawer).toHaveAttribute('open');
    expect(drawer).not.toHaveAttribute('data-modal');
    expect(screen.getByRole('heading', { level: 2, name: 'IL1R1' })).toHaveFocus();
    expect(screen.getByRole('region', { name: 'Connection to IL1B' })).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to what opened it', async () => {
    render(<GeneDetail />);
    const opener = screen.getByRole('button', { name: 'IL1R1' });
    await userEvent.click(opener);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('becomes a modal sheet that closes with a swipe down on its handle', async () => {
    const { container } = render(<GeneDetail sheet />);
    await userEvent.click(screen.getByRole('button', { name: 'IL1R1' }));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-modal');
    const handle = container.querySelector('.drawer-handle') as HTMLElement;
    fireEvent.pointerDown(handle, { clientY: 100 });
    fireEvent.pointerUp(handle, { clientY: 200 });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
