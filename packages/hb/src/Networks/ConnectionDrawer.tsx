import { sentenceCase, useConnectionEvidence, useConnectionInAllNetworks, type DataVersion, type NetworkGene } from '@humanbase/data';
import { Alert, Button, Drawer, DrawerSection, EvidenceTable, NetworkWeightTable, ScoreMeter, SearchField, SegmentedControl, Skeleton, WeightHistogram } from '@humanbase/ui';
import { useMemo, useState } from 'react';

export interface ConnectionDrawerProps {
  source: NetworkGene;
  target: NetworkGene;
  /** The connection's weight in the network on screen. */
  weight: number;
  slug: string;
  version: DataVersion;
  networkTitle: string;
  onClose: () => void;
}

const firstDatasets = 10;
const bins = 10;

export function ConnectionDrawer({ source, target, weight, slug, version, networkTitle, onClose }: ConnectionDrawerProps) {
  const [view, setView] = useState<'this' | 'all'>('this');
  const [allDatasets, setAllDatasets] = useState(false);
  const [filter, setFilter] = useState('');
  const pair = `${source.symbol} and ${target.symbol}`;
  const evidence = useConnectionEvidence(slug, source.entrez, target.entrez);
  const elsewhere = useConnectionInAllNetworks(source.entrez, target.entrez, view === 'all');
  const networkName = sentenceCase(networkTitle);

  const networks = useMemo(() => (elsewhere.data ?? []).filter((item) => item.network.version === version), [elsewhere.data, version]);
  const histogram = useMemo(() => {
    const counts = Array.from({ length: bins }, () => 0);
    for (const item of networks) {
      const bin = Math.min(bins - 1, Math.floor(item.weight * bins));
      counts[bin] = (counts[bin] ?? 0) + 1;
    }
    return counts;
  }, [networks]);
  const term = filter.trim().toLowerCase();
  const rows = networks.filter((item) => !term || item.network.title.toLowerCase().includes(term)).map((item) => ({ network: item.network.name, weight: item.weight }));
  const datasets = evidence.data?.datasets ?? [];

  return (
    <Drawer open title={pair} subtitle={view === 'this' ? `Connection in the ${networkTitle} network` : 'Connection across all networks'} onClose={onClose}>
      <SegmentedControl
        label="Connection view"
        hideLabel
        size="small"
        segments={[
          { value: 'this', label: networkName },
          { value: 'all', label: 'All networks' },
        ]}
        value={view}
        onChange={(value) => setView(value === 'all' ? 'all' : 'this')}
      />
      {view === 'this' ? (
        <>
          <ScoreMeter label="Connection weight" value={weight} text={`How likely ${pair} are to work together in the ${networkTitle} network, from all the evidence combined.`} />
          {evidence.isError ? (
            <Alert tone="error" title="The evidence couldn’t load" action={{ label: 'Try again', onSelect: () => void evidence.refetch() }}>
              The connection weight above is still correct.
            </Alert>
          ) : !evidence.data ? (
            <DrawerSection label="Evidence by dataset">
              <p className="result-detail-text" aria-busy="true">
                <Skeleton width="90%" />
              </p>
            </DrawerSection>
          ) : (
            <>
              <DrawerSection label="Data types">
                <p className="result-detail-text">{evidence.data.dataTypes.join(', ')}</p>
              </DrawerSection>
              <EvidenceTable
                rows={(allDatasets ? datasets : datasets.slice(0, firstDatasets)).map(({ title, dataType, contribution }) => ({ dataset: title, dataType, contribution }))}
                note="Contribution is how much one dataset raises the chance of this connection on its own, so contributions don’t add up to the weight."
              />
              {datasets.length > firstDatasets && (
                <Button variant="ghost" size="small" onClick={() => setAllDatasets(!allDatasets)}>
                  {allDatasets ? `Show the first ${firstDatasets} datasets` : `Show all ${datasets.length} datasets`}
                </Button>
              )}
            </>
          )}
        </>
      ) : elsewhere.isError ? (
        <Alert tone="error" title="The other networks couldn’t load" action={{ label: 'Try again', onSelect: () => void elsewhere.refetch() }}>
          Check your connection, then try again.
        </Alert>
      ) : !elsewhere.data ? (
        <p className="result-detail-text" aria-busy="true">
          <Skeleton width="90%" />
        </p>
      ) : (
        <>
          <DrawerSection label="Connection weight in each network">
            <WeightHistogram counts={histogram} current={weight} caption={`Number of networks at each weight. The dark bar holds the network you are viewing: ${networkName}, ${weight.toFixed(2)}.`} />
          </DrawerSection>
          <DrawerSection label="Networks, strongest first">
            <SearchField label="Filter networks" placeholder="Filter networks" size="medium" value={filter} onChange={(event) => setFilter(event.target.value)} onClear={() => setFilter('')} />
            <NetworkWeightTable rows={rows} />
          </DrawerSection>
        </>
      )}
    </Drawer>
  );
}
