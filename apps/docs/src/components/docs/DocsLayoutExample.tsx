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

type ItemState = 'Default' | 'Hover' | 'Focus' | 'Current' | 'Parent' | 'Collapsed' | 'Expanded';

const seqweaverSections = [
  { label: 'Introduction', href: '/docs/seqweaver/#introduction', id: 'state-introduction' },
  { label: 'Input', href: '/docs/seqweaver/#input', id: 'state-input' },
  { label: 'Output', href: '/docs/seqweaver/#output', id: 'state-output' },
];

const stateGroups: Record<ItemState, DocsNavGroup> = {
  Default: { label: 'Default', items: [{ label: 'Seqweaver', href: '/docs/seqweaver/' }] },
  Hover: { label: 'Hover', items: [{ label: 'Seqweaver', href: '/docs/seqweaver/', 'data-state': 'hover' }] },
  Focus: { label: 'Focus', items: [{ label: 'Seqweaver', href: '/docs/seqweaver/', 'data-state': 'focus' }] },
  Current: { label: 'Current page', items: [{ label: 'Seqweaver', href: '/docs/seqweaver/', current: 'page' }] },
  Parent: {
    label: 'Parent of the page',
    items: [{ label: 'Use cases', href: '/docs/use-cases/', current: 'true', sections: [{ label: 'Tutorials', href: '/docs/use-cases/#tutorials' }, { label: 'Sei use case', href: '/docs/use-cases/sei-use-case/', level: 2, current: true }] }],
  },
  Collapsed: { label: 'Toggle collapsed', items: [{ label: 'Seqweaver', href: '/docs/seqweaver/', sections: seqweaverSections }] },
  Expanded: { label: 'Toggle expanded, first section current', items: [{ label: 'Seqweaver', href: '/docs/seqweaver/', current: 'page', sections: seqweaverSections }] },
};

export function DocsNavItemState({ state }: { state: ItemState }) {
  const group = stateGroups[state];
  return <DocsNav groups={[group]} />;
}

/** On this page for Sei, with Output marked as the section being read. */
export function OnThisPageExample() {
  return sei ? <OnThisPage sections={sei.sections} current="output" /> : null;
}
