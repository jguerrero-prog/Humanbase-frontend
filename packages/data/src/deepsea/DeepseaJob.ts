import { inputNouns, type InputKind } from '../jobs/VariantFileCheck';
import type { JobState } from '../jobs/JobHistory';
import type { ScoreType } from './DeepseaResult';
import { deepseaModels, genomeLabels, modelOf, type DeepseaModel, type Genome } from './DeepseaModel';

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
  /** In silico mutagenesis jobs nest a logits and a diffs file under each sequence. */
  files?: Record<string, DeepseaFile | Record<string, DeepseaFile>>;
}

export interface ResultFile extends DeepseaFile {
  key: string;
  /** What the file holds, in the words the job page uses. */
  holds: string;
  format: string;
}


// The API links some files over http; as on humanbase.io, downloads use https.
const secure = (url: string) => url.replace(/^http:\/\//i, 'https://');

const count = new Intl.NumberFormat('en-US');

const isFile = (entry: DeepseaFile | Record<string, DeepseaFile>): entry is DeepseaFile => typeof entry.url === 'string';

const perSequence: Record<string, Pick<ResultFile, 'name' | 'holds' | 'format'>> = {
  logits: { name: 'Logits', holds: 'One file per sequence: every base, every substitution, all 2,002 features', format: 'TSV' },
  diffs: { name: 'Diffs', holds: 'One file per sequence: change from the original sequence for every substitution', format: 'TSV' },
};

function describe(key: string, kind: InputKind, indexed: boolean): Pick<ResultFile, 'holds' | 'format'> {
  if (key.startsWith('variant_')) return { holds: 'One score per variant, as a genome track', format: 'bigWig (.bw)' };
  if (key.startsWith('feature_')) return { holds: `Every feature for every ${inputNouns[kind][0]}`, format: indexed ? 'TSV, gzipped, with tabix index' : 'TSV, gzipped' };
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
    if (this.record.insilico) return deepseaModels.insilico;
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
    return genomeLabels[this.record.genome_assembly as Genome] ?? this.record.genome_assembly;
  }

  get assembly(): Genome {
    return this.record.genome_assembly === 'hg38' ? 'hg38' : 'hg19';
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
    const all = this.record.files ?? {};
    const entries = Object.entries(all).filter(([key]) => !key.endsWith('_index'));
    const groups = entries.flatMap(([, entry]) => (isFile(entry) ? [] : [entry]));
    const nested = Object.entries(perSequence).flatMap(([key, about]) => {
      const first = groups.find((group) => group[key])?.[key];
      return first ? [{ key, url: secure(first.url), ...about }] : [];
    });
    const flat = entries.flatMap(([key, entry]) => (isFile(entry) ? [{ key, ...entry, url: secure(entry.url), ...describe(key, this.kind, `${key}_index` in all) }] : []));
    return [...nested, ...flat];
  }

  /** The bigWig file of one variant- or sequence-level score, such as variant_dis, which genome browsers draw as a track. */
  scoreTrackFile(type: Pick<ScoreType, 'level' | 'short_name'>): DeepseaFile | undefined {
    const file = this.record.files?.[`${type.level.toLowerCase()}_${type.short_name}`];
    return file && isFile(file) ? file : undefined;
  }

  /** As on humanbase.io, only the model's plotted inputs are plotted, such as a Sei VCF; other jobs' results are their files. */
  get plotsScores(): boolean {
    return this.model.plotted.includes(this.kind);
  }

  /** The input as it was submitted, such as the regions of a BED job. */
  get uploadedQuery(): DeepseaFile | undefined {
    const file = this.record.files?.uploaded_query;
    return file && isFile(file) ? { ...file, url: secure(file.url) } : undefined;
  }

  /** Its input, such as Sequences, FASTA. */
  get inputLabel(): string {
    const plural = inputNouns[this.kind][1];
    return `${plural[0]?.toUpperCase()}${plural.slice(1)}, ${this.kind.toUpperCase()}`;
  }

  /** What a job shown as files predicted, leaving out either count when it couldn't be read. */
  filesSummary(profiles?: number, inputs?: number): string {
    const [one, many] = inputNouns[this.kind];
    const predicted = [profiles && count.format(profiles), this.model.profiles ?? this.model.featurePlural].filter(Boolean).join(' ');
    const each = inputs === 1 ? `for your ${one}` : `for each of your ${inputs ? `${count.format(inputs)} ` : ''}${many}`;
    return `${this.model.tool} predicted ${predicted} ${each}. The results are files to download, one probability per profile and ${one}.`;
  }

  get archive(): DeepseaFile | undefined {
    const file = this.record.files?.gz_file;
    return file && isFile(file) ? file : undefined;
  }

  /** The sequences an in silico mutagenesis job ran, in the order they were submitted. */
  get sequenceNames(): readonly string[] {
    return this.record.sequence_names ?? [];
  }
}
