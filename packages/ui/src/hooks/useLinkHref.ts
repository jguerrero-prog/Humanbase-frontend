import { createContext, useContext } from 'react';

const LinkBase = createContext('');

/** The path the app is served under, such as /Humanbase-frontend/app on GitHub Pages; empty at the site root. */
export const LinkBaseProvider = LinkBase.Provider;

/** Puts app paths like /networks/ under the link base and leaves every other URL as it is. */
export function useLinkHref(): <T extends string | undefined>(href: T) => T {
  const base = useContext(LinkBase);
  return <T extends string | undefined>(href: T): T => (base && href?.startsWith('/') && !href.startsWith('//') ? (`${base}${href}` as T) : href);
}
