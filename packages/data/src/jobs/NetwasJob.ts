import type { DataVersion } from '../genes/Gene';
import type { components } from '../schema';
import { GwasFileCheck } from './GwasFileCheck';
import type { JobState } from './JobHistory';

export type NetwasJobRecord = components['schemas']['Job'];

/** One NetWAS (GIANT) or MAGE-WAS (MAGE) job, as GET /api/netwas/{id}/ returns it. */
export class NetwasJob {
  constructor(private readonly record: NetwasJobRecord) {}

  get id(): string {
    return this.record.id ?? '';
  }

  get created(): Date {
    return new Date(this.record.created);
  }

  get title(): string | undefined {
    return this.record.title?.trim() || undefined;
  }

  get version(): DataVersion {
    return this.record.version === 'v3' ? 'v3' : 'v1';
  }

  /** NetWAS on GIANT networks, MAGE-WAS on MAGE networks. */
  get tool(): string {
    return this.version === 'v3' ? 'MAGE-WAS' : 'NetWAS';
  }

  get tissue(): string {
    return this.record.tissue;
  }

  get pValue(): number | null {
    return this.record.p_value ?? null;
  }

  get mhc(): string | null {
    return this.record.mhc ?? null;
  }

  get email(): string | undefined {
    return this.record.email?.trim() || undefined;
  }

  get gwasFileName(): string {
    const last = this.record.gwas_file.split('?')[0]?.split('/').pop() ?? '';
    return decodeURIComponent(last);
  }

  get gwasFormat(): string {
    return GwasFileCheck.formatName(this.record.gwas_format);
  }

  get resultsFile(): string | undefined {
    return this.record.results_file || undefined;
  }

  get logFile(): string | undefined {
    return this.record.log_file || undefined;
  }

  /** queued, running and completed, or "error: <reason>"; older jobs may say not_started. */
  get status(): JobState {
    const status = this.record.status?.trim().toLowerCase() ?? '';
    if (status === 'completed') return 'finished';
    if (status === 'running') return 'running';
    if (status.startsWith('error')) return 'failed';
    return 'queued';
  }

  /** The reason after "error:", if the API gave one. */
  get failure(): string | undefined {
    if (this.status !== 'failed') return undefined;
    return this.record.status?.replace(/^error:?/i, '').trim() || undefined;
  }

  get isDone(): boolean {
    return this.status === 'finished' || this.status === 'failed';
  }
}
