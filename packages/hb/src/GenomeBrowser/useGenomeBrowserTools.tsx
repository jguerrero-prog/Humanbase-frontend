import type { GenomeLocation } from '@humanbase/data';
import { genomeTrackList, hiddenByDefault, inOrder, isSegmentTrack, moveTrack, noArrangement, suggestedTracks, type Assembly, type GenomeDataTrack, type GenomeEngineHandle, type GenomeScoreTrack, type GenomeTrackArrangement, type GenomeTrackSetting } from '@humanbase/genome';
import { Alert, ExportDialog, saveFile, scoreTrackHeight, StoredChoice, TrackSettingsDialog, TracksDrawer, type ActionMenuItem, type ExportSettings, type GenomeCommand, type TrackSettingsValues } from '@humanbase/ui';
import { useMemo, useState, useSyncExternalStore } from 'react';

export interface GenomeBrowserToolsOptions {
  /** Names the browser whose track choices are remembered, such as asd or variant-results. */
  browser: string;
  assembly: Assembly;
  /** The page's own data tracks; suggested tracks for the assembly are added after them. */
  tracks: readonly GenomeDataTrack[];
  location: GenomeLocation;
}

type Panel = 'tracks' | 'export' | { settings: string };

const choices = new Map<string, StoredChoice>();
const choiceFor = (key: string) => {
  let choice = choices.get(key);
  if (!choice) choices.set(key, (choice = new StoredChoice(key)));
  return choice;
};

function useStored(key: string) {
  const choice = choiceFor(key);
  const stored = useSyncExternalStore(
    (listener) => choice.subscribe(listener),
    () => choice.read(),
    () => undefined,
  );
  return { stored, write: (value: unknown) => choice.write(JSON.stringify(value)) };
}

function parsed(stored: string | undefined): unknown {
  try {
    return stored === undefined ? undefined : JSON.parse(stored);
  } catch {
    return undefined;
  }
}

const idsOf = (value: unknown) => (Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : undefined);

