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
