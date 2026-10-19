import { JobHistory, type JobEntry } from './JobHistory';

class MemoryStore {
  private values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const job = (id: string, status: JobEntry['status'], startedAt: string): JobEntry => ({ id, tool: 'Seqweaver', status, startedAt, link: `/deepsea/jobs/${id}/` });

describe('JobHistory', () => {
  it('lists jobs newest first and replaces a job added twice', () => {
    const history = new JobHistory(new MemoryStore());
    history.add(job('a', 'finished', '2026-10-14T11:05:00Z'));
    history.add(job('b', 'running', '2026-10-16T20:16:00Z'));
    history.add({ ...job('a', 'failed', '2026-10-14T11:05:00Z'), title: 'FOXP1 promoter scan' });
    expect(history.list().map((entry) => [entry.id, entry.status])).toEqual([
      ['b', 'running'],
      ['a', 'failed'],
    ]);
  });

  it('counts running and queued jobs, removes one and clears finished', () => {
    const history = new JobHistory(new MemoryStore());
    history.add(job('a', 'queued', '2026-10-16T20:14:00Z'));
    history.add(job('b', 'running', '2026-10-16T20:16:00Z'));
    history.add(job('c', 'finished', '2026-10-16T20:02:00Z'));
    expect(history.activeCount()).toBe(2);
    history.clearFinished();
    history.remove('a');
    expect(history.list().map((entry) => entry.id)).toEqual(['b']);
  });

  it('reads a job ID from a link or a bare ID', () => {
    expect(JobHistory.idFromLink('https://humanbase.io/deepsea/jobs/76aea8fe-8ec7-4698-a193-a186c7665edb/')).toBe('76aea8fe-8ec7-4698-a193-a186c7665edb');
    expect(JobHistory.idFromLink('not a job')).toBeUndefined();
  });

  it('names untitled jobs by their tool', () => {
    expect(JobHistory.titleOf(job('a', 'finished', '2026-10-16T20:02:00Z'))).toBe('Untitled Seqweaver job');
  });

  it('keeps working when storage is missing or holds bad data', () => {
    const store = new MemoryStore();
    store.setItem(JobHistory.storageKey, '{not json');
    expect(new JobHistory(store).list()).toEqual([]);
    const history = new JobHistory(null);
    history.add(job('a', 'queued', '2026-10-16T20:14:00Z'));
    expect(history.list()).toEqual([]);
  });
});
