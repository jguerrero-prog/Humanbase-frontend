import { EmptyState } from '@humanbase/ui';

// Old /asd/ links land here while the ASD Browser is retired.
export function AsdRetiredPage() {
  return (
    <section className="page-section">
      <title>ASD Browser · Humanbase</title>
      <h1 className="visually-hidden">ASD Browser</h1>
      <EmptyState
        title="The ASD Browser is retired"
        text="For autism genetics data, visit SFARI Base."
        actions={
          <a className="button button-secondary button-small" href="https://base.sfari.org">
            Go to SFARI Base
          </a>
        }
      />
    </section>
  );
}
