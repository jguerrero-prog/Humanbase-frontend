import { useQuery } from '@tanstack/react-query';
import { ModuleService } from '../modules/ModuleService';
import { useHumanbase } from './HumanbaseProvider';

/** Polls a module job every few seconds until its result is ready; data stays null while it runs. */
export function useModuleResult(bodyTag: string | undefined) {
  const api = useHumanbase();
  return useQuery({
    queryKey: ['modules', bodyTag],
    queryFn: () => api.modules.poll(bodyTag as string),
    enabled: Boolean(bodyTag),
    retry: false,
    staleTime: Infinity,
    refetchInterval: (query) => (query.state.data === null ? ModuleService.pollEvery : false),
  });
}
