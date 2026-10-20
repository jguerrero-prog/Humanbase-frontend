import { IntegrationService, type Integration } from '@humanbase/data';
import { Select } from '@humanbase/ui';

export interface ProcessSelectProps {
  networks: readonly Integration[];
  value: string | undefined;
  onChange: (process: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Process networks exist for GIANT only, so the list always comes from version 1.
export function ProcessSelect({ networks, value, onChange, open, onOpenChange }: ProcessSelectProps) {
  const group = 'Biological process networks';
  const options = IntegrationService.pick(networks, 'process', 'v1').map((network) => ({ value: network.slug, label: network.name, group }));
  return (
    <Select
      label="Biological process"
      size="small"
      searchable
      filterLabel="Filter processes"
      placeholder="Choose a process"
      options={options}
      {...(value ? { value } : {})}
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
      onChange={onChange}
    />
  );
}
