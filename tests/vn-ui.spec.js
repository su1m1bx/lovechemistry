import { test, expect } from '@playwright/test';
test.use({ reducedMotion: 'reduce' }); // Animation/input sequencing has dedicated coverage.
import { beginNew, menuAction } from './ui-driver.js';

const KEY = 'love-chemistry.prototype.v1';
const gameOnly = s => { const { ui, ...game } = s; return game; };
async function saved(page) {
  await menuAction(page, '저장');
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
}
async function loadState(page, state) {
  await page.evaluate(([key, s]) => localStorage.setItem(key, JSON.stringify(s)), [KEY, state]);
  await menuAction(page, '불러오기');
}
async function seed(page, scene, day = 1, index = 0) {
  const s = await page.evaluate(async ({ scene, day, index }) => {
    const e = await import('/src/engine.js'); const s = e.fresh('봄'); s.day = day; e.enter(s, scene);
    if (index === 'end') while (s.index < s.queue.length) e.advance(s);
    else for (let i = 0; i < index; i++) e.advance(s);
    return s;
  }, { scene, day, index });
  await loadState(page, s); return s;
}
async function fits(page, selector) {
  const bounds = await page.locator(selector).evaluateAll(nodes => nodes.map(n => {
    const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: innerWidth, height: innerHeight };
  }));
  expect(bounds.length).toBeGreaterThan(0);
  for (const b of bounds) { expect(b.x).toBeGreaterThanOrEqual(-1); expect(b.y).toBeGreaterThanOrEqual(-1); expect(b.right).toBeLessThanOrEqual(b.width + 1); expect(b.bottom).toBeLessThanOrEqual(b.height + 1); }
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('로고 → 메뉴 → 전학 도입 → 이름, 현재 진행과 저장 슬롯 분리', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '새 게임', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '현재 진행 계속하기' })).toHaveCount(0);
  await page.getByRole('button', { name: '새 게임', exact: true }).click();
  await expect(page.locator('.transfer-screen')).toContainText('전학 첫날');
  await expect(page.getByLabel('학교에서 불릴 이름')).toHaveCount(0);
  await page.locator('body').click({ position: { x: 4, y: 4 } }); await page.keyboard.press('Enter');
  const input = page.getByLabel('학교에서 불릴 이름');
  await input.fill('   '); await input.press('Enter'); await expect(input).toBeVisible();
  await input.fill('가'.repeat(21)); expect((await input.inputValue()).length).toBe(20);
  await input.fill('봄'); await input.press('Enter');
  const state = await saved(page); expect(state.name).toBe('봄'); expect(state.index).toBe(0);
  await menuAction(page, '시작 화면');
  await expect(page.getByRole('button', { name: '현재 진행 계속하기' })).toBeVisible();
  await beginNew(page); await input.fill('새봄'); await input.press('Enter');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).name, KEY)).toBe('봄');
  await menuAction(page, '불러오기'); expect((await saved(page)).name).toBe('봄');
});

test('대사 클릭·Enter 단일 진행, 선택·메뉴·학습 입력 격리와 모달 복원', async ({ page }) => {
  await page.goto('/'); await seed(page, 'A-01');
  await page.locator('.dialogue-text').click(); expect((await saved(page)).index).toBe(1);
  await page.getByRole('button', { name: '다음 ▸', exact: true }).focus();
  await page.keyboard.press('Enter'); expect((await saved(page)).index).toBe(2);
  const beforeMenu = await saved(page);
  await menuAction(page, '기록');
  await page.locator('.panel-content').click(); await page.keyboard.press('Enter');
  await page.keyboard.press('Escape'); expect(gameOnly(await saved(page))).toEqual(gameOnly(beforeMenu));
  await seed(page, 'A-01', 1, 'end');
  const choiceState = await saved(page);
  await page.locator('.dialogue-text').click(); expect(gameOnly(await saved(page))).toEqual(gameOnly(choiceState));
  await page.locator('.choices button').first().focus(); await page.keyboard.press('ArrowDown');
  await expect(page.locator('.choices button').nth(1)).toBeFocused();
  await page.keyboard.press('Enter');
  const chosen = await saved(page); expect(chosen.choices['A-01']).toBe(1); expect(chosen.index).toBe(0);
  await seed(page, 'D4-NOTE', 4);
  while (!await page.locator('.learning-area').count()) await page.getByRole('button', { name: '다음 ▸' }).click();
  const cardState = await saved(page);
  await page.locator('.learning-area').focus(); await page.keyboard.press('Enter');
  expect(gameOnly(await saved(page))).toEqual(gameOnly(cardState));
  await menuAction(page, '핵심 노트'); await page.keyboard.press('Escape');
  expect(gameOnly(await saved(page))).toEqual(gameOnly(cardState));
  await page.getByRole('button', { name: '다음 ▸' }).focus();
  await page.keyboard.down('Enter'); await page.keyboard.down('Enter'); await page.keyboard.up('Enter');
  expect((await saved(page)).index).toBe(cardState.index + 1);
  await expect(page.locator('.learning-area [data-card="periodic"]')).toBeVisible();
});

