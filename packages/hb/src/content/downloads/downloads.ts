// The Downloads page's files, as humanbase.io/download lists them. Edit this file to add, remove or rename a file.
import networkScriptText from './download_all_networks.py?raw';
import networkScriptHref from './download_all_networks.py?url';

export const downloadsPage = {
  title: 'Downloads',
  lead: 'Humanbase’s tissue networks, gold standards, variant effect predictions and model weights, free to download.',
};

/** A file format: what each line of the file holds. */
export interface FileFormat {
  name: string;
  description: string;
  columns?: string;
}

/** One column of a tissue table: the file each tissue has, named after the tissue. */
export interface TissueFileColumn {
  label: string;
  file: (tissue: string) => string;
  /** Tissues without this file. */
  missing?: readonly string[];
  folder: string;
}

export interface TissueNetworks {
  title: string;
  formats: readonly FileFormat[];
  note?: string;
  tissueLabel: string;
  noun: string;
  filterPlaceholder: string;
  columns: readonly TissueFileColumn[];
  tissues: readonly string[];
  bulkArchives?: readonly BulkArchive[];
  script?: NetworkScript;
}

export interface BulkArchive {
  name: string;
  size: string;
  href: string;
}

export interface NetworkScript {
  name: string;
  href: string;
  text: string;
  description: string;
}

export interface ResourceFile {
  name: string;
  file: string;
  description: string;
  format: string;
  size: string;
  href: string;
}

export interface ResourceGroup {
  title: string;
  description: string;
  /** A page of the Humanbase docs. */
  docs?: string;
  files: readonly ResourceFile[];
}

export interface DownloadCitation {
  method: string;
  authors: string;
  title: string;
  journal: string;
  href: string;
}

const s3 = 'https://s3-us-west-2.amazonaws.com/humanbase';

/** The file name humanbase.io gives a tissue: “B-lymphocyte” is b_lymphocyte. */
export const tissueFileName = (tissue: string) => tissue.toLowerCase().replace(/[^a-z0-9]+/g, '_');

const giantTissues = [
  'global', 'adipose tissue', 'adrenal cortex', 'adrenal gland', 'amygdala', 'aorta', 'artery', 'astrocyte', 'B-lymphocyte', 'basal ganglion',
  'basophil', 'blood', 'blood plasma', 'blood platelet', 'blood vessel', 'bone', 'bone marrow', 'brain', 'bronchial epithelial cell', 'bronchus',
  'cardiac muscle', 'cartilage', 'caudate nucleus', 'caudate putamen', 'cecum', 'central nervous system', 'cerebellar cortex', 'cerebellum',
  'cerebral cortex', 'chondrocyte', 'choroid', 'cochlea', 'colon', 'cornea', 'corpus callosum', 'corpus luteum', 'corpus striatum',
  'culture condition:CD8+ cell', 'dendritic cell', 'dentate gyrus', 'diencephalon', 'duodenum', 'ear', 'embryo', 'eosinophil', 'epidermis',
  'esophagus', 'eye', 'fetus', 'forebrain', 'frontal lobe', 'gastrointestinal tract', 'glia', 'granulocyte', 'hair follicle', 'heart',
  'hematopoietic stem cell', 'hepatocyte', 'hippocampus', 'hypophysis', 'hypothalamus', 'ileum', 'intestine', 'jejunum', 'keratinocyte', 'kidney',
  'large intestine', 'lens', 'leukocyte', 'liver', 'locus ceruleus', 'lung', 'lymph node', 'lymphocyte', 'macrophage', 'mammary epithelium',
  'mammary gland', 'mast cell', 'medulla oblongata', 'megakaryocyte', 'midbrain', 'monocyte', 'mononuclear phagocyte', 'muscle', 'myometrium',
  'natural killer cell', 'nephron', 'nervous system', 'neuron', 'neutrophil', 'nucleus accumbens', 'occipital lobe', 'occipital pole', 'osteoblast',
  'ovarian follicle', 'ovary', 'oviduct', 'pancreas', 'pancreatic islet', 'parietal lobe', 'peripheral nervous system', 'placenta', 'podocyte',
  'pons', 'prostate gland', 'renal glomerulus', 'renal tubule', 'retina', 'salivary gland', 'serum', 'skeletal muscle', 'skin', 'skin fibroblast',
  'small intestine', 'smooth muscle', 'spermatid', 'spermatocyte', 'spermatogonium', 'spinal cord', 'spleen', 'stomach', 'substantia nigra',
  'subthalamic nucleus', 'T-lymphocyte', 'tear gland', 'telencephalon', 'temporal lobe', 'testis', 'thalamus', 'thymocyte', 'thyroid gland',
  'tonsil', 'tooth', 'trachea', 'trophoblast', 'umbilical cord', 'umbilical vein endothelial cell', 'urinary bladder', 'uroepithelium',
  'uterine cervix', 'uterine endometrium', 'uterus', 'vascular endothelial cell', 'vascular endothelium', 'vermiform appendix',
];

