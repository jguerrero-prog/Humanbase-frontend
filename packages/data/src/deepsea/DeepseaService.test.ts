import type { DataClient } from '../DataClient';
import { GenomeLocation } from '../genome/GenomeLocation';
import { SampleClient } from '../sample/SampleClient';
import { VariantFileCheck } from '../jobs/VariantFileCheck';
import { deepseaExamples } from './deepseaExamples';
import { DeepseaJob } from './DeepseaJob';
import { deepseaModels } from './DeepseaModel';
import { featureEffects, jobScoreTypes, summaryScoreTypes, variantRows } from './DeepseaResult';
import { DeepseaService } from './DeepseaService';

const exampleJob = '76aea8fe-8ec7-4698-a193-a186c7665edb';

describe('DeepseaService', () => {
  const service = new DeepseaService(SampleClient.bundled());

  it('reads the Seqweaver example job', async () => {
    const job = await service.get(exampleJob);
    expect(job.model.tool).toBe('Seqweaver');
    expect(job.status).toBe('finished');
    expect(job.genome).toBe('GRCh37/hg19');
    expect(job.resultFiles.map((file) => file.key)).toEqual(['variant_dis', 'variant_mean-evalue', 'feature_zscore', 'feature_evalue', 'feature_diffs', 'uploaded_query', 'gz_file']);
    expect(DeepseaService.pollDelay(job)).toBe(false);
    expect(job.plotsScores).toBe(true);
  });

  it('reads each FASTA example job as files only, as humanbase.io shows them: no variant- or sequence-level score to plot', async () => {
    for (const [id, tool] of [
      ['5154ea8d-3203-4c81-acc8-757faeb44e0c', 'Sei'],
      ['27d030ee-02d9-43ca-adec-e5d76265591a', 'Beluga'],
      ['dbebecbe-f58a-4ce4-b4ba-04af819a9ad7', 'Seqweaver'],
    ] as const) {
      const job = await service.get(id);
      expect(job.model.tool).toBe(tool);
      expect(job.kind).toBe('fasta');
      expect(job.plotsScores).toBe(false);
      expect(jobScoreTypes(job.model, await service.scoreTypes(id))).toEqual([]);
      const files = job.resultFiles;
      expect(files.every((file) => file.url.startsWith('https://'))).toBe(true);
      expect(files.find((file) => file.key === 'feature_predictions')).toMatchObject({ holds: 'Every feature for every sequence', format: 'TSV, gzipped' });
      expect(files.map((file) => file.key)).toContain('gz_file');
    }
  });

  it('merges the variant scores into one row per variant', async () => {
    const sets = await Promise.all(['dis', 'mean-evalue'].map((type) => service.scores(exampleJob, { level: 'VARIANT', short_name: type })));
    const rows = variantRows(sets);
    expect(rows).toHaveLength(10);
    const cebp = rows.find((row) => row.position === 109817590);
    expect(cebp).toMatchObject({ chromosome: 'chr1', change: 'G>T', name: '[known_CEBP_binding_increase]' });
    expect(Object.keys(cebp?.scores ?? {})).toEqual(['dis', 'mean-evalue']);
  });

  it('names every feature effect from the model’s feature list', async () => {
    const view = GenomeLocation.at('chr1', 109817590).withWidth(100_000);
    expect(view.variantRange).toBe('1:109767590:109867590');
    const [prediction, ...others] = await service.featurePredictions(exampleJob, 'zscore', view);
    if (!prediction) throw new Error('No prediction recorded');
    expect(others).toEqual([]);
    expect(prediction).toMatchObject({ chromosome: 'chr1', position: 109817590, ref_allele: 'G', alt_allele: 'T' });
    const effects = featureEffects(prediction, await service.features('seqweaver'));
    expect(effects).toHaveLength(232);
    const top = [...effects].sort((a, b) => b.value - a.value)[0];
    expect(top).toMatchObject({ feature: 'LIN28A', value: 28.003836 });
  });

  it('reads Seqweaver’s precomputed gnomAD variants in a range, without a job', async () => {
    const view = new GenomeLocation('chr1', 2_334_000, 2_336_000);
    const records = await service.precomputedPredictions({ model: 'seqweaver', scoreType: 'seqweaver' }, view);
    expect(records.length).toBeGreaterThan(50);
    expect(records.every((record) => view.includes(record.chromosome, record.position) && record.feature_predictions.length === 232)).toBe(true);
    expect(Number(records[0]?.variant_score)).toBeGreaterThan(0);
  });

  it('answers the example submission with a queued job when the API is off', async () => {
    const job = await service.submit({ model: 'beluga', kind: 'vcf', text: deepseaExamples.beluga.hg19.vcf ?? '', fileName: 'example.vcf', genome: 'hg19' });
    expect(job.model.tool).toBe('Beluga');
    expect(job.status).toBe('queued');
  });

  it('sends the fields the live form sends, with pasted or example text as upload_textarea', () => {
    const form = DeepseaService.formOf({ model: 'seqweaver', kind: 'vcf', text: 'chr1\t1\t.\tA\tG\t+', fileName: 'example.vcf', genome: 'hg38', title: ' RNA check ' });
    expect([...form.entries()]).toEqual([
      ['title', 'RNA check'],
      ['email', ''],
      ['input_type', 'vcf'],
      ['ds_model', 'seqweaver'],
      ['signup', 'false'],
      ['expecto', 'false'],
      ['upload_textarea', 'chr1\t1\t.\tA\tG\t+'],
      ['insilico', 'false'],
      ['genome_assembly', 'hg38'],
    ]);
  });

  it('sends an uploaded file as upload_file and marks ExPecto and in silico jobs', async () => {
    const expecto = DeepseaService.formOf({ model: 'expecto', kind: 'vcf', text: 'chr1\t1\t.\tA\tG', fileName: 'mine.vcf', uploaded: true, genome: 'hg19' });
    expect(expecto.get('ds_model')).toBe('beluga');
    expect(expecto.get('expecto')).toBe('true');
    expect(expecto.get('upload_textarea')).toBe('');
    const file = expecto.get('upload_file');
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe('mine.vcf');
    expect(await (file as File).text()).toBe('chr1\t1\t.\tA\tG');
    expect(DeepseaService.formOf({ model: 'insilico', kind: 'fasta', text: '>s', fileName: 'x.fasta', genome: 'hg19' }).get('insilico')).toBe('true');
  });

  it('names ExPecto variants by their gene, as the real ExPecto job does', async () => {
    const rows = variantRows([await service.scores('e504e3cc-6a9a-4f35-99e3-9185d6f5c4a1', { level: 'VARIANT', short_name: 'expecto' })]);
    expect(rows.find((row) => row.position === 134871851)?.name).toBe('NEUROG1');
  });

  it('plots only the expecto score for ExPecto, whose jobs also list scores the API can’t serve', () => {
    const types = ['expecto', 'dis', 'mean-evalue'].map((short_name) => ({ name: short_name, level: 'VARIANT' as const, short_name }));
    expect(jobScoreTypes(deepseaModels.expecto, types).map((type) => type.short_name)).toEqual(['expecto']);
  });

  it('plots variant- and sequence-level scores, as humanbase.io does, and reads a sequence-level one from sequence_scores', async () => {
    const types = [
      { name: 'Disease impact score', level: 'VARIANT' as const, short_name: 'dis' },
      { name: 'Z-score', level: 'FEATURE' as const, short_name: 'zscore' },
      { name: 'Sequence score', level: 'SEQUENCE' as const, short_name: 'seq' },
    ];
    expect(jobScoreTypes(deepseaModels.beluga, types).map((type) => type.short_name)).toEqual(['dis', 'seq']);
    const paths: string[] = [];
    const client = { get: (path: string) => (paths.push(path), Promise.resolve({ ds_model: 'Beluga', score_type: 'seq', scores: [] })) };
    await new DeepseaService(client as unknown as DataClient).scores('x', { level: 'SEQUENCE', short_name: 'seq' });
    expect(paths).toEqual(['deepsea/jobs/x/sequence_scores/']);
  });

  it('reads the real Sei example job: its summary score, top classes and sequence class names', async () => {
    const id = '2e18fedf-3de7-4d08-a894-9a937a2b860b';
    const job = await service.get(id);
    expect(job.model.tool).toBe('Sei');
    const types = await service.scoreTypes(id);
    expect(types.filter((type) => type.level === 'VARIANT')).toHaveLength(41);
    expect(jobScoreTypes(job.model, types)).toHaveLength(41);
    expect(summaryScoreTypes(job.model, types).map((type) => type.short_name)).toEqual(['seqclass']);
    const rows = variantRows([await service.scores(id, { level: 'VARIANT', short_name: 'seqclass' })]);
    expect(rows.find((row) => row.position === 49813589)).toMatchObject({ name: 'VWC2', topClass: 'P Promoter' });
    const [prediction] = await service.featurePredictions(id, 'seqclass', GenomeLocation.at('chr7', 49813589).withWidth(100_000));
    if (!prediction) throw new Error('No prediction recorded');
    const effects = featureEffects(prediction, await service.features('sei', 'seqclass'));
    expect(effects).toHaveLength(40);
    expect([...effects].sort((a, b) => b.value - a.value)[0]).toMatchObject({ feature: 'P Promoter', cell: 'Promoter' });
  });

  it('reads a failed job’s reason', () => {
    const job = new DeepseaJob({ job_id: 'x', created: '2026-10-17T09:15:00', ds_model: 'Beluga', status: 'error: chr23 is not a chromosome', input_type: 'vcf', genome_assembly: 'hg19' });
    expect(job.status).toBe('failed');
    expect(job.failure).toBe('chr23 is not a chromosome');
  });
});

describe('deepseaExamples', () => {
  const cases = (['sei', 'beluga', 'seqweaver', 'expecto', 'insilico'] as const).flatMap((model) =>
    deepseaModels[model].genomes.flatMap((genome) => deepseaModels[model].inputs.map((kind) => [model, genome, kind] as const)),
  );

  it.each(cases)('the %s example for %s %s passes the file check', (model, genome, kind) => {
    const example = deepseaExamples[model][genome][kind];
    if (!example) throw new Error(`No ${kind} example for ${model} on ${genome}`);
    const result = new VariantFileCheck(kind, model).check(example);
    expect(result.problems).toEqual([]);
    expect(result.otherKind).toBeUndefined();
    expect(result.count).toBeGreaterThan(0);
  });
});
