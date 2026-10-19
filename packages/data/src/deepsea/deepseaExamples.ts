import type { InputKind, VariantModel } from '../jobs/VariantFileCheck';
import type { Genome } from './DeepseaModel';
import belugaSequences from './examples/beluga.fasta?raw';
import regionsHg19 from './examples/regions-hg19.bed?raw';
import regionsHg38 from './examples/regions-hg38.bed?raw';
import seiSequences from './examples/sei.fasta?raw';
import seqweaverSequences from './examples/seqweaver.fasta?raw';
import strandedRegionsHg19 from './examples/stranded-hg19.bed?raw';
import strandedRegionsHg38 from './examples/stranded-hg38.bed?raw';
import strandedHg19 from './examples/stranded-hg19.vcf?raw';
import strandedHg38 from './examples/stranded-hg38.vcf?raw';
import variantsHg19 from './examples/variants-hg19.vcf?raw';
import variantsHg38 from './examples/variants-hg38.vcf?raw';

type Examples = Record<Genome, Partial<Record<InputKind, string>>>;

// The live site's example inputs. Seqweaver reads strands, so its variants and regions carry one.
const dna = (fasta: string): Examples => ({
  hg19: { vcf: variantsHg19, bed: regionsHg19, fasta },
  hg38: { vcf: variantsHg38, bed: regionsHg38, fasta },
});

/** Each tool's example input, by genome and kind. */
export const deepseaExamples: Record<VariantModel, Examples> = {
  sei: dna(seiSequences),
  beluga: dna(belugaSequences),
  seqweaver: {
    hg19: { vcf: strandedHg19, bed: strandedRegionsHg19, fasta: seqweaverSequences },
    hg38: { vcf: strandedHg38, bed: strandedRegionsHg38, fasta: seqweaverSequences },
  },
  expecto: { hg19: { vcf: variantsHg19 }, hg38: {} },
  insilico: { hg19: { fasta: belugaSequences }, hg38: { fasta: belugaSequences } },
};
