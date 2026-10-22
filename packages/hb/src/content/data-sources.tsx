import { assemblyNames, docsPage, GenomeLocation } from '@humanbase/data';
import { ValueFormat } from '@humanbase/ui';
import type { ReactNode } from 'react';

// The Data sources page, as on humanbase.io/data. Each era tab shows the sources in effect then.
export type DataEra = 'current' | 'up-to-may-2026';

export const dataEras: readonly { value: DataEra; label: string }[] = [
  { value: 'current', label: 'Jun 2026 – present' },
  { value: 'up-to-may-2026', label: 'Up to May 2026' },
];

/** The era named by the page’s ?era= value; anything else is the current era. */
export function dataEraFrom(param: string | null): DataEra {
  return dataEras.find((era) => era.value === param)?.value ?? 'current';
}

/** Text that reads differently in each era. */
class EraText {
  constructor(private readonly byEra: Record<DataEra, string>) {}

  in(era: DataEra) {
    return this.byEra[era];
  }
}

const differs = (current: string, upToMay2026: string) => new EraText({ current, 'up-to-may-2026': upToMay2026 });
const currentOnly: readonly DataEra[] = ['current'];

export interface DataColumn {
  label: string;
  /** Share of the 1200px content width, as in Figma. */
  width: string;
  type: 'text' | 'number';
}

interface DataRowSource {
  cells: readonly (ReactNode | EraText)[];
  eras?: readonly DataEra[] | undefined;
}

export interface DataNote {
  title: string;
  body: ReactNode;
}

interface DataSectionSource {
  title: string;
  description: string;
  columns: readonly DataColumn[];
  rows: readonly DataRowSource[];
  notes?: Partial<Record<DataEra, DataNote>>;
}

export interface DataSection {
  title: string;
  description: string;
  columns: readonly DataColumn[];
  rows: readonly (readonly ReactNode[])[];
  note?: DataNote | undefined;
}

const share = (px: number) => `${((px / 1200) * 100).toFixed(3)}%`;
const column = (label: string, px: number, type: DataColumn['type'] = 'text'): DataColumn => ({ label, width: share(px), type });

const nameAndDetail = [column('Name', 240), column('Detail', 960)];
const versions = [column('Name', 400), column('Version', 300), column('Used in', 500)];
const compendia = [column('Name', 600), column('Studies', 200, 'number'), column('Download', 400)];

const format = new ValueFormat();
const compendiumFile = (file: string) => <a href={`https://humanbase.s3.amazonaws.com/compendia/${file}`}>{file}</a>;
const compendium = (name: string, studies: number, file: string, eras?: readonly DataEra[]): DataRowSource => ({ cells: [name, format.count(studies), compendiumFile(file)], eras });

export const reproducibilityHref = docsPage('reproducibility');

