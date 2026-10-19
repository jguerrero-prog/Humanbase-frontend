import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force';
import { select, type Selection } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { edgeBand, weakestBand } from './edgeBands';
import type { GraphData, GraphNode, GraphRenderer, GraphSelection, MountOptions } from './GraphRenderer';

const svgNs = 'http://www.w3.org/2000/svg';
const radius = { node: 6, query: 10, ring: 4 };
const layoutTicks = 300;
const padding = 40;

interface PlacedNode extends SimulationNodeDatum, GraphNode {
  x: number;
  y: number;
}

interface PlacedLink extends SimulationLinkDatum<PlacedNode> {
  source: PlacedNode;
  target: PlacedNode;
  weight: number;
}

function svgElement<K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const element = document.createElementNS(svgNs, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

/** A plain force-directed renderer. The layout is computed before anything is drawn, so the graph never drifts. */
export class ForceGraphRenderer implements GraphRenderer {
  private svg: SVGSVGElement | undefined;
  private canvas: SVGGElement | undefined;
  private zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | undefined;
  private svgSelection: Selection<SVGSVGElement, unknown, null, undefined> | undefined;
  private options: MountOptions | undefined;
  private nodes = new Map<string, SVGGElement>();
  private links: { element: SVGLineElement; source: string; target: string }[] = [];

  mount(container: HTMLElement, options: MountOptions): void {
    this.options = options;
    this.svg = svgElement('svg', { class: 'force-graph', role: 'group', 'aria-label': options.label });
    this.canvas = svgElement('g');
    this.svg.append(this.canvas);
    container.append(this.svg);
    this.svgSelection = select(this.svg);
    this.zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 6])
      .on('zoom', (event: { transform: { toString(): string } }) => this.canvas?.setAttribute('transform', event.transform.toString()));
    this.svgSelection.call(this.zoomBehavior);
  }

  render(data: GraphData): void {
    const { svg, canvas } = this;
    if (!svg || !canvas) return;
    const placed = this.layout(data);
    canvas.replaceChildren();
    this.nodes.clear();
    this.links = [];

    const linkLayer = svgElement('g', { class: 'force-graph-links' });
    for (const link of placed.links) {
      const band = edgeBand(link.weight) ?? weakestBand;
      const line = svgElement('line', { x1: link.source.x, y1: link.source.y, x2: link.target.x, y2: link.target.y });
      line.style.setProperty('--edge-color', `var(${band.color})`);
      line.style.setProperty('--edge-width', `var(${band.width})`);
      const hit = svgElement('line', { class: 'force-graph-hit', x1: link.source.x, y1: link.source.y, x2: link.target.x, y2: link.target.y });
      hit.addEventListener('click', () => this.options?.onSelectLink?.(link.source.id, link.target.id));
      linkLayer.append(line, hit);
      this.links.push({ element: line, source: link.source.id, target: link.target.id });
    }

    const nodeLayer = svgElement('g', { class: 'force-graph-nodes' });
    for (const node of placed.nodes) nodeLayer.append(this.drawNode(node));
    canvas.append(linkLayer, nodeLayer);

    const xs = placed.nodes.map((n) => n.x);
    const ys = placed.nodes.map((n) => n.y);
    const [minX, maxX, minY, maxY] = xs.length ? [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)] : [0, 0, 0, 0];
    svg.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2 + 60} ${maxY - minY + padding * 2}`);
    this.fit();
  }

  private drawNode(node: PlacedNode): SVGGElement {
    const kind = node.query ? 'query gene' : 'related gene';
    const group = svgElement('g', { class: node.query ? 'force-graph-node is-query' : 'force-graph-node', tabindex: 0, role: 'button', 'aria-label': `${node.label}, ${kind}`, transform: `translate(${node.x} ${node.y})` });
    const r = node.query ? radius.query : radius.node;
    const label = svgElement('text', { x: r + 4, y: 4 });
    label.textContent = node.label;
    group.append(svgElement('circle', { class: 'force-graph-ring', r: r + radius.ring }), svgElement('circle', { class: 'force-graph-dot', r }), label);
    const choose = () => this.options?.onSelectNode?.(node.id);
    group.addEventListener('click', choose);
    group.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      choose();
    });
    this.nodes.set(node.id, group);
    return group;
  }

  private layout(data: GraphData): { nodes: PlacedNode[]; links: PlacedLink[] } {
    const nodes: PlacedNode[] = data.nodes.map((node, index) => ({ ...node, x: Math.cos(index) * 100, y: Math.sin(index) * 100 }));
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const links = data.links.flatMap((link) => {
      const source = byId.get(link.source);
      const target = byId.get(link.target);
      return source && target ? [{ source, target, weight: link.weight }] : [];
    });
    forceSimulation(nodes)
      .force('link', forceLink<PlacedNode, PlacedLink>(links).distance((link) => 60 + (1 - link.weight) * 120).strength((link) => link.weight * 0.6))
      .force('charge', forceManyBody().strength(-260))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide<PlacedNode>().radius((node) => (node.query ? 34 : 26)))
      .stop()
      .tick(layoutTicks);
    return { nodes, links };
  }

  select(selection: GraphSelection): void {
    const linked = new Set<string>();
    if (selection?.kind === 'node') {
      linked.add(selection.id);
      for (const link of this.links) if (link.source === selection.id || link.target === selection.id) linked.add(link.source).add(link.target);
    }
    if (selection?.kind === 'link') linked.add(selection.source).add(selection.target);
    for (const [id, element] of this.nodes) {
      element.classList.toggle('is-selected', selection?.kind === 'node' && selection.id === id);
      element.classList.toggle('is-faded', selection !== null && !linked.has(id));
    }
    for (const { element, source, target } of this.links) {
      const isSelected = selection?.kind === 'link' && ((selection.source === source && selection.target === target) || (selection.source === target && selection.target === source));
      const touches = selection?.kind === 'node' && (source === selection.id || target === selection.id);
      element.classList.toggle('is-selected', isSelected);
      element.classList.toggle('is-faded', selection !== null && !isSelected && !touches);
    }
  }

  zoomBy(factor: number): void {
    if (this.svgSelection && this.zoomBehavior) this.svgSelection.call(this.zoomBehavior.scaleBy, factor);
  }

  fit(): void {
    if (this.svgSelection && this.zoomBehavior) this.svgSelection.call(this.zoomBehavior.transform, zoomIdentity);
  }

  exportSvg(): Blob {
    if (!this.svg) return new Blob([], { type: 'image/svg+xml' });
    const copy = this.svg.cloneNode(true) as SVGSVGElement;
    copy.setAttribute('xmlns', svgNs);
    const originals = this.svg.querySelectorAll<SVGElement>('*');
    copy.querySelectorAll<SVGElement>('*').forEach((element, index) => {
      const style = getComputedStyle(originals[index] as SVGElement);
      for (const property of ['fill', 'stroke', 'stroke-width', 'opacity', 'font', 'paint-order']) element.style.setProperty(property, style.getPropertyValue(property));
    });
    return new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' });
  }

  destroy(): void {
    this.svgSelection?.on('.zoom', null);
    this.svg?.remove();
    this.svg = undefined;
    this.canvas = undefined;
    this.nodes.clear();
    this.links = [];
  }
}
