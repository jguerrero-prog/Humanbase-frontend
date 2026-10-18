import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('is a native button that does not submit forms by default', () => {
    render(<Button>Run analysis</Button>);
    expect(screen.getByRole('button', { name: 'Run analysis' })).toHaveAttribute('type', 'button');
  });

  it('runs its action from the keyboard', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Download results</Button>);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('blocks repeat clicks while loading but stays focusable', async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Run analysis</Button>);
    const button = screen.getByRole('button', { name: 'Run analysis' });
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('cannot be focused or clicked when disabled', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Delete job</Button>);
    await userEvent.tab();
    expect(screen.getByRole('button')).not.toHaveFocus();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies the style and size from Figma', () => {
    render(<Button variant="destructive" size="small">Delete job</Button>);
    expect(screen.getByRole('button')).toHaveClass('button-destructive', 'button-small');
  });
});
