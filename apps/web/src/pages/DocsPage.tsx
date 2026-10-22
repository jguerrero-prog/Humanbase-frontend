import { DocsSearch, docsLibrary } from '@humanbase/hb';
import { Breadcrumbs, DocsLayout, DocsMarkdown, DocsNav } from '@humanbase/ui';
import { useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { useRouterLinks } from '../layout/useRouterLinks';
import { NotFoundPage } from './NotFoundPage';

/** Scrolls to the address's section, or to the top of a newly opened page, and moves focus there after the first load. */
function useScrollOnNavigate(pathname: string, hash: string): void {
  const firstLoad = useRef(true);
  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
    if (!firstLoad.current && !target) document.getElementById('main')?.focus({ preventScroll: true });
    firstLoad.current = false;
  }, [pathname, hash]);
}

export function DocsPage() {
  const path = useParams()['*'] ?? '';
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const root = useRef<HTMLDivElement>(null);
  useRouterLinks(root, '/docs/');
  useScrollOnNavigate(pathname, hash);

  const legacy = docsLibrary.legacyRoute(path);
  if (legacy) return <Navigate to={legacy + hash} replace />;
  const page = docsLibrary.page(path);
  if (!page) return <NotFoundPage />;
  return (
    <div ref={root}>
      <title>{`${page.title} · Docs · Humanbase`}</title>
      <DocsLayout
        nav={<DocsNav groups={docsLibrary.navGroups(page)} search={<DocsSearch onOpen={(href) => void navigate(href)} />} />}
        breadcrumbs={<Breadcrumbs items={docsLibrary.breadcrumbs(page)} />}
        title={page.title}
        {...(page.sections[0] && { titleId: page.sections[0].id })}
        sections={page.sections}
        location={pathname + hash}
      >
        <DocsMarkdown markdown={page.markdown} images={page.images} />
      </DocsLayout>
    </div>
  );
}
