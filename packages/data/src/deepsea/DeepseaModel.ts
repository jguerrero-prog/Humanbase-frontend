import type { VariantModel } from '../jobs/VariantFileCheck';

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
  /** VCF files for this model add a strand column. */
  strand: boolean;
  /** Strongest effects opens at this threshold. */
  threshold: number;
  bins: EffectBins;
  docsHref: string;
  /** ExPecto runs as a Beluga job with expecto turned on; it has no Model choice of its own. */
  basedOn?: VariantModel;
  expecto?: boolean;
}

const zBins: EffectBins = { strong: 5, moderate: 3, weak: 2 };

export const deepseaModels: Record<VariantModel, DeepseaModel> = {
  sei: {
    id: 'sei',
    apiName: 'Sei',
    tool: 'Sei',
    option: 'Sei (DNA, 2021)',
    kind: 'Sei (DNA)',
    summary: 'Predict how variants change regulatory activity, across 40 sequence classes built from 21,907 chromatin profiles.',
    about: 'Sei is a deep-learning-based framework for systematically predicting sequence regulatory activities and applying sequence information to understand human genetics data.',
    otherModels: 'Beluga also predicts DNA effects; Seqweaver predicts RNA effects.',
    featureNoun: 'sequence class',
    featurePlural: 'sequence classes',
    verb: '',
    strand: false,
    threshold: 0.5,
    bins: { strong: 2, moderate: 1, weak: 0.5 },
    docsHref: '/docs/sei/',
  },
  beluga: {
    id: 'beluga',
    apiName: 'Beluga',
    tool: 'Beluga',
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
    docsHref: '/docs/beluga/',
  },
  seqweaver: {
    id: 'seqweaver',
    apiName: 'SeqWeaver',
    tool: 'Seqweaver',
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
    docsHref: '/docs/seqweaver/',
  },
  expecto: {
    id: 'expecto',
    apiName: 'Beluga',
    tool: 'ExPecto',
    option: 'Beluga (DNA, 2019)',
    kind: 'ExPecto (Beluga model)',
    summary: 'Predict how variants change gene expression across tissues.',
    about:
      'ExPecto leverages deep learning-based sequence models trained on chromatin profiling data, and integrated with spatial transformation and regularized linear models. This framework does not use any variant information, enabling prediction of the expression effect for any variant, even those that are rare or have never been previously observed.',
    otherModels: 'ExPecto builds on Beluga’s chromatin predictions.',
    featureNoun: 'tissue',
    featurePlural: 'tissues',
    verb: 'expression',
    strand: false,
    threshold: 0.1,
    bins: { strong: 0.1, moderate: 0.05, weak: 0.02 },
    docsHref: '/docs/expecto/',
    basedOn: 'beluga',
    expecto: true,
  },
};

/** The models a Model field offers; ExPecto has its own page. */
export const variantModels = (Object.keys(deepseaModels) as VariantModel[]).filter((model) => !deepseaModels[model].basedOn);

export function modelOf(apiName: string): DeepseaModel | undefined {
  return Object.values(deepseaModels).find((model) => !model.basedOn && model.apiName.toLowerCase() === apiName.toLowerCase());
}
