import { ThemedArt } from '@humanbase/ui';
import { chromatinPaths } from './chromatin';

/** One DNA strand folding into a chromatid along the bottom edge of the What's new hero. */
export function ChromatinBand() {
  return <ThemedArt className="article-band chromatin-band" paths={chromatinPaths} width={1440} height={170} preserveAspectRatio="xMidYMax slice" />;
}