function readHidden(stored: string | undefined, fallback: readonly string[]): readonly string[] {
  return idsOf(parsed(stored)) ?? fallback;
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

function readArrangement(stored: string | undefined): GenomeTrackArrangement {
  const value = parsed(stored) as { order?: unknown; settings?: unknown } | undefined;
  if (!value || typeof value !== 'object') return noArrangement;
  const settings = Object.entries(value.settings && typeof value.settings === 'object' ? value.settings : {}).flatMap(([id, setting]: [string, { height?: unknown; range?: unknown }]) => {
    const height = isNumber(setting?.height) ? setting.height : undefined;
    const [min, max] = Array.isArray(setting?.range) ? (setting.range as unknown[]) : [];
    const range = isNumber(min) && isNumber(max) ? ([min, max] as const) : undefined;
    return height === undefined && range === undefined ? [] : [[id, { height, range }] as const];
  });
  return { order: idsOf(value.order) ?? [], settings: Object.fromEntries(settings) };
}

const exportWidth = (text: string) => {
  const pixels = Number.parseInt(text, 10);
  return Number.isFinite(pixels) ? Math.min(4000, Math.max(200, pixels)) : 800;
};

/** Tracks, track menus and Export for a genome browser: which tracks show, their order and settings, remembered in this browser, and the panels that change them. */
export function useGenomeBrowserTools({ browser, assembly, tracks: pageTracks, location }: GenomeBrowserToolsOptions) {
  const [engine, setEngine] = useState<GenomeEngineHandle | null>(null);
  const [panel, setPanel] = useState<Panel>();
  const [exportError, setExportError] = useState<string>();
  const tracks = useMemo(() => [...pageTracks, ...suggestedTracks[assembly]], [pageTracks, assembly]);
  const defaults = useMemo(() => hiddenByDefault(assembly), [assembly]);
  const shown = useStored(`humanbase:genome-tracks:${browser}:${assembly}`);
  const arranged = useStored(`humanbase:genome-track-layout:${browser}:${assembly}`);
  const hidden = useMemo(() => readHidden(shown.stored, defaults), [shown.stored, defaults]);
  const arrangement = useMemo(() => readArrangement(arranged.stored), [arranged.stored]);
  const listed = new Map(genomeTrackList(assembly, tracks).map((track) => [track.id, track]));
  const order = inOrder([...listed.keys()], arrangement.order);
  const entries = order.flatMap((id) => listed.get(id) ?? []).map((track) => ({ id: track.id, label: track.name, source: track.meta, shown: !hidden.includes(track.id) }));
  const close = () => setPanel(undefined);
  const hide = (id: string) => shown.write(hidden.includes(id) ? hidden : [...hidden, id]);
  const arrange = (change: Partial<GenomeTrackArrangement>) => arranged.write({ ...arrangement, ...change });
  const settle = (id: string, setting: GenomeTrackSetting | undefined) => {
    const others = Object.entries(arrangement.settings).filter(([other]) => other !== id);
    arrange({ settings: Object.fromEntries(setting ? [...others, [id, setting]] : others) });
  };

  // Height and range only mean something for a score track's bars, so only score tracks have settings.
  const scoreTrack = (id: string) => tracks.find((track): track is GenomeScoreTrack => track.name === id && !isSegmentTrack(track));
  const trackMenu = (id: string): ActionMenuItem[] => {
    const visible = order.filter((other) => !hidden.includes(other));
    const settings: ActionMenuItem[] = scoreTrack(id) ? [{ label: 'Track settings…', onSelect: () => setPanel({ settings: id }) }] : [];
    return [
      ...settings,
      { label: 'Move up', dividerBefore: settings.length > 0, disabled: visible[0] === id, onSelect: () => arrange({ order: moveTrack(order, hidden, id, -1) }) },
      { label: 'Move down', disabled: visible.at(-1) === id, onSelect: () => arrange({ order: moveTrack(order, hidden, id, 1) }) },
      { label: 'Remove track', destructive: true, dividerBefore: true, onSelect: () => hide(id) },
    ];
  };

  const editing = typeof panel === 'object' ? panel : undefined;
  const edited = editing && scoreTrack(editing.settings);
  const ownRange = edited?.range ?? ([0, 1] as const);
  const editedSetting = editing && arrangement.settings[editing.settings];
  const [min, max] = editedSetting?.range ?? ownRange;
  // Only what differs from the track's own drawing is kept, so a later change to a track's range still reaches it.
  const apply = (id: string, values: TrackSettingsValues) => {
    const height = values.height === scoreTrackHeight ? undefined : values.height;
    const range = values.min === ownRange[0] && values.max === ownRange[1] ? undefined : ([values.min, values.max] as const);
    settle(id, height === undefined && range === undefined ? undefined : { height, range });
    close();
  };

  const exportView = async (settings: ExportSettings) => {
    setExportError(undefined);
    try {
      const file = await engine?.exportSvg({
        width: exportWidth(settings.width),
        highlights: settings.highlights,
        guideline: settings.guideline,
        title: settings.coordinates ? `${location.format()}, ${location.assemblyName}` : undefined,
      });
      if (file) saveFile(file, location.fileName());
      close();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : String(error));
    }
  };

  const panels = (
    <>
      {exportError && (
        <Alert tone="error" title="The view couldn’t export" dismissible onDismiss={() => setExportError(undefined)}>
          {exportError} Try again once the tracks have loaded.
        </Alert>
      )}
      <TracksDrawer
        open={panel === 'tracks'}
        onClose={close}
        sources={['suggested']}
        tracks={entries}
        onToggle={(id, on) => (on ? shown.write(hidden.filter((other) => other !== id)) : hide(id))}
        onReset={() => {
          shown.write(defaults);
          arranged.write(noArrangement);
        }}
      />
      {editing && edited && (
        <TrackSettingsDialog
          open
          onClose={close}
          settings={{ name: edited.name, height: String(editedSetting?.height ?? scoreTrackHeight), min: String(min), max: String(max) }}
          onApply={(values) => apply(editing.settings, values)}
          onReset={() => {
            settle(editing.settings, undefined);
            close();
          }}
        />
      )}
      <ExportDialog open={panel === 'export'} onClose={close} onExport={(settings) => void exportView(settings)} />
    </>
  );

  return {
    /** Pass as the engine view's ref. */
    attach: setEngine,
    tracks,
    hidden,
    /** The tracks' order and settings, and each track header's menu, for the engine view. */
    arrangement,
    trackMenu,
    shownCount: entries.filter((entry) => entry.shown).length,
    toolbar: { onTracks: () => setPanel('tracks'), onExport: () => setPanel('export') },
    /** Opens Tracks or Export from the browser's keys; false for any other command. */
    onCommand: (command: GenomeCommand) => {
      if (command !== 'openTracks' && command !== 'openExport') return false;
      setPanel(command === 'openTracks' ? 'tracks' : 'export');
      return true;
    },
    panels,
  };
}
