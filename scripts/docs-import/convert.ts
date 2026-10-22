import type { Element, ElementContent, Root as HastRoot, Parents as HastParents } from 'hast';
import { toString } from 'hast-util-to-string';
import type { Blockquote, Code, Heading, Image, Link, Paragraph, PhrasingContent, Root as MdastRoot, RootContent, Table, TableRow, Text } from 'mdast';
import rehypeParse from 'rehype-parse';
import rehypeRemark, { type Options as ToMdastOptions } from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { aliases, liveBase, pages, type DocsGroup, type PageConfig } from './pages.ts';

type Handle = NonNullable<NonNullable<ToMdastOptions['handlers']>[string]>;
type State = Parameters<Handle>[0];

export interface Section {
  id: string;
  title: string;
  level: number;
}

export interface FrontMatter {
  title: string;
  slug: string;
  group: DocsGroup;
  label?: string;
  order: number;
  live: string;
  sections: Section[];
  /** Width and height in pixels of each image the page shows, by file name. */
  images: Record<string, [number, number]>;
}

export interface ImageFile {
  url: string;
  file: string;
}

export interface ConvertedPage {
  frontMatter: FrontMatter;
  markdown: string;
  images: ImageFile[];
}

export const imagePath = '/docs/img/';

export function docsRoute(slug: string): string {
  return slug ? `/docs/${slug}/` : '/docs/';
}

const routes = new Map<string, string>([...pages.map((page) => [page.source, page.slug] as const), ...Object.entries(aliases)]);

/** Points links between live docs pages at our routes, keeping anchors; other links stay as they are. */
export function rewriteHref(href: string, source: string): string {
  if (href.startsWith('#')) return href;
  const url = new URL(href, liveBase + source);
  if (!url.href.startsWith(liveBase)) return href;
  const slug = routes.get(url.pathname.slice(new URL(liveBase).pathname.length) || 'index.html');
  if (slug === undefined) return href;
  return docsRoute(slug) + url.hash;
}

const looksLikeUrl = /:\/\/|^www\.|\.(io|org|com)\b/i;

