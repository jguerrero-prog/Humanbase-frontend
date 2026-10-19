import { ApiError } from '../ApiError';
import type { DataClient } from '../DataClient';
import type { DataVersion } from '../genes/Gene';
import { NetwasJob, type NetwasJobRecord } from './NetwasJob';
import { NetwasResult } from './NetwasResult';

export type Mhc = 'exclude' | 'keep';

export interface NetwasRequest {
  file: File;
  tissue: string;
  version: DataVersion;
  /** v1 only: genes below it are the GWAS hits NetWAS learns from. */
  pValue?: number | undefined;
  /** v3 only: whether MAGE-WAS trains on the chr6 MHC region. */
  mhc?: Mhc | undefined;
  title?: string | undefined;
  email?: string | undefined;
}

export interface NetwasExample {
  name: string;
  format: string;
  url: string;
}

export interface SubmitProblem {
  field: string;
  message: string;
}

const examplesUrl = 'https://s3-us-west-2.amazonaws.com/humanbase/netwas/examples/';
const example = (name: string, format: string): NetwasExample => ({ name, format, url: `${examplesUrl}${name}` });

/** NetWAS runs as a job: submit a GWAS file once, then read the job until it finishes. */
export class NetwasService {
  static readonly pollEvery = 10_000;
  static readonly slowPollEvery = 30_000;
  static readonly slowAfter = 10 * 60_000;
  static readonly defaultPValue = 0.01;
  /** The example files the API documents: the same BMI GWAS for v1, an Alzheimer's subset for v3. */
  static readonly examples: Record<DataVersion, readonly NetwasExample[]> = {
    v1: [example('bmi-vegas.txt', 'VEGAS'), example('bmi-magma.genes.out', 'MAGMA'), example('bmi-2column.tsv', '2-column')],
    v3: [example('alzheimer-vegas.txt', 'VEGAS'), example('alzheimer-magma.genes.out', 'MAGMA'), example('alzheimer-2column.tsv', '2-column')],
  };

  constructor(private readonly client: DataClient) {}

  static isJobId(text: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
  }

  /** How long to wait before reading a running job again: every 10 seconds, then every 30 after 10 minutes. */
  static pollDelay(job: NetwasJob, now = Date.now()): number | false {
    if (job.isDone) return false;
    return now - job.created.getTime() > NetwasService.slowAfter ? NetwasService.slowPollEvery : NetwasService.pollEvery;
  }

  /** The API's reasons for refusing a submission, field by field. */
  static problemsOf(error: unknown): SubmitProblem[] {
    if (!(error instanceof ApiError) || !error.details || typeof error.details !== 'object') return [];
    const problems: SubmitProblem[] = [];
    for (const [field, value] of Object.entries(error.details as Record<string, unknown>)) {
      if (field === 'stats') continue;
      for (const message of [value].flat()) if (typeof message === 'string') problems.push({ field, message });
    }
    return problems;
  }

  async submit({ file, tissue, version, pValue, mhc, title, email }: NetwasRequest): Promise<NetwasJob> {
    const form = new FormData();
    form.append('gwas_file', file, file.name);
    form.append('tissue', tissue);
    form.append('version', version);
    if (version === 'v1' && pValue !== undefined) form.append('p_value', String(pValue));
    if (version === 'v3' && mhc) form.append('mhc', mhc);
    if (title?.trim()) form.append('title', title.trim());
    if (email?.trim()) form.append('email', email.trim());
    return new NetwasJob(await this.client.post<NetwasJobRecord>('netwas/', form));
  }

  async get(id: string): Promise<NetwasJob> {
    return new NetwasJob(await this.client.get<NetwasJobRecord>(`netwas/${id}/`));
  }

  async result(job: NetwasJob): Promise<{ text: string; result: NetwasResult }> {
    if (!job.resultsFile) throw new ApiError(404, `${job.id}: no results file`);
    const text = await this.client.text(job.resultsFile);
    return { text, result: NetwasResult.parse(text) };
  }

  exampleFile(example: NetwasExample): Promise<string> {
    return this.client.text(example.url);
  }
}
