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
  /** The tool's name mid-sentence, when it differs, as in Run region scan. */
  inSentence?: string;
  /** The genomes the API accepts for this tool; the first is the default. */
  genomes: readonly Genome[];
  /** The inputs the tool takes; the first is where its form opens. */
  inputs: readonly InputKind[];
  /** As humanbase.io's vizInputTypes: the inputs whose results are plotted; other jobs are shown as their files. */
  plotted: readonly InputKind[];
  option: string;
  /** Under the option in the Model menu, such as Earlier model: 2,002 chromatin features. */
  optionDetail?: string;
  /** The model field's label on a result, such as Seqweaver (RNA). */
  kind: string;
  summary: string;
  about: string;
  /** The Model field's hint: how this model sits beside the others. */
  otherModels: string;
  /** A phrase of that hint that links to another page, as Variant effects for Seqweaver. */
  otherModelsLink?: { text: string; href: string };
  /** What the form can score, shown under its input choice. */
  scored?: string;
  /** What each feature is: an RNA-binding protein, a chromatin feature or a sequence class. */
  featureNoun: string;
  featurePlural: string;
  /** What a job shown as files predicted, as in Beluga predicted 2,002 chromatin profiles. */
  profiles?: string;
  /** The feature count when the API's list is too large to load for it: Sei's is 4 MB, and a real job's result file has 21,907 profiles. */
  featureCount?: number;
  /** What a raised feature does, as in Raises binding; empty reads as just Raises. */
  verb: string;
  /** The effects card's name when the model's paper uses another than Molecular effects: Expression effects for ExPecto. */
  effectsHeading?: string;
  /** VCF files for this model add a strand column. */
  strand: boolean;
  /** The scores a result loads up front and keeps in its table, when not all of them: Sei's summary, whose 40 per-class scores load when chosen. */
  summaryScores?: readonly string[];
  /** Names a feature-level score's predictions when the API's feature list doesn't, as for Sei's sequence classes. */
  classFeatures?: { scoreType: string; features: FeaturesRecord };
  /** Strongest effects opens at this threshold. */
  threshold: number;
  bins: EffectBins;
  docsHref: string;
  /** The documentation's name mid-sentence when the form uses another, as in Read the in silico mutagenesis documentation. */
  docsName?: string;
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
    plotted: ['vcf'],
    option: 'Sei (DNA, 2021)',
    optionDetail: 'Current model: 40 sequence classes from 21,907 chromatin profiles',
    kind: 'Sei (DNA)',
    summary: 'Predict how variants change regulatory activity, across 40 sequence classes built from 21,907 chromatin profiles.',
    about: 'Sei is a deep-learning-based framework for systematically predicting sequence regulatory activities and applying sequence information to understand human genetics data.',
    otherModels: 'Sei is the current model. Beluga, from 2019, is still available.',
    scored: 'Variants anywhere in the genome can be scored.',
    featureNoun: 'sequence class',
    featurePlural: 'sequence classes',
    profiles: 'chromatin profiles',
    featureCount: 21907,
    verb: '',
    strand: false,
    summaryScores: ['seqclass'],
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
    plotted: ['vcf', 'bed'],
    option: 'Beluga (DNA, 2019)',
    optionDetail: 'Earlier model: 2,002 chromatin features',
    kind: 'Beluga (DNA)',
    summary: 'Predict how variants change chromatin features: transcription factor binding, histone marks and DNase sensitivity across cell types.',
    about: 'Beluga is a deep learning framework for predicting genomic variant effects on regulatory features using a convolutional neural network trained on chromatin profiling data.',
    otherModels: 'Beluga is the earlier model, from 2019. Sei, from 2021, is the current model.',
    scored: 'Variants anywhere in the genome can be scored.',
    featureNoun: 'chromatin feature',
    featurePlural: 'chromatin features',
    profiles: 'chromatin profiles',
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
    plotted: ['vcf', 'bed'],
    option: 'Seqweaver (RNA)',
    kind: 'Seqweaver (RNA)',
    summary: 'Predict how variants change RNA-binding protein targets and post-transcriptional regulation.',
    about: 'Seqweaver is a deep learning framework for predicting RNA-binding protein target site dysregulation and RNA sequence variant effects.',
    otherModels: 'Seqweaver predicts RNA effects. For DNA effects, use Variant effects.',
    otherModelsLink: { text: 'Variant effects', href: '/variant-effects/' },
    scored: 'Variants near genes and splice junctions can be scored.',
    featureNoun: 'protein',
    featurePlural: 'proteins',
    profiles: 'RNA-binding protein profiles',
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
    plotted: ['vcf'],
    option: 'ExPecto (tissues)',
    kind: 'ExPecto (Beluga model)',
    summary: 'Predict how variants change gene expression across tissues.',
    about:
      'ExPecto leverages deep learning-based sequence models trained on chromatin profiling data, and integrated with spatial transformation and regularized linear models. This framework does not use any variant information, enabling prediction of the expression effect for any variant, even those that are rare or have never been previously observed.',
    otherModels: 'ExPecto is the tissue model; ExPecto SC covers primary cell types.',
    scored: 'Variants within 20 kb of a gene’s start can be scored.',
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
    tool: 'Region scan',
    genomes: ['hg19', 'hg38'],
    inSentence: 'region scan',
    inputs: ['fasta'],
    plotted: ['fasta'],
    option: 'Beluga (DNA, 2019)',
    kind: 'Beluga (DNA)',
    summary: 'Mutate every base of a sequence and see which changes move each of Beluga’s 2,002 chromatin features.',
    about:
      'Perform in silico saturated mutagenesis to discover informative regulatory features within any sequence: it predicts the regulatory effect of mutating every base of the input sequence.',
    otherModels: 'Region scan mutates every base of each sequence. It runs on Beluga.',
    featureNoun: 'chromatin feature',
    featurePlural: 'chromatin features',
    verb: '',
    strand: false,
    threshold: 0.5,
    bins: { strong: 0.5, moderate: 0.25, weak: 0.1 },
    docsHref: docsPage('in-silico-mutagenesis'),
    docsName: 'in silico mutagenesis',
    basedOn: 'beluga',
    insilico: true,
  },
};

/** The Variant effects page's models, newest first; the first is the default. */
export const variantEffectsModels: readonly VariantModel[] = ['sei', 'beluga'];

// Sei and Beluga also read sequences; that input waits on whether it moves to Region scan (#398).
export const variantListInputs: readonly InputKind[] = ['vcf', 'bed'];

/** Sei, Beluga and Seqweaver: the models that aren't another tool run on Beluga. */
export const variantModels = (Object.keys(deepseaModels) as VariantModel[]).filter((model) => !deepseaModels[model].basedOn);

export function modelOf(apiName: string): DeepseaModel | undefined {
  return Object.values(deepseaModels).find((model) => !model.basedOn && model.apiName.toLowerCase() === apiName.toLowerCase());
}
