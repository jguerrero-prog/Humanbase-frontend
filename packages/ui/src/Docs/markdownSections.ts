import type { Blockquote, Heading, Parents, Root, RootContent } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import { unified, type PluggableList } from 'unified';

export interface DocsSection {
  id: string;
  title: string;
  level: number;
}

export interface DocsSectionText extends DocsSection {
  text: string;
}

const idSuffix = /\s*\{#([\w.-]+)\}\s*$/;

/** The words a node shows, without its markup. */
export function plainText(node: RootContent | Root): string {
  if ('value' in node && node.type !== 'html') return node.value;
  if ('alt' in node) return node.alt ?? '';
  if (!('children' in node)) return '';
  return (node.children as RootContent[]).map(plainText).join('');
}

function setProperty(node: RootContent, name: string, value: string): void {
  node.data = { ...node.data, hProperties: { ...node.data?.hProperties, [name]: value } };
}

const alertMarker = /^\[!(\w+)\]\s*/;

/** A blockquote that starts with a marker such as [!NOTE], as GitHub writes notes and warnings, becomes an alert of that kind. */
function markAlert(node: Blockquote): void {
  const paragraph = node.children[0];
  const first = paragraph?.type === 'paragraph' ? paragraph.children[0] : undefined;
  const kind = first?.type === 'text' ? alertMarker.exec(first.value)?.[1] : undefined;
  if (!kind || first?.type !== 'text') return;
  first.value = first.value.replace(alertMarker, '');
  setProperty(node, 'dataAlert', kind.toUpperCase());
}

/** Moves a trailing {#id} on each heading into its id, labels code blocks and tables with the heading above, and marks alerts. */
export function docsHeadings() {
  return (tree: Root) => {
    let heading = '';
    const visit = (parent: Parents) => {
      for (const node of parent.children as RootContent[]) {
        if (node.type === 'heading') {
          const last = node.children.at(-1);
          const match = last?.type === 'text' ? idSuffix.exec(last.value) : null;
          if (last?.type === 'text' && match?.[1]) {
            last.value = last.value.replace(idSuffix, '');
            setProperty(node, 'id', match[1]);
          }
          heading = plainText(node);
        } else if (node.type === 'code' || node.type === 'table') {
          setProperty(node, 'dataLabel', heading);
        } else if (node.type === 'blockquote') {
          markAlert(node);
        }
        if ('children' in node) visit(node);
      }
    };
    visit(tree);
  };
}

export const docsRemarkPlugins: PluggableList = [remarkGfm, remarkMath, docsHeadings];

const headingId = (node: Heading) => String(node.data?.hProperties?.id ?? '');

/** Each heading of a page with the text under it, for search and the On this page list. */
export function docsSections(markdown: string): DocsSectionText[] {
  const processor = unified().use(remarkParse).use(docsRemarkPlugins);
  const tree = processor.runSync(processor.parse(markdown)) as Root;
  const sections: DocsSectionText[] = [];
  for (const node of tree.children) {
    if (node.type === 'heading') sections.push({ id: headingId(node), title: plainText(node), level: node.depth, text: '' });
    else {
      const section = sections.at(-1);
      if (section) section.text = [section.text, plainText(node)].filter(Boolean).join(' ');
    }
  }
  return sections;
}
