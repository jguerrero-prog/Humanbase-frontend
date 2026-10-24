import { sequenceToolModels } from './sequenceTools';

describe('sequence tools comparison', () => {
  it('lists each model with its tool, input and the scored line its form shows', () => {
    expect(sequenceToolModels.map(({ name, tool, submit, scored }) => [name, tool.label, submit, scored])).toEqual([
      ['Sei', 'Variant effects', ['Variants (VCF)', 'Regions (BED)'], 'Variants anywhere in the genome can be scored.'],
      ['Beluga', 'Variant effects', ['Variants (VCF)', 'Regions (BED)'], 'Variants anywhere in the genome can be scored.'],
      ['Region scan', 'Variant effects', ['Sequences (FASTA)'], 'Region scan mutates every base of each sequence. It runs on Beluga.'],
      ['Seqweaver', 'Seqweaver', ['Variants (VCF)', 'Regions (BED)', 'Sequences (FASTA)'], 'Variants near genes and splice junctions can be scored.'],
      ['ExPecto', 'Expression effects', ['a gene', 'an rsID', 'Variants (VCF)'], 'Variants within 20 kb of a gene’s start can be scored.'],
      ['ExPecto SC', 'Expression effects', ['a gene'], 'Precomputed variants within 20 kb of a gene’s start.'],
    ]);
  });

  it('opens each model on its own form', () => {
    expect(sequenceToolModels.map((model) => model.href)).toEqual(['/variant-effects/', '/variant-effects/?model=beluga', '/variant-effects/?tab=region-scan', '/seqweaver/', '/expression-effects/', '/expression-effects/?model=expecto-sc']);
  });
});
