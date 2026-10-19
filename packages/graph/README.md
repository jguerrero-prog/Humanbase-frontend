# @humanbase/graph

Draws Humanbase networks. The front end talks only to the `GraphRenderer` interface, so the renderer behind it can be swapped without touching any screen.

## The interface

```ts
interface GraphRenderer {
  mount(container: HTMLElement, options: { label: string; onSelectNode?; onSelectLink?; onSelectGroup? }): void;
  render(data: GraphData): void;      // nodes { id, label, query, group? }, links { source, target, weight } and optional groups { id, label, color }
  select(selection: GraphSelection): void; // a gene, a connection, a group, or null
  zoomBy(factor: number): void;
  fit(): void;
  exportSvg(): Blob;                  // a standalone file with colors resolved
  destroy(): void;
}
```

`NetworkGraph` is the React component screens use. Pass `renderer` a factory to use another renderer:

```tsx
<NetworkGraph data={data} label="Network of IL1B and 15 related genes" renderer={() => new MyRenderer()} />
```

## The default renderer

`ForceGraphRenderer` is a plain, open-source force-directed layout built on d3-force, d3-selection and d3-zoom. It follows the encoding rules on the design system's Data visualization page:

- Connections get darker and wider with confidence, in the bands from `edgeBands` (0.5 to 0.75, 0.75 to 0.9, 0.9 and up). Connections under 0.5 use the weakest band.
- Query genes are larger and drawn in ink; related genes are white with a grey outline. Labels are Lato Bold 12, 14 for query genes, with a white halo.
- A selected gene gets an ink ring; genes and connections it doesn't touch fade to 35%.
- The layout is computed before anything is drawn, so the graph never drifts. It fades in, which reduced motion keeps.
- Every gene is a focusable button named by its symbol and role, and Enter or Space selects it. The table view is the full accessible equivalent.
- With `groups`, as for modules, each group is laid out as its own cluster on a grid, its genes filled with the group's categorical color and its label (M1, M2…) drawn above it as a focusable button. Selecting a group fades the others. Gene labels are left off; the module tables name every gene.

It is not the renderer the live Humanbase site uses. That renderer belongs to the Humanbase team and can replace this one through the same interface once its license allows, or if the API serves it.
