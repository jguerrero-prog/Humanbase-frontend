import { deepseaModels, GenomeLocation } from '@humanbase/data';
import { seqweaverGnomadTrack } from '@humanbase/genome';
import { seqweaverGnomadEffects } from '@humanbase/ui';
import { categoryCrumbs, productTools } from '../content/product';
import type { PrecomputedVariantSet } from './PrecomputedVariantBrowser';

export const seqweaverGnomadHref = '/seqweaver/gnomad/';

// humanbase.io's /seqweaver: its range, its gnomAD track drawn from 1.5 to 3, and its score.
export const seqweaverGnomad: PrecomputedVariantSet = {
  id: 'seqweaver-gnomad',
  model: 'seqweaver',
  scoreType: 'seqweaver',
  scale: seqweaverGnomadEffects,
  featureNoun: 'protein',
  featurePlural: 'proteins',
  verb: 'binding',
  title: 'Seqweaver gnomAD browser',
  subtitle: 'Explore the predicted RBP target site dysregulation effects of gnomAD variants.',
  crumbs: [categoryCrumbs.variants, { label: productTools.seqweaver.label, href: productTools.seqweaver.href }, { label: 'gnomAD browser' }],
  context: [
    { name: 'Variants', value: 'gnomAD v2.1' },
    { name: 'Model', value: 'Seqweaver, 232 RBP features' },
    { name: 'Genome', value: 'GRCh37/hg19' },
    { name: 'Paper', value: 'Park et al., 2021' },
  ],
  assembly: 'hg19',
  tracks: [seqweaverGnomadTrack([1.5, 3])],
  start: new GenomeLocation('chr1', 2_230_000, 2_440_000),
  sampleStart: new GenomeLocation('chr1', 2_334_000, 2_336_000),
  scoreDocs: { label: 'Score type documentation', href: `${deepseaModels.seqweaver.docsHref}#molecular-level-biochemical-effects-prediction` },
};
