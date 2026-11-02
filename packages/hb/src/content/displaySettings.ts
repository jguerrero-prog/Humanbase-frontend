import { themes } from '@humanbase/tokens/themes';

export { defaultTheme } from '@humanbase/tokens/themes';

// Display settings' choices, shared by the app's dialog and the design system pages that show it.
export const themeOptions = themes.map(({ value, label, description }) => ({ value, label, description }));

/** The motion choices; the first describes what the device currently asks for. */
export const motionOptions = (deviceMotion: string) => [
  { value: 'device', label: 'Match my device', description: `Currently: ${deviceMotion}` },
  { value: 'reduce', label: 'Reduce motion', description: 'Fades only, no movement' },
  { value: 'full', label: 'Full motion', description: 'Even if my device asks to reduce it' },
];

export const displaySettingsNote = 'Saved in this browser only.';
