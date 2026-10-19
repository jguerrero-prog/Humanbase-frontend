import { Button, Dialog, RadioGroup } from '@humanbase/ui';
import { useState } from 'react';
import { BrowserSetting } from './BrowserSetting';

export type MotionChoice = 'device' | 'reduce' | 'full';

export const motionSetting = new BrowserSetting<MotionChoice>('humanbase:motion', 'device', ['device', 'reduce', 'full']);

export function applyMotion(choice: MotionChoice): void {
  if (choice === 'device') delete document.documentElement.dataset.motion;
  else document.documentElement.dataset.motion = choice;
}

const deviceMotion = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced motion' : 'full motion');

interface DisplaySettingsProps {
  open: boolean;
  onClose: () => void;
}

export function DisplaySettings({ open, onClose }: DisplaySettingsProps) {
  const [motion, setMotion] = useState(() => motionSetting.get());
  const save = () => {
    motionSetting.set(motion);
    applyMotion(motion);
    onClose();
  };
  const options = [
    { value: 'device', label: 'Match my device', description: `Currently: ${deviceMotion()}` },
    { value: 'reduce', label: 'Reduce motion', description: 'Fades only, no movement' },
    { value: 'full', label: 'Full motion', description: 'Even if my device asks to reduce it' },
  ];
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
      <p>Saved in this browser only.</p>
      <RadioGroup legend="Motion" options={options} value={motion} onChange={(value) => setMotion(value as MotionChoice)} />
    </Dialog>
  );
}
