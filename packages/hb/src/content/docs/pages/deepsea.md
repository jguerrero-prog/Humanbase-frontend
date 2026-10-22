---
{
  "title": "DeepSEA Analysis",
  "slug": "deepsea",
  "group": "sequence-analysis",
  "label": "DeepSEA analysis",
  "order": 7,
  "live": "https://humanbase.readthedocs.io/en/latest/deepsea.html",
  "sections": [
    {
      "id": "deepsea-analysis",
      "title": "DeepSEA Analysis",
      "level": 1
    },
    {
      "id": "introduction",
      "title": "Introduction",
      "level": 2
    },
    {
      "id": "deepsea-based-methods",
      "title": "DeepSEA-based Methods",
      "level": 2
    }
  ],
  "images": {}
}
---

# DeepSEA Analysis {#deepsea-analysis}

## Introduction {#introduction}

DeepSEA is a deep learning framework that predicts genomic variant effects with single nucleotide sensitivity on a wide range of regulatory features: transcription factors binding, DNase I hypersensitive sites, and histone marks in multiple human cell types. Importantly, this framework is trained without using any variant data, allowing it to predict the chromatin impact of any variant, including rare or previously unseen ones.

## DeepSEA-based Methods {#deepsea-based-methods}

The following analysis tools and methods in Humanbase are built upon the DeepSEA framework:

- [Sei](/docs/sei/) - Extended regulatory and chromatin effects of variants (2021)
- [Beluga (DeepSEA)](/docs/beluga/) - Chromatin effects of variants (2019)
- [Seqweaver](/docs/seqweaver/) - Post-transcriptional variant effects
- [ExPecto](/docs/expecto/) - Tissue-specific gene expression effects of variants
- [ExPectoSC](/docs/expectosc/) - Cell-type-specific gene expression effects for mutations
- [In Silico Mutagenesis](/docs/in-silico-mutagenesis/) - Discover regulatory features of sequences
- [ASD Browser](/docs/asdbrowser/) - Predicted effects of ASD proband mutations
