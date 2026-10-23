import { dataVersionNames, type DataVersion } from '@humanbase/data';
import { downloadsPage, giantNetworks, mageNetworks, type TissueNetworks } from '@humanbase/hb';
import { ArticleHero, SegmentedControl, Tabs } from '@humanbase/ui';
import { useSearchParams } from 'react-router';
import { TissueNetworkFiles } from './TissueNetworkFiles';
import { VariantEffectFiles } from './VariantEffectFiles';
import './DownloadsPage.css';

const tabs = [
  { value: 'tissue-networks', label: 'Tissue networks' },
  { value: 'variant-effects', label: 'Variant effects' },
] as const;

const versions = (Object.keys(dataVersionNames) as DataVersion[]).map((version) => ({ value: version, label: dataVersionNames[version] }));
const networksOf: Record<DataVersion, TissueNetworks> = { v3: mageNetworks, v1: giantNetworks };

/** humanbase.io/download: tissue networks (MAGE or GIANT) and variant effect files, each tab and version in the URL. */
export function DownloadsPage() {
  const [search, setSearch] = useSearchParams();
  const tab = search.get('tab') === 'variant-effects' ? 'variant-effects' : 'tissue-networks';
  const version: DataVersion = search.get('version') === 'v1' ? 'v1' : 'v3';

  const chooseTab = (next: string) => setSearch(next === 'variant-effects' ? { tab: next } : {});
  const chooseVersion = (next: string) => setSearch(next === 'v1' ? { version: next } : {});

  return (
    <>
      <title>Downloads · Humanbase</title>
      <ArticleHero title={downloadsPage.title} lead={downloadsPage.lead} band="reads" />
      <div className="downloads">
        <Tabs label="Downloads" tabs={tabs} value={tab} onChange={chooseTab}>
          {tab === 'tissue-networks' ? (
            <div className="downloads-group">
              <div className="downloads-section">
                <p className="downloads-intro">Download Humanbase predicted tissue-specific interaction networks.</p>
                <SegmentedControl label="Data version" hideLabel segments={versions} value={version} onChange={chooseVersion} />
              </div>
              <TissueNetworkFiles networks={networksOf[version]} />
            </div>
          ) : (
            <VariantEffectFiles />
          )}
        </Tabs>
      </div>
    </>
  );
}
