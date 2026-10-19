import type { InputKind } from '../jobs/VariantFileCheck';
import type { JobState } from '../jobs/JobHistory';
import { deepseaModels, modelOf, type DeepseaModel } from './DeepseaModel';

export interface DeepseaFile {
  url: string;
  name: string;
}

// The schema leaves the job response undescribed; this is what GET /api/deepsea/jobs/{job_id}/ returns.
export interface DeepseaJobRecord {
  job_id: string;
  created: string;
  ds_model: string;
  status: string;
  title?: string | null;
  email?: string | null;
  input_type: string;
  genome_assembly: string;
  expecto?: boolean;
  insilico?: boolean;
  output_format?: string | null;
  sequence_names?: string[];
  files?: Record<string, DeepseaFile>;
}

export interface ResultFile extends DeepseaFile {
  key: string;
  /** What the file holds, in the words the job page uses. */
  holds: string;
  format: string;
}

const genomes: Record<string, string> = { hg19: 'GRCh37/hg19', hg38: 'GRCh38/hg38' };

function describe(key: string, kind: InputKind): Pick<ResultFile, 'holds' | 'format'> {
  if (key.startsWith('variant_')) return { holds: 'One score per variant, as a genome track', format: 'bigWig (.bw)' };
  if (key.startsWith('feature_')) return { holds: 'Every feature for every variant', format: 'TSV, gzipped, with tabix index' };
  if (key === 'uploaded_query') return { holds: 'The file as it was submitted', format: kind.toUpperCase() };
  return { holds: 'Every result file in one archive', format: 'tar.gz' };
}

/** One Sei, Beluga, Seqweaver or ExPecto job, as GET /api/deepsea/jobs/{job_id}/ returns it. */
export class DeepseaJob {
  constructor(private readonly record: DeepseaJobRecord) {}

  get id(): string {
    return this.record.job_id;
  }

  get created(): Date {
    return new Date(this.record.created);
  }

  get model(): DeepseaModel {
    if (this.record.expecto) return deepseaModels.expecto;
    return modelOf(this.record.ds_model) ?? deepseaModels.sei;
  }

  get title(): string | undefined {
    return this.record.title?.trim() || undefined;
  }

  get email(): string | undefined {
    return this.record.email?.trim() || undefined;
  }

  get kind(): InputKind {
    const kind = this.record.input_type.toLowerCase();
    return kind === 'bed' || kind === 'fasta' ? kind : 'vcf';
  }

  get genome(): string {
    return genomes[this.record.genome_assembly] ?? this.record.genome_assembly;
  }

  get status(): JobState {
    const status = this.record.status?.trim().toLowerCase() ?? '';
    if (status === 'completed' || status === 'finished') return 'finished';
    if (status === 'running' || status === 'started') return 'running';
    if (status.startsWith('error') || status === 'failed') return 'failed';
    return 'queued';
  }

  get failure(): string | undefined {
    if (this.status !== 'failed') return undefined;
    return this.record.status.replace(/^(error|failed):?/i, '').trim() || undefined;
  }

  get isDone(): boolean {
    return this.status === 'finished' || this.status === 'failed';
  }

  /** The files to download, without the tabix indexes, which only genome browsers read. */
  get resultFiles(): ResultFile[] {
    return Object.entries(this.record.files ?? {})
      .filter(([key]) => !key.endsWith('_index'))
      .map(([key, file]) => ({ key, ...file, ...describe(key, this.kind) }));
  }

  get archive(): DeepseaFile | undefined {
    return this.record.files?.gz_file;
  }
}
