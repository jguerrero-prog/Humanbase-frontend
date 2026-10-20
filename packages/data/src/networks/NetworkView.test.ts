import { NetworkView } from './NetworkView';

describe('NetworkView', () => {
  it('keeps starred sets in starring order, shared by both compared panes', () => {
    const view = NetworkView.fromSearch(new URLSearchParams('star=BTO:0000131,GO:0006954,BTO:0000131'));
    expect(view.starred).toEqual(['BTO:0000131', 'GO:0006954']);
    const toggled = view.toggleStar('BTO:0000131').toggleStar('BTO:0002042');
    expect(toggled.starred).toEqual(['GO:0006954', 'BTO:0002042']);
    expect(toggled.applyTo(new URLSearchParams('entrez=3553'), 'compare').get('star')).toBe('GO:0006954,BTO:0002042');
    expect(toggled.with({ starred: [] }).applyTo(new URLSearchParams('star=GO:0006954')).has('star')).toBe(false);
  });

  it('keeps the table view and the expanded layout in the URL', () => {
    const view = new NetworkView().with({ display: 'table', expanded: true, shown: 20 });
    const search = view.applyTo(new URLSearchParams('entrez=3553&version=v1'));
    expect(search.toString()).toBe('entrez=3553&version=v1&shown=20&display=table&expand=1');
    expect(NetworkView.fromSearch(search)).toMatchObject({ display: 'table', expanded: true, shown: 20 });
  });

  it('starts on the graph at its usual width', () => {
    expect(NetworkView.fromSearch(new URLSearchParams('display=chart&expand=yes'))).toMatchObject({ display: 'graph', expanded: false });
  });

  it('keeps the compared graph’s filters apart and shares the selection and focus', () => {
    const search = new URLSearchParams('shown=20&compare_shown=30&compare_display=table&gene=3383&focus=compare');
    const main = NetworkView.fromSearch(search);
    const compared = NetworkView.fromSearch(search, 'compare');
    expect([main.shown, main.display, compared.shown, compared.display]).toEqual([20, 'graph', 30, 'table']);
    expect(compared.selection).toEqual({ kind: 'gene', entrez: 3383 });
    expect(compared.focus).toBe('compare');
    const next = compared.with({ minConfidence: 0.6, focus: 'main' }).applyTo(search, 'compare');
    expect(next.get('compare_confidence')).toBe('0.6');
    expect(next.get('shown')).toBe('20');
    expect(next.has('focus')).toBe(false);
  });
});
