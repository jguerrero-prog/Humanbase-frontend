import type { ScaleSpec } from '@humanbase/ui';

/** Tissue expression confidence: five sequential steps from 0 to 1. */
export const tissueConfidenceScale: ScaleSpec = { title: 'Tissue expression, confidence', kind: 'sequential', edges: [0.5, 0.7, 0.8, 0.9], ends: [0, 1], words: ['Lower', 'Higher'] };
