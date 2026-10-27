import { ApiClient } from '../ApiClient';
import type { Query } from '../DataClient';
import type { OpenApiDocument, OpenApiExample, OpenApiMedia, OpenApiOperation, OpenApiParameter, OpenApiSchema } from './OpenApi';

export type ApiMethod = 'GET' | 'POST';

export interface ApiExample {
  label: string;
  value: string;
}

export interface ApiParameter {
  name: string;
  location: OpenApiParameter['in'];
  required: boolean;
  type: string;
  /** The values the API accepts, when it names them. */
  choices: readonly string[];
  description: string;
  examples: readonly ApiExample[];
}

export interface ApiBodyField {
  name: string;
  type: string;
  required: boolean;
  /** A file the request uploads, such as a GWAS file. */
  file: boolean;
  description: string;
}

export interface ApiBody {
  contentType: string;
  examples: readonly ApiExample[];
  /** The form fields, for a multipart upload. */
  fields: readonly ApiBodyField[];
}

export interface ApiResponse {
  code: string;
  description: string;
  /** The response's fields as JSON, with each value's type in place of a value. */
  shape?: string;
}

/** What "Try it" sends: the parameters' values by name, and a JSON body as text or a form's fields. */
export interface ApiRequestInput {
  values: Readonly<Record<string, string>>;
  body?: string;
  form?: Readonly<Record<string, string | File>>;
}

export interface ApiRequest {
  method: ApiMethod;
  route: string;
  query: Query;
  body?: unknown;
}

