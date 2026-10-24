import { useCallback, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import type { ActionMenuItem } from '../ActionMenu/ActionMenu';
import { usePinned } from '../List/useDismiss';
import { DataTooltip, type DataTooltipProps } from '../Tooltip/DataTooltip';
import { placeNearPoint, placeUnderBox } from '../Tooltip/placement';
import { TrackHeader } from './GenomeBrowserToolbar';
import { ticksOf } from './ScoreTracks';
import './GenomeBrowser.css';

/** Whether a track's data is in: loading, ready, failed to load, or outside the data there is, which the page says once for every track. */
export type TrackState = 'loading' | 'ready' | 'failed' | 'outside';

/** The label and value rows an item's details popover lists. */
export type ItemDetails = DataTooltipProps['rows'];

export interface GeneShape {
  name: string;
  strand: '+' | '-' | '';
  start: number;
  end: number;
  /** Pseudogenes are drawn lighter. */
  muted?: boolean;
  exons: readonly (readonly [number, number])[];
  coding: readonly (readonly [number, number])[];
  /** What clicking the gene shows; a gene without details doesn't open a popover. */
  details?: ItemDetails | undefined;
}

export interface TrackOf<T> {
  name: string;
  /** The line under the name, such as GENCODE 19 or Model score, −0.4 to 3. */
  meta: string;
  state: TrackState;
  data?: T | undefined;
  /** What the track says when it has nothing to draw. */
  empty?: string | undefined;
  /** The options in the track header's menu; the header has no menu without them. */
  menu?: readonly ActionMenuItem[] | undefined;
}

/** One score bar: a value over a stretch, or at one position when start and end are equal. */
export interface ScoreShape {
  start: number;
  end: number;
  value: number;
  /** What clicking the bar shows; a bar without details doesn't open a popover. */
  details?: ItemDetails | undefined;
}

export interface ScoreTrackData {
  min: number;
  max: number;
  values: readonly ScoreShape[];
}

/** A score track, which can be drawn taller or shorter than the usual 60px. */
export interface ScoreTrackOf extends TrackOf<ScoreTrackData> {
  height?: number | undefined;
}

/** One segment of a segment track, such as a chromatin state, 1-based and inclusive, in the file's own color or viz-seq-6 without one. */
export interface SegmentShape {
  start: number;
  end: number;
  name: string;
  color: string;
  /** What clicking the segment shows; a segment without details doesn't open a popover. */
  details?: ItemDetails | undefined;
}

export interface GenomeTrackViewProps {
  /** The view, 1-based and inclusive. */
  start: number;
  end: number;
  /** The drawing's width in pixels, without the header column. */
  width: number;
  sequence?: TrackOf<{ start: number; bases: string }> | undefined;
  scores?: readonly ScoreTrackOf[] | undefined;
  segments?: readonly TrackOf<readonly SegmentShape[]>[] | undefined;
  genes?: TrackOf<readonly GeneShape[]> | undefined;
  /** The selected position, drawn as an ink guide through every track with its label on a pill. */
  selected?: { position: number; label: string } | undefined;
  /** Track names in drawing order; tracks left out keep their usual place: sequence, scores, segments, then genes. */
  order?: readonly string[] | undefined;
  /** Called while the tracks are dragged, in pixels; done is true when the drag ends. */
  onPan?: ((pixels: number, done: boolean) => void) | undefined;
  /** How far the drawing is dragged, in pixels, while a drag is under way. */
  shift?: number | undefined;
}

const rulerHeight = 30;
const sequenceHeight = 60;
/** A score track's usual height in pixels. */
export const scoreTrackHeight = 60;
const segmentHeight = 60;
// The live site's ChromHMM boxes are 8px high.
const segmentBox = 8;
const tooltipSize = { width: 240, height: 117 };
const dragStart = 4;
const minTarget = 24;
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
function layoutOf({ start, end, width, sequence, scores = [], segments = [], genes, order = [], selected: chosenPosition }: GenomeTrackViewProps, marks: boolean) {
  const selected = chosenPosition && chosenPosition.position >= start && chosenPosition.position <= end ? chosenPosition : undefined;
  const span = Math.max(1, end - start + 1);
  const x = (position: number) => ((position - start) / span) * width;
  const placed = genes?.data ? placeGenes(genes.data, x, width) : [];
  const geneHeight = Math.max(geneMinHeight, (Math.max(0, ...placed.map((item) => item.row)) + 1) * geneRowHeight + 12);
  const pill = selected && marks ? pillHeight : 0;
  const tracks = [
    ...(sequence ? [{ key: 'sequence', height: sequenceHeight, track: sequence }] : []),
    ...scores.map((track) => ({ key: `score-${track.name}`, height: track.height ?? scoreTrackHeight, track })),
    ...segments.map((track) => ({ key: `segments-${track.name}`, height: segmentHeight, track })),
    ...(genes ? [{ key: 'genes', height: geneHeight, track: genes }] : []),
  ];
  const rank = (row: (typeof tracks)[number], index: number) => {
    const at = order.indexOf(row.track.name);
    return at === -1 ? order.length + index : at;
  };
  const ordered = tracks.map((row, index) => ({ row, rank: rank(row, index) })).sort((a, b) => a.rank - b.rank).map(({ row }) => row);
  const rows = [{ key: 'ruler', height: rulerHeight }, ...ordered, { key: 'pill', height: pill }];
  const tops = rows.map((_, index) => rows.slice(0, index).reduce((sum, row) => sum + row.height, 0));
  const topOf = (key: string) => tops[rows.findIndex((row) => row.key === key)] ?? 0;
  const height = rows.reduce((sum, row) => sum + row.height, 0);
  return { selected, span, x, placed, geneHeight, rows, topOf, height, guideEnd: height - pill };
}

type Layout = ReturnType<typeof layoutOf>;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A gene's bar and its name below it, inside the drawing. */
function geneBox({ gene, row, labelAt, label }: PlacedGene, geneTop: number, x: (position: number) => number, width: number): Box {
  const half = (label.length * characterWidth) / 2;
  const left = Math.max(0, Math.min(x(gene.start), labelAt - half));
  const right = Math.min(width, Math.max(x(gene.end + 1), labelAt + half));
  return { left, top: geneTop + 4 + row * geneRowHeight, width: Math.max(1, right - left), height: 32 };
}

/** Each bar from 0 to its value: at least 2px wide and 1px tall, centered on its bases. */
function scoreBarsOf({ min, max, values }: ScoreTrackData, top: number, height: number, x: (position: number) => number, perBase: number) {
  const yOf = (value: number) => top + ((max - Math.max(min, Math.min(max, value))) / (max - min)) * (height - 8) + 4;
  const zero = yOf(0);
  const bars = values.map((point) => {
    const [y1, y2] = [zero, yOf(point.value)].sort((a, b) => a - b) as [number, number];
    const width = Math.max(2, x(point.end + 1) - x(point.start));
    return { point, box: { left: x(point.start) + (perBase - width) / 2, top: y1, width, height: Math.max(1, y2 - y1) } };
  });
  return { yOf, zero, bars };
}

// A short bar's button is at least 24px tall and stays inside its track, clear of the next track's items.
function scoreTarget(bar: Box, top: number, trackHeight: number): Box {
  const height = Math.max(minTarget, bar.height);
  const middle = Math.min(top + trackHeight - 4 - height / 2, Math.max(top + 4 + height / 2, bar.top + bar.height / 2));
  return { ...bar, top: middle - height / 2, height };
}

const spanKey = (track: string, item: { start: number }) => `${track} ${item.start}`;
const spanWords = (item: { start: number; end: number }) => (item.end > item.start ? `${count.format(item.start)} to ${count.format(item.end)}` : count.format(item.start));
const geneKey = (track: string, gene: GeneShape) => `${track} ${gene.name}`;

/** One score bar, gene or segment that opens its details on click or Enter. */
interface TrackItem {
  key: string;
  label: string;
  details: ItemDetails;
  box: Box;
}

/** The items with details, by track, in the order the tracks are drawn. */
function itemGroupsOf({ width, scores = [], segments = [], genes }: GenomeTrackViewProps, { x, span, placed, topOf }: Layout): { track: string; items: TrackItem[] }[] {
  const scoreGroups = scores.map((track) => {
    const [top, height] = [topOf(`score-${track.name}`), track.height ?? scoreTrackHeight];
    return {
      track: track.name,
      top,
      items:
        track.state === 'ready' && track.data
          ? scoreBarsOf(track.data, top, height, x, width / span).bars.flatMap(({ point, box }) =>
              point.details ? [{ key: spanKey(track.name, point), label: `${point.value.toFixed(2)} at ${spanWords(point)}`, details: point.details, box: scoreTarget(box, top, height) }] : [],
            )
          : [],
    };
  });
  const segmentGroups = segments.map((track) => {
    const top = topOf(`segments-${track.name}`) + (segmentHeight - segmentBox) / 2;
    const items = (track.state === 'ready' && track.data) || [];
    return {
      track: track.name,
      top,
      items: items.flatMap((segment) => {
        if (!segment.details) return [];
        const [left, right] = [Math.max(0, x(segment.start)), Math.min(width, x(segment.end + 1))];
        return [{ key: spanKey(track.name, segment), label: `${segment.name}, ${spanWords(segment)}`, details: segment.details, box: { left, top, width: Math.max(1, right - left), height: segmentBox } }];
      }),
    };
  });
  const geneTop = topOf('genes');
  const geneItems = genes?.state === 'ready' ? placed.flatMap((item) => (item.gene.details ? [{ key: geneKey(genes.name, item.gene), label: item.gene.name, details: item.gene.details, box: geneBox(item, geneTop, x, width) }] : [])) : [];
  // Tab order follows the drawing order, which the page can change.
  return [...scoreGroups, ...segmentGroups, ...(genes ? [{ track: genes.name, top: geneTop, items: geneItems }] : [])]
    .filter((group) => group.items.length > 0)
    .sort((a, b) => a.top - b.top)
    .map(({ track, items }) => ({ track, items }));
}

/** The tracks inside an svg, shared by the browser on the page and its exported figure. */
interface SegmentHover {
  segment: SegmentShape;
  track: string;
  box: SVGRectElement;
  /** Where the pointer came in, from the left of the window. */
  pointer: number;
}

interface TrackDrawingProps extends DrawingOptions {
  props: GenomeTrackViewProps;
  layout: Layout;
  onSegment?: ((hover: SegmentHover | undefined) => void) | undefined;
  /** Marks each item with details so a click can find it, and gives genes a target as big as their name. */
  interactive?: boolean | undefined;
}

function TrackDrawing({ props, layout, marks = true, guide = true, onSegment, interactive = false }: TrackDrawingProps) {
  const { start, end, width, sequence, scores = [], segments = [], genes, shift = 0 } = props;
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
          const [top, height] = [topOf(`score-${track.name}`), track.height ?? scoreTrackHeight];
          if (track.state !== 'ready' || !track.data) return <g key={track.name}>{stateNote(track, top, height)}</g>;
          const { yOf, zero, bars } = scoreBarsOf(track.data, top, height, x, perBase);
          const chosen = marked && track.data.values.find((point) => point.start <= marked.position && point.end >= marked.position);
          return (
            <g key={track.name}>
              <line className="score-tracks-baseline" x1={-width} y1={zero} x2={2 * width} y2={zero} />
              {bars.map(({ point, box }) => (
                <rect
                  key={point.start}
                  className={point === chosen ? 'genome-tracks-bar is-selected' : 'genome-tracks-bar'}
                  x={box.left}
                  y={box.top}
                  width={box.width}
                  height={box.height}
                  data-item={interactive && point.details ? spanKey(track.name, point) : undefined}
                />
              ))}
              {chosen && (
                <text className="genome-tracks-value" x={x(chosen.end + 1) + 6} y={Math.max(top + 12, yOf(chosen.value) + 10)}>
                  {chosen.value.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}

        {segments.map((track) => {
          const top = topOf(`segments-${track.name}`);
          if (track.state !== 'ready' || !track.data) return <g key={track.name}>{stateNote(track, top, segmentHeight)}</g>;
          if (track.data.length === 0) return <g key={track.name}>{note(top, segmentHeight, track.empty ?? 'No segments in view.')}</g>;
          return (
            <g key={track.name}>
              {track.data.map((segment) => (
                <rect
                  key={segment.start}
                  className="genome-tracks-segment"
                  x={x(segment.start)}
                  y={top + (segmentHeight - segmentBox) / 2}
                  width={Math.max(1, x(segment.end + 1) - x(segment.start))}
                  height={segmentBox}
                  fill={segment.color || undefined}
                  data-item={interactive && segment.details ? spanKey(track.name, segment) : undefined}
                  onPointerEnter={onSegment && ((event) => onSegment({ segment, track: track.name, box: event.currentTarget, pointer: event.clientX }))}
                  onPointerLeave={onSegment && (() => onSegment(undefined))}
                />
              ))}
            </g>
          );
        })}

        {genes &&
          (genes.state !== 'ready'
            ? stateNote(genes, geneTop, geneHeight)
            : placed.length === 0
              ? note(geneTop, geneHeight, 'No genes in view.')
              : placed.map((item) => {
                  const { gene, row, labelAt, label } = item;
                  const top = geneTop + 8 + row * geneRowHeight;
                  const middle = top + 5;
                  const target = interactive && gene.details ? geneBox(item, geneTop, x, width) : undefined;
                  return (
                    <g key={gene.name} className={gene.muted ? 'genome-tracks-gene is-muted' : 'genome-tracks-gene'} data-item={target && geneKey(genes.name, gene)}>
                      {target && <rect className="genome-tracks-hit" x={target.left} y={target.top} width={target.width} height={target.height} />}
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
  const drag = useRef<{ from: number; pointer: number; moved: boolean } | undefined>(undefined);
  const [hover, setHover] = useState<{ segment: SegmentShape; track: string; at: { x: number; y: number } }>();
  const layout = layoutOf(props, true);
  const groups = itemGroupsOf(props, layout);
  const { frame, tip, ...details } = useItemDetails(groups, `${props.start}-${props.end} ${width}`);
  const onSegment = (hovered: SegmentHover | undefined) => {
    const box = frame.current;
    if (!hovered || !box || drag.current?.moved) return setHover(undefined);
    const outer = box.getBoundingClientRect();
    const point = { x: hovered.pointer - outer.left, y: hovered.box.getBoundingClientRect().bottom - outer.top };
    setHover({ segment: hovered.segment, track: hovered.track, at: placeNearPoint(point, tooltipSize, { width: box.clientWidth, height: box.clientHeight }, 4) });
  };

  // A press only becomes a drag once it moves a few pixels, so a click still opens the item under it.
  const pointer = onPan && {
    onPointerDown: (event: PointerEvent<SVGSVGElement>) => {
      if (event.button === 0) drag.current = { from: event.clientX, pointer: event.pointerId, moved: false };
    },
    onPointerMove: (event: PointerEvent<SVGSVGElement>) => {
      const current = drag.current;
      if (current?.pointer !== event.pointerId) return;
      const moved = event.clientX - current.from;
      if (!current.moved && Math.abs(moved) < dragStart) return;
      if (!current.moved) {
        current.moved = true;
        setHover(undefined);
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      onPan(moved, false);
    },
    onPointerUp: (event: PointerEvent<SVGSVGElement>) => {
      const current = drag.current;
      if (current?.pointer !== event.pointerId) return;
      if (current.moved) onPan(event.clientX - current.from, true);
      else drag.current = undefined;
    },
    onPointerCancel: () => {
      if (drag.current?.moved) onPan(0, true);
      drag.current = undefined;
    },
  };
  // A drag ends in a click; only a press that didn't move opens an item.
  const onClick = (event: MouseEvent<SVGSVGElement>) => {
    const dragged = drag.current?.moved;
    drag.current = undefined;
    const key = !dragged && (event.target as Element).closest('[data-item]')?.getAttribute('data-item');
    if (key) details.show(key);
  };

  return (
    <div ref={frame} className="score-tracks genome-tracks">
      <div className="score-tracks-column" style={{ gridTemplateRows: layout.rows.map((row) => `${row.height}px`).join(' ') }}>
        <div className="score-tracks-ruler-label">Position</div>
        {layout.rows.flatMap((row) => ('track' in row && row.track ? [<TrackHeader key={row.key} name={row.track.name} source={row.track.meta} menuItems={row.track.menu} />] : []))}
      </div>
      <div className="genome-tracks-plot">
        <svg className={onPan ? 'genome-tracks-area is-draggable' : 'genome-tracks-area'} width={width} height={layout.height} aria-hidden="true" focusable="false" onClick={onClick} {...pointer}>
          <TrackDrawing props={props} layout={layout} onSegment={onSegment} interactive />
        </svg>
        <ItemButtons groups={groups} details={details} />
      </div>
      {hover && !details.open && (
        <DataTooltip
          title={hover.segment.name}
          subtitle={hover.track}
          rows={[
            ['Start', count.format(hover.segment.start)],
            ['Length', `${count.format(hover.segment.end - hover.segment.start + 1)} bp`],
          ]}
          position={hover.at}
        />
      )}
      {details.open && (
        <DataTooltip
          key={details.open.item.key}
          ref={tip}
          id={details.id}
          className="data-tooltip-details"
          pinned
          title={details.open.track}
          rows={details.open.item.details}
          onClose={details.closeToItem}
          position={details.place ?? { x: 0, y: 0 }}
          arrow={details.place && { side: details.place.side, at: details.place.arrow }}
        />
      )}
    </div>
  );
}

type ItemDetailsState = Omit<ReturnType<typeof useItemDetails>, 'frame' | 'tip'>;

const itemButton = (frame: HTMLElement | null, key: string | undefined) => (key ? frame?.querySelector<HTMLElement>(`[data-item-button="${CSS.escape(key)}"]`) : undefined);

/** The one open item details popover: pinned under its item until Close, Escape, a click outside or a move of the view. */
function useItemDetails(groups: ReturnType<typeof itemGroupsOf>, view: string) {
  const id = useId();
  const frame = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState<{ key: string; view: string }>();
  const [place, setPlace] = useState<ReturnType<typeof placeUnderBox>>();
  const openKey = opened?.view === view ? opened.key : undefined;
  const open = groups.flatMap((group) => group.items.map((item) => ({ track: group.track, item }))).find(({ item }) => item.key === openKey);
  const close = useCallback(() => setOpened(undefined), []);
  const closeToItem = () => {
    itemButton(frame.current, openKey)?.focus();
    close();
  };
  usePinned(tip, Boolean(open), close, () => itemButton(frame.current, openKey));
  useLayoutEffect(() => {
    const [outer, panel] = [frame.current, tip.current];
    const button = itemButton(outer, openKey);
    if (!outer || !button || !panel) return;
    const [bounds, item] = [outer.getBoundingClientRect(), button.getBoundingClientRect()];
    const box = { left: item.left - bounds.left, right: item.right - bounds.left, top: item.top - bounds.top, bottom: item.bottom - bounds.top };
    setPlace(placeUnderBox(box, { width: panel.offsetWidth, height: panel.offsetHeight }, { width: outer.clientWidth, height: outer.clientHeight }));
  }, [openKey]);
  return { frame, tip, id, open, place, show: (key: string) => setOpened({ key, view }), closeToItem };
}

/** The items as buttons over the drawing, one tab stop per track; arrow keys move between a track's items. */
function ItemButtons({ groups, details }: { groups: ReturnType<typeof itemGroupsOf>; details: ItemDetailsState }) {
  const [current, setCurrent] = useState<Record<string, string>>({});
  const move = (event: KeyboardEvent<HTMLButtonElement>, items: readonly TrackItem[], index: number) => {
    const next = { ArrowLeft: index - 1, ArrowUp: index - 1, ArrowRight: index + 1, ArrowDown: index + 1, Home: 0, End: items.length - 1 }[event.key];
    const target = next === undefined ? undefined : items[Math.max(0, Math.min(items.length - 1, next))];
    if (!target) return;
    event.preventDefault();
    event.currentTarget.parentElement?.querySelector<HTMLElement>(`[data-item-button="${CSS.escape(target.key)}"]`)?.focus();
  };
  return (
    <div className="genome-tracks-items">
      {groups.map(({ track, items }) => {
        const stop = items.some((item) => item.key === current[track]) ? current[track] : items[0]?.key;
        return (
          <div key={track} role="group" aria-label={`${track}, items`}>
            {items.map((item, index) => {
              const isOpen = details.open?.item.key === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  className="genome-tracks-item"
                  style={{ insetInlineStart: item.box.left, insetBlockStart: item.box.top, inlineSize: item.box.width, blockSize: item.box.height }}
                  data-item-button={item.key}
                  tabIndex={item.key === stop ? 0 : -1}
                  aria-label={item.label}
                  aria-haspopup="dialog"
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? details.id : undefined}
                  onFocus={() => setCurrent((was) => ({ ...was, [track]: item.key }))}
                  onClick={() => details.show(item.key)}
                  onKeyDown={(event) => move(event, items, index)}
                />
              );
            })}
          </div>
        );
      })}
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
