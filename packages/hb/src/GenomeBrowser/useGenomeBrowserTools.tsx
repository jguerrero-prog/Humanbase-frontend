import { assemblyNames, useHumanbase, UserTrackError, type GenomeLocation, type UserTrack } from '@humanbase/data';
import { genomeTrackList, hiddenByDefault, suggestedTracks, userDataTrack, type Assembly, type GenomeDataTrack, type GenomeEngineHandle } from '@humanbase/genome';
import { Alert, ExportDialog, saveFile, StoredChoice, TracksDrawer, type ExportSettings, type GenomeCommand } from '@humanbase/ui';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

export interface GenomeBrowserToolsOptions {
  /** Names the browser whose track choices are remembered, such as asd or variant-results. */
  browser: string;
  assembly: Assembly;
  /** The page's own data tracks; suggested tracks for the assembly, then the person's own, come after them. */
  tracks: readonly GenomeDataTrack[];
  location: GenomeLocation;
}

type Panel = 'tracks' | 'export';

const choices = new Map<string, StoredChoice>();
const choiceFor = (key: string) => {
  let choice = choices.get(key);
  if (!choice) choices.set(key, (choice = new StoredChoice(key)));
  return choice;
};

function readHidden(stored: string | undefined, fallback: readonly string[]): readonly string[] {
  try {
    const parsed: unknown = stored === undefined ? fallback : JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : fallback;
  } catch {
    return fallback;
  }
}

const noTracks: readonly UserTrack[] = [];

const exportWidth = (text: string) => {
  const pixels = Number.parseInt(text, 10);
  return Number.isFinite(pixels) ? Math.min(4000, Math.max(200, pixels)) : 800;
};

/** The tracks someone added to this browser from their own files or by address, read back from where the browser keeps them. */
function useAddedTracks(group: string) {
  const { userTracks } = useHumanbase();
  const [added, setAdded] = useState<{ group: string; tracks: readonly UserTrack[] }>({ group, tracks: noTracks });
  useEffect(() => {
    let live = true;
    userTracks.list(group).then(
      (tracks) => live && setAdded({ group, tracks }),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [userTracks, group]);
  const tracks = added.group === group ? added.tracks : noTracks;
  return { userTracks, tracks, change: (next: readonly UserTrack[]) => setAdded({ group, tracks: next }) };
}

/** Tracks and Export for a genome browser: which tracks show, remembered in this browser, and the drawer and dialog that change them. */
export function useGenomeBrowserTools({ browser, assembly, tracks: pageTracks, location }: GenomeBrowserToolsOptions) {
  const [engine, setEngine] = useState<GenomeEngineHandle | null>(null);
  const [panel, setPanel] = useState<Panel>();
  const [exportError, setExportError] = useState<string>();
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string>();
  const [status, setStatus] = useState<string>();
  const group = `${browser}:${assembly}`;
  const added = useAddedTracks(group);
  const tracks = useMemo(() => [...pageTracks, ...suggestedTracks[assembly], ...added.tracks.map(userDataTrack)], [pageTracks, assembly, added.tracks]);
  const defaults = useMemo(() => hiddenByDefault(assembly), [assembly]);
  const choice = choiceFor(`humanbase:genome-tracks:${browser}:${assembly}`);
  const stored = useSyncExternalStore(
    (listener) => choice.subscribe(listener),
    () => choice.read(),
    () => undefined,
  );
  const hidden = useMemo(() => readHidden(stored, defaults), [stored, defaults]);
  const entries = genomeTrackList(assembly, tracks).map((track) => ({ id: track.id, label: track.name, source: track.meta, shown: !hidden.includes(track.id), removable: added.tracks.some((mine) => mine.name === track.id) }));
  const showOnly = (next: readonly string[]) => choice.write(JSON.stringify(next));
  const close = () => {
    setPanel(undefined);
    setAddError(undefined);
    setStatus(undefined);
  };

  const add = async (source: File | string) => {
    setAddError(undefined);
    setStatus(undefined);
    if (typeof source === 'string' && added.tracks.some((track) => track.key === URL.parse(source.trim())?.href)) {
      setAddError('That address is already in Tracks.');
      return false;
    }
    setAdding(true);
    try {
      const { track, remembered } = await added.userTracks.add(group, source, assembly, entries.map((entry) => entry.id));
      added.change([...added.tracks, track]);
      if (hidden.includes(track.name)) showOnly(hidden.filter((id) => id !== track.name));
      setStatus(remembered ? `${track.name} is added and shown.` : `${track.name} is added for this visit only. This browser wouldn’t store it, so add it again next time.`);
      return true;
    } catch (error) {
      setAddError(error instanceof UserTrackError ? error.message : 'The track couldn’t be added. Try again.');
      return false;
    } finally {
      setAdding(false);
    }
  };

  const remove = (id: string) => {
    const track = added.tracks.find((mine) => mine.name === id);
    if (!track) return;
    added.change(added.tracks.filter((mine) => mine !== track));
    if (hidden.includes(id)) showOnly(hidden.filter((other) => other !== id));
    void added.userTracks.remove(group, track.key);
    setStatus(`${id} is removed.`);
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
        tracks={entries}
        assembly={assemblyNames[assembly]}
        adding={adding}
        addError={addError}
        status={status}
        onToggle={(id, shown) => showOnly(shown ? hidden.filter((other) => other !== id) : [...hidden, id])}
        onAddFile={add}
        onAddUrl={add}
        onRemove={remove}
        onReset={() => showOnly(defaults)}
      />
      <ExportDialog open={panel === 'export'} onClose={close} onExport={(settings) => void exportView(settings)} />
    </>
  );

  return {
    /** Pass as the engine view's ref. */
    attach: setEngine,
    tracks,
    hidden,
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
