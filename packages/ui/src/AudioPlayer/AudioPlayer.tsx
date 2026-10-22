import { useEffect, useRef, useState } from 'react';
import { AudioPill, type PlaybackState } from './AudioPill';

// Matches the dock's fade-out in AudioPlayer.css.
const leaveDuration = 150;

export interface AudioPlayerProps {
  src: string;
  /** Length in seconds, shown before the file's own metadata loads. */
  duration: number;
  label?: string;
  className?: string;
}

/** A narration pill that docks to the bottom of the window while it plays. It never starts on its own. */
export function AudioPlayer({ src, duration: expected, label, className }: AudioPlayerProps) {
  const audio = useRef<HTMLAudioElement>(null);
  const idleButton = useRef<HTMLButtonElement>(null);
  const dockedButton = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<PlaybackState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(expected);
  const [leaving, setLeaving] = useState(false);
  const docked = state !== 'idle';
  const wasDocked = useRef(false);

  useEffect(() => {
    if (docked === wasDocked.current) return;
    wasDocked.current = docked;
    (docked ? dockedButton : idleButton).current?.focus();
  }, [docked]);

  useEffect(() => {
    if (!leaving) return;
    const handle = setTimeout(() => {
      setLeaving(false);
      setState('idle');
      setElapsed(0);
    }, leaveDuration);
    return () => clearTimeout(handle);
  }, [leaving]);

  const play = () => {
    const media = audio.current;
    if (!media) return;
    setState('playing');
    media.play().catch(() => setState('paused'));
  };
  const pause = () => audio.current?.pause();
  const seek = (seconds: number) => {
    if (audio.current) audio.current.currentTime = seconds;
    setElapsed(seconds);
  };
  const close = () => {
    const media = audio.current;
    if (media) {
      media.pause();
      media.currentTime = 0;
    }
    setLeaving(true);
  };
  const follow = (next: PlaybackState) => () => setState((current) => (current === 'idle' || leaving ? current : next));

  return (
    <div className={['audio-player', className].filter(Boolean).join(' ')}>
      {/* Narration of text already on the page, which serves as its transcript (WCAG 1.2.1), so it has no caption track. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audio}
        src={src}
        preload="none"
        onPlay={follow('playing')}
        onPause={follow('paused')}
        onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => Number.isFinite(event.currentTarget.duration) && setDuration(Math.round(event.currentTarget.duration))}
      />
      <div className="audio-player-anchor" data-docked={docked || undefined}>
        <AudioPill state="idle" duration={duration} label={label} buttonRef={idleButton} onPlay={play} />
      </div>
      {docked && (
        <div className="audio-dock" data-leaving={leaving || undefined}>
          <AudioPill state={state} docked duration={duration} elapsed={elapsed} buttonRef={dockedButton} onPlay={play} onPause={pause} onSeek={seek} onClose={close} />
        </div>
      )}
    </div>
  );
}
