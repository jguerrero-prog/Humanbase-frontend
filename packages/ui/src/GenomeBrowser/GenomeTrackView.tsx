import { useRef, type PointerEvent } from 'react';
import { TrackHeader } from './GenomeBrowserToolbar';
import { ticksOf } from './ScoreTracks';
import './GenomeBrowser.css';

/** Whether a track's data is in: loading, ready, or failed to load. */
export type TrackState = 'loading' | 'ready' | 'failed';

export interface GeneShape {
  name: string;
  strand: '+' | '-' | '';
  start: number;
  end: number;
  /** Pseudogenes are drawn lighter. */
  muted?: boolean;
  exons: readonly (readonly [number, number])[];
  coding: readonly (readonly [number, number])[];
}

export interface TrackOf<T> {
  name: string;
  /** The line under the name, such as GENCODE 19 or Model score, −0.4 to 3. */
  meta: string;
  state: TrackState;
  data?: T | undefined;
}

export interface ScoreTrackData {
  min: number;
  max: number;
  values: readonly { start: number; end: number; value: number }[];
}

export interface GenomeTrackViewProps {
  /** The view, 1-based and inclusive. */
  start: number;
  end: number;
  /** The drawing's width in pixels, without the header column. */
  width: number;
  sequence?: TrackOf<{ start: number; bases: string }> | undefined;
  scores?: readonly TrackOf<ScoreTrackData>[] | undefined;
  genes?: TrackOf<readonly GeneShape[]> | undefined;
  /** The selected position, drawn as an ink guide through every track with its label on a pill. */
  selected?: { position: number; label: string } | undefined;
  /** Called while the tracks are dragged, in pixels; done is true when the drag ends. */
  onPan?: ((pixels: number, done: boolean) => void) | undefined;
  /** How far the drawing is dragged, in pixels, while a drag is under way. */
  shift?: number | undefined;
}

const rulerHeight = 30;
const sequenceHeight = 60;
const scoreHeight = 60;
const geneRowHeight = 36;
const geneMinHeight = 60;
const pillHeight = 30;
const maxGeneRows = 8;
// Atkinson Hyperlegible Mono 11 is about 7px a character; Lato Bold 12 is up to 8px, arrows included.
const baseWidth = 7;
const characterWidth = 8;
// Ruler labels such as 166,250,000 need about this much room each.
const tickSpacing = 110;
const figureHeader = 220;
const figureTitle = 32;
const count = new Intl.NumberFormat('en-US');

interface PlacedGene {
  gene: GeneShape;
  row: number;
  labelAt: number;
  label: string;
}

/** Puts each gene on the first row where it and its name fit, so names never overlap. */
function placeGenes(genes: readonly GeneShape[], x: (position: number) => number, width: number): PlacedGene[] {
  const rowEnds: number[] = [];
  return [...genes]
    .sort((a, b) => a.start - b.start)
    .flatMap((gene) => {
      const [from, to] = [Math.max(0, x(gene.start)), Math.min(width, x(gene.end + 1))];
      const label = gene.strand === '+' ? `${gene.name} →` : gene.strand === '-' ? `← ${gene.name}` : gene.name;
      const half = (label.length * characterWidth) / 2;
      const labelAt = Math.min(width - half, Math.max(half, (from + to) / 2));
      const [left, right] = [Math.min(from, labelAt - half), Math.max(to, labelAt + half)];
      const row = rowEnds.findIndex((end) => end + 8 < left);
      const placed = row === -1 ? rowEnds.length : row;
      if (placed >= maxGeneRows) return [];
      rowEnds[placed] = right;
      return [{ gene, row: placed, labelAt, label }];
    });
}

interface DrawingOptions {
  /** Draws the selected variant's bars in ink, with its value and its pill. */
  marks?: boolean | undefined;
  /** Draws the vertical guide through every track at the selected variant. */
  guide?: boolean | undefined;
}

/** Where each row sits: the ruler, each track, then the selected variant's pill. */
function layoutOf({ start, end, width, sequence, scores = [], genes, selected: chosenPosition }: GenomeTrackViewProps, marks: boolean) {
  const selected = chosenPosition && chosenPosition.position >= start && chosenPosition.position <= end ? chosenPosition : undefined;
  const span = Math.max(1, end - start + 1);
  const x = (position: number) => ((position - start) / span) * width;
  const placed = genes?.data ? placeGenes(genes.data, x, width) : [];
  const geneHeight = Math.max(geneMinHeight, (Math.max(0, ...placed.map((item) => item.row)) + 1) * geneRowHeight + 12);
  const pill = selected && marks ? pillHeight : 0;
  const rows = [
    { key: 'ruler', height: rulerHeight },
    ...(sequence ? [{ key: 'sequence', height: sequenceHeight, track: sequence }] : []),
    ...scores.map((track) => ({ key: `score-${track.name}`, height: scoreHeight, track })),
    ...(genes ? [{ key: 'genes', height: geneHeight, track: genes }] : []),
    { key: 'pill', height: pill },
  ];
  const tops = rows.map((_, index) => rows.slice(0, index).reduce((sum, row) => sum + row.height, 0));
  const topOf = (key: string) => tops[rows.findIndex((row) => row.key === key)] ?? 0;
  const height = rows.reduce((sum, row) => sum + row.height, 0);
  return { selected, span, x, placed, geneHeight, rows, topOf, height, guideEnd: height - pill };
}

