import { HomeSearch } from '@humanbase/hb';
import { Icon } from '@humanbase/ui';
import { useNavigate } from 'react-router';
import { features, updates, type Feature } from './home/content';
import { GwasIllustration, HeatmapIllustration, NetworkIllustration } from './home/illustrations';
import './HomePage.css';

const illustrations: Record<Feature['illustration'], () => React.JSX.Element> = { heatmap: HeatmapIllustration, network: NetworkIllustration, gwas: GwasIllustration };

export function HomePage() {
  const navigate = useNavigate();
  return (
    <>
      <title>Humanbase</title>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-inner home-hero-inner">
          <h1 id="home-title">Predictions of gene function, regulation and interactions in human</h1>
          <p className="home-hero-lead">Tissue and cell-type networks built from 7,463 genome-scale datasets, and models that predict the effects of variants.</p>
          <HomeSearch
            onShowNetwork={(query) => void navigate(query.href)}
            onChooseAnalysis={(analysis) => void navigate(`/${analysis}/`)}
            onExampleSet={() => void navigate('/modules/?example=autism')}
            afterExamples={
              <a className="home-hero-cite" href="/cite/">
                How to cite Humanbase
              </a>
            }
          />
        </div>
      </section>

      <section className="home-how" aria-labelledby="home-how-title">
        <div className="home-inner">
          <h2 id="home-how-title">How Humanbase works</h2>
          {features.map((feature) => {
            const Illustration = illustrations[feature.illustration];
            return (
              <article key={feature.title} className="home-feature">
                <div className="home-feature-text">
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                  <a className="home-arrow-link" href={feature.link.href}>
                    {feature.link.label}
                    <Icon name="arrow-right" size={24} />
                  </a>
                </div>
                <div className="home-feature-image">
                  <Illustration />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-news" aria-labelledby="home-news-title">
        <div className="home-inner">
          <div className="home-news-heading">
            <h2 id="home-news-title">What’s new</h2>
            <a href="/whats-new/">All updates</a>
          </div>
          <ul className="home-news-list">
            {updates.map((update) => (
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
