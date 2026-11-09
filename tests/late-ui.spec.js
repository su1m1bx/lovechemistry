import { test, expect } from '@playwright/test';
test.use({ reducedMotion: 'reduce' });
import { menuAction, beginNew } from './ui-driver.js';
const KEY = 'love-chemistry.prototype.v1';
async function load(page, s) { await page.evaluate(([key, s]) => localStorage.setItem(key, JSON.stringify(s)), [KEY, s]); await menuAction(page, '불러오기'); }
async function save(page) { await menuAction(page, '저장'); return page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY); }

for (const mode of ['new', 'old15']) test(`실제 화면 ${mode}: 20일까지 H-X18/MG-T17/X19·자료·EX2·스냅·인계 자동저장`, async ({ page }) => {
  test.setTimeout(120000); await page.setViewportSize({ width: 360, height: 640 }); await page.goto('/');
  const plan = await page.evaluate(async mode => {
    const { Run, focus } = await import('/tests/mid-driver.js'); const { LateRun, lateFocus } = await import('/tests/late-driver.js');
    const first = new Run(); const picks = [];
    first.to('DAY16-HANDOFF', (s, opts) => { const index = focus('H')(s, opts); if (mode === 'new') picks.push({ day: s.day, scene: s.scene, index }); return index; });
    const start = structuredClone(first.s);
    if (mode === 'old15') { delete start.exam2; start.queue.push({ who: '현재 제공 범위', text: '여기까지가 현재 제공된 1~15일차 범위입니다.', kind: 'narration' }); }
    const run = new LateRun(first.s);
    run.until('DAY20-HANDOFF', (s, opts) => {
      const code = { 16: 'H', 17: 'MG', 18: 'H', 19: 'MG', 20: 'C' }[s.day];
      const index = lateFocus(code, { xFirst: true })(s, opts); picks.push({ day: s.day, scene: s.scene, index }); return index;
    });
    return { start, picks, exam2: run.s.exam2, affinity: run.s.affinity };
  }, mode);
  if (mode === 'old15') await load(page, plan.start);
  else {
    await beginNew(page); await page.getByLabel('학교에서 불릴 이름').fill('연결검증'); await page.getByRole('button', { name: '등교하기' }).click();
  }
  const cards = new Set(); let restoredBefore = false; let restoredDuring = false; let restoredAfter = false;
  async function drain() {
    for (let n = 0; n < 250; n++) {
      const scene = await page.locator('.scene-id').textContent();
      if (scene === 'EX-PAPER' || scene === 'EX2-PAPER') {
        const questions = await page.evaluate(async scene => scene === 'EX-PAPER' ? (await import('/src/period.js')).EXAM : (await import('/src/exam2-content.js')).EXAM2_VERSIONS['EX2-2026-11-05'], scene);
        for (let i = 0; i < 10; i++) {
          await page.getByRole('radio').nth(questions[i].correct).check();
          if (scene === 'EX2-PAPER' && i === 4) { const before = await save(page); await page.reload(); await menuAction(page, '불러오기'); expect((await save(page)).exam2).toEqual(before.exam2); restoredDuring = true; }
          if (i < 9) await page.getByRole('button', { name: '다음 문항', exact: true }).click();
        }
        await page.getByRole('button', { name: '답안 제출', exact: true }).click(); continue;
      }
      if (scene === 'EX-RESULT' || scene === 'EX2-RESULT') {
        if (scene === 'EX2-RESULT') { const before = await save(page); await page.reload(); await menuAction(page, '불러오기'); expect((await save(page)).exam2.result).toEqual(before.exam2.result); restoredAfter = true; }
        await page.getByRole('button', { name: '결과 확인 · 시험 후 일과로' }).click(); continue;
      }
      if (scene === 'D19-RECESS' && !restoredBefore) { const before = await save(page); await page.reload(); await menuAction(page, '불러오기'); expect((await save(page)).exam2.submitted).toBe(false); expect(before.notes).toContain('D19-NOTE'); restoredBefore = true; }
      const card = page.locator('.learning-area .learning-card'); if (await card.count()) cards.add(await card.getAttribute('data-card'));
      const next = page.getByRole('button', { name: '다음 ▸', exact: true });
      if (await next.count()) { await next.click(); continue; }
      const image = page.getByRole('button', { name: '스냅 정보 보기 ▸', exact: true });
      if (await image.count()) { await image.click(); continue; }
      const notice = page.getByRole('button', { name: '스냅 닫고 계속', exact: true });
      if (await notice.count()) { await notice.click(); continue; }
      const lab = page.locator('.lab');
      if (await lab.count()) {
        const s = await save(page); const sample = s.lab.task.sample; await page.getByRole('button', { name: { solid: '건조한 고체 식염', water: '순수한 물', salt: '식염수' }[sample], exact: true }).click();
        if (sample === 'salt') { await page.getByRole('button', { name: '별도 순수한 물에 식염 넣기' }).click(); await page.getByRole('button', { name: '완전히 녹이기' }).click(); }
        await page.getByRole('button', { name: '측정', exact: true }).click(); continue;
      }
      return;
    }
    throw new Error('DOM 일과 정체');
  }
  for (const pick of plan.picks) {
    await drain(); await expect(page.locator('.scene-id')).toHaveText(pick.scene);
    await page.locator('.choices button').nth(pick.index).click();
  }
  await drain(); await expect(page.locator('.scene-id')).toHaveText('DAY20-HANDOFF');
  const persisted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  expect(persisted.scene).toBe('DAY20-HANDOFF'); expect(persisted.day).toBe(20); expect(persisted.exam2).toEqual({ ...plan.exam2, index: 9 });
  expect(persisted.affinity).toEqual(plan.affinity); expect(persisted.late.complete).toMatchObject({ 'H:T': 16, 'H:X': 18, 'MG:T': 17, 'MG:X': 19, 'C:X': 20 });
  expect([...cards]).toEqual(expect.arrayContaining(['providedRecords', 'comparisonConditions', 'coldWaterComparison', 'graphiteEvidence']));
  expect([restoredBefore, restoredDuring, restoredAfter]).toEqual([true, true, true]);
  await page.reload(); await menuAction(page, '불러오기'); await drain(); await expect(page.locator('.choices button')).toHaveText('01  21일차로 이어가기');
});

