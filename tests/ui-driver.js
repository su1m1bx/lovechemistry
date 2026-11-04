// Exercise the visible menu on both layouts, closing an overlay before returning to play.
export async function menuAction(page, name) {
  if (await page.locator('dialog[open]').count()) await page.getByRole('button', { name: '닫기', exact: true }).click();
  const direct = page.getByRole('button', { name, exact: true });
  if (await page.locator('.play-screen').count() && !await direct.isVisible()) await page.getByRole('button', { name: '메뉴', exact: true }).click();
  await page.getByRole('button', { name, exact: true }).click();
  if (name === '저장' && await page.locator('dialog[open]').count()) await page.getByRole('button', { name: '닫기', exact: true }).click();
}
export async function beginNew(page) {
  await page.getByRole('button', { name: '새 게임', exact: true }).click();
  await page.getByRole('button', { name: '이름 정하기 ▸', exact: true }).click();
}
