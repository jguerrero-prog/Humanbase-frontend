import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';
import type { GeneMatchList } from '../GeneMatch/GeneMatchList';
import { SearchField, type SearchSuggestion } from '../SearchField/SearchField';
import { Cell, HeaderCell, Table } from '../Table/Table';
import { RemoveButton } from '../Tag/Tag';
import './Results.css';

export interface EditGenesDialogProps {
  list: GeneMatchList;
  open?: boolean;
  inline?: boolean;
  suggestions?: readonly SearchSuggestion[];
  onAdd?: (suggestion: SearchSuggestion) => void;
  onRemove?: (id: string) => void;
  onDownload?: () => void;
  onClose?: () => void;
  onUpdate?: () => void;
}

export function EditGenesDialog({ list, open, inline, suggestions = [], onAdd, onRemove, onDownload, onClose, onUpdate }: EditGenesDialogProps) {
  const lastGene = list.matches.length <= 1;
  return (
    <Dialog
      title="Edit genes"
      kind="form"
      size="medium"
      {...(open === undefined ? {} : { open })}
      {...(inline === undefined ? {} : { inline })}
      {...(onClose ? { onClose } : {})}
      actions={
        <>
          <Button variant="ghost" className="edit-genes-download" onClick={onDownload}>
            Download gene list
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onUpdate}>Update results</Button>
        </>
      }
    >
      <div className="edit-genes">
        <SearchField label="Add a gene" placeholder="Add a gene by symbol, name or ID" size="medium" suggestions={suggestions} {...(onAdd ? { onSuggestionSelect: onAdd } : {})} />
        <p className="result-detail-text">Try BRCA1, PTEN or a disease such as autism to add its genes.</p>
        <Table caption="Genes in this query" showCaption density="compact" columnWidths={['auto', '96px', '110px', '56px']}>
          <thead>
            <tr>
              <HeaderCell>Gene</HeaderCell>
              <HeaderCell>Entrez ID</HeaderCell>
              <HeaderCell>You typed</HeaderCell>
              <HeaderCell>
                <span className="visually-hidden">Remove</span>
              </HeaderCell>
            </tr>
          </thead>
          <tbody>
            {list.matches.map((match) => {
              const gene = list.gene(match);
              return (
                <tr key={match.id}>
                  <Cell rowHeader>
                    <span className="result-gene">
                      <strong>{gene?.symbol ?? match.id}</strong>
                      {gene?.name && <span>{gene.name}</span>}
                      {gene?.aliases && <span>Also known as {gene.aliases.join(', ')}</span>}
                    </span>
                  </Cell>
                  <Cell type="id">{gene?.entrez ?? 'None'}</Cell>
                  <Cell>{match.typed.join(', ')}</Cell>
                  <Cell>{!lastGene && <RemoveButton aria-label={`Remove ${gene?.symbol ?? match.id}`} onClick={() => onRemove?.(match.id)} />}</Cell>
                </tr>
              );
            })}
          </tbody>
        </Table>
        {lastGene && <p className="result-detail-text">The last gene can’t be removed; to start a different search, use the search in the top bar.</p>}
      </div>
    </Dialog>
  );
}
