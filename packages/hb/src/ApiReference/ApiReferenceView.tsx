import { useApiReference, useHumanbase, type ApiGroup } from '@humanbase/data';
import { Alert, Breadcrumbs, DocsLayout, DocsNav, InlineCode, Skeleton, TextInput, type DocsNavGroup } from '@humanbase/ui';
import { useEffect, useId, useState } from 'react';
import { apiGroupLabel, apiGroups } from '../content/apiReference';
import { ApiEndpointSection } from './ApiEndpointSection';
import './ApiReference.css';

const startId = 'getting-started';

function Group({ group, base }: { group: ApiGroup; base: string }) {
  const headingId = useId();
  return (
    <section id={group.tag} className="api-group" aria-labelledby={headingId}>
      <h2 id={headingId}>{apiGroupLabel(group.tag)}</h2>
      {apiGroups[group.tag] && <p className="api-group-text">{apiGroups[group.tag]?.text}</p>}
      {group.endpoints.map((endpoint) => (
        <ApiEndpointSection key={endpoint.id} endpoint={endpoint} base={base} />
      ))}
    </section>
  );
}

/** Goes to the endpoint or group the address names once the schema has loaded, as a link to it expects. */
function useScrollToHash(ready: boolean) {
  useEffect(() => {
    if (!ready || !window.location.hash) return;
    document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
  }, [ready]);
}

/** Every endpoint the API's schema describes, in one page: a sidebar to jump between them, and each one fully shown. */
export interface ApiReferenceViewProps {
  location: string;
  /** The public API's address, which Getting started names wherever the page is served. */
  publicApi: string;
}

export function ApiReferenceView({ location, publicApi }: ApiReferenceViewProps) {
  const api = useHumanbase();
  const reference = useApiReference();
  const [words, setWords] = useState('');
  useScrollToHash(reference.isSuccess);
  const base = api.apiReference.base;
  const groups = reference.data?.filter(words) ?? [];

  const nav: DocsNavGroup[] = groups.map((group) => ({
    label: apiGroupLabel(group.tag),
    items: group.endpoints.map((endpoint) => ({ label: endpoint.title, href: `#${endpoint.id}` })),
  }));
  const sections = [{ id: startId, title: 'Getting started', level: 2 }, ...groups.map((group) => ({ id: group.tag, title: apiGroupLabel(group.tag), level: 2 }))];
  const filter = <TextInput label="Filter endpoints" type="search" size="small" placeholder="For example, genes or POST" value={words} onChange={(event) => setWords(event.target.value)} />;

  let content;
  if (reference.isPending) content = <Skeleton width="100%" height="480px" />;
  else if (reference.isError) {
    content = (
      <Alert tone="error" title="The API’s description couldn’t be loaded" action={{ label: 'Try again', onSelect: () => void reference.refetch() }}>
        Humanbase’s API didn’t answer. The reference is read from it, so it shows once the API is back.
      </Alert>
    );
  } else {
    content = (
      <>
        <section id={startId} className="api-start" aria-labelledby={`${startId}-heading`}>
          <h2 id={`${startId}-heading`}>Getting started</h2>
          <p>The Humanbase API gives code the same data and analyses as this site: genes, networks, functional modules, variant effect predictions and more. It is a REST API that answers in JSON.</p>
          <dl className="api-facts">
            <div>
              <dt>Address</dt>
              <dd>
                <InlineCode wrap>{`${publicApi}/`}</InlineCode>
              </dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>JSON. Send an Accept: application/json header.</dd>
            </div>
            <div>
              <dt>Sign-in</dt>
              <dd>None. Every endpoint is open.</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>
                {reference.data.version}, described in OpenAPI at <a href={`${publicApi}/schema/`}>{`${publicApi}/schema/`}</a>
                {reference.data.license && `, ${reference.data.license} license`}
              </dd>
            </div>
          </dl>
          <p>Each endpoint below lists its parameters, request body and responses. Open Try it to send a request from this page, starting from the API’s examples, and copy the same request as a curl command.</p>
          {api.examplesOnly && (
            <Alert tone="info" title="The API is off">
              This reference comes from a recorded copy of the API’s description. Try it answers only requests that have recorded sample data.
            </Alert>
          )}
        </section>
        {groups.length ? (
          groups.map((group) => <Group key={group.tag} group={group} base={base} />)
        ) : (
          <Alert tone="info" title={`No endpoint matches “${words}”`}>
            Try a group, such as genes, a method, such as POST, or part of a path.
          </Alert>
        )}
      </>
    );
  }

  return (
    <DocsLayout
      nav={<DocsNav label="Endpoints" groups={nav} search={filter} />}
      breadcrumbs={<Breadcrumbs items={[{ label: 'Humanbase API' }]} />}
      title="Humanbase API"
      sections={reference.isSuccess ? sections : []}
      location={location}
      menuTitle="Endpoints"
    >
      {content}
    </DocsLayout>
  );
}
