import { unzipSync, strFromU8 } from 'fflate';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useImageFormats, zipFormat, type ExportFormat } from './exportFiles';

const tsv: ExportFormat = { label: 'Download as TSV', extension: 'tsv', type: 'text/tab-separated-values', make: (base) => `rows for ${base}` };

describe('export formats', () => {
  it('zips every format under the shared base name', async () => {
    const zip = await zipFormat('Download as ZIP', [tsv, { ...tsv, extension: 'txt', make: () => new Blob(['blob']) }]).make('kidney_1');
    const files = unzipSync(new Uint8Array(await (zip as Blob).arrayBuffer()));
    expect(Object.keys(files)).toEqual(['kidney_1.tsv', 'kidney_1.txt']);
    expect(strFromU8(files['kidney_1.tsv'] ?? new Uint8Array())).toBe('rows for kidney_1');
  });

  it('lists the image formats as disabled without a drawing, and the ZIP with them', () => {
    const images = renderHook(() => useImageFormats(undefined, 100)).result.current;
    const formats = [tsv, ...images, zipFormat('Download as ZIP', [tsv, ...images])];
    expect(formats.map((format) => [format.label, format.disabled ?? false])).toEqual([
      ['Download as TSV', false],
      ['Download as PNG', true],
      ['Download as SVG', true],
      ['Download as ZIP', true],
    ]);
  });
});
