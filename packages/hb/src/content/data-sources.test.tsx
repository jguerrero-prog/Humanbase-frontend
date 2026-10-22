import { render, screen } from '@testing-library/react';
import { dataEraFrom, dataSourcesFor, reproducibilityHref, type DataSection } from './data-sources';

const names = (section: DataSection | undefined) => section?.rows.map((row) => row[0]);
const section = (sections: DataSection[], title: string) => sections.find((item) => item.title === title);
const usedIn = (sections: DataSection[], title: string, name: string) => section(sections, title)?.rows.find((row) => row[0] === name)?.[2];

describe('dataEraFrom', () => {
  it('reads the era from the URL and falls back to the current one', () => {
    expect(dataEraFrom('up-to-may-2026')).toBe('up-to-may-2026');
    expect(dataEraFrom('current')).toBe('current');
    expect(dataEraFrom(null)).toBe('current');
    expect(dataEraFrom('2019')).toBe('current');
  });
});

describe('dataSourcesFor', () => {
  const current = dataSourcesFor('current');
  const older = dataSourcesFor('up-to-may-2026');

  it('lists the same seven sections in each era', () => {
    const titles = ['Networks', 'Gene records', 'Ontologies', 'Gene annotations', 'Network compendia', 'SEEK (beta) data compendia', 'Variant effect prediction models'];
    expect(current.map((item) => item.title)).toEqual(titles);
    expect(older.map((item) => item.title)).toEqual(titles);
  });

  it('keeps MAGE and the NCBI gene2go annotations to the current era', () => {
    expect(names(section(current, 'Networks'))).toEqual(['MAGE', 'GIANT']);
    expect(names(section(older, 'Networks'))).toEqual(['GIANT']);
    expect(names(section(older, 'Gene records'))).toEqual(['Homo sapiens gene records (NCBI Gene)']);
    expect(names(section(older, 'Network compendia'))).toEqual(['Human Compendium (GIANT)']);
    expect(names(section(current, 'Gene annotations'))).toContain('GO BP annotations: Homo sapiens (NCBI gene2go)');
    expect(names(section(older, 'Gene annotations'))).not.toContain('GO BP annotations: Homo sapiens (NCBI gene2go)');
  });

  it('names which networks FMD enrichment uses only in the current era', () => {
    expect(usedIn(current, 'Gene annotations', 'MSigDB Hallmark (H)')).toBe('FMD enrichment (GIANT + MAGE)');
    expect(usedIn(older, 'Gene annotations', 'MSigDB Hallmark (H)')).toBe('FMD enrichment');
    expect(usedIn(current, 'Ontologies', 'Disease Ontology')).toBe('FMD enrichment (GIANT + MAGE), Networks: ‘Process’ panel and gene predictions');
    expect(usedIn(older, 'Ontologies', 'Disease Ontology')).toBe('FMD enrichment, Networks: ‘Process’ panel and gene predictions');
  });

  it('adds the reproducibility note to the older era’s network compendia', () => {
    expect(current.every((item) => item.note === undefined)).toBe(true);
    const note = section(older, 'Network compendia')?.note;
    expect(note?.title).toBe('About reproducibility for this era');
    render(<p>{note?.body}</p>);
    expect(screen.getByRole('link', { name: 'Reproducing legacy results' })).toHaveAttribute('href', reproducibilityHref);
  });

  it('formats study counts and links each compendium file', () => {
    const [name, studies, download] = section(current, 'Network compendia')?.rows[0] ?? [];
    expect([name, studies]).toEqual(['Human Compendium (MAGE)', '7,463']);
    render(<p>{download}</p>);
    expect(screen.getByRole('link', { name: 'mage_human_compendium.tsv' })).toHaveAttribute('href', 'https://humanbase.s3.amazonaws.com/compendia/mage_human_compendium.tsv');
  });
});
