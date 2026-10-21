import { TrackHeader } from './GenomeBrowserToolbar';
import './GenomeBrowser.css';

export interface ScoreTrack {
  name: string;
  source: string;
  /** The score's range in words, such as Model score, −0.4 to 3. */
  scale: string;
  values: readonly { position: number; value: number | null }[];
}

export interface ScoreTracksProps {
  /** Names the region for screen readers, such as Genome browser, chr1:2,230,000-2,440,000. */
  label: string;
  start: number;
  end: number;
  tracks: readonly ScoreTrack[];
  /** The scores' shared range; bars grow up or down from 0. */
  min: number;
  max: number;
  /** The selected variant's position, drawn in ink with a guide across every track. */
  selected?: number | undefined;
}

const rulerHeight = 30;
const trackHeight = 60;
const steps = [100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000];
const count = new Intl.NumberFormat('en-US');

/** Tick positions a round step apart, at most `most` across the view (about eight by default). */
export function ticksOf(start: number, end: number, most = 10): number[] {
  const step = steps.find((size) => (end - start) / size <= most) ?? (end - start) / Math.min(8, most);
  const first = Math.ceil(start / step) * step;
  return Array.from({ length: Math.floor((end - first) / step) + 1 }, (_, index) => first + index * step);
}

/** Score tracks with their headers in a fixed column: one bar per variant, the selected one in ink. */
export function ScoreTracks({ label, start, end, tracks, min, max, selected }: ScoreTracksProps) {
  // Horizontal positions are percentages, so the tracks fill any width while their heights match the header column.
  const x = (position: number) => `${((position - start) / Math.max(1, end - start)) * 100}%`;
  const height = rulerHeight + tracks.length * trackHeight;
  const yOf = (top: number, value: number) => top + ((max - Math.max(min, Math.min(max, value))) / (max - min)) * (trackHeight - 8) + 4;
  const zeroAt = (top: number) => yOf(top, 0);

  return (
    <section className="score-tracks" aria-label={label}>
      <div className="score-tracks-column" style={{ gridTemplateRows: `${rulerHeight}px repeat(${tracks.length}, ${trackHeight}px)` }}>
        <div className="score-tracks-ruler-label">Position</div>
        {tracks.map((track) => (
          <TrackHeader key={track.name} name={track.name} source={track.source} scale={track.scale} />
        ))}
      </div>
      <svg className="score-tracks-area" width="100%" height={height} aria-hidden="true" focusable="false">
        <line className="score-tracks-axis" x1="0" y1={rulerHeight - 6} x2="100%" y2={rulerHeight - 6} />
        {ticksOf(start, end).map((tick) => (
          <g key={tick}>
            <line className="score-tracks-axis" x1={x(tick)} y1={rulerHeight - 12} x2={x(tick)} y2={rulerHeight - 6} />
            <text className="score-tracks-tick" x={x(tick)} y={rulerHeight - 16} textAnchor="middle">
              {count.format(tick)}
            </text>
          </g>
        ))}
        {tracks.map((track, index) => {
          const top = rulerHeight + index * trackHeight;
          return (
            <g key={track.name}>
              <line className="score-tracks-baseline" x1="0" y1={zeroAt(top)} x2="100%" y2={zeroAt(top)} />
              {track.values.map(({ position, value }) => {
                if (value === null) return null;
                const [y1, y2] = [zeroAt(top), yOf(top, value)].sort((a, b) => a - b) as [number, number];
                return <line key={position} className={position === selected ? 'score-tracks-bar score-tracks-selected' : 'score-tracks-bar'} x1={x(position)} x2={x(position)} y1={y1} y2={y1 + Math.max(1, y2 - y1)} />;
              })}
            </g>
          );
        })}
        {selected !== undefined && <line className="score-tracks-guide" x1={x(selected)} y1={rulerHeight - 6} x2={x(selected)} y2={height} />}
      </svg>
    </section>
  );
}
