import type { DataClient } from '../DataClient';
import type { InputKind, VariantModel } from '../jobs/VariantFileCheck';
import { DeepseaJob, type DeepseaJobRecord } from './DeepseaJob';
import { deepseaModels } from './DeepseaModel';
import type { FeaturePredictionRecord, FeaturesRecord, ScoreType, VariantScoresRecord } from './DeepseaResult';

export interface DeepseaRequest {
  model: VariantModel;
  kind: InputKind;
  /** The file's text, whether it was uploaded, pasted or the example. */
  text: string;
  fileName: string;
  genome: string;
  title?: string | undefined;
  email?: string | undefined;
}

/** Sei, Beluga and Seqweaver run as jobs on the same endpoints; only ds_model and the features change. */
export class DeepseaService {
  static readonly pollEvery = 10_000;
  // The schema doesn't name the upload field; confirm with the API team before relying on it.
  static readonly fileField = 'input_file';

  constructor(private readonly client: DataClient) {}

  static pollDelay(job: DeepseaJob): number | false {
    return job.isDone ? false : DeepseaService.pollEvery;
  }

  static formOf({ model, kind, text, fileName, genome, title, email }: DeepseaRequest): FormData {
    const form = new FormData();
    form.append('ds_model', deepseaModels[model].apiName);
    form.append('input_type', kind);
    form.append('genome_assembly', genome);
    if (title?.trim()) form.append('title', title.trim());
    if (email?.trim()) form.append('email', email.trim());
    form.append(DeepseaService.fileField, new File([text], fileName, { type: 'text/plain' }));
    return form;
  }

  async submit(request: DeepseaRequest): Promise<DeepseaJob> {
    return new DeepseaJob(await this.client.post<DeepseaJobRecord>('deepsea/jobs/', DeepseaService.formOf(request)));
  }

  async get(id: string): Promise<DeepseaJob> {
    return new DeepseaJob(await this.client.get<DeepseaJobRecord>(`deepsea/jobs/${id}/`));
  }

  scoreTypes(id: string): Promise<ScoreType[]> {
    return this.client.get<ScoreType[]>(`deepsea/jobs/${id}/score_types/`);
  }

  variantScores(id: string, scoreType: string): Promise<VariantScoresRecord> {
    return this.client.get<VariantScoresRecord>(`deepsea/jobs/${id}/variant_scores/`, { score_type: scoreType });
  }

  async featurePredictions(id: string, scoreType: string, chrVariant: string): Promise<FeaturePredictionRecord | null> {
    const rows = await this.client.get<FeaturePredictionRecord[]>(`deepsea/jobs/${id}/feature_predictions/`, { score_type: scoreType, chr_variant: chrVariant });
    return rows[0] ?? null;
  }

  features(model: VariantModel): Promise<FeaturesRecord> {
    return this.client.get<FeaturesRecord>(`deepsea/${deepseaModels[model].apiName}/features/`);
  }
}
