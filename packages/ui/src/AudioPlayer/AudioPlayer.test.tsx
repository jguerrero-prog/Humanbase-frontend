import { act, fireEvent, render, screen } from '@testing-library/react';
import { AudioPill } from './AudioPill';
import { AudioPlayer } from './AudioPlayer';
import { clockTime, spokenTime } from './playbackTime';

describe('playback time', () => {
  it('shows minutes and seconds, and says them in words', () => {
    expect(clockTime(487)).toBe('8:07');
    expect(clockTime(0)).toBe('0:00');
    expect(clockTime(Number.NaN)).toBe('0:00');
    expect(spokenTime(134)).toBe('2 minutes 14 seconds');
    expect(spokenTime(61)).toBe('1 minute 1 second');
    expect(spokenTime(120)).toBe('2 minutes');
    expect(spokenTime(0)).toBe('0 seconds');
  });
});

describe('AudioPill', () => {
  it('is one button when idle, named by its visible text', () => {
    const onPlay = vi.fn();
    render(<AudioPill state="idle" duration={487} onPlay={onPlay} />);
    fireEvent.click(screen.getByRole('button', { name: 'Listen to this story' }));
    expect(onPlay).toHaveBeenCalled();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });

  it('exposes the position as a slider with the time in words', () => {
    const onSeek = vi.fn();
    render(<AudioPill state="playing" duration={487} elapsed={134} onSeek={onSeek} />);
    const slider = screen.getByRole('slider', { name: 'Position' });
    expect(slider).toHaveAttribute('aria-valuetext', '2 minutes 14 seconds of 8 minutes 7 seconds');
    expect(slider).toHaveAttribute('max', '487');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onSeek).toHaveBeenLastCalledWith(139);
    fireEvent.keyDown(slider, { key: 'PageDown' });
    expect(onSeek).toHaveBeenLastCalledWith(104);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close the player' })).not.toBeInTheDocument();
  });

  it('offers play when paused and close when docked', () => {
    const onClose = vi.fn();
    render(<AudioPill state="paused" docked duration={487} onClose={onClose} />);
    expect(screen.getByRole('button', { name: 'Play the story' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close the player' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('AudioPlayer', () => {
  let play: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
      this.dispatchEvent(new Event('play'));
      return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
      this.dispatchEvent(new Event('pause'));
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('never loads or plays on its own', () => {
    const { container } = render(<AudioPlayer src="/story.m4a" duration={487} />);
    const audio = container.querySelector('audio');
    expect(audio).toHaveAttribute('preload', 'none');
    expect(audio).not.toHaveAttribute('autoplay');
    expect(play).not.toHaveBeenCalled();
    expect(screen.queryByRole('group', { name: 'Audio player' })).not.toBeInTheDocument();
  });

  it('docks while playing, moves focus to the docked controls and returns it on close', () => {
    vi.useFakeTimers();
    render(<AudioPlayer src="/story.m4a" duration={487} />);
    fireEvent.click(screen.getByRole('button', { name: 'Listen to this story' }));
    expect(play).toHaveBeenCalledTimes(1);
    const pause = screen.getByRole('button', { name: 'Pause' });
    expect(pause).toHaveFocus();
    fireEvent.click(pause);
    expect(screen.getByRole('button', { name: 'Play the story' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close the player' }));
    act(() => vi.advanceTimersByTime(150));
    expect(screen.queryByRole('group', { name: 'Audio player' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Listen to this story' })).toHaveFocus();
    vi.useRealTimers();
  });

  it('stays docked and paused when the browser refuses to play', async () => {
    play.mockRejectedValue(new DOMException('Not allowed', 'NotAllowedError'));
    render(<AudioPlayer src="/story.m4a" duration={487} />);
    fireEvent.click(screen.getByRole('button', { name: 'Listen to this story' }));
    expect(await screen.findByRole('button', { name: 'Play the story' })).toBeInTheDocument();
  });
});
