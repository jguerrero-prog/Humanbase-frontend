import { ModelHint } from '@humanbase/hb';
import { Select } from '@humanbase/ui';

/** Seqweaver's Model field: one model, with a hint that links to Variant effects. */
export function SeqweaverModelField() {
  return <Select label="Model" options={[{ value: 'seqweaver', label: 'Seqweaver (RNA)' }]} defaultValue="seqweaver" hint={<ModelHint model="seqweaver" />} />;
}
