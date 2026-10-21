import type { Page } from '@playwright/test';

/** Chooses an item in a download menu and returns the saved file's name and bytes. */
export async function downloadFrom(page: Page, menu: string, item: string): Promise<{ name: string; bytes: Buffer }> {
  await page.getByRole('button', { name: menu, exact: true }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: item }).click()]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return { name: download.suggestedFilename(), bytes: Buffer.concat(chunks) };
}
