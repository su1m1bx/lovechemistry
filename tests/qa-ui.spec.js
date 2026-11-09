import { test, expect } from '@playwright/test';
test.use({ reducedMotion: 'reduce' });
import { menuAction } from './ui-driver.js';

const KEY = 'love-chemistry.prototype.v1';
async function seed(page, scene, day) {
  await page.goto('/');
  await page.evaluate(async ({ scene, day, key }) => {
    const e = await import('/src/engine.js'); const s = e.fresh('UI검증');
    s.day = day; e.enter(s, scene);
    if (scene === 'D4-NOTE') while (!s.queue[s.index]?.card) e.advance(s);
    localStorage.setItem(key, JSON.stringify(s));
  }, { scene, day, key: KEY });
  await page.getByRole('button', { name: '불러오기', exact: true }).click();
}
async function saved(page) {
  await menuAction(page, '저장');
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
}
// Let native dialog cancellation run after key dispatch, before checking persistence.
async function escape(page) {
  await page.keyboard.press('Escape');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

test('낮은 모바일: 높이 변경에도 주기율표 너비·글자 크기·내부 스크롤·복귀 유지', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await seed(page, 'D4-NOTE', 4);
  const before = await saved(page);
  const area = page.locator('.learning-area');
  const initialFont = await area.locator('h3').evaluate(n => getComputedStyle(n).fontSize);
  for (const height of [640, 550, 640]) {
    await page.setViewportSize({ width: 360, height });
    await expect.poll(() => area.evaluate(n => n.getBoundingClientRect().width)).toBe(336);
    expect(await area.locator('h3').evaluate(n => getComputedStyle(n).fontSize)).toBe(initialFont);
    await expect(area.locator('th').nth(1)).toHaveText('1족');
    // Neither the title nor the short group heading collapses into one-character lines.
    expect(await area.locator('h3').evaluate(n => n.getBoundingClientRect().height / parseFloat(getComputedStyle(n).lineHeight))).toBeLessThan(2);
    expect(await area.locator('th').nth(1).evaluate(n => n.getBoundingClientRect().width)).toBeGreaterThan(35);
    await expect(page.locator('.next')).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    if (height === 550) {
      expect(await area.evaluate(n => n.scrollHeight > n.clientHeight)).toBe(true);
      await area.evaluate(n => n.scrollTop = n.scrollHeight);
      expect(await area.evaluate(n => n.scrollTop)).toBeGreaterThan(0);
    }
    await page.screenshot({ path: info.outputPath(`periodic-${height}.png`) });
    await menuAction(page, '핵심 노트');
    await expect(page.getByRole('button', { name: '닫기', exact: true })).toBeInViewport({ ratio: 1 });
    await escape(page); await expect(page.locator('dialog[open]')).toHaveCount(0);
    expect(await saved(page)).toEqual(before);
  }
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  await expect(page.locator('.dialogue-text')).toContainText('세로 열은 족, 가로 행은 주기');
});

test('Escape: 한 입력은 열기만, 다음 입력은 취소로 닫기·다른 창·대사 격리', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await seed(page, 'A-01', 1);
  const before = await saved(page);
  const text = await page.locator('.dialogue-text').textContent();
  await page.evaluate(() => {
    window.escapeEvents = [];
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') window.escapeEvents.push({ type: 'keydown', prevented: event.defaultPrevented });
    });
    document.addEventListener('cancel', () => window.escapeEvents.push({ type: 'cancel' }), true);
  });
  await escape(page);
  await expect(page.getByRole('dialog', { name: '게임 메뉴' })).toBeVisible();
  expect(await page.evaluate(() => window.escapeEvents)).toEqual([{ type: 'keydown', prevented: true }]);
  await escape(page);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(await page.evaluate(() => window.escapeEvents)).toEqual([
    { type: 'keydown', prevented: true }, { type: 'keydown', prevented: false }, { type: 'cancel' },
  ]);
  await expect(page.locator('.dialogue-text')).toHaveText(text);
  expect(await saved(page)).toEqual(before);
  // Button opening still uses the same native Escape dismissal.
  await page.getByRole('button', { name: '메뉴', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '게임 메뉴' })).toBeVisible();
  await escape(page); await expect(page.locator('dialog[open]')).toHaveCount(0);
  for (const name of ['핵심 노트', '기록']) {
    await menuAction(page, name);
    await escape(page); await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(page.locator('.dialogue-text')).toHaveText(text);
    expect(await saved(page)).toEqual(before);
  }
  await page.locator('.dialogue-text').click();
  expect((await saved(page)).index).toBe(before.index + 1);
  await seed(page, 'EX-PAPER', 10);
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: '다음 문항' }).click();
  await page.getByRole('radio').nth(1).check();
  const exam = await saved(page);
  await page.getByRole('button', { name: '제공된 비교 자료 보기' }).click();
  await escape(page); await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.getByRole('radio').nth(1)).toBeChecked();
  expect(await saved(page)).toEqual(exam);
});
