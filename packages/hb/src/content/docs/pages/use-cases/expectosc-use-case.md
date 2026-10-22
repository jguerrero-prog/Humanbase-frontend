---
{
  "title": "ExPectoSC use case",
  "slug": "use-cases/expectosc-use-case",
  "group": "use-cases",
  "order": 16,
  "live": "https://humanbase.readthedocs.io/en/latest/use-cases/expectosc-use-case.html",
  "sections": [
    {
      "id": "expectosc-use-case",
      "title": "ExPectoSC use case",
      "level": 1
    }
  ],
  "images": {
    "expectosc-1.png": [1616, 958],
    "expectosc-2.png": [1598, 440],
    "expectosc-3.png": [1575, 668]
  }
}
---

# ExPectoSC use case {#expectosc-use-case}

**Task: Which non-coding variants have a strong effect on the cell-type specific expression of a nearby gene?**

- Navigate to humanbase.io/expectosc or choose the “ExPectoSC” option from the main Analyses menu. Input a gene of interest (for example, PTEN).

![ExPectoSC use case, screenshot 1](/docs/img/expectosc-1.png)

- View noncoding variants with a strong effect on the expression of a nearby gene (summarized at the tissue level). The “Expression Effect” scores (described in more detail in the documentation) are the predictions of variant effects normalized to 1000 Genomes variants. A “Download” button allows downloading predictions as a tsv file.

![ExPectoSC use case, screenshot 2](/docs/img/expectosc-2.png)

- Select a tissue type (for example, brain) to view cell-type specific impacts of the noncoding variants on the expression of the corresponding gene. Cell-type specific variant effect predictions can also be downloaded as a table.

![ExPectoSC use case, screenshot 3](/docs/img/expectosc-3.png)
