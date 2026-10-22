---
{
  "title": "Sei",
  "slug": "sei",
  "group": "sequence-analysis",
  "label": "Sei",
  "order": 8,
  "live": "https://humanbase.readthedocs.io/en/latest/sei.html",
  "sections": [
    {
      "id": "sei",
      "title": "Sei",
      "level": 1
    },
    {
      "id": "introduction",
      "title": "Introduction",
      "level": 2
    },
    {
      "id": "input",
      "title": "Input",
      "level": 2
    },
    {
      "id": "large-submissions",
      "title": "Large submissions",
      "level": 3
    },
    {
      "id": "output",
      "title": "Output",
      "level": 2
    },
    {
      "id": "sequence-classes",
      "title": "Sequence classes",
      "level": 3
    },
    {
      "id": "regulatory-feature-scores",
      "title": "Regulatory feature scores",
      "level": 3
    }
  ],
  "images": {}
}
---

# Sei {#sei}

## Introduction {#introduction}

Sei is a deep-learning-based framework for systematically predicting sequence regulatory activities and applying sequence information to understand human genetics data. Sei provides a global map from any sequence to regulatory activities, as represented by 40 sequence classes. Each sequence class integrates predictions for 21,907 chromatin profiles (transcription factor, histone marks, and chromatin accessibility profiles across a wide range of cell types) from the underlying Sei deep learning model. Importantly, this framework is trained without using any variant data, allowing it to predict the regulatory impact of any variant, including rare or previously unseen ones.

