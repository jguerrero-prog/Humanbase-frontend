import { GeneFinder, geneExpressionTools, JobAbout } from '@humanbase/hb';
import { Breadcrumbs, Icon, useLinkHref } from '@humanbase/ui';
import { useNavigate } from 'react-router';
import '../ToolPage.css';

export function ExpectoScPage() {
  const linkHref = useLinkHref();
  const navigate = useNavigate();
  const tool = geneExpressionTools['expecto-sc'];
  return (
    <section className="page-section tool-page">
      <title>ExPecto SC · Humanbase</title>
      <Breadcrumbs items={[{ label: 'Sequence analysis', href: '/sequence-tools/' }, { label: tool.name }]} />
      <header className="tool-page-title">
        <h1>{tool.name}</h1>
        <p>Predicted effects of ClinVar and 1000 Genomes variants on gene expression in primary human cell types, within 20 kb of each gene’s start.</p>
      </header>
      <div className="job-columns">
        <GeneFinder label="Search a gene" placeholder="Search a gene, such as PTEN" examples={tool.examples} onPick={(entrez) => void navigate(`/expecto-sc/genes/${entrez}/`)} />
        <JobAbout
          tool={tool.name}
          docsHref="/docs/expecto-sc/"
          examples={[]}
          links={
            <a className="button button-ghost button-small" href={linkHref('/downloads/')}>
              <Icon name="download" size={16} />
              Download additional files
            </a>
          }
        >
          ExPecto SC is a framework for ab initio sequence-based prediction of mutation gene expression effects for primary human cell types.
        </JobAbout>
      </div>
    </section>
  );
}
