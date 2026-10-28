import { forceSimulation } from 'd3-force';
import { edgeBand, edgeBands, edgeBandsFrom } from './edgeBands';
import { ForceGraphRenderer } from './ForceGraphRenderer';
import type { GraphData, GraphGroup } from './GraphRenderer';

vi.mock('d3-force', async (original) => {
  const actual = await original<typeof import('d3-force')>();
  return { ...actual, forceSimulation: vi.fn(actual.forceSimulation) };
});

const data: GraphData = {
  nodes: [
    { id: '3553', label: 'IL1B', query: true },
    { id: '3554', label: 'IL1R1', query: false },
    { id: '7124', label: 'TNF', query: true },
    { id: '366', label: 'AQP9', query: false },
  ],
  links: [
    { source: '3553', target: '3554', weight: 0.97 },
    { source: '3553', target: '7124', weight: 0.6 },
    { source: '7124', target: '366', weight: 0.8 },
  ],
};

function mounted() {
  const container = document.createElement('div');
  const onSelectNode = vi.fn();
  const onSelectLink = vi.fn();
  const renderer = new ForceGraphRenderer();
  renderer.mount(container, { label: 'Network of IL1B and TNF', onSelectNode, onSelectLink });
  renderer.render(data);
  return { container, renderer, onSelectNode, onSelectLink };
}

describe('edgeBand', () => {
  it('puts each weight in its documented band', () => {
    expect(edgeBand(0.95)?.label).toBe('0.9 and up');
    expect(edgeBand(0.8)?.label).toBe('0.75 to 0.9');
    expect(edgeBand(0.5)?.label).toBe('0.5 to 0.75');
    expect(edgeBand(0.3)).toBeUndefined();
  });

  it('lists only the bands a minimum confidence leaves, the weakest starting at the minimum', () => {
    expect(edgeBandsFrom(0.4807).map((band) => band.label)).toEqual(['0.9 and up', '0.75 to 0.9', '0.48 to 0.75']);
    expect(edgeBandsFrom(0.5)).toBe(edgeBands);
    expect(edgeBandsFrom(0.6).map((band) => band.label)).toEqual(['0.9 and up', '0.75 to 0.9', '0.6 to 0.75']);
    expect(edgeBandsFrom(0.84).map((band) => band.label)).toEqual(['0.9 and up', '0.84 to 0.9']);
    expect(edgeBandsFrom(0.75).map((band) => band.label)).toEqual(['0.9 and up', '0.75 to 0.9']);
    expect(edgeBandsFrom(0.95).map((band) => band.label)).toEqual(['0.95 and up']);
  });
});

