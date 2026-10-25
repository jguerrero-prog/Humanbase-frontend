import type { DataClient } from '../DataClient';
import type { DataVersion } from '../genes/Gene';
import { ExtendedUniverse } from '../functions/ExtendedUniverse';
import { ModuleResult, type CommunityRecord } from './ModuleResult';

export interface ModuleRequest {
  entrez: readonly number[];
  integration: string;
  version: DataVersion;
  title?: string | undefined;
  extendedUniverse?: boolean;
}

interface Processing {
  status: 'processing';
}

const path = 'integrations/community/';
const isProcessing = (body: CommunityRecord | Processing): body is Processing => 'status' in body && body.status === 'processing';

/** Module detection runs as a job: submit once, then poll with the same body_tag until the result is ready. */
export class ModuleService {
  static readonly minimumGenes = 20;
  static readonly maximumGenes = 3500;
  static readonly pollEvery = 5000;

  constructor(private readonly client: DataClient) {}

  /** The key the API files the job and its cached result under, made the same way as on the live site. */
  static async bodyTag({ entrez, integration, version, title = '', extendedUniverse = false }: ModuleRequest): Promise<string> {
    const list = entrez.map((id) => `"${id}"`).sort();
    const text = `{ "entrez": [${list.join(',')}] }${integration}${version}${title}extended_universe=${extendedUniverse}`;
    const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /** Starts the job. A list that was run before comes back finished straight away. */
  async submit(request: ModuleRequest): Promise<{ bodyTag: string; result: ModuleResult | null }> {
    const bodyTag = await ModuleService.bodyTag(request);
    const title = request.title?.trim();
    const query = { integration: request.integration, giant_version: request.version, body_tag: bodyTag, ...(title && { title }), ...ExtendedUniverse.query(request.extendedUniverse ?? false) };
    const body = await this.client.post<CommunityRecord | Processing>(path, { entrez: request.entrez }, query);
    return { bodyTag, result: isProcessing(body) ? null : new ModuleResult(body) };
  }

  /** The finished result, or null while the job is still running. */
  async poll(bodyTag: string): Promise<ModuleResult | null> {
    const body = await this.client.post<CommunityRecord | Processing>(path, undefined, { body_tag: bodyTag });
    return isProcessing(body) ? null : new ModuleResult(body);
  }
}
