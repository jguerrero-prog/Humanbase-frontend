import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { HumanBase } from '../HumanBase';

const HumanBaseContext = createContext<HumanBase | null>(null);

interface HumanBaseProviderProps {
  api: HumanBase;
  children: ReactNode;
}

export function HumanBaseProvider({ api, children }: HumanBaseProviderProps) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000, retry: 1 } } }));
  return (
    <HumanBaseContext value={api}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </HumanBaseContext>
  );
}

export function useHumanBase(): HumanBase {
  const api = useContext(HumanBaseContext);
  if (!api) throw new Error('useHumanBase must be used inside <HumanBaseProvider>.');
  return api;
}
