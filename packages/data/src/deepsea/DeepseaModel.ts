import type { InputKind, VariantModel } from '../jobs/VariantFileCheck';
import type { FeaturesRecord } from './DeepseaResult';
import { seiSequenceClasses } from './seiSequenceClasses';

export type Genome = 'hg19' | 'hg38';

export const genomeLabels: Record<Genome, string> = { hg19: 'GRCh37/hg19', hg38: 'GRCh38/hg38' };

/** The z-score bins every DeepSEA feature uses, and Sei's sequence class bins. */
export interface EffectBins {
  strong: number;
  moderate: number;
  weak: number;
}

export interface DeepseaModel {
  id: VariantModel;
  /** The ds_model name the API uses. */
  apiName: 'Sei' | 'Beluga' | 'SeqWeaver';
  tool: string;
  /** The tool's name mid-sentence, when it differs, as in Run in silico mutagenesis. */
  inSentence?: string;
  /** The genomes the API accepts for this tool; the first is the default. */
  genomes: readonly Genome[];
  /** The inputs the tool takes; the first is where its form opens. */
  inputs: readonly InputKind[];
  option: string;
  /** The model field's label on a result, such as Seqweaver (RNA). */
  kind: string;
  summary: string;
  about: string;
  otherModels: string;
  /** What each feature is: an RNA-binding protein, a chromatin feature or a sequence class. */
  featureNoun: string;
  featurePlural: string;
  /** What a raised feature does, as in Raises binding; empty reads as just Raises. */
  verb: string;
  /** The effects card's name when the model's paper uses another than Molecular effects: Expression effects for ExPecto. */
  effectsHeading?: string;
  /** VCF files for this model add a strand column. */
  strand: boolean;
  /** The variant-level scores a result loads, when not all of them; Sei also sends one per sequence class. */
  variantScores?: readonly string[];
  /** Names a feature-level score's predictions when the API's feature list doesn't, as for Sei's sequence classes. */
  classFeatures?: { scoreType: string; features: FeaturesRecord };
  /** Strongest effects opens at this threshold. */
  threshold: number;
  bins: EffectBins;
  docsHref: string;
  /** ExPecto runs as a Beluga job with expecto turned on; it has no Model choice of its own. */
  basedOn?: VariantModel;
  expecto?: boolean;
  /** In silico mutagenesis also runs as a Beluga job, with insilico turned on and sequences as input. */
  insilico?: boolean;
}

/** A page of the Humanbase docs at /docs/, which mirror humanbase.readthedocs.io, such as docsPage('sei') for /docs/sei/. */
export const docsPage = (slug: string) => `/docs/${slug}/`;

const zBins: EffectBins = { strong: 5, moderate: 3, weak: 2 };

