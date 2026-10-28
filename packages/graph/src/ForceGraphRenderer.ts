import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force';
import { polygonHull } from 'd3-polygon';
import { select, type Selection } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { standaloneSvg } from '@humanbase/ui';
import { edgeBand, weakestBand } from './edgeBands';
import type { GraphData, GraphFocus, GraphGroup, GraphHighlight, GraphLink, GraphNode, GraphRenderer, GraphSelection, MountOptions } from './GraphRenderer';

const svgNs = 'http://www.w3.org/2000/svg';
const radius = { node: 6, query: 10, ring: 4, member: 5, star: 3.5 };
const layoutTicks = 300;
const clusterTicks = 200;
const padding = 16;
const maxStretch = 1.8;
const spiralStep = 8;
const goldenAngle = Math.PI * (3 - Math.sqrt(5));
const bendShare = 0.15;
const maxBend = 36;
const label = { size: 12, querySize: 14, charWidth: 0.62, padX: 10, padY: 6, gap: 3 };
const group = { hullPad: 10, gap: 40, labelSize: 14, labelHeight: 22, hullSamples: 12, labelPadX: 12 };
const force = { linkLength: 90, weakLinkStretch: 160, linkStrength: 0.6, charge: -420, queryPull: 0.3, pull: 0.02, queryCollide: 44, collide: 36 };
const clusterForce = { linkGap: 12, linkStrength: 0.2, charge: -14, pull: 0.12, collideGap: 2 };
const zoomRange: [number, number] = [0.25, 6];
const denseLinks = 80;
const gridCell = 48;

interface PlacedNode extends SimulationNodeDatum, GraphNode {
  x: number;
  y: number;
}

