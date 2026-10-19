export type TrainingLabel = 1 | -1 | 0;
export type NetwasFilter = 'all' | 'candidates' | 'hits';

export interface NetwasGene {
  rank: number;
  symbol: string;
  label: TrainingLabel;
  score: number;
}

const labels: Record<TrainingLabel, string> = { 1: 'Significant', [-1]: 'Not significant', 0: 'Not used' };

export class NetwasResult {
  readonly genes: readonly NetwasGene[];

  constructor(
    readonly header: ReadonlyMap<string, string>,
    rows: readonly Omit<NetwasGene, 'rank'>[],
  ) {
    this.genes = [...rows].sort((a, b) => b.score - a.score).map((row, index) => ({ ...row, rank: index + 1 }));
  }

  // Header lines are "# Field: value"; gene lines are symbol, training label and score.
  static parse(text: string): NetwasResult {
    const header = new Map<string, string>();
    const rows: Omit<NetwasGene, 'rank'>[] = [];
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('#')) {
        const match = /^#\s*([^:]+):\s*(.*)$/.exec(trimmed);
        if (match?.[1] && match[2] !== undefined) header.set(match[1].trim(), match[2].trim());
        continue;
      }
      const [symbol, label, score] = trimmed.split(/\s+/);
      const value = Number(score?.replace('−', '-'));
      const training = Number(label?.replace('−', '-'));
      if (!symbol || Number.isNaN(value) || ![1, -1, 0].includes(training)) continue;
      rows.push({ symbol, label: training as TrainingLabel, score: value });
    }
    return new NetwasResult(header, rows);
  }

  static labelText(label: TrainingLabel): string {
    return labels[label];
  }

  static isCandidate(gene: NetwasGene): boolean {
    return gene.label !== 1 && gene.score > 0;
  }

  filter(kind: NetwasFilter): NetwasGene[] {
    if (kind === 'candidates') return this.genes.filter(NetwasResult.isCandidate);
    if (kind === 'hits') return this.genes.filter((gene) => gene.label === 1);
    return [...this.genes];
  }
}
