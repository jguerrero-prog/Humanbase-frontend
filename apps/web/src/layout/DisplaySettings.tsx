import { defaultTheme, displaySettingsNote, motionOptions, themeOptions } from '@humanbase/hb';
import { Button, Dialog, RadioGroup } from '@humanbase/ui';
import { useState } from 'react';
import { BrowserSetting } from './BrowserSetting';

export type MotionChoice = 'device' | 'reduce' | 'full';

export const motionSetting = new BrowserSetting<MotionChoice>('humanbase:motion', 'device', ['device', 'reduce', 'full']);

export function applyMotion(choice: MotionChoice): void {
  if (choice === 'device') delete document.documentElement.dataset.motion;
  else document.documentElement.dataset.motion = choice;
}

// Theme 1 is the tokens' base; another theme overrides primitives under data-theme. The list lives in @humanbase/tokens/themes.
export const themeSetting = new BrowserSetting<string>('humanbase:theme', defaultTheme, themeOptions.map((option) => option.value));

export function applyTheme(choice: string): void {
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
      <RadioGroup legend="Theme" options={themeOptions} value={theme} onChange={setTheme} />
      <RadioGroup legend="Motion" options={motionOptions(deviceMotion())} value={motion} onChange={(value) => setMotion(value as MotionChoice)} />
    </Dialog>
  );
}
