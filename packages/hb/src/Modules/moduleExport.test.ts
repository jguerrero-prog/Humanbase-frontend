import { ModuleResult, type CommunityRecord } from '@humanbase/data';
import { describe, expect, it } from 'vitest';
import { ModuleExport, qValue } from './moduleExport';

const record: CommunityRecord = {
  query: { integration: 'kidney', giant_version: 'v1', title: 'Renal panel: 2', entrez_list: [1, 2, 3, 4] },
  versions: { term: 'releases/2018-05-14', integration: '1' },
  nodes: [
    { id: 'a', cluster: '0', entrez: '1', symbol: 'NPHS1', description: '' },
    { id: 'b', cluster: '1', entrez: '2', symbol: 'PKD1', description: '' },
    { id: 'c', cluster: '0', entrez: '3', symbol: 'NPHS2', description: '' },
  ],
  edges: [
    { source: 'a', target: 'b', weight: 0.1 },
    { source: 'a', target: 'c', weight: 0.808135 },
  ],
  enrichment: {
    'gene-ontology-bp': [{ cluster: '0', term: 'GO:0072001', name: 'renal system development', genes: ['c', 'a'], p_value: 0, q_value: 3.406446639716096e-9 }],
  },
};

describe('ModuleExport', () => {
  const result = new ModuleResult(record);
  const exporter = new ModuleExport(result, result.shown('gene-ontology-bp', { minimumSize: 1, hideUnenriched: true }), 'gene-ontology-bp', 'kidney');

  it('writes the live site’s TSV: metadata, the shown modules, their terms and every edge, strongest first', () => {
    const date = new Date(2026, 9, 21);
    expect(exporter.tsv(date).split('\n')).toEqual([
      'TITLE\tRenal panel: 2\t\t\t\t',
      'GO_VERSION\treleases/2018-05-14\t\t\t\t',
      'NETWORK_NAME\tkidney\t\t\t\t',
      'NETWORK_VERSION\t1\t\t\t\t',
      `DATE_CREATED\t${date.toString()}\t\t\t\t`,
      'SUBMITTED GENE COUNT\t4\t\t\t\t',
      'RESULTING GENE COUNT\t2\t\t\t\t',
      '\t\t\t\t\t',
      'CLUSTER_NAME\tCLUSTER_GENES\t\t\t\t',
      'M1\tNPHS1,NPHS2\t\t\t\t',
      '\t\t\t\t\t',
      'CLUSTER_NAME\tTERM_NAME\tGO_ID\tTERM_Q_VALUE\tGENE_COUNT\tTERM_GENES',
      'M1\trenal system development\tGO:0072001\t3.406446639716096e-9\t2\tNPHS2,NPHS1',
      '\t\t\t\t\t',
      'SOURCE\tTARGET\tWEIGHT\t\t\t',
      'NPHS1\tNPHS2\t0.808135\t\t\t',
      'NPHS1\tPKD1\t0.1\t\t\t',
      '',
    ]);
  });

  it('names files after the title, network, term database and time', () => {
    expect(exporter.baseName(1792616045827)).toBe('Renal panel- 2_kidney_gene-ontology-bp_1792616045827');
    const untitled = new ModuleExport(new ModuleResult({ ...record, query: { ...record.query, title: null } }), [], 'disease-ontology', 'nervous system');
    expect(untitled.baseName(5)).toBe('nervous-system_disease-ontology_5');
  });

  it('shows q values to eight places, or <1e-8 when they round to zero', () => {
    expect(qValue(3.4e-9)).toBe('<1e-8');
    expect(qValue(3.187711715144869e-8)).toBe('0.00000003');
  });
});
