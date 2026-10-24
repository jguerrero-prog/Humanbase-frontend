import { productCategories, seiHgmd, sequenceToolModels } from '@humanbase/hb';
import { Cell, HeaderCell, Table, useLinkHref } from '@humanbase/ui';
import './ToolPage.css';

/** "A gene, an rsID or Variants (VCF)": the site's lists take no serial comma. */
function either(items: readonly string[]): string {
  const text = items.length > 1 ? `${items.slice(0, -1).join(', ')} or ${items.at(-1)}` : (items[0] ?? '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Where Compare them and the Variants & sequences breadcrumb lead: each model's predictions, input and reach side by side. */
export function SequenceToolsPage() {
  const linkHref = useLinkHref();
  return (
    <section className="page-section tool-page">
      <title>{`${productCategories.variants} · Humanbase`}</title>
      <header className="tool-page-title">
        <h1>{productCategories.variants}</h1>
        <p>Not sure which tool to use? Compare what each one predicts, what you submit and what can be scored.</p>
      </header>
      <Table caption="Variant and sequence tools compared" minWidth="960px" columnWidths={['14%', '16%', '30%', '18%', '22%']} pinFirstColumn>
        <thead>
          <tr>
            <HeaderCell>Model</HeaderCell>
            <HeaderCell>Tool</HeaderCell>
            <HeaderCell>Predicts</HeaderCell>
            <HeaderCell>You submit</HeaderCell>
            <HeaderCell>What can be scored</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {sequenceToolModels.map((model) => (
            <tr key={model.name}>
              <Cell rowHeader wrap>
                <a href={linkHref(model.href)}>{model.name}</a>
              </Cell>
              <Cell wrap>
                <a href={linkHref(model.tool.href)}>{model.tool.label}</a>
              </Cell>
              <Cell wrap>{model.predicts}</Cell>
              <Cell wrap>{either(model.submit)}</Cell>
              <Cell wrap>{model.scored}</Cell>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="tool-page-note">
        Want to see a model on known disease variants first? Explore <a href={linkHref(seiHgmd.href)}>{seiHgmd.description}</a>.
      </p>
    </section>
  );
}
