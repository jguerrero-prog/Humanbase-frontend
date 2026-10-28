import type { NetworkGraphHandle } from '@humanbase/graph';
import { renderHook } from '@testing-library/react';
import { useGraphToolbar, type GraphToolbarOptions } from './useGraphToolbar';

const handle = { zoomBy: vi.fn(), fit: vi.fn() };
const graph = { current: handle as unknown as NetworkGraphHandle };
const toolbar = (options: GraphToolbarOptions) => renderHook(() => useGraphToolbar(graph, options)).result.current;
const labels = (groups: ReturnType<typeof toolbar>) => groups.map((group) => group.map((action) => action.label));

describe('useGraphToolbar', () => {
  const onToggle = vi.fn();

  it('zooms by one step either way and fits the drawing', () => {
    const [actions = []] = toolbar({ asTable: false });
    expect(actions.map((action) => action.label)).toEqual(['Zoom in', 'Zoom out', 'Fit to screen']);
    for (const action of actions) action.onSelect?.();
    expect(handle.zoomBy.mock.calls).toEqual([[1.3], [1 / 1.3]]);
    expect(handle.fit).toHaveBeenCalledOnce();
  });

  it('adds Expand, pressed while expanded', () => {
    const groups = toolbar({ asTable: false, expand: { expanded: true, onToggle } });
    expect(labels(groups)).toEqual([['Zoom in', 'Zoom out', 'Fit to screen', 'Expand']]);
    const expand = groups[0]?.at(-1);
    expect(expand?.pressed).toBe(true);
    expand?.onSelect?.();
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('keeps only Expand for the table, or nothing without it', () => {
    expect(labels(toolbar({ asTable: true, expand: { expanded: false, onToggle } }))).toEqual([['Expand']]);
    expect(toolbar({ asTable: true })).toEqual([]);
  });
});
