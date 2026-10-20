import { dataVersionNames, type DataVersion, type GeneHit } from '@humanbase/data';
import { Alert } from '@humanbase/ui';

export const genesWord = (count: number) => (count === 1 ? '1 gene' : `${count} genes`);
export const listText = (items: readonly string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);

export interface OutsideVersionAlertProps {
  /** Matched genes that aren't in the chosen data version. */
  outside: readonly GeneHit[];
  version: DataVersion;
  /** How many genes will run. */
  runnable: number;
  onRemove: () => void;
}

const reason = (gene: GeneHit, version: DataVersion) =>
  gene.isInAnyNetwork
    ? `${gene.symbol} is not in ${dataVersionNames[version]} networks, so it will not be included in this query. Switch to ${dataVersionNames[version === 'v1' ? 'v3' : 'v1']} to include it.`
    : `${gene.symbol} is a recognized gene, but it is not part of any Humanbase network, so it will not be included in this query.`;

/** Names the genes a query will leave out because they aren't in the chosen data version. */
export function OutsideVersionAlert({ outside, version, runnable, onRemove }: OutsideVersionAlertProps) {
  if (outside.length === 0) return null;
  return (
    <Alert tone="warning" title={`${genesWord(runnable)} will be analyzed in ${dataVersionNames[version]}`} action={{ label: `Remove ${listText(outside.map((gene) => gene.symbol))} from the list`, onSelect: onRemove }}>
      {outside.map((gene) => (
        <p key={gene.entrez}>{reason(gene, version)}</p>
      ))}
    </Alert>
  );
}
