export type JobState = 'queued' | 'running' | 'finished' | 'failed';

export interface JobEntry {
  id: string;
  tool: string;
  status: JobState;
  startedAt: string;
  link: string;
  title?: string | undefined;
  detail?: string | undefined;
}

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

const jobIdPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function browserStorage(): KeyValueStore | null {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

// Jobs started in this browser, newest first. HumanBase has no accounts, so this list is all there is.
export class JobHistory {
  // Each tool keeps its own entry today; their key names are an open question, so the list lives under one key.
  static readonly storageKey = 'humanbase:jobs';

  constructor(private readonly storage: KeyValueStore | null = browserStorage()) {}

  static idFromLink(text: string): string | undefined {
    return jobIdPattern.exec(text)?.[0].toLowerCase();
  }

  static titleOf(job: JobEntry): string {
    return job.title?.trim() || `Untitled ${job.tool} job`;
  }

  list(): JobEntry[] {
    return this.read().sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  add(job: JobEntry): void {
    this.write([job, ...this.read().filter((entry) => entry.id !== job.id)]);
  }

  remove(id: string): void {
    this.write(this.read().filter((entry) => entry.id !== id));
  }

  clearFinished(): void {
    this.write(this.read().filter((entry) => entry.status !== 'finished'));
  }

  activeCount(): number {
    return this.read().filter((entry) => entry.status === 'queued' || entry.status === 'running').length;
  }

  private read(): JobEntry[] {
    try {
      const saved: unknown = JSON.parse(this.storage?.getItem(JobHistory.storageKey) ?? '[]');
      return Array.isArray(saved) ? (saved as JobEntry[]) : [];
    } catch {
      return [];
    }
  }

  private write(jobs: JobEntry[]): void {
    try {
      this.storage?.setItem(JobHistory.storageKey, JSON.stringify(jobs));
    } catch {
      // Storage can be full or blocked; the list then lasts only for this page.
    }
  }
}
