---
{
  "title": "Beluga (DeepSEA)",
  "slug": "beluga",
  "group": "sequence-analysis",
  "label": "Beluga (DeepSEA)",
  "order": 9,
  "live": "https://humanbase.readthedocs.io/en/latest/beluga.html",
  "sections": [
    {
      "id": "beluga-deepsea",
      "title": "Beluga (DeepSEA)",
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
      "id": "variant-scores",
      "title": "Variant scores",
      "level": 3
    },
    {
      "id": "molecular-level-biochemical-effects-prediction",
      "title": "Molecular-level biochemical effects prediction",
      "level": 3
    }
  ],
  "images": {}
}
---

# Beluga (DeepSEA) {#beluga-deepsea}

## Introduction {#introduction}

DeepSEA is a deep learning-based algorithmic framework for predicting the chromatin effects of sequence alterations with single nucleotide sensitivity. DeepSEA can accurately predict the epigenetic state of a sequence, including transcription factors binding, DNase I sensitivities and histone marks in multiple cell types, and further utilize this capability to predict the chromatin effects of sequence variants and prioritize regulatory variants. Importantly, this framework is trained without using any variant data, allowing it to predict the chromatin impact of any variant, including rare or previously unseen ones. The 2019 version of DeepSEA, nicknamed ‘**Beluga**’, can predict **2002** chromatin features.

Beluga is described in: Jian Zhou, Chandra L. Theesfeld, Kevin Yao, Kathleen M. Chen, Aaron K. Wong, and Olga G. Troyanskaya, [Deep learning sequence-based ab initio prediction of variant effects on expression and disease risk](https://www.nature.com/articles/s41588-018-0160-6). Nature Genetics (2018).

DeepSEA is originally described in the following manuscript: Jian Zhou, Olga G. Troyanskaya. [Predicting the Effects of Noncoding Variants with Deep learning-based Sequence Model](https://www.nature.com/articles/nmeth.3547) Nature Methods (2015).

To determine if certain features (ie. transcription factors, marks, or cell types) are present/accounted for in the model, refer to the [supplemental feature table](https://s3-us-west-2.amazonaws.com/humanbase-dev/deepsea/examples/41588_2019_420_MOESM9_ESM.csv) which has all the profiles used to train Beluga.

## Input {#input}

Beluga predicts genomic variant effects on a wide range of chromatin features at the variant position (Transcription factors binding, DNase I hypersensitive sites, and histone marks in multiple human cell types).

We support three types of input: VCF, FASTA, BED. If you want to predict effects of noncoding variants, use VCF format input. If you want to predict chromatin feature probabilities for DNA sequences, use FASTA format. If you want to specify sequences from the human reference genome, you can use BED format. See below for a quick introduction:

**VCF format** is used for specifying a genomic variant. A minimal example is `chr1 109817590 - G T` (if you want to copy this text as input, you will need to change spaces to tabs). The five columns are chromosome, position, name, reference allele, and alternative allele.

**FASTA format** input should include sequences of 2000bp length each. If a sequence is different from 2000bp:

- **Note**: The prediction is for the center base of the input sequence
- **Longer sequences**: Only the center 2000bp will be used
- **Shorter sequences**: Sequences shorter than 2000bp will be padded with ‘N’ bases evenly on both sides
  - **Important**: We do not recommend using FASTA input smaller than 2000bp unless it is very close (only a few bp off)
  - **Note**: This padding behavior is not recommended. N’s were extremely rare in training data (only appearing in assembly gaps), and the model has not been evaluated with artificially padded sequences
  - **Strong recommendation**: Always provide sequences of exactly 2000bp by including genomic flanking sequences

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

### Variant scores {#variant-scores}

- **Disease Impact Score (DIS)**: DIS is calculated by training a logistic regression model that prioritizes likely disease-associated mutations on the basis of the predicted transcriptional or post-transcriptional regulatory effects of these mutations (See [Zhou et. al, 2019](https://www.nature.com/articles/s41588-019-0420-0)). The predicted DIS probabilities are then converted into ‘DIS e-values’, computed based on the empirical distributions of predicted effects for gnomAD variants. The final DIS score is:
  $$
  -log10(DIS evalue_{feature})
  $$
- **Mean -log e-value (MLE)**: For each predicted regulatory feature effect ($abs(p_{alt}-p_{ref}$)) of a variant, we calculate a ‘feature e-value’ based on the empirical distribution of that feature’s effects among gnomAD variants (see below Molecular-level biochemical effects prediction: e-value). The MLE score of a variant is
  $$
  \sum -log10(evalue_{feature}) / N
  $$

### Molecular-level biochemical effects prediction {#molecular-level-biochemical-effects-prediction}

- **diffs**: The difference between the predicted probability of the reference allele and the alternative allele for a regulatory feature ($p_{alt} -p_{ref}$).
- **e-value**: E-value is defined as the expected proportion of SNPs with a larger predicted effect. We calculate an ‘e-value’ based on the empirical distribution of that feature’s effect ($abs(p_{alt} -p_{ref})$) among gnomAD variants. For example, a feature e-value of 0.01 indicates that only 1% of gnomAD variants have a larger predicted effect.
- **z-score**: A scaled score where the feature diff score ($p_{alt} -p_{ref}$) is divided by the root mean square of the feature diff score across gnomAD variants. Note that this is “sign-preserving”, i.e. a negative z-score indicates that a mutation **decreases** the probability of a regulatory feature.
- **Probability:** The predicted probability for the given allele for each regulatory feature (displayed in the interface for BED and FASTA inputs).
