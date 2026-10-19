import { IntegrationService, type DataVersion, type Integration } from '@humanbase/data';
import { Select } from '@humanbase/ui';

export interface TissueSelectProps {
  networks: readonly Integration[];
  version: DataVersion;
  /** A tissue slug, or undefined for the global network. */
  value: string | undefined;
  onChange: (tissue: string | undefined) => void;
}

const globalValue = 'global';

export function TissueSelect({ networks, version, value, onChange }: TissueSelectProps) {
  const group = 'All tissues and cell types';
  const options = [
    { value: globalValue, label: 'Global', group },
    ...IntegrationService.pick(networks, 'tissue', version).map((network) => ({ value: network.slug, label: network.title, group })),
  ];
  return (
    <Select
      label="Tissue"
      size="small"
      searchable
      filterLabel="Filter tissues"
      options={options}
      value={value ?? globalValue}
      onChange={(slug) => onChange(slug === globalValue ? undefined : slug)}
    />
  );
}
