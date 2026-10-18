import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionMenu } from './ActionMenu';

const setup = () => {
  const download = vi.fn();
  const remove = vi.fn();
  render(
    <ActionMenu
      label="Actions for BMI GWAS, adipose tissue"
      items={[
        { label: 'Download results', icon: 'download', onSelect: download },
        { label: 'Copy link', icon: 'link' },
        { label: 'Delete job', icon: 'trash', destructive: true, dividerBefore: true, onSelect: remove },
      ]}
    />,
  );
  return { download, remove, button: screen.getByRole('button', { name: 'Actions for BMI GWAS, adipose tissue' }) };
};

describe('ActionMenu', () => {
  it('opens from its button and moves focus to the first command', async () => {
    const { button } = setup();
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Download results' })).toHaveFocus();
  });

  it('runs a command with the keyboard and returns focus to the button', async () => {
    const { button, remove } = setup();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}{End}{Enter}');
    expect(remove).toHaveBeenCalledOnce();
    expect(button).toHaveFocus();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('jumps by typed letter and closes with Escape', async () => {
    const { button } = setup();
    await userEvent.click(button);
    await userEvent.keyboard('c');
    expect(screen.getByRole('menuitem', { name: 'Copy link' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(button).toHaveFocus();
  });
});
