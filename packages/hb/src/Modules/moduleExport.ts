import type { CommunityRecord, Integration, Module, ModuleResult } from '@humanbase/data';
import type { NetworkGraphHandle } from '@humanbase/graph';
import { bytesOf, cssColor, logoUrl, svgToPng, useExportMenu, useImageFormats, zipFormat, type ActionMenuItem, type ExportFormat } from '@humanbase/ui';
import type { RefObject } from 'react';

type EnrichedTerm = CommunityRecord['enrichment'][string][number];

const pngWidth = 2000;

interface ModuleDownloadsOptions {
  result: ModuleResult;
  modules: readonly Module[];
  database: string;
  tissues: readonly Integration[];
  /** The drawn graph; undefined while the table shows, which disables the image formats. */
  graph: RefObject<NetworkGraphHandle | null> | undefined;
}

/** The live site's module Download menu: TSV, PNG, SVG, PDF and a ZIP of all four. */
export function useModuleDownloads({ result, modules, database, tissues, graph }: ModuleDownloadsOptions): ActionMenuItem[] {
  const networkTitle = tissues.find((network) => network.slug === result.integration)?.title ?? result.integration;
  const exporter = new ModuleExport(result, modules, database, networkTitle);
  const [png, svg] = useImageFormats(graph, pngWidth);
  const formats: ExportFormat[] = [
    { label: 'Download as TSV', extension: 'tsv', type: 'text/tab-separated-values', make: () => exporter.tsv() },
    png,
    svg,
    {
      label: 'Download as PDF',
      extension: 'pdf',
      type: 'application/pdf',
      disabled: png.disabled,
      description: png.description,
      make: async () => exporter.pdf((await png.make('')) as Blob, await svgToPng(logoUrl, 600)),
    },
  ];
  return useExportMenu(() => exporter.baseName(), [...formats, zipFormat('Download as ZIP', formats)]);
}

/** Builds the live site's module downloads (TSV and PDF report) for the modules on screen, under its file names. */
export class ModuleExport {
  private readonly symbols: ReadonlyMap<string, string>;

  constructor(
    private readonly result: ModuleResult,
    private readonly modules: readonly Module[],
    private readonly database: string,
    /** The tissue network's title, such as "kidney". */
    private readonly networkTitle: string,
  ) {
    this.symbols = new Map(result.record.nodes.map((node) => [node.id, node.symbol]));
  }

  /** "<title>_kidney_gene-ontology-bp_<time>", as the live site names each download. */
  baseName(now = Date.now()): string {
    const title = this.result.title ? `${this.result.title.replace(/[^a-zA-Z0-9 ]/g, '-')}_` : '';
    const network = this.networkTitle.replace(/[: ]/g, '-').replace(/\+/g, '').toLowerCase();
    return `${title}${network}_${this.database}_${now}`;
  }

  private get versions() {
    return this.result.record.versions ?? { term: '', integration: '' };
  }

  private nodesOf(module: Module) {
    return this.result.record.nodes.filter((node) => Number(node.cluster) + 1 === module.id);
  }

  private termsOf(module: Module): EnrichedTerm[] {
    return (this.result.record.enrichment[this.database] ?? []).filter((term) => Number(term.cluster) + 1 === module.id).sort((a, b) => a.q_value - b.q_value);
  }

  private symbolsOf(nodes: readonly string[]): string {
    return nodes.map((node) => this.symbols.get(node) ?? node).join(',');
  }

  tsv(now = new Date()): string {
    const row = (...cells: (string | number)[]) => [...cells, ...Array<string>(Math.max(0, 6 - cells.length)).fill('')].join('\t');
    const title = this.result.title;
    const edges = [...this.result.record.edges].sort((a, b) => b.weight - a.weight);
    return [
      ...(title ? [row('TITLE', title)] : []),
      row('GO_VERSION', this.versions.term),
      row('NETWORK_NAME', this.networkTitle),
      row('NETWORK_VERSION', this.versions.integration),
      row('DATE_CREATED', now.toString()),
      row('SUBMITTED GENE COUNT', this.result.entrez.length),
      row('RESULTING GENE COUNT', this.modules.reduce((sum, module) => sum + module.genes.length, 0)),
      row(),
      row('CLUSTER_NAME', 'CLUSTER_GENES'),
      ...this.modules.map((module) => row(module.label, this.nodesOf(module).map((node) => node.symbol).join(','))),
      row(),
      row('CLUSTER_NAME', 'TERM_NAME', 'GO_ID', 'TERM_Q_VALUE', 'GENE_COUNT', 'TERM_GENES'),
      ...this.modules.flatMap((module) => this.termsOf(module).map((term) => row(module.label, term.name, term.term, term.q_value, term.genes.length, this.symbolsOf(term.genes)))),
      row(),
      row('SOURCE', 'TARGET', 'WEIGHT'),
      ...edges.map((edge) => row(this.symbols.get(edge.source) ?? edge.source, this.symbols.get(edge.target) ?? edge.target, edge.weight)),
      '',
    ].join('\n');
  }

