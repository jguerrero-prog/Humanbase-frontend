import { RefMark, ReferenceList, type ArticleFigureProps } from '@humanbase/ui';
import type { ReactNode } from 'react';
import { humanbaseCitation } from '../cite';
import analysis from './analysis.png?url';
import narration from './narration.m4a?url';
import pipeline from './pipeline.png?url';

// The About page: Sealfon et al., Nature Methods (2026), as laid out in Figma. scripts/narration has the spoken version.
const { doi } = humanbaseCitation;
const link = (href: string) => <a href={href}>{href}</a>;

export interface AboutSection {
  title: string;
  text: string;
  figure: ArticleFigureProps;
}

export const aboutArticle = {
  title: 'An Interactive AI Platform for Human Biology',
  lead: 'Humanbase uses machine learning to trawl through decades of human genomic research data to reveal previously unseen biological connections.',
  source: 'Sealfon et al., Nature Methods (2026)',
  doi,
  narration: { src: narration, duration: 487 },
  opening: (
    <>
      Increasing quantities of genomic data present an opportunity for uncovering functional and mechanistic insights. However, given the complexity and scale of the data, sophisticated analytical frameworks and integrative approaches are required. In addition, the unique modeling requirements of
      different data modalities and the large number of disease states, tissue types and developmental profiles pose complex challenges. Current analysis methods are often computationally expensive and technically challenging for the end user to apply. There is a need for comprehensive resources that
      bridge the gap between raw data and biological insights, allowing researchers at all levels of computational fluency to bring large data compendia and cutting-edge analytical approaches to bear on their questions of interest. Here, we present Humanbase ({link('https://humanbase.io')}), an
      interactive web-based platform that uses AI to integrate and interpret large-scale human genomic data.
    </>
  ),
  sections: [
    {
      title: 'The pipeline',
      text: 'This dynamic cloud-based software is a resource for data-driven predictions in human molecular biology.',
      figure: {
        image: {
          src: pipeline,
          width: 1746,
          height: 740,
          alt: 'The Humanbase pipeline in four steps. Standardized input: more than 62,000 genomic experiments are standardized with statistical tools. Modeling and training: algorithms model patterns, validate and train using the latest biological knowledge. Prediction: Humanbase applies what has been learned to derive inferences for new biological connections. Exploration: users query data-driven predictions to identify experimental hypotheses that can guide their research.',
        },
      },
    },
    {
      title: 'Analysis',
      text: 'Humanbase offers numerous avenues by which users can probe data-driven predictions:',
      figure: {
        image: {
          src: analysis,
          width: 1746,
          height: 1042,
          alt: 'The seven Humanbase tools. Networks: identify pairwise gene relationships. Modules: select communities of genes that have common functions. Sei and Beluga: predict a variant’s regulatory and epigenetic impact. In silico mutagenesis: profile mutational effects across genetic sequences. ExPecto and ExPectoSC: predict how mutations could affect gene expression. NetWAS: reprioritize nominally significant genome-wide association study hits. Seqweaver: predict the impact of a variant on RNA binding protein interactions.',
        },
        caption: (
          <>
            <strong>Fig. 1 | Overview of the Humanbase framework. </strong>
            Humanbase can be used to address diverse biological problems. A user studying, for example, autism could assess whether autism spectrum disorder-linked variants affect PTEN expression in the brain and the mechanism of dysregulation (for example, disrupted histone marks or transcription
            factor binding) using variant effect predictors such as Sei or ExPectoSC. They could then trace how these effects propagate through cell-type-specific functional gene networks with module detection, revealing potential mechanisms by which genetic variants contribute to autism-related
            dysregulation.
          </>
        ),
        credit: 'Graphics by Lucy Reading-Ikkanda/Simons Foundation, from Fig. 1 of Sealfon et al., Nature Methods (2026).',
      },
    },
  ] satisfies AboutSection[],
  paragraphs: [
    <>
      Humanbase provides access to tissue- and cell-type-specific variant effects prediction frameworks and gene functional networks combined with downstream analysis tools in a user-friendly, freely available server. It integrates over 62,000 public datasets, which are preprocessed and standardized
      using robust pipelines. Humanbase democratizes access to extensively evaluated, computationally intensive tools via distributed computing resources, an intuitive interface requiring no coding experience, and a flexible API for advanced users. To assist users, extensive documentation, use cases for
      each analysis, and links to the publications describing each method are available on the platform ({link('https://humanbase.readthedocs.io/')}).
    </>,
    <>
      Understanding the significance of noncoding variants remains a challenge. Humanbase addresses this with tissue- and cell-type-specific deep learning models trained on the human reference sequence and on large compendia that include thousands of genome-wide profiles of histone marks, transcription
      factor binding sites, DNase hypersensitivity data and RNA-binding profiles. The Beluga and Sei sequence models predict epigenetic and regulatory impacts of variants, ExPecto and ExPectoSC predict expression impacts of variants on tissues and cell types, and Seqweaver assesses post-transcriptional
      impacts of variants through RNA binding protein interactions
      <RefMark refs={[[1, 5]]} />. Each model quantifies variant impact by comparing predicted regulatory activity between reference and alternate alleles, enabling single-nucleotide-resolution predictions for any variant, including rare and previously unobserved variants. By providing the predicted
      impact on each chromatin and regulatory feature, the models elucidate molecular mechanisms of the effect of each variant. Predicted variant impacts are summarized with a disease impact score that quantifies the likely pathogenicity of a mutation
      <RefMark refs={[6]} />. Additionally, an in silico mutagenesis tool allows users to simulate and visualize the effects of every possible nucleotide substitution within a sequence. Predictions can be explored interactively or downloaded for downstream analysis. These capabilities enable
      researchers to identify high-impact and pathogenic regulatory mutations, prioritize variants from sequencing studies and design targeted experiments.
    </>,
    <>
      Beyond variant analysis, Humanbase provides gene–gene functional networks for 146 tissues and cell types (for example, ‘eosinophil’, ‘heart’ and ‘renal glomerulus’). The networks are constructed through Bayesian integration of 987 heterogeneous genomic datasets, spanning approximately 38,000
      experimental conditions, which are weighted on the basis of accuracy and relevance in each specific cell or tissue type
      <RefMark refs={[7]} />. Edges in the networks represent the likelihood that two genes participate in the same biological process or pathway in a particular tissue or cell type. Users can interactively explore the network neighborhoods of genes or gene sets of interest and view the experimental
      evidence supporting gene–gene links (for example, protein–protein interactions, co-expression, transcription factor binding or chemical genetic perturbations). Through the NetWAS tool, the networks also provide a functional context for analysis of quantitative genetics associations, such as
      genome-wide association study results
      <RefMark refs={[7]} />. Functional networks can be used to guide hypothesis generation, experimental design and data interpretation, and query results can be exported as visual images or tabular data for further use.
    </>,
    <>
      Through functional module detection in these context-specific networks, biomedical researchers can interpret the biology of large, complex gene sets such as those generated from screens, omics experiments or differential analyses
      <RefMark refs={[8]} />. Users provide a gene list (20–3,500 genes), and these genes are clustered into modules based on their connectivity within an automatically identified or user-selected relevant tissue network. Modules are annotated using curated databases such as GO and MSIGdb
      <RefMark refs={[9, 10]} />. By identifying these functionally coherent modules, this analysis reveals tissue-specific functional signals that may be overlooked by standard enrichment analyses on the entire gene set.
    </>,
    <>
      Between October 2024 and October 2025, Humanbase served over 20,000 users from 110 countries. It is freely accessible without registration, and its user-friendly web interface supports researchers across varying levels of computational expertise. Humanbase has supported studies addressing diverse
      scientific questions. By making available advanced AI models that leverage large genomic datasets, Humanbase enables the research community to perform sophisticated, context-aware, computationally expensive analyses at the level of variants, genes and gene sets.
    </>,
  ],
  backMatter: [
    {
      title: 'Data availability',
      body: <p>A list of datasets underlying Humanbase is available on the platform ({link('https://humanbase.io/data')}) and in the publications describing each of the methods implemented in the framework.</p>,
    },
    {
      title: 'Code availability',
      body: (
        <p>
          Code for running the models implemented in Humanbase is available through the publications describing each of the methods implemented in the framework. Links to these publications can be found in the documentation at {link('https://humanbase.readthedocs.io/en/latest/citations.html')}.
        </p>
      ),
    },
    {
      title: 'Authors',
      body: (
        <>
          <p>
            Rachel S. G. Sealfon<sup>1</sup>, Chandra L. Theesfeld<sup>2,3</sup>, Julien Funk<sup>2</sup>, Natalie Sauerwald<sup>1</sup>, Aaron K. Wong<sup>1,4,6</sup> & Olga G. Troyanskaya<sup>1,2,3,5,6</sup>
          </p>
          <ol className="article-meta">
            <li>Center for Computational Biology, Flatiron Institute, New York, NY, USA.</li>
            <li>Lewis-Sigler Institute of Integrative Genomics, Princeton University, Princeton, NJ, USA.</li>
            <li>Princeton Precision Health, Princeton University, Princeton, NJ, USA.</li>
            <li>Informatics, Simons Foundation, New York, NY, USA.</li>
            <li>Department of Computer Science, Princeton University, Princeton, NJ, USA.</li>
            <li>These authors jointly supervised this work: Aaron K. Wong, Olga G. Troyanskaya.</li>
          </ol>
          <p>
            Email: <a href="mailto:awong@flatironinstitute.org">awong@flatironinstitute.org</a>; <a href="mailto:ogt@genomics.princeton.edu">ogt@genomics.princeton.edu</a>
          </p>
          <p className="article-meta">Published online: 14 January 2026</p>
        </>
      ),
    },
    {
      title: 'References',
      body: (
        <ReferenceList
          references={[
            'Zhou, J. et al. Nat. Genet. 50, 1171–1179 (2018).',
            'Chen, K. M., Wong, A. K., Troyanskaya, O. G. & Zhou, J. Nat. Genet. 54, 940–949 (2022).',
            'Sokolova, K. et al. Cell Rep. Methods 3, 100580 (2023).',
            'Park, C. Y. et al. Nat. Genet. 53, 166–173 (2021).',
            'Zhou, J. & Troyanskaya, O. G. Nat. Methods 12, 931–934 (2015).',
            'Zhou, J. et al. Nat. Genet. 51, 973–980 (2019).',
            'Greene, C. S. et al. Nat. Genet. 47, 569–576 (2015).',
            'Krishnan, A. et al. Nat. Neurosci. 19, 1454–1462 (2016).',
            'Ashburner, M. et al. Nat. Genet. 25, 25–29 (2000).',
            'Liberzon, A. et al. Cell Syst. 1, 417–425 (2015).',
          ]}
        />
      ),
    },
    {
      title: 'Acknowledgements',
      body: (
        <p>
          We thank the Scientific Computing Core at Flatiron Institute and the San Diego Supercomputing Center for providing infrastructure support for Humanbase. We thank L. Reading-Ikkanda/Simons Foundation for graphic design of Fig. 1. We thank S. Lall, T. Marvin, W. Thistlethwaite, T. Reed and Z. Pan for
          comments on this manuscript and A. Tadych for assistance testing the interface. This work was supported by funding from the NIH NIGMS no. R01GM071966 and Simons Foundation grant 395506. The Flatiron Institute is a division of the Simons Foundation.
        </p>
      ),
    },
    {
      title: 'Author contributions',
      body: (
        <p>
          A.K.W. developed the initial version of Humanbase and supervised the research. J.F. further developed and updated Humanbase and contributed to the manuscript draft. R.S.G.S. drafted the manuscript, updated the documentation and developed the use cases. C.L.T. edited and provided critical feedback on
          the manuscript, documentation, interface and use cases at all stages of development and performed the PTEN validation experiments. N.S. edited the manuscript. O.G.T. conceived the project and supervised the research.
        </p>
      ),
    },
    { title: 'Competing interests', body: <p>The authors declare no competing interests.</p> },
    {
      title: 'Additional information',
      body: (
        <>
          <p>
            <strong>Supplementary information:</strong> The online version contains supplementary material available at {link(doi)}.
          </p>
          <p>
            <strong>Peer review information:</strong> Nature Methods thanks Xin Gao and the other, anonymous reviewer(s) for their contribution to the peer review of this work.
          </p>
        </>
      ),
    },
  ] satisfies { title: string; body: ReactNode }[],
};
