import { useApiRequest, type ApiEndpoint, type ApiRequestInput, type ApiResult } from '@humanbase/data';
import { Alert, Button, CodeBlock, Field, FileField, Select, Spinner, TextInput } from '@humanbase/ui';
import { useState, type FormEvent } from 'react';

const pretty = (body: unknown) => (typeof body === 'string' ? body : JSON.stringify(body, null, 2));
// A response that isn't JSON, such as an error page's text, shows uncolored.
const languageOf = (body: unknown) => (typeof body === 'string' ? {} : { language: 'json' as const });

function Result({ result }: { result: ApiResult }) {
  if (result.ok) return <CodeBlock label="Response" code={pretty(result.body)} {...languageOf(result.body)} expandLabel="Show the full response" />;
  if (result.sampleMissing) {
    return (
      <Alert tone="info" title="No sample data for this request">
        With the API off, only requests that have recorded sample data answer. Turn the API on to send this one.
      </Alert>
    );
  }
  return (
    <>
      <Alert tone="error" title={`The API answered ${result.status}`}>
        {result.status === 404 ? 'Nothing was found for these values. Check them and send again.' : 'The request wasn’t accepted. The response below says why.'}
      </Alert>
      {result.body !== null && <CodeBlock label={`${result.status} response`} code={pretty(result.body)} {...languageOf(result.body)} />}
    </>
  );
}

/** Sends the endpoint a request with values someone types, starting from the schema's examples. */
export function TryRequest({ endpoint, base }: { endpoint: ApiEndpoint; base: string }) {
  const [values, setValues] = useState(endpoint.defaultValues);
  const [body, setBody] = useState(endpoint.defaultBody);
  const [form, setForm] = useState<Record<string, string | File>>(endpoint.defaultForm);
  const [problems, setProblems] = useState<string[]>([]);
  const send = useApiRequest();
  const input: ApiRequestInput = { values, body, form };
  const ready = endpoint.problems(input).length === 0;
  const setValue = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = endpoint.problems(input);
    setProblems(found);
    if (!found.length) send.mutate(endpoint.request(input));
  };
  const reset = () => {
    setValues(endpoint.defaultValues);
    setBody(endpoint.defaultBody);
    setForm(endpoint.defaultForm);
    setProblems([]);
    send.reset();
  };

  return (
    <form className="api-try" onSubmit={submit} noValidate>
      {endpoint.parameters.map((parameter) => {
        const label = `${parameter.name}${parameter.required ? '' : ' (optional)'}`;
        if (parameter.choices.length) {
          return (
            <Select
              key={parameter.name}
              label={label}
              placeholder="Not set"
              options={[...(parameter.required ? [] : [{ value: '', label: 'Not set' }]), ...parameter.choices.map((choice) => ({ value: choice, label: choice }))]}
              value={values[parameter.name] ?? ''}
              onChange={(value) => setValue(parameter.name, value)}
              hint={parameter.description}
            />
          );
        }
        return (
          <div key={parameter.name} className="api-try-parameter">
            <TextInput label={label} hint={parameter.description} value={values[parameter.name] ?? ''} onChange={(event) => setValue(parameter.name, event.target.value)} />
            {parameter.examples.length > 1 && (
              <Select
                label={`Examples for ${parameter.name}`}
                size="small"
                options={parameter.examples.map((example) => ({ value: example.value, label: example.label }))}
                value={parameter.examples.some((example) => example.value === values[parameter.name]) ? (values[parameter.name] ?? '') : ''}
                placeholder="Choose an example"
                onChange={(value) => setValue(parameter.name, value)}
              />
            )}
          </div>
        );
      })}

      {endpoint.body?.contentType === 'application/json' && (
        <Field label="Request body (JSON)">
          {(control) => <textarea {...control} className="field-control api-try-body" value={body} spellCheck={false} rows={Math.min(16, body.split('\n').length + 1)} onChange={(event) => setBody(event.target.value)} />}
        </Field>
      )}
      {endpoint.body?.fields.map((field) =>
        field.file ? (
          <FileField
            key={field.name}
            label={`${field.name}${field.required ? '' : ' (optional)'}`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              setForm((current) => (file ? { ...current, [field.name]: file } : Object.fromEntries(Object.entries(current).filter(([name]) => name !== field.name))));
            }}
          />
        ) : (
          <TextInput key={field.name} label={`${field.name}${field.required ? '' : ' (optional)'}`} value={typeof form[field.name] === 'string' ? (form[field.name] as string) : ''} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} />
        ),
      )}

      {problems.length > 0 && (
        <Alert tone="error" title="Fix these to send the request">
          <ul>
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </Alert>
      )}
      {endpoint.method === 'POST' && <p className="api-try-note">Humanbase’s servers do the work this request asks for, and may start a job, as submitting on the tool’s page does.</p>}
      <div className="api-try-actions">
        <Button type="submit" disabled={send.isPending}>
          Send request
        </Button>
        <Button type="button" variant="ghost" onClick={reset}>
          Reset
        </Button>
      </div>

      {ready && <CodeBlock label="The same request with curl" code={endpoint.curl(input, base)} language="curl" />}
      <div aria-live="polite" className="api-try-result">
        {send.isPending && (
          <p className="api-try-sending">
            <Spinner size={16} /> Sending the request…
          </p>
        )}
        {send.data && <Result result={send.data} />}
        {send.isError && (
          <Alert tone="error" title="The request couldn’t be sent">
            Check your connection and send it again.
          </Alert>
        )}
      </div>
    </form>
  );
}
