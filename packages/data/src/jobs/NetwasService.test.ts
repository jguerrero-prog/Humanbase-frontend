import { ApiClient } from '../ApiClient';
import { ApiError } from '../ApiError';
import { Humanbase } from '../Humanbase';
import { SampleClient } from '../sample/SampleClient';
import { sampleKey } from '../sample/sampleKey';
import { GwasFileCheck } from './GwasFileCheck';
import { NetwasJob, type NetwasJobRecord } from './NetwasJob';
import { NetwasService } from './NetwasService';

const record = (status: string, extra: Partial<NetwasJobRecord> = {}): NetwasJobRecord => ({
  id: '00000000-0000-4000-8000-000000000001',
  created: '2026-10-17T14:42:00Z',
  status,
  gwas_file: 'https://example.org/uploads/bmi%20gwas.txt',
  gwas_format: 'vegas',
  tissue: 'adipose-tissue',
  p_value: 0.01,
  version: 'v1',
  mhc: null,
  ...extra,
});

describe('GwasFileCheck', () => {
  const check = new GwasFileCheck();

  it('reads VEGAS by its header and skips comment lines', () => {
    const text = '# BMI GWAS\nChr Gene nSNPs nSims Start Stop Test Pvalue\n1 SAMD11 10 1000 1 2 3.1 0.004\n1 NOC2L 8 1000 3 4 1.2 0.4\n';
    const result = check.check(text);
    expect(result).toMatchObject({ format: 'vegas', count: 2, problems: [], summary: '2 genes with p-values, VEGAS format' });
    expect(GwasFileCheck.below(result, 0.01)).toBe(1);
  });

  it('reads MAGMA without a header by where the chromosome is', () => {
    expect(check.check('148398 1 854993 884961 76 20 3000 0.8 0.21\n').format).toBe('magma');
  });

  it('reads two columns and names the lines to fix', () => {
    const result = check.check('GENE\tP\nIL1B\t0.001\nTNF\tnot a number\n\tnot here\n');
    expect(result.format).toBe('two-column');
    expect(result.count).toBe(1);
    expect(result.problems).toEqual([
      { line: 3, rule: 'Use a p-value between 0 and 1 in column 2.' },
      { line: 4, rule: 'Use a p-value between 0 and 1 in column 2.' },
    ]);
  });

  it('refuses what the API refuses before reading it', () => {
    expect(GwasFileCheck.refuse('gwas.xlsx', 10)).toMatch(/\.txt, \.csv, \.tsv or \.out/);
    expect(GwasFileCheck.refuse('gwas.txt', 3 * 1024 ** 2)).toMatch(/under 3 MB/);
    expect(GwasFileCheck.refuse('gwas.out', 1000)).toBeUndefined();
  });
});

describe('NetwasJob', () => {
  it('reads status, failure and the file name', () => {
    expect(new NetwasJob(record('completed')).status).toBe('finished');
    expect(new NetwasJob(record('not_started')).status).toBe('queued');
    const failed = new NetwasJob(record('error: no p-value column'));
    expect(failed.status).toBe('failed');
    expect(failed.failure).toBe('no p-value column');
    expect(failed.gwasFileName).toBe('bmi gwas.txt');
    expect(failed.gwasFormat).toBe('VEGAS');
    expect(new NetwasJob(record('running', { version: 'v3' })).tool).toBe('MAGE-WAS');
  });
});

describe('NetwasService', () => {
  it('sends the upload as multipart with only the fields for its version', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(record('queued')), { status: 201 }));
    const service = new NetwasService(new ApiClient('/api', fetcher));
    const job = await service.submit({ file: new File(['IL1B\t0.01'], 'gwas.tsv'), tissue: 'brain-v3', version: 'v3', pValue: 0.01, mhc: 'keep', title: ' ', email: '' });
    expect(job.status).toBe('queued');
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/netwas/');
    const body = init.body as FormData;
    expect([...body.keys()]).toEqual(['gwas_file', 'tissue', 'version', 'mhc']);
    expect(init.headers).not.toHaveProperty('Content-Type');
  });

  it('lists the reasons the API gives for refusing a file', async () => {
    const details = { gwas_file: ['No p-value column found.'], stats: null, tissue: ['Unknown tissue.'] };
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(details), { status: 400 }));
    const error = await new NetwasService(new ApiClient('/api', fetcher)).get('x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(NetwasService.problemsOf(error)).toEqual([
      { field: 'gwas_file', message: 'No p-value column found.' },
      { field: 'tissue', message: 'Unknown tissue.' },
    ]);
  });

  it('reads a running job again sooner at first', () => {
    const job = new NetwasJob(record('running'));
    const start = job.created.getTime();
    expect(NetwasService.pollDelay(job, start + 60_000)).toBe(NetwasService.pollEvery);
    expect(NetwasService.pollDelay(job, start + 11 * 60_000)).toBe(NetwasService.slowPollEvery);
    expect(NetwasService.pollDelay(new NetwasJob(record('completed')), start)).toBe(false);
  });
});

describe('NetWAS with the API off', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keys an upload by its fields and file name, not its bytes', () => {
    const form = (bytes: string) => {
      const body = new FormData();
      body.append('gwas_file', new File([bytes], 'bmi-vegas.txt'));
      body.append('tissue', 'adipose-tissue');
      return body;
    };
    expect(sampleKey('POST', 'netwas/', {}, form('a'))).toBe(sampleKey('POST', 'netwas/', {}, form('b')));
  });

  it('keeps files the API links to under files/', () => {
    expect(sampleKey('GET', 'https://s3-us-west-2.amazonaws.com/humanbase/netwas/examples/bmi-vegas.txt')).toBe('files/s3-us-west-2.amazonaws.com/humanbase/netwas/examples/bmi-vegas.txt');
  });

  it('shows the example file and the sample jobs without a request', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    const humanbase = new Humanbase(SampleClient.bundled());
    const [example] = NetwasService.examples.v1;
    const file = await humanbase.netwas.exampleFile(example as (typeof NetwasService.examples.v1)[number]);
    expect(new GwasFileCheck().check(file).summary).toBe('17,692 genes with p-values, VEGAS format');
    const finished = await humanbase.netwas.get('c66b3d05-2f49-4522-b910-1605609e4083');
    const { result } = await humanbase.netwas.result(finished);
    expect(result.genes[0]?.symbol).toBe('KRT6B');
    await expect(humanbase.netwas.get('00000000-0000-4000-8000-000000000000')).rejects.toMatchObject({ status: 404 });
    expect(fetch).not.toHaveBeenCalled();
  });
});
