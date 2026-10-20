import { readTheDocs } from '@humanbase/data';
import { NetwasForm, type NetwasDraft } from '@humanbase/hb';
import { Breadcrumbs } from '@humanbase/ui';
import { useLocation, useNavigate } from 'react-router';
import '../ToolPage.css';

export interface NetwasLocationState {
  draft?: NetwasDraft;
}

export function NetwasPage() {
  const navigate = useNavigate();
  const draft = (useLocation().state as NetwasLocationState | null)?.draft;
  return (
    <section className="page-section tool-page">
      <title>NetWAS · Humanbase</title>
      <Breadcrumbs items={[{ label: 'Network analysis', href: '/' }, { label: 'NetWAS' }]} />
      <header className="tool-page-title">
        <h1>NetWAS</h1>
        <p>Find disease genes your GWAS may have missed. NetWAS reranks your results using a tissue network. Try the example BMI study.</p>
      </header>
      <NetwasForm draft={draft} docsHref={`${readTheDocs}netwas.html`} onStarted={(link) => void navigate(link)} />
    </section>
  );
}