const sections: readonly DataSectionSource[] = [
  {
    title: 'Networks',
    description: 'Tissue and cell-lineage interaction networks built from integrated genomics data.',
    columns: nameAndDetail,
    rows: [
      {
        cells: ['MAGE', '289 tissue/cell-type-specific functional networks plus one global functional network, built from 7,463 studies using a two-stage masked graph autoencoder and tissue-specific gradient-boosting integration framework'],
        eras: currentOnly,
      },
      { cells: ['GIANT', '144 tissue/cell-lineage-specific functional networks plus one global functional network (Greene et al. 2015), built from 987 studies'] },
    ],
  },
  {
    title: 'Gene records',
    description: 'Per-gene identifiers, symbols, types, descriptions, and cross-references used across Humanbase tools.',
    columns: versions,
    rows: [
      {
        cells: [
          'Homo sapiens gene records (NCBI Gene)',
          '2022-05-30',
          'Foundational human gene records (Entrez IDs, symbols, descriptions, cross-references, aliases) used across all Humanbase tools, including the gene metadata shown for entries in the GIANT human compendium',
        ],
      },
      {
        cells: ['MAGE-curated gene records (NCBI Gene)', '2026-01-08', 'Gene index for the MAGE human compendium (36,077 genes including ncRNA, pseudo, snoRNA, and other types not present in GIANT)'],
        eras: currentOnly,
      },
    ],
  },
  {
    title: 'Ontologies',
    description: 'Hierarchies of terms used in Humanbase enrichment analyses and predictions.',
    columns: versions,
    rows: [
      { cells: ['Gene Ontology (Biological Process)', 'releases/2018-05-14', differs('FMD enrichment (GIANT + MAGE), Networks: ‘Process’ panel and gene predictions, SEEK (beta)', 'FMD enrichment, Networks: ‘Process’ panel and gene predictions, SEEK (beta)')] },
      { cells: ['Disease Ontology', 'releases/2017-06-13', differs('FMD enrichment (GIANT + MAGE), Networks: ‘Process’ panel and gene predictions', 'FMD enrichment, Networks: ‘Process’ panel and gene predictions')] },
      { cells: ['Uberon', 'uberon/releases/2022-06-30/ext.owl', 'Dataset tissue tags in SEEK (beta) metadata (not a term-enrichment source)'] },
      { cells: ['BRENDA Ontology', 'releases/2021-10-26', 'Networks: ‘Tissue’ panel'] },
    ],
  },
  {
    title: 'Gene annotations',
    description: 'Gene-to-term mappings used in enrichment analyses, term predictions, and curated gene scores.',
    columns: versions,
    rows: [
      { cells: ['GO BP annotations: Homo sapiens (NCBI gene2go)', '2026-03-16', 'FMD enrichment (MAGE)'], eras: currentOnly },
      { cells: ['GO BP annotations: Homo sapiens (UniProt-GOA)', '2018-03-26', differs('FMD enrichment (GIANT), Networks: ‘Process’ panel and gene predictions, SEEK (beta)', 'FMD enrichment, Networks: ‘Process’ panel and gene predictions, SEEK (beta)')] },
      { cells: ['GO BP annotations: Mus musculus, Caenorhabditis elegans, Drosophila melanogaster, Saccharomyces cerevisiae (GAF)', '2022-05-17', 'SEEK (beta)'] },
      { cells: ['MSigDB Hallmark (H)', 'MSigDB_2023.2.Hs', differs('FMD enrichment (GIANT + MAGE)', 'FMD enrichment')] },
      { cells: ['MSigDB Canonical Pathways (C2-CP)', 'MSigDB_2023.2.Hs', differs('FMD enrichment (GIANT + MAGE)', 'FMD enrichment')] },
      { cells: ['SFARI gene scores', 'SFARI-Gene_human-gene-scores_release_04-17-2018', 'Networks: ‘Process’ panel'] },
      { cells: ['OMIM', '2018-05-17', 'Folded into Disease Ontology terms (not a separate annotation source)'] },
      { cells: ['HPRD tissue annotations', 'Release 9', 'Source for BRENDA tissue mapping at load time (not directly visible as terms)'] },
    ],
  },
  {
    title: 'Network compendia',
    description: 'Genomics studies used to build the networks.',
    columns: compendia,
    rows: [compendium('Human Compendium (MAGE)', 7463, 'mage_human_compendium.tsv', currentOnly), compendium('Human Compendium (GIANT)', 990, 'human_compendium.tsv')],
    notes: {
      'up-to-may-2026': {
        title: 'About reproducibility for this era',
        body: (
          <>
            To reproduce a GIANT FMD or Networks term-enrichment result generated in this era, see <a href={reproducibilityHref}>Reproducing legacy results</a>.
          </>
        ),
      },
    },
  },
  {
    title: 'SEEK (beta) data compendia',
    description: 'Genomics studies used by the SEEK (beta) gene-coexpression search engine.',
    columns: compendia,
    rows: [
      compendium('modSeek homo-sapiens', 12842, 'modseek_human.tsv'),
      compendium('modSeek mus-musculus', 12056, 'modseek_mouse.tsv'),
      compendium('modSeek caenorhabditis-elegans', 398, 'modseek_worm.tsv'),
      compendium('modSeek drosophila-melanogaster', 786, 'modseek_fly.tsv'),
      compendium('modSeek danio-rerio', 343, 'modseek_zebrafish.tsv'),
      compendium('modSeek saccharomyces-cerevisiae', 400, 'modseek_yeast.tsv'),
    ],
  },
  {
    title: 'Variant effect prediction models',
    description: 'Training data sources for deep learning frameworks.',
    columns: [column('Model', 240), column('Training data sources', 960)],
    rows: [
      {
        cells: [
          'DeepSEA (Beluga)',
          <>
            Trained on 2,002 chromatin profile features, including DNase hypersensitivity and ChIP-seq profiles. The complete list of features used to train Beluga can be found at{' '}
            <a href="https://s3-us-west-2.amazonaws.com/humanbase-dev/deepsea/examples/41588_2019_420_MOESM9_ESM.csv">this CSV file</a>.
          </>,
        ],
      },
      {
        cells: [
          'Sei',
          <>
            Trained on 21,907 chromatin profiles, including DNase hypersensitivity, ChIP-seq, and ATAC-seq profiles. The list of profiles incorporated in the Sei model can be found in Supplementary Table 1 of{' '}
            <a href="https://www.nature.com/articles/s41588-022-01102-2">Chen et al 2022</a>.
          </>,
        ],
      },
      {
        cells: [
          'ExPecto',
          <>
            Incorporated the Beluga chromatin profile model as well as 218 tissue expression profiles from GTEx, Roadmap Epigenomics and ENCODE (<a href="https://www.nature.com/articles/s41588-018-0160-6">Zhou et al. 2018</a>).
          </>,
        ],
      },
      {
        cells: [
          'ExPectoSC',
          <>
            Incorporated the Beluga chromatin profile model as well as single-cell gene expression profiles for over 100 cell types from seven organ systems (listed in Supplementary Table 1 of{' '}
            <a href="https://www.cell.com/cell-reports-methods/fulltext/S2667-2375(23)00224-2">Sokolova et al. 2023</a>).
          </>,
        ],
      },
      {
        cells: [
          'Seqweaver',
          <>
            Trained using data from 232 cross-linking immunoprecipitation (CLIP) based RNA binding protein datasets (Supplementary Table 1 of <a href="https://www.nature.com/articles/s41588-020-00761-3">Park et al. 2021</a>).
          </>,
        ],
      },
    ],
  },
  {
    title: 'Genome browser reference',
    description: 'Reference data used by the Humanbase genome browsers.',
    columns: versions,
    rows: [
      {
        cells: [
          <a href="https://genome.ucsc.edu/">Chromosome sizes (UCSC Genome Browser)</a>,
          `${GenomeLocation.chromosomesRecorded} (${Object.values(assemblyNames).join(', ')})`,
          'Genome browsers: where each chromosome ends',
        ],
      },
    ],
  },
];

export const dataSourcesPage = {
  title: 'Data sources',
  lead: 'Humanbase’s source data is refreshed periodically from NCBI, Gene Ontology, MSigDB and other external repositories. The tabs below describe the data in effect during each era.',
};

/** The sections as they read in one era: its rows only, with era-specific text and notes filled in. */
export function dataSourcesFor(era: DataEra): DataSection[] {
  return sections.map(({ notes, rows, ...section }) => ({
    ...section,
    rows: rows.filter((row) => !row.eras || row.eras.includes(era)).map((row) => row.cells.map((cell) => (cell instanceof EraText ? cell.in(era) : cell))),
    note: notes?.[era],
  }));
}