export const deepseaModels: Record<VariantModel, DeepseaModel> = {
  sei: {
    id: 'sei',
    apiName: 'Sei',
    tool: 'Sei',
    genomes: ['hg19', 'hg38'],
    inputs: ['vcf', 'bed', 'fasta'],
    option: 'Sei (DNA, 2021)',
    kind: 'Sei (DNA)',
    summary: 'Predict how variants change regulatory activity, across 40 sequence classes built from 21,907 chromatin profiles.',
    about: 'Sei is a deep-learning-based framework for systematically predicting sequence regulatory activities and applying sequence information to understand human genetics data.',
    otherModels: 'Beluga also predicts DNA effects; Seqweaver predicts RNA effects.',
    featureNoun: 'sequence class',
    featurePlural: 'sequence classes',
    verb: '',
    strand: false,
    variantScores: ['seqclass'],
    classFeatures: { scoreType: 'seqclass', features: seiSequenceClasses },
    threshold: 0.5,
    bins: { strong: 2, moderate: 1, weak: 0.5 },
    docsHref: docsPage('sei'),
  },
  beluga: {
    id: 'beluga',
    apiName: 'Beluga',
    tool: 'Beluga',
    genomes: ['hg19', 'hg38'],
    inputs: ['vcf', 'bed', 'fasta'],
    option: 'Beluga (DNA, 2019)',
    kind: 'Beluga (DNA)',
    summary: 'Predict how variants change chromatin features: transcription factor binding, histone marks and DNase sensitivity across cell types.',
    about: 'Beluga is a deep learning framework for predicting genomic variant effects on regulatory features using a convolutional neural network trained on chromatin profiling data.',
    otherModels: 'Sei also predicts DNA effects; Seqweaver predicts RNA effects.',
    featureNoun: 'chromatin feature',
    featurePlural: 'chromatin features',
    verb: '',
    strand: false,
    threshold: 3,
    bins: zBins,
    docsHref: docsPage('beluga'),
  },
  seqweaver: {
    id: 'seqweaver',
    apiName: 'SeqWeaver',
    tool: 'Seqweaver',
    genomes: ['hg19', 'hg38'],
    inputs: ['vcf', 'bed', 'fasta'],
    option: 'Seqweaver (RNA)',
    kind: 'Seqweaver (RNA)',
    summary: 'Predict how variants change RNA-binding protein targets and post-transcriptional regulation.',
    about: 'Seqweaver is a deep learning framework for predicting RNA-binding protein target site dysregulation and RNA sequence variant effects.',
    otherModels: 'Sei and Beluga predict DNA effects.',
    featureNoun: 'protein',
    featurePlural: 'proteins',
    verb: 'binding',
    strand: true,
    threshold: 2,
    bins: zBins,
    docsHref: docsPage('seqweaver'),
  },
  expecto: {
    id: 'expecto',
    apiName: 'Beluga',
    tool: 'ExPecto',
    genomes: ['hg19'],
    inputs: ['vcf'],
    option: 'Beluga (DNA, 2019)',
    kind: 'ExPecto (Beluga model)',
    summary: 'Predict how variants change gene expression across tissues.',
    about:
      'ExPecto leverages deep learning-based sequence models trained on chromatin profiling data, and integrated with spatial transformation and regularized linear models. This framework does not use any variant information, enabling prediction of the expression effect for any variant, even those that are rare or have never been previously observed.',
    otherModels: 'ExPecto builds on Beluga’s chromatin predictions.',
    // ExPecto jobs also list Beluga's dis and mean-evalue scores, but the API answers 500 for them.
    variantScores: ['expecto'],
    featureNoun: 'tissue',
    featurePlural: 'tissues',
    verb: 'expression',
    effectsHeading: 'Expression effects',
    strand: false,
    threshold: 0.1,
    bins: { strong: 0.1, moderate: 0.05, weak: 0.02 },
    docsHref: docsPage('expecto'),
    basedOn: 'beluga',
    expecto: true,
  },
  insilico: {
    id: 'insilico',
    apiName: 'Beluga',
    tool: 'In silico mutagenesis',
    genomes: ['hg19', 'hg38'],
    inSentence: 'in silico mutagenesis',
    inputs: ['fasta'],
    option: 'Beluga (DNA, 2019)',
    kind: 'Beluga (DNA)',
    summary: 'Mutate every base of a sequence and see which changes move each of Beluga’s 2,002 chromatin features.',
    about:
      'Perform in silico saturated mutagenesis to discover informative regulatory features within any sequence: it predicts the regulatory effect of mutating every base of the sequence, for each chromatin feature.',
    otherModels: 'In silico mutagenesis runs on Beluga.',
    featureNoun: 'chromatin feature',
    featurePlural: 'chromatin features',
    verb: '',
    strand: false,
    threshold: 0.5,
    bins: { strong: 0.5, moderate: 0.25, weak: 0.1 },
    docsHref: docsPage('in-silico-mutagenesis'),
    basedOn: 'beluga',
    insilico: true,
  },
};

/** The models a Model field offers; ExPecto has its own page. */
export const variantModels = (Object.keys(deepseaModels) as VariantModel[]).filter((model) => !deepseaModels[model].basedOn);

export function modelOf(apiName: string): DeepseaModel | undefined {
  return Object.values(deepseaModels).find((model) => !model.basedOn && model.apiName.toLowerCase() === apiName.toLowerCase());
}
