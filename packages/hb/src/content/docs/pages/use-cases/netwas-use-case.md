---
{
  "title": "NetWAS use case",
  "slug": "use-cases/netwas-use-case",
  "group": "use-cases",
  "order": 28,
  "live": "https://humanbase.readthedocs.io/en/latest/use-cases/netwas-use-case.html",
  "sections": [
    {
      "id": "netwas-use-case",
      "title": "NetWAS use case",
      "level": 1
    }
  ],
  "images": {
    "netwas-1.png": [982, 1148],
    "netwas-2.png": [1498, 1012]
  }
}
---

# NetWAS use case {#netwas-use-case}

**Task: Which nominally significant hits in a GWAS of BMI are likely to be causal?**

- Select “GWAS re-prioritization (NetWAS)” analysis. Prepare a per-gene P-value summary file for the GWAS of interest (using the VEGAS framework is recommended for this). Upload the per-gene P-value summary file, select the GWAS file type, tissue context, and P-value threshold. Enter an email for receiving results and job title. Select “Submit.”

![NetWAS use case, screenshot 1](/docs/img/netwas-1.png)

- NetWAS analysis results are provided by email. Results are ranked by an SVM classifier based on the similarity of the network connectivity of each gene to nominally significant training examples.

![NetWAS use case, screenshot 2](/docs/img/netwas-2.png)
