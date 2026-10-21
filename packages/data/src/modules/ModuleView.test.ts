import { ModuleView } from './ModuleView';

describe('ModuleView', () => {
  it('starts on the modules tab, hiding modules with no enriched terms and smaller than 2 genes', () => {
    const view = ModuleView.fromSearch(new URLSearchParams('body_tag=abc'));
    expect(view).toMatchObject({ tab: 'modules', module: undefined, showEdges: false, hideUnenriched: true, minimumSize: 2, display: 'graph', expanded: false });
    expect(view.applyTo(new URLSearchParams('body_tag=abc')).toString()).toBe('body_tag=abc');
  });

  it('keeps every setting in the URL and reads it back', () => {
    const view = new ModuleView().with({ tab: 'genes', module: 3, gene: 6928, showEdges: true, hideUnenriched: false, minimumSize: 5, database: 'disease-ontology', display: 'table', expanded: true });
    const search = view.applyTo(new URLSearchParams('body_tag=abc'));
    expect(search.toString()).toBe('body_tag=abc&tab=genes&module=3&gene=6928&edges=1&all=1&min=5&db=disease-ontology&display=table&expand=1');
    expect(ModuleView.fromSearch(search)).toEqual(view);
  });

  it('closes the module drawer', () => {
    expect(new ModuleView({ module: 1 }).with({ module: undefined }).module).toBeUndefined();
  });

  it('goes back from a gene to its module', () => {
    expect(new ModuleView({ module: 1, gene: 6928 }).with({ gene: undefined })).toMatchObject({ module: 1, gene: undefined });
  });

  it('ignores settings it cannot read', () => {
    expect(ModuleView.fromSearch(new URLSearchParams('module=abc&gene=-4&min=0&tab=other'))).toMatchObject({ module: undefined, gene: undefined, minimumSize: 2, tab: 'modules' });
  });
});
