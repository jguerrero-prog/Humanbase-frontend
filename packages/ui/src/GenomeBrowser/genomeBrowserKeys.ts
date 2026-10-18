export type GenomeCommand =
  | 'moveLeft'
  | 'moveRight'
  | 'zoomIn'
  | 'zoomOut'
  | 'toggleZoom'
  | 'previousVariant'
  | 'nextVariant'
  | 'openTracks'
  | 'openTrackSettings'
  | 'openExport'
  | 'clearHighlights';

interface KeyBinding {
  command: GenomeCommand;
  key: string;
  ctrl?: boolean;
}

// Today's Biodalliance shortcuts, kept as they are.
const bindings: readonly KeyBinding[] = [
  { command: 'previousVariant', key: 'ArrowLeft', ctrl: true },
  { command: 'nextVariant', key: 'ArrowRight', ctrl: true },
  { command: 'moveLeft', key: 'ArrowLeft' },
  { command: 'moveRight', key: 'ArrowRight' },
  { command: 'zoomIn', key: '+' },
  { command: 'zoomIn', key: '=' },
  { command: 'zoomOut', key: '-' },
  { command: 'toggleZoom', key: ' ' },
  { command: 'openTracks', key: 'a' },
  { command: 'openTrackSettings', key: 'e' },
  { command: 'openExport', key: 'x' },
  { command: 'clearHighlights', key: 'c' },
];

export const genomeBrowserShortcuts: Record<'previousVariant' | 'nextVariant' | 'zoomIn' | 'zoomOut' | 'openTracks' | 'openExport', string> = {
  previousVariant: 'Control+ArrowLeft',
  nextVariant: 'Control+ArrowRight',
  zoomIn: '+',
  zoomOut: '-',
  openTracks: 'A',
  openExport: 'X',
};

export const genomeBrowserKeyHelp: readonly (readonly [string, string])[] = [
  ['Arrow keys', 'Move along the genome by a tenth of the view (today: arrow keys).'],
  ['+ and -', 'Zoom in and out one step.'],
  ['Space', 'Toggles between the last two zoom levels, as today.'],
  ['Ctrl and arrows', 'Previous or next variant; the buttons say the same.'],
  ['A, E, X', 'Open Tracks, track settings for the selected track, and Export.'],
  ['C', 'Clear highlights.'],
];

export function genomeCommand(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey'>): GenomeCommand | undefined {
  if (event.altKey) return undefined;
  const ctrl = event.ctrlKey || event.metaKey;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  return bindings.find((binding) => binding.key === key && Boolean(binding.ctrl) === ctrl)?.command;
}
