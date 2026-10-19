import { VariantFileCheck } from './VariantFileCheck';

const vcf = (rows: string[]) => ['#CHROM\tPOS\tID\tREF\tALT', ...rows].join('\n');

describe('VariantFileCheck', () => {
  it('passes a valid VCF and summarizes its chromosomes', () => {
    const result = new VariantFileCheck('vcf', 'sei').check(vcf(['chr1\t100\trs1\tA\tG', 'chr2\t200\t\tC\tT', 'chr3\t5\t.\tG\tA', 'chrX\t9\t.\tT\tC']));
    expect(result.problems).toEqual([]);
    expect(result.summary).toBe('4 variants on chromosomes 1 to 3 and X');
  });

  it('names the line and the rule it breaks', () => {
    const result = new VariantFileCheck('vcf', 'seqweaver').check(vcf(['chr1\t100\trs1\tN\tG\t+', 'chr1\t200\trs2\tA\tG']));
    expect(result.problems).toEqual([
      { line: 2, rule: 'REF is N. Use A, C, G or T.' },
      { line: 3, rule: 'No strand column. Seqweaver needs + or - in column 6.' },
    ]);
  });

  it('checks FASTA length against the model', () => {
    const result = new VariantFileCheck('fasta', 'seqweaver').check(`>a\n${'acgt'.repeat(250)}\n>b\nACGTN`);
    expect(result.count).toBe(2);
    expect(result.problems).toEqual([
      { line: 4, rule: 'N isn’t a base. Use A, C, G or T.' },
      { line: 3, rule: 'The sequence is 5 bp; Seqweaver reads 1,000 bp.' },
    ]);
  });

  it('flags BED values and suggests the right input type', () => {
    const result = new VariantFileCheck('vcf', 'sei').check('chr1\t100\t106');
    expect(result.otherKind).toBe('This looks like a BED file. Switch to Regions (BED) to use it.');
    expect(new VariantFileCheck('bed', 'sei').check('chr1\t-1\t5').problems).toEqual([{ line: 1, rule: 'Start and end are whole numbers, 0 or more.' }]);
    expect(new VariantFileCheck('bed', 'sei').check('chr1\t500\t500').problems).toEqual([{ line: 1, rule: 'End is 500. Use a number greater than the start, 500.' }]);
  });

  it('says when a file is over the limit', () => {
    const rows = Array.from({ length: 20001 }, (_, i) => `chr1\t${i + 1}\t.\tA\tG`);
    expect(new VariantFileCheck('vcf', 'sei').check(rows.join('\n')).limit).toBe('This file has 20,001 variants; Humanbase runs up to 20,000 per job. Split it into two files.');
  });
});
