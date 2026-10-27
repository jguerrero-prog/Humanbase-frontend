import { displaySettingsNote, motionOptions, themeOptions } from '@humanbase/hb';
import { Button, Dialog, RadioGroup } from '@humanbase/ui';
import { useState } from 'react';
import { BrowserSetting } from './BrowserSetting';

export type MotionChoice = 'device' | 'reduce' | 'full';
export type ThemeChoice = '1' | '2';

export const motionSetting = new BrowserSetting<MotionChoice>('humanbase:motion', 'device', ['device', 'reduce', 'full']);

export function applyMotion(choice: MotionChoice): void {
  if (choice === 'device') delete document.documentElement.dataset.motion;
  else document.documentElement.dataset.motion = choice;
}

// Theme 1, emerald and yellow, is the tokens' base; another theme overrides primitives under data-theme.
export const themeSetting = new BrowserSetting<ThemeChoice>('humanbase:theme', '1', ['1', '2']);

export function applyTheme(choice: ThemeChoice): void {
  if (choice === '1') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = choice;
}

const deviceMotion = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced motion' : 'full motion');

interface DisplaySettingsProps {
  open: boolean;
  onClose: () => void;
}

export function DisplaySettings({ open, onClose }: DisplaySettingsProps) {
  const [motion, setMotion] = useState(() => motionSetting.get());
  const [theme, setTheme] = useState(() => themeSetting.get());
  const save = () => {
    motionSetting.set(motion);
    applyMotion(motion);
    themeSetting.set(theme);
    applyTheme(theme);
    onClose();
  };
  return (
    <Dialog
      title="Display settings"
      kind="form"
      size="medium"
      open={open}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <p>{displaySettingsNote}</p>
      <RadioGroup legend="Theme" options={themeOptions} value={theme} onChange={(value) => setTheme(value as ThemeChoice)} />
      <RadioGroup legend="Motion" options={motionOptions(deviceMotion())} value={motion} onChange={(value) => setMotion(value as MotionChoice)} />
    </Dialog>
  );
}
