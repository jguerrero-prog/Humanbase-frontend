import { VariantFileCheck } from '../jobs/VariantFileCheck';
import { SampleClient } from '../sample/SampleClient';
import { deepseaExamples } from './deepseaExamples';
import { DeepseaService } from './DeepseaService';
import { InsilicoResult, sequenceSpan } from './InsilicoResult';

const exampleJob = '0576e894-a2c5-48bb-9bdf-227962495d5f';
const cebp = 'known_CEBP_binding_increase-GtoT__chr1_109816591_109818590';
const hepg2Cebpb = 297;

describe('in silico mutagenesis', () => {
  const service = new DeepseaService(SampleClient.bundled());

  it('reads the example job as a Beluga job over four sequences', async () => {
    const job = await service.get(exampleJob);
    expect(job.model.tool).toBe('In silico mutagenesis');
    expect(job.kind).toBe('fasta');
    expect(job.status).toBe('finished');
    expect(job.sequenceNames).toHaveLength(4);
    expect(job.resultFiles.map((file) => file.key)).toEqual(['logits', 'diffs', 'uploaded_query', 'gz_file']);
    expect(job.archive?.name).toBe('Archive of results');
  });

  it('reads every substitution of a sequence for one feature', async () => {
    const result = await service.insilico(exampleJob, cebp, hepg2Cebpb);
    expect(result.length).toBe(2000);
    expect(result.reference(999)).toBe('T');
    expect(result.at(999).map((item) => [item.alt, item.value])).toEqual([['A', -4.63], ['G', -4.24], ['C', -4]]);
    expect(result.strongest(1)[0]).toMatchObject({ position: 999, alt: 'A' });
  });

  it('lays a window out one row per base, empty where the base is the reference', () => {
    const result = new InsilicoResult({ positions: ['0,T,A,-1', '0,T,G,0.5', '0,T,C,0.2', '1,A,G,2', '1,A,C,0', '1,A,T,-0.1'] });
    expect(result.window(0, 2)).toEqual([
      { base: 'T', values: [null, -0.1] },
      { base: 'G', values: [0.5, 2] },
      { base: 'A', values: [-1, null] },
      { base: 'C', values: [0.2, 0] },
    ]);
    expect(result.strongestPer(1).map((item) => item.value)).toEqual([-1, 2]);
    expect(result.csv().split('\n')[1]).toBe('0,T,A,-1');
  });

  it('names a sequence by its label and genome span', () => {
    expect(sequenceSpan(cebp)).toEqual({ label: 'known_CEBP_binding_increase G>T', chromosome: 'chr1', start: 109816591, end: 109818590 });
    expect(sequenceSpan('known_FOXA2_binding_decrease-ReferenceAllele__chr10_23507364_23509363')?.label).toBe('known_FOXA2_binding_decrease reference allele');
    expect(sequenceSpan('my sequence')).toBeUndefined();
  });

  it('submits sequences with insilico turned on', () => {
    const form = DeepseaService.formOf({ model: 'insilico', kind: 'fasta', text: '>a\nACGT', fileName: 'example.fasta', genome: 'hg19' });
    expect(form.get('ds_model')).toBe('Beluga');
    expect(form.get('insilico')).toBe('true');
    expect(form.get('expecto')).toBeNull();
  });

  it('bundles the live example as four sequences of 2,000 bp', () => {
    const check = new VariantFileCheck('fasta', 'insilico').check(deepseaExamples.insilico.fasta ?? '');
    expect(check.count).toBe(4);
    expect(check.problems).toEqual([]);
  });

  it('answers an example submission with the sample job while the API is off', async () => {
    const job = await service.submit({ model: 'insilico', kind: 'fasta', text: deepseaExamples.insilico.fasta ?? '', fileName: 'example.fasta', genome: 'hg19' });
    expect(job.id).toBe('00000000-0000-4000-8000-000000000151');
    expect(job.model.id).toBe('insilico');
  });
});
