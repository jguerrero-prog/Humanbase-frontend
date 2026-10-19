import { useQuery } from '@tanstack/react-query';
import type { NetwasExample } from '../jobs/NetwasService';
import { NetwasService } from '../jobs/NetwasService';
import type { NetwasJob } from '../jobs/NetwasJob';
import { useHumanbase } from './HumanbaseProvider';

/** Reads a NetWAS job, then reads it again while it is queued or running. */
export function useNetwasJob(id: string | undefined) {
  const api = useHumanbase();
  return useQuery({
    queryKey: ['netwas', id],
    queryFn: () => api.netwas.get(id as string),
    enabled: Boolean(id),
    retry: false,
    refetchInterval: (query) => (query.state.data ? NetwasService.pollDelay(query.state.data) : false),
  });
}

/** The finished job's result file, parsed into ranked genes. */
export function useNetwasResult(job: NetwasJob | undefined) {
  const api = useHumanbase();
  return useQuery({ queryKey: ['netwas-result', job?.id], queryFn: () => api.netwas.result(job as NetwasJob), enabled: Boolean(job?.resultsFile), staleTime: Infinity });
}

export function useNetwasExample(example: NetwasExample | undefined) {
  const api = useHumanbase();
  return useQuery({ queryKey: ['netwas-example', example?.url], queryFn: () => api.netwas.exampleFile(example as NetwasExample), enabled: Boolean(example), staleTime: Infinity });
}
