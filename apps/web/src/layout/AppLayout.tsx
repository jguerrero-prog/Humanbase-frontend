import { JobWatcher, TopBarSearch, productFooter, productSectionFor, productSections, useJobsMenuSummary } from '@humanbase/hb';
import { Banner, Footer, SkipLink, TopBar } from '@humanbase/ui';
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
  const { pathname } = useLocation();
  const onHomepage = pathname === '/';
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
      <TopBar sections={productSections} jobs={jobs} search={!onHomepage} searchField={<TopBarSearch />} {...(current ? { current } : {})} />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer {...productFooter} onDisplaySettings={() => setSettingsOpen(true)} />
      <DisplaySettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <JobWatcher />
    </div>
  );
}
