import { test, expect } from '@playwright/test';
import { menuAction } from './ui-driver.js';
test.use({ reducedMotion: 'reduce' });

test('날짜·장소 알림: 중앙·닫기·2초 만료·재렌더 연장 없음·복원 오알림 없음', async ({ page }, info) => {
  await page.goto('/'); await page.getByRole('button', { name: '새 게임', exact: true }).waitFor();
  await page.clock.install({ time: new Date('2026-11-13T12:00:00Z') }); await page.clock.pauseAt(new Date('2026-11-13T12:00:10Z'));
  await page.evaluate(async () => {
    const { createSceneFeedback } = await import('/src/scene-feedback.js'); window.feedback = createSceneFeedback();
    window.feedbackState = { day: 1, location: '교실', affinity: { 수소: 0 } };
    window.feedback.update(document.querySelector('#app'), window.feedbackState);
  });
  const box = page.locator('.scene-notice'); await expect(box).toContainText('DAY 01'); await expect(box).toContainText('교실');
  const r = await box.boundingBox(); const size = page.viewportSize(); expect(Math.abs(r.x + r.width / 2 - size.width / 2)).toBeLessThan(1); expect(Math.abs(r.y + r.height / 2 - size.height / 2)).toBeLessThan(1);
  await page.screenshot({ path: info.outputPath('scene-notice.png') });
  await page.clock.runFor(1500); await page.evaluate(() => window.feedback.update(document.querySelector('#app'), window.feedbackState));
  // Simulate the app replacing its DOM while retaining transient state.
  await page.locator('.scene-notice').first().evaluate(n => n.remove());
  await page.clock.runFor(501); await expect(box).toHaveCount(0);
  await page.evaluate(() => { window.feedbackState.location = '도서관'; window.feedback.update(document.querySelector('#app'), window.feedbackState); });
  await expect(box).toContainText('도서관'); await page.getByRole('button', { name: '장면 알림 닫기' }).click(); await expect(box).toHaveCount(0);
  await page.evaluate(() => { window.feedbackState.day = 2; window.feedback.update(document.querySelector('#app'), window.feedbackState); });
  await expect(box).toContainText('DAY 02');
  await page.evaluate(() => window.feedback.update(document.querySelector('#app'), { day: 10, location: '교문', affinity: { 수소: 80 } }, true));
  await expect(box).toHaveCount(0); await expect(page.locator('.affinity-notice')).toHaveCount(0);
});

test('증가·감소·동시 변화 표시, 저장 객체 불변·타이머 정리', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '새 게임', exact: true }).waitFor();
  await page.clock.install({ time: new Date('2026-11-13T12:00:00Z') }); await page.clock.pauseAt(new Date('2026-11-13T12:00:10Z'));
  const unchanged = await page.evaluate(async () => {
    const { createSceneFeedback } = await import('/src/scene-feedback.js'); window.feedback = createSceneFeedback(); const root = document.querySelector('#app');
    const s = { day: 1, location: '교실', affinity: { 수소: 10, 탄소: 10 } }; window.feedback.update(root, s, true);
    s.affinity.수소 += 5; s.affinity.탄소 -= 3; const before = JSON.stringify(s); window.feedback.update(root, s); return JSON.stringify(s) === before;
  });
  expect(unchanged).toBe(true); await expect(page.locator('.affinity-notice')).toContainText('수소 · 호감도 +5'); await expect(page.locator('.affinity-notice')).toContainText('탄소 · 호감도 −3');
  await page.clock.runFor(2401); await expect(page.locator('.affinity-notice')).toHaveCount(0);
  await page.evaluate(() => window.feedback.update(document.querySelector('#app'), null)); await page.clock.runFor(5000); await expect(page.locator('.scene-notice, .affinity-notice')).toHaveCount(0);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) test(`${viewport.width} 실제 선택: 작은 버튼·호감도 변화와 복원 격리`, async ({ page }, info) => {
  await page.setViewportSize(viewport); await page.goto('/');
  const { s, index, delta } = await page.evaluate(async () => {
    const e = await import('/src/engine.js'); const s = e.fresh('봄'); while (s.index < s.queue.length) e.advance(s);
    for (let index = 0; index < e.options(s).length; index++) { const copy = e.decodeSave(JSON.stringify(s)); e.options(copy)[index].run(); const delta = copy.affinity.수소 - s.affinity.수소; if (delta) return { s, index, delta }; }
    throw Error('No affinity-changing choice');
  });
  await page.evaluate(s => localStorage.setItem('love-chemistry.prototype.v1', JSON.stringify(s)), s); await menuAction(page, '불러오기');
  await expect(page.locator('.scene-notice, .affinity-notice')).toHaveCount(0);
  const choice = page.locator('.choices button').nth(index); const r = await choice.boundingBox(); expect(r.width).toBeLessThanOrEqual(560); expect(r.height).toBeGreaterThanOrEqual(43.99);
  await page.screenshot({ path: info.outputPath('compact-choices.png') }); await choice.click();
  await expect(page.locator('.affinity-notice')).toContainText(`수소 · 호감도 +${delta}`);
  await page.screenshot({ path: info.outputPath('affinity-change.png') });
  await menuAction(page, '불러오기'); await expect(page.locator('.affinity-notice')).toHaveCount(0);
});
