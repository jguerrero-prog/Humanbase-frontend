---
{
  "title": "Reproducing legacy results",
  "slug": "reproducibility",
  "group": "get-started",
  "label": "Reproducing legacy results",
  "order": 3,
  "live": "https://humanbase.readthedocs.io/en/latest/reproducibility.html",
  "sections": [
    {
      "id": "reproducing-legacy-results",
      "title": "Reproducing legacy results",
      "level": 1
    },
    {
      "id": "annotation-source-drift",
      "title": "Annotation source drift",
      "level": 2
    },
    {
      "id": "network-enrichment-before-june-2026",
      "title": "Network Enrichment before June 2026",
      "level": 2
    },
    {
      "id": "how-to-reproduce-network-go-enrichment-values-from-feb-2024-may-2026",
      "title": "How to reproduce network GO enrichment values from Feb 2024 – May 2026",
      "level": 3
    },
    {
      "id": "programmatic-access",
      "title": "Programmatic access",
      "level": 3
    },
    {
      "id": "details-of-changes",
      "title": "Details of changes",
      "level": 3
    },
    {
      "id": "where-the-extended-universe-flag-applies",
      "title": "Where the extended_universe flag applies",
      "level": 3
    }
  ],
  "images": {}
}
---

# Reproducing legacy results {#reproducing-legacy-results}

Humanbase, like all resources that use external databases, must manage the incorporation of new versions of annotations from those databases. Humanbase is in the process of updating our process for managing versions, how it changes query results, and user’s access to reproducing prior results. The current versions of Humanbase’s gene records and annotation sources are listed on the Data sources page, under the Resources menu in the site header.

## Annotation source drift {#annotation-source-drift}

Humanbase imports gene records and term annotations from external sources (NCBI, Gene Ontology, MSigDB, MeSH, and others) on its own schedule. As an example of how drift can affect reproducibility, in networks the GO term enrichment hypergeometric calculation uses two quantities that can drift between versions:

- the **gene universe (M)** — the set of distinct genes with at least one annotation, summed across the loaded organisms; and
- each **term size (K)** — the number of distinct genes annotated to a given term.

In practice this means a Functional Module Detection run with different database versions will reproduce the exact statistical calculation used in the legacy code path, but the inputs M and K reflect the annotation tables currently used by Humanbase, not the tables present at the time of a query using a different database version. Q values shift in proportion to how much the underlying knowledge base has drifted since.

## Network Enrichment before June 2026 {#network-enrichment-before-june-2026}

GO term enrichment in [Functional Module Detection](/docs/modules/) and tissue-specific [GIANT networks](/docs/functional-networks/) use annotations from UniProt-GOA (experimental evidence codes). Between February 2024 and May 2026 cross-organism annotations were included; outside of this window human-only annotations are used.

The effect of including cross-organism annotations was a slight inflation of q-values and enriched terms comparable to when human-only annotations were used. You can reproduce results by either:

1. modifying the URL for your original query as directed below, or
2. reproducing the query with the gene list and GIANT network and then modifying the URL.

### How to reproduce network GO enrichment values from Feb 2024 – May 2026 {#how-to-reproduce-network-go-enrichment-values-from-feb-2024-may-2026}

Append `extended_universe=true` to the URL of a community page or gene page. For example:

- Functional module detection result:
  ```
  https://humanbase.io/module/overview/?body_tag=<job_id>&extended_universe=true
  ```
- Gene page:
  ```
  https://humanbase.io/gene/3553/blood?extended_universe=true
  ```

### Programmatic access {#programmatic-access}

The same parameter is forwarded to the underlying API endpoints (`/community/` and `/terms/annotated/`). Scripts replaying historical analyses through the API should append `&extended_universe=true` to the query string.

### Details of changes {#details-of-changes}

Adding `extended_universe=true` reproduces Humanbase’s exact output for any GIANT Functional Module Detection result generated between February 2024 and May 2026. The flag restores both the cross-organism annotation universe and the point-probability calculation that the platform used at the time.

Term enrichment in [Functional Module Detection](/docs/modules/) uses a one-sided Fisher’s exact test followed by Benjamini–Hochberg correction. Two inputs to that test depend on which annotation universe is in effect:

- **Term size (K).** The number of genes annotated to the term.
- **Background universe (N).** The total number of genes considered available for annotation.

In the current default mode, both K and N are computed from human annotations only. In extended-universe mode, K and N include annotations from non-human organisms that were carried over from the source databases: mouse (_Mus musculus_), zebrafish (_Danio rerio_), fruit fly (_Drosophila melanogaster_), nematode worm (_Caenorhabditis elegans_), and budding yeast (_Saccharomyces cerevisiae_).

### Where the extended_universe flag applies {#where-the-extended-universe-flag-applies}

The flag is supported only for **GIANT** networks (the original human tissue and biological-process networks). MAGE network analyses have used a human-only annotation pipeline from the start, so there is no legacy cross-organism behavior to reproduce. Requests that combine `extended_universe=true` with a MAGE network are rejected by the API.

The flag applies to the GIANT version of:

- [Functional module detection](/docs/modules/) — term enrichment for each detected community.
- [Tissue-specific networks](/docs/functional-networks/) — annotated term tables on gene pages (Process and Tissue tabs).

It does not affect network edge weights, gene-prediction scores, or any non-enrichment output.
