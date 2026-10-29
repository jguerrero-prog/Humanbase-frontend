import type { Element, ElementContent } from 'hast';
import { useMemo, type ComponentProps, type ReactNode } from 'react';
import Markdown, { type Components, type ExtraProps } from 'react-markdown';
import { ArticleFigure } from '../Article/Article';
import { CodeBlock, InlineCode } from '../CodeBlock/CodeBlock';
import { useLinkHref } from '../hooks/useLinkHref';
import { Alert } from '../Message/Alert';
import type { MessageTone } from '../Message/Message';
import { Cell, HeaderCell, Table } from '../Table/Table';
import { docsRemarkPlugins } from './markdownSections';
import { TexMath } from './TexMath';
import './DocsMarkdown.css';

/** Width and height in pixels of each image, by file name. */
export type ImageSizes = Readonly<Record<string, readonly [number, number]>>;

export interface DocsMarkdownProps {
  markdown: string;
  images?: ImageSizes;
}

type Rendered = ExtraProps & { children?: ReactNode };

const textOf = (node: ElementContent | Element): string => (node.type === 'text' ? node.value : 'children' in node ? node.children.map(textOf).join('') : '');
const classList = (node: Element | undefined) => (Array.isArray(node?.properties.className) ? node.properties.className.map(String) : []);
const alerts: Record<string, MessageTone> = { NOTE: 'info', TIP: 'info', IMPORTANT: 'warning', WARNING: 'warning', CAUTION: 'error' };

function onlyImage(node: Element | undefined): Element | undefined {
  const children = node?.children.filter((child) => !(child.type === 'text' && !child.value.trim())) ?? [];
  const image = children[0];
  return children.length === 1 && image?.type === 'element' && image.tagName === 'img' ? image : undefined;
}

function Paragraph({ node, children, images }: ComponentProps<'p'> & ExtraProps & { images: ImageSizes }) {
  const linkHref = useLinkHref();
  const image = onlyImage(node);
  if (!image) return <p>{children}</p>;
  const src = String(image.properties.src ?? '');
  const [width, height] = images[src.split('/').at(-1) ?? ''] ?? [];
  return <ArticleFigure image={{ src: linkHref(src), alt: String(image.properties.alt ?? ''), width: width ?? 0, height: height ?? 0 }} />;
}

function DocsImage({ src = '', alt = '' }: ComponentProps<'img'>) {
  const linkHref = useLinkHref();
  return <img src={linkHref(src)} alt={alt} />;
}

function DocsLink({ href = '', children }: ComponentProps<'a'>) {
  const linkHref = useLinkHref();
  return <a href={linkHref(href)}>{children}</a>;
}

function Pre({ node }: Rendered) {
  const code = node?.children.find((child): child is Element => child.type === 'element' && child.tagName === 'code');
  const text = code ? textOf(code).replace(/\n$/, '') : '';
  if (classList(code).includes('language-math')) return <TexMath tex={text} display />;
  return <CodeBlock label={String(code?.properties.dataLabel || 'Code')} code={text} />;
}

function Code({ node, children }: Rendered) {
  return classList(node).includes('language-math') ? <TexMath tex={node ? textOf(node) : ''} /> : <InlineCode>{children}</InlineCode>;
}

function Blockquote({ node, children }: Rendered) {
  const tone = alerts[String(node?.properties.dataAlert ?? '')];
  return tone ? <Alert tone={tone}>{children}</Alert> : <blockquote>{children}</blockquote>;
}

function DocsTable({ node, children }: Rendered) {
  return (
    <Table caption={String(node?.properties.dataLabel || 'Table')} density="compact">
      {children}
    </Table>
  );
}

const noImages: ImageSizes = {};

const alignOf = (node: Element | undefined) => (node?.properties.align === 'right' ? 'end' : 'start');

function baseComponents(images: ImageSizes): Components {
  return {
    h1: () => null,
    h2: ({ id, children }) => <h2 id={id} className="docs-h2">{children}</h2>,
    h3: ({ id, children }) => <h3 id={id} className="docs-h3">{children}</h3>,
    h4: ({ id, children }) => <h4 id={id} className="docs-h4">{children}</h4>,
    p: (props) => <Paragraph {...props} images={images} />,
    a: DocsLink,
    img: DocsImage,
    pre: Pre,
    code: Code,
    blockquote: Blockquote,
    table: DocsTable,
    th: ({ node, children }) => <HeaderCell align={alignOf(node)}>{children}</HeaderCell>,
    td: ({ node, children }) => <Cell type={alignOf(node) === 'end' ? 'number' : 'text'}>{children}</Cell>,
  };
}

/** A docs page's Markdown as React elements: raw HTML is skipped, and blocks use the design system's components. */
export function DocsMarkdown({ markdown, images = noImages }: DocsMarkdownProps) {
  // New component functions would remount every element, so they are made once per set of images.
  const components = useMemo(() => baseComponents(images), [images]);
  return (
    <div className="docs-markdown">
      <Markdown remarkPlugins={docsRemarkPlugins} components={components} skipHtml>
        {markdown}
      </Markdown>
    </div>
  );
}
