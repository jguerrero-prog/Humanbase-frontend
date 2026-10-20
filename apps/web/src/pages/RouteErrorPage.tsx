import { EmptyState, useLinkHref } from '@humanbase/ui';
import { isRouteErrorResponse, useRouteError } from 'react-router';

// Browsers word a failed dynamic import differently; all mean the page's code couldn't be fetched.
const staleCode = /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

/** Shown when a page throws or its code can't load, so the rest of Humanbase stays usable. */
export function RouteErrorPage() {
  const error = useRouteError();
  const linkHref = useLinkHref();
  const reload = () => window.location.reload();
  const outdated = error instanceof Error && staleCode.test(error.message);
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  const title = outdated ? 'This page needs a refresh' : notFound ? 'This page isn’t here' : 'Something went wrong on this page';
  const text = outdated
    ? 'Humanbase was updated since you opened it. Reloading gets the new version; your genes and jobs stay as they are.'
    : 'The rest of Humanbase still works. Try again, or start from the homepage.';

  return (
    <section className="page-section">
      <title>{`${title} · Humanbase`}</title>
      <h1 className="visually-hidden">{title}</h1>
      <div role="alert">
        <EmptyState
          icon="alert-circle"
          title={title}
          text={text}
          actions={
            <>
              <button type="button" className="button button-primary button-medium" onClick={reload}>
                {outdated ? 'Reload the page' : 'Try again'}
              </button>
              <a className="button button-ghost button-medium" href={linkHref('/')}>
                Go to the homepage
              </a>
            </>
          }
        />
      </div>
    </section>
  );
}
