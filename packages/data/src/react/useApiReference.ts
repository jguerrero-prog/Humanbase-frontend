import { useMutation, useQuery } from '@tanstack/react-query';
import type { ApiRequest } from '../reference/ApiReference';
import { useHumanbase } from './HumanbaseProvider';

/** The API's schema, read once a visit. */
export function useApiReference() {
  const api = useHumanbase();
  return useQuery({ queryKey: ['api-reference'], queryFn: () => api.apiReference.reference(), staleTime: Infinity });
}

/** Sends one "Try it" request; each endpoint keeps its own last result. */
export function useApiRequest() {
  const api = useHumanbase();
  return useMutation({ mutationFn: (request: ApiRequest) => api.apiReference.send(request) });
}
