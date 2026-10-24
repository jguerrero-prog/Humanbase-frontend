import { giantNetworks, mageNetworks, tissueFileName, variantEffectDownloads } from './downloads';

describe('Downloads files', () => {
  it('lists every tissue humanbase.io offers, global first', () => {
    expect(giantNetworks.tissues).toHaveLength(145);
    expect(mageNetworks.tissues).toHaveLength(290);
    expect(giantNetworks.tissues[0]).toBe('global');
    expect(mageNetworks.tissues[0]).toBe('global');
    expect(new Set(mageNetworks.tissues).size).toBe(290);
  });

  it('names files as humanbase.io does', () => {
    expect(tissueFileName('B-lymphocyte')).toBe('b_lymphocyte');
    expect(tissueFileName('culture condition:CD8+ cell')).toBe('culture_condition_cd8_cell');
    const [top, full, standard] = giantNetworks.columns;
    expect(`${top?.folder}/${top?.file('adipose tissue')}`).toBe('https://s3-us-west-2.amazonaws.com/humanbase/networks/adipose_tissue_top.gz');
    expect(full?.file('kidney')).toBe('kidney.gz');
    expect(standard?.missing).toEqual(['global']);
    expect(mageNetworks.columns[0]?.file('ammons horn')).toBe('ammons_horn.dat.gz');
  });

  it('links each variant effect file by its own name', () => {
    const files = variantEffectDownloads.flatMap((group) => group.files);
    expect(files).toHaveLength(11);
    for (const { file, href } of files) expect(href.endsWith(`/${file}`)).toBe(true);
  });
});