for (const code of ['C', 'CA']) test(`SNAP3-${code}: 그림/알림/후속 복원·없는 이미지 대체·기획득 표시만 생략`, async ({ page }) => {
  await page.goto('/'); await page.route('**/assets/snaps/*.webp', route => route.abort());
  const start = await page.evaluate(async code => {
    const { LateRun, day15, lateFocus } = await import('/tests/late-driver.js'); const run = new LateRun(day15(code)); run.until('DAY20-HANDOFF', lateFocus(code));
    return run.snaps.find(s => s.id === `SNAP3-${code}`).state;
  }, code);
  const follow = code === 'C' ? '이건 내 스크랩 쪽에 둘게. 작아서 더 보고 싶네.' : '복기는 오늘 안 물을게요.';
  await load(page, start); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'image');
  await expect(page.locator('.snap-fallback')).toContainText(code === 'C' ? '작은 무늬' : '예시 판');
  const before = await save(page); await page.reload(); await menuAction(page, '불러오기');
  await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'image');
  await page.getByRole('button', { name: '스냅 정보 보기 ▸' }).click(); await save(page); await page.reload(); await menuAction(page, '불러오기');
  await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'notice');
  await page.getByRole('button', { name: '스냅 닫고 계속' }).click(); await expect(page.locator('.dialogue-text')).toHaveText(follow);
  const after = await save(page); expect(after.affinity).toEqual(before.affinity); expect(after.applied).toEqual(before.applied);
  await page.reload(); await menuAction(page, '불러오기'); await expect(page.locator('.dialogue-text')).toHaveText(follow);
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click(); await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  await expect(page.locator('.scene-id')).toHaveText('LATE-LUNCH-END');
  const replay = await page.evaluate(async s => {
    const e = await import('/src/engine.js'); const before = JSON.stringify([s.affinity, s.applied, s.snaps]); e.enter(s, s.scene); while (s.index < s.queue.length) e.advance(s); const opts = e.options(s); opts[0].run();
    return { unchanged: before === JSON.stringify([s.affinity, s.applied, s.snaps]), snaps: s.queue.filter(q => q.snap).length };
  }, start);
  expect(replay).toEqual({ unchanged: true, snaps: 0 });
});

