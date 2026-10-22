import type { ModuleTerm } from '@humanbase/data';
import { Cell, HeaderCell, Table, ValueFormat } from '@humanbase/ui';

export interface ModuleTermsTableProps {
  terms: readonly ModuleTerm[];
  caption: string;
  genesHeader: string;
  symbolOf: (entrez: number) => string;
  /** A gene left out of each term's genes, such as the gene whose terms these are; its list then counts the rest. */
  without?: number | undefined;
}

const format = new ValueFormat();
const namedGenes = 4;

/** Enriched terms with the first of their genes alphabetically and the q-value, most significant first. */
export function ModuleTermsTable({ terms, caption, genesHeader, symbolOf, without }: ModuleTermsTableProps) {
  return (
    <Table className="module-drawer-table" caption={caption} density="compact" columnWidths={['auto', '136px', '96px']}>
      <thead>
        <tr>
          <HeaderCell>Enriched term</HeaderCell>
          <HeaderCell>{genesHeader}</HeaderCell>
          <HeaderCell align="end" sort="ascending">
            q-value
          </HeaderCell>
        </tr>
      </thead>
      <tbody>
        {terms.map((term) => {
          const q = format.pValue(term.qValue);
          const genes = term.genes.filter((entrez) => entrez !== without).map(symbolOf).sort((a, b) => a.localeCompare(b));
          const named = genes.slice(0, namedGenes).join(', ');
          const more = genes.length - namedGenes;
          const rest = without === undefined ? ' and more' : ` and ${more} more`;
          return (
            <tr key={term.id}>
              <Cell rowHeader wrap>
                {term.title}
              </Cell>
              <Cell wrap>
                <span className="module-muted">{more > 0 ? `${named}${rest}` : named}</span>
              </Cell>
              <Cell type="number">
                <span aria-label={q.spoken}>{q.text}</span>
              </Cell>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