describe('ForceGraphRenderer', () => {
  it('rings starred genes in stacking order, shades each set and keeps the highlight across a redraw', () => {
    const { container, renderer } = mounted();
    const blood = { id: 'BTO:0000131', label: 'peripheral blood', color: '--viz-cat-1', nodes: ['3554', '366', '999'] };
    const dendritic = { id: 'BTO:0002042', label: 'dendritic cell', color: '--viz-cat-2', nodes: ['366'] };
    renderer.highlight([blood, dendritic]);
    const ringsOf = (name: string) => [...(container.querySelector(`[aria-label^="${name},"]`)?.querySelectorAll<SVGCircleElement>('.force-graph-star') ?? [])];
    expect(ringsOf('IL1R1').map((ring) => ring.style.getPropertyValue('--set-color'))).toEqual(['var(--viz-cat-1)']);
    expect(ringsOf('AQP9').map((ring) => ring.style.getPropertyValue('--set-color'))).toEqual(['var(--viz-cat-1)', 'var(--viz-cat-2)']);
    expect(ringsOf('IL1B')).toHaveLength(0);
    expect(container.querySelectorAll('.force-graph-hull')).toHaveLength(2);
    expect(container.querySelector('.force-graph-hulls')?.getAttribute('aria-hidden')).toBe('true');

    renderer.render(data);
    expect(ringsOf('AQP9')).toHaveLength(2);
    renderer.highlight([]);
    expect(container.querySelectorAll('.force-graph-star, .force-graph-hull')).toHaveLength(0);
  });

  it('draws a labeled group with one focusable button per gene and one line per connection', () => {
    const { container } = mounted();
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Network of IL1B and TNF');
    expect([...container.querySelectorAll('[role="button"]')].map((n) => n.getAttribute('aria-label'))).toEqual(['IL1B, query gene', 'IL1R1, related gene', 'TNF, query gene', 'AQP9, related gene']);
    expect(container.querySelectorAll('.force-graph-hit')).toHaveLength(3);
  });

  it('draws each connection once as a gentle curve, weaker bands fainter', () => {
    const { container } = mounted();
    const lines = [...container.querySelectorAll<SVGPathElement>('.force-graph-links path:not(.force-graph-hit)')];
    expect(lines).toHaveLength(3);
    expect(lines.every((line) => /^M[-\d. ]+Q[-\d. ]+$/.test(line.getAttribute('d') ?? ''))).toBe(true);
    expect(lines.map((line) => line.style.getPropertyValue('--edge-opacity'))).toEqual(['1', '0.6', '0.8']);
  });

  it('labels every gene on a layer above the connections, with no two labels overlapping', () => {
    const { container } = mounted();
    const layers = [...(container.querySelector('svg > g')?.children ?? [])].map((layer) => layer.getAttribute('class'));
    expect(layers.indexOf('force-graph-labels')).toBeGreaterThan(layers.indexOf('force-graph-links'));
    const labels = [...container.querySelectorAll<SVGGElement>('.force-graph-label')];
    expect(labels.map((label) => label.textContent)).toEqual(['IL1B', 'TNF', 'AQP9', 'IL1R1']);
    const boxes = labels.map((label) => {
      const [x, y] = (label.getAttribute('transform')?.match(/[-\d.]+/g) ?? []).map(Number);
      const rect = label.querySelector('rect') as SVGRectElement;
      return { x: (x ?? 0) + Number(rect.getAttribute('x')), y: (y ?? 0) + Number(rect.getAttribute('y')), width: Number(rect.getAttribute('width')), height: Number(rect.getAttribute('height')) };
    });
    for (const [index, a] of boxes.entries()) for (const b of boxes.slice(index + 1)) expect(a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height).toBe(false);
  });

  it('keeps query genes nearer the middle than the genes around them', () => {
    const { container } = mounted();
    const at = (name: string) => (container.querySelector(`[aria-label^="${name},"]`)?.getAttribute('transform')?.match(/[-\d.]+/g) ?? []).map(Number) as [number, number];
    const middle = ['IL1B', 'IL1R1', 'TNF', 'AQP9'].map(at).reduce(([x, y], [a, b]) => [x + a / 4, y + b / 4], [0, 0]);
    const distance = (name: string) => Math.hypot(at(name)[0] - middle[0], at(name)[1] - middle[1]);
    expect(Math.max(distance('IL1B'), distance('TNF'))).toBeLessThan(Math.min(distance('IL1R1'), distance('AQP9')));
  });

  it('dims genes and connections a hovered gene does not touch', () => {
    const { container, renderer } = mounted();
    renderer.hover({ id: '3554', links: [] });
    const dimmed = (name: string) => container.querySelector(`[aria-label^="${name},"]`)?.classList.contains('is-dimmed');
    expect(container.querySelector('svg')?.classList.contains('is-dimming')).toBe(true);
    expect([dimmed('IL1R1'), dimmed('IL1B'), dimmed('TNF'), dimmed('AQP9')]).toEqual([false, false, true, true]);
    expect(container.querySelectorAll('.force-graph-links path.is-dimmed')).toHaveLength(2);
    renderer.hover(null);
    expect(container.querySelectorAll('.is-dimmed')).toHaveLength(0);
  });

  it('clears the selection from a click on empty space or Escape', () => {
    const container = document.createElement('div');
    const onClearSelection = vi.fn();
    const renderer = new ForceGraphRenderer();
    renderer.mount(container, { label: 'Network', onClearSelection });
    renderer.render(data);
    const svg = container.querySelector('svg') as SVGSVGElement;
    svg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    (container.querySelector('.force-graph-node') as SVGGElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onClearSelection).toHaveBeenCalledTimes(2);
  });

  it('places every gene at a finite position, the same way every time', () => {
    const positions = () => [...mounted().container.querySelectorAll('.force-graph-node')].map((n) => n.getAttribute('transform'));
    const first = positions();
    expect(first.every((t) => t && !t.includes('NaN'))).toBe(true);
    expect(positions()).toEqual(first);
  });

  it('reports clicks and Enter on genes, and clicks on connections', () => {
    const { container, onSelectNode, onSelectLink } = mounted();
    const il1r1 = container.querySelector('[aria-label="IL1R1, related gene"]') as SVGGElement;
    il1r1.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    il1r1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    (container.querySelector('.force-graph-hit') as SVGPathElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onSelectNode).toHaveBeenNthCalledWith(1, '3554');
    expect(onSelectNode).toHaveBeenCalledTimes(2);
    expect(onSelectLink).toHaveBeenCalledWith('3553', '3554');
  });

  it('thickens a connection under the pointer and reports it, until the pointer leaves', () => {
    const container = document.createElement('div');
    const onHoverLink = vi.fn();
    const renderer = new ForceGraphRenderer();
    renderer.mount(container, { label: 'Network', onHoverLink });
    renderer.render(data);
    const hit = container.querySelector('.force-graph-hit') as SVGPathElement;
    const line = hit.previousElementSibling as SVGPathElement;
    hit.dispatchEvent(new PointerEvent('pointerenter'));
    expect(line.classList.contains('is-hovered')).toBe(true);
    expect(onHoverLink).toHaveBeenLastCalledWith({ source: '3553', target: '3554', anchor: expect.anything() });
    hit.dispatchEvent(new PointerEvent('pointerleave'));
    expect(line.classList.contains('is-hovered')).toBe(false);
    expect(onHoverLink).toHaveBeenLastCalledWith(null);
  });

  it('rings the selected gene and fades genes it does not connect to', () => {
    const { container, renderer } = mounted();
    renderer.select({ kind: 'node', id: '3554' });
    const state = (label: string) => container.querySelector(`[aria-label^="${label},"]`)?.getAttribute('class');
    expect(state('IL1R1')).toContain('is-selected');
    expect(state('IL1B')).not.toContain('is-faded');
    expect(state('AQP9')).toContain('is-faded');
    renderer.select(null);
    expect(state('AQP9')).not.toContain('is-faded');
  });

  it('lays out again only when genes or connections change, not when names or the title do', () => {
    const { container, renderer } = mounted();
    const positions = () => [...container.querySelectorAll('.force-graph-node')].map((n) => n.getAttribute('transform'));
    const placed = positions();
    vi.mocked(forceSimulation).mockClear();
    renderer.render({ ...data, nodes: data.nodes.map((node) => ({ ...node, label: `${node.label} renamed` })) });
    renderer.setLabel('Network of IL1B, TNF and friends');
    expect(forceSimulation).not.toHaveBeenCalled();
    expect(positions()).toEqual(placed);
    expect(container.querySelector('[aria-label="IL1R1 renamed, related gene"]')).not.toBeNull();
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Network of IL1B, TNF and friends');

    renderer.render({ ...data, links: data.links.slice(1) });
    expect(forceSimulation).toHaveBeenCalledTimes(1);
  });

  it('keeps keyboard focus on the same gene when new data is drawn', () => {
    const { container, renderer } = mounted();
    document.body.append(container);
    (container.querySelector('[aria-label="TNF, query gene"]') as SVGGElement).focus();
    renderer.render({ ...data, nodes: data.nodes.map((node) => ({ ...node, label: `${node.label} renamed` })) });
    expect(document.activeElement?.getAttribute('aria-label')).toBe('TNF renamed, query gene');
    renderer.render({ ...data, links: data.links.slice(1) });
    expect(document.activeElement?.getAttribute('aria-label')).toBe('TNF, query gene');
    renderer.render({ ...data, nodes: data.nodes.filter((node) => node.id !== '7124') });
    expect(document.activeElement).toBe(document.body);
    container.remove();
  });

    it('removes everything it drew', () => {
    const { container, renderer } = mounted();
    renderer.destroy();
    expect(container.childElementCount).toBe(0);
  });
});

