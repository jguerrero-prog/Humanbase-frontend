import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { DeepseaJob } from '../deepsea/DeepseaJob';
import { variantRows, variantScoreTypes, type VariantRow, type VariantScoresRecord } from '../deepsea/DeepseaResult';
import { deepseaModels } from '../deepsea/DeepseaModel';
import { DeepseaService } from '../deepsea/DeepseaService';
import type { GenomeLocation } from '../genome/GenomeLocation';
import type { VariantModel } from '../jobs/VariantFileCheck';
import { useHumanbase } from './HumanbaseProvider';
import { rangeQuery, useReadRange } from './useReadRange';

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
  const variantTypes = job ? variantScoreTypes(job.model, types.data ?? []) : [];
  const sets = useQueries({
    queries: variantTypes.map((type) => ({ queryKey: ['deepsea-variant-scores', id, type.short_name], queryFn: () => api.deepsea.variantScores(id, type.short_name), staleTime: Infinity })),
  });
  const loaded = sets.flatMap((set) => (set.data ? [set.data] : [])) satisfies VariantScoresRecord[];
  const variants: VariantRow[] | undefined = types.isSuccess && loaded.length === variantTypes.length ? variantRows(loaded) : undefined;
  const failed = [types, ...sets].filter((query) => query.isError);
  return { scoreTypes: types.data, variants, error: failed[0]?.error, refetch: () => failed.forEach((query) => void query.refetch()) };
}

/** Every variant's prediction on every feature in the genome browser's view, for one feature-level score, with the model's feature names. */
export function useViewPredictions(job: DeepseaJob | undefined, scoreType: string | undefined, view: GenomeLocation | undefined) {
  const api = useHumanbase();
  const id = job?.id ?? '';
  const model = job?.model.id;
  const named = model && deepseaModels[model].classFeatures?.scoreType === scoreType ? scoreType : undefined;
  const features = useQuery({ queryKey: ['deepsea-features', model, named], queryFn: () => api.deepsea.features(model ?? 'sei', named), enabled: Boolean(model), staleTime: Infinity });
  const range = useReadRange(view, `${id} ${scoreType ?? ''}`);
  const predictions = useQuery(rangeQuery(['deepsea-predictions', id, scoreType, range?.variantRange], () => api.deepsea.featurePredictions(id, scoreType ?? '', range as GenomeLocation), Boolean(id && scoreType && range)));
  const inView = useMemo(() => view && predictions.data?.filter((record) => view.includes(record.chromosome, record.position)).sort((a, b) => a.position - b.position), [view, predictions.data]);
  const failed = [features, predictions].filter((query) => query.isError);
  return { features: features.data, predictions: inView, error: failed[0]?.error, refetch: () => failed.forEach((query) => void query.refetch()) };
}

/** A model's features, such as Beluga's 2,002 chromatin features; they never change, so they load once. */
export function useDeepseaFeatures(model: VariantModel | undefined) {
  const api = useHumanbase();
  return useQuery({ queryKey: ['deepsea-features', model], queryFn: () => api.deepsea.features(model as VariantModel), enabled: Boolean(model), staleTime: Infinity });
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
  });
}
