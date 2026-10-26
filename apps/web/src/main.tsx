import '@humanbase/ui/root.css';
import { Humanbase, HumanbaseProvider, loadAppConfig } from '@humanbase/data';
import { LinkBaseProvider } from '@humanbase/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { applyMotion, applyTheme, motionSetting, themeSetting } from './layout/DisplaySettings';
import { appBase, router } from './routes';

const root = document.getElementById('root');
if (!root) throw new Error('index.html is missing <div id="root">.');

applyMotion(motionSetting.get());
applyTheme(themeSetting.get());

void loadAppConfig(`${appBase}/config.json`).then((config) =>
  createRoot(root).render(
    <StrictMode>
      <HumanbaseProvider api={Humanbase.fromConfig(config)}>
        <LinkBaseProvider value={appBase}>
          <RouterProvider router={router} />
        </LinkBaseProvider>
      </HumanbaseProvider>
    </StrictMode>,
  ),
);