const jsonType = 'application/json';
const formType = 'multipart/form-data';
const pretty = (value: unknown) => JSON.stringify(value, null, 2);
const quoted = (text: string) => `'${text.replace(/'/g, `'\\''`)}'`;

/** Resolves a schema's $refs and describes its type and shape the way a reader needs them. */
class SchemaReader {
  constructor(private readonly schemas: Record<string, OpenApiSchema>) {}

  resolve(schema: OpenApiSchema | undefined, seen: ReadonlySet<string> = new Set()): { schema: OpenApiSchema | undefined; seen: ReadonlySet<string> } {
    if (!schema?.$ref) return { schema, seen };
    const name = schema.$ref.replace('#/components/schemas/', '');
    if (seen.has(name)) return { schema: undefined, seen };
    return this.resolve(this.schemas[name], new Set([...seen, name]));
  }

  typeOf(schema: OpenApiSchema | undefined): string {
    const resolved = this.resolve(schema).schema;
    if (!resolved) return 'object';
    const variant = resolved.allOf?.[0] ?? resolved.oneOf?.[0] ?? resolved.anyOf?.[0];
    if (variant) return this.typeOf(variant);
    if (resolved.type === 'array') return `array of ${this.typeOf(resolved.items)}`;
    if (resolved.format === 'binary') return 'file';
    return resolved.type ?? 'object';
  }

  /** The value a field holds, written as its type: "string", ["integer"], { "name": "string" }. */
  shape(schema: OpenApiSchema | undefined, seen: ReadonlySet<string> = new Set(), depth = 0): unknown {
    const { schema: resolved, seen: through } = this.resolve(schema, seen);
    if (!resolved || depth > 6) return 'object';
    const variant = resolved.allOf?.[0] ?? resolved.oneOf?.[0] ?? resolved.anyOf?.[0];
    if (variant) return this.shape(variant, through, depth);
    if (resolved.type === 'array') return [this.shape(resolved.items, through, depth + 1)];
    if (resolved.properties) return Object.fromEntries(Object.entries(resolved.properties).map(([name, field]) => [name, this.shape(field, through, depth + 1)]));
    if (typeof resolved.additionalProperties === 'object') return { key: this.shape(resolved.additionalProperties, through, depth + 1) };
    if (resolved.enum) return resolved.enum.map(String).join(' | ');
    const type = resolved.type ?? 'object';
    return resolved.nullable ? `${type} or null` : type;
  }

  properties(schema: OpenApiSchema | undefined): { name: string; field: OpenApiSchema; required: boolean }[] {
    const resolved = this.resolve(schema).schema;
    return Object.entries(resolved?.properties ?? {}).map(([name, field]) => ({ name, field, required: resolved?.required?.includes(name) ?? false }));
  }
}

function examplesOf(examples: Record<string, OpenApiExample> | undefined, show: (value: unknown) => string): ApiExample[] {
  return Object.entries(examples ?? {}).map(([name, example]) => ({ label: example.summary ?? name, value: show(example.value) }));
}

// The first line of a description is the endpoint's title: a "## Heading", or its first sentence.
function titleAndText(operation: OpenApiOperation): { title: string; text: string } {
  const description = (operation.description ?? '').trim();
  const heading = /^#{1,6}\s+(.+)\n?/.exec(description);
  if (operation.summary) return { title: operation.summary, text: description };
  if (heading?.[1]) return { title: heading[1].trim(), text: description.slice(heading[0].length).trim() };
  const sentence = /^(.+?[.!?])(\s+|$)/s.exec(description.split('\n\n')[0] ?? '');
  const first = sentence?.[1] ?? description.split('\n')[0] ?? operation.operationId;
  return { title: first.replace(/\.$/, ''), text: description.slice(first.length).trim() };
}

/** Headings inside a description sit under the endpoint's own heading, at level 4 or below. */
const underEndpoint = (markdown: string) => markdown.replace(/^(#{1,6})(\s)/gm, (_, hashes: string, space: string) => '#'.repeat(Math.min(6, Math.max(4, hashes.length + 1))) + space);

export class ApiEndpoint {
  readonly title: string;
  readonly description: string;
  readonly parameters: readonly ApiParameter[];
  readonly body: ApiBody | undefined;
  readonly responses: readonly ApiResponse[];

  constructor(
    readonly method: ApiMethod,
    readonly path: string,
    readonly tag: string,
    operation: OpenApiOperation,
    reader: SchemaReader,
  ) {
    const { title, text } = titleAndText(operation);
    // A title reads as plain text in the sidebar and its heading, without the description's Markdown.
    this.title = title.replace(/`([^`]+)`|\*\*([^*]+)\*\*/g, (_, code?: string, bold?: string) => code ?? bold ?? '');
    this.description = underEndpoint(text);
    // Path parameters come first, then the required ones, as a request is built.
    const order = (parameter: OpenApiParameter) => (parameter.in === 'path' ? 0 : parameter.required ? 1 : 2);
    this.parameters = [...(operation.parameters ?? [])].sort((a, b) => order(a) - order(b)).map((parameter) => ({
      name: parameter.name,
      location: parameter.in,
      required: parameter.required ?? false,
      type: reader.typeOf(parameter.schema),
      choices: (reader.resolve(parameter.schema).schema?.enum ?? []).map(String),
      description: parameter.description ?? '',
      examples: parameter.examples ? examplesOf(parameter.examples, String) : parameter.example === undefined ? [] : [{ label: 'Example', value: String(parameter.example) }],
    }));
    this.body = ApiEndpoint.bodyOf(operation.requestBody?.content, reader);
    this.responses = Object.entries(operation.responses).map(([code, response]) => {
      const media = response.content?.[jsonType] ?? Object.values(response.content ?? {})[0];
      return { code, description: response.description ?? '', ...(media?.schema && { shape: pretty(reader.shape(media.schema)) }) };
    });
  }

  private static bodyOf(content: Record<string, OpenApiMedia> | undefined, reader: SchemaReader): ApiBody | undefined {
    if (!content) return undefined;
    const contentType = content[jsonType] ? jsonType : content[formType] ? formType : Object.keys(content)[0];
    const media = contentType ? content[contentType] : undefined;
    if (!contentType || !media) return undefined;
    const form = contentType === formType;
    return {
      contentType,
      examples: examplesOf(media.examples, (value) => (form && typeof value === 'object' && value ? Object.entries(value).map(([name, field]) => `${name}: ${String(field)}`).join('\n') : pretty(value))),
      fields: form
        ? reader.properties(media.schema).map(({ name, field, required }) => ({ name, type: reader.typeOf(field), required, file: reader.typeOf(field) === 'file', description: field.description ?? '' }))
        : [],
    };
  }

  /** The id each endpoint's heading and sidebar link share, from its method and path. */
  get id(): string {
    return `${this.method}-${this.path}`.toLowerCase().replace(/[{}]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  }

  /** The path below /api/, as the data clients take it. */
  get route(): string {
    return this.path.replace(/^\/api\//, '');
  }

  /** The example each parameter starts with in "Try it". */
  get defaultValues(): Record<string, string> {
    return Object.fromEntries(this.parameters.map((parameter) => [parameter.name, parameter.examples[0]?.value ?? '']));
  }

  /** The example a JSON body, or each form field, starts with in "Try it". */
  get defaultBody(): string {
    return this.body?.contentType === jsonType ? (this.body.examples[0]?.value ?? '{}') : '';
  }

  get defaultForm(): Record<string, string> {
    const example = this.body?.examples[0]?.value ?? '';
    const values = Object.fromEntries(example.split('\n').map((line) => line.split(': ')).filter((pair): pair is [string, string] => pair.length === 2));
    return Object.fromEntries((this.body?.fields ?? []).filter((field) => !field.file).map((field) => [field.name, values[field.name] ?? '']));
  }

  matches(words: string): boolean {
    const text = `${this.method} ${this.path} ${this.title} ${this.tag}`.toLowerCase();
    return words.toLowerCase().split(/\s+/).filter(Boolean).every((word) => text.includes(word));
  }

  /** What is missing or wrong before the request can be sent. */
  problems(input: ApiRequestInput): string[] {
    const missing = this.parameters.filter((parameter) => parameter.required && !input.values[parameter.name]?.trim()).map((parameter) => `Enter ${parameter.name}.`);
    const fields = (this.body?.fields ?? []).filter((field) => field.required && !input.form?.[field.name]).map((field) => `${field.file ? 'Choose' : 'Enter'} ${field.name}.`);
    return [...missing, ...fields, ...(this.body?.contentType === jsonType && !isJson(input.body ?? '') ? ['The request body isn’t valid JSON.'] : [])];
  }

  request(input: ApiRequestInput): ApiRequest {
    const value = (name: string) => input.values[name]?.trim() ?? '';
    const route = this.route.replace(/\{(\w+)\}/g, (_, name: string) => encodeURIComponent(value(name)));
    // A query example may repeat its name, as "3553&entrez=7128"; each part becomes its own value.
    const query: Query = Object.fromEntries(
      this.parameters.filter((parameter) => parameter.location === 'query' && value(parameter.name)).map((parameter) => [parameter.name, value(parameter.name).split(`&${parameter.name}=`)]),
    );
    if (this.method === 'GET') return { method: 'GET', route, query };
    if (this.body?.contentType === jsonType) return { method: 'POST', route, query, body: JSON.parse(input.body ?? '{}') as unknown };
    const form = new FormData();
    for (const [name, field] of Object.entries(input.form ?? {})) if (field !== '') form.append(name, field);
    return { method: 'POST', route, query, body: form };
  }

  /** The request's full address, from the API's base, such as https://humanbase.io/api. */
  url(input: ApiRequestInput, base: string): string {
    const { route, query } = this.request(input);
    return new ApiClient(base).url(route, query);
  }

  /** The same request as a curl command, to copy into a terminal. */
  curl(input: ApiRequestInput, base: string): string {
    const lines = [`curl -X ${this.method} ${quoted(this.url(input, base))}`, `  -H 'Accept: application/json'`];
    if (this.body?.contentType === jsonType) lines.push(`  -H 'Content-Type: application/json'`, `  -d ${quoted(JSON.stringify(JSON.parse(input.body ?? '{}')))}`);
    for (const [name, field] of Object.entries(input.form ?? {})) if (field !== '') lines.push(`  -F ${quoted(typeof field === 'string' ? `${name}=${field}` : `${name}=@${field.name}`)}`);
    return lines.join(' \\\n');
  }
}

function isJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

export interface ApiGroup {
  tag: string;
  endpoints: readonly ApiEndpoint[];
}

/** The API's own description of every endpoint, from /api/schema/, grouped as it groups them. */
export class ApiReference {
  /** Groups the reference leaves out: the mailing list sign-up is the footer's job, not an API for code. */
  static readonly hiddenTags: readonly string[] = ['newsletter'];

  readonly title: string;
  readonly version: string;
  readonly description: string;
  readonly license: string | undefined;
  readonly groups: readonly ApiGroup[];

  constructor(document: OpenApiDocument) {
    this.title = document.info.title;
    this.version = document.info.version;
    this.description = document.info.description ?? '';
    this.license = document.info.license?.name;
    const reader = new SchemaReader(document.components?.schemas ?? {});
    const endpoints = Object.entries(document.paths).flatMap(([path, operations]) =>
      Object.entries(operations)
        .filter(([method]) => method === 'get' || method === 'post')
        .map(([method, operation]) => new ApiEndpoint(method.toUpperCase() as ApiMethod, path, operation.tags?.[0] ?? 'other', operation, reader)),
    );
    const tags = [...new Set(endpoints.map((endpoint) => endpoint.tag))].filter((tag) => !ApiReference.hiddenTags.includes(tag)).sort();
    this.groups = tags.map((tag) => ({ tag, endpoints: endpoints.filter((endpoint) => endpoint.tag === tag) }));
  }

  get endpointCount(): number {
    return this.groups.reduce((count, group) => count + group.endpoints.length, 0);
  }

  /** The groups with only the endpoints whose method, path, title or group contain every word. */
  filter(words: string): ApiGroup[] {
    return this.groups.map((group) => ({ ...group, endpoints: group.endpoints.filter((endpoint) => endpoint.matches(words)) })).filter((group) => group.endpoints.length);
  }
}
