import { chromatinPaths } from './chromatin';
import './ChromatinBand.css';

/** One DNA strand folding into a chromatid along the bottom edge of the What's new hero. */
export function ChromatinBand() {
  return (
    <svg className="article-band chromatin-band" viewBox="0 0 1440 170" width={1440} height={170} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {chromatinPaths.map(([className, d, strokeWidth, innerClassName], index) =>
          innerClassName && strokeWidth ? (
            <g key={index}>
              <path className={className} d={d} strokeWidth={strokeWidth + 2.4} />
              <path className={innerClassName} d={d} strokeWidth={strokeWidth} />
            </g>
          ) : (
            <path key={index} className={className} d={d} strokeWidth={strokeWidth} />
          ),
        )}
      </g>
    </svg>
  );
}
