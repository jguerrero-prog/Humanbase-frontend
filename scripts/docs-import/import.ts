import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { convertPage, imageSize, linkedSources, pageFile, type ConvertedPage } from './convert.ts';
import { aliases, liveBase, pages } from './pages.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const contentDir = join(root, 'packages/hb/src/content/docs/pages');
const imageDir = join(root, 'apps/web/public/docs/img');
const pause = 500;

const { values: options } = parseArgs({ options: { check: { type: 'boolean' }, cache: { type: 'string' } } });

/** Fetches one URL at a time with a pause between, or reads it from --cache when a copy is there. */
class PoliteFetcher {
  private last = 0;
  private readonly cache: string | undefined;

  constructor(cache: string | undefined) {
    this.cache = cache;
  }

  async get(url: string): Promise<Buffer> {
    const cached = this.cache && join(this.cache, url.slice(liveBase.length).replaceAll('/', '__'));
    if (cached) {
      const copy = await readFile(cached).catch(() => undefined);
      if (copy) return copy;
    }
    const wait = this.last + pause - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    this.last = Date.now();
    const response = await fetch(url, { headers: { 'user-agent': 'humanbase-frontend docs import' } });
    if (!response.ok) throw new Error(`${url} answered ${response.status}`);
    const body = Buffer.from(await response.arrayBuffer());
    if (cached) await mkdir(this.cache, { recursive: true }).then(() => writeFile(cached, body));
    return body;
  }
}

async function filesIn(dir: string): Promise<Map<string, Buffer>> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => []);
  const files = new Map<string, Buffer>();
  for (const entry of entries.filter((item) => item.isFile())) {
    const path = join(entry.parentPath, entry.name);
    files.set(relative(dir, path), await readFile(path));
  }
  return files;
}

const hash = (data: Buffer) => createHash('sha256').update(data).digest('hex');

function report(kind: string, before: Map<string, Buffer>, after: Map<string, Buffer>): number {
  const added = [...after.keys()].filter((name) => !before.has(name));
  const removed = [...before.keys()].filter((name) => !after.has(name));
  const changed = [...after.keys()].filter((name) => before.has(name) && hash(before.get(name) as Buffer) !== hash(after.get(name) as Buffer));
  console.log(`${kind}: ${after.size} total, ${added.length} added, ${removed.length} removed, ${changed.length} changed`);
  for (const [label, names] of [['+', added], ['-', removed], ['~', changed]] as const) for (const name of names) console.log(`  ${label} ${name}`);
  return added.length + removed.length + changed.length;
}

const fileFor = (slug: string) => `${slug || 'index'}.md`.replace(/^use-cases\.md$/, 'use-cases/index.md');

async function main(): Promise<void> {
  const fetcher = new PoliteFetcher(options.cache);
  const known = new Set([...pages.map((page) => page.source), ...Object.keys(aliases)]);
  const newPages: string[] = [];
  const converted: ConvertedPage[] = [];
  const imageFiles = new Map<string, Buffer>();

  for (const page of pages) {
    const html = (await fetcher.get(liveBase + page.source)).toString('utf8');
    for (const linked of linkedSources(html, page.source)) if (!known.has(linked)) newPages.push(linked);
    converted.push(convertPage(html, page));
    console.log(`converted ${page.source}`);
  }
  if (newPages.length) throw new Error(`The live docs link to pages the import doesn't know: ${[...new Set(newPages)].join(', ')}. Add them to pages.ts.`);

  const markdown = new Map<string, Buffer>();
  for (const page of converted) {
    for (const image of page.images) {
      const data = imageFiles.get(image.file) ?? (await fetcher.get(image.url));
      imageFiles.set(image.file, data);
      page.frontMatter.images[image.file] = imageSize(data);
    }
    markdown.set(fileFor(page.frontMatter.slug), Buffer.from(pageFile(page)));
  }

  console.log('\nCompared with the committed content:');
  const changes = report('Pages', await filesIn(contentDir), markdown) + report('Images', await filesIn(imageDir), imageFiles);
  if (options.check) {
    process.exitCode = changes ? 1 : 0;
    return;
  }
  for (const [dir, files] of [[contentDir, markdown], [imageDir, imageFiles]] as const) {
    await rm(dir, { recursive: true, force: true });
    for (const [name, data] of files) {
      await mkdir(dirname(join(dir, name)), { recursive: true });
      await writeFile(join(dir, name), data);
    }
  }
  console.log(changes ? '\nWrote the changes. Review them with git diff before committing.' : '\nNothing changed.');
}

await main();
