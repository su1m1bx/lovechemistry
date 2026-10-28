import { test, expect } from '@playwright/test';

const key = 'love-chemistry.prototype.v1';
async function drain(page) {
  for (let i = 0; i < 40 && await page.getByRole('button', { name: '다음 ▸', exact: true }).count(); i++) {
    await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  }
}
async function pick(page, n) {
  await drain(page); await page.locator('.choices button').nth(n).click(); await drain(page);
}
async function saved(page) {
  await page.getByRole('button', { name: '저장', exact: true }).click();
  return page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
}
async function start(page) {
  await page.goto('/'); await page.getByRole('button', { name: '새 게임', exact: true }).click();
  await page.getByLabel('학교에서 불릴 이름').fill('테스터'); await page.getByRole('button', { name: '등교하기' }).click();
  await expect(page.locator('.dialogue-text')).toContainText('테스터, 맞지?');
}
async function toLunch2(page, { place = 3, action = 0, companion = 1, alternate = false } = {}) {
  await start(page);
  await pick(page, alternate ? 0 : 1); // A-01
  await pick(page, alternate ? 1 : 0); // A-02
  await pick(page, alternate ? 1 : 0); // A-03
  await pick(page, place); await pick(page, action); // A-04
  await pick(page, companion); // A-05
  await pick(page, alternate ? 0 : 1); // B-01
  await pick(page, alternate ? 1 : 0); // B-02
  await pick(page, alternate ? 1 : 0); // B-03
  await expect(page.locator('.scene-id')).toHaveText('B-04');
  await expect(page.locator('.choices button:disabled')).toHaveCount(4);
  await expect(page.locator('.choices button:disabled').first()).toContainText('미구현');
  await pick(page, 1);
}
async function toLab(page, attitude = 0, review = 0) {
  await toLunch2(page); await pick(page, 0); await pick(page, attitude);
  await expect(page.locator('.scene-id')).toHaveText('B-05');
  await expect(page.locator('.choices button')).toHaveCount(2);
  await pick(page, 1); await pick(page, review);
  await expect(page.locator('.scene-id')).toHaveText('C-02');
}
async function measure(page, sample, restore = false) {
  const labels = { solid: '건조한 고체 식염', water: '순수한 물', salt: '식염수' };
  await expect(page.getByRole('button', { name: '측정', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: labels[sample], exact: true }).click();
  if (sample === 'salt') {
    await page.getByRole('button', { name: '별도 순수한 물에 식염 넣기', exact: true }).click();
    await expect(page.getByRole('button', { name: '측정', exact: true })).toBeDisabled();
    if (restore) {
      const before = await saved(page); await page.reload();
      await page.getByRole('button', { name: '불러오기', exact: true }).click();
      expect(await saved(page)).toEqual(before);
      await expect(page.locator('.sample-state')).toContainText('결정이 남아');
    }
    await page.getByRole('button', { name: '완전히 녹이기', exact: true }).click();
  }
  await page.getByRole('button', { name: '측정', exact: true }).click();
  await expect(page.locator('.lamp')).toContainText(sample === 'salt' ? '켜짐' : '꺼짐');
  await drain(page);
}

test('대표 정상 경로, 각 상태의 저장 복원, 별도 재측정과 종료', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await toLab(page);
  await pick(page, 0); await measure(page, 'solid');
  let s = await saved(page); expect(s.lab.observations.map(o => o.sample)).toEqual(['solid']);
  await pick(page, 0); await measure(page, 'water');
  await pick(page, 0); await measure(page, 'salt', true);
  s = await saved(page); expect(s.lab.observations.map(o => o.result)).toEqual(['꺼짐', '꺼짐', '켜짐']);
  await pick(page, 0); await measure(page, 'salt');
  await pick(page, 0); await expect(page.locator('.dialogue-text')).toContainText('어떻게 할까?');
  await pick(page, 0); await pick(page, 0);
  s = await saved(page); expect(s.scene).toBe('end'); expect(s.affinity['수소']).toBe(15); expect(s.affinity['나트륨']).toBe(10); expect(s.affinity['탄소']).toBe(5);
  expect(s.lab.observations).toHaveLength(4); expect(s.events.experimentCompleted).toBe(true);
  await expect(page.locator('.dialogue')).toContainText('대표 구간이 끝났습니다'); expect(errors).toEqual([]);
});

for (const action of [1, 2]) test(`공부·스킵 ${action}: 인사·동행 없이 종료, 보너스 없음`, async ({ page }) => {
  await toLunch2(page, { action, companion: 0, alternate: true }); await pick(page, action);
  const before = await saved(page);
  expect(before.events.recordTaste).toBeUndefined(); expect(before.events.naMet).toBeUndefined(); expect(before.affinity['수소']).toBe(0);
  await expect(page.locator('.choices button')).toHaveCount(1); await pick(page, 0);
  const after = await saved(page); expect(after.scene).toBe('end'); expect(after.lab.observations).toEqual([]); expect(after.events.experimentCompleted).toBeUndefined();
});

