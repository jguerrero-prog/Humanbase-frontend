---
{
  "title": "In Silico Mutagenesis",
  "slug": "in-silico-mutagenesis",
  "group": "sequence-analysis",
  "label": "In silico mutagenesis",
  "order": 13,
  "live": "https://humanbase.readthedocs.io/en/latest/in-silico-mutagenesis.html",
  "sections": [
    {
      "id": "in-silico-mutagenesis",
      "title": "In Silico Mutagenesis",
      "level": 1
    },
    {
      "id": "introduction",
      "title": "Introduction",
      "level": 2
    },
    {
      "id": "output",
      "title": "Output",
      "level": 2
    }
  ],
  "images": {}
}
---

# In Silico Mutagenesis {#in-silico-mutagenesis}

## Introduction {#introduction}

Perform “In silico saturated mutagenesis” (ISM) analysis to discover informative sequence features within any sequence. Specifically, ISM performs computational mutation scanning to assess the effect of mutating every base of the input sequence on chromatin feature predictions. This method for context-specific sequence feature extraction takes advantage of DeepSEA’s ability to utilize flanking context sequences information.

Note that ISM only accepts a sequence (FASTA file) as input. The input FASTA file should be 2000 base pairs long.

The chromatin impact prediction is performed using the [Beluga (DeepSEA)](/docs/beluga/) model. See the following manuscript: Jian Zhou, Chandra L. Theesfeld, Kevin Yao, Kathleen M. Chen, Aaron K. Wong, and Olga G. Troyanskaya, [Deep learning sequence-based ab initio prediction of variant effects on expression and disease risk](https://www.nature.com/articles/s41588-018-0160-6). Nature Genetics (2018).

ISM outputs effects for each of three possible substitutions of all 2000 bases, across all chromatin features.

## Output {#output}

The effect of a base substitution on a specific chromatin feature prediction was measured by log2 fold change of odds, where P$_{0}$ represents the probability predicted for the original sequence and P$_{1}$ represents the probability predicted for the mutated sequence:

$$
\log_2 \left(\frac{P_0}{1 - P_0}\right) - \log_2 \left(\frac{P_1}{1 - P_1}\right)
$$

(See the [DeepSEA paper (2015)](https://www.nature.com/articles/nmeth.3547))
