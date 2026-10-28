import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { rangeQuery } from './useReadRange';

describe('rangeQuery', () => {
  const keep = rangeQuery<string[]>(['asd-predictions', 'dna', '1:100:200'], () => Promise.resolve([]), true).placeholderData;

  it('keeps the last range’s data while a moved range loads', () => {
    expect(keep(['a'], { queryKey: ['asd-predictions', 'dna', '1:50:150'] })).toEqual(['a']);
  });

  it('starts empty when another part of the key changes, such as the feature set', () => {
    expect(keep(['a'], { queryKey: ['asd-predictions', 'rna', '1:100:200'] })).toBeUndefined();
    expect(keep(['a'], undefined)).toBeUndefined();
  });

  it('keeps the rows on screen through a move, then shows the moved range’s', async () => {
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    let finish: (rows: string[]) => void = () => undefined;
    const read = (range: string) => (range === 'first' ? Promise.resolve(['first']) : new Promise<string[]>((resolve) => (finish = resolve)));
    const { result, rerender } = renderHook(({ range }) => useQuery(rangeQuery(['asd-range', range], () => read(range), true)), { wrapper, initialProps: { range: 'first' } });
    await waitFor(() => expect(result.current.data).toEqual(['first']));
    rerender({ range: 'moved' });
    expect(result.current.data).toEqual(['first']);
    expect(result.current.isPlaceholderData).toBe(true);
    finish(['moved']);
    await waitFor(() => expect(result.current.data).toEqual(['moved']));
  });

  it('cancels the read for a range the view has left', async () => {
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const signals: AbortSignal[] = [];
    const read = (signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<string[]>(() => undefined);
    };
    const { rerender } = renderHook(({ range }) => useQuery(rangeQuery(['asd-range', range], read, true)), { wrapper, initialProps: { range: 'first' } });
    await waitFor(() => expect(signals).toHaveLength(1));
    rerender({ range: 'moved' });
    await waitFor(() => expect(signals[0]?.aborted).toBe(true));
    expect(signals[1]?.aborted).toBe(false);
  });
});
