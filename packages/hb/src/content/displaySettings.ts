// Display settings' choices, shared by the app's dialog and the design system pages that show it.
export const themeOptions = [
  { value: '1', label: 'Theme 1', description: 'Emerald and yellow' },
  { value: '2', label: 'Theme 2', description: 'Blue and gold' },
];

/** The motion choices; the first describes what the device currently asks for. */
export const motionOptions = (deviceMotion: string) => [
  { value: 'device', label: 'Match my device', description: `Currently: ${deviceMotion}` },
  { value: 'reduce', label: 'Reduce motion', description: 'Fades only, no movement' },
  { value: 'full', label: 'Full motion', description: 'Even if my device asks to reduce it' },
];

export const displaySettingsNote = 'Saved in this browser only.';