interface PlacedLink extends SimulationLinkDatum<PlacedNode> {
  source: PlacedNode;
  target: PlacedNode;
  weight: number;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawnLink {
  element: SVGPathElement;
  source: string;
  target: string;
}

function svgElement<K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const element = document.createElementNS(svgNs, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const round = (value: number) => Math.round(value * 100) / 100;
const hullPath = (outline: readonly (readonly [number, number])[]) => `M${outline.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}Z`;
const labelWidth = (text: string, size: number) => text.length * size * label.charWidth + label.padX;

/** Boxes filed by grid cell, so checking a spot looks only at the boxes near it. */
class BoxGrid {
  private cells = new Map<string, Box[]>();

  private *cellsOf(box: Box): Generator<string> {
    for (let x = Math.floor(box.x / gridCell); x <= Math.floor((box.x + box.width) / gridCell); x++)
      for (let y = Math.floor(box.y / gridCell); y <= Math.floor((box.y + box.height) / gridCell); y++) yield `${x},${y}`;
  }

  add(box: Box): void {
    for (const cell of this.cellsOf(box)) {
      const boxes = this.cells.get(cell);
      if (boxes) boxes.push(box);
      else this.cells.set(cell, [box]);
    }
  }

  overlapsAny(box: Box, except?: Box): boolean {
    for (const cell of this.cellsOf(box)) if (this.cells.get(cell)?.some((other) => other !== except && overlaps(box, other))) return true;
    return false;
  }
}

/** A gentle arc between two genes that always bends the same way, so links that would overlap as straight lines separate. */
export function edgeCurve(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const [a, b] = from.x < to.x || (from.x === to.x && from.y < to.y) ? [from, to] : [to, from];
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const bend = Math.min(length * bendShare, maxBend);
  const [nx, ny] = length ? [(a.y - b.y) / length, (b.x - a.x) / length] : [0, 0];
  const control = { x: (a.x + b.x) / 2 + nx * bend, y: (a.y + b.y) / 2 + ny * bend };
  return `M${round(a.x)} ${round(a.y)}Q${round(control.x)} ${round(control.y)} ${round(b.x)} ${round(b.y)}`;
}

/**
 * A force-directed renderer in the style of humanbase.io's: curved connections, labels above the genes and,
 * for groups, one outlined cluster per module. The layout is computed before anything is drawn, so the graph never drifts.
 */
export class ForceGraphRenderer implements GraphRenderer {
  private svg: SVGSVGElement | undefined;
  private canvas: SVGGElement | undefined;
  private zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | undefined;
  private svgSelection: Selection<SVGSVGElement, unknown, null, undefined> | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private options: MountOptions | undefined;
  private nodes = new Map<string, SVGGElement>();
  private labels = new Map<string, SVGGElement>();
  private links: DrawnLink[] = [];
  private neighbors = new Map<string, Set<string>>();
  private groupOf = new Map<string, string>();
  private groups = new Map<string, GraphGroup>();
  private groupLabels = new Map<string, SVGGElement>();
  private groupHulls = new Map<string, SVGPathElement>();
  private placed = new Map<string, { x: number; y: number; r: number }>();
  private hullLayer: SVGGElement | undefined;
  private selectedLinkLayer: SVGGElement | undefined;
  private hoverLinkLayer: SVGGElement | undefined;
  private hovered: GraphFocus | null = null;
  private hoveredGroup: string | null = null;
  private highlights: readonly GraphHighlight[] = [];
  private layoutKey: string | undefined;
  private positions = new Map<string, { x: number; y: number }>();
  private largest = 1;
  private viewBox: Box | undefined;
  private scale = 1;

  mount(container: HTMLElement, options: MountOptions): void {
    this.options = options;
    this.svg = svgElement('svg', { class: 'force-graph', role: 'group', 'aria-label': options.label });
    this.canvas = svgElement('g');
    this.svg.append(this.canvas);
    container.append(this.svg);
    this.svgSelection = select(this.svg);
    this.zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent(zoomRange)
      .on('zoom', (event: { transform: { k: number; toString(): string } }) => {
        this.canvas?.setAttribute('transform', event.transform.toString());
        this.scale = event.transform.k;
        this.updateLabelScale();
      });
    this.svgSelection.call(this.zoomBehavior);
    this.svg.addEventListener('click', (event) => {
      if (event.target === this.svg) this.options?.onClearSelection?.();
    });
    this.svg.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.options?.onClearSelection?.();
    });
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updateLabelScale());
      this.resizeObserver.observe(this.svg);
    }
  }

  render(data: GraphData): void {
    const { svg, canvas } = this;
    if (!svg || !canvas) return;
    this.largest = Math.max(1, ...data.nodes.map((node) => node.size ?? 1));
    const key = ForceGraphRenderer.layoutKeyOf(data);
    const fresh = key !== this.layoutKey;
    const placed = fresh ? this.placeAnew(data, svg) : this.placeAsBefore(data);
    this.layoutKey = key;
    const focusedNode = ForceGraphRenderer.idOf(this.nodes, document.activeElement);
    const focusedGroup = ForceGraphRenderer.idOf(this.groupLabels, document.activeElement);
    canvas.replaceChildren();
    this.nodes.clear();
    this.labels.clear();
    this.links = [];
    this.groupOf = new Map(data.nodes.flatMap((node) => (node.group ? [[node.id, node.group]] : [])));
    this.groups = new Map((data.groups ?? []).map((cluster) => [cluster.id, cluster]));
    this.groupLabels.clear();
    this.groupHulls.clear();
    this.placed = new Map(placed.nodes.map((node) => [node.id, { x: node.x, y: node.y, r: this.radiusOf(node, Boolean(node.group && data.groups)) }]));
    this.neighbors = ForceGraphRenderer.neighborsOf(placed.links);
    this.hullLayer = svgElement('g', { class: 'force-graph-hulls', 'aria-hidden': 'true' });

    const bounds: Box[] = placed.nodes.map((node) => {
      const r = this.placed.get(node.id)?.r ?? radius.node;
      return { x: node.x - r, y: node.y - r, width: r * 2, height: r * 2 };
    });
    const groupHullLayer = svgElement('g', { class: 'force-graph-group-hulls' });
    const anchors = data.groups ? this.drawGroupHulls(groupHullLayer, placed.nodes, data.groups, bounds) : new Map<string, { x: number; y: number }>();

    const linkLayer = svgElement('g', { class: 'force-graph-links' });
    if (!data.linksHidden) for (const link of placed.links) linkLayer.append(...this.drawLink(link.source.id, link.target.id, link.weight));
    svg.classList.toggle('is-dense', this.links.length > denseLinks);

    const nodeLayer = svgElement('g', { class: 'force-graph-nodes' });
    for (const node of placed.nodes) nodeLayer.append(this.drawNode(node, node.group ? this.groups.get(node.group) : undefined));
    const labelLayer = svgElement('g', { class: 'force-graph-labels', 'aria-hidden': 'true' });
    if (!data.groups) this.drawLabels(labelLayer, placed.nodes, bounds);
    this.selectedLinkLayer = svgElement('g', { class: 'force-graph-links force-graph-focus-links', 'aria-hidden': 'true' });
    this.hoverLinkLayer = svgElement('g', { class: 'force-graph-links force-graph-focus-links', 'aria-hidden': 'true' });
    canvas.append(this.hullLayer, groupHullLayer, linkLayer, this.selectedLinkLayer, this.hoverLinkLayer, nodeLayer, labelLayer);
    if (data.groups) canvas.append(this.drawGroupLabels(anchors, placed.nodes, data.groups));

    this.viewBox = this.boundsOf(bounds, Boolean(data.groups));
    svg.setAttribute('viewBox', `${round(this.viewBox.x)} ${round(this.viewBox.y)} ${round(this.viewBox.width)} ${round(this.viewBox.height)}`);
    this.highlight(this.highlights);
    this.applyHover();
    this.updateLabelScale();
    if (fresh) this.fit();
    (this.nodes.get(focusedNode ?? '') ?? this.groupLabels.get(focusedGroup ?? ''))?.focus({ preventScroll: true });
  }

  private static idOf(elements: ReadonlyMap<string, Element>, element: Element | null): string | undefined {
    for (const [id, drawn] of elements) if (drawn === element) return id;
    return undefined;
  }

  setLabel(text: string): void {
    this.svg?.setAttribute('aria-label', text);
  }

  /** What the layout depends on; gene names and group labels are left out, so renaming moves nothing. */
  private static layoutKeyOf(data: GraphData): string {
    const nodes = data.nodes.map((node) => `${node.id}:${data.groups ? (node.group ?? '') : node.query}:${node.size ?? ''}`);
    const links = data.links.map((link) => `${link.source}-${link.target}:${link.weight}`);
    return JSON.stringify([data.groups?.map((cluster) => cluster.id) ?? null, nodes, links]);
  }

  private static neighborsOf(links: readonly PlacedLink[]): Map<string, Set<string>> {
    const neighbors = new Map<string, Set<string>>();
    const add = (a: string, b: string) => neighbors.set(a, (neighbors.get(a) ?? new Set()).add(b));
    for (const link of links) {
      add(link.source.id, link.target.id);
      add(link.target.id, link.source.id);
    }
    return neighbors;
  }

  private placeAnew(data: GraphData, svg: SVGSVGElement): { nodes: PlacedNode[]; links: PlacedLink[] } {
    const placed = data.groups ? this.clusterLayout(data, data.groups, svg) : this.layout(data);
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

  /** A connection inside a group takes the group's color and one between groups stays neutral; otherwise its band's. */
  private linkPath(source: string, target: string, weight: number): SVGPathElement | undefined {
    const from = this.placed.get(source);
    const to = this.placed.get(target);
    if (!from || !to) return undefined;
    const band = edgeBand(weight) ?? weakestBand;
    const path = svgElement('path', { d: edgeCurve(from, to) });
    const sourceGroup = this.groupOf.get(source);
    const within = sourceGroup !== undefined && sourceGroup === this.groupOf.get(target);
    if (this.groups.size) path.classList.add(within ? 'is-within' : 'is-between');
    path.style.setProperty('--edge-color', within ? `var(${this.groups.get(sourceGroup)?.color})` : `var(${band.color})`);
    path.style.setProperty('--edge-width', `var(${band.width})`);
    path.style.setProperty('--edge-opacity', String(band.opacity));
    return path;
  }

  private drawLink(source: string, target: string, weight: number): SVGPathElement[] {
    const path = this.linkPath(source, target, weight);
    if (!path) return [];
    const hit = svgElement('path', { class: 'force-graph-hit', d: path.getAttribute('d') ?? '' });
    hit.addEventListener('click', () => this.options?.onSelectLink?.(source, target));
    hit.addEventListener('pointerenter', (event) => {
      path.classList.add('is-hovered');
      this.options?.onHoverLink?.({ source, target, anchor: new DOMRect(event.clientX, event.clientY, 0, 0) });
    });
    hit.addEventListener('pointerleave', () => {
      path.classList.remove('is-hovered');
      this.options?.onHoverLink?.(null);
    });
    this.links.push({ element: path, source, target });
    return [path, hit];
  }

  /** Draws links between placed genes into a layer of their own, replacing what it held. */
  private drawFocusLinks(layer: SVGGElement | undefined, links: readonly GraphLink[]): void {
    layer?.replaceChildren(...links.flatMap((link) => this.linkPath(link.source, link.target, link.weight) ?? []));
  }

  private drawNode(node: PlacedNode, cluster?: GraphGroup): SVGGElement {
    const kind = cluster ? cluster.label : node.query ? 'query gene' : 'related gene';
    const classes = ['force-graph-node', node.query && 'is-query', cluster && 'is-member', cluster?.ring && 'is-ring'].filter(Boolean).join(' ');
    const element = svgElement('g', { class: classes, tabindex: 0, role: 'button', 'aria-label': `${node.label}, ${kind}`, transform: `translate(${round(node.x)} ${round(node.y)})` });
    if (cluster) element.style.setProperty('--node-color', `var(${cluster.color})`);
    const r = this.placed.get(node.id)?.r ?? radius.node;
    const dot = svgElement('circle', { class: 'force-graph-dot', r });
    element.append(svgElement('circle', { class: 'force-graph-ring', r: r + radius.ring }), dot);
    this.whenChosen(element, () => this.options?.onSelectNode?.(node.id));
    const hoverStart = () => this.options?.onHoverNode?.(node.id, dot.getBoundingClientRect());
    const hoverEnd = () => this.options?.onHoverNode?.(null);
    element.addEventListener('pointerenter', hoverStart);
    element.addEventListener('focus', hoverStart);
    element.addEventListener('pointerleave', hoverEnd);
    element.addEventListener('blur', hoverEnd);
    this.nodes.set(node.id, element);
    return element;
  }

  /**
   * Labels sit above their gene on a pill, or below, right or left when that spot is taken. Query genes and the
   * best-connected genes are placed first; a label with no free spot shows only while its gene is hovered or selected.
   */
  private drawLabels(layer: SVGGElement, nodes: readonly PlacedNode[], bounds: Box[]): void {
    const degree = (node: PlacedNode) => this.neighbors.get(node.id)?.size ?? 0;
    const order = [...nodes].sort((a, b) => Number(b.query) - Number(a.query) || degree(b) - degree(a) || a.label.localeCompare(b.label));
    const dots = new Map(nodes.map((node, index) => [node.id, bounds[index] as Box]));
    const taken = new BoxGrid();
    for (const dot of dots.values()) taken.add(dot);
    for (const node of order) {
      const size = node.query ? label.querySize : label.size;
      const width = labelWidth(node.label, size);
      const height = size + label.padY;
      const r = this.placed.get(node.id)?.r ?? radius.node;
      const spots = [
        [0, -(r + label.gap + height / 2)],
        [0, r + label.gap + height / 2],
        [r + label.gap + width / 2, 0],
        [-(r + label.gap + width / 2), 0],
      ] as const;
      const boxAt = ([dx, dy]: readonly [number, number]): Box => ({ x: node.x + dx - width / 2, y: node.y + dy - height / 2, width, height });
      const free = spots.find((spot) => !taken.overlapsAny(boxAt(spot), dots.get(node.id)));
      const [dx, dy] = free ?? spots[0];
      const element = svgElement('g', { class: ['force-graph-label', node.query && 'is-query', !free && 'is-collapsed'].filter(Boolean).join(' '), transform: `translate(${round(node.x + dx)} ${round(node.y + dy)})` });
      element.style.setProperty('--label-size', `${size}px`);
      const text = svgElement('text', { 'text-anchor': 'middle', dy: '0.35em' });
      text.textContent = node.label;
      element.append(svgElement('rect', { x: round(-width / 2), y: round(-height / 2), width: round(width), height, rx: 4 }), text);
      layer.append(element);
      this.labels.set(node.id, element);
      if (free) {
        taken.add(boxAt(free));
        bounds.push(boxAt(free));
      }
    }
  }

  // Radius follows the square root of size, as in humanbase.io's d3 pack, between the node and query gene radii.
  private radiusOf(node: GraphNode, member: boolean): number {
    if (node.size !== undefined) return this.largest > 1 ? radius.node + ((radius.query - radius.node) * (Math.sqrt(node.size) - 1)) / (Math.sqrt(this.largest) - 1) : radius.node;
    return member ? radius.member : node.query ? radius.query : radius.node;
  }

  /** Query genes are pulled to the middle, with their related genes around them. */
  private layout(data: GraphData): { nodes: PlacedNode[]; links: PlacedLink[] } {
    const nodes: PlacedNode[] = data.nodes.map((node, index) => ({ ...node, x: Math.cos(index) * 100, y: Math.sin(index) * 100 }));
    const links = ForceGraphRenderer.linksBetween(nodes, data.links);
    const pull = (node: PlacedNode) => (node.query ? force.queryPull : force.pull);
    forceSimulation(nodes)
      .force('link', forceLink<PlacedNode, PlacedLink>(links).distance((link) => force.linkLength + (1 - link.weight) * force.weakLinkStretch).strength((link) => link.weight * force.linkStrength))
      .force('charge', forceManyBody().strength(force.charge))
      .force('center', forceCenter(0, 0))
      .force('x', forceX<PlacedNode>(0).strength(pull))
      .force('y', forceY<PlacedNode>(0).strength(pull))
      .force('collide', forceCollide<PlacedNode>().radius((node) => (node.query ? force.queryCollide : force.collide)))
      .stop()
      .tick(layoutTicks);
    return { nodes, links };
  }

  /**
   * Each group is laid out on its own connections, so its hubs sit in the middle, then the groups are packed
   * largest first from the center outward, with a gap that keeps their genes from mixing.
   */
  private clusterLayout(data: GraphData, groups: readonly GraphGroup[], svg: SVGSVGElement): { nodes: PlacedNode[]; links: PlacedLink[] } {
    const rank = ForceGraphRenderer.largestFirstInGroup(data.nodes);
    const nodes: PlacedNode[] = data.nodes.map((node) => {
      const at = rank.get(node.id) ?? 0;
      const distance = spiralStep * Math.sqrt(at);
      return { ...node, x: Math.cos(at * goldenAngle) * distance, y: Math.sin(at * goldenAngle) * distance };
    });
    const links = ForceGraphRenderer.linksBetween(nodes, data.links);
    const clusters = groups.flatMap((cluster) => {
      const members = nodes.filter((node) => node.group === cluster.id);
      if (!members.length) return [];
      const inside = links.filter((link) => link.source.group === cluster.id && link.target.group === cluster.id).map((link) => ({ ...link }));
      forceSimulation(members)
        .force('link', forceLink<PlacedNode, PlacedLink>(inside).distance((link) => this.radiusOf(link.source, true) + this.radiusOf(link.target, true) + clusterForce.linkGap).strength(clusterForce.linkStrength))
        .force('charge', forceManyBody().strength(clusterForce.charge))
        .force('x', forceX<PlacedNode>(0).strength(clusterForce.pull))
        .force('y', forceY<PlacedNode>(0).strength(clusterForce.pull))
        .force('collide', forceCollide<PlacedNode>().radius((node) => this.radiusOf(node, true) + clusterForce.collideGap))
        .stop()
        .tick(clusterTicks);
      const cx = members.reduce((sum, node) => sum + node.x, 0) / members.length;
      const cy = members.reduce((sum, node) => sum + node.y, 0) / members.length;
      for (const node of members) {
        node.x -= cx;
        node.y -= cy;
      }
      return [{ members, r: Math.max(...members.map((node) => Math.hypot(node.x, node.y) + this.radiusOf(node, true))) + group.hullPad }];
    });
    const box = svg.getBoundingClientRect();
    const aspect = box.width && box.height ? Math.min(maxStretch, Math.max(1, box.width / box.height)) : 1;
    const packed: { x: number; y: number; r: number }[] = [];
    for (const cluster of [...clusters].sort((a, b) => b.r - a.r)) {
      let at = { x: 0, y: 0 };
      for (let step = 0; packed.some((other) => Math.hypot(other.x - at.x, other.y - at.y) < other.r + cluster.r + group.gap); step++) {
        const distance = spiralStep * Math.sqrt(step);
        at = { x: Math.cos(step * goldenAngle) * distance * aspect, y: Math.sin(step * goldenAngle) * distance };
      }
      packed.push({ ...at, r: cluster.r });
      for (const node of cluster.members) {
        node.x += at.x;
        node.y += at.y;
      }
    }
    return { nodes, links };
  }

  /** Each gene's place in its group, largest first, so a group starts as a spiral around its most connected gene, as humanbase.io's pack centers it. */
  private static largestFirstInGroup(nodes: readonly GraphNode[]): Map<string, number> {
    const counted = new Map<string, number>();
    const rank = new Map<string, number>();
    for (const node of [...nodes].sort((a, b) => (b.size ?? 1) - (a.size ?? 1))) {
      const key = node.group ?? '';
      rank.set(node.id, counted.get(key) ?? 0);
      counted.set(key, (counted.get(key) ?? 0) + 1);
    }
    return rank;
  }

  /** A soft outline around each group's genes; returns where each group's label goes, centered on its top edge. */
  private drawGroupHulls(layer: SVGGElement, nodes: readonly PlacedNode[], groups: readonly GraphGroup[], bounds: Box[]): Map<string, { x: number; y: number }> {
    const anchors = new Map<string, { x: number; y: number }>();
    for (const cluster of groups) {
      const points = nodes
        .filter((node) => node.group === cluster.id)
        .flatMap((node) => {
          const r = (this.placed.get(node.id)?.r ?? radius.member) + group.hullPad;
          return Array.from({ length: group.hullSamples }, (_, index) => {
            const angle = (index / group.hullSamples) * Math.PI * 2;
            return [node.x + Math.cos(angle) * r, node.y + Math.sin(angle) * r] as [number, number];
          });
        });
      const outline = polygonHull(points);
      if (!outline) continue;
      const xs = outline.map(([x]) => x);
      const ys = outline.map(([, y]) => y);
      const hull = svgElement('path', { class: ['force-graph-group-hull', cluster.ring && 'is-ring'].filter(Boolean).join(' '), d: hullPath(outline) });
      hull.style.setProperty('--group-color', `var(${cluster.color})`);
      hull.addEventListener('click', () => this.options?.onSelectGroup?.(cluster.id));
      hull.addEventListener('pointerenter', () => this.options?.onHoverGroup?.(cluster.id));
      hull.addEventListener('pointerleave', () => this.options?.onHoverGroup?.(null));
      layer.append(hull);
      this.groupHulls.set(cluster.id, hull);
      anchors.set(cluster.id, { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: Math.min(...ys) });
      bounds.push({ x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) });
    }
    return anchors;
  }

  /** Group labels keep the same size on screen at any zoom, through a scale the zoom and the drawing's fit set. */
  private drawGroupLabels(anchors: ReadonlyMap<string, { x: number; y: number }>, nodes: readonly PlacedNode[], groups: readonly GraphGroup[]): SVGGElement {
    const layer = svgElement('g', { class: 'force-graph-groups' });
    for (const cluster of groups) {
      const anchor = anchors.get(cluster.id);
      const count = nodes.filter((node) => node.group === cluster.id).length;
      if (!anchor || !count) continue;
      const element = svgElement('g', { class: 'force-graph-group', tabindex: 0, role: 'button', 'aria-label': `${cluster.label}, ${count} ${count === 1 ? 'gene' : 'genes'}`, transform: `translate(${round(anchor.x)} ${round(anchor.y - 2)})` });
      element.style.setProperty('--group-color', `var(${cluster.color})`);
      const scaled = svgElement('g', { class: 'force-graph-group-scale' });
      scaled.style.setProperty('--label-size', `${group.labelSize}px`);
      const width = labelWidth(cluster.label, group.labelSize) + group.labelPadX;
      const text = svgElement('text', { 'text-anchor': 'middle', y: -group.labelHeight / 2, dy: '0.35em' });
      text.textContent = cluster.label;
      scaled.append(svgElement('rect', { x: round(-width / 2), y: -group.labelHeight, width: round(width), height: group.labelHeight, rx: group.labelHeight / 2 }), text);
      element.append(scaled);
      this.whenChosen(element, () => this.options?.onSelectGroup?.(cluster.id));
      element.addEventListener('pointerenter', () => this.options?.onHoverGroup?.(cluster.id));
      element.addEventListener('focus', () => this.options?.onHoverGroup?.(cluster.id));
      element.addEventListener('pointerleave', () => this.options?.onHoverGroup?.(null));
      element.addEventListener('blur', () => this.options?.onHoverGroup?.(null));
      this.groupLabels.set(cluster.id, element);
      layer.append(element);
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

  /** Everything drawn, with room above for group labels at their size on screen. */
  private boundsOf(boxes: readonly Box[], grouped: boolean): Box {
    if (!boxes.length) return { x: -padding, y: -padding, width: padding * 2, height: padding * 2 };
    const x = Math.min(...boxes.map((box) => box.x)) - padding;
    const y = Math.min(...boxes.map((box) => box.y)) - padding;
    const width = Math.max(...boxes.map((box) => box.x + box.width)) - x + padding;
    const height = Math.max(...boxes.map((box) => box.y + box.height)) - y + padding;
    if (!grouped) return { x, y, width, height };
    const room = (group.labelHeight + 4) / this.fitOf({ x, y, width, height });
    return { x, y: y - room, width, height: height + room };
  }

  /** How many screen pixels one unit of the drawing takes before zooming. */
  private fitOf(view: Box): number {
    const box = this.svg?.getBoundingClientRect();
    return box?.width && box.height ? Math.min(box.width / view.width, box.height / view.height) : 1;
  }

  private updateLabelScale(): void {
    if (!this.canvas || !this.viewBox) return;
    const pixels = this.fitOf(this.viewBox) * this.scale;
    this.canvas.style.setProperty('--group-label-scale', String(round(Math.min(4, Math.max(0.25, 1 / pixels)))));
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
      if (this.links.length) for (const neighbor of this.neighbors.get(selection.id) ?? []) linked.add(neighbor);
      for (const link of selection.links ?? []) linked.add(link.source).add(link.target);
    }
    if (selection?.kind === 'link') linked.add(selection.source).add(selection.target);
    if (selection?.kind === 'group') for (const [id, owner] of this.groupOf) if (owner === selection.id) linked.add(id);
    this.drawFocusLinks(this.selectedLinkLayer, selection?.kind === 'node' ? (selection.links ?? []) : []);
    const nodeGroup = selection?.kind === 'node' && selection.links ? this.groupOf.get(selection.id) : undefined;
    const linkedGroups = new Set([...linked].flatMap((id) => this.groupOf.get(id) ?? []));
    for (const [id, element] of this.groupLabels) {
      element.classList.toggle('is-selected', (selection?.kind === 'group' && selection.id === id) || nodeGroup === id);
      element.classList.toggle('is-faded', (selection?.kind === 'group' && selection.id !== id) || (nodeGroup !== undefined && !linkedGroups.has(id)));
      this.groupHulls.get(id)?.classList.toggle('is-faded', element.classList.contains('is-faded'));
    }
    for (const [id, element] of this.nodes) {
      const isSelected = selection?.kind === 'node' && selection.id === id;
      element.classList.toggle('is-selected', isSelected);
      element.classList.toggle('is-faded', selection !== null && !linked.has(id));
      this.labels.get(id)?.classList.toggle('is-selected', isSelected || (selection?.kind === 'link' && linked.has(id)));
      this.labels.get(id)?.classList.toggle('is-faded', selection !== null && !linked.has(id));
    }
    for (const { element, source, target } of this.links) {
      const isSelected = selection?.kind === 'link' && ((selection.source === source && selection.target === target) || (selection.source === target && selection.target === source));
      const touches = (selection?.kind === 'node' && (source === selection.id || target === selection.id)) || (selection?.kind === 'group' && linked.has(source) && linked.has(target));
      element.classList.toggle('is-selected', isSelected);
      element.classList.toggle('is-faded', selection !== null && !isSelected && !touches);
    }
  }

  hover(focus: GraphFocus | null): void {
    this.hovered = focus;
    this.drawFocusLinks(this.hoverLinkLayer, focus?.links ?? []);
    this.applyHover();
  }

  hoverGroup(id: string | null): void {
    this.hoveredGroup = id;
    this.applyHover();
  }

  /** A hovered gene keeps its neighbors; a hovered group keeps its genes and brings forward its links to other groups. Everything else dims. */
  private applyHover(): void {
    const focus = this.hovered;
    const groupId = focus ? null : this.hoveredGroup;
    let keep: Set<string> | undefined;
    if (focus) keep = new Set([focus.id, ...(this.neighbors.get(focus.id) ?? []), ...focus.links.flatMap((link) => [link.source, link.target])]);
    if (groupId) keep = new Set([...this.groupOf].flatMap(([id, owner]) => (owner === groupId ? [id] : [])));
    const keepsLink = (source: string, target: string) => (focus ? source === focus.id || target === focus.id : groupId ? this.groupOf.get(source) === groupId || this.groupOf.get(target) === groupId : true);
    this.svg?.classList.toggle('is-dimming', keep !== undefined);
    for (const [id, element] of this.nodes) {
      element.classList.toggle('is-hovered', focus?.id === id);
      element.classList.toggle('is-dimmed', keep !== undefined && !keep.has(id));
      this.labels.get(id)?.classList.toggle('is-hovered', focus?.id === id);
      this.labels.get(id)?.classList.toggle('is-dimmed', keep !== undefined && !keep.has(id));
    }
    for (const { element, source, target } of this.links) {
      element.classList.toggle('is-dimmed', !keepsLink(source, target));
      element.classList.toggle('is-raised', groupId !== null && element.classList.contains('is-between') && keepsLink(source, target));
    }
    const keptGroups = keep && new Set([...keep].flatMap((id) => this.groupOf.get(id) ?? []));
    for (const [id, element] of this.groupLabels) {
      element.classList.toggle('is-hovered', groupId === id);
      element.classList.toggle('is-dimmed', keptGroups !== undefined && !keptGroups.has(id));
      this.groupHulls.get(id)?.classList.toggle('is-hovered', groupId === id);
      this.groupHulls.get(id)?.classList.toggle('is-dimmed', keptGroups !== undefined && !keptGroups.has(id));
    }
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
      const hull = svgElement('path', { class: 'force-graph-hull', d: hullPath(outline) });
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
    this.resizeObserver?.disconnect();
    this.svg?.remove();
    this.svg = undefined;
    this.canvas = undefined;
    this.nodes.clear();
    this.labels.clear();
    this.links = [];
    this.neighbors.clear();
    this.groupLabels.clear();
    this.groupHulls.clear();
    this.placed.clear();
    this.layoutKey = undefined;
    this.positions.clear();
    this.hullLayer = undefined;
    this.selectedLinkLayer = undefined;
    this.hoverLinkLayer = undefined;
    this.hovered = null;
    this.hoveredGroup = null;
    this.viewBox = undefined;
  }
}
