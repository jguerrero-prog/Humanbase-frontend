import { GeneSearchService, useGeneListMatches } from '@humanbase/data';
import { Button, Dialog, GeneList, GeneMatchList, GeneMatchTable, Icon, useDebounced } from '@humanbase/ui';
import { useId, useMemo, useState } from 'react';
import { matchOf } from '../HomeSearch/geneMatches';

export interface EditGenesDialogProps {
  open: boolean;
  /** The query genes as they are now, in order. */
  symbols: readonly string[];
  onClose: () => void;
  onApply: (entrez: number[]) => void;
}

const genesWord = (count: number) => (count === 1 ? '1 gene' : `${count} genes`);

// Keyed on open so each opening starts from the genes on screen.
export function EditGenesDialog(props: EditGenesDialogProps) {
  return <EditGenesForm key={String(props.open)} {...props} />;
}

function EditGenesForm({ open, symbols, onClose, onApply }: EditGenesDialogProps) {
  const formId = useId();
  const [text, setText] = useState(() => symbols.join('\n'));
  const [chosen, setChosen] = useState<ReadonlyMap<string, string>>(new Map());
  const settled = useDebounced(text, 400);
  const terms = useMemo(() => GeneSearchService.terms(settled), [settled]);
  const matches = useGeneListMatches(terms);
  const pending = settled !== text || matches.isFetching;

  const list = useMemo(() => {
    const base = new GeneMatchList((matches.data ?? []).map(matchOf));
    return [...chosen].reduce((next, [id, entrez]) => (next.matches.some((match) => match.id === id) ? next.choose(id, entrez) : next), base);
  }, [matches.data, chosen]);
  const resolved = list.matches.filter((match) => match.status === 'matched' || match.status === 'alias' || (match.status === 'choose' && match.chosen));
  const entrez = [...new Set(resolved.flatMap((match) => list.gene(match)?.entrez ?? []).map(Number))];
  const showTable = !pending && !matches.isError && list.matches.some((match) => match.status !== 'matched');
  const status: { text: string; tone?: 'success' | 'error' } =
    terms.length === 0
      ? { text: '' }
      : pending
        ? { text: 'Matching genes…' }
        : matches.isError
          ? { text: 'Genes couldn’t be matched right now. Try again in a moment; your list is kept.', tone: 'error' }
          : showTable
            ? { text: list.summary.join('. ') }
            : { text: `${list.matches.length} matched: ${resolved.map((match) => list.gene(match)?.symbol).join(', ')}`, tone: 'success' };

  const removeTerms = (ids: readonly string[]) => {
    const gone = new Set(list.matches.filter((match) => ids.includes(match.id)).flatMap((match) => match.typed.map((term) => term.toLowerCase())));
    setText(GeneSearchService.terms(text).filter((term) => !gone.has(term.toLowerCase())).join('\n'));
  };

  return (
    <Dialog
      title="Edit genes"
      open={open}
      onClose={onClose}
      size="medium"
      kind="form"
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={pending || entrez.length === 0}>
            Show network for {genesWord(entrez.length)}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="edit-genes"
        onSubmit={(event) => {
          event.preventDefault();
          if (!pending && entrez.length > 0) onApply(entrez);
        }}
      >
        <p>Add or remove genes without starting over. The tissue, data types and data version stay the same.</p>
        <GeneList label="Genes" hint="Separate genes with spaces or new lines." value={text} rows={6} onChange={(event) => setText(event.target.value)} />
        <p className="edit-genes-status" role="status" data-tone={status.tone}>
          {status.tone && <Icon name={status.tone === 'success' ? 'check-circle' : 'alert-circle'} size={16} />}
          {status.text}
        </p>
        {showTable && <GeneMatchTable list={list} caption="How your genes matched" onRemove={removeTerms} onChoose={(id, gene) => setChosen(new Map(chosen).set(id, gene))} />}
      </form>
    </Dialog>
  );
}
