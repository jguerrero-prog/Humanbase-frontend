import type { DataType } from '@humanbase/data';
import { MultiSelect } from '@humanbase/ui';

export interface DataTypesFilterProps {
  types: readonly DataType[];
  /** Chosen slugs; empty means every type. */
  value: readonly string[];
  onChange: (slugs: string[]) => void;
  size?: 'small' | 'medium';
}

export function DataTypesFilter({ types, value, onChange, size = 'small' }: DataTypesFilterProps) {
  return (
    <MultiSelect
      label="Data types"
      noun="types"
      legend="Data types to integrate"
      options={types.map((type) => ({ value: type.slug, label: type.title }))}
      value={value}
      onChange={onChange}
      size={size}
    />
  );
}
