import { DeepseaJob } from '../deepsea/DeepseaJob';
import { featureEffects } from '../deepsea/DeepseaResult';
import { DeepseaService } from '../deepsea/DeepseaService';
import { variantModels } from '../deepsea/DeepseaModel';
import { Humanbase } from '../Humanbase';
import { SampleClient } from '../sample/SampleClient';
import { ExpectoService } from './ExpectoService';
import { tissueTitle, TissueVariants } from './TissueVariants';

const offline = () => Humanbase.fromConfig({ api: false, apiBase: '/api' });

describe('ExpectoService.parse', () => {
  it('reads an rsID, a position or a gene symbol', () => {
    expect(ExpectoService.parse(' rs531708574 ')).toEqual({ kind: 'rsid', rsid: 'rs531708574' });
    expect(ExpectoService.parse('chr1:877,047')).toEqual({ kind: 'position', chromosome: 'chr1', position: 877047 });
    expect(ExpectoService.parse('x:12')).toEqual({ kind: 'position', chromosome: 'chrX', position: 12 });
    expect(ExpectoService.parse('irgm')).toEqual({ kind: 'gene', symbol: 'IRGM' });
    expect(ExpectoService.parse('   ')).toBeUndefined();
    expect(ExpectoService.parse('two words')).toBeUndefined();
  });
});

describe('TissueVariants', () => {
  const table = new TissueVariants({
    variants: [
      { chr: 'chr5', position: 150226123, ref: 'G' },
      { chr: 'chr5', position: 150226333, ref: 'T' },
    ],
    tissues: [
      { title: 'Whole Blood', description: 'GTEx', identifier: 'EX:1', slim_terms: [{ title: 'hematopoietic system' }], variants: [{ A: 0.1 }, { A: -0.29, C: -0.601, G: -0.3 }] },
      { title: 'Spleen | GTEx', description: 'GTEx', identifier: 'EX:2', slim_terms: [{ title: 'hematopoietic system' }, { title: 'integument' }], variants: [{ A: 0.4 }, {}] },
      { title: '4Star-hESC', description: 'Roadmap', identifier: 'EX:3', slim_terms: [], variants: [{ T: 0.01 }, { A: 0.02 }] },
    ],
  });

  it('keeps the strongest allele, with its sign', () => {
    expect(table.tissues[0]?.values).toEqual([0.1, -0.601]);
    expect(table.tissues[1]?.values).toEqual([0.4, null]);
  });

  it('folds tissues into systems by their strongest effect', () => {
    expect(table.groups).toEqual(['hematopoietic system', 'integument']);
    expect(table.groupRows()).toEqual([
      { label: 'hematopoietic system', values: [0.4, -0.601] },
      { label: 'integument', values: [0.4, null] },
    ]);
  });

  it('filters by system and resource', () => {
    expect(table.tissuesIn('integument').map((tissue) => tissue.title)).toEqual(['Spleen']);
    expect(tissueTitle('Spleen | GTEx')).toBe('Spleen');
    expect(table.tissuesIn(undefined, 'Roadmap').map((tissue) => tissue.title)).toEqual(['4Star-hESC']);
    expect(table.resources).toEqual(['GTEx', 'Roadmap']);
  });

  it('draws a ruler from a rounded prefix', () => {
    expect(table.axis()).toEqual({ chromosome: 'chr5', offset: 150226000, ticks: [100, 150, 200, 250, 300, 350] });
    expect(table.strongest()).toMatchObject({ value: -0.601, tissue: 'Whole Blood', position: { position: 150226333 } });
  });
});

