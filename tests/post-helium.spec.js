import { test, expect } from '@playwright/test';
import { menuAction } from './ui-driver.js';
const KEY = 'love-chemistry.prototype.v1';

async function source(page) {
  await page.goto('/');
  return page.evaluate(async () => {
    const { day20, PostRun, postFocus } = await import('/tests/post-driver.js'); const run = new PostRun(day20('HE'));
    run.until('D23-RECESS', (s, opts) => s.scene === 'LATE-AF-SELECT' ? opts.findIndex(o => o.label === '혼자 쉬기') : postFocus('HE')(s, opts));
    run.until('LATE-AF-SELECT', postFocus('HE')); return run.s;
  });
}

test('23~29 HE 거절/완충·순차 B→J→K·예약 문맥 고정·같은 요청 재시도/이전 저장 충돌', async ({ page }) => {
  const start = await source(page);
  const r = await page.evaluate(async start => {
    const h = await import('/src/helium.js'); const e = await import('/src/engine.js'); const { PostRun, postFocus } = await import('/tests/post-driver.js'); const { memoryStorage } = await import('/tests/late-driver.js'); const results = [];
    for (const accept of [true, false]) {
      const storage = memoryStorage(); const run = new PostRun(structuredClone(start)); run.storage = storage; const outcomes = [];
      for (const day of [23, 25, 27, 28, 29]) {
        const prior = structuredClone(run.s); const random = { getRandomValues: a => a.fill(accept ? 0 : 0xffffffff) }; run.s = h.commitHelium(prior, storage, e.decodeSave, random);
        const once = structuredClone(run.s); const same = h.commitHelium(prior, storage, e.decodeSave, { getRandomValues: () => { throw new Error('reroll'); } });
        if (JSON.stringify(once) !== JSON.stringify(same)) throw new Error('결과 변경');
        const conflictSource = structuredClone(prior); conflictSource.affinity['헬륨'] = 0; let conflict = false;
        try { h.commitHelium(conflictSource, storage, e.decodeSave, random); } catch (error) { conflict = error instanceof h.HeliumConflict; }
        outcomes.push({ receipt: run.s.late.helium.requests[h.requestId(prior)], before: prior.affinity, after: run.s.affinity, action: run.s.period.actions[day].afterSchool, conflict });
        run.until('LATE-CLOSE', postFocus('HE')); run.restore();
        if (day < 29) { const next = { 23: 25, 25: 27, 27: 28, 28: 29 }[day]; run.until(`D${next}-RECESS`, postFocus('HE')); run.until('LATE-AF-SELECT', postFocus('HE')); }
      }
      results.push({ accept, outcomes, s: run.s, ledger: JSON.parse(storage.getItem(h.HE_LEDGER_KEY)) });
    } return results;
  }, start);
  for (const x of r) {
    expect(Object.keys(x.ledger.reservations)).toHaveLength(5);
    for (const o of x.outcomes) { expect(o.before).toEqual(o.after); expect(o.action).toBe('HE'); expect(o.conflict).toBe(true); }
    if (x.accept) { expect(x.s.late.complete).toMatchObject({ 'HE:B': 23, 'HE:J': 25, 'HE:K': 27 }); expect(x.outcomes.map(o => o.receipt.event)).toEqual(['B', 'J', 'K', null, null]); }
    else { expect(x.outcomes.map(o => [o.receipt.accepted, o.receipt.refused])).toEqual([[false, 1], [false, 2], [true, 0], [false, 1], [false, 2]]); expect(x.s.late.complete['HE:B']).toBe(27); expect(x.s.late.complete['HE:J']).toBeUndefined(); }
  }
});

test('후반 HE 예약쓰기/읽기·결과쓰기/읽기 실패는 슬롯/카운터 미변경, 성공 예약의 B 대상/결과 재추첨 없음', async ({ page }) => {
  const start = await source(page);
  const r = await page.evaluate(async start => {
    const h = await import('/src/helium.js'); const e = await import('/src/engine.js'); const { memoryStorage } = await import('/tests/late-driver.js'); const cases = [];
    for (const fail of ['reserve-write', 'reserve-read', 'save-write', 'save-read']) {
      const base = memoryStorage(); base.setItem('love-chemistry.prototype.v1', JSON.stringify(start)); const before = JSON.stringify(start); let broken = true; let wrote = ''; let seeds = 0;
      const storage = { getItem: k => { if (broken && wrote === k && (fail === 'reserve-read' && k === h.HE_LEDGER_KEY || fail === 'save-read' && k === 'love-chemistry.prototype.v1')) throw new Error('read'); return base.getItem(k); }, setItem: (k, v) => { if (broken && (fail === 'reserve-write' && k === h.HE_LEDGER_KEY || fail === 'save-write' && k === 'love-chemistry.prototype.v1')) throw new Error('write'); base.setItem(k, v); wrote = k; } };
      let failed = false; try { h.commitHelium(start, storage, e.decodeSave, { getRandomValues: a => { seeds++; return a.fill(0); } }); } catch { failed = true; }
      const unchanged = JSON.stringify(start) === before; broken = false;
      const result = h.commitHelium(start, storage, e.decodeSave, { getRandomValues: a => { seeds++; return a.fill(0xffffffff); } }); e.decodeSave(JSON.stringify(result));
      const reservation = Object.values(JSON.parse(base.getItem(h.HE_LEDGER_KEY)).reservations)[0]; cases.push({ fail, failed, unchanged, seeds, result, reservation });
    } return cases;
  }, start);
  for (const x of r) { expect(x.failed).toBe(true); expect(x.unchanged).toBe(true); expect(x.reservation.context.event).toBe('B'); expect(x.seeds).toBe(x.fail === 'reserve-write' ? 2 : 1); expect(x.result.period.actions[23].afterSchool).toBe('HE'); expect(Object.values(x.result.late.helium.requests)[0].accepted).toBe(x.fail !== 'reserve-write'); }
});

test('후반 HE UI 결과저장 실패→재로드 원장 충돌→예약 위치 복구→B, 당일 재요청 없음', async ({ page }) => {
  const start = await source(page); await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, start]); await menuAction(page, '불러오기');
  await page.evaluate(key => { window.realSet = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v) { if (k === key) throw new Error('quota'); return window.realSet.call(this, k, v); }; crypto.getRandomValues = a => a.fill(0); }, KEY);
  await page.getByRole('button', { name: /헬륨에게 방과후 함께할지 묻기/ }).click(); await expect(page.getByRole('alert')).toContainText('아직 결과가 적용되지 않았습니다');
  await expect(page.locator('.dialogue-text')).toHaveCount(0); expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY)).toEqual(start);
  await page.reload(); await menuAction(page, '불러오기'); await expect(page.getByRole('alert')).toContainText('충돌'); await page.getByRole('button', { name: '예약 당시 위치에서 복구' }).click();
  await expect(page.locator('.scene-id')).toHaveText('LATE-HE-REQUEST');
  while (await page.getByRole('button', { name: '다음 ▸', exact: true }).count()) await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  await expect(page.locator('.scene-id')).toHaveText('LATE-HE-B'); await expect(page.getByRole('button', { name: /헬륨에게 방과후 함께할지 묻기/ })).toHaveCount(0);
});