for (const viewport of [{ width: 1440, height: 1024 }, { width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 360, height: 640 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
  test(`${viewport.width}×${viewport.height}: 무대·선택·수업·실험·시험·노트 화면 안 유지`, async ({ page }, info) => {
    await page.setViewportSize(viewport); await page.goto('/');
    await page.getByRole('button', { name: '새 게임', exact: true }).waitFor();
    await fits(page, '.menu-card');
    await seed(page, 'D9-AM', 9, 1);
    await fits(page, '.dialogue, .next, .cast-badge');
    await expect(page.locator('.cast-slot')).toHaveCount(2);
    await expect(page.locator('.speaking')).toHaveAttribute('data-character', '수소');
    await page.screenshot({ path: info.outputPath('cast.png') });
    await seed(page, 'B-04', 2, 'end'); await fits(page, '.choices, .dialogue');
    await page.locator('.choices button').last().focus(); await expect(page.locator('.choices button').last()).toBeInViewport();
    await page.screenshot({ path: info.outputPath('choices.png') });
    await seed(page, 'D4-NOTE', 4);
    while (!await page.locator('[data-card="periodic"]').count()) await page.getByRole('button', { name: '다음 ▸' }).click();
    await fits(page, '.learning-area, .dialogue, .next');
    await page.screenshot({ path: info.outputPath('lesson.png') });
    const before = await saved(page);
    await menuAction(page, '핵심 노트'); await fits(page, '.panel, .panel-heading');
    await page.locator('.panel-content').evaluate(n => n.scrollTop = n.scrollHeight);
    await page.screenshot({ path: info.outputPath('notes.png') });
    await page.keyboard.press('Escape'); expect(gameOnly(await saved(page))).toEqual(gameOnly(before));
    const lab = await page.evaluate(async () => {
      const e = await import('/src/engine.js'); const s = e.fresh('봄'); e.enter(s, 'C-02');
      while (s.index < s.queue.length) e.advance(s); e.options(s)[0].run(); return s;
    });
    await loadState(page, lab); await fits(page, '.lab, .dialogue');
    await page.getByRole('button', { name: '건조한 고체 식염', exact: true }).click();
    const prepared = await saved(page); await menuAction(page, '기록'); await page.keyboard.press('Escape');
    expect(gameOnly(await saved(page))).toEqual(gameOnly(prepared));
    await page.getByRole('button', { name: '측정', exact: true }).click();
    expect((await saved(page)).lab.observations).toHaveLength(1);
    await page.screenshot({ path: info.outputPath('experiment.png') });
    await seed(page, 'EX-PAPER', 10);
    for (let i = 0; i < 10; i++) {
      await fits(page, '.exam, .exam-navigation');
      if (viewport.width >= 360 && viewport.height >= 640) {
        for (const option of await page.locator('.exam-option').all()) await expect(option).toBeInViewport({ ratio: 1 });
      }
      await page.getByRole('radio').nth(i % 4).check();
      if (i === 5) {
        if (viewport.width <= 600) {
          await page.getByRole('button', { name: '제공된 비교 자료 보기' }).click();
          await expect(page.locator('.panel .learning-card')).toContainText('Ca보다 훨씬 느림');
          await page.screenshot({ path: info.outputPath('exam-material-panel.png') });
          await page.keyboard.press('Escape'); await expect(page.getByRole('radio').nth(i % 4)).toBeChecked();
        }
        await page.screenshot({ path: info.outputPath('exam-material.png') });
      }
      if (i < 9) await page.getByRole('button', { name: '다음 문항' }).click();
    }
    const exam = await saved(page); await page.reload(); await menuAction(page, '불러오기');
    expect((await saved(page)).exam).toEqual(exam.exam);
    await page.getByRole('button', { name: '이전 문항' }).click(); await page.getByRole('radio').nth(3).check();
    await page.getByRole('button', { name: '답안 제출' }).click();
    await fits(page, '.exam, .exam > button');
    expect(await page.locator('.exam-explanations').evaluate(n => n.scrollHeight > n.clientHeight)).toBe(true);
    await page.screenshot({ path: info.outputPath('exam-result.png') });
    await page.getByRole('button', { name: '결과 확인 · 시험 후 일과로' }).click();
    const returned = await saved(page); expect(returned.day).toBe(10); expect(returned.scene).toBe('EX-AFTER');
    expect(returned.exam.returned).toBe(true);
  });
}

for (const image of ['missing', 'loaded']) test(`14종 구형·신형 스냅: ${image}, 3단계 저장 복원과 효과 불변`, async ({ page }, info) => {
  test.setTimeout(120000); await page.goto('/');
  if (image === 'loaded') await page.route('**/assets/snaps/*.webp', route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') }));
  else await page.route('**/assets/snaps/*.webp', route => route.fulfill({ status: 404, body: '' }));
  const snapshots = await page.evaluate(async () => {
    const { Run, focus } = await import('/tests/mid-driver.js'); const all = [];
    for (const code of ['H', 'HE', 'C', 'NA', 'MG', 'CA', 'CL']) { const r = new Run(); r.to('DAY16-HANDOFF', focus(code)); all.push(...r.snaps); }
    return [...new Map(all.map(item => [item.id, item.state])).values()];
  });
  expect(snapshots).toHaveLength(14);
  for (const start of snapshots) {
    await loadState(page, start);
    await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'image');
    await expect(page.locator('.snap .speaker')).toHaveCount(0);
    const first = await saved(page); expect(gameOnly(first)).toEqual(gameOnly(start));
    await page.reload(); await menuAction(page, '불러오기');
    await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'image');
    await page.getByRole('button', { name: '스냅 정보 보기 ▸' }).focus(); await page.keyboard.press('Enter');
    await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'notice');
    const notice = await saved(page); expect(gameOnly(notice)).toEqual(gameOnly(start));
    await page.reload(); await menuAction(page, '불러오기');
    await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'notice');
    const expected = await page.evaluate(async s => { const e = await import('/src/engine.js'); e.advance(s); return s; }, start);
    await page.locator('.snap .dialogue-text').click();
    await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'follow');
    expect(gameOnly(await saved(page))).toEqual(gameOnly(expected));
    await page.reload(); await menuAction(page, '불러오기');
    await expect(page.locator('.dialogue-text')).toHaveText(expected.queue[expected.index].text.replaceAll('{플레이어명}', expected.name));
    await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'follow');
    if (image === 'loaded') await expect.poll(() => page.locator('.snap-backdrop img').evaluate(n => n.complete && n.naturalWidth > 0)).toBe(true);
    else await expect(page.locator('.snap-fallback')).toBeVisible();
    // A pre-UI save made during follow-up derives the same background without replaying effects.
    delete expected.ui; await loadState(page, expected);
    await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'follow');
    while (await page.locator('.snap-backdrop').count()) {
      await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
    }
    await expect(page.locator('main')).toHaveAttribute('data-snap-phase', '');
  }
  await page.screenshot({ path: info.outputPath(`snap-${image}-return.png`) });
});
