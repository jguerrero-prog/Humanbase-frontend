import { PausableTimer } from './PausableTimer';

describe('PausableTimer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('keeps the time left across a pause', () => {
    const done = vi.fn();
    const timer = new PausableTimer(6000);
    timer.start(done);
    vi.advanceTimersByTime(5000);
    timer.pause();
    vi.advanceTimersByTime(30000);
    expect(done).not.toHaveBeenCalled();
    timer.start();
    vi.advanceTimersByTime(999);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledOnce();
  });
});
