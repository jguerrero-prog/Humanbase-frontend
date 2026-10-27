import { JobWatcher, Notifications, TopBarSearch, productFooter, productSectionFor, productSections, useJobsMenuSummary } from '@humanbase/hb';
import { Banner, Footer, IconButton, SkipLink, TopBar } from '@humanbase/ui';
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BrowserSetting } from './BrowserSetting';
import { DisplaySettings } from './DisplaySettings';
import './AppLayout.css';

const whatsNew = new BrowserSetting<'shown' | 'dismissed'>('humanbase:whats-new', 'shown', ['shown', 'dismissed']);

export function AppLayout() {
  const [bannerShown, setBannerShown] = useState(() => whatsNew.get() === 'shown');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const jobs = useJobsMenuSummary();
  const { pathname, search } = useLocation();
  const onHomepage = pathname === '/';
  // Networks with no genes chosen shows the homepage's search, so the top bar leaves its own out, as on the homepage.
  const pageHasSearch = onHomepage || (pathname === '/networks/' && !new URLSearchParams(search).has('entrez'));
  const current = productSectionFor(pathname);
  const dismissBanner = () => {
    whatsNew.set('dismissed');
    setBannerShown(false);
  };
  return (
    <div className="app-layout">
      <SkipLink />
      {bannerShown && (
        <Banner action={{ label: 'See what’s new', href: '/whats-new/' }} onDismiss={dismissBanner}>
          We’ve made some changes to Humanbase and we’d like to show you around.
        </Banner>
      )}
      <TopBar sections={productSections} jobs={jobs} search={!pageHasSearch} searchField={<TopBarSearch />} {...(current ? { current } : {})} />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer {...productFooter} />
      <IconButton floating className="display-settings-button" label="Display settings" icon="settings" placement="right" onClick={() => setSettingsOpen(true)} />
      <DisplaySettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <JobWatcher />
      <Notifications />
    </div>
  );
}
