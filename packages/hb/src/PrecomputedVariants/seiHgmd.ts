import { deepseaModels, GenomeLocation, SeiHgmdService, tracksBase } from '@humanbase/data';
import { scoreTrack } from '@humanbase/genome';
import { sequenceClassEffects } from '@humanbase/ui';
import { categoryCrumbs, productTools } from '../content/product';
import type { PrecomputedVariantSet } from './PrecomputedVariantBrowser';

/** Linked from the Sei form and the tools comparison rather than the menus, as a dataset rather than a tool. */
export const seiHgmdLink = { label: 'Sei HGMD variants', href: '/variant-effects/hgmd/', description: 'Sei scores for 853 noncoding HGMD disease variants' } as const;

const sei = deepseaModels.sei;
// The first variant in the dataset's order, 50 kb either side, as humanbase.io opens a variant chosen on its heatmap.
const firstVariant = new GenomeLocation('chr17', 73_789_907, 73_889_907);

// humanbase.io's /sei-hgmd: its sequence class score track drawn from 0 to 3, and its 40 sequence classes.
export const seiHgmd: PrecomputedVariantSet = {
  id: 'sei-hgmd',
  ...SeiHgmdService.source,
  scale: sequenceClassEffects,
  featureNoun: sei.featureNoun,
  featurePlural: sei.featurePlural,
  verb: sei.verb,
  title: seiHgmdLink.label,
  subtitle: 'Explore the predicted sequence class scores for 853 noncoding pathogenic mutations from the Human Gene Mutation Database.',
  crumbs: [categoryCrumbs.variants, { label: productTools.variantEffects.label, href: productTools.variantEffects.href }, { label: seiHgmdLink.label }],
  context: [
    { name: 'Variants', value: 'HGMD, 853 noncoding' },
    { name: 'Model', value: sei.kind },
    { name: 'Genome', value: 'GRCh37/hg19' },
  ],
  assembly: 'hg19',
  tracks: [scoreTrack({ name: sequenceClassEffects.legend.title, source: 'Model score', bigWigUrl: `${tracksBase}sei.hgmd.nodup.abs_max.bw`, range: [0, 3] })],
  start: firstVariant,
  sampleStart: firstVariant,
  scoreDocs: { label: 'Score type documentation', href: `${sei.docsHref}#output` },
  // A curated list people read in its order, so Previous and Next go through all of it, as the heatmap lists it.
  steps: 'list',
};
