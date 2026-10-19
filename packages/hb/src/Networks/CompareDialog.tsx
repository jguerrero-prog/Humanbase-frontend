import type { ComparedNetwork, DataType, DataVersion, Integration } from '@humanbase/data';
import { Button, ContextLabel, Dialog } from '@humanbase/ui';
import { useId, useState } from 'react';
import { DataTypesFilter } from './DataTypesFilter';
import { TissueSelect } from './TissueSelect';

export interface CompareDialogProps {
  open: boolean;
  networks: readonly Integration[];
  version: DataVersion;
  versionName: string;
  /** Query gene symbols, such as ["IL1B", "TNF"]. */
  symbols: readonly string[];
  /** Read as "IL1B and TNF". */
  queryNames: string;
  dataTypes: readonly DataType[];
  onClose: () => void;
  onAdd: (network: ComparedNetwork) => void;
}

// Keyed on open so each opening starts with no tissue chosen.
export function CompareDialog(props: CompareDialogProps) {
  return <CompareForm key={String(props.open)} {...props} />;
}

function CompareForm({ open, networks, version, versionName, symbols, queryNames, dataTypes, onClose, onAdd }: CompareDialogProps) {
  const formId = useId();
  const [tissue, setTissue] = useState<string | undefined | null>(null);
  const [types, setTypes] = useState<string[]>([]);

  return (
    <Dialog
      title="Add a network to compare"
      open={open}
      onClose={onClose}
      size="medium"
      kind="form"
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={tissue === null}>
            Add network
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="compare-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (tissue !== null) onAdd({ tissue, dataTypes: types });
        }}
      >
        <p>Shows {queryNames} in a second network beside this one, with its own tissue and data types.</p>
        <ul className="result-header-context" aria-label="Kept from this network">
          <li>
            <ContextLabel name="Data version" value={versionName} />
          </li>
          <li>
            <ContextLabel name="Genes" value={symbols.join(', ')} />
          </li>
        </ul>
        <div className="compare-form-fields">
          <TissueSelect networks={networks} version={version} value={tissue} size="medium" onChange={setTissue} />
          {dataTypes.length > 0 && <DataTypesFilter types={dataTypes} value={types} size="medium" onChange={setTypes} />}
        </div>
        {dataTypes.length > 0 && <p className="result-note">A new network starts with all {dataTypes.length} data types.</p>}
      </form>
    </Dialog>
  );
}
