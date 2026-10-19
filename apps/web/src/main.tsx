import '@humanbase/ui/root.css';
import { Humanbase, HumanbaseProvider, loadAppConfig } from '@humanbase/data';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { applyMotion, motionSetting } from './layout/DisplaySettings';
import { router } from './routes';

const root = document.getElementById('root');
if (!root) throw new Error('index.html is missing <div id="root">.');

applyMotion(motionSetting.get());

void loadAppConfig().then((config) =>
  createRoot(root).render(
    <StrictMode>
      <HumanbaseProvider api={Humanbase.fromConfig(config)}>
        <RouterProvider router={router} />
      </HumanbaseProvider>
    </StrictMode>,
  ),
);
