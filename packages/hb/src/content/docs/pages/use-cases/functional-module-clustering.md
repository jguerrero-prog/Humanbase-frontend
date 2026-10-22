---
{
  "title": "Functional module clustering use cases",
  "slug": "use-cases/functional-module-clustering",
  "group": "use-cases",
  "order": 26,
  "live": "https://humanbase.readthedocs.io/en/latest/use-cases/functional-module-clustering.html",
  "sections": [
    {
      "id": "functional-module-clustering-use-cases",
      "title": "Functional module clustering use cases",
      "level": 1
    }
  ],
  "images": {
    "functional-module-1.png": [1792, 962],
    "functional-module-2.png": [1999, 968],
    "functional-module-3.png": [2342, 1450],
    "functional-module-4.png": [2340, 1446]
  }
}
---

# Functional module clustering use cases {#functional-module-clustering-use-cases}

This use case is drawn from Bishop et al. 2022, Inflammation Subtypes and Translating Inflammation-Related Genetic Findings in Schizophrenia and Related Psychoses: A Perspective on Pathways for Treatment Stratification and Novel Therapies

**Task: How can I partition my list of genes of interest into modules, and what are the functional enrichments in these modules?**

- Select the “Modules” analysis. Input genes of interest (103 druggable schizophrenia-related genes). Select the desired network (central nervous system). Select “Search.”

![Functional module clustering use cases, screenshot 1](/docs/img/functional-module-1.png)

- View the modules identified by data-driven community clustering of the gene set of interest in the selected network. The functional enrichments of the detected modules can also be viewed and the minimum module size cutoff  can be adjusted. The resulting module clustering and enrichment table can be downloaded in multiple formats.

![Functional module clustering use cases, screenshot 2](/docs/img/functional-module-2.png)

The second use case is from a Biongenetic commercial renal panel to screen for prevalent hereditary kidney disorders.

**Task: How can I determine specific processes and phenotypes that these disease genes participate in, and how do these genes differ in function in the global vs. relevant tissue network?**

- Select the “Modules” analysis. Input genes of interest (504 genes). Select the desired network (kidney). Select “Search.”

![Functional module clustering use cases, screenshot 3](/docs/img/functional-module-3.png)

- Select the “Modules” analysis. Input genes of interest (504 genes). Select the desired network (global). Select “Search.”

![Functional module clustering use cases, screenshot 4](/docs/img/functional-module-4.png)

- The resulting modules detected in the kidney network are more relevant to kidney function than the global network, even though there are more genes assigned to a module in the global network. The global network captures general modules spanning developmental biology and organ morphogenesis, while the kidney network covers kidney physiology, system-level regulation, and kidney development.