describe('ForceGraphRenderer with groups', () => {
  const grouped: GraphData = {
    nodes: [
      { id: '1', label: 'FGF8', query: false, group: 'm1' },
      { id: '2', label: 'HNF1B', query: false, group: 'm1' },
      { id: '3', label: 'CCDC40', query: false, group: 'm3' },
    ],
    links: [],
    groups: [
      { id: 'm1', label: 'M1', color: '--viz-cat-1' },
      { id: 'm3', label: 'M3', color: '--viz-cat-6' },
    ],
  };

  function mountedGroups() {
    const container = document.createElement('div');
    const onSelectGroup = vi.fn();
    const renderer = new ForceGraphRenderer();
    renderer.mount(container, { label: 'Modules of Renal disease panel', onSelectGroup });
    renderer.render(grouped);
    return { container, renderer, onSelectGroup };
  }

  it('draws a labeled cluster per group, with genes named by their module', () => {
    const { container } = mountedGroups();
    expect([...container.querySelectorAll('.force-graph-group')].map((label) => label.getAttribute('aria-label'))).toEqual(['M1, 2 genes', 'M3, 1 gene']);
    const fgf8 = container.querySelector('[aria-label="FGF8, M1"]') as SVGGElement;
    expect(fgf8.style.getPropertyValue('--node-color')).toBe('var(--viz-cat-1)');
    expect(fgf8.querySelector('text')).toBeNull();
  });

  it('keeps every cluster in place when gene names arrive', () => {
    const { container, renderer } = mountedGroups();
    const positions = () => [...container.querySelectorAll('.force-graph-node, .force-graph-group')].map((n) => n.getAttribute('transform'));
    const placed = positions();
    vi.mocked(forceSimulation).mockClear();
    renderer.render({ ...grouped, nodes: grouped.nodes.map((node) => ({ ...node, label: node.label.toLowerCase() })) });
    expect(forceSimulation).not.toHaveBeenCalled();
    expect(positions()).toEqual(placed);
    expect(container.querySelector('[aria-label="fgf8, M1"]')).not.toBeNull();
  });

  it('sizes genes by their size between the node and query gene radii, and keeps them in place when names arrive', () => {
    const container = document.createElement('div');
    const renderer = new ForceGraphRenderer();
    renderer.mount(container, { label: 'Modules' });
    const sized = { ...grouped, nodes: grouped.nodes.map((node, index) => ({ ...node, size: (index + 1) ** 2 })) };
    renderer.render(sized);
    const radii = () => [...container.querySelectorAll('.force-graph-dot')].map((dot) => Number(dot.getAttribute('r')));
    expect(radii()).toEqual([6, 8, 10]);
    const positions = () => [...container.querySelectorAll('.force-graph-node')].map((n) => n.getAttribute('transform'));
    const placed = positions();
    vi.mocked(forceSimulation).mockClear();
    renderer.render({ ...sized, nodes: sized.nodes.map((node) => ({ ...node, label: node.label.toLowerCase() })) });
    expect(forceSimulation).not.toHaveBeenCalled();
    expect(positions()).toEqual(placed);
    expect(radii()).toEqual([6, 8, 10]);
  });

  it('keeps keyboard focus on the same group label when new data is drawn', () => {
    const { container, renderer } = mountedGroups();
    document.body.append(container);
    (container.querySelector('[aria-label="M3, 1 gene"]') as SVGGElement).focus();
    renderer.render({ ...grouped, nodes: grouped.nodes.map((node) => ({ ...node, label: node.label.toLowerCase() })) });
    expect(document.activeElement?.getAttribute('aria-label')).toBe('M3, 1 gene');
    container.remove();
  });

    it('selects a group from its label and fades the other groups', () => {
    const { container, renderer, onSelectGroup } = mountedGroups();
    (container.querySelector('[aria-label="M3, 1 gene"]') as SVGGElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onSelectGroup).toHaveBeenCalledWith('m3');
    renderer.select({ kind: 'group', id: 'm3' });
    expect(container.querySelector('[aria-label="FGF8, M1"]')?.classList.contains('is-faded')).toBe(true);
    expect(container.querySelector('[aria-label="CCDC40, M3"]')?.classList.contains('is-faded')).toBe(false);
    expect(container.querySelector('[aria-label="M1, 2 genes"]')?.classList.contains('is-faded')).toBe(true);
  });

  it('selects a gene with its own links, keeping its module and neighbors at full strength', () => {
    const { container, renderer } = mountedGroups();
    renderer.select({ kind: 'node', id: '2', links: [{ source: '2', target: '3', weight: 0.6 }] });
    expect(container.querySelectorAll('.force-graph-focus-links path')).toHaveLength(1);
    expect(container.querySelector('[aria-label="HNF1B, M1"]')?.classList.contains('is-selected')).toBe(true);
    expect(container.querySelector('[aria-label="CCDC40, M3"]')?.classList.contains('is-faded')).toBe(false);
    expect(container.querySelector('[aria-label="FGF8, M1"]')?.classList.contains('is-faded')).toBe(true);
    expect(container.querySelector('[aria-label="M1, 2 genes"]')?.classList.contains('is-selected')).toBe(true);
    renderer.select(null);
    expect(container.querySelectorAll('.force-graph-focus-links path')).toHaveLength(0);
  });

  it('reports hover and focus on a gene, and rings the hovered gene with its links', () => {
    const container = document.createElement('div');
    const onHoverNode = vi.fn();
    const renderer = new ForceGraphRenderer();
    renderer.mount(container, { label: 'Modules', onHoverNode });
    renderer.render(grouped);
    const fgf8 = container.querySelector('[aria-label="FGF8, M1"]') as SVGGElement;
    fgf8.dispatchEvent(new Event('pointerenter'));
    expect(onHoverNode).toHaveBeenLastCalledWith('1', expect.anything());
    fgf8.dispatchEvent(new Event('blur'));
    expect(onHoverNode).toHaveBeenLastCalledWith(null);
    renderer.hover({ id: '1', links: [{ source: '1', target: '2', weight: 0.9 }] });
    expect(fgf8.classList.contains('is-hovered')).toBe(true);
    expect(container.querySelectorAll('.force-graph-focus-links path')).toHaveLength(1);
    renderer.hover(null);
    expect(fgf8.classList.contains('is-hovered')).toBe(false);
    expect(container.querySelectorAll('.force-graph-focus-links path')).toHaveLength(0);
  });

  it('outlines each group in its color, rings the genes of a ring group and labels no single gene', () => {
    const container = document.createElement('div');
    const renderer = new ForceGraphRenderer();
    renderer.mount(container, { label: 'Modules' });
    renderer.render({ ...grouped, groups: [grouped.groups?.[0] as GraphGroup, { id: 'm3', label: 'M3', color: '--viz-module-1', ring: true }] });
    const hulls = [...container.querySelectorAll<SVGPathElement>('.force-graph-group-hull')];
    expect(hulls.map((hull) => [hull.style.getPropertyValue('--group-color'), hull.classList.contains('is-ring')])).toEqual([
      ['var(--viz-cat-1)', false],
      ['var(--viz-module-1)', true],
    ]);
    expect(container.querySelector('[aria-label="CCDC40, M3"]')?.classList.contains('is-ring')).toBe(true);
    expect(container.querySelectorAll('.force-graph-label')).toHaveLength(0);
  });

  it('keeps hidden links for the layout and the hover, colors links inside a group and keeps those between groups neutral', () => {
    const container = document.createElement('div');
    const renderer = new ForceGraphRenderer();
    renderer.mount(container, { label: 'Modules' });
    const linked: GraphData = { ...grouped, links: [{ source: '1', target: '2', weight: 0.9 }, { source: '2', target: '3', weight: 0.6 }], linksHidden: true };
    renderer.render(linked);
    expect(container.querySelectorAll('.force-graph-links path')).toHaveLength(0);
    renderer.hover({ id: '1', links: [] });
    expect(container.querySelector('[aria-label="HNF1B, M1"]')?.classList.contains('is-dimmed')).toBe(false);
    expect(container.querySelector('[aria-label="CCDC40, M3"]')?.classList.contains('is-dimmed')).toBe(true);
    renderer.hover(null);

    renderer.render({ ...linked, linksHidden: false });
    const [inside, between] = [...container.querySelectorAll<SVGPathElement>('.force-graph-links path:not(.force-graph-hit)')];
    expect(inside?.classList.contains('is-within')).toBe(true);
    expect(inside?.style.getPropertyValue('--edge-color')).toBe('var(--viz-cat-1)');
    expect(between?.classList.contains('is-between')).toBe(true);
  });

  it('reports a hovered group and brings it and its links to other groups forward', () => {
    const container = document.createElement('div');
    const onHoverGroup = vi.fn();
    const renderer = new ForceGraphRenderer();
    renderer.mount(container, { label: 'Modules', onHoverGroup });
    renderer.render({ ...grouped, links: [{ source: '2', target: '3', weight: 0.6 }] });
    const label = container.querySelector('[aria-label="M3, 1 gene"]') as SVGGElement;
    label.dispatchEvent(new Event('pointerenter'));
    expect(onHoverGroup).toHaveBeenLastCalledWith('m3');
    label.dispatchEvent(new Event('pointerleave'));
    expect(onHoverGroup).toHaveBeenLastCalledWith(null);
    renderer.hoverGroup('m3');
    expect(container.querySelector('[aria-label="FGF8, M1"]')?.classList.contains('is-dimmed')).toBe(true);
    expect(container.querySelector('[aria-label="M1, 2 genes"]')?.classList.contains('is-dimmed')).toBe(true);
    expect(container.querySelector('.force-graph-links path.is-between')?.classList.contains('is-raised')).toBe(true);
    renderer.hoverGroup(null);
    expect(container.querySelectorAll('.is-dimmed, .is-raised')).toHaveLength(0);
  });
});
