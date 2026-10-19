import { EmptyState, useLinkHref } from '@humanbase/ui';

export function NotFoundPage() {
  const linkHref = useLinkHref();
  return (
    <section className="page-section">
      <title>Page not found · Humanbase</title>
      <h1 className="visually-hidden">Page not found</h1>
      <EmptyState
        icon="help-circle"
        title="This page isn’t here yet"
        text="The redesigned Humanbase is being built one tool at a time. Start from the homepage to search a gene."
        actions={
          <a className="button button-primary button-medium" href={linkHref('/')}>
            Go to the homepage
          </a>
        }
      />
    </section>
  );
}
