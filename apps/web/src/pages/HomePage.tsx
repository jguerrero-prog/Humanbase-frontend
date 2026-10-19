import { HomeSearch } from '@humanbase/hb';
import { useNavigate } from 'react-router';
import './HomePage.css';

export function HomePage() {
  const navigate = useNavigate();
  return (
    <>
      <title>Humanbase</title>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-inner">
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
    </>
  );
}
