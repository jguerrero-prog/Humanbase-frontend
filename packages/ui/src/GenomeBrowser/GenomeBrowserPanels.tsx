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
}

export type TrackSource = 'suggested' | 'file' | 'url';

export interface TracksDrawerProps extends LayerProps {
  tracks: readonly SuggestedTrack[];
  /** Where tracks can come from; a browser that can't read your own files offers only suggested. */
  sources?: readonly TrackSource[];
  onToggle?: (id: string, shown: boolean) => void;
  onAddFile?: (file: File) => void;
  onAddUrl?: (url: string) => void;
  onReset?: () => void;
}

const allSources: readonly { value: TrackSource; label: string }[] = [
  { value: 'suggested', label: 'Suggested' },
  { value: 'file', label: 'Your file' },
  { value: 'url', label: 'By URL' },
];

export function TracksDrawer({ tracks, sources = ['suggested', 'file', 'url'], onToggle, onAddFile, onAddUrl, onReset, open = false, inline = false, onClose = () => {} }: TracksDrawerProps) {
  const offered = allSources.filter((option) => sources.includes(option.value));
  const [source, setSource] = useState('suggested');
  const [url, setUrl] = useState('');
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onAddFile?.(file);
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
        {offered.length > 1 && <SegmentedControl label="Add tracks from" hideLabel size="small" segments={offered} value={source} onChange={setSource} />}
        {source === 'suggested' && (
          <ul className="tracks-list">
            {tracks.map((track) => (
              <li key={track.id}>
                <Checkbox label={track.label} checked={track.shown} onChange={(event) => onToggle?.(track.id, event.target.checked)} />
                <span className="tracks-source">{track.source}</span>
              </li>
            ))}
          </ul>
        )}
        {source === 'file' && <FileField label="Indexed file" hint="bigWig, bigBed, BAM or tabix VCF." accept=".bw,.bigwig,.bb,.bigbed,.bam,.vcf.gz,.tbi,.bai" onChange={chooseFile} />}
        {source === 'url' && (
          <form
            className="tracks-url"
            onSubmit={(event) => {
              event.preventDefault();
              onAddUrl?.(url);
            }}
          >
            <TextInput label="Track or DAS source address" type="url" value={url} onChange={(event) => setUrl(event.target.value)} />
            <Button type="submit" variant="secondary" size="small">
              Add track
            </Button>
          </form>
        )}
        {offered.length > 1 && <p className="tracks-note">Your file adds an indexed file (bigWig, bigBed, BAM or tabix VCF). By URL adds a track or a DAS source by its address, as + does today.</p>}
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
