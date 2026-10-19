import { NetworkView } from './NetworkView';

describe('NetworkView', () => {
  it('keeps the table view and the expanded layout in the URL', () => {
    const view = new NetworkView().with({ display: 'table', expanded: true, shown: 20 });
    const search = view.applyTo(new URLSearchParams('entrez=3553&version=v1'));
    expect(search.toString()).toBe('entrez=3553&version=v1&shown=20&display=table&expand=1');
    expect(NetworkView.fromSearch(search)).toMatchObject({ display: 'table', expanded: true, shown: 20 });
  });

  it('starts on the graph at its usual width', () => {
    expect(NetworkView.fromSearch(new URLSearchParams('display=chart&expand=yes'))).toMatchObject({ display: 'graph', expanded: false });
  });
});