for (const scenario of [
  { first: 0, attitude: 1, extra: 1, interpretation: 1, end: 0, expected: 0 },
  { first: 1, attitude: 0, extra: 2, interpretation: 2, end: 1, expected: 0 },
  { first: 1, attitude: 2, extra: 1, interpretation: 0, end: 1, expected: 5 },
  { first: 0, attitude: 0, extra: 1, interpretation: 2, end: 2, expected: 5 },
  { first: 1, attitude: 1, extra: 2, interpretation: 1, end: 2, expected: 0 },
]) test(`실험 분기 ${JSON.stringify(scenario)}`, async ({ page }) => {
  const c = scenario; await toLab(page, c.attitude, 1);
  await pick(page, c.first); await measure(page, c.first === 0 ? 'solid' : 'water');
  await pick(page, 1); await pick(page, 0); await measure(page, 'salt');
  await pick(page, c.extra); const before = await saved(page);
  await pick(page, c.interpretation); const after = await saved(page);
  expect(after.affinity).toEqual(before.affinity); expect(after.lab.observations).toEqual(before.lab.observations);
  expect(after.lab.observations).toHaveLength(2);
  await pick(page, 0); await pick(page, c.end);
  const s = await saved(page); expect(s.scene).toBe('end'); expect(s.affinity['나트륨']).toBe(c.expected);
  if (c.attitude === 1) { expect(s.events.takeover).toBe(true); expect(s.applied['B-04-talk']).toMatchObject({ requested: -5, actual: 0 }); }
  if (c.extra === 2) expect(s.events.dismiss).toBe(true);
  if (c.attitude === 1 || c.extra === 2) expect(s.applied['C-07'].requested).toBe(0);
});

for (const first of [0, 1]) test(`C-05 미측정 조건 추가: ${first}`, async ({ page }) => {
  await toLab(page, 2); await pick(page, first); await measure(page, first === 0 ? 'solid' : 'water');
  await pick(page, 1); await pick(page, 0); await measure(page, 'salt');
  await pick(page, 0); await measure(page, first === 0 ? 'water' : 'solid');
  const s = await saved(page); expect(new Set(s.lab.observations.map(o => o.sample)).size).toBe(3); expect(s.affinity['나트륨']).toBe(0);
});

test('동일 선택 지점 중복 점수 방지와 날짜별 사건 분리', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { fresh, advance, options, enter } = await import('/src/engine.js');
    const s = fresh('검증'); while (s.index < s.queue.length) advance(s);
    const first = options(s); first[1].run(); first[0].run(); first[1].run();
    const once = s.affinity['수소'];
    enter(s, 'B-01'); while (s.index < s.queue.length) advance(s); options(s)[1].run();
    return { once, total: s.affinity['수소'], keys: Object.keys(s.applied), choices: s.choices };
  });
  expect(result.once).toBe(5); expect(result.total).toBe(10); expect(result.keys).toEqual(['A-01', 'B-01']); expect(result.choices['A-01']).toBe(1);
});

test('모바일, 손상 저장, 저장 실패, 이름의 HTML 안전성', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.evaluate(k => localStorage.setItem(k, '{broken'), key);
  await page.getByRole('button', { name: '불러오기', exact: true }).click(); await expect(page.getByRole('status')).toContainText('불러오기 실패');
  await page.getByRole('button', { name: '새 게임', exact: true }).click(); await page.getByLabel('학교에서 불릴 이름').fill('<b>이름</b>'); await page.getByRole('button', { name: '등교하기' }).click();
  await expect(page.locator('.dialogue-text')).toContainText('<b>이름</b>'); await expect(page.locator('.dialogue-text b')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('quota'); }; });
  await page.getByRole('button', { name: '저장', exact: true }).click(); await expect(page.getByRole('status')).toContainText('저장하지 못했습니다');
});

for (const [place, action] of [[0, 0], [1, 1], [2, 2], [4, 0]]) test(`1일차 비대면 장소 ${place}, 행동 ${action}, 호감도 0에서도 수소 동행`, async ({ page }) => {
  await toLunch2(page, { place, action, companion: 1, alternate: true });
  const s = await saved(page); expect(s.events.hTogether).toBe(true); expect(s.events.recordTaste).toBeUndefined();
  expect(s.affinity['수소']).toBe(0); expect(s.events.naMet).toBeUndefined();
});

test('물부터 → 고체 → 식염수, 재측정만 보류하고 무례 없이 마무리', async ({ page }) => {
  await toLab(page); await pick(page, 1); await measure(page, 'water');
  await pick(page, 0); await measure(page, 'solid');
  await pick(page, 0); await measure(page, 'salt');
  await pick(page, 1); await pick(page, 0); await pick(page, 0);
  await pick(page, 1); const s = await saved(page);
  expect(s.events.dismiss).toBe(false); expect(s.affinity['나트륨']).toBe(10); expect(s.lab.observations).toHaveLength(3);
});

test('모바일 실험 화면과 관찰 기록 레이아웃', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 }); await toLab(page);
  await pick(page, 0); await measure(page, 'solid'); await pick(page, 1); await pick(page, 0);
  await page.getByRole('button', { name: '식염수', exact: true }).click();
  await page.getByRole('button', { name: '별도 순수한 물에 식염 넣기', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('mobile-experiment.png'), fullPage: true });
});
