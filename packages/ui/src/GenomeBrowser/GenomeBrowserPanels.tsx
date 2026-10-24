import { useState, type ChangeEvent } from 'react';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { Dialog } from '../Dialog/Dialog';
import { Drawer } from '../Drawer/Drawer';
import { FileField } from '../FileField/FileField';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { Select } from '../Select/Select';
import { TextInput } from '../TextInput/TextInput';
import './GenomeBrowser.css';

interface LayerProps {
  open?: boolean;
  inline?: boolean;
  onClose?: () => void;
}

export interface SuggestedTrack {
  id: string;
  label: string;
  source: string;
  shown: boolean;
  /** A track the person added, which they can remove. */
  removable?: boolean | undefined;
}

export type TrackSource = 'suggested' | 'file' | 'url';

export interface TracksDrawerProps extends LayerProps {
  tracks: readonly SuggestedTrack[];
  /** Where tracks can come from; a browser that can't read your own files offers only the list. */
  sources?: readonly TrackSource[];
  /** The browser's assembly in words, such as GRCh37/hg19, which added files have to be on. */
  assembly?: string | undefined;
  /** A file or address is being read. */
  adding?: boolean | undefined;
  /** Why the last file or address couldn't be added. */
  addError?: string | undefined;
  /** Said once a track is added or removed. */
  status?: string | undefined;
  onToggle?: (id: string, shown: boolean) => void;
  /** Resolves true once the track is added, and the drawer goes back to the list. */
  onAddFile?: (file: File) => Promise<boolean>;
  onAddUrl?: (url: string) => Promise<boolean>;
  onRemove?: (id: string) => void;
  onReset?: () => void;
}

const allSources: readonly { value: TrackSource; label: string }[] = [
  { value: 'suggested', label: 'All tracks' },
  { value: 'file', label: 'Your file' },
  { value: 'url', label: 'By URL' },
];

export function TracksDrawer({ tracks, sources = ['suggested', 'file', 'url'], assembly = 'the browser’s assembly', adding = false, addError, status, onToggle, onAddFile, onAddUrl, onRemove, onReset, open = false, inline = false, onClose = () => {} }: TracksDrawerProps) {
  const offered = allSources.filter((option) => sources.includes(option.value));
  const [source, setSource] = useState('suggested');
  const [url, setUrl] = useState('');
  const backToList = async (adding: Promise<boolean> | undefined) => {
    if (!(await adding)) return;
    setUrl('');
    setSource('suggested');
  };
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Cleared so the same file can be chosen again after a fix.
    event.target.value = '';
    if (file) void backToList(onAddFile?.(file));
  };

  return (
    <Drawer
      title="Tracks"
      subtitle="Choose what the browser shows. Your choices stay for this browser."
      open={open}
      inline={inline}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Done</Button>
          <Button variant="ghost" onClick={onReset}>
            Reset to default tracks
          </Button>
        </>
      }
    >
      <div className="tracks-panel">
        {offered.length > 1 && <SegmentedControl label="Show tracks, or add them from" hideLabel size="small" segments={offered} value={source} onChange={setSource} />}
        {status && (
          <p className="tracks-status" role="status">
            {status}
          </p>
        )}
        {source === 'suggested' && (
          <ul className="tracks-list">
            {tracks.map((track) => (
              <li key={track.id} className={track.removable ? 'is-removable' : undefined}>
                <Checkbox label={track.label} checked={track.shown} onChange={(event) => onToggle?.(track.id, event.target.checked)} />
                {track.removable && (
                  <Button variant="ghost" size="small" aria-label={`Remove ${track.label}`} onClick={() => onRemove?.(track.id)}>
                    Remove
                  </Button>
                )}
                <span className="tracks-source">{track.source}</span>
              </li>
            ))}
          </ul>
        )}
        {source === 'file' && (
          <FileField
            label="bigWig or bigBed file"
            hint={`On ${assembly}. It’s read in this browser and never uploaded.`}
            accept=".bw,.bigwig,.bb,.bigbed"
            error={addError}
            disabled={adding}
            onChange={chooseFile}
          />
        )}
        {source === 'url' && (
          <form
            className="tracks-url"
            onSubmit={(event) => {
              event.preventDefault();
              void backToList(onAddUrl?.(url));
            }}
          >
            <TextInput label="Address of a bigWig or bigBed file" hint={`On ${assembly}, from a server that lets other sites read it (CORS).`} type="url" required value={url} error={addError} onChange={(event) => setUrl(event.target.value)} />
            <Button type="submit" variant="secondary" size="small" loading={adding}>
              Add track
            </Button>
          </form>
        )}
        {source !== 'suggested' && (
          <p className="tracks-note">bigWig holds scores and bigBed holds segments. Both are read in parts, so any size works. Text files need converting first: BED with bedToBigBed, bedGraph with bedGraphToBigWig, WIG with wigToBigWig.</p>
        )}
      </div>
    </Drawer>
  );
}

/** A score track's settings as typed: its height in pixels and the range of values its bars span. */
export interface TrackSettings {
  name: string;
  height: string;
  min: string;
  max: string;
}

export interface TrackSettingsValues {
  height: number;
  min: number;
  max: number;
}

type TrackSettingsField = 'height' | 'min' | 'max';

export const trackHeightLimits = [50, 300] as const;

const numberOf = (text: string) => (text.trim() === '' ? Number.NaN : Number(text.trim().replace('−', '-')));

