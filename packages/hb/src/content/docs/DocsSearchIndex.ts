import { docsSections } from '@humanbase/ui';
import type { DocsPage } from './DocsLibrary';

export interface DocsHit {
  id: string;
  href: string;
  /** The section's heading, or the page title for the page itself. */
  title: string;
  page: string;
  snippet: string;
  score: number;
}

interface Entry {
  href: string;
  title: string;
  page: string;
  text: string;
  haystack: { page: string; title: string; text: string };
}

const weights = { page: 6, title: 4, text: 1 } as const;
const snippetLength = 140;

const words = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean);

/** A small full-text search over every section of the bundled docs: all words must match, headings count most. */
export class DocsSearchIndex {
  private readonly entries: Entry[];

  constructor(pages: readonly DocsPage[]) {
    this.entries = pages.flatMap((page) =>
      docsSections(page.markdown).map((section) => {
        const title = section.level === 1 ? page.title : section.title;
        const href = section.level === 1 ? page.route : `${page.route}#${section.id}`;
        return { href, title, page: page.title, text: section.text, haystack: { page: page.title.toLowerCase(), title: title.toLowerCase(), text: section.text.toLowerCase() } };
      }),
    );
  }

  search(query: string, limit = 8): DocsHit[] {
    const terms = words(query);
    if (!terms.length) return [];
    return this.entries
      .map((entry) => ({ entry, score: this.score(entry, terms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ entry, score }) => ({ id: entry.href, href: entry.href, title: entry.title, page: entry.page, snippet: snippet(entry.text, terms), score }));
  }

  private score(entry: Entry, terms: readonly string[]): number {
    let total = 0;
    for (const term of terms) {
      const found = (Object.keys(weights) as (keyof typeof weights)[]).reduce((sum, field) => sum + (entry.haystack[field].includes(term) ? weights[field] : 0), 0);
      if (!found) return 0;
      total += found;
    }
    return total;
  }
}

/** The text around the first matching word, shortened at word boundaries. */
export function snippet(text: string, terms: readonly string[]): string {
  const lower = text.toLowerCase();
  const at = Math.max(0, Math.min(...terms.map((term) => lower.indexOf(term)).filter((index) => index >= 0), text.length));
  const start = at > snippetLength / 3 ? text.lastIndexOf(' ', at - snippetLength / 3) + 1 : 0;
  const end = start + snippetLength >= text.length ? text.length : text.lastIndexOf(' ', start + snippetLength);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}
