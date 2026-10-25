import { GeneHit } from '@humanbase/data';
import { geneDestinations } from './geneDestinations';

const gene = (versions: string[]) => new GeneHit({ entrez: 100188314, standard_name: 'AUTS12', aliases: '', description: 'autism susceptibility 12', versions_available: versions });

describe('geneDestinations', () => {
  it('leaves Networks out for a gene in no network', () => {
    expect(geneDestinations(gene([])).map((destination) => destination.label)).toEqual(['Expression effects', 'Genome browser']);
  });

  it('opens Networks in GIANT when only GIANT has the gene', () => {
    expect(geneDestinations(gene(['v1']))[0]).toEqual({ label: 'Networks', href: '/networks/?entrez=100188314&version=v1' });
  });
});
