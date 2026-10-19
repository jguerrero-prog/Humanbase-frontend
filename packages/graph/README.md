# @humanbase/graph

Draws Humanbase networks. The front end talks only to the `GraphRenderer` interface, so the renderer behind it can be swapped without touching any screen.

## The interface

```ts
interface GraphRenderer {
  mount(container: HTMLElement, options: { label: string; onSelectNode?; onSelectLink?; onSelectGroup? }): void;
  render(data: GraphData): void;      // nodes { id, label, query, group? }, links { source, target, weight } and optional groups { id, label, color }
  select(selection: GraphSelection): void; // a gene, a connection, a group, or null
  highlight(sets: readonly GraphHighlight[]): void; // starred sets { id, label, color, nodes }, in starring order; [] clears
  zoomBy(factor: number): void;
  fit(): void;
  exportSvg(): Blob;                  // a standalone file with colors resolved
  destroy(): void;
}
```

`NetworkGraph` is the React component screens use. Pass `renderer` a factory to use another renderer:

```tsx
<NetworkGraph data={data} label="Network of IL1B and 15 related genes" highlights={starred} renderer={() => new MyRenderer()} />
```

The screens call the renderer in this order: `mount` once, `render` whenever the genes or connections change, then `select` and `highlight` with the current state. A renderer must keep the selection and highlights when `render` runs again. It reports clicks through the `onSelectNode`, `onSelectLink` and `onSelectGroup` callbacks it got in `mount`; the screens open the drawers. `color` values are design token names such as `--viz-cat-1`, so draw them with `var(...)`.

## The default renderer

`ForceGraphRenderer` is a plain, open-source force-directed layout built on d3-force, d3-selection and d3-zoom. It follows the encoding rules on the design system's Data visualization page:

- Connections get darker and wider with confidence, in the bands from `edgeBands` (0.5 to 0.75, 0.75 to 0.9, 0.9 and up). Connections under 0.5 use the weakest band.
- Query genes are larger and drawn in ink; related genes are white with a grey outline. Labels are Lato Bold 12, 14 for query genes, with a white halo.
- A selected gene gets an ink ring; genes and connections it doesn't touch fade to 35%.
- The layout is computed before anything is drawn, so the graph never drifts. It fades in, which reduced motion keeps.
- Every gene is a focusable button named by its symbol and role, and Enter or Space selects it. The table view is the full accessible equivalent.
- Starred sets (from the star toggles in the Process and Tissue panels) ring each of their genes in the set's color, stacked outward in starring order, with a thin ink edge outside the last ring so light colors still show on white. A light shaded area of the same color is drawn behind each set's genes.
- With `groups`, as for modules, each group is laid out as its own cluster on a grid, its genes filled with the group's categorical color and its label (M1, M2…) drawn above it as a focusable button. Selecting a group fades the others. Gene labels are left off; the module tables name every gene.

## Replacing the renderer

The built-in renderer is a stand-in so the screens work in an open-source copy. It doesn't try to look like the live Humanbase graph.

The live site's renderer belongs to the Humanbase team. It is a D3 v3 force layout (`d3.layout.force`) with each connection drawn through a middle point that the layout also moves, which gives the curved edges, edge color and width by weight, and starred sets drawn as colored rings with a convex hull (`d3.geom.hull`). The Humanbase team can wrap it in a class that implements `GraphRenderer` and pass it as `renderer`. No screen needs to change: the toolbar, drawers, tables, star toggles and URL state all go through this interface. It can be bundled in this package once its license allows, or loaded at run time if the API serves it.
