import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { handSamples, plannedSamples, settleInBatches } from './samplePlan.mjs';

const dataDir = join(import.meta.dirname, '../packages/data');
const samplesDir = join(dataDir, 'samples');
const { endpoints, geneLookups } = JSON.parse(readFileSync(join(dataDir, 'endpoints.json'), 'utf8'));
const planned = plannedSamples(endpoints, 'https://api.example.org');
const saved = (key: string) => JSON.parse(readFileSync(join(samplesDir, `${key}.json`), 'utf8'));

describe('endpoints.json', () => {
  it('lists every sample on disk', () => {
    const listed = new Set([...planned.map((sample) => sample.key), ...handSamples(endpoints), ...geneLookups.genes.map((name: string) => `genome/genes/${name.toLowerCase()}`), 'genome/tracks']);
    const onDisk = readdirSync(samplesDir, { recursive: true, encoding: 'utf8' }).filter((name) => name.endsWith('.json')).map((name) => name.replace(/\.json$/, ''));
    expect(onDisk.filter((key) => !listed.has(key))).toEqual([]);
  });

  it('has a file for every listed sample, saved with the status it expects', () => {
    expect([...planned.map((sample) => sample.key), ...handSamples(endpoints)].filter((key) => !existsSync(join(samplesDir, `${key}.json`)))).toEqual([]);
    expect(planned.filter((sample) => saved(sample.key).status !== sample.status).map((sample) => sample.key)).toEqual([]);
  });
});

describe('settleInBatches', () => {
  it('runs a few tasks at a time and carries on past a failure', async () => {
    let running = 0;
    let most = 0;
    const task = (fails: boolean) => async () => {
      most = Math.max(most, ++running);
      await Promise.resolve();
      running--;
      if (fails) throw new Error('500');
      return 'ok';
    };
    const results = await settleInBatches([task(false), task(true), task(false), task(false), task(false)], 2);
    expect(most).toBe(2);
    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'rejected', 'fulfilled', 'fulfilled', 'fulfilled']);
  });
});
