import { Button } from '../Button/Button';
import { Cell, HeaderCell, Table } from '../Table/Table';
import { variantLabel, variantLocation, variantName, type Variant, type VariantScore } from './Variant';
import './VariantEffects.css';

export interface VariantsTableProps {
  variants: readonly Variant[];
  scores: readonly VariantScore[];
  /** The score the rows are sorted by, highest first. */
  sortBy: string;
  selected?: string | undefined;
  onSelect?: ((id: string) => void) | undefined;
  /** Rows shown before Show all. */
  limit?: number | undefined;
  onShowAll?: (() => void) | undefined;
}

export function VariantsTable({ variants, scores, sortBy, selected, onSelect, limit, onShowAll }: VariantsTableProps) {
  const sorted = [...variants].sort((a, b) => (b.scores[sortBy] ?? 0) - (a.scores[sortBy] ?? 0));
  const shown = limit === undefined ? sorted : sorted.slice(0, limit);
  return (
    <div className="variants-table">
      <Table caption="Variants in this job" density="compact" columnWidths={['auto', ...scores.map(() => '104px')]}>
        <thead>
          <tr>
            <HeaderCell>Variant</HeaderCell>
            {scores.map((score) => (
              <HeaderCell key={score.key} align="end" sort={score.key === sortBy ? 'descending' : 'none'}>
                {score.label}
              </HeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((variant) => {
            const isSelected = variant.id === selected;
            return (
              <tr key={variant.id} className="variants-table-row" data-selected={isSelected || undefined}>
                <Cell rowHeader>
                  <button type="button" className="variants-table-pick" aria-pressed={isSelected} aria-label={`${variantLabel(variant)}, ${variantName(variant)}`} onClick={() => onSelect?.(variant.id)}>
                    <span className="variants-table-location">
                      {variantLocation(variant)} <span className="variants-table-change">{variant.change}</span>
                    </span>
                    <span className="variants-table-name">{variantName(variant)}</span>
                  </button>
                </Cell>
                {scores.map((score) => (
                  <Cell key={score.key} type="number">
                    {(variant.scores[score.key] ?? 0).toFixed(2)}
                  </Cell>
                ))}
              </tr>
            );
          })}
        </tbody>
      </Table>
      {shown.length < sorted.length && (
        <Button variant="ghost" size="small" onClick={onShowAll}>
          Show all {sorted.length}
        </Button>
      )}
    </div>
  );
}
