import type { CSSProperties, KeyboardEvent, Ref } from 'react';
import { Icon } from '../Icon/Icon';
import { clockTime, spokenTime } from './playbackTime';
import './AudioPlayer.css';

export type PlaybackState = 'idle' | 'playing' | 'paused';

export interface AudioPillProps {
  state: PlaybackState;
  duration: number;
  elapsed?: number;
  label?: string | undefined;
  docked?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (seconds: number) => void;
  onClose?: () => void;
  className?: string;
}

const seekKeys: Record<string, number> = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -30, PageUp: 30 };

/** The player's pill in one state; AudioPlayer moves it between states. */
export function AudioPill({ state, duration, elapsed = 0, label = 'Listen to this story', docked = false, buttonRef, onPlay, onPause, onSeek, onClose, className }: AudioPillProps) {
  const classes = ['audio-pill', docked && 'audio-pill-docked', className].filter(Boolean).join(' ');
  if (state === 'idle') {
    return (
      <button ref={buttonRef} type="button" className={`${classes} audio-pill-idle`} onClick={onPlay}>
        <span className="audio-pill-toggle">
          <Icon name="play" size={20} />
        </span>
        {label}
      </button>
    );
  }
  const playing = state === 'playing';
  const seek = (event: KeyboardEvent<HTMLInputElement>) => {
    const step = seekKeys[event.key];
    if (step === undefined) return;
    event.preventDefault();
    onSeek?.(Math.min(duration, Math.max(0, elapsed + step)));
  };
  return (
    <div className={classes} role="group" aria-label="Audio player">
      <button ref={buttonRef} type="button" className="audio-pill-toggle" aria-label={playing ? 'Pause' : 'Play the story'} onClick={playing ? onPause : onPlay}>
        <Icon name={playing ? 'pause' : 'play'} size={20} />
      </button>
      <span className="audio-pill-time" aria-hidden="true">
        {clockTime(elapsed)}
      </span>
      <input
        type="range"
        className="audio-pill-track"
        aria-label="Position"
        min={0}
        max={Math.max(1, Math.floor(duration))}
        step={1}
        value={Math.floor(elapsed)}
        aria-valuetext={`${spokenTime(elapsed)} of ${spokenTime(duration)}`}
        style={{ '--played': `${duration > 0 ? (elapsed / duration) * 100 : 0}%` } as CSSProperties}
        onChange={(event) => onSeek?.(Number(event.target.value))}
        onKeyDown={seek}
      />
      <span className="audio-pill-time audio-pill-total" aria-hidden="true">
        {clockTime(duration)}
      </span>
      {docked && onClose && (
        <button type="button" className="audio-pill-close" aria-label="Close the player" onClick={onClose}>
          <Icon name="x" size={20} />
        </button>
      )}
    </div>
  );
}