/** The settings as numbers, or what to fix in each field. */
export function readTrackSettings({ height, min, max }: TrackSettings): { values?: TrackSettingsValues; errors: Partial<Record<TrackSettingsField, string>> } {
  const [low, high] = trackHeightLimits;
  const values = { height: Number.parseFloat(height), min: numberOf(min), max: numberOf(max) };
  const errors: Partial<Record<TrackSettingsField, string>> = {};
  if (!(values.height >= low && values.height <= high)) errors.height = `Enter a height from ${low} to ${high} pixels.`;
  if (!Number.isFinite(values.min)) errors.min = 'Enter a number, such as 0.';
  if (!Number.isFinite(values.max)) errors.max = 'Enter a number, such as 3.';
  else if (Number.isFinite(values.min) && values.max <= values.min) errors.max = 'Enter a number above the lowest value.';
  return Object.keys(errors).length ? { errors } : { values: { ...values, height: Math.round(values.height) }, errors };
}

export interface TrackSettingsDialogProps extends LayerProps {
  settings: TrackSettings;
  onApply?: (values: TrackSettingsValues) => void;
  onReset?: () => void;
}

export function TrackSettingsDialog({ settings, onApply, onReset, open = false, inline = false, onClose = () => {} }: TrackSettingsDialogProps) {
  const [draft, setDraft] = useState(settings);
  const [checked, setChecked] = useState(false);
  const { values, errors } = readTrackSettings(draft);
  const field = (key: TrackSettingsField) => ({
    value: draft[key],
    error: checked ? errors[key] : undefined,
    onChange: (event: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, [key]: event.target.value }),
  });
  const apply = () => {
    setChecked(true);
    if (values) onApply?.(values);
  };

  return (
    <Dialog
      title={`Track settings: ${settings.name}`}
      kind="form"
      size="medium"
      open={open}
      inline={inline}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onReset}>
            Reset track
          </Button>
          <Button onClick={apply}>Apply</Button>
        </>
      }
    >
      <div className="genome-form">
        <TextInput label="Height" hint={`In pixels, ${trackHeightLimits[0]} to ${trackHeightLimits[1]}.`} inputMode="numeric" {...field('height')} />
        <div className="genome-form-row">
          <TextInput label="Lowest value shown" inputMode="decimal" {...field('min')} />
          <TextInput label="Highest value shown" inputMode="decimal" {...field('max')} />
        </div>
      </div>
    </Dialog>
  );
}

export interface ExportSettings {
  format: string;
  width: string;
  highlights: boolean;
  guideline: boolean;
  coordinates: boolean;
}

export interface ExportDialogProps extends LayerProps {
  defaults?: ExportSettings;
  onExport?: (settings: ExportSettings) => void;
}

const exportDefaults: ExportSettings = { format: 'svg', width: '800 px', highlights: true, guideline: true, coordinates: true };

export function ExportDialog({ defaults = exportDefaults, onExport, open = false, inline = false, onClose = () => {} }: ExportDialogProps) {
  const [draft, setDraft] = useState(defaults);
  const toggle = (key: 'highlights' | 'guideline' | 'coordinates') => (event: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, [key]: event.target.checked });

  return (
    <Dialog
      title="Export the view"
      kind="form"
      open={open}
      inline={inline}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onExport?.(draft)}>Export</Button>
        </>
      }
    >
      <div className="genome-form">
        <Select label="Format" options={[{ value: 'svg', label: 'SVG, for publication' }]} value={draft.format} onChange={(format) => setDraft({ ...draft, format })} />
        <TextInput label="Width" value={draft.width} onChange={(event) => setDraft({ ...draft, width: event.target.value })} />
        <Checkbox label="Include highlights" checked={draft.highlights} onChange={toggle('highlights')} />
        <Checkbox label="Include the vertical guideline" checked={draft.guideline} onChange={toggle('guideline')} />
        <Checkbox label="Label with genomic coordinates" checked={draft.coordinates} onChange={toggle('coordinates')} />
      </div>
    </Dialog>
  );
}

export interface BrowserSettings {
  reverseTrackpad: boolean;
  reverseButtons: boolean;
  highlightLocation: boolean;
  guideline: string;
}

export interface BrowserSettingsDialogProps extends LayerProps {
  settings: BrowserSettings;
  onChange?: (settings: BrowserSettings) => void;
  onReset?: () => void;
}

const guidelines = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'off', label: 'Off' },
];

export function BrowserSettingsDialog({ settings, onChange, onReset, open = false, inline = false, onClose = () => {} }: BrowserSettingsDialogProps) {
  const update = (next: Partial<BrowserSettings>) => onChange?.({ ...settings, ...next });

  return (
    <Dialog
      title="Browser settings"
      kind="form"
      open={open}
      inline={inline}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onReset}>
            Reset browser
          </Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <div className="genome-form">
        <Checkbox label="Reverse trackpad scrolling" checked={settings.reverseTrackpad} onChange={(event) => update({ reverseTrackpad: event.target.checked })} />
        <Checkbox label="Reverse scroll buttons and keys" checked={settings.reverseButtons} onChange={(event) => update({ reverseButtons: event.target.checked })} />
        <Checkbox label="Show and highlight the current location" checked={settings.highlightLocation} onChange={(event) => update({ highlightLocation: event.target.checked })} />
        <Select label="Vertical guideline" options={guidelines} value={settings.guideline} onChange={(guideline) => update({ guideline })} />
      </div>
    </Dialog>
  );
}
