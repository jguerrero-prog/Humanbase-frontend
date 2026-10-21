export type Status = 'Same function' | 'Changed' | 'Added' | 'Missing' | 'To confirm';

export interface CaptureStep {
  do: 'goto' | 'click' | 'check' | 'hover' | 'fill' | 'type' | 'press' | 'wait' | 'scroll';
  url?: string;
  text?: string;
  label?: string;
  role?: string;
  /** A role's accessible name, when it differs from text. */
  name?: string;
  nameIsRegex?: boolean;
  key?: string;
  ms?: number;
  selector?: string;
  /** Fires a DOM click, for elements that ignore pointer events. */
  dispatch?: boolean;
  /** Pixels to scroll past the element, such as the sticky top bar's height. */
  offset?: number;
}

export interface Capture {
  url: string;
  steps: readonly CaptureStep[];
  file: string;
}

export interface Comparison {
  slug: string;
  title: string;
  lead: string;
  captured: string;
  pairs: readonly { caption: string; input?: string; existing: Capture; proposed: Capture }[];
  differences: readonly { area: string; existing: string; proposed: string; status: Status; evidence?: string }[];
}

/** The order of the pages in the sidebar and on the overview. */
export const comparisonOrder = ['homepage', 'networks', 'networks-views', 'modules', 'netwas', 'sei-beluga-seqweaver', 'expecto', 'expecto-sc', 'in-silico-mutagenesis', 'asd-browser'];

export const statuses: readonly Status[] = ['Missing', 'To confirm', 'Changed', 'Added', 'Same function'];

const files = import.meta.glob<Comparison>('./existing-and-proposed/*.json', { eager: true, import: 'default' });
const images = import.meta.glob<string>('../assets/existing-and-proposed/*.jpg', { eager: true, query: '?url', import: 'default' });

export const comparisons: Comparison[] = Object.values(files).sort((a, b) => comparisonOrder.indexOf(a.slug) - comparisonOrder.indexOf(b.slug));

/** A capture's image, by the file name the capture script writes. */
export const captureImage = (file: string) => images[`../assets/existing-and-proposed/${file.split('/').pop()}`];

export const countOf = (comparison: Comparison, status: Status) => comparison.differences.filter((difference) => difference.status === status).length;
