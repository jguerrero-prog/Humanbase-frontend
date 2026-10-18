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

export interface TracksDrawerProps extends LayerProps {
  tracks: readonly SuggestedTrack[];
  onToggle?: (id: string, shown: boolean) => void;
  onAddFile?: (file: File) => void;
  onAddUrl?: (url: string) => void;
  onReset?: () => void;
}

const sources = [
  { value: 'suggested', label: 'Suggested' },
  { value: 'file', label: 'Your file' },
  { value: 'url', label: 'By URL' },
];

export function TracksDrawer({ tracks, onToggle, onAddFile, onAddUrl, onReset, open = false, inline = false, onClose = () => {} }: TracksDrawerProps) {
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
        <SegmentedControl label="Add tracks from" hideLabel size="small" segments={sources} value={source} onChange={setSource} />
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
        <p className="tracks-note">Your file adds an indexed file (bigWig, bigBed, BAM or tabix VCF). By URL adds a track or a DAS source by its address, as + does today.</p>
      </div>
    </Drawer>
  );
}

export type TrackStyle = 'bars' | 'line' | 'ribbon' | 'points';

export interface TrackSettings {
  name: string;
  style: TrackStyle;
  min: string;
  max: string;
  height: string;
  thresholdLeap: string;
  pinned: boolean;
}

export interface TrackSettingsDialogProps extends LayerProps {
  settings: TrackSettings;
  onApply?: (settings: TrackSettings) => void;
  onReset?: () => void;
}

const styles = [
  { value: 'bars', label: 'Bars' },
  { value: 'line', label: 'Line' },
  { value: 'ribbon', label: 'Ribbon' },
  { value: 'points', label: 'Points' },
];

export function TrackSettingsDialog({ settings, onApply, onReset, open = false, inline = false, onClose = () => {} }: TrackSettingsDialogProps) {
  const [draft, setDraft] = useState(settings);
  const field = (key: 'name' | 'min' | 'max' | 'height' | 'thresholdLeap') => ({
    value: draft[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, [key]: event.target.value }),
  });

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
          <Button onClick={() => onApply?.(draft)}>Apply</Button>
        </>
      }
    >
      <div className="genome-form">
        <TextInput label="Name" {...field('name')} />
        <SegmentedControl label="Draw as" size="small" segments={styles} value={draft.style} onChange={(style) => setDraft({ ...draft, style: style as TrackStyle })} />
        <div className="genome-form-row">
          <TextInput label="Lowest value shown" inputMode="decimal" {...field('min')} />
          <TextInput label="Highest value shown" inputMode="decimal" {...field('max')} />
        </div>
        <div className="genome-form-row">
          <TextInput label="Height" {...field('height')} />
          <TextInput label="Threshold leap" hint="As today; off by default" {...field('thresholdLeap')} />
        </div>
        <Checkbox label="Keep at the top" checked={draft.pinned} onChange={(event) => setDraft({ ...draft, pinned: event.target.checked })} />
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