const mageTissues = [
  'global', 'acinar cell of salivary gland', 'adipocyte of omentum tissue', 'adipose tissue', 'adrenal gland', 'ammons horn',
  'amnion mesenchymal stem cell', 'amygdala', 'angioblastic mesenchymal cell', 'anterior segment of eyeball', 'anterior uvea', 'aorta',
  'aortic endothelial cell', 'arterial blood vessel', 'artery', 'astrocyte of the cerebellum', 'astrocyte of the cerebral cortex', 'b cell',
  'basal ganglion', 'basophil', 'blood', 'blood cell', 'blood vessel', 'blood vessel endothelium', 'blood vessel smooth muscle', 'bone marrow',
  'brain', 'brainstem', 'bronchus', 'capillary', 'capillary endothelial cell', 'cardiac atrium', 'cardiac chamber', 'cardiac fibroblast',
  'cardiac mesenchymal cell', 'cardiac ventricle', 'cardial valve', 'cardiovascular system', 'caudate nucleus',
  'cd14 positive cd16 positive monocyte', 'cd14 positive monocyte', 'cd4 positive alpha beta t cell', 'cd8 positive alpha beta t cell',
  'central nervous system', 'central nervous system pericyte', 'cerebellum', 'cerebral cortex', 'cerebral hemisphere', 'chondrocyte',
  'chorionic membrane mesenchymal stem cell', 'classical monocyte', 'colon', 'connective tissue', 'conventional dendritic cell', 'cornea',
  'corneal epithelial cell', 'coronary artery', 'corpus striatum', 'cortex of kidney', 'cranial skeletal system', 'dendritic cell',
  'dense regular connective tissue', 'dermis', 'diencephalon', 'digestive system', 'digestive tract', 'dorsal plus ventral thalamus',
  'dorsal striatum', 'duct of male reproductive system', 'embryo', 'endocervix', 'endocrine system', 'endothelial cell of hepatic sinusoid',
  'endothelial cell of umbilical vein', 'endothelium of artery', 'enteric smooth muscle cell', 'epidermal cell', 'epithalamus',
  'epithelial cell of alimentary canal', 'epithelial cell of malassez', 'epithelial cell of prostate', 'epithelial cell of proximal tubule',
  'epithelial cell of tracheobronchial tree', 'epithelium of bronchus', 'esophagus', 'esophagus mucosa', 'exocrine system',
  'extracellular matrix secreting cell', 'eye', 'eye muscle', 'eye surface', 'fallopian tube', 'fat cell', 'female reproductive organ',
  'female reproductive system', 'fibroblast', 'fibroblast of choroid plexus', 'fibroblast of dermis', 'fibroblast of gingiva',
  'fibroblast of lymphatic vessel', 'fibroblast of periodontium', 'fibroblast of the aortic adventitia', 'fibroblast of villous mesenchyme',
  'fibrocyte', 'forebrain', 'frontal cortex', 'gag secreting cell', 'gastrointestinal system', 'gingiva', 'gingival epithelial cell', 'glial cell',
  'globus pallidus', 'glomerular endothelial cell', 'granulocyte', 'gray matter', 'gray matter of telencephalon', 'gut epithelium', 'gyrus',
  'hair follicle', 'hair follicle cell', 'hair follicle dermal papilla cell', 'heart', 'hematopoietic cell', 'hepatic stellate cell',
  'hepatic stem cell', 'hepatocyte', 'hindbrain', 'hippocampal formation', 'hypothalamus', 'immature conventional dendritic cell', 'immune system',
  'integument', 'integumental system', 'integumentary adnexa', 'internal genitalia', 'internal male genitalia', 'intestine', 'jaw region',
  'keratinocyte', 'keratocyte', 'kidney', 'langerhans cell', 'lens of camera type eye', 'leptomeningeal cell', 'leukocyte', 'limbic lobe',
  'limbic system', 'liver', 'lobe of cerebral hemisphere', 'lower respiratory tract epithelium', 'lung', 'lung fibroblast', 'lymphatic vessel',
  'lymphocyte', 'lymphocyte of b lineage', 'lymphoid system', 'macroglial cell', 'macrophage', 'male reproductive system', 'mammary gland',
  'mammary gland epithelial cell', 'mast cell', 'mature alpha beta t cell', 'medulla oblongata', 'mesangial cell', 'mesenchymal cell',
  'mesenchymal stem cell of adipose', 'mesenchymal stem cell of the bone marrow', 'mesenchymal stem cell of umbilical cord', 'metencephalon',
  'middle frontal gyrus', 'middle temporal gyrus', 'monocyte', 'mononuclear cell', 'mouth', 'mouth mucosa', 'muscle cell', 'muscle precursor cell',
  'musculature of body', 'myeloid cell', 'myeloid leukocyte', 'naive t cell', 'natural killer cell', 'neocortex', 'nephron',
  'nephron tubule epithelial cell', 'nervous system', 'neural cell', 'neuron', 'non pigmented ciliary epithelial cell',
  'non terminally differentiated cell', 'nongranular leukocyte', 'nucleus accumbens', 'nucleus of brain',
  'nucleus pulposus cell of intervertebral disc', 'omentum preadipocyte', 'osteoblast', 'ovary', 'oviduct', 'pallium', 'pancreas', 'parietal lobe',
  'pericyte cell', 'peripheral nervous system', 'pigment epithelium of eye', 'pituitary gland', 'placenta', 'placental epithelial cell',
  'plasmacytoid dendritic cell', 'pons', 'preadipocyte', 'preadipocyte of the breast', 'prostate gland', 'prostate stromal cell', 'pulmonary artery',
  'regional part of telencephalon', 'renal cortical epithelial cell', 'renal system', 'reproductive organ', 'reproductive system',
  'respiratory epithelial cell', 'respiratory system', 'respiratory system smooth muscle', 'respiratory tract', 'respiratory tube', 'retina',
  'saliva secreting gland', 'schwann cell', 'sensory system', 'sigmoid colon', 'skeletal joint', 'skeletal muscle satellite cell',
  'skeletal muscle tissue', 'skeletal system', 'skin fibroblast', 'skin of body', 'small intestine', 'smooth muscle cell',
  'smooth muscle cell of large intestine', 'smooth muscle cell of prostate', 'smooth muscle cell of the brachiocephalic vasculature',
  'smooth muscle cell of the brain vasculature', 'smooth muscle cell of the coronary artery', 'smooth muscle cell of the internal thoracic artery',
  'smooth muscle cell of the pulmonary artery', 'smooth muscle cell of the subclavian artery', 'smooth muscle cell of the umbilical artery',
  'smooth muscle cell of the umbilical vein', 'smooth muscle cell of trachea', 'smooth muscle tissue', 'spinal cord', 'spleen', 'stomach',
  'stromal cell', 'subclavian artery', 'subcutaneous fat cell', 'subcutaneous preadipocyte', 'substantia nigra', 'sweat gland', 'synovial cell',
  'synovial joint', 'systemic artery', 't cell', 'telencephalic nucleus', 'telencephalon', 'temporal lobe', 'testis', 'thyroid gland',
  'tibial artery', 'tongue', 'trabecular meshwork cell', 'trachea', 'tracheal epithelial cell', 'transverse colon', 'umbilical blood vessel',
  'umbilical cord blood', 'umbilical vein', 'urinary bladder', 'urothelium', 'uterine cervix', 'uterus', 'uvea',
  'vascular associated smooth muscle cell', 'vasculature', 'vein', 'vein endothelial cell', 'vertebral column', 'vertebrate lens cell',
  'visceral preadipocyte', 'zone of skin',
];

