import { GeneFunctionService, type FunctionDatabase } from './GeneFunctionService';

const fakeClient = () => ({ get: vi.fn().mockResolvedValue([]), post: vi.fn(), text: vi.fn() });

describe('GeneFunctionService', () => {
  it.each<FunctionDatabase>(['gene-ontology-bp', 'disease-ontology'])('limits %s to predictions of 0.05 or more and terms of up to 300 genes', async (database) => {
    const client = fakeClient();
    await new GeneFunctionService(client).get(3553, database);
    const params = { database, score_cutoff: 0.05, max_term_size: 300 };
    expect(client.get.mock.calls).toEqual([
      ['genes/3553/annotations/', params],
      ['genes/3553/predictions/', params],
    ]);
  });

  it('reads BRENDA tissues with no cutoffs', async () => {
    const client = fakeClient();
    await new GeneFunctionService(client).get(3553, 'brenda-ontology');
    expect(client.get.mock.calls.map((call) => call[1])).toEqual([{ database: 'brenda-ontology' }, { database: 'brenda-ontology' }]);
  });
});
