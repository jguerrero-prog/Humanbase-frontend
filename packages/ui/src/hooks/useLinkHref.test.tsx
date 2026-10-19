import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { LinkBaseProvider, useLinkHref } from './useLinkHref';

describe('useLinkHref', () => {
  it('leaves links alone at the site root', () => {
    const { result } = renderHook(() => useLinkHref());
    expect(result.current('/networks/')).toBe('/networks/');
  });

  it('puts app paths under the base and nothing else', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <LinkBaseProvider value="/Humanbase-frontend/app">{children}</LinkBaseProvider>;
    const { result } = renderHook(() => useLinkHref(), { wrapper });
    expect(result.current('/networks/?entrez=3553')).toBe('/Humanbase-frontend/app/networks/?entrez=3553');
    expect(result.current('https://pubmed.ncbi.nlm.nih.gov/1/')).toBe('https://pubmed.ncbi.nlm.nih.gov/1/');
    expect(result.current('//cdn.example.org/a.js')).toBe('//cdn.example.org/a.js');
    expect(result.current('#gwas-file-rules')).toBe('#gwas-file-rules');
    expect(result.current(undefined)).toBeUndefined();
  });
});
