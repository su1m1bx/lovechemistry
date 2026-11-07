import { test, expect } from '@playwright/test';

test('구 day20 큐/커서/v1후반 스키마 그대로 복원→21~30, 기존 점수·보상·시험·스냅 보존', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day20, PostRun, postFocus } = await import('/tests/post-driver.js'); const e = await import('/src/engine.js');
    const old = day20('H'); old.queue = [{ who: '학교 안내', text: '20일차 일과를 마쳤습니다. 현재 제공 범위는 여기까지입니다. 이 위치에서 진행을 저장할 수 있습니다.', kind: 'narration' }]; old.index = 0;
    const before = structuredClone(old); const restored = e.decodeSave(JSON.stringify(old)); const loaded = structuredClone(restored);
    const run = new PostRun(restored); run.until('END-FINISH', postFocus('H')); run.restore();
    return { before, loaded, s: run.s };
  });
  expect(r.loaded).toEqual(r.before); expect(r.s.late.runId).toBe(r.before.late.runId);
  for (const field of ['choices', 'applied', 'snaps']) for (const [k, v] of Object.entries(r.before[field])) expect(r.s[field][k]).toEqual(v);
  expect(r.s.exam2).toEqual(r.before.exam2); expect(r.s.exam).toEqual(r.before.exam); expect(r.s.ending.selected).toBe('H');
});

test('정본 모든 ↑부분→다른 날 주행동: 명목 차액·상한·반복0·후속/스냅 주완료만', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day20, eventFixture } = await import('/tests/post-driver.js'); const { postContent } = await import('/src/post-content.js'); const { LATE_EVENTS, mainReward, partialReward, availableLate } = await import('/src/late-state.js'); const { PEOPLE } = await import('/src/period.js'); const e = await import('/src/engine.js');
    const base = day20('H'); const results = [];
    for (const [c, events] of Object.entries(LATE_EVENTS)) for (const event of Object.keys(events)) {
      const content = postContent(base, c, event); const part = content.choices.findIndex(c => c.partial); if (part < 0) continue;
      const s = structuredClone(base); s.affinity[PEOPLE[c]] = 99;
      if (event === 'R' || c === 'HE' && event === 'P') { delete s.late.complete[`${c}:${event}`]; delete s.late.reward[`${c}:${event}`]; }
      const run = eventFixture(s, c, event, 27); run.drain(); if (content.consent) run.pick(0); run.pick(part); run.restore();
      const first = structuredClone(run.s); const expectedPartial = partialReward(first, c, event);
      const retry = eventFixture(run.s, c, event, 28); retry.drain(); if (content.consent) retry.pick(0); retry.pick(part); retry.restore(); const repeated = structuredClone(retry.s);
      const main = eventFixture(retry.s, c, event, 29); main.drain(); if (content.consent) main.pick(0); const index = postContent(main.s, c, event).choices.findIndex(c => c.main); main.pick(index); main.restore();
      const last = structuredClone(main.s); const total = mainReward(last, c, event);
      const again = eventFixture(main.s, c, event, 29); again.drain(); again.pick(0); again.restore();
      results.push({ c, event, expectedPartial, total, first, repeated, last, final: again.s, partialSnaps: run.snaps.map(s => s.id), eligibility: c === 'HE' && event === 'B' ? availableLate(first, c, 'afterSchool') : null });
    }
    return results;
  });
  expect(r.length).toBe(19);
  for (const x of r) {
    const key = `${x.c}:${x.event}`;
    expect(x.first.late.reward[key], key).toBe(x.expectedPartial); expect(x.first.late.complete[key], key).toBeUndefined(); expect(x.partialSnaps, key).toEqual([]);
    expect(x.repeated.affinity, key).toEqual(x.first.affinity); expect(x.repeated.late.reward[key], key).toBe(x.expectedPartial);
    expect(x.last.late.complete[key], key).toBe(29); expect(x.last.late.reward[key], key).toBe(x.total);
    expect(x.last.applied[`LATE:${key}:${x.total}`], key).toMatchObject({ requested: x.total - x.expectedPartial, actual: 0 });
    expect(x.final.affinity, key).toEqual(x.last.affinity); expect(x.final.applied, key).toEqual(x.last.applied); expect(x.final.snaps, key).toEqual(x.last.snaps);
    if (x.eligibility) expect(x.eligibility).not.toContain('J');
  }
});

