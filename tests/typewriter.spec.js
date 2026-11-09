import { test, expect } from '@playwright/test';
import { menuAction } from './ui-driver.js';

test.use({ reducedMotion: 'no-preference' });
const KEY = 'love-chemistry.prototype.v1';
const next = page => page.getByRole('button', { name: '다음 ▸', exact: true });
const visible = page => page.locator('[data-typewriter]').evaluate(p => p.querySelector('.dialogue-visible')?.textContent ?? p.textContent);
async function save(page) { await menuAction(page, '저장'); return page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY); }
async function load(page, s) { await page.evaluate(([key, s]) => localStorage.setItem(key, JSON.stringify(s)), [KEY, s]); await menuAction(page, '불러오기'); }
async function freeze(page) {
  const time = new Date('2026-11-09T12:00:00Z');
  await page.clock.install({ time });
  // A future fixed point avoids Firefox's wall-clock precision/race between
  // install and pauseAt; no dialogue is animating at these setup callsites.
  await page.clock.pauseAt(new Date(time.getTime() + 10000));
}
async function startTyping(page) {
  await page.goto('/');
  const s = await page.evaluate(async () => (await import('/tests/asset-fixtures.js')).standingState('H'));
  await load(page, s); await expect(page.locator('main')).toHaveAttribute('data-typing', 'false');
  await freeze(page);
  await next(page).click(); await expect(page.locator('main')).toHaveAttribute('data-typing', 'true');
  return s;
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) test(`${viewport.width}×${viewport.height}: 글자 출력 → 클릭 완료 → 다음 입력 한 줄 진행`, async ({ page }, info) => {
  await page.setViewportSize(viewport); const s = await startTyping(page);
  const first = await visible(page); expect(first.length).toBeGreaterThan(0);
  await page.clock.runFor(120); const partial = await visible(page); expect(partial.length).toBeGreaterThan(first.length);
  const full = await page.locator('[data-typewriter] .sr-only').textContent(); expect(full.startsWith(partial)).toBe(true); expect(partial.length).toBeLessThan(full.length);
  await page.locator('.dialogue-text').click(); await expect(page.locator('main')).toHaveAttribute('data-typing', 'false'); expect(await visible(page)).toBe(full);
  expect((await save(page)).index).toBe(s.index + 1);
  await next(page).click(); expect((await save(page)).index).toBe(s.index + 2);
  await page.screenshot({ path: info.outputPath('typing.png') });
});

test('빠른 연속 클릭·Enter 홀드: 현재 줄 완료와 다음 줄 진입을 분리, 중복 진행 없음', async ({ page }) => {
  const s = await startTyping(page);
  await page.evaluate(() => { document.querySelector('.next').click(); document.querySelector('.next').click(); });
  expect((await save(page)).index).toBe(s.index + 2); await expect(page.locator('main')).toHaveAttribute('data-typing', 'true');
  await next(page).focus(); await page.keyboard.down('Enter'); await page.keyboard.down('Enter'); await page.keyboard.up('Enter');
  expect((await save(page)).index).toBe(s.index + 2); await expect(page.locator('main')).toHaveAttribute('data-typing', 'false');
  await next(page).focus(); await page.keyboard.press('Enter'); expect((await save(page)).index).toBe(s.index + 3);
});

test('버튼 밖 Enter도 첫 입력은 표시 완료, 다음 입력만 한 줄 진행', async ({ page }) => {
  const s = await startTyping(page);
  await page.locator('main').evaluate(n => { n.tabIndex = -1; n.focus(); });
  await page.keyboard.press('Enter'); await expect(page.locator('main')).toHaveAttribute('data-typing', 'false'); expect((await save(page)).index).toBe(s.index + 1);
  await page.locator('main').evaluate(n => { n.tabIndex = -1; n.focus(); });
  await page.keyboard.press('Enter'); expect((await save(page)).index).toBe(s.index + 2);
});

test('메뉴/노트/기록에서 타이핑 일시 정지·복귀, 저장에는 전체 큐만 보존·불러오기는 완성된 줄', async ({ page }) => {
  const s = await startTyping(page); await page.clock.runFor(90); const partial = await visible(page);
  for (const name of ['기록', '핵심 노트']) {
    await menuAction(page, name); await page.clock.runFor(2000); expect(await visible(page)).toBe(partial);
    await page.locator('.panel-content').click(); await page.keyboard.press('Enter'); expect(await visible(page)).toBe(partial);
    await page.keyboard.press('Escape'); expect(await visible(page)).toBe(partial);
  }
  const saved = await save(page); expect(saved.index).toBe(s.index + 1); expect(saved.queue).toEqual(s.queue);
  expect(saved).not.toHaveProperty('typing'); expect(saved.ui).not.toHaveProperty('typewriter');
  await page.clock.runFor(210); expect((await visible(page)).length).toBeGreaterThan(partial.length);
  await menuAction(page, '불러오기'); await expect(page.locator('main')).toHaveAttribute('data-typing', 'false');
  const full = saved.queue[saved.index].text.replaceAll('{플레이어명}', saved.name); expect(await visible(page)).toBe(full);
  await page.clock.runFor(10000); expect(await visible(page)).toBe(full); expect((await save(page)).index).toBe(saved.index);
});