type Layout = ReturnType<typeof layoutOf>;

/** The tracks inside an svg, shared by the browser on the page and its exported figure. */
function TrackDrawing({ props, layout, marks = true, guide = true }: { props: GenomeTrackViewProps; layout: Layout } & DrawingOptions) {
  const { start, end, width, sequence, scores = [], genes, shift = 0 } = props;
  const { selected, span, x, placed, geneHeight, topOf, guideEnd } = layout;
  const perBase = width / span;
  const marked = marks ? selected : undefined;

  const note = (top: number, rowHeight: number, text: string) => (
    <text className="genome-tracks-note" x={8} y={top + rowHeight / 2 + 4}>
      {text}
    </text>
  );
  const stateNote = (track: TrackOf<unknown>, top: number, rowHeight: number) =>
    track.state === 'loading' ? note(top, rowHeight, `Loading ${track.name}…`) : track.state === 'failed' ? note(top, rowHeight, `${track.name} didn’t load. Move or zoom to try again.`) : null;

  const sequenceTop = topOf('sequence');
  const readable = perBase >= baseWidth;
  const letters = sequence?.data;
  const geneTop = topOf('genes');

  return (
    <>
      <g transform={`translate(${shift} 0)`}>
        <line className="score-tracks-axis" x1={-width} y1={rulerHeight - 6} x2={2 * width} y2={rulerHeight - 6} />
        {ticksOf(start, end, Math.max(1, Math.floor(width / tickSpacing))).map((tick) => (
          <g key={tick}>
            <line className="score-tracks-axis" x1={x(tick)} y1={rulerHeight - 12} x2={x(tick)} y2={rulerHeight - 6} />
            {x(tick) + shift > tickSpacing / 2 - 8 && x(tick) + shift < width - tickSpacing / 2 + 8 && (
              <text className="score-tracks-tick" x={x(tick)} y={rulerHeight - 16} textAnchor="middle">
                {count.format(tick)}
              </text>
            )}
          </g>
        ))}

        {sequence &&
          (sequence.state !== 'ready'
            ? stateNote(sequence, sequenceTop, sequenceHeight)
            : !readable || !letters
              ? note(sequenceTop, sequenceHeight, width < 360 ? 'Zoom in to read the bases.' : `Zoom in to under ${count.format(Math.floor(width / baseWidth))} bp to read the bases.`)
              : [...letters.bases].map((base, index) => {
                  const at = letters.start + index;
                  return (
                    <text key={at} className="genome-tracks-base" x={x(at) + perBase / 2} y={sequenceTop + sequenceHeight / 2 + 4} textAnchor="middle">
                      {base}
                    </text>
                  );
                }))}

        {scores.map((track) => {
          const top = topOf(`score-${track.name}`);
          if (track.state !== 'ready' || !track.data) return <g key={track.name}>{stateNote(track, top, scoreHeight)}</g>;
          const { min, max, values } = track.data;
          const yOf = (value: number) => top + ((max - Math.max(min, Math.min(max, value))) / (max - min)) * (scoreHeight - 8) + 4;
          const zero = yOf(0);
          const chosen = marked && values.find((point) => point.start <= marked.position && point.end >= marked.position);
          return (
            <g key={track.name}>
              <line className="score-tracks-baseline" x1={-width} y1={zero} x2={2 * width} y2={zero} />
              {values.map((point) => {
                const [y1, y2] = [zero, yOf(point.value)].sort((a, b) => a - b) as [number, number];
                const barWidth = Math.max(2, x(point.end + 1) - x(point.start));
                return <rect key={point.start} className={point === chosen ? 'genome-tracks-bar is-selected' : 'genome-tracks-bar'} x={x(point.start) + (perBase - barWidth) / 2} y={y1} width={barWidth} height={Math.max(1, y2 - y1)} />;
              })}
              {chosen && (
                <text className="genome-tracks-value" x={x(chosen.end + 1) + 6} y={Math.max(top + 12, yOf(chosen.value) + 10)}>
                  {chosen.value.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}

        {genes &&
          (genes.state !== 'ready'
            ? stateNote(genes, geneTop, geneHeight)
            : placed.length === 0
              ? note(geneTop, geneHeight, 'No genes in view.')
              : placed.map(({ gene, row, labelAt, label }) => {
                  const top = geneTop + 8 + row * geneRowHeight;
                  const middle = top + 5;
                  return (
                    <g key={gene.name} className={gene.muted ? 'genome-tracks-gene is-muted' : 'genome-tracks-gene'}>
                      <line className="genome-tracks-intron" x1={x(gene.start)} y1={middle} x2={x(gene.end + 1)} y2={middle} />
                      {gene.exons.map(([from, to]) => (
                        <rect key={`e${from}`} x={x(from)} y={middle - 3} width={Math.max(1, x(to + 1) - x(from))} height={6} />
                      ))}
                      {gene.coding.map(([from, to]) => (
                        <rect key={`c${from}`} x={x(from)} y={middle - 5} width={Math.max(1, x(to + 1) - x(from))} height={10} />
                      ))}
                      <text className="genome-tracks-gene-name" x={labelAt} y={top + 24} textAnchor="middle">
                        {label}
                      </text>
                    </g>
                  );
                }))}

        {selected && guide && <line className="genome-tracks-guide" x1={x(selected.position) + perBase / 2} y1={rulerHeight - 6} x2={x(selected.position) + perBase / 2} y2={guideEnd} />}
      </g>
      {marked && <Pill at={x(marked.position) + perBase / 2 + shift} top={guideEnd + 4} width={width} label={marked.label} />}
    </>
  );
}

/** The genome browser's tracks, drawn by the design system: ruler, sequence, score tracks and genes, with headers beside them. */
export function GenomeTrackView(props: GenomeTrackViewProps) {
  const { width, onPan } = props;
  const drag = useRef<{ from: number; pointer: number } | undefined>(undefined);
  const layout = layoutOf(props, true);

  const pointer = onPan && {
    onPointerDown: (event: PointerEvent<SVGSVGElement>) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { from: event.clientX, pointer: event.pointerId };
    },
    onPointerMove: (event: PointerEvent<SVGSVGElement>) => {
      if (drag.current?.pointer === event.pointerId) onPan(event.clientX - drag.current.from, false);
    },
    onPointerUp: (event: PointerEvent<SVGSVGElement>) => {
      if (drag.current?.pointer !== event.pointerId) return;
      onPan(event.clientX - drag.current.from, true);
      drag.current = undefined;
    },
    onPointerCancel: () => {
      drag.current = undefined;
      onPan(0, true);
    },
  };

  return (
    <div className="score-tracks genome-tracks">
      <div className="score-tracks-column" style={{ gridTemplateRows: layout.rows.map((row) => `${row.height}px`).join(' ') }}>
        <div className="score-tracks-ruler-label">Position</div>
        {layout.rows.flatMap((row) => ('track' in row && row.track ? [<TrackHeader key={row.key} name={row.track.name} source={row.track.meta} />] : []))}
      </div>
      <svg className={onPan ? 'genome-tracks-area is-draggable' : 'genome-tracks-area'} width={width} height={layout.height} aria-hidden="true" focusable="false" {...pointer}>
        <TrackDrawing props={props} layout={layout} />
      </svg>
    </div>
  );
}

export interface GenomeTrackFigureProps extends Omit<GenomeTrackViewProps, 'onPan' | 'shift'>, DrawingOptions {
  /** A line above the tracks, such as the location and assembly; none when left out. */
  title?: string | undefined;
}

/** The tracks as one standalone svg with their headers beside them, for exporting the view. */
export function GenomeTrackFigure({ title, marks = true, guide = true, ...props }: GenomeTrackFigureProps) {
  const layout = layoutOf(props, marks);
  const top = title ? figureTitle : 0;
  const fullWidth = figureHeader + props.width;
  const fullHeight = top + layout.height;

  return (
    <svg className="genome-figure" xmlns="http://www.w3.org/2000/svg" width={fullWidth} height={fullHeight} viewBox={`0 0 ${fullWidth} ${fullHeight}`}>
      <rect className="genome-figure-page" width={fullWidth} height={fullHeight} />
      {title && (
        <text className="genome-figure-title" x={12} y={22}>
          {title}
        </text>
      )}
      <g transform={`translate(0 ${top})`}>
        <rect className="genome-figure-headers" width={figureHeader} height={layout.guideEnd} />
        <text className="genome-figure-name" x={12} y={20}>
          Position
        </text>
        {layout.rows.flatMap((row) => {
          if (!('track' in row) || !row.track) return [];
          const at = layout.topOf(row.key);
          return [
            <g key={row.key}>
              <text className="genome-figure-name" x={12} y={at + 22}>
                {row.track.name}
              </text>
              <text className="genome-figure-meta" x={12} y={at + 40}>
                {row.track.meta}
              </text>
            </g>,
          ];
        })}
        <svg x={figureHeader} width={props.width} height={layout.height} overflow="hidden">
          <TrackDrawing props={props} layout={layout} marks={marks} guide={guide} />
        </svg>
      </g>
    </svg>
  );
}

function Pill({ at, top, width, label }: { at: number; top: number; width: number; label: string }) {
  const pillWidth = label.length * baseWidth + 24;
  const left = Math.min(width - pillWidth, Math.max(0, at - pillWidth / 2));
  return (
    <g>
      <rect className="genome-tracks-pill" x={left} y={top} width={pillWidth} height={22} rx={11} />
      <text className="genome-tracks-pill-text" x={left + pillWidth / 2} y={top + 15} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}
