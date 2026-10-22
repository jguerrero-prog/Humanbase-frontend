import type { ModuleNeighbor } from '@humanbase/data';
import { Cell, HeaderCell, ScoreCell, Table } from '@humanbase/ui';
import { GeneButton, type ModuleGene, type ModuleGeneListProps } from './ModuleGeneList';

export interface GeneNeighborsTableProps extends Pick<ModuleGeneListProps, 'onSelectGene' | 'onHoverGene'> {
  caption: string;
  neighbors: readonly (ModuleNeighbor & { gene: ModuleGene })[];
}

/** The genes a gene connects to in the result, in any module, strongest first. */
export function GeneNeighborsTable({ caption, neighbors, onSelectGene, onHoverGene }: GeneNeighborsTableProps) {
  return (
    <Table className="module-gene-table" caption={caption} density="compact" columnWidths={['80px', 'auto', '72px', '148px']}>
      <thead>
        <tr>
          <HeaderCell>Gene</HeaderCell>
          <HeaderCell>Description</HeaderCell>
          <HeaderCell>Module</HeaderCell>
          <HeaderCell align="end" sort="descending">
            Score
          </HeaderCell>
        </tr>
      </thead>
      <tbody>
        {neighbors.map(({ gene, module, weight }) => (
          <tr key={gene.entrez} onPointerEnter={() => onHoverGene(gene.entrez)} onPointerLeave={() => onHoverGene(undefined)}>
            <Cell rowHeader>
              <GeneButton gene={gene} onSelectGene={onSelectGene} onHoverGene={onHoverGene} />
            </Cell>
            <Cell wrap>{gene.name}</Cell>
            <Cell>{module?.label ?? ''}</Cell>
            <ScoreCell value={weight} />
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
