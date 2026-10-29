import { HomeSearch, latestUpdates, ModuleSearch, showIllustrations } from '@humanbase/hb';
import { Icon, useLinkHref } from '@humanbase/ui';
import heroArt from './home/hero-ring.svg?url';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { features, moduleFeatures, type Feature } from './home/content';
import { GwasIllustration, HeatmapIllustration, NetworkIllustration } from './home/illustrations';
import type { ModulesLocationState } from './ModulesPage';
import './HomePage.css';

const illustrations: Record<Feature['illustration'], () => React.JSX.Element> = { heatmap: HeatmapIllustration, network: NetworkIllustration, gwas: GwasIllustration };

const leads = {
  networks: 'Tissue and cell-type networks built from 7,463 genome-scale datasets, and models that predict the effects of variants.',
  modules: 'Find groups of genes that work together in a tissue. Paste a gene list, pick the tissue that fits your study, and see each module’s enriched functions.',
};

export function HomePage() {
  const linkHref = useLinkHref();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const draft = (useLocation().state as ModulesLocationState | null)?.draft;
  const modules = search.get('analysis') === 'modules';
  const chooseAnalysis = (analysis: string) => void navigate(analysis === 'modules' ? '/?analysis=modules' : `/${analysis}/`);
  const cite = (
    <a className="home-hero-cite" href={linkHref('/cite/')}>
      How to cite Humanbase
    </a>
  );
  const shown = modules ? moduleFeatures : features;
  return (
    <>
      <title>{modules ? 'Modules · Humanbase' : 'Humanbase'}</title>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-backdrop" aria-hidden="true">
          <img className="home-hero-art" src={heroArt} alt="" width={720} height={720} />
        </div>
        <div className="home-inner home-hero-inner">
          <h1 id="home-title">Predictions of gene function, regulation and interactions in human</h1>
          <p className="home-hero-lead">{modules ? leads.modules : leads.networks}</p>
          {modules ? (
            <ModuleSearch key={search.get('example') ?? draft?.title ?? ''} example={search.get('example') ?? undefined} draft={draft} onChooseAnalysis={chooseAnalysis} onStarted={(link) => void navigate(link)} afterExamples={cite} />
          ) : (
            <HomeSearch
              onShowNetwork={(query) => void navigate(query.href, { state: { fromSearch: true } })}
              onChooseAnalysis={chooseAnalysis}
              onExampleSet={() => void navigate('/?analysis=modules&example=autism')}
              afterExamples={cite}
            />
          )}
        </div>
      </section>

      <section className="home-how" aria-labelledby="home-how-title">
        <div className="home-inner">
          <h2 id="home-how-title">{modules ? 'How module detection works' : 'How Humanbase works'}</h2>
          {shown.map((feature) => {
            const Illustration = illustrations[feature.illustration];
            return (
              <article key={feature.title} className="home-feature">
                <div className="home-feature-text">
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                  <a className="home-arrow-link" href={linkHref(feature.link.href)}>
                    {feature.link.label}
                    <Icon name="arrow-right" size={24} />
                  </a>
                </div>
                {feature.art ? (
                  <div className="home-feature-image">
                    <img className="home-illustration" src={feature.art} alt="" width={480} height={360} />
                  </div>
                ) : (
                  showIllustrations && (
                    <div className="home-feature-image">
                      <Illustration />
                    </div>
                  )
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-news" aria-labelledby="home-news-title">
        <div className="home-inner">
          <div className="home-news-heading">
            <h2 id="home-news-title">What’s new</h2>
            <a href={linkHref('/whats-new/')}>All updates</a>
          </div>
          <ul className="home-news-list">
            {latestUpdates.map((update) => (
              <li key={update.title}>
                <p className="home-news-date">{update.date}</p>
                <h3>{update.title}</h3>
                <p>{update.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
