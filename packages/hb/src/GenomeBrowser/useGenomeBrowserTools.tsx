import type { GenomeLocation } from '@humanbase/data';
import { genomeTrackList, hiddenByDefault, suggestedTracks, type Assembly, type GenomeDataTrack, type GenomeEngineHandle } from '@humanbase/genome';
import { Alert, ExportDialog, saveFile, StoredChoice, TracksDrawer, type ExportSettings, type GenomeCommand } from '@humanbase/ui';
import { useMemo, useState, useSyncExternalStore } from 'react';

export interface GenomeBrowserToolsOptions {
  /** Names the browser whose track choices are remembered, such as asd or variant-results. */
  browser: string;
  assembly: Assembly;
  /** The page's own data tracks; suggested tracks for the assembly are added after them. */
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

const exportWidth = (text: string) => {
  const pixels = Number.parseInt(text, 10);
  return Number.isFinite(pixels) ? Math.min(4000, Math.max(200, pixels)) : 800;
};

/** Tracks and Export for a genome browser: which tracks show, remembered in this browser, and the drawer and dialog that change them. */
export function useGenomeBrowserTools({ browser, assembly, tracks: pageTracks, location }: GenomeBrowserToolsOptions) {
  const [engine, setEngine] = useState<GenomeEngineHandle | null>(null);
  const [panel, setPanel] = useState<Panel>();
  const [exportError, setExportError] = useState<string>();
  const tracks = useMemo(() => [...pageTracks, ...suggestedTracks[assembly]], [pageTracks, assembly]);
  const defaults = useMemo(() => hiddenByDefault(assembly), [assembly]);
  const choice = choiceFor(`humanbase:genome-tracks:${browser}:${assembly}`);
  const stored = useSyncExternalStore(
    (listener) => choice.subscribe(listener),
    () => choice.read(),
    () => undefined,
  );
  const hidden = useMemo(() => readHidden(stored, defaults), [stored, defaults]);
  const entries = genomeTrackList(assembly, tracks).map((track) => ({ id: track.id, label: track.name, source: track.meta, shown: !hidden.includes(track.id) }));
  const close = () => setPanel(undefined);

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
        onToggle={(id, shown) => choice.write(JSON.stringify(shown ? hidden.filter((other) => other !== id) : [...hidden, id]))}
        onReset={() => choice.write(JSON.stringify(defaults))}
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
