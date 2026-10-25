import { useState, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { useControlled } from '../hooks/useControlled';
import { Icon, type IconName } from '../Icon/Icon';
import { RadioGroup } from '../RadioGroup/RadioGroup';
import { SearchField, type SearchSuggestion } from '../SearchField/SearchField';
import { Cell, HeaderCell, SelectAllCell, SelectCell, SelectionBar, Table, useRowSelection } from '../Table/Table';
import { RemoveButton } from '../Tag/Tag';
import { GeneMatchList, statusLabels, type GeneCandidate, type GeneMatch, type MatchStatus } from './GeneMatchList';
import './GeneMatch.css';

const statusIcons: Record<MatchStatus, IconName> = { matched: 'check-circle', alias: 'check-circle', choose: 'alert-triangle', 'not-found': 'alert-circle' };

export interface GeneMatchEdit {
  id: string;
  query: string;
  suggestions: readonly SearchSuggestion[];
  onQueryChange?: (query: string) => void;
  onSelect?: (suggestion: SearchSuggestion) => void;
  onCancel?: () => void;
}

export interface GeneMatchTableProps {
  list: GeneMatchList;
  caption?: string;
  selectable?: boolean;
  defaultSelected?: readonly string[];
  visibleProblems?: number;
  foldMatched?: boolean;
  matchedExpanded?: boolean;
  minimum?: { count: number; reason: string };
  editing?: GeneMatchEdit | undefined;
  onChoose?: (id: string, entrez: string) => void;
  onEdit?: (id: string) => void;
  onRemove?: (ids: string[]) => void;
}

export function GeneMatchTable({
  list, caption = 'How your genes matched', selectable = false, defaultSelected = [], visibleProblems = Infinity, foldMatched = false, matchedExpanded,
  minimum, editing, onChoose, onEdit, onRemove,
}: GeneMatchTableProps) {
  const rows = list.ordered;
  const selection = useRowSelection(rows.map((match) => match.id), defaultSelected);
  const [showAllProblems, setShowAllProblems] = useState(false);
  const [expanded, setExpanded] = useControlled(matchedExpanded, false);
  const columns = selectable ? 6 : 5;

  const problems = list.problems;
  const shownProblems = showAllProblems ? problems : problems.slice(0, visibleProblems);
  const hiddenProblems = problems.slice(shownProblems.length);
  const resolved = list.resolved;
  const selectedMatches = rows.filter((match) => selection.isSelected(match.id));
  const tooFew = minimum !== undefined && list.runnable - selectedMatches.length < minimum.count;

  const row = (match: GeneMatch) =>
    editing?.id === match.id ? (
      <EditRow key={match.id} match={match} edit={editing} columns={columns} />
    ) : (
      <MatchRow
        key={match.id}
        list={list}
        match={match}
        select={selectable ? { checked: selection.isSelected(match.id), onToggle: () => selection.toggle(match.id) } : undefined}
        onChoose={onChoose}
        onEdit={onEdit}
        onRemove={onRemove && (() => onRemove([match.id]))}
      />
    );

  return (
    <div className="gene-match">
      {selectable && selection.count > 0 && (
        <SelectionBar label={`${GeneMatchList.pluralGenes(selection.count)} selected: ${selectedMatches.map((match) => list.gene(match)?.symbol ?? match.typed[0]).join(', ')}`}>
          {tooFew && <span className="gene-match-reason">{minimum.reason}</span>}
          <Button variant="ghost" size="small" icon="trash" disabled={tooFew} onClick={() => onRemove?.(selectedMatches.map((match) => match.id))}>
            Remove from list
          </Button>
          <Button variant="ghost" size="small" icon="x" onClick={selection.clear}>
            Clear selection
          </Button>
        </SelectionBar>
      )}
      <Table caption={caption} columnWidths={[...(selectable ? ['56px'] : []), '200px', 'auto', '140px', '200px', '140px']} minWidth={selectable ? '1016px' : '960px'} pinFirstColumn={!selectable}>
        <thead>
          <tr>
            {selectable && <SelectAllCell label="Select all genes shown" state={selection.state} onToggle={selection.toggleAll} />}
            <HeaderCell>You typed</HeaderCell>
            <HeaderCell>Gene</HeaderCell>
            <HeaderCell>Entrez ID</HeaderCell>
            <HeaderCell>Status</HeaderCell>
            <HeaderCell>
              <span className="visually-hidden">Actions</span>
            </HeaderCell>
          </tr>
        </thead>
        <tbody>
          {shownProblems.map(row)}
          {hiddenProblems.length > 0 && (
            <FoldRow columns={columns} action={<Button variant="ghost" size="small" onClick={() => setShowAllProblems(true)}>{`Show ${hiddenProblems.length} more`}</Button>}>
              <span>{`${hiddenProblems.length} more to check: ${joinWords(hiddenProblems.map((match) => match.typed[0] ?? ''))}`}</span>
            </FoldRow>
          )}
          {foldMatched && resolved.length > 0 && (
            <FoldRow
              columns={columns}
              folded
              action={<Button variant="ghost" size="small" onClick={() => setExpanded(!expanded)}>{expanded ? 'Collapse' : `Show all ${resolved.length}`}</Button>}
            >
              <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={16} />
              <strong>{`${resolved.length} matched genes`}</strong>
              <span>{expanded ? 'Matched to one gene each. Sorted as you pasted them.' : preview(resolved.map((match) => list.gene(match)?.symbol ?? ''))}</span>
            </FoldRow>
          )}
          {(!foldMatched || expanded) && resolved.map(row)}
        </tbody>
      </Table>
    </div>
  );
}

interface MatchRowProps {
  list: GeneMatchList;
  match: GeneMatch;
  select: { checked: boolean; onToggle: () => void } | undefined;
  onChoose: ((id: string, entrez: string) => void) | undefined;
  onEdit: ((id: string) => void) | undefined;
  onRemove: (() => void) | undefined;
}

function MatchRow({ list, match, select, onChoose, onEdit, onRemove }: MatchRowProps) {
  const term = match.typed.join(', ');
  const gene = list.gene(match);
  return (
    <tr className="gene-match-row">
      {select && <SelectCell label={`Select ${term}`} checked={select.checked} onToggle={select.onToggle} />}
      <Cell rowHeader className="gene-match-term">
        {match.edited ? `${term}, edited` : term}
      </Cell>
      <Cell className="gene-match-gene" wrap>
        {match.status === 'not-found' && 'No gene matches this term'}
        {match.status === 'choose' && (
          <RadioGroup
            legend={`Gene for ${term}`}
            hideLegend
            {...(gene && { hint: `Using ${gene.symbol}. Pick another gene to change it.` })}
            defaultValue={gene?.entrez ?? ''}
            onChange={(entrez) => onChoose?.(match.id, entrez)}
            options={match.candidates.map((candidate) => ({ value: candidate.entrez, label: `${candidate.symbol}, ${candidate.name}`, description: candidateDetails(candidate) }))}
          />
        )}
        {(match.status === 'matched' || match.status === 'alias') && gene && <GeneSummary gene={gene} alias={match.status === 'alias' ? match.matchedAlias : undefined} />}
      </Cell>
      <Cell type={match.status === 'choose' || match.status === 'not-found' ? 'text' : 'id'}>
        {match.status === 'not-found' ? 'None' : match.status === 'choose' ? `${match.candidates.length} genes` : gene?.entrez}
      </Cell>
      <Cell>
        <span className="gene-match-status" data-status={match.status}>
          <Icon name={statusIcons[match.status]} size={16} />
          {statusLabels[match.status]}
        </span>
      </Cell>
      <Cell className="gene-match-actions">
        {match.status === 'not-found' && onEdit && (
          <Button variant="ghost" size="small" onClick={() => onEdit(match.id)}>
            Edit
          </Button>
        )}
        {onRemove && <RemoveButton aria-label={`Remove ${term}`} onClick={onRemove} />}
      </Cell>
    </tr>
  );
}

function EditRow({ match, edit, columns }: { match: GeneMatch; edit: GeneMatchEdit; columns: number }) {
  const term = match.typed.join(', ');
  return (
    <tr className="gene-match-row">
      <td colSpan={columns} className="table-cell">
        <div className="gene-match-edit">
          <SearchField
            label={`Gene for ${term}`}
            size="medium"
            value={edit.query}
            onChange={(event) => edit.onQueryChange?.(event.target.value)}
            suggestions={edit.suggestions}
            onSuggestionSelect={(suggestion) => edit.onSelect?.(suggestion)}
            note="Pick a gene to rematch this row only."
            open
            inlineSuggestions
            defaultHighlight={0}
          />
          <Button variant="ghost" size="small" onClick={edit.onCancel}>
            Cancel
          </Button>
        </div>
      </td>
    </tr>
  );
}

function FoldRow({ columns, folded = false, action, children }: { columns: number; folded?: boolean; action: ReactNode; children: ReactNode }) {
  return (
    <tr className="gene-match-fold" data-folded={folded || undefined}>
      <td colSpan={columns} className="table-cell">
        <div className="gene-match-fold-inner">
          <span className="gene-match-fold-text">{children}</span>
          {action}
        </div>
      </td>
    </tr>
  );
}

function GeneSummary({ gene, alias }: { gene: GeneCandidate; alias: string | undefined }) {
  return (
    <span className="gene-match-summary">
      <strong>{gene.symbol}</strong>
      <span>{gene.name}</span>
      {alias && gene.aliases && (
        <span>
          Also known as{' '}
          {gene.aliases.map((name, index) => (
            <span key={name}>
              {index > 0 && ', '}
              {name === alias ? <strong className="gene-match-alias">{name}</strong> : name}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

const candidateDetails = (gene: GeneCandidate) => `Entrez ${gene.entrez}${gene.aliases?.length ? `. Also known as ${gene.aliases.join(', ')}` : ''}`;

const joinWords = (words: readonly string[]) => (words.length < 2 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`);

const preview = (symbols: readonly string[], shown = 6) =>
  symbols.length <= shown ? joinWords(symbols) : `${symbols.slice(0, shown).join(', ')} and ${symbols.length - shown} more`;
