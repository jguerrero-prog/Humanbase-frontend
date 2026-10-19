/** Hands the browser a file to save, such as a gene list or an exported graph. */
export function saveFile(contents: Blob | string, fileName: string, type = 'text/plain') {
  const blob = typeof contents === 'string' ? new Blob([contents], { type }) : contents;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}
