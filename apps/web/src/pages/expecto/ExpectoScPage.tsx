import { readTheDocs } from '@humanbase/data';
import { GeneFinder, geneExpressionTools, JobColumns } from '@humanbase/hb';
import { AboutPanel, Breadcrumbs, DocsLink } from '@humanbase/ui';
import { useNavigate } from 'react-router';
import '../ToolPage.css';

export function ExpectoScPage() {
  const navigate = useNavigate();
  const tool = geneExpressionTools['expecto-sc'];
  const docsHref = `${readTheDocs}expectosc.html`;
  return (
    <section className="page-section tool-page">
      <title>ExPecto SC · Humanbase</title>
      <Breadcrumbs items={[{ label: 'Sequence analysis', href: '/sequence-tools/' }, { label: tool.name }]} />
      <header className="tool-page-title">
        <h1>{tool.name}</h1>
        <p>Predicted effects of ClinVar and 1000 Genomes variants on gene expression in primary human cell types, within 20 kb of each gene’s start.</p>
      </header>
      <JobColumns>
        <GeneFinder label="Search a gene" placeholder="Search a gene, such as PTEN" examples={tool.examples} onPick={(entrez) => void navigate(`/expecto-sc/genes/${entrez}/`)} />
        <AboutPanel
          tool={tool.name}
          docsHref={docsHref}
          links={
            <DocsLink href={`${docsHref}#download`} icon="download">
              Download additional files
            </DocsLink>
          }
        >
          ExPecto SC is a framework for ab initio sequence-based prediction of mutation gene expression effects for primary human cell types.
        </AboutPanel>
      </JobColumns>
    </section>
  );
}
