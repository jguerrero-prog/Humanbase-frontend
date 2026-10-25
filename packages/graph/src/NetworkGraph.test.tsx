import { render } from '@testing-library/react';
import type { GraphData, GraphRenderer } from './GraphRenderer';
import { NetworkGraph } from './NetworkGraph';

const data: GraphData = { nodes: [{ id: '3553', label: 'IL1B', query: true }], links: [] };

function spyRenderer() {
  const renderer: GraphRenderer = {
    mount: vi.fn(),
    render: vi.fn(),
    setLabel: vi.fn(),
    select: vi.fn(),
    hover: vi.fn(),
    highlight: vi.fn(),
    zoomBy: vi.fn(),
    fit: vi.fn(),
    exportSvg: () => new Blob(),
    destroy: vi.fn(),
  };
  const factory = () => renderer;
  return { renderer, factory };
}

describe('NetworkGraph', () => {
  it('renames the graph without mounting or drawing it again', () => {
    const { renderer, factory } = spyRenderer();
    const { rerender } = render(<NetworkGraph data={data} label="Modules of Renal disease panel" renderer={factory} />);
    rerender(<NetworkGraph data={data} label="Modules of Kidney panel" renderer={factory} />);
    expect(renderer.mount).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.setLabel).toHaveBeenLastCalledWith('Modules of Kidney panel');
  });
});
