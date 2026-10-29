import type { AnimationEvent } from 'react';
import './WelcomeIntro.css';

// The mark's five bars, in drawing order, with the edge each grows from. Each bar is two thirds of the logo's
// thickness, on the logo's own centerlines, so the large mark reads as light as the small one in the top bar.
const bars = [
  { x: 0.5, y: 1.44, width: 2, height: 24.48, from: 'top' },
  { x: 2.5, y: 6.9, width: 15.21, height: 2.08, from: 'left' },
  { x: 2.5, y: 17.92, width: 15.21, height: 2.08, from: 'left' },
  { x: 20.67, y: 1.44, width: 2, height: 24.48, from: 'top' },
  { x: 5.4, y: 12.45, width: 15.27, height: 2.08, from: 'right' },
] as const;

interface WelcomeIntroProps {
  onDone: () => void;
}

/** A full-screen cover in the hero color where the Humanbase mark draws itself, then slides away. Decorative only. */
export function WelcomeIntro({ onDone }: WelcomeIntroProps) {
  const finish = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onDone();
  };
  return (
    <div className="welcome-intro" aria-hidden="true" onAnimationEnd={finish}>
      <svg className="welcome-intro-mark" viewBox="0 0 24 28" width={96} height={112}>
        {bars.map(({ from, ...box }) => (
          <rect key={`${box.x},${box.y}`} className={`welcome-intro-bar welcome-intro-from-${from}`} {...box} />
        ))}
      </svg>
    </div>
  );
}
