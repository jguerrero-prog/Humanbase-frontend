import { JobHistory } from '@humanbase/data';
import { act, renderHook } from '@testing-library/react';
import { jobProgress, syncJobStatus, useJobTitle } from './JobPage';

const created = new Date('2026-10-27T10:00:00Z');
const now = created.getTime() + 4 * 60_000;
const entry = { id: 'job-1', tool: 'NetWAS', startedAt: created.toISOString(), link: '/netwas/job-1/' };

describe('jobProgress', () => {
  it('says a queued job waits for a worker', () => {
    const { badge, note, steps } = jobProgress({ status: 'queued', created }, now);
    expect([badge, note]).toEqual(['Queued', 'Waiting for a worker to start it.']);
    expect(steps.map((step) => step.state)).toEqual(['done', 'current', 'upcoming', 'upcoming']);
  });

  it('counts a running job’s time, then the usual time', () => {
    const { badge, note, steps } = jobProgress({ status: 'running', created }, now, 'Jobs usually take 10 minutes.');
    expect([badge, note]).toEqual(['Running for 4 minutes', '4 minutes so far. Jobs usually take 10 minutes.']);
    expect(steps[2]).toEqual({ label: 'Running', detail: '4 minutes so far. Jobs usually take 10 minutes.', state: 'current' });
    expect(jobProgress({ status: 'running', created }, now).note).toBe('4 minutes so far.');
  });

  it('names why a failed job stopped', () => {
    const { badge, note, steps } = jobProgress({ status: 'failed', created, failure: 'bad file' }, now);
    expect([badge, note]).toEqual(['Failed: bad file', undefined]);
    expect(steps.at(-1)).toEqual({ label: 'Running', detail: 'Stopped: bad file', state: 'stopped' });
    expect(jobProgress({ status: 'failed', created }, now).steps.at(-1)?.detail).toBe('Stopped before it finished');
  });
});

describe('syncJobStatus', () => {
  beforeEach(() => localStorage.clear());

  it('updates a listed job and adds an unlisted one only when given its entry', () => {
    syncJobStatus('job-1', 'finished');
    expect(new JobHistory().list()).toEqual([]);
    syncJobStatus('job-1', 'running', entry);
    syncJobStatus('job-1', 'finished');
    expect(new JobHistory().list()).toEqual([{ ...entry, status: 'finished' }]);
  });
});

describe('useJobTitle', () => {
  beforeEach(() => localStorage.clear());

  it('shows the saved title, then a rename, and falls back when cleared', () => {
    new JobHistory().add({ ...entry, status: 'running', title: 'Saved' });
    const { result } = renderHook(() => useJobTitle({ id: 'job-1', tool: 'NetWAS' }, 'Untitled search'));
    expect(result.current).toMatchObject({ title: 'Saved', given: 'Saved' });
    act(() => result.current.rename('Renamed'));
    expect(result.current.title).toBe('Renamed');
    expect(new JobHistory().list()[0]?.title).toBe('Renamed');
    act(() => result.current.rename(''));
    expect(result.current).toMatchObject({ title: 'Untitled search', given: undefined });
  });

  it('names an untitled job after its tool by default', () => {
    const { result } = renderHook(() => useJobTitle({ id: 'job-2', tool: 'Sei' }));
    expect(result.current.title).toBe('Untitled Sei job');
  });
});
