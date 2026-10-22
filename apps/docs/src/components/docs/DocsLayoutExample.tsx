import { docsLibrary } from '@humanbase/hb';
import { Breadcrumbs, DocsLayout, DocsMarkdown, DocsNav, OnThisPage, SearchField, type DocsNavGroup } from '@humanbase/ui';

const example = docsLibrary.page('in-silico-mutagenesis');
const sei = docsLibrary.page('sei');

/** The In silico mutagenesis docs page in the narrow layout, as it shows below 1200px. */
export function DocsLayoutExample() {
  if (!example) return null;
  return (
    <DocsLayout
      nav={<DocsNav groups={docsLibrary.navGroups(example)} />}
      breadcrumbs={<Breadcrumbs items={docsLibrary.breadcrumbs(example)} />}
      title={example.title}
      titleLevel={2}
      sections={example.sections}
      narrow
    >
      <DocsMarkdown markdown={example.markdown} images={example.images} />
    </DocsLayout>
  );
}

/** The sidebar as it opens on the Sei page, with the search field in its slot. */
export function DocsNavExample() {
  return <DocsNav groups={docsLibrary.navGroups(sei)} search={<SearchField label="Search the docs" placeholder="Search the docs" size="medium" />} />;
}

const stateGroups: Record<'Default' | 'Hover' | 'Focus' | 'Current' | 'Parent', DocsNavGroup> = {
  Default: { label: 'Default', items: [{ label: 'Seqweaver', href: '/docs/seqweaver/' }] },
  Hover: { label: 'Hover', items: [{ label: 'Seqweaver', href: '/docs/seqweaver/', 'data-state': 'hover' }] },
  Focus: { label: 'Focus', items: [{ label: 'Seqweaver', href: '/docs/seqweaver/', 'data-state': 'focus' }] },
  Current: { label: 'Current page', items: [{ label: 'Seqweaver', href: '/docs/seqweaver/', current: 'page' }] },
  Parent: { label: 'Parent of the page', items: [{ label: 'Use cases', href: '/docs/use-cases/', current: 'true' }] },
};

export function DocsNavItemState({ state }: { state: 'Default' | 'Hover' | 'Focus' | 'Current' | 'Parent' }) {
  const group = stateGroups[state];
  return <DocsNav groups={[group]} />;
}

/** On this page for Sei, with Output marked as the section being read. */
export function OnThisPageExample() {
  return sei ? <OnThisPage sections={sei.sections} current="output" /> : null;
}
