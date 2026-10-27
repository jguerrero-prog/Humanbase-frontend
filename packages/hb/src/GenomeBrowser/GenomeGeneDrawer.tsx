import { assemblyNames, GenomeLocation, NetworkQuery, useGeneBySymbol, useHumanbase, type Assembly } from '@humanbase/data';
import type { GenomeGene } from '@humanbase/genome';
import { Alert, Drawer, GeneDetail, useLinkHref } from '@humanbase/ui';
import { geneIdLinks } from '../Networks/geneIds';

export interface GenomeGeneDrawerProps {
  gene: GenomeGene;
  assembly: Assembly;
  onClose: () => void;
}

const strands = { '+': 'forward strand', '-': 'reverse strand', '': '' } as const;

/** A gene clicked in the genome browser: where the genes track places it, then its name, aliases and IDs from gene search. */
export function GenomeGeneDrawer({ gene, assembly, onClose }: GenomeGeneDrawerProps) {
  const { examplesOnly } = useHumanbase();
  const linkHref = useLinkHref();
  const found = useGeneBySymbol(gene.name);
  const record = found.data;
  const place = [new GenomeLocation(gene.chrom, gene.start, gene.end, assembly).format(), strands[gene.strand]].filter(Boolean).join(', ');
  const facts = [
    { label: 'Location', value: `${place} (${assemblyNames[assembly]})` },
    { label: 'Gene type', value: `${gene.type} (${gene.source})` },
  ];

  let notice;
  if (found.isError) {
    notice = (
      <Alert tone="error" title={`${gene.name}’s details couldn’t load`} action={{ label: 'Try again', onSelect: () => void found.refetch() }}>
        Gene search didn’t answer. The location and type above come from the genes track.
      </Alert>
    );
  } else if (record === null) {
    notice = (
      <Alert tone="info" title={examplesOnly ? 'Sample data covers a few genes' : `${gene.name} isn’t in the gene index`}>
        {examplesOnly ? `Turn the API on to see ${gene.name}’s name, aliases and IDs.` : `Humanbase has no record for ${gene.name}, so only the genes track’s details show.`}
      </Alert>
    );
  }

  return (
    <Drawer
      open
      title={gene.name}
      {...(record && { subtitle: record.name })}
      onClose={onClose}
      footer={
        record?.isInVersion(NetworkQuery.defaultVersion) && (
          <a className="button button-primary" href={linkHref(new NetworkQuery([record.entrez]).href)}>
            Open {gene.name} in Networks
          </a>
        )
      }
    >
      <GeneDetail facts={facts} loading={found.isPending} {...(record && { aliases: record.aliases, ids: geneIdLinks(record) })} />
      {notice}
    </Drawer>
  );
}
