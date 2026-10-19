import { deepseaModels, type VariantModel } from '@humanbase/data';
import { DeepseaForm } from '@humanbase/hb';
import { Breadcrumbs } from '@humanbase/ui';
import { useNavigate } from 'react-router';
import '../ToolPage.css';

export function DeepseaPage({ model }: { model: VariantModel }) {
  const navigate = useNavigate();
  const info = deepseaModels[model];
  return (
    <section className="page-section tool-page">
      <title>{`${info.tool} · Humanbase`}</title>
      <Breadcrumbs items={[{ label: 'Sequence analysis', href: '/sequence-tools/' }, { label: info.tool }]} />
      <header className="tool-page-title">
        <h1>{info.tool}</h1>
        <p>{info.summary}</p>
      </header>
      <DeepseaForm model={model} onModelChange={(next) => void navigate(`/${next}/`)} onStarted={(link) => void navigate(link)} />
    </section>
  );
}
