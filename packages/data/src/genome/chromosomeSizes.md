# chromosomeSizes.json

The lengths of the main chromosomes (chr1 to chr22, chrX, chrY and chrM) on hg19 and hg38, from the UCSC Genome Browser REST API, https://api.genome.ucsc.edu/list/chromosomes, recorded on the date in the file by `node scripts/record-chrom-sizes.mjs`.

Only the main chromosomes are kept. UCSC also lists unplaced, random, alternate and fix contigs, which Humanbase's track files and the location field don't use.

Source: UCSC Genome Browser, https://genome.ucsc.edu/. Kent WJ, Sugnet CW, Furey TS, et al. The Human Genome Browser at UCSC. Genome Research 2002;12(6):996–1006. UCSC's Conditions of Use limit programs to one request every 15 seconds and 5,000 a day, so the file is recorded once and committed, not fetched at runtime.
