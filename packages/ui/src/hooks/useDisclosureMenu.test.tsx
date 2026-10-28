import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDisclosureMenu, type DisclosureMenuOptions } from './useDisclosureMenu';

function Menu(options: DisclosureMenuOptions) {
  const { root, button, panel, buttonProps, panelProps } = useDisclosureMenu(options);
  return (
    <>
      <div ref={root}>
        <button ref={button} {...buttonProps} type="button">
          Resources
        </button>
        <div ref={panel} {...panelProps}>
          <a href="/downloads/">Downloads</a>
          <a href="/api/">API</a>
          <a href="/docs/">Docs</a>
        </div>
      </div>
      <button type="button">Elsewhere</button>
    </>
  );
}

const button = () => screen.getByRole('button', { name: 'Resources' });

describe('useDisclosureMenu', () => {
  it('opens with Down Arrow on the first link and Up Arrow on the last', async () => {
    render(<Menu />);
    button().focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(button()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Downloads' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveFocus();
  });

  it('opens with Enter on the first link, and a pointer click leaves focus on the button', async () => {
    render(<Menu />);
    button().focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('link', { name: 'Downloads' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(button());
    expect(button()).toHaveAttribute('aria-expanded', 'true');
    expect(button()).toHaveFocus();
  });

  it('moves between links with the arrow keys, Home and End', async () => {
    render(<Menu />);
    button().focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('link', { name: 'API' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('link', { name: 'Downloads' })).toHaveFocus();
  });

  it('closes on Escape from a link, returning focus to the button', async () => {
    render(<Menu />);
    button().focus();
    await userEvent.keyboard('{ArrowDown}{Escape}');
    expect(button()).toHaveAttribute('aria-expanded', 'false');
    expect(button()).toHaveFocus();
  });

  it('closes on a click outside and reports it when controlled', async () => {
    const onOpenChange = vi.fn();
    render(<Menu open onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
