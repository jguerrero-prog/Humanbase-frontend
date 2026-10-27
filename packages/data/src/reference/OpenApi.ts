/** The parts of an OpenAPI 3.0 document the API reference reads, as /api/schema/ publishes it. */
export interface OpenApiSchema {
  $ref?: string;
  type?: string;
  format?: string;
  enum?: readonly unknown[];
  nullable?: boolean;
  properties?: Record<string, OpenApiSchema>;
  additionalProperties?: boolean | OpenApiSchema;
  items?: OpenApiSchema;
  allOf?: readonly OpenApiSchema[];
  oneOf?: readonly OpenApiSchema[];
  anyOf?: readonly OpenApiSchema[];
  required?: readonly string[];
  description?: string;
}

export interface OpenApiExample {
  value: unknown;
  summary?: string;
  description?: string;
}

export interface OpenApiParameter {
  in: 'path' | 'query' | 'header' | 'cookie';
  name: string;
  required?: boolean;
  description?: string;
  schema?: OpenApiSchema;
  example?: unknown;
  examples?: Record<string, OpenApiExample>;
}

export interface OpenApiMedia {
  schema?: OpenApiSchema;
  examples?: Record<string, OpenApiExample>;
}

export interface OpenApiOperation {
  operationId: string;
  summary?: string;
  description?: string;
  tags?: readonly string[];
  parameters?: readonly OpenApiParameter[];
  requestBody?: { required?: boolean; content: Record<string, OpenApiMedia> };
  responses: Record<string, { description?: string; content?: Record<string, OpenApiMedia> }>;
}

export interface OpenApiDocument {
  openapi: string;
  info: { title: string; version: string; description?: string; license?: { name: string } };
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: { schemas?: Record<string, OpenApiSchema> };
}
