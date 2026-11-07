import { test, expect } from '@playwright/test';
import { menuAction } from './ui-driver.js';
const KEY = 'love-chemistry.prototype.v1';
async function load(page, s) { await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, s]); await menuAction(page, '불러오기'); }

test('79/80·후보0/1/복수/7: 오직 호감도, 선택 고정·진입 전/선택 중 복원·추가 자격 없음', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day20, endingFixture } = await import('/tests/post-driver.js'); const { PEOPLE } = await import('/src/period.js'); const e = await import('/src/engine.js'); const base = day20('H'); const results = [];
    for (const n of [0, 1, 2, 7]) {
      const scores = Object.fromEntries(Object.values(PEOPLE).map((name, i) => [name, i < n ? 80 : 79])); const run = endingFixture(structuredClone(base), scores); const frozen = structuredClone(run.s.ending); run.drain(); run.restore();
      const options = e.options(run.s).map(o => o.label);
      if (n > 1) { const stale = e.options(run.s).at(-1); stale.run(); const once = structuredClone(run.s); stale.run(); if (JSON.stringify(once) !== JSON.stringify(run.s)) throw new Error('후보 중복 선택'); run.restore(); }
      const picked = structuredClone(run.s); run.until('END-FINISH'); run.restore(); results.push({ n, frozen, options, picked, s: run.s });
    }
    return results;
  });
  for (const x of r) {
    expect(x.frozen.candidates).toHaveLength(x.n); expect(x.s.ending.completed).toBe(true);
    if (x.n === 0) expect(x.s.ending.selected).toBe('SOLO');
    if (x.n === 1) expect(x.s.ending.selected).toBe('H');
    if (x.n > 1) { expect(x.options).toHaveLength(x.n); expect(x.picked.ending.selected).toBe(x.frozen.candidates.at(-1)); expect(x.s.ending.selected).toBe(x.picked.ending.selected); }
  }
});

for (const c of ['H', 'HE', 'C', 'NA', 'MG', 'CA', 'CL', 'SOLO']) test(`구성 상태 ${c}: 두 표현·본문/스냅/알림/완료 매 커서 복원·추가 점수0·원문 대조`, async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async c => {
    const { day20, endingFixture } = await import('/tests/post-driver.js'); const { PEOPLE } = await import('/src/period.js'); const e = await import('/src/engine.js'); const vn = await import('/src/vn-presentation.js'); const source = (await import('/docs/story.md?raw')).default;
    const base = day20('H'); base.choices = {}; base.choiceContent = {}; base.choiceMeanings = {}; base.events = { exam2Returned: true }; base.mid.shared = {}; base.mid.personal = {}; base.late.complete = {}; base.late.partial = {}; base.late.reward = {};
    const results = [];
    for (const expression of [0, 1]) {
      const run = endingFixture(structuredClone(base), c === 'SOLO' ? {} : { [PEOPLE[c]]: 80 }); const before = structuredClone(run.s); run.drain();
      const intro = run.s.queue.map(q => q.text); const originalLines = [...run.s.queue]; e.options(run.s)[expression].run(); originalLines.push(...run.s.queue); run.restore(); const spoken = [...intro]; const phases = [];
      for (let i = 0; i < 100 && run.s.scene !== 'END-FINISH'; i++) {
        run.restore(); const current = run.s.queue[run.s.index]; if (!current) throw new Error('결말 정체');
        if (current.snap) {
          phases.push(vn.snapPresentation(run.s).phase); run.restore(); vn.revealSnap(run.s); run.restore(); phases.push(vn.snapPresentation(run.s).phase);
        } else spoken.push(current.text);
        e.advance(run.s);
      }
      run.restore(); const done = structuredClone(run.s); const beforeReplay = JSON.stringify([done.affinity, done.applied, done.snaps]);
      e.enter(run.s, `END-${c}`); run.drain(); const opts = e.options(run.s); opts[0].run(); run.restore();
      results.push({ expression, intro, spoken, phases, done, before, sourceMissing: originalLines.filter(q => q.kind === 'dialogue' && !source.includes(q.text)).map(q => q.text), replaySame: beforeReplay === JSON.stringify([run.s.affinity, run.s.applied, run.s.snaps]) });
    }
    return results;
  }, c);
  for (const x of r) {
    expect(x.done.ending).toMatchObject({ selected: c, expression: x.expression, completed: true }); expect(x.done.snaps[`SNAP-END-${c}`]).toBeTruthy();
    expect(x.phases).toEqual(['image', 'notice']); expect(x.done.affinity).toEqual(x.before.affinity); expect(x.replaySame).toBe(true);
    expect(x.intro.join('\n')).not.toMatch(/그 기울어진|나란히 있어도|네 박자|과거 판이 없으면/);
    expect(x.sourceMissing).toEqual([]);
  }
});

