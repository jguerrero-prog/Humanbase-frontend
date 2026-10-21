import type { RefObject } from 'react';
import type { ActionMenuItem } from '../ActionMenu/ActionMenu';
import { saveFile } from './saveFile';

type Contents = Blob | string;

/** One download format: what it is called in the menu and how its file is made from the shared base name. */
export interface ExportFormat {
  label: string;
  extension: string;
  type: string;
  make: (baseName: string) => Contents | Promise<Contents>;
  disabled?: boolean | undefined;
  description?: string | undefined;
}

/** Menu items that save each format as `<base name>.<extension>`; the base name is read when the item is chosen. */
export function useExportMenu(baseName: () => string, formats: readonly ExportFormat[]): ActionMenuItem[] {
  return formats.map((format) => ({
    label: format.label,
    icon: 'download',
    ...(format.disabled && { disabled: true }),
    ...(format.description && { description: format.description }),
    onSelect: () => {
      const base = baseName();
      void Promise.resolve(format.make(base)).then((contents) => saveFile(contents, `${base}.${format.extension}`, format.type));
    },
  }));
}

/** A drawing that can save itself as SVG, such as a network graph. */
export interface SvgSource {
  exportSvg(): Blob;
}

/** PNG and SVG downloads of a drawing; without one, as in a table view, both are listed but disabled. */
export function useImageFormats(drawing: RefObject<SvgSource | null> | undefined, pngWidth: number): [png: ExportFormat, svg: ExportFormat] {
  const unavailable = drawing ? {} : { disabled: true, description: 'Switch to the graph to download it' };
  const svg = () => drawing?.current?.exportSvg() ?? new Blob([], { type: 'image/svg+xml' });
  return [
    { label: 'Download as PNG', extension: 'png', type: 'image/png', make: () => svgToPng(svg(), pngWidth), ...unavailable },
    { label: 'Download as SVG', extension: 'svg', type: 'image/svg+xml', make: svg, ...unavailable },
  ];
}

/** A ZIP format holding every other format's file under the same base name. */
export function zipFormat(label: string, formats: readonly ExportFormat[]): ExportFormat {
  return {
    label,
    extension: 'zip',
    type: 'application/zip',
    disabled: formats.some((format) => format.disabled),
    make: async (base) => {
      const { zipSync } = await import('fflate');
      const entries = await Promise.all(formats.map(async (format) => [`${base}.${format.extension}`, await bytesOf(await format.make(base))] as const));
      const zipped = zipSync(Object.fromEntries(entries), { level: 0 });
      return new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
    },
  };
}

export async function bytesOf(contents: Contents): Promise<Uint8Array> {
  return typeof contents === 'string' ? new TextEncoder().encode(contents) : new Uint8Array(await contents.arrayBuffer());
}

/** A CSS color, such as a token, as the #rrggbb hex value PDF and canvas drawing take. */
export function cssColor(value: string): string {
  const resolved = value.startsWith('--') ? getComputedStyle(document.documentElement).getPropertyValue(value).trim() : value;
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return resolved;
  context.fillStyle = resolved;
  return context.fillStyle;
}

/** Draws an SVG (a file or an image URL) onto the page color and returns it as a PNG `width` pixels wide. */
export async function svgToPng(svg: Blob | string, width: number): Promise<Blob> {
  const url = typeof svg === 'string' ? svg : URL.createObjectURL(svg);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.round((width * (image.naturalHeight || 1)) / (image.naturalWidth || 1));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot draw images');
    context.fillStyle = cssColor('--surface-page');
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The image could not be made'))), 'image/png'));
  } finally {
    if (typeof svg !== 'string') URL.revokeObjectURL(url);
  }
}
