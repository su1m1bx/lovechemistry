import { test, expect } from '@playwright/test';
import { beginNew, menuAction } from './ui-driver.js';
const KEY = 'love-chemistry.prototype.v1';

for (const mode of ['new', 'old20']) test(`일반 UI ${mode}: RNG 조작/점수 구성 없이 30일·H80·엔딩 완료, 21/26/30 복원`, async ({ page }) => {
  test.setTimeout(240000); await page.setViewportSize({ width: 360, height: 640 }); await page.goto('/');
  const plan = await page.evaluate(async mode => {
    const { Run, focus } = await import('/tests/mid-driver.js'); const { LateRun, lateFocus } = await import('/tests/late-driver.js'); const { PostRun, postFocus } = await import('/tests/post-driver.js');
    const first = new Run(); const picks = [];
    const record = decide => (s, opts) => { const index = decide(s, opts); picks.push({ day: s.day, scene: s.scene, index, label: opts[index].label }); return index; };
    first.to('DAY16-HANDOFF', record(focus('H'))); const middle = new LateRun(first.s); middle.until('DAY20-HANDOFF', record(lateFocus('H')));
    const start = structuredClone(middle.s); if (mode === 'old20') { picks.length = 0; start.queue = [{ who: '학교 안내', kind: 'narration', text: '20일차 일과를 마쳤습니다. 현재 제공 범위는 여기까지입니다. 이 위치에서 진행을 저장할 수 있습니다.' }]; start.index = 0; }
    const run = new PostRun(mode === 'old20' ? structuredClone(start) : middle.s); run.until('END-FINISH', record(postFocus('H')));
    return { start, picks, expected: run.s };
  }, mode);
  if (mode === 'old20') { await page.evaluate(([key, s]) => localStorage.setItem(key, JSON.stringify(s)), [KEY, plan.start]); await menuAction(page, '불러오기'); }
  else { await beginNew(page); await page.getByLabel('학교에서 불릴 이름').fill('연결검증'); await page.getByRole('button', { name: '등교하기' }).click(); }
  const restored = new Set(); const visited = new Set();
  async function drain() {
    for (let n = 0; n < 250; n++) {
      const scene = await page.locator('.scene-id').textContent(); visited.add(scene);
      if (['D21-AM', 'D26-AM', 'D30-CEREMONY'].includes(scene) && !restored.has(scene)) {
        await menuAction(page, '저장'); const before = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
        await page.reload(); await menuAction(page, '불러오기'); await menuAction(page, '저장'); const after = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
        expect(after).toEqual(before); restored.add(scene);
      }
      if (['EX-PAPER', 'EX2-PAPER'].includes(scene)) {
        const correct = await page.evaluate(async scene => (scene === 'EX-PAPER' ? (await import('/src/period.js')).EXAM : (await import('/src/exam2-content.js')).EXAM2_VERSIONS['EX2-2026-11-05']).map(q => q.correct), scene);
        for (let i = 0; i < 10; i++) { await page.getByRole('radio').nth(correct[i]).check(); if (i < 9) await page.getByRole('button', { name: '다음 문항', exact: true }).click(); }
        await page.getByRole('button', { name: '답안 제출', exact: true }).click(); continue;
      }
      if (['EX-RESULT', 'EX2-RESULT'].includes(scene)) { await page.getByRole('button', { name: '결과 확인 · 시험 후 일과로' }).click(); continue; }
      const next = page.getByRole('button', { name: '다음 ▸', exact: true }); if (await next.count()) { await next.click(); continue; }
      const image = page.getByRole('button', { name: '스냅 정보 보기 ▸' }); if (await image.count()) { await image.click(); continue; }
      const notice = page.getByRole('button', { name: '스냅 닫고 계속' }); if (await notice.count()) { await notice.click(); continue; }
      if (await page.locator('.lab').count()) {
        await menuAction(page, '저장'); const sample = await page.evaluate(k => JSON.parse(localStorage.getItem(k)).lab.task.sample, KEY);
        await page.getByRole('button', { name: { solid: '건조한 고체 식염', water: '순수한 물', salt: '식염수' }[sample], exact: true }).click();
        if (sample === 'salt') { await page.getByRole('button', { name: '별도 순수한 물에 식염 넣기' }).click(); await page.getByRole('button', { name: '완전히 녹이기' }).click(); }
        await page.getByRole('button', { name: '측정', exact: true }).click(); continue;
      }
      return;
    } throw new Error('일반 UI 진행 정체');
  }
  for (const pick of plan.picks) { await drain(); await expect(page.locator('.scene-id')).toHaveText(pick.scene); await expect(page.locator('.choices button').nth(pick.index)).toContainText(pick.label); await page.locator('.choices button').nth(pick.index).click(); }
  await drain(); await expect(page.locator('.scene-id')).toHaveText('END-FINISH'); const done = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
  expect(done.ending).toEqual(plan.expected.ending); expect(done.affinity).toEqual(plan.expected.affinity); expect(done.affinity['수소']).toBeGreaterThanOrEqual(80);
  expect(done.exam2.result).toEqual(plan.expected.exam2.result); expect(done.notes).toEqual(plan.expected.notes); expect(Object.keys(done.snaps).sort()).toEqual(Object.keys(plan.expected.snaps).sort());
  expect([...restored]).toEqual(['D21-AM', 'D26-AM', 'D30-CEREMONY']); expect(visited.has('D30-NOTE')).toBe(false);
  await page.reload(); await menuAction(page, '불러오기'); expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).ending.completed, KEY)).toBe(true);
});

test('일반 새 게임 공부/휴식 중심 솔로: 직접 affinity/ending 구성 없이 두 시험과30일 완주', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { Run } = await import('/tests/mid-driver.js'); const { LateRun } = await import('/tests/late-driver.js'); const { PostRun } = await import('/tests/post-driver.js');
    const decide = (s, opts) => {
      if (/action|ACTION/.test(s.scene)) { const i = opts.findIndex(o => /스킵|휴식/.test(o.label)); if (i >= 0) return i; }
      if (/AF|STUDY|NOTE/.test(s.scene)) { const i = opts.findIndex(o => /혼자 쉬기|덮기|닫기|휴식/.test(o.label)); if (i >= 0) return i; }
      return 0;
    };
    const first = new Run(); first.to('DAY16-HANDOFF', decide); const middle = new LateRun(first.s); middle.until('DAY20-HANDOFF', decide); const run = new PostRun(middle.s); run.until('END-FINISH', decide); run.restore(); return run.s;
  });
  expect(r.ending).toMatchObject({ candidates: [], selected: 'SOLO', completed: true }); expect(r.day).toBe(30); expect(r.snaps['SNAP-END-SOLO']).toBeTruthy();
});