  /** The report: a header, the graph and each module's top ten terms, on A4 pages. */
  async pdf(graph: Blob, logo: Blob, now = new Date()): Promise<Blob> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const page = { width: doc.internal.pageSize.getWidth(), height: doc.internal.pageSize.getHeight(), margin: 20 };
    const right = page.width - page.margin;
    const bottom = page.height - page.margin - 12;
    const ink = cssColor('--text-default');
    const rule = cssColor('--border-default');
    const stripe = cssColor('--surface-sunken');
    const fontSize = 12;
    const line = fontSize * 1.2;
    const pad = 4;
    doc.setTextColor(ink);
    doc.setDrawColor(rule);

    const logoImage = await bytesOf(logo);
    const logoSize = doc.getImageProperties(logoImage);
    doc.addImage(logoImage, 'PNG', page.margin, page.margin, 104, (104 * logoSize.height) / logoSize.width, 'logo', 'FAST');
    doc.setFont('helvetica', 'bold').setFontSize(18).text('Humanbase functional module discovery', page.margin, 64);
    doc.setFont('helvetica', 'normal').setFontSize(10).text('Tissue-specific network-based functional interpretation of genes and gene sets.', page.margin, 80);
    doc.setFont('helvetica', 'italic').setFontSize(8).text(`${this.networkTitle} network version: ${this.versions.integration}`, right, 94, { align: 'right' });
    doc.line(page.margin, 100, right, 100);

    const graphImage = await bytesOf(graph);
    const graphSize = doc.getImageProperties(graphImage);
    const graphWidth = Math.min(right - page.margin, ((bottom - 110) * graphSize.width) / graphSize.height);
    doc.addImage(graphImage, 'PNG', page.margin, 110, graphWidth, (graphWidth * graphSize.height) / graphSize.width, 'graph', 'FAST');

    const columns = [64, 0, 70, 52, 52];
    columns[1] = right - page.margin - columns.reduce((sum, width) => sum + width, 0);
    const xs = columns.map((_, index) => page.margin + columns.slice(0, index).reduce((sum, width) => sum + width, 0));
    const drawHeader = (top: number) => {
      doc.setFont('helvetica', 'bold').setFontSize(13);
      ['MODULE', 'TOP TERMS (Max 10)', 'Q VAL', 'GENES', 'TERMS'].forEach((text, index) => {
        doc.rect(xs[index] ?? 0, top, columns[index] ?? 0, 13 * 1.2 + pad);
        doc.text(text, (xs[index] ?? 0) + (columns[index] ?? 0) / 2, top + 13 + pad / 2, { align: 'center' });
      });
      return top + 13 * 1.2 + pad;
    };

    doc.addPage();
    let y = drawHeader(page.margin);
    doc.setFont('helvetica', 'normal').setFontSize(fontSize);
    for (const module of this.modules) {
      const all = this.termsOf(module);
      const terms = all.slice(0, 10).map((term) => ({ lines: doc.splitTextToSize(term.name, (columns[1] ?? 0) - pad * 2) as string[], q: qValue(term.q_value) }));
      const rows = terms.length ? terms : [{ lines: ['No terms available'], q: '' }];
      const height = rows.reduce((sum, row) => sum + row.lines.length * line + pad, 0);
      if (y + height > bottom) {
        doc.addPage();
        y = drawHeader(page.margin);
        doc.setFont('helvetica', 'normal').setFontSize(fontSize);
      }
      let rowTop = y;
      rows.forEach((row, index) => {
        const rowHeight = row.lines.length * line + pad;
        if (index % 2 === 0) doc.setFillColor(stripe).rect(xs[1] ?? 0, rowTop, (columns[1] ?? 0) + (columns[2] ?? 0), rowHeight, 'F');
        doc.text(row.lines, (xs[1] ?? 0) + pad, rowTop + fontSize);
        doc.text(row.q, (xs[2] ?? 0) + (columns[2] ?? 0) / 2, rowTop + fontSize, { align: 'center' });
        rowTop += rowHeight;
      });
      [module.label, '', '', String(module.genes.length), String(all.length)].forEach((text, index) => {
        if (index !== 2) doc.rect(xs[index] ?? 0, y, (columns[index] ?? 0) + (index === 1 ? (columns[2] ?? 0) : 0), height);
        if (text) doc.text(text, (xs[index] ?? 0) + pad, y + fontSize);
      });
      y += height;
    }

    const footer = `${now.toDateString()} - ${window.location.origin} - Gene Ontology ${this.versions.term}`;
    for (let number = 1; number <= doc.getNumberOfPages(); number++) {
      doc.setPage(number).setFont('helvetica', 'italic').setFontSize(8).text(footer, right, page.height - page.margin + 6, { align: 'right' });
    }
    return doc.output('blob');
  }
}

/** Q values to eight places, as the live site's report shows them, with anything that rounds to zero as "<1e-8". */
export function qValue(q: number): string {
  const fixed = q.toFixed(8);
  return Number(fixed) < 1e-8 ? '<1e-8' : fixed;
}
