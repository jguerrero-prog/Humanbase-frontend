import { SampleClient } from '../sample/SampleClient';
import { VariantFileCheck } from '../jobs/VariantFileCheck';
import { deepseaExamples } from './deepseaExamples';
import { DeepseaJob } from './DeepseaJob';
import { deepseaModels } from './DeepseaModel';
import { featureEffects, variantRows } from './DeepseaResult';
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
  });

  it('merges the variant scores into one row per variant', async () => {
    const sets = await Promise.all(['dis', 'mean-evalue'].map((type) => service.variantScores(exampleJob, type)));
    const rows = variantRows(sets);
    expect(rows).toHaveLength(10);
    const cebp = rows.find((row) => row.position === 109817590);
    expect(cebp).toMatchObject({ chromosome: 'chr1', change: 'G>T', name: '[known_CEBP_binding_increase]' });
    expect(Object.keys(cebp?.scores ?? {})).toEqual(['dis', 'mean-evalue']);
  });

  it('names every feature effect from the model’s feature list', async () => {
    const prediction = await service.featurePredictions(exampleJob, 'zscore', '1:109817590');
    if (!prediction) throw new Error('No prediction recorded');
    const effects = featureEffects(prediction, await service.features('seqweaver'));
    expect(effects).toHaveLength(232);
    const top = [...effects].sort((a, b) => b.value - a.value)[0];
    expect(top).toMatchObject({ feature: 'LIN28A', value: 28.003836 });
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
