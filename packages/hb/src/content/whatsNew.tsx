import { docsPage } from '@humanbase/data';
import type { ReactNode } from 'react';
import { humanbaseCitation } from './cite';
import { reproducibilityHref } from './data-sources';

// The What's new page, as humanbase.io/whats-new has it, newest first. Its screenshots of the old interface are left out.
export interface WhatsNewEntry {
  title: string;
  /** The shorter text the homepage shows for the latest entries. */
  summary?: string;
  body: ReactNode;
}

export interface WhatsNewMonth {
  month: string;
  entries: readonly WhatsNewEntry[];
}

const { authors, title, journal, year, doi } = humanbaseCitation;
const msigdb = 'https://www.gsea-msigdb.org/gsea/msigdb/human/collections.jsp';

export const whatsNew: readonly WhatsNewMonth[] = [
  {
    month: 'June 2026',
    entries: [
      {
        title: 'New example gene sets for functional module detection',
        summary: 'Two pre-loaded examples, a renal disease panel (kidney) and a synapse gene set (brain), each with its tissue chosen, so you can submit and inspect a result in one click.',
        body: (
          <p>
            The FMD landing page now offers two new pre-loaded example gene sets: a <strong>renal disease panel</strong> (kidney) and a <strong>synapse gene set</strong> (brain). Each pre-selects the relevant tissue context,
            so you can submit and inspect a meaningful result in a single click.
          </p>
        ),
      },
      {
        title: 'Updated Data sources page',
        summary: 'Data sources are now organized by era, with a tab for each window of Humanbase results and the source versions behind it.',
        body: (
          <p>
            The <a href="/data-sources/">Data sources</a> page is now organized by era, with tabs for each defined window of Humanbase results. An era documents the source versions of Gene Ontology, MSigDB, Disease Ontology, NCBI
            gene2go, and other databases that were held constant during that window. A new era begins whenever a source release would shift enrichment values relative to previously-saved analyses, so any Q value, citation, or
            saved URL traces back to a specific, declared set of data versions. Use the era tabs to find the versions matching a saved result, a citation, or a published figure.
          </p>
        ),
      },
      {
        title: 'Smarter landing-page search',
        body: (
          <p>
            The landing-page search bar now routes your query to the most relevant analysis based on what you enter, so you no longer need to pick a tool first. A single gene opens its Networks page, and a multi-gene set opens
            Functional Module Detection. A quick-reference citation link to the Humanbase <i>Nature Methods</i> paper also now sits beneath the search bar.
          </p>
        ),
      },
      {
        title: 'Reproducing legacy results',
        body: (
          <p>
            Humanbase has added information for users on versioning and a feature to reproduce legacy results. GO term enrichment in Functional Module Detection and tissue-specific GIANT networks use annotations from UniProt-GOA
            (experimental evidence codes). Between February 2024 and April 2026 cross-organism annotations were included; outside of this window human-only annotations are used. To reproduce values shown during that window, see{' '}
            <a href={reproducibilityHref}>Reproducing legacy results</a>.
          </p>
        ),
      },
    ],
  },
  {
    month: 'February 2026',
    entries: [
      {
        title: 'Humanbase published in Nature Methods',
        body: (
          <>
            <p>
              We’re thrilled to share that Humanbase has been published as a Correspondence in <i>Nature Methods</i>! This paper represents years of development and collaboration, and we’re grateful to the research community that
              has made Humanbase a part of their work: over 20,000 researchers across 110 countries in the past year alone.
            </p>
            <p>If Humanbase has contributed to your research, we’d appreciate your citation:</p>
            <blockquote>
              <p>
                {authors} {title} <i>{journal}</i> {year} <a href={doi}>{doi}</a>
              </p>
            </blockquote>
            <p>Stay tuned: we have exciting updates in the pipeline, including expanded network coverage and new analysis capabilities coming in the weeks ahead.</p>
          </>
        ),
      },
    ],
  },
  {
    month: 'August 2025',
    entries: [
      {
        title: 'Updated Downloads section',
        body: (
          <p>
            We have redesigned the <a href="/downloads/">Downloads</a> page to provide better organization and access to Humanbase resources. The page now includes new bulk download zip files for all top edges, full networks, and
            gold standards, as well as a Python script for downloading all tissue-specific networks incrementally with error handling. It also features downloadable resources for Humanbase variant prediction tools.
          </p>
        ),
      },
      {
        title: 'Use cases',
        body: (
          <p>
            We have added an extensive collection of <a href={docsPage('use-cases')}>use cases/tutorials</a> to the interface demonstrating real research workflows for variant effect prediction and network analysis frameworks.
          </p>
        ),
      },
      {
        title: 'Enhanced score documentation',
        body: <p>We have expanded documentation of score types reported by Humanbase variant effect prediction frameworks and provided tooltip links to relevant score documentation sections from the interface.</p>,
      },
    ],
  },
  {
    month: 'October 2024',
    entries: [
      {
        title: 'Expanded enrichment databases',
        body: (
          <>
            <p>
              We have enhanced the Functional Module Detection tool by adding support for multiple databases. Previously, only Gene Ontology Biological Process (GO BP) terms were available. Now, you can explore enrichment
              analysis of the detected modules from the following four databases:
            </p>
            <ul>
              <li>
                <strong>Gene Ontology Biological Process (GO BP)</strong>: <a href="https://geneontology.org/docs/go-annotations/">Learn more about GO BP</a>
              </li>
              <li>
                <strong>Disease Ontology</strong>: <a href="https://disease-ontology.org/">Learn more about Disease Ontology</a>
              </li>
              <li>
                <strong>MSigDB Hallmark (H)</strong>: <a href={msigdb}>MSigDB Collections</a>
              </li>
              <li>
                <strong>MSigDB Canonical Pathways (C2-CP)</strong>: <a href={msigdb}>MSigDB Collections</a>
              </li>
            </ul>
          </>
        ),
      },
    ],
  },
  {
    month: 'July 2024',
    entries: [
      {
        title: 'Interactive API documentation',
        body: (
          <>
            <p>We added interactivity to all endpoints with working examples in the API documentation. This allows users to experiment with the API directly from the documentation page.</p>
            <p>
              Check out the new API documentation <a href="/api/docs/">here</a>.
            </p>
          </>
        ),
      },
      {
        title: 'Functional Module Detection',
        body: (
          <>
            <p>Functional Module Detection results may now be optionally named with a title.</p>
            <p>The title will show in the browser as well as in the file name of the download files. There is a new breadcrumb navigation across all of Humanbase for better context while browsing the site.</p>
          </>
        ),
      },
    ],
  },
];

/** The entries the homepage lists: those with a summary, newest first. */
export const latestUpdates = whatsNew.flatMap(({ month, entries }) => entries.flatMap(({ title, summary }) => (summary ? [{ date: month, title, text: summary }] : [])));
