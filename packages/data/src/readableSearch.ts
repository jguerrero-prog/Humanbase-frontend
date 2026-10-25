/** A page's query string with ':' and ',' left as typed, so a place such as chr5:150,226,123 stays readable in the address bar. */
export function readableSearch(init: URLSearchParams | Record<string, string>): string {
  return new URLSearchParams(init).toString().replaceAll('%3A', ':').replaceAll('%2C', ',');
}
