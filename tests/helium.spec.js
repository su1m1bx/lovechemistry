import { test, expect } from '@playwright/test';
test.use({ reducedMotion: 'reduce' });
import { menuAction } from './ui-driver.js';
const SAVE = 'love-chemistry.prototype.v1';
const LEDGER = 'love-chemistry.helium-reservations.v1';
async function source(page) {
  await page.goto('/');
  return page.evaluate(async () => {
    const { LateRun, day15, lateFocus } = await import('/tests/late-driver.js'); const r = new LateRun(day15('HE'));
    r.until('LATE-AF-SELECT', lateFocus('HE')); // day16 no HE
    r.pick(1); r.until('LATE-CLOSE'); r.pick(); r.until('LATE-AF-SELECT', lateFocus('HE')); return r.s;
  });
}
async function load(page, s) { await page.evaluate(([key, s]) => localStorage.setItem(key, JSON.stringify(s)), [SAVE, s]); await menuAction(page, '불러오기'); }
async function ask(page) { await page.getByRole('button', { name: /헬륨에게 방과후 함께할지 묻기/ }).click(); }

test('헬륨 확률 경계·17/18 거절→20 완충 수락, 요청당 소비·0점·누적 원장·결정적 재시도', async ({ page }) => {
  const start = await source(page);
  const r = await page.evaluate(async start => {
    const h = await import('/src/helium.js'); const e = await import('/src/engine.js'); const { LateRun, lateFocus, memoryStorage } = await import('/tests/late-driver.js');
    const probabilities = [0, 14, 15, 29, 30, 79, 80, 100].map(n => h.heliumProbability(n, 0));
    const storage = memoryStorage(); const random = { getRandomValues: a => a.fill(0xffffffff) }; const run = new LateRun(start); const before = structuredClone(start.affinity); const outcomes = [];
    for (let i = 0; i < 3; i++) {
      const source = structuredClone(run.s); run.s = h.commitHelium(source, storage, e.decodeSave, random);
      const reservation = Object.values(JSON.parse(storage.getItem(h.HE_LEDGER_KEY)).reservations).at(-1);
      const repeated = h.commitHelium(source, storage, e.decodeSave, { getRandomValues: () => { throw new Error('reroll'); } });
      if (JSON.stringify(run.s) !== JSON.stringify(repeated)) throw new Error('동일 요청 재시도 결과 변경');
      outcomes.push({ result: h.heliumOutcome(reservation), action: run.s.period.actions[run.s.day], scene: run.s.scene }); run.restore();
      if (i < 2) {
        run.until('LATE-AF-SELECT', lateFocus('HE'));
        if (run.s.day === 19) { run.pick(1); run.until('LATE-CLOSE'); run.pick(); run.until('LATE-AF-SELECT', lateFocus('HE')); }
      }
    }
    return { probabilities, outcomes, ledger: JSON.parse(storage.getItem(h.HE_LEDGER_KEY)), before, after: run.s.affinity, complete: run.s.late.complete, s: run.s };
  }, start);
  expect(r.probabilities).toEqual([0.4, 0.4, 0.5, 0.5, 0.6, 0.6, 0.7, 0.7]);
  expect(r.outcomes.map(o => [o.result.day, o.result.accepted, o.result.refused])).toEqual([[17, false, 1], [18, false, 2], [20, true, 0]]);
  expect(r.outcomes[2].result.probability).toBe(1); expect(Object.keys(r.ledger.reservations)).toHaveLength(3);
  for (const o of r.outcomes) expect(o.action.afterSchool).toBe('HE');
  // Only P and Q between these requests, no acceptance/quiet reward or snap.
  expect(r.after['헬륨'] - r.before['헬륨']).toBe(11); expect(r.s.snaps['SNAP3-HE']).toBeUndefined();
});

