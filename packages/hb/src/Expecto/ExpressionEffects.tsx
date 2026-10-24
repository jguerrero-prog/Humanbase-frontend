import { docsPage } from '@humanbase/data';
import { AboutPanel, Alert, DocsLink, Select } from '@humanbase/ui';
import { DeepseaAbout, DeepseaForm } from '../Deepsea/DeepseaForm';
import { JobColumns } from '../Jobs/JobColumns';
import { expressionGeneLink, geneExpressionTools, type ExpressionTab, type GeneExpressionTool } from './geneExpressionTools';
import { GeneFinder } from './GeneFinder';
import { VariantSearch } from './VariantSearch';
import '../Jobs/JobForm.css';
import './Expecto.css';

export interface ExpressionEffectsProps {
  tab: ExpressionTab;
  model: GeneExpressionTool;
  onModelChange: (model: GeneExpressionTool) => void;
  /** The rsID tab's search, kept in the page URL. */
  query: string;
  onQueryChange: (query: string) => void;
  /** Opens a page in the app, such as a gene's or a new job's. */
  onOpen: (link: string) => void;
}

const models = (Object.keys(geneExpressionTools) as GeneExpressionTool[]).map((value) => ({ value, label: geneExpressionTools[value].option }));
// The job form offers ExPecto from its own config and ExPecto SC, which has no form, as a plain option.
const formModels = ['expecto', { value: 'expecto-sc', label: geneExpressionTools['expecto-sc'].option }] as const;
const isModel = (value: string): value is GeneExpressionTool => value in geneExpressionTools;

const unavailable: Record<Exclude<ExpressionTab, 'gene'>, { title: string; text: string }> = {
  rsid: { title: 'rsID search isn’t available for ExPecto SC yet', text: 'Humanbase has no list of ExPecto SC variants to search yet. ExPecto’s tissue predictions can be searched now.' },
  'submit-variants': { title: 'Submitting variants isn’t available for ExPecto SC yet', text: 'Humanbase can’t score a file with ExPecto SC yet. ExPecto scores the same file across tissues.' },
};

/** One tab of Expression effects: the model first, then a gene, an rsID search or a variant job. */
export function ExpressionEffects({ tab, model, onModelChange, query, onQueryChange, onOpen }: ExpressionEffectsProps) {
  const tool = geneExpressionTools[model];
  const choose = (value: string) => isModel(value) && onModelChange(value);
  const modelField = <Select label="Model" options={models} value={model} onChange={choose} hint={tool.modelHint} />;

  if (tab === 'submit-variants' && tool.tabs.includes(tab)) {
    return <DeepseaForm model="expecto" models={formModels} onModelChange={choose} onStarted={onOpen} />;
  }

  return (
    <JobColumns>
      <div className="expression-effects">
        <div className="job-form-row">{modelField}</div>
        {tab !== 'gene' && !tool.tabs.includes(tab) ? (
          <Alert tone="info" title={unavailable[tab].title} action={{ label: 'Switch to ExPecto', onSelect: () => onModelChange('expecto') }}>
            {unavailable[tab].text}
          </Alert>
        ) : tab === 'rsid' ? (
          <VariantSearch query={query} onQueryChange={onQueryChange} geneHref={(entrez) => expressionGeneLink(entrez)} />
        ) : (
          <GeneFinder key={model} label="Search a gene" placeholder={`Search a gene, such as ${tool.examples[0] ?? ''}`} examples={tool.examples} onPick={(entrez) => onOpen(expressionGeneLink(entrez, model))} />
        )}
      </div>
      <ExpressionAbout model={model} />
    </JobColumns>
  );
}

function ExpressionAbout({ model }: { model: GeneExpressionTool }) {
  if (model === 'expecto') return <DeepseaAbout model="expecto" />;
  const docsHref = docsPage('expectosc');
  return (
    <AboutPanel
      tool={geneExpressionTools[model].name}
      docsHref={docsHref}
      links={
        <DocsLink href={`${docsHref}#download`} icon="download">
          Download additional files
        </DocsLink>
      }
    >
      ExPecto SC is a framework for ab initio sequence-based prediction of mutation gene expression effects for primary human cell types.
    </AboutPanel>
  );
}
