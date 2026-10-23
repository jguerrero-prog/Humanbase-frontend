import { variantEffectsModels, type InputKind, type VariantModel } from '@humanbase/data';
import { DeepseaForm } from '@humanbase/hb';
import { Breadcrumbs, Tabs } from '@humanbase/ui';
import { useNavigate, useSearchParams } from 'react-router';
import '../ToolPage.css';

const tabs = [
  { value: 'variant-list', label: 'Variant list' },
  { value: 'region-scan', label: 'Region scan' },
];
// Sei and Beluga also read sequences; that input waits on whether it moves to Region scan (#398).
const variantListInputs: readonly InputKind[] = ['vcf', 'bed'];
const regionScanModels: readonly VariantModel[] = ['insilico'];
const defaultModel = variantEffectsModels[0] ?? 'sei';

/** Sei and Beluga on one page: a variant list on either model, or a region scan, which runs on Beluga. */
export function VariantEffectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const regionScan = search.get('tab') === 'region-scan';
  const chosen = variantEffectsModels.find((model) => model === search.get('model')) ?? defaultModel;
  const model = regionScan ? 'insilico' : chosen;

  const update = (key: 'tab' | 'model', value: string, fallback: string) => {
    const next = new URLSearchParams(search);
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    setSearch(next);
  };

  return (
    <section className="page-section tool-page">
      <title>{`${regionScan ? 'Region scan · ' : ''}Variant effects · Humanbase`}</title>
      <Breadcrumbs items={[{ label: 'Variants & sequences', href: '/sequence-tools/' }, { label: 'Variant effects' }]} />
      <header className="tool-page-title">
        <h1>Variant effects</h1>
        <p>Predict how variants change regulatory activity and chromatin. Choose a model, then add a list of variants or scan a region base by base.</p>
      </header>
      <Tabs label="Variant effects" tabs={tabs} value={regionScan ? 'region-scan' : 'variant-list'} onChange={(tab) => update('tab', tab, 'variant-list')}>
        <DeepseaForm
          model={model}
          models={regionScan ? regionScanModels : variantEffectsModels}
          inputs={regionScan ? undefined : variantListInputs}
          onModelChange={(next) => update('model', next, defaultModel)}
          onStarted={(link) => void navigate(link)}
        />
      </Tabs>
    </section>
  );
}