/** Spells the name Humanbase in prose, leaving URLs and text in quotation marks alone. */
export function humanbaseSpelling(text: string): string {
  return text
    .split(/(“[^”]*”|"[^"]*")/)
    .map((part, index) => (index % 2 ? part : part.split(/(\s+)/).map((word) => (looksLikeUrl.test(word) ? word : word.replaceAll('HumanBase', 'Humanbase'))).join('')))
    .join('');
}

const classes = (node: Element): string[] => (Array.isArray(node.properties.className) ? node.properties.className.map(String) : []);
const hasClass = (node: Element, name: string) => classes(node).includes(name);
const isElement = (node: unknown): node is Element => (node as Element | undefined)?.type === 'element';

function walk(node: HastParents, visit: (node: Element, parent: HastParents) => void): void {
  for (const child of [...node.children]) {
    if (!isElement(child)) continue;
    visit(child, node);
    walk(child, visit);
  }
}

function find(node: HastParents, test: (node: Element) => boolean): Element | undefined {
  let found: Element | undefined;
  walk(node, (child) => {
    if (!found && test(child)) found = child;
  });
  return found;
}

/** The page's article body, without permalink icons, with each section's id on its heading. */
export function articleBody(tree: HastRoot): Element {
  const body = find(tree, (node) => String(node.properties.itemProp) === 'articleBody');
  if (!body) throw new Error('No articleBody in the page; has the Sphinx theme changed?');
  walk(body, (node, parent) => {
    if (node.tagName === 'a' && hasClass(node, 'headerlink')) parent.children = parent.children.filter((child) => child !== node);
    if (node.tagName !== 'section' || typeof node.properties.id !== 'string') return;
    const heading = node.children.find((child): child is Element => isElement(child) && /^h[1-6]$/.test(child.tagName));
    if (heading) heading.properties.id = node.properties.id;
  });
  return body;
}

const mathDelimiters = /^\s*\\[[(]|\\[\])]\s*$/g;

/** A preformatted block of pipe-separated rows with a separator line, such as Sei's sequence classes, as a real table. */
export function pipeTable(text: string): Table | undefined {
  const lines = text.trim().split('\n').map((line) => line.trim());
  const separator = lines[1];
  if (lines.length < 3 || !separator || !/^\|(\s*:?-+:?\s*\|)+$/.test(separator) || !lines.every((line) => /^\|.*\|$/.test(line))) return undefined;
  const cells = (line: string) => line.slice(1, -1).split('|').map((cell) => cell.trim());
  const body = lines.slice(2).map(cells);
  // The padding only lined up plain text, so only number columns keep their right alignment.
  const align = cells(separator).map((_, column) => (body.every((row) => /^-?[\d.,]+$/.test(row[column] ?? '')) ? 'right' : null));
  const row = (values: string[]): TableRow => ({ type: 'tableRow', children: values.map((cell) => ({ type: 'tableCell', children: cell ? [{ type: 'text', value: cell }] : [] })) });
  const rows = [cells(lines[0] ?? ''), ...body].map(row);
  return rows.every((r) => r.children.length === align.length) ? { type: 'table', align, children: rows } : undefined;
}

class PageConverter {
  readonly images: ImageFile[] = [];
  private readonly pageUrl: string;
  private readonly config: PageConfig;
  private readonly title: string;

  constructor(config: PageConfig, title: string) {
    this.config = config;
    this.title = title;
    this.pageUrl = liveBase + config.source;
  }

  private image(img: Element): Image {
    const src = String(img.properties.src ?? '');
    const url = new URL(src, this.pageUrl).href;
    const file = url.split('/').at(-1) ?? '';
    if (!this.images.some((image) => image.file === file)) this.images.push({ url, file });
    const alt = String(img.properties.alt ?? '');
    // Sphinx falls back to the file path as alt text; that tells a reader nothing, so we name the screenshot instead.
    const named = alt && alt !== src ? alt : `${humanbaseSpelling(this.title)}, screenshot ${this.images.findIndex((image) => image.file === file) + 1}`;
    return { type: 'image', url: imagePath + file, alt: named };
  }

  readonly handlers: Record<string, Handle> = {
    div: (state, node) => {
      if (hasClass(node, 'math')) return { type: 'math', value: toString(node).replace(mathDelimiters, '').trim() };
      const highlight = classes(node).find((name) => name.startsWith('highlight-'));
      if (highlight) {
        const text = toString(node).replace(/\n$/, '');
        const lang = highlight.slice('highlight-'.length).replace('default', '') || null;
        return pipeTable(text) ?? ({ type: 'code', lang, value: text } satisfies Code);
      }
      if (hasClass(node, 'admonition')) return this.admonition(state, node);
      return state.toFlow(state.all(node));
    },
    span: (state, node) => (hasClass(node, 'math') ? { type: 'inlineMath', value: toString(node).replace(mathDelimiters, '').trim() } : state.all(node)),
    sub: (_state, node) => ({ type: 'inlineMath', value: `_{${toString(node)}}` }),
    sup: (_state, node) => ({ type: 'inlineMath', value: `^{${toString(node)}}` }),
    figure: (_state, node) => {
      const img = find(node, (child) => child.tagName === 'img');
      return img ? ({ type: 'paragraph', children: [this.image(img)] } satisfies Paragraph) : undefined;
    },
    img: (_state, node) => this.image(node),
    a: (state, node) => {
      const img = hasClass(node, 'image-reference') && find(node, (child) => child.tagName === 'img');
      if (img) return { type: 'paragraph', children: [this.image(img)] } satisfies Paragraph;
      const link: Link = { type: 'link', url: rewriteHref(String(node.properties.href ?? ''), this.config.source), children: state.all(node) as PhrasingContent[] };
      return link;
    },
    dl: (state, node) =>
      node.children.filter(isElement).flatMap((child): RootContent[] =>
        child.tagName === 'dt' ? [{ type: 'paragraph', children: state.all(child) as PhrasingContent[] }] : (state.toFlow(state.all(child)) as RootContent[]),
      ),
    code: (_state, node) => ({ type: 'inlineCode', value: toString(node) }),
  };

  private admonition(state: State, node: Element) {
    const tone = classes(node).find((name) => ['note', 'warning', 'important', 'tip', 'caution'].includes(name)) ?? 'note';
    const body = node.children.filter((child): child is ElementContent => !(isElement(child) && hasClass(child, 'admonition-title')));
    const content = state.toFlow(state.all({ ...node, children: body })) as Blockquote['children'];
    const quote: Blockquote = { type: 'blockquote', children: [{ type: 'paragraph', children: [{ type: 'text', value: `[!${tone.toUpperCase()}]` }] }, ...content] };
    return quote;
  }
}

function headingText(heading: Heading): string {
  return heading.children.map((child) => ('value' in child ? child.value : 'children' in child ? headingText({ ...heading, children: child.children as PhrasingContent[] }) : '')).join('');
}

/** Spells Humanbase in prose and tightens lists; code, external link text such as paper titles, and quotations keep the source spelling. */
function tidy(node: MdastRoot | RootContent, external = false): void {
  if (node.type === 'text' && !external) node.value = humanbaseSpelling(node.value);
  // Sphinx sets its lists tight (class "simple"), so ours are too.
  if (node.type === 'list' || node.type === 'listItem') node.spread = false;
  if (!('children' in node)) return;
  const inExternal = external || (node.type === 'link' && !node.url.startsWith('/docs/') && !node.url.startsWith('#'));
  for (const child of node.children) tidy(child, inExternal);
}

function sectionsOf(tree: MdastRoot): Section[] {
  return tree.children.flatMap((node) => (node.type === 'heading' && node.data?.id ? [{ id: node.data.id, title: headingText(node), level: node.depth }] : []));
}

/** Appends each heading's live id as {#id}, which the renderer turns back into the heading's id. */
function headingIds(tree: MdastRoot): void {
  for (const node of tree.children) {
    if (node.type === 'heading' && node.data?.id) node.children.push({ type: 'text', value: ` {#${node.data.id}}` } satisfies Text);
  }
}

declare module 'mdast' {
  interface HeadingData {
    id?: string;
  }
}

function idHandler(level: 1 | 2 | 3 | 4 | 5 | 6): Handle {
  return (state, node) => {
    const heading: Heading = { type: 'heading', depth: level, children: state.all(node) as PhrasingContent[] };
    if (typeof node.properties.id === 'string') heading.data = { id: node.properties.id };
    return heading;
  };
}

export function convertPage(html: string, config: PageConfig): ConvertedPage {
  const tree = unified().use(rehypeParse).parse(html);
  const body = articleBody(tree);
  const h1 = find(body, (node) => node.tagName === 'h1');
  const title = h1 ? toString(h1).trim() : config.slug;
  const converter = new PageConverter(config, title);
  const toMdast = unified()
    .use(rehypeRemark, { handlers: { ...converter.handlers, h1: idHandler(1), h2: idHandler(2), h3: idHandler(3), h4: idHandler(4) } })
    .use(remarkGfm)
    .use(remarkMath);
  const mdast = toMdast.runSync({ type: 'root', children: [body] }) as MdastRoot;
  tidy(mdast);
  const sections = sectionsOf(mdast);
  headingIds(mdast);
  const markdown = unified().use(remarkGfm).use(remarkMath).use(remarkStringify, { bullet: '-', emphasis: '_', rule: '-', fences: true }).stringify(mdast);
  const order = pages.indexOf(config);
  const frontMatter: FrontMatter = {
    title: humanbaseSpelling(title),
    slug: config.slug,
    group: config.group,
    ...(config.label && { label: config.label }),
    order,
    live: liveBase + config.source,
    sections,
    images: {},
  };
  return { frontMatter, markdown, images: converter.images };
}

/** The pixel size of a PNG or JPEG, so figures reserve their space before they load. */
export function imageSize(data: Uint8Array): [number, number] {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (view.getUint32(0) === 0x89504e47) return [view.getUint32(16), view.getUint32(20)];
  for (let offset = 2; offset < data.length - 9; ) {
    const marker = view.getUint16(offset);
    if (marker >= 0xffc0 && marker <= 0xffcf && ![0xffc4, 0xffc8, 0xffcc].includes(marker)) return [view.getUint16(offset + 7), view.getUint16(offset + 5)];
    offset += 2 + view.getUint16(offset + 2);
  }
  throw new Error('Not a PNG or JPEG image');
}

/** Front matter is JSON, which is also valid YAML, so the app reads it without a YAML parser. */
export function pageFile({ frontMatter, markdown }: ConvertedPage): string {
  const json = JSON.stringify(frontMatter, null, 2).replace(/\[\s+(\d+),\s+(\d+)\s+\]/g, '[$1, $2]');
  return `---\n${json}\n---\n\n${markdown}`;
}

/** The internal links a page makes to other live pages, so the import can find pages the sidebar doesn't list. */
export function linkedSources(html: string, source: string): string[] {
  const found = new Set<string>();
  for (const [, href] of html.matchAll(/href="([^"#?]+\.html)[^"]*"/g)) {
    const url = new URL(href ?? '', liveBase + source);
    if (!url.href.startsWith(liveBase)) continue;
    const path = url.pathname.slice(new URL(liveBase).pathname.length);
    if (!/^(_|genindex|search)/.test(path)) found.add(path);
  }
  return [...found];
}