test('예약 쓰기/읽기·일반 저장 쓰기/읽기 실패: 미적용, 같은 예약 재시도·손상 차단', async ({ page }) => {
  const start = await source(page);
  const r = await page.evaluate(async start => {
    const h = await import('/src/helium.js'); const e = await import('/src/engine.js'); const { memoryStorage } = await import('/tests/late-driver.js');
    const cases = [];
    for (const fail of ['reserve-write', 'reserve-read', 'save-write', 'save-read']) {
      const base = memoryStorage(); base.setItem('love-chemistry.prototype.v1', 'previous'); const before = JSON.stringify(start); let broken = true; let wrote = ''; let draws = 0;
      const storage = {
        getItem: key => { if (broken && ((fail === 'reserve-read' && wrote === h.HE_LEDGER_KEY && key === wrote) || (fail === 'save-read' && wrote === 'love-chemistry.prototype.v1' && key === wrote))) throw new Error('read denied'); return base.getItem(key); },
        setItem: (key, value) => { if (broken && (fail === 'reserve-write' && key === h.HE_LEDGER_KEY || fail === 'save-write' && key === 'love-chemistry.prototype.v1')) throw new Error('quota'); base.setItem(key, value); wrote = key; },
      };
      let failed = false; try { h.commitHelium(start, storage, e.decodeSave, { getRandomValues: a => { draws++; return a.fill(0); } }); } catch { failed = true; }
      const unchanged = before === JSON.stringify(start); const oldSlot = base.getItem('love-chemistry.prototype.v1'); const reserved = base.getItem(h.HE_LEDGER_KEY); broken = false;
      const result = h.commitHelium(start, storage, e.decodeSave, { getRandomValues: a => { draws++; return a.fill(0xffffffff); } });
      cases.push({ fail, failed, unchanged, oldSlot, reserved, result, draws });
    }
    const corrupt = memoryStorage(); corrupt.setItem(h.HE_LEDGER_KEY, '{broken'); let blocked = false; let drew = false;
    try { h.commitHelium(start, corrupt, e.decodeSave, { getRandomValues: a => { drew = true; return a; } }); } catch { blocked = true; }
    return { cases, blocked, drew };
  }, start);
  for (const c of r.cases) {
    expect(c.failed).toBe(true); expect(c.unchanged).toBe(true);
    if (c.fail !== 'save-read') expect(c.oldSlot).toBe('previous');
    expect(c.result.period.actions[17].afterSchool).toBe('HE');
    expect(c.draws).toBe(c.fail === 'reserve-write' ? 2 : 1);
    expect(Object.values(c.result.late.helium.requests)[0].accepted).toBe(c.fail !== 'reserve-write');
  }
  expect(r.blocked).toBe(true); expect(r.drew).toBe(false);
});

test('예약 이전 저장 충돌·원본 복구·슬롯 덮어쓰기와 다른 진행 ID 원장 보존', async ({ page }) => {
  const start = await source(page);
  const r = await page.evaluate(async start => {
    const h = await import('/src/helium.js'); const e = await import('/src/engine.js'); const { memoryStorage } = await import('/tests/late-driver.js');
    const storage = memoryStorage(); const reservation = h.reserveHelium(start, storage, e.decodeSave, { getRandomValues: a => a.fill(0) });
    const old = structuredClone(start); old.affinity['헬륨'] = 0; const before = storage.getItem('love-chemistry.prototype.v1');
    const conflict = h.reconcileHelium(old, storage, e.decodeSave); let blocked = false;
    try { h.commitHelium(old, storage, e.decodeSave); } catch (error) { blocked = error instanceof h.HeliumConflict; }
    const after = storage.getItem('love-chemistry.prototype.v1'); const recovered = h.commitHelium(e.decodeSave(conflict.source), storage, e.decodeSave);
    storage.setItem('love-chemistry.prototype.v1', JSON.stringify(e.fresh('다른진행')));
    const other = structuredClone(start); other.late.runId = crypto.randomUUID(); h.commitHelium(other, storage, e.decodeSave, { getRandomValues: a => a.fill(0xffffffff) });
    return { before, after, blocked, conflict, reservation, recovered, count: Object.keys(JSON.parse(storage.getItem(h.HE_LEDGER_KEY)).reservations).length };
  }, start);
  expect(r.blocked).toBe(true); expect(r.after).toBe(r.before); expect(r.conflict).toEqual(r.reservation);
  expect(Object.values(r.recovered.late.helium.requests)[0].accepted).toBe(true); expect(r.count).toBe(2);
});