test('나트륨 unresolved/watching도80이면 같은 엔딩·회복 자동완료/환급 없음', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day20, endingFixture } = await import('/tests/post-driver.js'); const results = [];
    for (const status of ['unresolved', 'watching', 'resolved', 'clear']) {
      const base = day20('H'); if (status !== 'clear') base.events.takeover = true;
      base.mid.sodium = { status, startedDay: ['watching', 'resolved'].includes(status) ? 16 : null, resolvedDay: status === 'resolved' ? 19 : null };
      const run = endingFixture(base, { 나트륨: 80 }); const before = structuredClone(run.s.mid.sodium); run.drain(); const intro = run.s.queue.map(q => q.text).join('\n'); run.until('END-FINISH'); run.restore();
      results.push({ status, before, intro, s: run.s });
    } return results;
  });
  for (const x of r) { expect(x.s.mid.sodium).toEqual(x.before); expect(x.s.ending.selected).toBe('NA'); expect(x.s.affinity['나트륨']).toBe(80); if (['unresolved', 'watching'].includes(x.status)) expect(x.intro).toContain('아직 불편해요'); else expect(x.intro).not.toContain('전에 네 말을 덮은'); }
});

for (const c of ['H', 'HE', 'C', 'NA', 'MG', 'CA', 'CL', 'SOLO']) test(`실제 UI 구성 ${c}: 없는 스냅 그림→알림→마지막 대사→저장된 완료·복원`, async ({ page }) => {
  await page.goto('/'); await page.route('**/assets/snaps/*.webp', route => route.abort());
  const start = await page.evaluate(async c => {
    const { day20, endingFixture } = await import('/tests/post-driver.js'); const { PEOPLE } = await import('/src/period.js'); const e = await import('/src/engine.js');
    const run = endingFixture(day20('H'), c === 'SOLO' ? {} : { [PEOPLE[c]]: 80 }); run.drain(); e.options(run.s)[1].run();
    while (!run.s.queue[run.s.index]?.snap) e.advance(run.s); return run.s;
  }, c);
  await load(page, start); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'image'); await expect(page.locator('.snap-fallback')).toBeVisible();
  await page.reload(); await menuAction(page, '불러오기'); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'image');
  await page.getByRole('button', { name: '스냅 정보 보기 ▸' }).click(); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'notice');
  await page.reload(); await menuAction(page, '불러오기'); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'notice');
  await expect(page.locator('.dialogue-text')).not.toContainText('undefined'); await page.getByRole('button', { name: '스냅 닫고 계속' }).click();
  const follow = await page.locator('.dialogue-text').textContent(); await page.reload(); await menuAction(page, '불러오기'); await expect(page.locator('.dialogue-text')).toHaveText(follow);
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click(); await expect(page.locator('.scene-id')).toHaveText('END-FINISH'); await expect(page.locator('.dialogue-text')).toContainText('저장했습니다');
  const done = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY); expect(done.ending.completed).toBe(true); expect(done.affinity).toEqual(start.affinity);
  await page.reload(); await menuAction(page, '불러오기'); await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  expect(await page.locator('.choices button').allTextContents()).toEqual(['01  결말 화면에 머물기', '02  시작 화면으로']);
});

