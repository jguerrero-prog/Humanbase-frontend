import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { placeNearPoint } from './placement';
import { Toggletip } from './Toggletip';
import { Tooltip } from './Tooltip';
import { TooltipController } from './TooltipController';

const iconButton = (label: string) => (
  <button type="button" aria-label={label}>
    +
  </button>
);

describe('Tooltip', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('waits 400ms on hover, shows the same words as the label, and hides 100ms after leaving', () => {
    render(<Tooltip text="Zoom in">{iconButton('Zoom in')}</Tooltip>);
    const anchor = screen.getByRole('button', { name: 'Zoom in' }).closest('.tooltip-anchor') as HTMLElement;
    fireEvent.pointerEnter(anchor, { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(399));
    expect(screen.queryByText('Zoom in', { selector: '.tooltip' })).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText('Zoom in', { selector: '.tooltip' })).toHaveAttribute('aria-hidden', 'true');
    fireEvent.pointerLeave(anchor);
    act(() => vi.advanceTimersByTime(100));
    expect(screen.queryByText('Zoom in', { selector: '.tooltip' })).not.toBeInTheDocument();
  });

  it('shows at once on focus and hides on Escape without moving focus', () => {
    render(<Tooltip text="Download network">{iconButton('Download network')}</Tooltip>);
    const button = screen.getByRole('button');
    act(() => button.focus());
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByText('Download network', { selector: '.tooltip' })).toBeVisible();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Download network', { selector: '.tooltip' })).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('links extra descriptions with aria-describedby', () => {
    render(
      <Tooltip text="Last run Oct 15, 2026" describes>
        <button type="button">Rerun</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Rerun' })).toHaveAccessibleDescription('Last run Oct 15, 2026');
  });
});

describe('TooltipController', () => {
  it('shows one tooltip at a time and skips the delay while one is showing or just closed', () => {
    const controller = new TooltipController();
    const first = vi.fn();
    expect(controller.showDelay(0)).toBe(400);
    controller.opened(first);
    expect(controller.showDelay(0)).toBe(0);
    controller.opened(() => undefined);
    expect(first).toHaveBeenCalledOnce();
    const second = vi.fn();
    controller.opened(second);
    controller.closed(second, 1000);
    expect(controller.showDelay(1200)).toBe(0);
    expect(controller.showDelay(1400)).toBe(400);
  });
});

describe('placeNearPoint', () => {
  it('sits 12px below and right of the point, and flips to stay inside', () => {
    const size = { width: 240, height: 144 };
    expect(placeNearPoint({ x: 100, y: 100 }, size, { width: 680, height: 380 })).toEqual({ x: 112, y: 112 });
    expect(placeNearPoint({ x: 600, y: 300 }, size, { width: 680, height: 380 })).toEqual({ x: 348, y: 144 });
  });
});

describe('Toggletip', () => {
  it('opens on click into a live region, and closes on Escape with focus on its button', async () => {
    render(<Toggletip term="q-value" body="The p-value adjusted for testing many GO terms at once." link={{ label: 'How enrichment is calculated', href: '#enrichment' }} />);
    const button = screen.getByRole('button', { name: 'About q-value' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('The p-value adjusted');
    expect(screen.getByRole('link', { name: 'How enrichment is calculated' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(button).toHaveFocus();
  });

  it('closes on a second click', async () => {
    render(<Toggletip term="MAGE" body="Networks built from 7,463 datasets." />);
    const button = screen.getByRole('button', { name: 'About MAGE' });
    await userEvent.click(button);
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