test('확장 시작/20일 인계 저장 실패: 이전 슬롯 유지·같은 후보 재시도 후 게시', async ({ page }) => {
  await page.goto('/');
  const starts = await page.evaluate(async () => {
    const { day15, LateRun, lateFocus } = await import('/tests/late-driver.js'); const e = await import('/src/engine.js');
    const start = day15('H'); const run = new LateRun(structuredClone(start)); run.until('DAY20-HANDOFF', lateFocus('H'));
    e.enter(run.s, 'LATE-CLOSE'); run.drain(); return [start, run.s];
  });
  for (const start of starts) {
    await load(page, start);
    await page.evaluate(() => { window.realSetItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('quota'); }; });
    await page.locator('.choices button').first().click();
    await expect(page.getByRole('alert')).toContainText('아직 결과가 적용되지 않았습니다');
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY)).toEqual(start);
    await page.evaluate(() => { Storage.prototype.setItem = window.realSetItem; });
    await page.getByRole('button', { name: '저장 다시 시도', exact: true }).click();
    const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    expect(after.scene).toBe(start.day === 15 ? 'D16-AM' : 'DAY20-HANDOFF');
    expect(after.late.runId).toMatch(/^[0-9a-f-]{36}$/); expect(after.affinity).toEqual(start.affinity);
    await page.reload(); await menuAction(page, '불러오기'); await expect(page.locator('.scene-id')).toHaveText(after.scene);
  }
});

test('16~20 실제 장소 명단·20일 복수 인물 중 선택한 한 명만 cast/만남 기록', async ({ page }) => {
  await page.goto('/');
  const data = await page.evaluate(async () => {
    const { day15, LateRun, lateFocus } = await import('/tests/late-driver.js'); const { SCHEDULE, PLACES, lunchPlaceLabel } = await import('/src/period.js');
    const run = new LateRun(day15('H')); const starts = [];
    run.until('DAY20-HANDOFF', (s, opts) => { if (s.scene === 'LATE-LUNCH' || s.scene === 'EX2-AFTER') starts.push(structuredClone(s)); return lateFocus('H')(s, opts); });
    return { starts, SCHEDULE, labels: Object.fromEntries(starts.map(s => [s.day, PLACES.map(p => lunchPlaceLabel(s.day, p))])) };
  });
  for (const start of data.starts) {
    await load(page, start);
    expect(await page.locator('.choices button').allTextContents()).toEqual(data.labels[start.day].map((label, i) => `${String(i + 1).padStart(2, '0')}  ${label}`));
    await expect(page.locator('.affinity meter')).toHaveCount(0);
  }
  const start = data.starts.at(-1); delete start.period.met.CL; delete start.events.clMet; delete start.mid.metDates.CL;
  await load(page, start); await page.locator('.choices button').nth(3).click(); await page.locator('.choices button').first().click();
  expect(await page.locator('.choices button').allTextContents()).toEqual(['01  수소', '02  염소']);
  await page.locator('.choices button').first().click(); await expect(page.locator('.affinity meter')).toHaveCount(1);
  await expect(page.locator('.affinity')).toContainText('수소'); await expect(page.locator('.affinity')).not.toContainText('염소');
  const chosen = await save(page); expect(chosen.period.met.CL).toBeUndefined(); expect(chosen.affinity).toEqual(start.affinity);
});
