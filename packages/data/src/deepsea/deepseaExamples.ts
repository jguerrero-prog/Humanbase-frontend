import type { InputKind, VariantModel } from '../jobs/VariantFileCheck';

const rows = (lines: readonly (readonly (string | number)[])[]) => lines.map((line) => line.join('\t')).join('\n');

// The live site's DNA example: the 12 variants its Sei and Beluga results show.
const dnaVariants = rows([
  ['chr3', 12598855, 'MKRN2', 'G', 'A'],
  ['chr3', 54158012, 'CACNA2D3', 'T', 'C'],
  ['chr5', 134871851, 'NEUROG1', 'A', 'G'],
  ['chr6', 108879283, 'FOXO3', 'G', 'A'],
  ['chr7', 49813589, 'VWC2', 'G', 'C'],
  ['chr8', 74206149, 'RDH10', 'C', 'G'],
  ['chr10', 96305280, 'HELLS', 'T', 'C'],
  ['chr11', 2435681, 'TRPM5', 'C', 'T'],
  ['chr11', 69593819, 'FGF4_a', 'G', 'A'],
  ['chr17', 76352731, 'SOCS3', 'G', 'A'],
  ['chr19', 1854681, 'REXO1', 'C', 'G'],
  ['chr19', 59070227, 'UBE2M', 'C', 'A'],
]);

// The live site's Seqweaver example, as uploaded in example job 76aea8fe.
const rnaVariants = rows([
  ['chr1', 109817590, '[known_CEBP_binding_increase]', 'G', 'T', '-'],
  ['chr10', 23508363, '[known_FOXA2_binding_decrease]', 'A', 'G', '+'],
  ['chr16', 52599188, '[known_FOXA1_binding_increase]', 'C', 'T', '-'],
  ['chr16', 209709, '[known_GATA1_binding_increase]', 'T', 'C', '-'],
  ['chr16', 83947129, 'MLYCD', 'T', 'A', '+'],
  ['chr16', 85833314, 'COX4I1', 'G', 'T', '+'],
  ['chr17', 76352731, 'SOCS3', 'G', 'A', '+'],
  ['chr19', 1854681, 'REXO1', 'C', 'G', '+'],
  ['chr19', 55999138, 'SSC5D', 'G', 'A', '+'],
  ['chr19', 59070227, 'UBE2M', 'C', 'A', '+'],
]);

/** Each tool's example input, by kind. Regions and sequences have no recorded example yet. */
export const deepseaExamples: Record<VariantModel, Partial<Record<InputKind, string>>> = {
  sei: { vcf: dnaVariants },
  beluga: { vcf: dnaVariants },
  seqweaver: { vcf: rnaVariants },
  expecto: { vcf: dnaVariants },
};
