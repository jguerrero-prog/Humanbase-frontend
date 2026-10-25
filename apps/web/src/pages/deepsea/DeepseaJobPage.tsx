import { DeepseaJobView } from '@humanbase/hb';
import { useParams } from 'react-router';
import { useReadableSearchParams } from '../../useReadableSearchParams';
import '../ToolPage.css';

export function DeepseaJobPage() {
  const { id = '' } = useParams();
  const [params, setParams] = useReadableSearchParams();
  return (
    <section className="page-section tool-page">
      <DeepseaJobView
        key={id}
        id={id}
        variant={params.get('variant') ?? undefined}
        onVariantChange={(variant) => setParams((current) => { current.set('variant', variant); return current; }, { replace: true })}
        region={params.get('region') ?? undefined}
        onRegionChange={(region) => setParams((current) => { current.set('region', region); return current; }, { replace: true })}
      />
    </section>
  );
}
