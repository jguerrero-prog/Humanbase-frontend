import { useQueries, useQuery } from '@tanstack/react-query';
import type { DeepseaJob } from '../deepsea/DeepseaJob';
import { chrVariant, featureEffects, variantRows, type VariantRow, type VariantScoresRecord } from '../deepsea/DeepseaResult';
import { DeepseaService } from '../deepsea/DeepseaService';
import { useHumanbase } from './HumanbaseProvider';

/** Reads a Sei, Beluga or Seqweaver job every 10 seconds until it finishes or fails. */
export function useDeepseaJob(id: string | undefined) {
  const api = useHumanbase();
  return useQuery({
    queryKey: ['deepsea', id],
    queryFn: () => api.deepsea.get(id as string),
    enabled: Boolean(id),
    retry: false,
    refetchInterval: (query) => (query.state.data ? DeepseaService.pollDelay(query.state.data) : false),
  });
}

/** The finished job's score types, and every variant with each of its variant-level scores. */
export function useDeepseaVariants(job: DeepseaJob | undefined) {
  const api = useHumanbase();
  const id = job?.status === 'finished' ? job.id : '';
  const types = useQuery({ queryKey: ['deepsea-score-types', id], queryFn: () => api.deepsea.scoreTypes(id), enabled: Boolean(id), staleTime: Infinity });
  const variantTypes = (types.data ?? []).filter((type) => type.level === 'VARIANT');
  const sets = useQueries({
    queries: variantTypes.map((type) => ({ queryKey: ['deepsea-variant-scores', id, type.short_name], queryFn: () => api.deepsea.variantScores(id, type.short_name), staleTime: Infinity })),
  });
  const loaded = sets.flatMap((set) => (set.data ? [set.data] : [])) satisfies VariantScoresRecord[];
  const variants: VariantRow[] | undefined = types.isSuccess && loaded.length === variantTypes.length ? variantRows(loaded) : undefined;
  const failed = [types, ...sets].filter((query) => query.isError);
  return { scoreTypes: types.data, variants, error: failed[0]?.error, refetch: () => failed.forEach((query) => void query.refetch()) };
}

/** The selected variant's effect on every feature for one feature-level score. */
export function useFeatureEffects(job: DeepseaJob | undefined, scoreType: string | undefined, variant: VariantRow | undefined) {
  const api = useHumanbase();
  const where = variant ? chrVariant(variant) : '';
  const model = job?.model.id;
  const features = useQuery({ queryKey: ['deepsea-features', model], queryFn: () => api.deepsea.features(model ?? 'sei'), enabled: Boolean(model && variant), staleTime: Infinity });
  const prediction = useQuery({
    queryKey: ['deepsea-predictions', job?.id, scoreType, where],
    queryFn: () => api.deepsea.featurePredictions(job?.id ?? '', scoreType ?? '', where),
    enabled: Boolean(job && scoreType && where),
    staleTime: Infinity,
  });
  const effects = features.data && prediction.data ? featureEffects(prediction.data, features.data) : undefined;
  const failed = [features, prediction].filter((query) => query.isError);
  return { effects, isPending: features.isPending || prediction.isPending, error: failed[0]?.error, refetch: () => failed.forEach((query) => void query.refetch()) };
}

/** One sequence's in silico mutagenesis for one feature; each choice is one request, kept once loaded. */
export function useInsilico(job: DeepseaJob | undefined, sequenceName: string | undefined, featureIndex: number | undefined) {
  const api = useHumanbase();
  const id = job?.status === 'finished' ? job.id : '';
  return useQuery({
    queryKey: ['deepsea-insilico', id, sequenceName, featureIndex],
    queryFn: () => api.deepsea.insilico(id, sequenceName as string, featureIndex as number),
    enabled: Boolean(id && sequenceName && featureIndex !== undefined),
    staleTime: Infinity,
    placeholderData: (previous) => previous,
  });
}
