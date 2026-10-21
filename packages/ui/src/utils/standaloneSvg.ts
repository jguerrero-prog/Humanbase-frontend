const svgNs = 'http://www.w3.org/2000/svg';
const painted = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linejoin', 'opacity', 'font', 'paint-order'];

/** An SVG file of a drawing on the page, with the page's computed colors and fonts written onto each element, since a file can't read the page's CSS. */
export function standaloneSvg(svg: SVGSVGElement): Blob {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('xmlns', svgNs);
  const originals = svg.querySelectorAll<SVGElement>('*');
  copy.querySelectorAll<SVGElement>('*').forEach((element, index) => {
    const style = getComputedStyle(originals[index] as SVGElement);
    for (const property of painted) element.style.setProperty(property, style.getPropertyValue(property));
  });
  return new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' });
}