for (const fail of ['write', 'read']) test(`terminal ${fail} 실패: 성공 안내 금지·완료 이전 복원·같은 큐 저장 재시도`, async ({ page }) => {
  await page.goto('/');
  const start = await page.evaluate(async () => {
    const { day20, endingFixture } = await import('/tests/post-driver.js'); const e = await import('/src/engine.js'); const run = endingFixture(day20('H'), { 수소: 80 }); run.drain(); e.options(run.s)[0].run();
    while (run.s.index < run.s.queue.length - 1) e.advance(run.s); return run.s;
  });
  await load(page, start);
  await page.evaluate(([fail, key]) => {
    window.realGet = Storage.prototype.getItem; window.realSet = Storage.prototype.setItem; let wrote = false;
    Storage.prototype.setItem = function(k, v) { if (k === key && fail === 'write') throw new Error('quota'); window.realSet.call(this, k, v); if (k === key) wrote = true; };
    Storage.prototype.getItem = function(k) { if (k === key && wrote && fail === 'read') throw new Error('read denied'); return window.realGet.call(this, k); };
  }, [fail, KEY]);
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('결말을 저장하지 못했습니다'); await expect(page.getByRole('alert')).not.toContainText('저장했습니다');
  await page.getByRole('button', { name: '이 화면에 머물기', exact: true }).click(); await expect(page.getByRole('alert')).toBeVisible();
  await page.evaluate(() => { Storage.prototype.getItem = window.realGet; Storage.prototype.setItem = window.realSet; });
  if (fail === 'write') { await page.reload(); await menuAction(page, '불러오기'); await expect(page.locator('.scene-id')).toHaveText('END-H'); await page.getByRole('button', { name: '다음 ▸', exact: true }).click(); }
  else await page.getByRole('button', { name: '다시 저장', exact: true }).click();
  await expect(page.locator('.scene-id')).toHaveText('END-FINISH'); const done = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  expect(done.ending.completed).toBe(true); expect(done.affinity).toEqual(start.affinity); expect(done.applied).toEqual(start.applied); expect(done.snaps).toEqual(start.snaps);
});

test('복수 후보 UI 선택 전/인사/본문·표현 저장 실패: 후보/선택 원본 유지 후 고정 재시도', async ({ page }) => {
  await page.goto('/');
  const start = await page.evaluate(async () => {
    const { day20, endingFixture } = await import('/tests/post-driver.js'); const run = endingFixture(day20('H'), { 수소: 80, 헬륨: 79, 나트륨: 80 }); run.drain(); return run.s;
  });
  await load(page, start); expect(await page.locator('.choices button').allTextContents()).toEqual(['01  수소', '02  나트륨']);
  await page.reload(); await menuAction(page, '불러오기'); await page.evaluate(() => { window.realSet = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('quota'); }; });
  await page.locator('.choices button').nth(1).click(); await expect(page.getByRole('alert')).toBeVisible(); expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).ending.selected, KEY)).toBeNull();
  await page.evaluate(() => { Storage.prototype.setItem = window.realSet; }); await page.getByRole('button', { name: '저장 다시 시도', exact: true }).click();
  await page.reload(); await menuAction(page, '불러오기'); await expect(page.locator('.scene-id')).toHaveText('END-ENTRY'); expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).ending.selected, KEY)).toBe('NA');
  while (await page.getByRole('button', { name: '다음 ▸', exact: true }).count()) await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  await expect(page.locator('.scene-id')).toHaveText('END-NA'); const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  await page.evaluate(() => { window.realSet = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('quota'); }; }); await page.locator('.choices button').nth(1).click(); await expect(page.getByRole('alert')).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY)).toEqual(before);
  await page.evaluate(() => { Storage.prototype.setItem = window.realSet; }); await page.getByRole('button', { name: '저장 다시 시도', exact: true }).click(); await page.reload(); await menuAction(page, '불러오기');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).ending.expression, KEY)).toBe(1); await expect(page.locator('.scene-id')).toHaveText('END-NA');
});
