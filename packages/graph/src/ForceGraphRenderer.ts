import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force';
import { polygonHull } from 'd3-polygon';
import { select, type Selection } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { standaloneSvg } from '@humanbase/ui';
import { edgeBand, weakestBand } from './edgeBands';
import type { GraphData, GraphFocus, GraphGroup, GraphHighlight, GraphLink, GraphNode, GraphRenderer, GraphSelection, MountOptions } from './GraphRenderer';

const svgNs = 'http://www.w3.org/2000/svg';
const radius = { node: 6, query: 10, ring: 4, member: 5, star: 3.5 };
const clusterGap = 190;
const layoutTicks = 300;
const padding = 40;
const maxStretch = 1.8;

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
  private groupOf = new Map<string, string>();
  private groupLabels = new Map<string, SVGGElement>();
  private placed = new Map<string, { x: number; y: number; r: number }>();
  private hullLayer: SVGGElement | undefined;
  private selectedLinkLayer: SVGGElement | undefined;
  private hoverLinkLayer: SVGGElement | undefined;
  private hovered: SVGGElement | undefined;
  private highlights: readonly GraphHighlight[] = [];
  private layoutKey: string | undefined;
  private positions = new Map<string, { x: number; y: number }>();

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
    const key = ForceGraphRenderer.layoutKeyOf(data);
    const fresh = key !== this.layoutKey;
    const placed = fresh ? this.placeAnew(data, svg) : this.placeAsBefore(data);
    this.layoutKey = key;
    canvas.replaceChildren();
    this.nodes.clear();
    this.links = [];
    this.groupOf = new Map(data.nodes.flatMap((node) => (node.group ? [[node.id, node.group]] : [])));
    this.groupLabels.clear();
    this.placed.clear();
    this.hullLayer = svgElement('g', { class: 'force-graph-hulls', 'aria-hidden': 'true' });

    const linkLayer = svgElement('g', { class: 'force-graph-links' });
    for (const link of placed.links) {
      const line = this.drawLine(link.source, link.target, link.weight);
      const hit = svgElement('line', { class: 'force-graph-hit', x1: link.source.x, y1: link.source.y, x2: link.target.x, y2: link.target.y });
      hit.addEventListener('click', () => this.options?.onSelectLink?.(link.source.id, link.target.id));
      linkLayer.append(line, hit);
      this.links.push({ element: line, source: link.source.id, target: link.target.id });
    }

    const groups = new Map((data.groups ?? []).map((group) => [group.id, group]));
    const nodeLayer = svgElement('g', { class: 'force-graph-nodes' });
    for (const node of placed.nodes) nodeLayer.append(this.drawNode(node, node.group ? groups.get(node.group) : undefined));
    this.selectedLinkLayer = svgElement('g', { class: 'force-graph-links force-graph-focus-links', 'aria-hidden': 'true' });
    this.hoverLinkLayer = svgElement('g', { class: 'force-graph-links force-graph-focus-links', 'aria-hidden': 'true' });
    this.hovered = undefined;
    canvas.append(this.hullLayer, linkLayer, this.selectedLinkLayer, this.hoverLinkLayer, nodeLayer);
    if (data.groups) canvas.append(this.drawGroupLabels(placed.nodes, data.groups));

    const xs = placed.nodes.map((n) => n.x);
    const ys = placed.nodes.map((n) => n.y);
    const [minX, maxX, minY, maxY] = xs.length ? [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)] : [0, 0, 0, 0];
    this.highlight(this.highlights);
    svg.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2 + 60} ${maxY - minY + padding * 2}`);
    if (fresh) this.fit();
  }

  setLabel(label: string): void {
    this.svg?.setAttribute('aria-label', label);
  }

  /** What the layout depends on; gene names and group labels are left out, so renaming moves nothing. */
  private static layoutKeyOf(data: GraphData): string {
    const nodes = data.nodes.map((node) => (data.groups ? `${node.id}:${node.group ?? ''}` : `${node.id}:${node.query}`));
    const links = data.groups ? [] : data.links.map((link) => `${link.source}-${link.target}:${link.weight}`);
    return JSON.stringify([data.groups?.map((group) => group.id) ?? null, nodes, links]);
  }

  private placeAnew(data: GraphData, svg: SVGSVGElement): { nodes: PlacedNode[]; links: PlacedLink[] } {
    const placed = data.groups ? this.clusterLayout(data, data.groups) : this.layout(data);
    if (!data.groups) this.stretchToFit(placed.nodes, svg);
    this.positions = new Map(placed.nodes.map((node) => [node.id, { x: node.x, y: node.y }]));
    return placed;
  }

  private placeAsBefore(data: GraphData): { nodes: PlacedNode[]; links: PlacedLink[] } {
    const nodes = data.nodes.map((node) => ({ ...node, ...(this.positions.get(node.id) ?? { x: 0, y: 0 }) }));
    return { nodes, links: ForceGraphRenderer.linksBetween(nodes, data.links) };
  }

  private static linksBetween(nodes: PlacedNode[], links: readonly GraphLink[]): PlacedLink[] {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    return links.flatMap((link) => {
      const source = byId.get(link.source);
      const target = byId.get(link.target);
      return source && target ? [{ source, target, weight: link.weight }] : [];
    });
  }

  private drawLine(from: { x: number; y: number }, to: { x: number; y: number }, weight: number): SVGLineElement {
    const band = edgeBand(weight) ?? weakestBand;
    const line = svgElement('line', { x1: from.x, y1: from.y, x2: to.x, y2: to.y });
    line.style.setProperty('--edge-color', `var(${band.color})`);
    line.style.setProperty('--edge-width', `var(${band.width})`);
    return line;
  }

  /** Draws links between placed genes into a layer of their own, replacing what it held. */
  private drawFocusLinks(layer: SVGGElement | undefined, links: readonly GraphLink[]): void {
    layer?.replaceChildren(
      ...links.flatMap((link) => {
        const from = this.placed.get(link.source);
        const to = this.placed.get(link.target);
        return from && to ? [this.drawLine(from, to, link.weight)] : [];
      }),
    );
  }

  private drawNode(node: PlacedNode, cluster?: GraphGroup): SVGGElement {
    const kind = cluster ? cluster.label : node.query ? 'query gene' : 'related gene';
    const classes = ['force-graph-node', node.query && 'is-query', cluster && 'is-member'].filter(Boolean).join(' ');
    const group = svgElement('g', { class: classes, tabindex: 0, role: 'button', 'aria-label': `${node.label}, ${kind}`, transform: `translate(${node.x} ${node.y})` });
    if (cluster) group.style.setProperty('--node-color', `var(${cluster.color})`);
    const r = cluster ? radius.member : node.query ? radius.query : radius.node;
    this.placed.set(node.id, { x: node.x, y: node.y, r });
    group.append(svgElement('circle', { class: 'force-graph-ring', r: r + radius.ring }), svgElement('circle', { class: 'force-graph-dot', r }));
    if (!cluster) {
      const label = svgElement('text', { x: r + 4, y: 4 });
      label.textContent = node.label;
      group.append(label);
    }
    this.whenChosen(group, () => this.options?.onSelectNode?.(node.id));
    const dot = group.lastElementChild as SVGCircleElement;
    const hoverStart = () => this.options?.onHoverNode?.(node.id, dot.getBoundingClientRect());
    const hoverEnd = () => this.options?.onHoverNode?.(null);
    group.addEventListener('pointerenter', hoverStart);
    group.addEventListener('focus', hoverStart);
    group.addEventListener('pointerleave', hoverEnd);
    group.addEventListener('blur', hoverEnd);
    this.nodes.set(node.id, group);
    return group;
  }

  private layout(data: GraphData): { nodes: PlacedNode[]; links: PlacedLink[] } {
    const nodes: PlacedNode[] = data.nodes.map((node, index) => ({ ...node, x: Math.cos(index) * 100, y: Math.sin(index) * 100 }));
    const links = ForceGraphRenderer.linksBetween(nodes, data.links);
    forceSimulation(nodes)
      .force('link', forceLink<PlacedNode, PlacedLink>(links).distance((link) => 90 + (1 - link.weight) * 160).strength((link) => link.weight * 0.6))
      .force('charge', forceManyBody().strength(-420))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide<PlacedNode>().radius((node) => (node.query ? 40 : 32)))
      .stop()
      .tick(layoutTicks);
    return { nodes, links };
  }

  /** Each group gets its own spot on a grid, so modules read as separate clusters. */
  private clusterLayout(data: GraphData, groups: readonly GraphGroup[]): { nodes: PlacedNode[]; links: PlacedLink[] } {
    const columns = Math.max(1, Math.ceil(Math.sqrt(groups.length * 1.6)));
    const centers = new Map(groups.map((group, index) => [group.id, { x: (index % columns) * clusterGap, y: Math.floor(index / columns) * clusterGap }]));
    const centerOf = (node: GraphNode) => centers.get(node.group ?? '') ?? { x: 0, y: 0 };
    const nodes: PlacedNode[] = data.nodes.map((node, index) => ({ ...node, x: centerOf(node).x + Math.cos(index) * 20, y: centerOf(node).y + Math.sin(index) * 20 }));
    const links = ForceGraphRenderer.linksBetween(nodes, data.links);
    forceSimulation(nodes)
      .force('x', forceX<PlacedNode>((node) => centerOf(node).x).strength(0.35))
      .force('y', forceY<PlacedNode>((node) => centerOf(node).y).strength(0.35))
      .force('charge', forceManyBody().strength(-18))
      .force('collide', forceCollide<PlacedNode>().radius(radius.member + 3))
      .stop()
      .tick(layoutTicks);
    return { nodes, links };
  }

  private drawGroupLabels(nodes: PlacedNode[], groups: readonly GraphGroup[]): SVGGElement {
    const layer = svgElement('g', { class: 'force-graph-groups' });
    for (const cluster of groups) {
      const members = nodes.filter((node) => node.group === cluster.id);
      if (!members.length) continue;
      const x = members.reduce((sum, node) => sum + node.x, 0) / members.length;
      const y = Math.min(...members.map((node) => node.y)) - 16;
      const label = svgElement('g', { class: 'force-graph-group', tabindex: 0, role: 'button', 'aria-label': `${cluster.label}, ${members.length} ${members.length === 1 ? 'gene' : 'genes'}`, transform: `translate(${x} ${y})` });
      const text = svgElement('text', { 'text-anchor': 'middle' });
      text.textContent = cluster.label;
      label.append(text);
      this.whenChosen(label, () => this.options?.onSelectGroup?.(cluster.id));
      this.groupLabels.set(cluster.id, label);
      layer.append(label);
    }
    return layer;
  }

  private whenChosen(element: SVGElement, choose: () => void): void {
    element.addEventListener('click', choose);
    element.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      choose();
    });
  }

  // Force layouts come out roughly round; widen them to use a wide graph area without crowding labels.
  private stretchToFit(nodes: PlacedNode[], svg: SVGSVGElement): void {
    const box = svg.getBoundingClientRect();
    if (!nodes.length || !box.width || !box.height) return;
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const spread = (Math.max(...xs) - Math.min(...xs) || 1) / (Math.max(...ys) - Math.min(...ys) || 1);
    const stretch = Math.min(maxStretch, Math.max(1, box.width / box.height / spread));
    for (const node of nodes) node.x *= stretch;
  }

  select(selection: GraphSelection): void {
    const linked = new Set<string>();
    if (selection?.kind === 'node') {
      linked.add(selection.id);
      for (const link of [...this.links, ...(selection.links ?? [])]) if (link.source === selection.id || link.target === selection.id) linked.add(link.source).add(link.target);
    }
    if (selection?.kind === 'link') linked.add(selection.source).add(selection.target);
    if (selection?.kind === 'group') for (const [id, group] of this.groupOf) if (group === selection.id) linked.add(id);
    this.drawFocusLinks(this.selectedLinkLayer, selection?.kind === 'node' ? (selection.links ?? []) : []);
    const nodeGroup = selection?.kind === 'node' && selection.links ? this.groupOf.get(selection.id) : undefined;
    const linkedGroups = new Set([...linked].flatMap((id) => this.groupOf.get(id) ?? []));
    for (const [id, label] of this.groupLabels) {
      label.classList.toggle('is-selected', (selection?.kind === 'group' && selection.id === id) || nodeGroup === id);
      label.classList.toggle('is-faded', (selection?.kind === 'group' && selection.id !== id) || (nodeGroup !== undefined && !linkedGroups.has(id)));
    }
    for (const [id, element] of this.nodes) {
      element.classList.toggle('is-selected', selection?.kind === 'node' && selection.id === id);
      element.classList.toggle('is-faded', selection !== null && !linked.has(id));
    }
    for (const { element, source, target } of this.links) {
      const isSelected = selection?.kind === 'link' && ((selection.source === source && selection.target === target) || (selection.source === target && selection.target === source));
      const touches = (selection?.kind === 'node' && (source === selection.id || target === selection.id)) || (selection?.kind === 'group' && linked.has(source) && linked.has(target));
      element.classList.toggle('is-selected', isSelected);
      element.classList.toggle('is-faded', selection !== null && !isSelected && !touches);
    }
  }

  hover(focus: GraphFocus | null): void {
    this.hovered?.classList.remove('is-hovered');
    this.hovered = focus ? this.nodes.get(focus.id) : undefined;
    this.hovered?.classList.add('is-hovered');
    this.drawFocusLinks(this.hoverLinkLayer, focus?.links ?? []);
  }

  highlight(sets: readonly GraphHighlight[]): void {
    this.highlights = sets;
    for (const element of this.nodes.values()) element.querySelector('.force-graph-stars')?.remove();
    this.hullLayer?.replaceChildren();
    sets.forEach((set) => {
      const points = set.nodes.flatMap((id) => {
        const at = this.placed.get(id);
        return at ? [[at.x, at.y] as [number, number]] : [];
      });
      if (!points.length || !this.hullLayer) return;
      const outline = (points.length > 2 ? polygonHull(points) : null) ?? points;
      const hull = svgElement('path', { class: 'force-graph-hull', d: `M${outline.map(([x, y]) => `${x} ${y}`).join('L')}Z` });
      hull.style.setProperty('--set-color', `var(${set.color})`);
      this.hullLayer.append(hull);
    });
    // Rings stack outward in starring order, with an ink edge outside the last one so light colors still read on white.
    for (const [id, element] of this.nodes) {
      const colors = sets.filter((set) => set.nodes.includes(id)).map((set) => set.color);
      const at = this.placed.get(id);
      if (!colors.length || !at) continue;
      const rings = svgElement('g', { class: 'force-graph-stars' });
      colors.forEach((color, index) => {
        const ring = svgElement('circle', { class: 'force-graph-star', r: at.r + radius.star * (index + 1) });
        ring.style.setProperty('--set-color', `var(${color})`);
        rings.append(ring);
      });
      rings.append(svgElement('circle', { class: 'force-graph-star-edge', r: at.r + radius.star * colors.length + 2 }));
      element.prepend(rings);
    }
  }

  zoomBy(factor: number): void {
    if (this.svgSelection && this.zoomBehavior) this.svgSelection.call(this.zoomBehavior.scaleBy, factor);
  }

  fit(): void {
    if (this.svgSelection && this.zoomBehavior) this.svgSelection.call(this.zoomBehavior.transform, zoomIdentity);
  }

  exportSvg(): Blob {
    return this.svg ? standaloneSvg(this.svg) : new Blob([], { type: 'image/svg+xml' });
  }

  destroy(): void {
    this.svgSelection?.on('.zoom', null);
    this.svg?.remove();
    this.svg = undefined;
    this.canvas = undefined;
    this.nodes.clear();
    this.links = [];
    this.groupLabels.clear();
    this.placed.clear();
    this.layoutKey = undefined;
    this.positions.clear();
    this.hullLayer = undefined;
    this.selectedLinkLayer = undefined;
    this.hoverLinkLayer = undefined;
    this.hovered = undefined;
  }
}