for (const phase of ['reservation', 'result']) test(`헬륨 UI ${phase} 저장 실패·결과 숨김·재시도·홈/이전 저장 복구`, async ({ page }) => {
  const start = await source(page); await load(page, start);
  await page.evaluate(([phase, ledger]) => {
    window.realSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) { if (phase === 'reservation' ? key === ledger : key === 'love-chemistry.prototype.v1') throw new Error('quota'); return window.realSetItem.call(this, key, value); };
    crypto.getRandomValues = a => a.fill(0xffffffff);
  }, [phase, LEDGER]);
  await ask(page);
  await expect(page.getByRole('alert')).toContainText('아직 결과가 적용되지 않았습니다');
  await expect(page.locator('.dialogue-text')).toHaveCount(0);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE)).toEqual(start);
  await page.getByRole('button', { name: '저장 다시 시도', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: '시작 화면으로', exact: true }).click();
  await expect(page.getByRole('button', { name: '현재 진행 계속하기' })).toHaveCount(0);
  await page.evaluate(() => { Storage.prototype.setItem = window.realSetItem; });
  await page.getByRole('button', { name: '불러오기', exact: true }).click();
  if (phase === 'result') {
    await expect(page.getByRole('alert')).toContainText('충돌');
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE)).toEqual(start);
    await page.getByRole('button', { name: '예약 당시 위치에서 복구' }).click();
  } else await ask(page);
  await expect(page.locator('.scene-id')).toHaveText('LATE-HE-REQUEST');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE);
  expect(saved.late.helium.refused).toBe(1); expect(saved.period.actions[17].afterSchool).toBe('HE');
  await page.reload(); await menuAction(page, '불러오기');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE)).toEqual(saved);
});

test('헬륨 UI 수락은 각자 조용히 보기만, 거절 후 단독 마감과 cast 해제', async ({ page }) => {
  const start = await source(page);
  for (const accepted of [true, false]) {
    const s = structuredClone(start); s.late.runId = await page.evaluate(() => crypto.randomUUID()); await load(page, s);
    await page.evaluate(accepted => { crypto.getRandomValues = a => a.fill(accepted ? 0 : 0xffffffff); }, accepted); await ask(page);
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE);
    expect(saved.affinity).toEqual(start.affinity); expect(Object.values(saved.late.helium.requests)[0].accepted).toBe(accepted);
    const next = page.getByRole('button', { name: '다음 ▸', exact: true });
    while (await next.count()) await next.click();
    if (!accepted) {
      await page.locator('.choices button').first().click(); while (await next.count()) await next.click();
      await expect(page.locator('.affinity meter')).toHaveCount(0);
      expect(await page.locator('.choices button').allTextContents()).toEqual(['01  혼자 노트 보기', '02  혼자 쉬기']);
    } else await expect(page.locator('.scene-id')).toHaveText('LATE-CLOSE');
  }
});

test('단일 탭 강제: 두 번째 탭 읽기 전용·예약 불가', async ({ page, context }) => {
  const start = await source(page); await load(page, start);
  const second = await context.newPage(); await second.goto('/'); await menuAction(second, '불러오기');
  await expect(second.getByText('다른 탭이 진행 중입니다.', { exact: false })).toBeVisible();
  await expect(second.getByRole('button', { name: /헬륨에게 방과후 함께할지 묻기/ })).toBeDisabled();
  expect(await second.evaluate(key => localStorage.getItem(key), LEDGER)).toBeNull();
  await page.close(); await second.reload(); await menuAction(second, '불러오기');
  await expect(second.getByRole('button', { name: /헬륨에게 방과후 함께할지 묻기/ })).toBeEnabled();
});
