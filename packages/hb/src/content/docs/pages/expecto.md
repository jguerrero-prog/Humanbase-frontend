---
{
  "title": "ExPecto",
  "slug": "expecto",
  "group": "sequence-analysis",
  "label": "ExPecto",
  "order": 11,
  "live": "https://humanbase.readthedocs.io/en/latest/expecto.html",
  "sections": [
    {
      "id": "expecto",
      "title": "ExPecto",
      "level": 1
    },
    {
      "id": "introduction",
      "title": "Introduction",
      "level": 2
    },
    {
      "id": "method-details",
      "title": "Method Details",
      "level": 2
    },
    {
      "id": "download",
      "title": "Download",
      "level": 2
    },
    {
      "id": "predicted-expression-effects",
      "title": "Predicted expression effects",
      "level": 3
    },
    {
      "id": "variation-potential-directionality-scores",
      "title": "Variation potential directionality scores",
      "level": 3
    },
    {
      "id": "output",
      "title": "Output",
      "level": 2
    },
    {
      "id": "expecto-expression-effect",
      "title": "ExPecto expression effect",
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

# ExPecto {#expecto}

## Introduction {#introduction}

ExPecto is a framework for _ab initio_ sequence-based prediction of mutation gene expression effects and disease risks. Importantly, this framework is trained without using any variant data, allowing it to predict the expression effects of any variant, including rare or previously unseen ones. With this web interface, we provide an explorer of tissue-specific expression effect predictions.

The ExPecto framework is described in the following manuscript: Jian Zhou, Chandra L. Theesfeld, Kevin Yao, Kathleen M. Chen, Aaron K. Wong, and Olga G. Troyanskaya, [Deep learning sequence-based ab initio prediction of variant effects on expression and disease risk](https://www.nature.com/articles/s41588-018-0160-6), Nature Genetics (2018).

The code for predicting expression effects for human genome variants and training new expression models is available at this [github repository](https://github.com/FunctionLab/ExPecto).

## Method Details {#method-details}

ExPecto uses exponential basis function-based linear models upon deep convolutional network model of chromatin effects. ExPecto predicts expression levels directly from sequence and is capable of predicting effects of sequence variations.

For detailed procedures of the prediction, the chromatin predictions were computed from DeepSEA “Beluga” per 200bp bin, and 200 bins centered at TSS (40kb region) were used as input to predict expression effects. To reduce the dimensionality for ExPecto model training, the predicted chromatin spatial patterns were summarized to spatial features by 10 exponential basis functions. The summarized spatial features and gene expression levels were used to train regularized linear models for the final step of the prediction. The representative TSSes are selected based on FANTOM CAGE data.

We also propose a path toward _ab initio_ disease risk prediction through combining the prediction of expression effects and the estimation of evolutionary constraints on expression levels. For example, mutations predicted to have strong negative expression effects on a positively constrained gene are predicted to be deleterious. We estimate evolutionary constraints through systematic profiling of potential mutation effects through in silico mutagenesis. As proof-of-principle we showed that this approach can predict the disease alleles from both curated HGMD disease mutation data and disease GWASes.

## Download {#download}

### Predicted expression effects {#predicted-expression-effects}

This is the bulk download [link](https://s3-us-west-2.amazonaws.com/humanbase/expecto/combined_snps.0.3.zip) (1.9 GB) of 1000 Genomes variants that passed a minimum predicted effect threshold (>0.3 log fold-change in any tissue).

### Variation potential directionality scores {#variation-potential-directionality-scores}

Variation potential of a gene in a tissue or cell-type can reflect the evolutionary constraint on its expression level. Specifically, we compute the variation potential directionality score as the sum of all directional mutation effects within 1kb to TSS. A negative variation potential indicates active expression and constraint toward higher expression level, and vice versa. The sum of absolute mutation effects, or the magnitudes, is predictive of tissue/condition-specificity of a gene. The variation potential directionality scores and the inferred evolutionary constraint probabilities can be downloaded [here](https://s3-us-west-2.amazonaws.com/humanbase/expecto/evocon.zip) (34.4 MB).

The full prediction of all 140 million mutations can be downloaded [here](https://s3-us-west-2.amazonaws.com/humanbase/expecto/all1kbmutations.tar) (128 GB).

## Output {#output}

### ExPecto expression effect {#expecto-expression-effect}

The ExPecto expression effect is the difference of predicted expression levels for reference and alternative allele. (See the [Expecto paper (2018)](https://www.nature.com/articles/s41588-018-0160-6))

### Regulatory feature scores {#regulatory-feature-scores}

The z-score, e-value, and probability diffs are computed as for the [DeepSEA (Beluga) model](/docs/beluga/#regulatory-feature-scores).

- **DeepSEA probability diffs**: The difference between the predicted probability of the reference allele and the alternative allele for a regulatory feature ($p_{alt} -p_{ref}$).
- **DeepSEA e-value**: E-value is defined as the expected proportion of SNPs with a larger predicted effect. We calculate an ‘e-value’ based on the empirical distribution of that feature’s effect ($abs(p_{alt} -p_{ref})$) among gnomAD variants. For example, a feature e-value of 0.01 indicates that only 1% of gnomAD variants have a larger predicted effect.
- **DeepSEA z-score**: A scaled score where the feature diff score ($p_{alt} -p_{ref}$) is divided by the root mean square of the feature diff score across gnomAD variants. Note that this is “sign-preserving”, i.e. a negative z-score indicates that a mutation **decreases** the probability of a regulatory feature.
