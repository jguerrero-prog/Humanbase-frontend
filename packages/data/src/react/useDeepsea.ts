import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { DeepseaJob } from '../deepsea/DeepseaJob';
import { jobScoreTypes, summaryScoreTypes, variantRows, type FeaturePredictionRecord, type FeaturesRecord, type VariantRow, type VariantScoresRecord } from '../deepsea/DeepseaResult';
import { deepseaModels } from '../deepsea/DeepseaModel';
import { DeepseaService, type PrecomputedSource } from '../deepsea/DeepseaService';
import { SeiHgmdService } from '../deepsea/SeiHgmdService';
import type { GenomeLocation } from '../genome/GenomeLocation';
import type { VariantModel } from '../jobs/VariantFileCheck';
import type { Humanbase } from '../Humanbase';
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

/** The finished job's score types and every variant with its summary scores; the chosen score, such as one of Sei's 40 sequence classes, loads only once chosen. */
export function useDeepseaVariants(job: DeepseaJob | undefined, chosenKey?: string) {
  const api = useHumanbase();
  const id = job?.status === 'finished' ? job.id : '';
  const types = useQuery({ queryKey: ['deepsea-score-types', id], queryFn: () => api.deepsea.scoreTypes(id), enabled: Boolean(id), staleTime: Infinity });
  const plotTypes = job ? jobScoreTypes(job.model, types.data ?? []) : [];
  const summary = job ? summaryScoreTypes(job.model, types.data ?? []) : [];
  const chosen = plotTypes.find((type) => type.short_name === chosenKey) ?? plotTypes[0];
  const extra = chosen && !summary.includes(chosen) ? chosen : undefined;
  const sets = useQueries({
    queries: [...summary, ...(extra ? [extra] : [])].map((type) => ({ queryKey: ['deepsea-scores', id, type.level, type.short_name], queryFn: () => api.deepsea.scores(id, type), staleTime: Infinity })),
  });
  const summarySets = sets.slice(0, summary.length);
  const chosenSet = extra ? sets[summary.length] : undefined;
  const loaded = sets.flatMap((set) => (set.data ? [set.data] : [])) satisfies VariantScoresRecord[];
  const variants: VariantRow[] | undefined = types.isSuccess && summarySets.every((set) => set.data) ? variantRows(loaded) : undefined;
  const failed = [types, ...summarySets].filter((query) => query.isError);
  return {
    scoreTypes: types.data,
    plotTypes,
    summary,
    chosen,
    /** The chosen score's own request, when it isn't a summary score. */
    chosenScores: chosenSet && { pending: chosenSet.isPending, error: chosenSet.error ?? undefined, refetch: () => void chosenSet.refetch() },
    variants,
    error: failed[0]?.error,
    refetch: () => failed.forEach((query) => void query.refetch()),
  };
}

/** Every variant's prediction on every feature in the genome browser's view, for one feature-level score, with the model's feature names. */
export function useViewPredictions(job: DeepseaJob | undefined, scoreType: string | undefined, view: GenomeLocation | undefined) {
  const api = useHumanbase();
  const id = job?.id ?? '';
  const model = job?.model.id;
  const named = model && deepseaModels[model].classFeatures?.scoreType === scoreType ? scoreType : undefined;
  const features = useQuery({ ...featuresQuery(api, model ?? 'sei', named), enabled: Boolean(model) });
  return useInViewPredictions(features, view, ['deepsea-predictions', id, scoreType ?? ''], (range) => api.deepsea.featurePredictions(id, scoreType ?? '', range), Boolean(id && scoreType));
}

/** The same for a model's precomputed variants, such as Seqweaver's gnomAD variants, which no job holds. */
export function usePrecomputedPredictions(source: PrecomputedSource, view: GenomeLocation | undefined) {
  const api = useHumanbase();
  const features = usePrecomputedFeatures(source);
  return useInViewPredictions(features, view, ['precomputed-predictions', source.dataset ?? source.model, source.scoreType ?? ''], (range) => api.deepsea.precomputedPredictions(source, range), true);
}

/** The features a set of precomputed variants is scored on; they never change, so they load once. */
export function usePrecomputedFeatures(source: PrecomputedSource) {
  const api = useHumanbase();
  return useQuery({ queryKey: ['precomputed-features', source.dataset ?? source.model, source.scoreType], queryFn: () => api.deepsea.precomputedFeatures(source), staleTime: Infinity });
}

function useInViewPredictions(features: UseQueryResult<FeaturesRecord>, view: GenomeLocation | undefined, key: readonly string[], read: (range: GenomeLocation) => Promise<FeaturePredictionRecord[]>, enabled: boolean) {
  const range = useReadRange(view, key.join(' '));
  const predictions = useQuery(rangeQuery([...key, range?.variantRange], () => read(range as GenomeLocation), Boolean(enabled && range)));
  const inView = useMemo(() => view && predictions.data?.filter((record) => view.includes(record.chromosome, record.position)).sort((a, b) => a.position - b.position), [view, predictions.data]);
  const failed = [features, predictions].filter((query) => query.isError);
  return { features: features.data, predictions: inView, error: failed[0]?.error, refetch: () => failed.forEach((query) => void query.refetch()) };
}

// A model's features never change, so each list loads once per session and is kept.
const featuresQuery = (api: Humanbase, model: VariantModel, named?: string) => ({
  queryKey: ['deepsea-features', model, named ?? null],
  queryFn: () => api.deepsea.features(model, named),
  staleTime: Infinity,
  gcTime: Infinity,
});

/** A model's features, such as Beluga's 2,002 chromatin features. */
export function useDeepseaFeatures(model: VariantModel | undefined) {
  const api = useHumanbase();
  return useQuery({ ...featuresQuery(api, model ?? 'sei'), enabled: Boolean(model) });
}

/** How many features a model has, from its known count when its list is too large to load for one. */
export function useDeepseaFeatureCount(model: VariantModel) {
  const api = useHumanbase();
  const known = deepseaModels[model].featureCount;
  const listed = useQuery({ ...featuresQuery(api, model), enabled: known === undefined }).data?.model_features?.length;
  return known ?? listed;
}

/** How many sequences or regions a finished job ran, read once from its input file. */
export function useDeepseaInputCount(job: DeepseaJob | undefined) {
  const api = useHumanbase();
  return useQuery({ queryKey: ['deepsea-input-count', job?.id], queryFn: () => api.deepsea.inputCount(job as DeepseaJob), enabled: job?.status === 'finished', staleTime: Infinity });
}

/** A BED job's regions, read from its input file only once asked for, such as when the genome browser opens. */
export function useDeepseaRegions(job: DeepseaJob | undefined, enabled = true) {
  const api = useHumanbase();
  return useQuery({ queryKey: ['deepsea-regions', job?.id], queryFn: () => api.deepsea.regions(job as DeepseaJob), enabled: enabled && job?.status === 'finished' && job.kind === 'bed', staleTime: Infinity });
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

/** The Sei HGMD dataset for its heatmap: its 40 sequence classes and all 853 variants, which never change, so they load once. */
export function useSeiHgmd() {
  const api = useHumanbase();
  const features = usePrecomputedFeatures(SeiHgmdService.source);
  const variants = useQuery({ queryKey: ['sei-hgmd-variants'], queryFn: () => api.seiHgmd.variants(), staleTime: Infinity });
  const failed = [features, variants].filter((query) => query.isError);
  return { features: features.data, variants: variants.data, error: failed[0]?.error, refetch: () => failed.forEach((query) => void query.refetch()) };
}