describe('ExPecto variant search', () => {
  it('keeps only the exact gene, since the API matches the start of the symbol', async () => {
    const gene = (symbol: string) => ({ entrez: 1, standard_name: symbol, systematic_name: symbol });
    const row = (rsid: string, symbol: string) => ({ rsid, chromosome: 'chr17', position: 7579472, ref_allele: 'G', alt_allele: 'C', gene: gene(symbol) });
    const client = new SampleClient({
      'variants@gene__standard_name__istartswith=TP53&page=1&version=v1': () => Promise.resolve({ status: 200, body: { count: 3, next: 'page 2', results: [row('rs1', 'TP53'), row('rs2', 'TP53I3')] } }),
      'variants@gene__standard_name__istartswith=TP53&page=2&version=v1': () => Promise.resolve({ status: 200, body: { count: 3, next: null, results: [row('rs3', 'TP53')] } }),
    });
    const found = await new ExpectoService(client).searchVariants({ kind: 'gene', symbol: 'TP53' });
    expect(found.map((variant) => variant.rsid)).toEqual(['rs1', 'rs3']);
    expect(found[0]).toMatchObject({ change: 'G>C', gene: { symbol: 'TP53' } });
  });

  it('answers the recorded searches with the API off', async () => {
    const { expecto } = offline();
    expect(await expecto.searchVariants({ kind: 'gene', symbol: 'IRGM' })).toHaveLength(17);
    expect((await expecto.searchVariants({ kind: 'rsid', rsid: 'rs531708574' }))[0]?.gene?.symbol).toBe('CCR10');
    expect(await expecto.searchVariants({ kind: 'position', chromosome: 'chr1', position: 877047 })).toHaveLength(1);
    expect(await expecto.variantTotal()).toBe(85312);
  });

  it('reads IRGM’s 204 tissues in 16 systems, and PTEN’s organs, with the API off', async () => {
    const { expecto } = offline();
    const irgm = await expecto.tissueVariants(345611, 'expecto-tissues');
    expect(irgm.positions).toHaveLength(113);
    expect(irgm.tissues).toHaveLength(204);
    expect(irgm.groups).toHaveLength(16);
    const pten = await expecto.tissueVariants(5728, 'clever-tissues');
    expect(pten.groups).toEqual(['brain', 'heart', 'kidney', 'liver', 'lung', 'pancreas', 'retina']);
    await expect(expecto.tissueVariants(100188314, 'expecto-tissues')).rejects.toMatchObject({ status: 404 });
  });
});

describe('ExPecto jobs', () => {
  it('runs on Beluga with expecto turned on, and keeps its own page', () => {
    const form = DeepseaService.formOf({ model: 'expecto', kind: 'vcf', text: 'chr1\t1\t.\tA\tG', fileName: 'example.vcf', genome: 'hg19' });
    expect(form.get('ds_model')).toBe('beluga');
    expect(form.get('expecto')).toBe('true');
    expect(variantModels).not.toContain('expecto');
  });

  it('reads an ExPecto job by its expecto flag', () => {
    const record = { job_id: 'x', created: '2026-10-20T00:00:00Z', ds_model: 'Beluga', status: 'Completed', input_type: 'vcf', genome_assembly: 'hg19' };
    expect(new DeepseaJob({ ...record, expecto: true }).model.tool).toBe('ExPecto');
    expect(new DeepseaJob(record).model.tool).toBe('Beluga');
  });

  it('names each tissue with its resource and system', async () => {
    const features = await offline().deepsea.features('expecto');
    const effects = featureEffects({ chromosome: 'chr5', position: 1, name: 'x', ref_allele: 'A', alt_allele: 'G', feature_predictions: [0.12, -0.03] }, features);
    expect(effects).toEqual([
      { feature: 'Adipose Subcutaneous', cell: 'GTEx', context: 'GTEx, connective tissue', label: 'Adipose Subcutaneous', value: 0.12, group: 'Adipose Subcutaneous, GTEx' },
      { feature: 'Adipose Visceral Omentum', cell: 'GTEx', context: 'GTEx, connective tissue', label: 'Adipose Visceral Omentum', value: -0.03, group: 'Adipose Visceral Omentum, GTEx' },
    ]);
  });
});
