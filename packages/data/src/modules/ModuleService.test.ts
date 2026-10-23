import { Humanbase } from '../Humanbase';
import { SampleClient } from '../sample/SampleClient';
import { ModuleResult } from './ModuleResult';
import { moduleExamples } from './moduleExamples';
import { ModuleService, type ModuleRequest } from './ModuleService';

const samples = () => new Humanbase(SampleClient.bundled());

async function renalRequest(): Promise<ModuleRequest> {
  const renal = moduleExamples.find((example) => example.id === 'renal');
  if (!renal) throw new Error('The renal disease panel example is missing.');
  const matches = await samples().search.list(renal.genes);
  const entrez = [...new Set(matches.flatMap((term) => term.genes.slice(0, 1).map((gene) => gene.entrez)))];
  return { entrez, integration: renal.tissue.v1, version: 'v1', title: '' };
}

describe('ModuleService', () => {
  it('makes the body_tag the way the live site does', async () => {
    const tag = await ModuleService.bodyTag({ entrez: [7124, 3553], integration: 'kidney', version: 'v1' });
    expect(tag).toBe('f0d6baeba68a1929f2027795680dfdcf6bceda99');
    expect(await ModuleService.bodyTag({ entrez: [3553, 7124], integration: 'kidney', version: 'v1' })).toBe(tag);
    expect(await ModuleService.bodyTag({ entrez: [3553, 7124], integration: 'kidney', version: 'v1', title: 'Two genes' })).not.toBe(tag);
  });

  it('submits a job, then polls its result', async () => {
    const api = samples();
    const request = await renalRequest();
    const { bodyTag, result } = await api.modules.submit(request);
    expect(result).toBeNull();
    const finished = await api.modules.poll(bodyTag);
    expect(finished).toBeInstanceOf(ModuleResult);
    // The live site sends examples without a title, so the real result has none; the page shows the name kept in this browser.
    expect(finished?.title).toBe('');
    expect(finished?.entrez).toHaveLength(504);
  });

  it('polls without a body and says when a job is still running', async () => {
    const client = { get: vi.fn(), post: vi.fn().mockResolvedValue({ status: 'processing' }), text: vi.fn() };
    await expect(new ModuleService(client).poll('abc')).resolves.toBeNull();
    expect(client.post).toHaveBeenCalledWith('integrations/community/', undefined, { body_tag: 'abc' });
  });

  it('reports a job with no result as not found', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(samples().modules.poll('0000')).rejects.toMatchObject({ status: 404 });
  });
});

describe('ModuleResult', () => {
  const result = async () => (await samples().modules.poll(await ModuleService.bodyTag(await renalRequest()))) as ModuleResult;

  it('shows enriched modules of two genes or more by default', async () => {
    const modules = await result();
    const shown = modules.shown('gene-ontology-bp');
    expect(shown.map((module) => module.label)).toEqual(['M1', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M11', 'M12', 'M13', 'M14', 'M15', 'M20']);
    expect(modules.shown('gene-ontology-bp', { minimumSize: 2, hideUnenriched: false })).toHaveLength(20);
    expect(modules.shown('gene-ontology-bp', { minimumSize: 30, hideUnenriched: false }).every((module) => module.genes.length >= 30)).toBe(true);
  });

  it('lists a module’s terms, most significant first, and finds a gene’s module', async () => {
    const modules = await result();
    const terms = modules.terms(1, 'gene-ontology-bp');
    expect(terms[0]?.title).toBe('renal system development');
    expect(terms.map((term) => term.qValue)).toEqual([...terms.map((term) => term.qValue)].sort((a, b) => a - b));
    const nphs1 = terms.at(-1)?.genes[0] as number;
    expect(modules.moduleOf(nphs1)?.label).toBe('M1');
    expect(modules.databases).toEqual(['gene-ontology-bp', 'msigdb-h', 'disease-ontology', 'msigdb-c2-cp']);
    expect(modules.databaseName('msigdb-h')).toBe('MSigDB: Hallmark (H)');
    expect(modules.symbol(80000)).toBe('GREB1L');
  });

  it('lists a gene’s neighbors in any module, strongest first, and the terms of its module that include it', async () => {
    const modules = await result();
    const hnf1b = 6928;
    expect(modules.neighbors(hnf1b).map(({ entrez, weight, module }) => [modules.symbol(entrez), weight.toFixed(3), module?.label])).toEqual([
      ['HNF4A', '0.128', 'M1'],
      ['KCNJ1', '0.098', 'M1'],
    ]);
    const terms = modules.termsOf(hnf1b, 'gene-ontology-bp');
    expect(terms).toHaveLength(9);
    expect(terms.every((term) => term.genes.includes(hnf1b))).toBe(true);
    expect(terms[0]?.title).toBe('renal system development');
    expect(modules.neighbors(0)).toEqual([]);
    expect(modules.termsOf(0, 'gene-ontology-bp')).toEqual([]);
  });
});
