interface PagefindResult {
  data(): Promise<{ url: string; meta: { title?: string }; excerpt: string }>;
}

interface Pagefind {
  debouncedSearch(query: string): Promise<{ results: PagefindResult[] } | null>;
}

export class DocsSearch {
  private readonly input: HTMLInputElement;
  private readonly output: HTMLOutputElement;
  private pagefind: Pagefind | null = null;

  constructor(root: HTMLElement) {
    const input = root.querySelector('input');
    const output = root.querySelector('output');
    if (!input || !output) throw new Error('DocsSearch needs an <input> and an <output>.');
    this.input = input;
    this.output = output;
  }

  start(): void {
    this.input.form?.addEventListener('submit', (event) => event.preventDefault());
    this.input.addEventListener('input', () => void this.search(this.input.value.trim()));
  }

  private async search(query: string): Promise<void> {
    if (!query) return this.output.replaceChildren();
    const pagefind = await this.load();
    if (!pagefind) return this.show('Search works in the built site. Run pnpm --filter @humanbase/docs build, then preview.');
    const found = await pagefind.debouncedSearch(query);
    if (!found) return;
    if (!found.results.length) return this.show(`No pages match “${query}”.`);
    const pages = await Promise.all(found.results.slice(0, 8).map((result) => result.data()));
    this.output.replaceChildren(this.list(pages));
  }

  private list(pages: Awaited<ReturnType<PagefindResult['data']>>[]): HTMLUListElement {
    const list = document.createElement('ul');
    for (const page of pages) {
      const link = document.createElement('a');
      link.href = page.url;
      link.textContent = page.meta.title ?? page.url;
      const excerpt = document.createElement('p');
      excerpt.textContent = new DOMParser().parseFromString(page.excerpt, 'text/html').body.textContent;
      const item = document.createElement('li');
      item.append(link, excerpt);
      list.append(item);
    }
    return list;
  }

  private show(message: string): void {
    const note = document.createElement('p');
    note.textContent = message;
    this.output.replaceChildren(note);
  }

  private async load(): Promise<Pagefind | null> {
    if (this.pagefind) return this.pagefind;
    try {
      const path = '/pagefind/pagefind.js';
      this.pagefind = (await import(/* @vite-ignore */ path)) as Pagefind;
    } catch {
      return null;
    }
    return this.pagefind;
  }
}