test('첫 R5/부분2와 실제 선행 R8/부분4 구분, X/회복 없는 스냅 자동 생성 없음', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day20, eventFixture } = await import('/tests/post-driver.js'); const { mainReward, partialReward } = await import('/src/late-state.js');
    const base = day20('H'); const results = [];
    for (const c of ['H', 'HE', 'NA', 'MG', 'CA', 'CL']) {
      const s = structuredClone(base); delete s.mid.personal[c];
      s.choices = {}; s.events.recordTaste = false; delete s.events.bakeryExchange; s.period.promises.clRead = false;
      for (const map of ['complete', 'partial', 'reward']) for (const k of Object.keys(s.late[map])) if (k.startsWith(c + ':')) delete s.late[map][k];
      const shallow = [mainReward(s, c, 'R'), partialReward(s, c, 'R')]; const run = eventFixture(s, c, 'R', 27); run.drain(); if (c === 'CL') run.pick(0); run.pick(0); run.restore();
      const done = structuredClone(run.s); results.push({ c, shallow, done, snaps: run.snaps.map(s => s.id) });
    }
    return results;
  });
  for (const x of r) { expect(x.shallow).toEqual([5, 2]); expect(x.done.late.reward[`${x.c}:R`]).toBe(5); if (x.c !== 'CL') expect(x.snaps).toEqual([]); }
});

test('염소 동의 거절 원문 비노출, Q 첫 줄만·열람0·재방문 동의 별도', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day20, eventFixture } = await import('/tests/post-driver.js'); const { postContent } = await import('/src/post-content.js'); const e = await import('/src/engine.js'); const base = day20('H'); const cases = [];
    for (const event of ['T', 'R', 'B', 'J', 'K']) {
      const run = eventFixture(structuredClone(base), 'CL', event, 27); run.drain(); const intro = JSON.stringify(run.s.queue); const content = postContent(run.s, 'CL', event);
      run.pick(1); const refused = structuredClone(run.s); const replay = eventFixture(run.s, 'CL', event, 27); replay.drain(); const replayOptions = e.options(replay.s).map(o => o.label);
      const retry = eventFixture(run.s, 'CL', event, 28); retry.drain(); const retryOptions = e.options(retry.s).map(o => o.label);
      cases.push({ event, intro, privateText: content.read[0].text, refused, replayOptions, retryOptions });
    }
    const q = eventFixture(structuredClone(base), 'CL', 'Q', 27); q.drain(); const before = JSON.stringify(q.s.queue); e.options(q.s)[1].run(); const firstLine = JSON.stringify(q.s.queue); q.drain(); q.restore();
    return { cases, before, firstLine, s: q.s, affinity: base.affinity };
  });
  for (const c of r.cases) { expect(c.intro).not.toContain(c.privateText); expect(c.refused.late.complete[`CL:${c.event}`]).toBeUndefined(); expect(c.replayOptions).toEqual(['오늘은 마치기']); expect(c.retryOptions.length).toBeGreaterThanOrEqual(2); }
  expect(r.before).not.toContain('우산은 비가'); expect(r.firstLine).toContain('우산은 비가 그치자 일이 끝났다고 했다.'); expect(r.firstLine).not.toContain('나는 아직 집에 못 갔다');
  expect(r.s.affinity).toEqual(r.affinity); expect(r.s.late.partial['CL:Q']).toBeUndefined(); expect(r.s.late.complete['CL:Q']).toBeUndefined();
});

test('후반 60개 임의 동선: 모든 일과·단일 슬롯·공부/휴식·복원·결말까지 정체 없음', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day20, PostRun } = await import('/tests/post-driver.js'); const base = day20('H'); let seed = 20261107; const results = [];
    for (let i = 0; i < 60; i++) {
      const run = new PostRun(structuredClone(base)); run.until('END-FINISH', (s, opts) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % opts.length; }); run.restore();
      results.push({ day: run.s.day, completed: run.s.ending.completed, actions: Object.values(run.s.period.actions).filter(a => a.lunch && a.afterSchool).length, exam2: run.s.exam2 });
    }
    return { results, exam2: base.exam2 };
  });
  for (const s of r.results) { expect(s.day).toBe(30); expect(s.completed).toBe(true); expect(s.actions).toBe(30); expect(s.exam2).toEqual(r.exam2); }
});
