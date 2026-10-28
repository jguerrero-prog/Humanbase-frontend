import { featureEffects } from '../deepsea/DeepseaResult';
import { GenomeLocation } from '../genome/GenomeLocation';
import { SampleGeneLocator } from '../genome/SampleGeneLocator';
import { SampleClient } from '../sample/SampleClient';
import { AsdService } from './AsdService';
import { AsdVariant } from './AsdVariant';

const browserRange = new GenomeLocation('chr1', 2230000, 2440000);

describe('AsdService', () => {
  const client = SampleClient.bundled();
  const service = new AsdService(client, new SampleGeneLocator(client));

  beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => undefined));
  afterEach(() => vi.restoreAllMocks());

  it('reads a table page of 25 from the API’s pages of 20', async () => {
    const page = await service.page(1, 25);
    expect(page.total).toBe(127133);
    expect(page.rows).toHaveLength(25);
    const [first] = page.rows;
    expect(first && new AsdVariant(first).position).toBe('chr1:665,024');
    expect(first).toMatchObject({ individual: '14405-p1', nearestGene: 'SAMD11', tssDistance: 212469, rnaGene: 'RP5-857K21.4, RP11-206L10.2' });
  });

  it('reads every variant in the browser’s range, in genome order', async () => {
    const rows = await service.inRange(browserRange);
    expect(rows).toHaveLength(34);
    expect(rows.map((row) => row.position)).toEqual([...rows.map((row) => row.position)].sort((a, b) => a - b));
  });

  it('stops at the last page a range has', async () => {
    const page = await service.page(2, 25, browserRange);
    expect(page.total).toBe(34);
    expect(page.rows).toHaveLength(9);
  });

  it('names the junction columns, which the table offers under Columns', async () => {
    const columns = await service.columns();
    const offered = columns.filter((name) => !AsdVariant.shownColumns.includes(name)).map(AsdVariant.columnLabel);
    expect(offered).toEqual(['Exon junction proximal 200bp', 'Exon junction proximal 400bp', 'AS junction proximal 200bp', 'AS junction proximal 400bp']);
  });

  it('finds a gene, a range or a position', async () => {
    expect((await service.find('CHD8'))?.location.format()).toBe('chr14:21,853,352-21,905,457');
    expect((await service.find('chr1:2,230,000-2,440,000'))?.location.format()).toBe('chr1:2,230,000-2,440,000');
    expect((await service.find('chr1:2,337,101'))?.location.width).toBe(2000);
    expect((await service.find('chrMT:100'))?.location.chrom).toBe('chrM');
    expect(await service.find('NOTAGENE1')).toBeUndefined();
  });

  it('reads the DNA predictions for the range, one row per variant', async () => {
    const [predictions, features] = await Promise.all([service.predictions(browserRange, 'dna'), service.features('dna')]);
    expect(predictions).toHaveLength(34);
    expect(predictions[0]?.feature_predictions).toHaveLength(features.model_features?.length ?? 0);
  });

  it('names each feature the selected variant moves, though the list also sends an empty ExPecto list', async () => {
    const [predictions, features] = await Promise.all([service.predictions(browserRange, 'dna'), service.features('dna')]);
    const selected = predictions.find((record) => record.position === 2337101);
    const effects = selected ? featureEffects(selected, features) : [];
    expect(effects).toHaveLength(2002);
    expect(Math.max(...effects.map((effect) => effect.value))).toBeGreaterThan(5);
  });
});

describe('AsdVariant', () => {
  it('reads blank and missing columns as not available', () => {
    const row = AsdVariant.fromRecord({ chromosome: 'chr1', position: 10, ref_allele: 'A', alt_allele: 'G', features: { asd: { 'RNA Disease impact score': '', 'Exon junction proximal 200bp': 'TRUE' } } });
    expect(row.rnaScore).toBeNull();
    expect(new AsdVariant(row).columnValue('Exon junction proximal 200bp')).toBe('Yes');
    expect(new AsdVariant(row).columnValue('AS  junction proximal 400bp')).toBe(AsdVariant.missing);
  });
});
