---
{
  "title": "ExPectoSC",
  "slug": "expectosc",
  "group": "sequence-analysis",
  "label": "ExPectoSC",
  "order": 12,
  "live": "https://humanbase.readthedocs.io/en/latest/expectosc.html",
  "sections": [
    {
      "id": "expectosc",
      "title": "ExPectoSC",
      "level": 1
    },
    {
      "id": "introduction",
      "title": "Introduction",
      "level": 2
    },
    {
      "id": "website-overview",
      "title": "Website overview",
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
      "id": "output",
      "title": "Output",
      "level": 2
    }
  ],
  "images": {
    "expectosc_img1.png": [2364, 846],
    "expectosc_img2.png": [1464, 448],
    "expectosc_img3.png": [2406, 1124],
    "expectosc_img4.png": [1704, 552],
    "expectosc_img5.jpg": [1600, 777]
  }
}
---

# ExPectoSC {#expectosc}

## Introduction {#introduction}

ExPectoSC is a framework for _ab initio_ sequence-based prediction of mutation gene expression effects for primary human cell types. With this web interface, we provide an explorer of cell type-specific expression effect predictions. The current release contains all ClinVar variants within +/- 20kb of the representative TSS of a gene. We use 1000 Genomes variant effects predictions for z-score normalization. No effect threshold was employed for the current release of the data. Importantly, this framework is trained without using any variant data, allowing it to predict the expression effects of any variant, including rare or previously unseen ones.

The ExPectoSC framework is described in the following manuscript: Ksenia Sokolova, Chandra L. Theesfeld, Aaron K. Wong, Zijun Zhang, Kara Dolinski and Olga G. Troyanskaya, [Atlas of primary cell-type specific sequence models of gene expression and variant effects](https://www.cell.com/cell-reports-methods/fulltext/S2667-2375\(23\)00224-2). Cell Reports Methods (2023).

The code for predicting expression effects for human genome variants and training new expression models is available at this [github repository](https://github.com/ksenia007/ExPectoSC).

## Website overview {#website-overview}

After user enters a gene name, the Primary View is returned showing the predictions for the pre-computed variants for the region (includes 1000G and ClinVar variants). The variants are oriented so that the lowest chromosomal coordinate for the gene region is on the left side of the screen. The heatmap colors represent the max effect cell type prediction within the organ system. Rows are grouped organ systems, and columns are variant locations:

![Primary view](/docs/img/expectosc_img1.png)

To see details about the top cell type and effect per variant the user can hover over the square to see the specific normalized value:

![Primary view with hover information](/docs/img/expectosc_img2.png)

To see all the cell type predictions for an organ system, the user can click on the organ name. For example, here are the PTEN results for brain:

![Details page](/docs/img/expectosc_img3.png)

As previously, hovering over the heat map shows additional information about the variant and effect:

![Details page with hover](/docs/img/expectosc_img4.png)

Drop-down menu in the upper left corner allows users to select multiple organ cell types at the same time for a side-by-side comparison:

![Drop-down menu](/docs/img/expectosc_img5.jpg)

## Method Details {#method-details}

ExPectoSC is a modular framework, that uses regularized linear module upon deep convolutional network model of chromatin profiling effects to predict cell type specific expression. The framework is capable of predicting expression levels directly from sequence and is sensitive to the sequence variations.

The chromatin predictions were computed using a DeepSEA “Beluga” model, using sliding window approach of 2000bp width with 200bp step, for the 40kb region surrounding the TSS. Exponential condense function is then used to reduce the dimensionality of the data before using it in the regularized linear module.

## Download {#download}

[ClinVar scaled non-coding predictions](https://humanbase.s3.us-west-2.amazonaws.com/clever/clinvar_1000G_final_nc_all_info.csv) (114.4 MB)

[sLDSC annotations](https://humanbase.s3.us-west-2.amazonaws.com/clever/CLEVER_preds_sLDSC_annot.tgz) (2.0 GB)

[DeepSEA weights](https://humanbase.s3.us-west-2.amazonaws.com/clever/deepsea.beluga.pth) (570.4 MB)

## Output {#output}

**Expression Effect**: The Expression Effect scores are z-scored values for the predicted difference between reference and alternative alleles. Z-scores are computed per cell-type, with variant sets normalized to those of 1000 Genomes variants. The expression effect for a given variant is computed as:

$$
(s - mean(s_{1},...,s_{m}))/std(s_{1},...,s_{m}),
$$

where

$$
(s_{1},...,s_{m})
$$

are all of the 1000 Genomes variant predictions for the given cell type, and s is the unscaled variant effect prediction for the variant of interest. As a rough guideline, z-scores of above \~3-5 represent more reliable predictions. See the [ExPectoSC paper (2023)](https://www.cell.com/cell-reports-methods/fulltext/S2667-2375\(23\)00224-2).
