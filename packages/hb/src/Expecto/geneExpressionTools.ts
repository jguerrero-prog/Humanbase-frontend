import { deepseaModels, type TissueDatabase } from '@humanbase/data';
import type { ScaleSpec } from '@humanbase/ui';

export type GeneExpressionTool = 'expecto' | 'expecto-sc';

/** The Expression effects page's ways in, in the URL as ?tab=. */
export type ExpressionTab = 'gene' | 'rsid' | 'submit-variants';

export const expressionTabs = [
  { value: 'gene', label: 'Gene' },
  { value: 'rsid', label: 'rsID' },
  { value: 'submit-variants', label: 'Submit variants' },
] as const satisfies readonly { value: ExpressionTab; label: string }[];

interface Noun {
  /** The segment and context label, such as Tissue systems. */
  label: string;
  single: string;
  singular: string;
  plural: string;
}

export interface GeneExpressionToolInfo {
  name: string;
  /** The Model field's option and hint; ExPecto's come from its job form config. */
  option: string;
  modelHint: string;
  /** The tabs the API can answer for this model; the others say so and offer ExPecto. */
  tabs: readonly ExpressionTab[];
  database: TissueDatabase;
  groups: Noun;
  members: Noun;
  scale: ScaleSpec;
  decimals: number;
  positionsNote: string;
  resourceFilter: boolean;
  examples: readonly string[];
}

/** ExPecto gene pages: −1 to 1 with edges at 0.1, 0.3 and 1, as documented on Heatmaps and score legends. */
export const expectoGeneScale: ScaleSpec = { title: 'Expression effect, log fold change', kind: 'diverging', edges: [-1, -0.3, -0.1, 0.1, 0.3, 1], words: ['Decreases', 'Increases expression'] };

// ExPecto SC: edges at 10, 30 and 100, as the Figma gene screen draws them. The proposed z edges (2, 3, 5)
// saturate on real data, where PTEN reaches −140; see the question log.
export const expectoScGeneScale: ScaleSpec = { title: 'Expression effect, z-score', kind: 'diverging', edges: [-100, -30, -10, 10, 30, 100], words: ['Decreases', 'Increases expression'] };

export const geneExpressionTools: Record<GeneExpressionTool, GeneExpressionToolInfo> = {
  expecto: {
    name: 'ExPecto',
    option: deepseaModels.expecto.option,
    modelHint: deepseaModels.expecto.otherModels,
    tabs: ['gene', 'rsid', 'submit-variants'],
    database: 'expecto-tissues',
    groups: { label: 'Tissue systems', single: 'Tissue system', singular: 'tissue system', plural: 'tissue systems' },
    members: { label: 'Tissues', single: 'Tissue', singular: 'tissue', plural: 'tissues' },
    scale: expectoGeneScale,
    decimals: 3,
    positionsNote: 'near the start',
    resourceFilter: true,
    examples: ['IRGM', 'CCR1'],
  },
  'expecto-sc': {
    name: 'ExPecto SC',
    option: 'ExPecto SC (cell types)',
    modelHint: 'ExPecto SC covers primary cell types; ExPecto covers tissues.',
    // The API has no ExPecto SC variant list (/api/variants/ is ExPecto's) and no job that scores a file with it.
    tabs: ['gene'],
    database: 'clever-tissues',
    groups: { label: 'Organs', single: 'Organ', singular: 'organ', plural: 'organs' },
    members: { label: 'Cell types', single: 'Cell type', singular: 'cell type', plural: 'cell types' },
    scale: expectoScGeneScale,
    decimals: 2,
    positionsNote: 'within 20 kb of the start',
    resourceFilter: false,
    examples: ['PTEN'],
  },
};

const expressionHome = '/expression-effects/';

/** The Expression effects page on one tab and model; ExPecto and Gene are the defaults, left out of the URL. */
export function expressionEffectsLink({ tab = 'gene', model = 'expecto' }: { tab?: ExpressionTab | undefined; model?: GeneExpressionTool | undefined } = {}): string {
  const params = new URLSearchParams();
  if (tab !== 'gene') params.set('tab', tab);
  if (model !== 'expecto') params.set('model', model);
  return params.size ? `${expressionHome}?${params}` : expressionHome;
}

export function expressionGeneLink(entrez: number | string, model: GeneExpressionTool = 'expecto'): string {
  return `${expressionHome}genes/${entrez}/${model === 'expecto' ? '' : `?model=${model}`}`;
}