test('이전 타이머가 제목·이름 입력·새 게임의 줄을 덮지 않음', async ({ page }) => {
  await startTyping(page); await menuAction(page, '시작 화면'); await page.clock.runFor(10000);
  await expect(page.locator('.title-screen')).toBeVisible(); await expect(page.locator('[data-typewriter]')).toHaveCount(0);
  await page.getByRole('button', { name: '새 게임', exact: true }).click(); await page.getByRole('button', { name: '이름 정하기 ▸' }).click();
  await page.getByLabel('학교에서 불릴 이름').fill('새봄'); await page.clock.runFor(5000); await expect(page.getByLabel('학교에서 불릴 이름')).toHaveValue('새봄');
  await page.getByRole('button', { name: '등교하기', exact: true }).click(); await expect(page.locator('main')).toHaveAttribute('data-typing', 'true');
  expect((await visible(page)).length).toBeLessThan(3); expect((await save(page)).index).toBe(0);
});

test('스냅 그림·알림은 즉시, 후속 대사만 타이핑, 첫 입력은 스냅/점수/커서 불변', async ({ page }) => {
  await page.goto('/'); const { s } = await page.evaluate(async () => (await import('/tests/asset-fixtures.js')).snapState('SNAP-H'));
  const before = structuredClone(s); before.index--; await load(page, before); await freeze(page);
  await next(page).click(); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'image'); await expect(page.locator('[data-typewriter]')).toHaveCount(0);
  await page.getByRole('button', { name: '스냅 정보 보기 ▸' }).click(); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'notice');
  await page.getByRole('button', { name: '스냅 닫고 계속' }).click(); await expect(page.locator('main')).toHaveAttribute('data-typing', 'true');
  const following = await save(page); await next(page).click(); const completed = await save(page);
  expect(completed.index).toBe(following.index); expect(completed.affinity).toEqual(following.affinity); expect(completed.snaps).toEqual(following.snaps); expect(completed.applied).toEqual(following.applied);
  await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'follow');
  const expected = await page.evaluate(async s => { const e = await import('/src/engine.js'); e.advance(s); return { scene: s.scene, index: s.index }; }, completed);
  await next(page).click(); const advanced = await save(page); expect({ scene: advanced.scene, index: advanced.index }).toEqual(expected);
});

test('모션 감소: 즉시 전체 표시, 설정을 실행 중 바꿔도 현재 줄만 완료', async ({ page }) => {
  const s = await startTyping(page); await page.emulateMedia({ reducedMotion: 'reduce' }); await expect(page.locator('main')).toHaveAttribute('data-typing', 'false');
  expect((await save(page)).index).toBe(s.index + 1);
  await next(page).click(); await expect(page.locator('main')).toHaveAttribute('data-typing', 'false');
  expect((await save(page)).index).toBe(s.index + 2);
});

test('한글·결합 문자·이모지·국기: grapheme 단위, 접근성 전체 문장, 새 bind가 이전 타이머 취소', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '새 게임', exact: true }).waitFor(); await freeze(page);
  const text = '가나👩🏽‍🔬🇰🇷❤️é';
  const parts = await page.evaluate(async text => {
    const { graphemes, createTypewriter } = await import('/src/typewriter.js');
    const normal = graphemes(text); const original = Intl.Segmenter; let fallback;
    try { Intl.Segmenter = undefined; fallback = graphemes(text); } finally { Intl.Segmenter = original; }
    const p = document.createElement('p'); p.id = 'typing-unit'; document.body.append(p); window.typingUnit = createTypewriter(); window.typingUnit.bind(p, 'unicode', text);
    return { normal, fallback };
  }, text);
  expect(parts.normal).toHaveLength(6); expect(parts.normal.join('')).toBe(text); expect(parts.fallback).toEqual(parts.normal.map(part => part.normalize('NFC')));
  await expect(page.locator('#typing-unit .sr-only')).toHaveText(text);
  for (let i = 1; i <= parts.normal.length; i++) { expect(await page.locator('#typing-unit .dialogue-visible').textContent()).toBe(parts.normal.slice(0, i).join('')); await page.clock.runFor(30); }
  await page.evaluate(() => window.typingUnit.bind(document.querySelector('#typing-unit'), 'new', '다른 문장', { instant: true }));
  await page.clock.runFor(10000); await expect(page.locator('#typing-unit')).toHaveText('다른 문장');
});

test('학습 카드·시험·선택지는 타이핑하지 않음', async ({ page }) => {
  await page.goto('/');
  for (const kind of ['card', 'exam', 'choice']) {
    const s = await page.evaluate(async kind => {
      const e = await import('/src/engine.js'); const s = e.fresh('봄');
      if (kind === 'card') { s.day = 4; e.enter(s, 'D4-NOTE'); while (!s.queue[s.index]?.card && s.index < s.queue.length) e.advance(s); }
      else if (kind === 'exam') { s.day = 10; e.enter(s, 'EX-PAPER'); }
      else while (s.index < s.queue.length) e.advance(s);
      return s;
    }, kind);
    await load(page, s); await expect(page.locator('.dialogue-visible')).toHaveCount(0);
    await expect(page.locator(kind === 'card' ? '.learning-card' : kind === 'exam' ? '.exam-option' : '.choices button').first()).toBeVisible();
  }
});