const giantBulkArchives: readonly BulkArchive[] = [
  { name: 'All top edges', size: '70 GB', href: `${s3}/networks/all_top_edges.tar.gz` },
  { name: 'All full networks', size: '291 GB', href: `${s3}/networks/all_networks.tar.gz` },
  { name: 'All standards', size: '208 MB', href: `${s3}/standards/all_standards.tar.gz` },
];

const networkScript: NetworkScript = {
  name: 'download_all_networks.py',
  href: networkScriptHref,
  text: networkScriptText,
  description: 'Download tissue-specific networks using our Python script. This is recommended for downloading all networks incrementally or when dealing with unstable connections. Requirements: Python 3.6+ (no additional packages needed).',
};

export const giantNetworks: TissueNetworks = {
  title: 'GIANT tissue networks',
  formats: [
    { name: 'Top edges', description: 'The network is filtered to only include edges with evidence supporting a tissue-specific functional interaction.', columns: '[entrez gene id 1][entrez gene id 2][posterior prob.]' },
    { name: 'Full network', description: 'The network is fully connected.', columns: '[entrez gene id 1][entrez gene id 2][posterior prob., with known edges set to 1][posterior prob.]' },
    {
      name: 'Gold standard',
      description: 'Each text file (e.g. kidney.dat) contains edges with values 1 through 4 corresponding to C1 - C4 described in our paper. C1 edges are used as positives and C2-C4 are used as negatives to train the tissue-specific models.',
    },
  ],
  note: 'These downloadable networks assume a prior probability of 0.1 to match the displayed networks.',
  tissueLabel: 'Tissue',
  noun: 'tissues',
  filterPlaceholder: 'Filter tissues, for example kidney',
  columns: [
    { label: 'Top edges', folder: `${s3}/networks`, file: (tissue) => `${tissueFileName(tissue)}_top.gz` },
    { label: 'Full network', folder: `${s3}/networks`, file: (tissue) => `${tissueFileName(tissue)}.gz` },
    { label: 'Gold standard', folder: `${s3}/standards`, file: (tissue) => `${tissueFileName(tissue)}.dat`, missing: ['global'] },
  ],
  tissues: giantTissues,
  bulkArchives: giantBulkArchives,
  script: networkScript,
};

