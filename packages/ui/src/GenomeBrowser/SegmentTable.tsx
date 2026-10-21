import { Cell, HeaderCell, Table, TableMessage, TableSkeleton } from '../Table/Table';
import { ViewAsTable } from '../Table/ViewAsTable';
import type { SegmentShape, TrackOf } from './GenomeTrackView';

export interface SegmentTableProps {
  track: TrackOf<readonly SegmentShape[]>;
  /** Where the segments are, such as chr1:109,792,590-109,842,590, GRCh37/hg19. */
  where: string;
}

const count = new Intl.NumberFormat('en-US');
const columns = 4;

/** A segment track's segments in view as a table: each one's state, start, end and length. */
export function SegmentTable({ track, where }: SegmentTableProps) {
  const segments = track.data ?? [];
  return (
    <ViewAsTable className="genome-segment-table">
      <Table caption={`${track.name} segments in ${where}`} showCaption density="compact" busy={track.state === 'loading'}>
        <thead>
          <tr>
            <HeaderCell>State</HeaderCell>
            <HeaderCell align="end">Start</HeaderCell>
            <HeaderCell align="end">End</HeaderCell>
            <HeaderCell align="end">Length</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {track.state === 'loading' ? (
            <TableSkeleton columns={columns} />
          ) : track.state === 'failed' ? (
            <TableMessage columns={columns} title={`${track.name} didn’t load.`} text="Move or zoom to try again." />
          ) : segments.length === 0 ? (
            <TableMessage columns={columns} title={track.empty ?? 'No segments in view.'} />
          ) : (
            segments.map((segment) => (
              <tr key={segment.start}>
                <Cell rowHeader>{segment.name}</Cell>
                <Cell type="number">{count.format(segment.start)}</Cell>
                <Cell type="number">{count.format(segment.end)}</Cell>
                <Cell type="number">{count.format(segment.end - segment.start + 1)} bp</Cell>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </ViewAsTable>
  );
}
