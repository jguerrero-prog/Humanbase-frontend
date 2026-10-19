import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Humanbase } from '../Humanbase';

const HumanbaseContext = createContext<Humanbase | null>(null);

interface HumanbaseProviderProps {
  api: Humanbase;
  children: ReactNode;
}

export function HumanbaseProvider({ api, children }: HumanbaseProviderProps) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000, retry: 1 } } }));
  return (
    <HumanbaseContext value={api}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </HumanbaseContext>
  );
}

export function useHumanbase(): Humanbase {
  const api = useContext(HumanbaseContext);
  if (!api) throw new Error('useHumanbase must be used inside <HumanbaseProvider>.');
  return api;
}
