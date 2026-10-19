import { useQuery } from '@tanstack/react-query';
import { useHumanbase } from './HumanbaseProvider';

/** Every Humanbase network; the list rarely changes, so it is kept for the whole visit. */
export function useIntegrations() {
  const api = useHumanbase();
  return useQuery({ queryKey: ['integrations'], queryFn: () => api.integrations.list(), staleTime: Infinity });
}
