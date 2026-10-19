import { useId, type FormEvent } from 'react';
import { ActionMenu, type ActionMenuItem } from '../ActionMenu/ActionMenu';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { SearchField } from '../SearchField/SearchField';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { genomeBrowserShortcuts as keys } from './genomeBrowserKeys';
import './GenomeBrowser.css';

export const zoomStopSegments = [
  { value: '200', label: '200 bp' },
  { value: '2000', label: '2 kb' },
  { value: '50000', label: '50 kb' },
  { value: '500000', label: '500 kb' },
] as const;

export interface GenomeBrowserToolbarProps {
  location: string;
  assembly: string;
  widthHelp: string;
  locationError?: string | undefined;
  zoomStop?: number | undefined;
  onLocation?: (text: string) => void;
  onZoomStop?: (bases: number) => void;
  onZoom?: (direction: 'in' | 'out') => void;
  onPreviousVariant?: () => void;
  onNextVariant?: () => void;
  onTracks?: () => void;
  onExport?: () => void;
  moreItems?: readonly ActionMenuItem[];
  /** False leaves out Tracks and Export, for a browser whose tracks are fixed. */
  trackActions?: boolean | undefined;
  className?: string;
}

export function GenomeBrowserToolbar({
  location, assembly, widthHelp, locationError, zoomStop, onLocation, onZoomStop, onZoom, onPreviousVariant, onNextVariant, onTracks, onExport, moreItems = [], trackActions = true, className,
}: GenomeBrowserToolbarProps) {
  const helpId = useId();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLocation?.(String(new FormData(event.currentTarget).get('location') ?? ''));
  };

  return (
    <div role="toolbar" aria-label="Genome browser" className={['genome-toolbar', className].filter(Boolean).join(' ')}>
      <Button variant="ghost" size="small" aria-keyshortcuts={keys.previousVariant} onClick={onPreviousVariant}>
        Previous variant
      </Button>
      <form role="search" className="genome-location" onSubmit={submit}>
        <SearchField label="Location or gene" size="medium" name="location" defaultValue={location} aria-describedby={helpId} aria-invalid={locationError ? true : undefined} />
        <p id={helpId} className={locationError ? 'genome-location-help genome-location-error' : 'genome-location-help'}>
          {locationError ?? (
            <>
              <strong>{assembly}</strong> {widthHelp}
            </>
          )}
        </p>
      </form>
      <div className="genome-zoom">
        <IconButton label="Zoom out" icon="zoom-out" shortcut={keys.zoomOut} onClick={() => onZoom?.('out')} />
        <SegmentedControl
          label="Zoom"
          hideLabel
          size="small"
          segments={zoomStopSegments}
          value={zoomStop === undefined ? '' : String(zoomStop)}
          onChange={(value) => onZoomStop?.(Number(value))}
        />
        <IconButton label="Zoom in" icon="zoom-in" shortcut={keys.zoomIn} onClick={() => onZoom?.('in')} />
      </div>
      {(trackActions || moreItems.length > 0) && (
        <div className="genome-actions">
          {trackActions && (
            <>
              <Button variant="secondary" size="small" icon="genome-track" aria-keyshortcuts={keys.openTracks} onClick={onTracks}>
                Tracks
              </Button>
              <Button variant="ghost" size="small" icon="download" aria-keyshortcuts={keys.openExport} onClick={onExport}>
                Export
              </Button>
            </>
          )}
          {moreItems.length > 0 && <ActionMenu label="More browser options" items={moreItems} />}
        </div>
      )}
      <Button variant="ghost" size="small" className="genome-next" aria-keyshortcuts={keys.nextVariant} onClick={onNextVariant}>
        Next variant
      </Button>
    </div>
  );
}

export interface TrackHeaderProps {
  name: string;
  source: string;
  scale?: string | undefined;
  /** Track options; the header has no menu without them. */
  menuItems?: readonly ActionMenuItem[] | undefined;
}

// Sits in the fixed column beside its track, so labels never cover the data.
export function TrackHeader({ name, source, scale, menuItems = [] }: TrackHeaderProps) {
  return (
    <div className="track-header">
      <div className="track-header-text">
        <span className="track-header-name">{name}</span>
        <span className="track-header-meta">{scale ? `${source}, ${scale}` : source}</span>
      </div>
      {menuItems.length > 0 && <ActionMenu label={`${name} track options`} items={menuItems} size="small" />}
    </div>
  );
}
