import { DeepseaJobView } from '@humanbase/hb';
import { useParams, useSearchParams } from 'react-router';
import '../ToolPage.css';

export function DeepseaJobPage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  return (
    <section className="page-section tool-page">
      <DeepseaJobView
        key={id}
        id={id}
        variant={params.get('variant') ?? undefined}
        onVariantChange={(variant) => setParams((current) => { current.set('variant', variant); return current; }, { replace: true })}
      />
    </section>
  );
}
