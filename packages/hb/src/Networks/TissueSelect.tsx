import { IntegrationService, type DataVersion, type Integration } from '@humanbase/data';
import { Select } from '@humanbase/ui';

export interface TissueSelectProps {
  networks: readonly Integration[];
  version: DataVersion;
  /** A tissue slug, undefined for the global network, or null when nothing is chosen yet. */
  value: string | undefined | null;
  onChange: (tissue: string | undefined) => void;
  size?: 'small' | 'medium';
}

const globalValue = 'global';

export function TissueSelect({ networks, version, value, onChange, size = 'small' }: TissueSelectProps) {
  const group = 'All tissues and cell types';
  const options = [
    { value: globalValue, label: 'Global', group },
    ...IntegrationService.pick(networks, 'tissue', version).map((network) => ({ value: network.slug, label: network.title, group })),
  ];
  return (
    <Select
      label="Tissue"
      size={size}
      searchable
      filterLabel="Filter tissues"
      placeholder="Choose a tissue"
      options={options}
      value={value === null ? '' : (value ?? globalValue)}
      onChange={(slug) => onChange(slug === globalValue ? undefined : slug)}
    />
  );
}
