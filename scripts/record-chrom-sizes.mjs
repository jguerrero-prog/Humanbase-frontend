import { writeFileSync } from 'node:fs';
import { setTimeout as pause } from 'node:timers/promises';

// UCSC allows programs one request every 15 seconds, so this asks twice and is run once, not on every build.
const assemblies = ['hg19', 'hg38'];
const main = [...Array.from({ length: 22 }, (_, index) => `chr${index + 1}`), 'chrX', 'chrY', 'chrM'];
const file = new URL('../packages/data/src/genome/chromosomeSizes.json', import.meta.url);

const recorded = { source: 'UCSC Genome Browser REST API, https://api.genome.ucsc.edu/list/chromosomes', recorded: new Date().toISOString().slice(0, 10) };
for (const [index, genome] of assemblies.entries()) {
  if (index > 0) await pause(16_000);
  const response = await fetch(`https://api.genome.ucsc.edu/list/chromosomes?genome=${genome}`);
  if (!response.ok) throw new Error(`UCSC answered ${response.status} for ${genome}.`);
  const { chromosomes } = await response.json();
  recorded[genome] = Object.fromEntries(main.map((chrom) => {
    if (!Number.isInteger(chromosomes[chrom])) throw new Error(`UCSC listed no ${chrom} for ${genome}.`);
    return [chrom, chromosomes[chrom]];
  }));
  console.log(`${genome}: ${main.length} chromosomes`);
}
writeFileSync(file, `${JSON.stringify(recorded, null, 2)}\n`);
