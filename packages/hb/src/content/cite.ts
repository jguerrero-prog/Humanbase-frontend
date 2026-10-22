// The How to cite page, as humanbase.io/cite has it. Beluga cites the ExPecto paper there too.

export interface PlatformCitation {
  authors: string;
  title: string;
  journal: string;
  year: string;
  doi: string;
}

export interface MethodCitation {
  tool: string;
  reference: string;
  doi: string;
}

export const humanbaseCitation: PlatformCitation = {
  authors: 'Sealfon, R.S.G., Theesfeld, C.L., Funk, J., Sauerwald, N., Wong, A.K. & Troyanskaya, O.G.',
  title: 'HumanBase: an interactive AI platform for human biology.',
  journal: 'Nat Methods',
  year: '(2026).',
  doi: 'https://doi.org/10.1038/s41592-025-02994-8',
};

const { authors, title, journal, year, doi } = humanbaseCitation;
export const humanbaseCitationText = `${authors} ${title} ${journal} ${year} ${doi}`;

export const doiLink = (doi: string) => `https://doi.org/${doi}`;

export const methodCitations: readonly MethodCitation[] = [
  { tool: 'Functional Networks (GIANT)', reference: 'Greene, C.S. et al. Nat. Genet. 47, 569–576 (2015).', doi: '10.1038/ng.3259' },
  { tool: 'Functional Module Detection', reference: 'Krishnan, A. et al. Nat. Neurosci. 19, 1454–1462 (2016).', doi: '10.1038/nn.4353' },
  { tool: 'Sei', reference: 'Chen, K.M., Wong, A.K., Troyanskaya, O.G. & Zhou, J. Nat. Genet. 54, 940–949 (2022).', doi: '10.1038/s41588-022-01102-2' },
  { tool: 'Beluga', reference: 'Zhou, J. et al. Nat. Genet. 50, 1171–1179 (2018).', doi: '10.1038/s41588-018-0160-6' },
  { tool: 'ExPecto', reference: 'Zhou, J. et al. Nat. Genet. 50, 1171–1179 (2018).', doi: '10.1038/s41588-018-0160-6' },
  { tool: 'ExPectoSC', reference: 'Sokolova, K. et al. Cell Rep. Methods 3, 100580 (2023).', doi: '10.1016/j.crmeth.2023.100580' },
  { tool: 'Seqweaver', reference: 'Park, C.Y. et al. Nat. Genet. 53, 166–173 (2021).', doi: '10.1038/s41588-020-00761-3' },
  { tool: 'DeepSEA', reference: 'Zhou, J. & Troyanskaya, O.G. Nat. Methods 12, 931–934 (2015).', doi: '10.1038/nmeth.3547' },
];

/** The GIANT paper as NetWAS results word it. */
export const netwasCitation = 'Greene CS, Krishnan A, Wong AK, et al. (2015). Understanding multicellular function and disease with human tissue-specific networks. Nature Genetics.';
