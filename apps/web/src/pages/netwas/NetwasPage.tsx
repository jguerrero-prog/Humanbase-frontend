import { docsPage } from '@humanbase/data';
import { categoryCrumbs, NetwasForm, type NetwasDraft } from '@humanbase/hb';
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
      <Breadcrumbs items={[categoryCrumbs.genes, { label: 'NetWAS' }]} />
      <header className="tool-page-title">
        <h1>NetWAS</h1>
        <p>Find disease genes your GWAS may have missed. NetWAS reranks your results using a tissue network. Try it with an example study.</p>
      </header>
      <NetwasForm draft={draft} docsHref={docsPage('netwas')} onStarted={(link) => void navigate(link)} />
    </section>
  );
}
