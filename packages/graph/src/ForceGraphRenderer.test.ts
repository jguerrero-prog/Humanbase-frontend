import { edgeBand } from './edgeBands';
import { ForceGraphRenderer } from './ForceGraphRenderer';
import type { GraphData } from './GraphRenderer';

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
});

describe('ForceGraphRenderer', () => {
  it('draws a labeled group with one focusable button per gene and one line per connection', () => {
    const { container } = mounted();
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Network of IL1B and TNF');
    expect([...container.querySelectorAll('[role="button"]')].map((n) => n.getAttribute('aria-label'))).toEqual(['IL1B, query gene', 'IL1R1, related gene', 'TNF, query gene', 'AQP9, related gene']);
    expect(container.querySelectorAll('.force-graph-hit')).toHaveLength(3);
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
    (container.querySelector('.force-graph-hit') as SVGLineElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onSelectNode).toHaveBeenNthCalledWith(1, '3554');
    expect(onSelectNode).toHaveBeenCalledTimes(2);
    expect(onSelectLink).toHaveBeenCalledWith('3553', '3554');
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

  it('selects a group from its label and fades the other groups', () => {
    const { container, renderer, onSelectGroup } = mountedGroups();
    (container.querySelector('[aria-label="M3, 1 gene"]') as SVGGElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onSelectGroup).toHaveBeenCalledWith('m3');
    renderer.select({ kind: 'group', id: 'm3' });
    expect(container.querySelector('[aria-label="FGF8, M1"]')?.classList.contains('is-faded')).toBe(true);
    expect(container.querySelector('[aria-label="CCDC40, M3"]')?.classList.contains('is-faded')).toBe(false);
    expect(container.querySelector('[aria-label="M1, 2 genes"]')?.classList.contains('is-faded')).toBe(true);
  });
});
