import { featureEffects } from './DeepseaResult';
import { DeepseaService } from './DeepseaService';
import { SampleClient } from '../sample/SampleClient';
import { SeiHgmdService, type HgmdOrder } from './SeiHgmdService';

describe('SeiHgmdService', () => {
  const client = SampleClient.bundled();
  const service = new SeiHgmdService(client);

  it('reads all 853 HGMD variants, each with 40 sequence class scores', async () => {
    const variants = await service.variants();
    expect(variants).toHaveLength(853);
    expect(variants.every((variant) => variant.feature_predictions.length === 40)).toBe(true);
  });

  it('sorts as humanbase.io does: the dataset’s order, disease names, or the API’s genome order', async () => {
    const variants = await service.variants();
    const name = (order: HgmdOrder) => SeiHgmdService.sorted(variants, order).slice(0, 1).map(SeiHgmdService.nameOf)[0];
    expect(name('default')).toBe('Haemophagocytic lymphohistiocytosis type 3 (chr17:73839907)');
    expect(name('disease')).toBe('Acampomelic campomelic dysplasia (chr17:70117348)');
    expect(name('position')).toBe('Parkinson disease, autosomal recessive (chr1:8021919)');
  });

  it('names the sequence classes with their groups, as Sei job results do', async () => {
    const features = await new DeepseaService(client).precomputedFeatures(SeiHgmdService.source);
    expect(features.model_features).toHaveLength(40);
    const effects = (await service.variants()).slice(0, 1).flatMap((variant) => featureEffects(variant, features));
    expect(effects[0]).toMatchObject({ feature: 'E5 B-cell-like', label: 'Enhancer / E5 B-cell-like' });
  });
});
