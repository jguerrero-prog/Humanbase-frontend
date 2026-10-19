import type { TissueDatabase } from '@humanbase/data';
import type { ScaleSpec } from '@humanbase/ui';

export type GeneExpressionTool = 'expecto' | 'expecto-sc';

interface Noun {
  /** The segment and context label, such as Tissue systems. */
  label: string;
  single: string;
  singular: string;
  plural: string;
}

export interface GeneExpressionToolInfo {
  name: string;
  home: string;
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
    home: '/expecto/',
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
    home: '/expecto-sc/',
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
