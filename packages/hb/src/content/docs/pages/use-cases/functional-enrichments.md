---
{
  "title": "Functional enrichments in networks use case",
  "slug": "use-cases/functional-enrichments",
  "group": "use-cases",
  "order": 23,
  "live": "https://humanbase.readthedocs.io/en/latest/use-cases/functional-enrichments.html",
  "sections": [
    {
      "id": "functional-enrichments-in-networks-use-case",
      "title": "Functional enrichments in networks use case",
      "level": 1
    }
  ],
  "images": {
    "functional-enrichments-1.png": [1754, 776],
    "functional-enrichments-2.png": [734, 138],
    "functional-enrichments-3.png": [540, 600],
    "functional-enrichments-4.png": [976, 912]
  }
}
---

# Functional enrichments in networks use case {#functional-enrichments-in-networks-use-case}

This use case is drawn from De Roover et al. 2021, Hypoxia induces DOT1L in articular cartilage to protect against osteoarthritis.

**Task: What processes are enriched among genes functionally related to my genes of interest in cartilage tissue?**

- Input genes of interest (18 TFs identified as likely to regulate osteoarthritis-relevant gene DOT1L). Select “Search.”

![Functional enrichments in networks use case, screenshot 1](/docs/img/functional-enrichments-1.png)

- Select tissue type of interest (cartilage).

![Functional enrichments in networks use case, screenshot 2](/docs/img/functional-enrichments-2.png)

- View functional enrichments of the gene of interest and related genes in the cartilage network. Download the network and functional enrichments. The color of an edge in the functional network indicates the probability that the corresponding pair of genes is functionally related. For GIANT networks, edge weights are computed by Bayesian integration of the data compendium using the tissue-specific gold standard. For MAGE networks, edge weights are computed by a masked graph autoencoder and gradient-boosted integration model.

![Functional enrichments in networks use case, screenshot 3](/docs/img/functional-enrichments-3.png)

![Functional enrichments in networks use case, screenshot 4](/docs/img/functional-enrichments-4.png)