export const mageNetworks: TissueNetworks = {
  title: 'MAGE tissue networks',
  formats: [{ name: 'Format', description: 'Tab-delimited text file containing gene-gene edge weights.', columns: '[entrez gene id 1][entrez gene id 2][edge weight]' }],
  tissueLabel: 'Tissue or cell type',
  noun: 'tissues and cell types',
  filterPlaceholder: 'Filter tissues and cell types, for example kidney',
  columns: [{ label: 'Full network', folder: `${s3}/networks/v3`, file: (tissue) => `${tissueFileName(tissue)}.dat.gz` }],
  tissues: mageTissues,
};

export const variantEffectsIntro = 'Access pre-computed variant effect predictions and model weights from Humanbase’s suite of genomic interpretation tools.';

export const variantEffectDownloads: readonly ResourceGroup[] = [
  {
    title: 'ExPecto',
    description: 'ExPecto predicts tissue-specific expression effects of genetic variants from sequence, providing quantitative predictions for how mutations affect gene expression across 218 human tissues and cell types.',
    docs: 'expecto',
    files: [
      {
        name: '1000 Genomes SNP predictions',
        file: 'combined_snps.0.3.zip',
        description: '1000 Genomes variants that passed a minimum predicted effect threshold (>0.3 log fold-change in any tissue).',
        format: 'ZIP archive',
        size: '1.9 GB',
        href: `${s3}/expecto/combined_snps.0.3.zip`,
      },
      {
        name: 'All 1kb mutations',
        file: 'all1kbmutations.tar',
        description: 'Full prediction of all 140 million mutations within 1kb to TSS across the human genome.',
        format: 'TAR archive',
        size: '128 GB',
        href: `${s3}/expecto/all1kbmutations.tar`,
      },
      {
        name: 'Evolutionary constraint analysis',
        file: 'evocon.zip',
        description: 'Variation potential directionality scores and inferred evolutionary constraint probabilities for genes across tissues. Negative scores indicate constraint toward higher expression.',
        format: 'ZIP archive',
        size: '34.4 MB',
        href: `${s3}/expecto/evocon.zip`,
      },
    ],
  },
  {
    title: 'ExPectoSC',
    description: 'ExPectoSC extends ExPecto’s capabilities to predict cell-type-specific chromatin effects and expression changes at single-cell resolution.',
    docs: 'expectosc',
    files: [
      {
        name: 'ClinVar scaled predictions',
        file: 'clinvar_1000G_final_nc_all_info.csv',
        description: 'ExPectoSC predictions for ClinVar variants within +/- 20kb of representative TSS, with z-score normalization using 1000 Genomes variants.',
        format: 'CSV',
        size: '114.4 MB',
        href: 'https://humanbase.s3.us-west-2.amazonaws.com/clever/clinvar_1000G_final_nc_all_info.csv',
      },
      {
        name: 'sLDSC annotations',
        file: 'CLEVER_preds_sLDSC_annot.tgz',
        description: 'Stratified Linkage Disequilibrium Score regression (sLDSC) annotations derived from ExPectoSC predictions.',
        format: 'TGZ (compressed TAR archive)',
        size: '2.0 GB',
        href: 'https://humanbase.s3.us-west-2.amazonaws.com/clever/CLEVER_preds_sLDSC_annot.tgz',
      },
    ],
  },
  {
    title: 'Sei',
    description: 'Sei is a deep learning framework for systematically predicting sequence regulatory activities and understanding human genetics data through comprehensive chromatin profiling predictions.',
    docs: 'sei',
    files: [
      {
        name: 'Sei model resources',
        file: 'resources.tar.gz',
        description: 'Pre-computed resources and reference data for Sei chromatin profiling predictions and regulatory activity analysis.',
        format: 'TAR GZ archive',
        size: '3.4 GB',
        href: `${s3}/sei/resources.tar.gz`,
      },
    ],
  },
  {
    title: 'Seqweaver',
    description: 'Seqweaver predicts how genetic variants affect post-transcriptional RNA-binding protein (RBP) interactions using deep learning models trained on RBP-RNA interaction data from CLIP-seq experiments.',
    docs: 'seqweaver',
    files: [
      {
        name: '1000 Genome Project RBP LDScores',
        file: 'Seqweaver_RBP_ldscores.tar.gz',
        description: 'RBP LDScores for GWAS analysis using the 1000 Genome Project data.',
        format: 'TAR GZ archive',
        size: '33.5 GB',
        href: 'https://humanbase.s3-us-west-2.amazonaws.com/seqweaver/Seqweaver_RBP_ldscores.tar.gz',
      },
      {
        name: 'GnomAD RBP target site dysregulation scores',
        file: 'Seqweaver_RBP_gnomAD.tar.gz',
        description: 'GnomAD (v2.1) Seqweaver RBP target site dysregulation scores.',
        format: 'TAR GZ archive',
        size: '37.6 GB',
        href: 'https://humanbase.s3-us-west-2.amazonaws.com/seqweaver/Seqweaver_RBP_gnomAD.tar.gz',
      },
      {
        name: 'Seqweaver RBP model',
        file: 'Seqweaver-v0.1.tar.gz',
        description: 'Code for making variant effect predictions using Seqweaver RBP models. Also used as the RNA model in the ASD Browser for predicting molecular-level effects of SSC ASD proband mutations.',
        format: 'TAR GZ archive',
        size: '6.6 GB',
        href: 'https://humanbase.s3-us-west-2.amazonaws.com/seqweaver/Seqweaver-v0.1.tar.gz',
      },
    ],
  },
  {
    title: 'DeepSEA/Beluga',
    description: 'DeepSEA Beluga is a deep learning framework that predicts genomic variant effects on chromatin features using convolutional neural networks trained on large-scale chromatin profiling data.',
    docs: 'beluga',
    files: [
      {
        name: 'Model weights',
        file: 'deepsea.beluga.pth',
        description: 'Pre-trained weights for the DeepSEA “Beluga” model, which predicts 2002 chromatin features including transcription factor binding, DNase I sensitivities, and histone marks.',
        format: 'PyTorch model file (.pth)',
        size: '570.4 MB',
        href: 'https://humanbase.s3.us-west-2.amazonaws.com/clever/deepsea.beluga.pth',
      },
    ],
  },
  {
    title: 'ASD Browser',
    description: 'Access the code for making variant effect predictions from the DNA and RNA models used in the ASD Browser analysis.',
    files: [
      {
        name: 'DNA and RNA models',
        file: 'code_asd_dnarna_v3.tar.gz',
        description: 'Code for making variant effect predictions from the DNA and RNA models used in the ASD Browser analysis described in “Whole-genome deep learning analysis reveals causal role of noncoding mutations in autism”.',
        format: 'TAR GZ archive',
        size: '2.19 GB',
        href: 'https://humanbase.s3.amazonaws.com/asd/code_asd_dnarna_v3.tar.gz',
      },
    ],
  },
];