Sei is described in the following manuscript: Kathleen M. Chen, Aaron K. Wong, Olga G. Troyanskaya and Jian Zhou, [A sequence-based global map of regulatory activity for deciphering human genetics](https://www.nature.com/articles/s41588-022-01102-2). Nature Genetics (2022).

The Sei code repository can be found [here](https://github.com/FunctionLab/sei-framework).

For older DeepSEA models see: [Beluga (DeepSEA)](/docs/beluga/) (2019)

## Input {#input}

We support three types of input: VCF, FASTA, BED. If you want to predict effects of noncoding variants, use VCF format input. If you want to predict chromatin feature probabilities for DNA sequences, use FASTA format. If you want to specify sequences from the human reference genome, you can use BED format. See below for a quick introduction:

**VCF format** is used for specifying a genomic variant. A minimal example is `chr1 109817590 - G T` (if you want to copy this text as input, you will need to change spaces to tabs). The five columns are chromosome, position, name, reference allele, and alternative allele.

**FASTA format** input should include sequences of 4096bp length each. If a sequence is different from 4096bp:

- **Note**: The prediction is for the center base of the input sequence
- **Longer sequences**: Only the center 4096bp will be used
- **Shorter sequences**: Sequences shorter than 4096bp will be padded with ‘N’ bases evenly on both sides
  - **Important**: We do not recommend using FASTA input smaller than 4096bp unless it is very close (only a few bp off)
  - **Note**: This padding behavior is not recommended. N’s were extremely rare in training data (only appearing in assembly gaps), and the model has not been evaluated with artificially padded sequences
  - **Strong recommendation**: Always provide sequences of exactly 4096bp by including genomic flanking sequences

**BED format** provides another way to specify sequences in human reference genome. A minimal example is `chr5 134871851 134871852`. The three columns are chromosome, start position, and end position.

**Important BED Format Notes:**

- **Coordinate System**: BED format uses 0-indexed start positions and 1-indexed end positions (half-open intervals). This is different from VCF format which uses 1-indexed positions.
  - For equal start/end coordinates: interpreted as single position analysis (e.g., chr1:10000-10000 → center at position 10000)
  - For odd-length intervals: the center is unambiguous (e.g., chr1:100-103 has center at position 101)
  - For even-length intervals: we use the left-center position (floor division)
- **Sequence Extraction**: As stated in the [Selene SDK documentation](https://selene.flatironinstitute.org/master/predict.html#selene_sdk.predict.model_predict.ModelPredict.get_predictions_for_bed_file): _“The coordinates specified in each row are only used to find the center position for the resulting sequence– regions returned will have the length expected by the model.”_
  - **Model-specific lengths**: Sequence length varies by model (Seqweaver: 1000bp, Beluga: 2000bp, Sei: 4096bp)
    - Example: 5000bp interval chr1:10000-15000 with Beluga model → only center 2000bp (chr1:11500-13500) analyzed
    - Consider using multiple smaller intervals if you need analysis of the entire large region

### Large submissions {#large-submissions}

We recommend using the web server for submissions of **10,000 or fewer variants or sequences**. You will experience degraded performance with larger submissions, and the absolute maximum per submission is **20,000**. For larger sets, we suggest one of the following:

- Split the set into multiple submissions of 10,000 or fewer variants each, submitting them sequentially (wait for each to complete before submitting the next).
- Run the standalone version on your local machine.
- Contact our group directly.

## Output {#output}

### Sequence classes {#sequence-classes}

The Sei framework predicts 40 sequence class scores, covering a wide range of regulatory activities such as cell-type-specific enhancers and promoters, as well as 21,907 chromatin profiles for any DNA sequence. Sequence class-level variant effects are computed by comparing the predictions for the reference and the alternative alleles. A positive score indicates an increase in sequence class activity by the alternative allele and vice versa. Sequence class-level scores are computed by projecting the 21,907 chromatin profile predictions for the sequence to the unit vector that represents each sequence class.A full description of how Sei sequence scores are computed can be found in the [Sei paper (2022)](https://www.nature.com/articles/s41588-022-01102-2).

To help interpretation, we grouped sequence classes into groups including P (Promoter), E (Enhancer), CTCF (CTCF-cohesin binding), TF (TF binding), PC (Polycomb-repressed), HET (Heterochromatin), TN (Transcription), and L (Low Signal) sequence classes. Please refer to our manuscript for a more detailed description of the sequence classes.

Note: sequence class predictions are only available for vcf inputs.

| Sequence class label | Sequence class name               | Rank by size | Group |
| -------------------- | --------------------------------- | -----------: | ----- |
| PC1                  | Polycomb / Heterochromatin        |            0 | PC    |
| L1                   | Low signal                        |            1 | L     |
| TN1                  | Transcription                     |            2 | TN    |
| TN2                  | Transcription                     |            3 | TN    |
| L2                   | Low signal                        |            4 | L     |
| E1                   | Stem cell                         |            5 | E     |
| E2                   | Multi-tissue                      |            6 | E     |
| E3                   | Brain / Melanocyte                |            7 | E     |
| L3                   | Low signal                        |            8 | L     |
| E4                   | Multi-tissue                      |            9 | E     |
| TF1                  | NANOG / FOXA1                     |           10 | TF    |
| HET1                 | Heterochromatin                   |           11 | HET   |
| E5                   | B-cell-like                       |           12 | E     |
| E6                   | Weak epithelial                   |           13 | E     |
| TF2                  | CEBPB                             |           14 | TF    |
| PC2                  | Weak Polycomb                     |           15 | PC    |
| E7                   | Monocyte / Macrophage             |           16 | E     |
| E8                   | Weak multi-tissue                 |           17 | E     |
| L4                   | Low signal                        |           18 | L     |
| TF3                  | FOXA1 / AR / ESR1                 |           19 | TF    |
| PC3                  | Polycomb                          |           20 | PC    |
| TN3                  | Transcription                     |           21 | TN    |
| L5                   | Low signal                        |           22 | L     |
| HET2                 | Heterochromatin                   |           23 | HET   |
| L6                   | Low signal                        |           24 | L     |
| P                    | Promoter                          |           25 | P     |
| E9                   | Liver / Intestine                 |           26 | E     |
| CTCF                 | CTCF-Cohesin                      |           27 | CTCF  |
| TN4                  | Transcription                     |           28 | TN    |
| HET3                 | Heterochromatin                   |           29 | HET   |
| E10                  | Brain                             |           30 | E     |
| TF4                  | OTX2                              |           31 | TF    |
| HET4                 | Heterochromatin                   |           32 | HET   |
| L7                   | Low signal                        |           33 | L     |
| PC4                  | Polycomb / Bivalent stem cell Enh |           34 | PC    |
| HET5                 | Centromere                        |           35 | HET   |
| E11                  | T-cell                            |           36 | E     |
| TF5                  | AR                                |           37 | TF    |
| E12                  | Erythroblast-like                 |           38 | E     |
| HET6                 | Centromere                        |           39 | HET   |

### Regulatory feature scores {#regulatory-feature-scores}

- **diffs**: The difference between the predicted probability of the reference allele and the alternative allele for a regulatory feature ($p_{alt} -p_{ref}$).
