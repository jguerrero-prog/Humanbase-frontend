import { deepseaModels } from '@humanbase/data';
import { categoryCrumbs, DeepseaAbout, DeepseaForm, GeneFinder, geneExpressionTools, VariantSearch, JobColumns } from '@humanbase/hb';
import { Breadcrumbs, Tabs } from '@humanbase/ui';
import { useNavigate, useSearchParams } from 'react-router';
import '../ToolPage.css';

export type ExpectoTab = 'gene' | 'variants' | 'snps';

const paths: Record<ExpectoTab, string> = { gene: '/expecto/', variants: '/expecto/variants/', snps: '/expecto/snps/' };
const tabs = [
  { value: 'gene', label: 'Gene' },
  { value: 'variants', label: 'Submit variants' },
  { value: 'snps', label: 'SNP rsID' },
];

/** ExPecto: a gene's precomputed effects, a variant job, or the variants with the strongest effects. */
export function ExpectoPage({ tab }: { tab: ExpectoTab }) {
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const info = deepseaModels.expecto;
  const geneHref = (entrez: number) => `/expecto/genes/${entrez}/`;

  return (
    <section className="page-section tool-page">
      <title>{`${tab === 'gene' ? '' : `${tabs.find((item) => item.value === tab)?.label} · `}ExPecto · Humanbase`}</title>
      <Breadcrumbs items={[categoryCrumbs.variants, { label: info.tool }]} />
      <header className="tool-page-title">
        <h1>{info.tool}</h1>
        <p>{info.summary}</p>
      </header>
      <Tabs label="ExPecto" tabs={tabs} value={tab} onChange={(next) => void navigate(paths[next as ExpectoTab])}>
        {tab === 'variants' ? (
          <DeepseaForm model="expecto" onModelChange={() => undefined} onStarted={(link) => void navigate(link)} />
        ) : (
          <JobColumns>
            {tab === 'gene' ? (
              <GeneFinder label="Search a gene" placeholder="Search a gene, such as IRGM" examples={geneExpressionTools.expecto.examples} onPick={(entrez) => void navigate(geneHref(entrez))} />
            ) : (
              <VariantSearch query={search.get('q') ?? ''} onQueryChange={(q) => setSearch(q ? { q } : {}, { replace: true })} geneHref={geneHref} />
            )}
            <DeepseaAbout model="expecto" />
          </JobColumns>
        )}
      </Tabs>
    </section>
  );
}
