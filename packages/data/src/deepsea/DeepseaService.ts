import type { DataClient } from '../DataClient';
import type { GenomeLocation } from '../genome/GenomeLocation';
import type { InputKind, VariantModel } from '../jobs/VariantFileCheck';
import { DeepseaJob, type DeepseaJobRecord } from './DeepseaJob';
import { deepseaModels, type Genome } from './DeepseaModel';
import type { FeaturePredictionRecord, FeaturesRecord, ScoreType, VariantScoresRecord } from './DeepseaResult';
import { InsilicoResult, type InsilicoRecord } from './InsilicoResult';

export interface DeepseaRequest {
  model: VariantModel;
  kind: InputKind;
  /** The file's text, whether it was uploaded, pasted or the example. */
  text: string;
  fileName: string;
  /** True when the text came from an uploaded file; pasted text and examples are sent as text. */
  uploaded?: boolean | undefined;
  genome: Genome;
  title?: string | undefined;
  email?: string | undefined;
}

/** Sei, Beluga, Seqweaver and ExPecto run as jobs on the same endpoints; only ds_model, expecto and the features change. */
export class DeepseaService {
  static readonly pollEvery = 10_000;

  constructor(private readonly client: DataClient) {}

  static pollDelay(job: DeepseaJob): number | false {
    return job.isDone ? false : DeepseaService.pollEvery;
  }

  /** The fields the live site's form sends, in its order: the input goes as upload_file or upload_textarea. */
  static formOf({ model, kind, text, fileName, uploaded, genome, title, email }: DeepseaRequest): FormData {
    const info = deepseaModels[model];
    const form = new FormData();
    form.append('title', title?.trim() ?? '');
    form.append('email', email?.trim() ?? '');
    form.append('input_type', kind);
    form.append('ds_model', info.apiName.toLowerCase());
    form.append('signup', 'false');
    form.append('expecto', String(Boolean(info.expecto)));
    form.append('upload_textarea', uploaded ? '' : text);
    if (uploaded) form.append('upload_file', new File([text], fileName, { type: 'text/plain' }));
    form.append('insilico', String(Boolean(info.insilico)));
    form.append('genome_assembly', genome);
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

  /** Each variant's score on every feature, for every variant of the job in a range, as the live job page reads them. */
  featurePredictions(id: string, scoreType: string, range: GenomeLocation): Promise<FeaturePredictionRecord[]> {
    return this.client.get<FeaturePredictionRecord[]>(`deepsea/jobs/${id}/feature_predictions/`, { score_type: scoreType, chr_and_variant_range: range.variantRange });
  }

  /** One sequence's mutagenesis for one feature, named by its index in the model's feature list. */
  async insilico(id: string, sequenceName: string, featureIndex: number): Promise<InsilicoResult> {
    return new InsilicoResult(await this.client.get<InsilicoRecord>(`deepsea/jobs/${id}/in_silico_mutagenesis/`, { sequence_name: sequenceName, feature_name: featureIndex }));
  }

  /** A model's features; a score type the API's list doesn't name, such as Sei's sequence classes, uses the bundled names. */
  features(model: VariantModel, scoreType?: string): Promise<FeaturesRecord> {
    const info = deepseaModels[model];
    if (scoreType && info.classFeatures?.scoreType === scoreType) return Promise.resolve(info.classFeatures.features);
    return this.client.get<FeaturesRecord>(`deepsea/${info.apiName}/features/`, info.expecto ? { expecto: true } : {});
  }
}
