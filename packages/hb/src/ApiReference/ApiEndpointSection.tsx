import type { ApiEndpoint, ApiExample } from '@humanbase/data';
import { Badge, Cell, CodeBlock, type CodeLanguage, CopyButton, Disclosure, DocsMarkdown, HeaderCell, InlineCode, Table, Tabs } from '@humanbase/ui';
import { useId, useState } from 'react';
import { TryRequest } from './TryRequest';

function Examples({ label, examples, language }: { label: string; examples: readonly ApiExample[]; language?: CodeLanguage | undefined }) {
  const [selected, setSelected] = useState(examples[0]?.label ?? '');
  const shown = examples.find((example) => example.label === selected) ?? examples[0];
  if (!shown) return null;
  const block = <CodeBlock label={`${label}: ${shown.label}`} code={shown.value} {...(language && { language })} />;
  if (examples.length === 1) return block;
  return (
    <Tabs label={label} tabs={examples.map((example) => ({ value: example.label, label: example.label }))} value={shown.label} onChange={setSelected}>
      {block}
    </Tabs>
  );
}

/** One endpoint, all of it in view: what it does, its parameters, body and responses, then Try it. */
export function ApiEndpointSection({ endpoint, base }: { endpoint: ApiEndpoint; base: string }) {
  const headingId = useId();
  const tryId = useId();
  const [trying, setTrying] = useState(false);
  const { parameters, body, responses } = endpoint;
  return (
    <section id={endpoint.id} className="api-endpoint" aria-labelledby={headingId}>
      <h3 id={headingId} className="api-endpoint-title">
        {endpoint.title}
      </h3>
      <p className="api-endpoint-route">
        <Badge size="small" className={`api-method api-method-${endpoint.method.toLowerCase()}`}>
          {endpoint.method}
        </Badge>
        <InlineCode wrap>{endpoint.path}</InlineCode>
        <CopyButton text={`${base}/${endpoint.route}`} label={`${endpoint.method} ${endpoint.path}`} />
      </p>
      {endpoint.description && <DocsMarkdown markdown={endpoint.description} />}

      {parameters.length > 0 && (
        <Table caption={`Parameters of ${endpoint.method} ${endpoint.path}`} density="compact" columnWidths={['28%', '12%', '18%', '42%']} minWidth="560px">
          <thead>
            <tr>
              <HeaderCell>Parameter</HeaderCell>
              <HeaderCell>In</HeaderCell>
              <HeaderCell>Type</HeaderCell>
              <HeaderCell>Description</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {parameters.map((parameter) => (
              <tr key={`${parameter.location}-${parameter.name}`}>
                <Cell rowHeader>
                  <InlineCode>{parameter.name}</InlineCode>
                  {parameter.required && <span className="api-required">Required</span>}
                </Cell>
                <Cell>{parameter.location}</Cell>
                <Cell wrap>{parameter.choices.length ? `${parameter.type}: ${parameter.choices.join(', ')}` : parameter.type}</Cell>
                <Cell wrap>
                  {parameter.description}
                  {parameter.examples[0] && <span className="api-example">Example: {parameter.examples[0].value.length > 60 ? `${parameter.examples[0].value.slice(0, 60)}…` : parameter.examples[0].value}</span>}
                </Cell>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {body && (
        <div className="api-endpoint-part">
          <h4>
            Request body <span className="api-content-type">{body.contentType}</span>
          </h4>
          {body.fields.length > 0 && (
            <ul className="api-fields">
              {body.fields.map((field) => (
                <li key={field.name}>
                  <InlineCode>{field.name}</InlineCode> {field.type}
                  {field.required && <span className="api-required">Required</span>}
                  {field.description && <DocsMarkdown markdown={field.description} />}
                </li>
              ))}
            </ul>
          )}
          <Examples label="Request body example" examples={body.examples} language={body.contentType === 'application/json' ? 'json' : undefined} />
        </div>
      )}

      <div className="api-endpoint-part">
        <h4>Responses</h4>
        <dl className="api-responses">
          {responses.map((response) => (
            <div key={response.code}>
              <dt>
                <InlineCode>{response.code}</InlineCode>
              </dt>
              <dd>{response.description || (response.code.startsWith('2') ? 'Success' : 'Error')}</dd>
            </div>
          ))}
        </dl>
        {responses
          .filter((response) => response.shape)
          .map((response) => (
            <CodeBlock key={response.code} label={`${response.code} response fields`} code={response.shape ?? ''} language="json" collapseAfter={24} previewLines={12} expandLabel="Show every field" />
          ))}
      </div>

      <div className="api-endpoint-try">
        <Disclosure label="Try it" expandedLabel="Close Try it" controls={tryId} open={trying} onOpenChange={setTrying} />
        <div id={tryId} hidden={!trying}>
          {trying && <TryRequest endpoint={endpoint} base={base} />}
        </div>
      </div>
    </section>
  );
}
