import { test, expect } from '@playwright/test';
import { menuAction } from './ui-driver.js';
const KEY = 'love-chemistry.prototype.v1';
for (const id of ['SNAP3-H', 'SNAP3-HE', 'SNAP3-NA', 'SNAP3-MG', 'SNAP3-CL', ...['H', 'C', 'NA', 'MG', 'CA', 'CL'].map(c => `SNAP-B-${c}`)]) test(`${id}: 그림/알림/후속/정본복귀 저장·없는 이미지·기획득/재진입 중복0`, async ({ page }) => {
  await page.goto('/'); await page.route('**/assets/snaps/*.webp', route => route.abort());
  const data = await page.evaluate(async id => {
    const { day20, PostRun, postFocus } = await import('/tests/post-driver.js'); const e = await import('/src/engine.js'); const c = id.split('-').at(-1); const run = new PostRun(day20(c), c === 'HE' ? { getRandomValues: a => a.fill(0) } : null);
    run.until('END-FINISH', postFocus(c)); const snap = run.snaps.find(s => s.id === id); if (!snap) throw new Error(`스냅 없음 ${id}`);
    const source = snap.state;
    // UI fixture retains any older helium receipts together with their ledger.
    const fullLedger = JSON.parse(run.storage.getItem('love-chemistry.helium-reservations.v1') || 'null');
    const ledger = fullLedger ? JSON.stringify({ ...fullLedger, reservations: Object.fromEntries(Object.entries(fullLedger.reservations).filter(([key]) => source.late.helium.requests[key])) }) : null;
    const repeat = structuredClone(source); const before = JSON.stringify([repeat.affinity, repeat.applied, repeat.snaps]); e.enter(repeat, repeat.scene); while (repeat.index < repeat.queue.length) e.advance(repeat); e.options(repeat)[0].run();
    return { source, ledger, repeated: before === JSON.stringify([repeat.affinity, repeat.applied, repeat.snaps]), end: source.after };
  }, id);
  expect(data.repeated).toBe(true);
  await page.evaluate(([key, { source, ledger }]) => { localStorage.setItem(key, JSON.stringify(source)); if (ledger) localStorage.setItem('love-chemistry.helium-reservations.v1', ledger); }, [KEY, data]);
  await menuAction(page, '불러오기'); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'image'); await expect(page.locator('.snap-fallback')).toBeVisible();
  async function restore() { await menuAction(page, '저장'); const s = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY); await page.reload(); await menuAction(page, '불러오기'); expect((await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY)).affinity).toEqual(s.affinity); return s; }
  const before = await restore(); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'image');
  await page.getByRole('button', { name: '스냅 정보 보기 ▸' }).click(); await restore(); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'notice');
  await page.getByRole('button', { name: '스냅 닫고 계속' }).click(); const text = await page.locator('.dialogue-text').textContent(); await restore(); await expect(page.locator('.dialogue-text')).toHaveText(text);
  while (await page.getByRole('button', { name: '다음 ▸', exact: true }).count()) await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  await expect(page.locator('.scene-id')).toHaveText(data.end); const after = await restore(); expect(after.affinity).toEqual(before.affinity); expect(after.applied).toEqual(before.applied); expect(after.snaps).toEqual(before.snaps);
});
