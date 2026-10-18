import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Alert } from './Alert';
import { Banner } from './Banner';
import { Toast, ToastRegion } from './Toast';
import { ToastQueue, toastDuration } from './ToastQueue';

describe('Alert', () => {
  it('names its type and reads errors at once', () => {
    render(
      <Alert tone="error" title="This file has no p-value column" action={{ label: 'See file format', href: '#format' }}>
        NetWAS needs a column named p or pvalue.
      </Alert>,
    );
    const alert = screen.getByRole('alert');
    expect(within(alert).getByRole('img', { name: 'Error' })).toBeInTheDocument();
    expect(within(alert).getByRole('link', { name: 'See file format' })).toHaveAttribute('href', '#format');
    expect(within(alert).queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });

  it('is polite and dismissible when asked', () => {
    const onDismiss = vi.fn();
    render(<Alert title="MAGE is now the default network version" dismissible onDismiss={onDismiss} />);
    fireEvent.click(within(screen.getByRole('status')).getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('Banner', () => {
  it('cannot be dismissed when it reports an error', () => {
    render(<Banner tone="error">Job submission is paused.</Banner>);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });
});

describe('toastDuration', () => {
  it('gives 6 seconds plus 1 for every 20 words, and none when the toast must stay', () => {
    expect(toastDuration({ tone: 'success', message: 'Link copied' })).toBe(6000);
    expect(toastDuration({ tone: 'info', message: Array(41).fill('word').join(' ') })).toBe(8000);
    expect(toastDuration({ tone: 'success', message: 'Submitted', action: { label: 'View job', href: '/jobs/1' } })).toBeUndefined();
    expect(toastDuration({ tone: 'error', message: 'Couldn’t download results' })).toBeUndefined();
    expect(toastDuration({ tone: 'loading', message: 'Preparing download…' })).toBeUndefined();
  });
});

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('leaves after its time and pauses while hovered', () => {
    const onDismiss = vi.fn();
    render(<Toast tone="info" message="Link copied" onDismiss={onDismiss} />);
    const frame = screen.getByText('Link copied').closest('.toast-frame') as HTMLElement;
    act(() => vi.advanceTimersByTime(4000));
    fireEvent.pointerEnter(frame);
    act(() => vi.advanceTimersByTime(10000));
    expect(frame).not.toHaveAttribute('data-leaving');
    fireEvent.pointerLeave(frame);
    act(() => vi.advanceTimersByTime(2000));
    expect(frame).toHaveAttribute('data-leaving');
    act(() => vi.advanceTimersByTime(150));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('stays open while it has an action, and Escape dismisses it', () => {
    const onDismiss = vi.fn();
    render(<Toast tone="success" message="NetWAS job submitted" action={{ label: 'View job', href: '/jobs/1' }} onDismiss={onDismiss} />);
    act(() => vi.advanceTimersByTime(60000));
    const frame = screen.getByText('NetWAS job submitted').closest('.toast-frame') as HTMLElement;
    expect(frame).not.toHaveAttribute('data-leaving');
    fireEvent.keyDown(screen.getByRole('link', { name: 'View job' }), { key: 'Escape' });
    expect(frame).toHaveAttribute('data-leaving');
  });
});

describe('ToastRegion', () => {
  it('keeps the newest three, announces them and turns loading into a result in place', () => {
    const queue = new ToastQueue();
    render(<ToastRegion queue={queue} />);
    let loading = '';
    act(() => {
      ['First', 'Second', 'Third'].forEach((message) => queue.show({ tone: 'info', message }));
      loading = queue.show({ tone: 'loading', message: 'Preparing download…' });
    });
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Second', 'Third', 'Preparing download…']);
    expect(screen.getByRole('status')).toHaveTextContent('Preparing download…');
    act(() => queue.update(loading, { tone: 'error', message: 'Couldn’t download results' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t download results');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });
});
