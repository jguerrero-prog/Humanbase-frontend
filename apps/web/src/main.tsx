import '@humanbase/ui/root.css';
import { HumanBase, HumanBaseProvider, loadAppConfig } from '@humanbase/data';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('index.html is missing <div id="root">.');

void loadAppConfig().then((config) =>
  createRoot(root).render(
    <StrictMode>
      <HumanBaseProvider api={HumanBase.fromConfig(config)}>
        <App />
      </HumanBaseProvider>
    </StrictMode>,
  ),
);
