import { describe, expect, it } from 'vitest';
import { doiLink, humanbaseCitationText, methodCitations } from './cite';

describe('citations', () => {
  it('writes the Humanbase citation as humanbase.io/cite does', () => {
    expect(humanbaseCitationText).toBe(
      'Sealfon, R.S.G., Theesfeld, C.L., Funk, J., Sauerwald, N., Wong, A.K. & Troyanskaya, O.G. HumanBase: an interactive AI platform for human biology. Nat Methods (2026). https://doi.org/10.1038/s41592-025-02994-8',
    );
  });

  it('lists the eight method papers, Beluga with the ExPecto paper', () => {
    expect(methodCitations.map((paper) => paper.tool)).toEqual(['Functional Networks (GIANT)', 'Functional Module Detection', 'Sei', 'Beluga', 'ExPecto', 'ExPectoSC', 'Seqweaver', 'DeepSEA']);
    const doiOf = (tool: string) => methodCitations.find((paper) => paper.tool === tool)?.doi;
    expect(doiOf('Beluga')).toBe(doiOf('ExPecto'));
  });

  it('links a DOI to doi.org', () => {
    expect(doiLink('10.1038/ng.3259')).toBe('https://doi.org/10.1038/ng.3259');
  });
});
