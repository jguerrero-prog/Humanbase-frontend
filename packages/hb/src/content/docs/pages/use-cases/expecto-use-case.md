---
{
  "title": "ExPecto use case",
  "slug": "use-cases/expecto-use-case",
  "group": "use-cases",
  "order": 17,
  "live": "https://humanbase.readthedocs.io/en/latest/use-cases/expecto-use-case.html",
  "sections": [
    {
      "id": "expecto-use-case",
      "title": "ExPecto use case",
      "level": 1
    }
  ],
  "images": {
    "expecto-1.png": [1552, 726],
    "expecto-2.png": [1999, 963],
    "expecto-3.png": [1999, 444],
    "expecto-4.png": [694, 820],
    "expecto-5.png": [1592, 396],
    "expecto-6.png": [1854, 682]
  }
}
---

# ExPecto use case {#expecto-use-case}

**Task: What is the impact of a noncoding variant on the tissue-specific expression of nearby genes?**

- Select the ExPecto analysis and input the query by gene name, VCF file, or SNP rsID. We first demonstrate a query by gene name.

![ExPecto use case, screenshot 1](/docs/img/expecto-1.png)

- View predictions for the tissue-specific gene expression of the gene of interest. Selecting a tissue system in the overview view (for example, hematopoietic system) shows the expression impact in specific tissues within that tissue system. The expression effect is the log fold change between the expression level of the reference and alternate allele (see ExPecto documentation). The results can also be downloaded in tabular form using the “Download” button.

![ExPecto use case, screenshot 2](/docs/img/expecto-2.png)

![ExPecto use case, screenshot 3](/docs/img/expecto-3.png)

**Step 3:** We next demonstrate a VCF-formatted query. We query using VCF format the variant rs33944208 (chr11:5248389 G>A in hg19 coordinates). This variant is associated with beta-thalassemia with reduced expression of the HBB gene (Orkin et al. 1984 PMID: 6086605). Note that although a single variant is queried in this example, the interface supports simultaneously querying many (up to 10,000) variants.

![ExPecto use case, screenshot 4](/docs/img/expecto-4.png)

![ExPecto use case, screenshot 5](/docs/img/expecto-5.png)

**Step 4:** In the genome browser results view, we see that this variant is in the 5’ UTR of the HBB gene.

**Step 5:** ExPecto predicts that the variant downregulates the associated gene across cell types.

![ExPecto use case, screenshot 6](/docs/img/expecto-6.png)