export const downloadCitations: readonly DownloadCitation[] = [
  {
    method: 'ExPectoSC',
    authors: 'Sokolova, K., Theesfeld, C. L., Wong, A. K., Zhang, Z., Dolinski, K., & Troyanskaya, O. G. (2023).',
    title: 'Atlas of primary cell-type specific sequence models of gene expression and variant effects.',
    journal: 'Cell Reports Methods.',
    href: 'https://www.cell.com/cell-reports-methods/fulltext/S2667-2375(23)00224-2',
  },
  {
    method: 'Sei',
    authors: 'Chen, K. M., Wong, A. K., Troyanskaya, O. G., & Zhou, J. (2022).',
    title: 'A sequence-based global map of regulatory activity for deciphering human genetics.',
    journal: 'Nature Genetics.',
    href: 'https://www.nature.com/articles/s41588-022-01102-2',
  },
  {
    method: 'Seqweaver',
    authors: 'Park, C. Y., Zhou, J., Wong, A. K., Chen, K. M., Theesfeld, C. L., Darnell, R. B., & Troyanskaya, O. G. (2021).',
    title: 'Genome-wide landscape of RNA-binding protein target site dysregulation reveals a major impact on psychiatric disorder risk.',
    journal: 'Nature Genetics.',
    href: 'https://www.nature.com/articles/s41588-020-00761-3',
  },
  {
    method: 'ASD Browser',
    authors: 'Zhou, J., Park, C. Y., Theesfeld, C. L., Wong, A. K., Yuan, Y., Scheckel, C., Fak, J. J., Funk, J., Yao, K., Tajima, Y., Packer, A., Darnell, R. B., & Troyanskaya, O. G. (2019).',
    title: 'Whole-genome deep-learning analysis identifies contribution of noncoding mutations to autism risk.',
    journal: 'Nature Genetics.',
    href: 'https://www.nature.com/articles/s41588-019-0420-0',
  },
  {
    method: 'ExPecto',
    authors: 'Zhou, J., Theesfeld, C. L., Yao, K., Chen, K. M., Wong, A. K., & Troyanskaya, O. G. (2018).',
    title: 'Deep learning sequence-based ab initio prediction of variant effects on expression and disease risk.',
    journal: 'Nature Genetics.',
    href: 'https://www.nature.com/articles/s41588-018-0160-6',
  },
  {
    method: 'DeepSEA (Beluga)',
    authors: 'Zhou, J., & Troyanskaya, O. G. (2015).',
    title: 'Predicting the Effects of Noncoding Variants with Deep learning-based Sequence Model.',
    journal: 'Nature Methods.',
    href: 'https://www.nature.com/articles/nmeth.3547',
  },
];
