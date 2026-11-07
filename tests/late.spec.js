import { test, expect } from '@playwright/test';

test('후반 실제 대사·선택을 정본 원문에 대조: 새 대사/사건/보상 선택 발명 없음', async ({ page }) => {
  await page.goto('/');
  const missing = await page.evaluate(async () => {
    const source = (await import('/docs/story.md?raw')).default; const { LATE_EVENTS } = await import('/src/late-state.js'); const { lateContent } = await import('/src/late-content.js');
    const s = { day: 20, choices: {}, mid: { shared: {} }, late: { complete: {} } }; const missing = [];
    for (const [c, events] of Object.entries(LATE_EVENTS)) for (const event of Object.keys(events)) {
      if (events[event][0] > 20) continue; // This regression covers the original 16–20 content module.
      const content = lateContent(s, c, event);
      for (const line of [...content.intro, ...content.choices.flatMap(c => c.lines)]) if (line.kind === 'dialogue' && !source.includes(line.text)) missing.push({ c, event, text: line.text });
      for (const choice of content.choices) if (!source.includes(choice.label.split(' — ')[0])) missing.push({ c, event, label: choice.label });
    }
    return missing;
  });
  expect(missing).toEqual([]);
});

for (const code of ['H', 'MG', 'C', 'NA', 'CA', 'CL', 'HE']) test(`정상 새 게임 ${code}: 1~20일 일과·자료·EX2·인계, 매 줄 복원`, async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async code => {
    const { day15, LateRun, lateFocus } = await import('/tests/late-driver.js'); const e = await import('/src/engine.js');
    const before = day15(code); const old = structuredClone(before); const run = new LateRun(before);
    run.until('DAY20-HANDOFF', lateFocus(code, { request: code === 'HE' })); run.restore();
    return { before: old, s: run.s, visited: run.visited, snaps: run.snaps, options: e.options(run.s) };
  }, code);
  expect(r.s).toMatchObject({ day: 20, scene: 'DAY20-HANDOFF', exam2: { submitted: true, returned: true, result: { score: 100 } } });
  expect(r.s.exam).toEqual(r.before.exam); expect(r.s.notes).toEqual(expect.arrayContaining(['D16-NOTE', 'D17-NOTE', 'D18-NOTE', 'D19-NOTE']));
  expect(r.options.map(o => o.label)).toEqual(['21일차로 이어가기']); expect(r.visited.some(v => v.startsWith('21:'))).toBe(false);
  for (let day = 16; day <= 20; day++) expect(r.s.period.actions[day]).toHaveProperty('afterSchool');
  if (code === 'H') expect(r.s.late.complete).toMatchObject({ 'H:T': 16, 'H:X': 18 });
  if (code === 'MG') expect(r.s.late.complete).toMatchObject({ 'MG:T': 17, 'MG:X': 19 });
  if (['C', 'CA'].includes(code)) expect(r.snaps.map(s => s.id)).toContain(`SNAP3-${code}`);
  if (code === 'HE') expect(r.s.late.complete).toMatchObject({ 'HE:T': 17, 'HE:P': 18, 'HE:Q': 20 });
});

test('구 DAY16-HANDOFF 저장 큐·점수·선택 의미·EX1·스냅을 보존하고 20일까지 연결', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day15, LateRun, lateFocus } = await import('/tests/late-driver.js'); const e = await import('/src/engine.js');
    const old = day15('C'); delete old.late; delete old.exam2;
    old.queue = [{ who: '플레이어 독백', text: '내일의 빈칸은 아직 내가 고를 수 있다.' }, { who: '현재 제공 범위', text: '여기까지가 현재 제공된 1~15일차 범위입니다.', kind: 'narration' }]; old.index = 1;
    const before = structuredClone(old); const restored = e.decodeSave(JSON.stringify(old)); const sameQueue = structuredClone(restored.queue);
    const run = new LateRun(restored); run.until('DAY20-HANDOFF', lateFocus('C'));
    return { before, sameQueue, s: run.s };
  });
  expect(r.sameQueue).toEqual(r.before.queue); expect(r.s.exam).toEqual(r.before.exam);
  for (const field of ['choices', 'applied', 'snaps', 'choiceMeanings']) for (const [k, v] of Object.entries(r.before[field])) expect(r.s[field][k]).toEqual(v);
  expect(r.s.affinity['탄소']).toBe(Math.min(100, r.before.affinity['탄소'] + 10));
  expect(r.s.scene).toBe('DAY20-HANDOFF');
});

test('나트륨 unresolved→16 REPAIR→19 CHECK, clear/resolved는 새 T/X만; 옛 무례/감점 보존', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day15, LateRun, lateFocus } = await import('/tests/late-driver.js');
    return ['unresolved', 'watching', 'resolved', 'clear'].map(status => {
      const s = day15('NA');
      if (status !== 'clear') { s.events.takeover = true; s.mid.sodium = { status, startedDay: status === 'unresolved' ? null : 11, resolvedDay: status === 'resolved' ? 13 : null }; }
      const run = new LateRun(s); run.until('DAY20-HANDOFF', lateFocus('NA'));
      return { initial: status, s: run.s, visited: run.visited };
    });
  });
  for (const route of r) {
    expect(route.s.mid.sodium.status).toBe(route.initial === 'clear' ? 'clear' : 'resolved');
    if (route.initial !== 'clear') expect(route.s.events.takeover).toBe(true);
    if (route.initial === 'unresolved') { expect(route.visited).toContain('16:MID-NA-REPAIR'); expect(route.visited).toContain('19:MID-NA-CHECK'); expect(route.s.late.complete['NA:T']).toBe(20); expect(route.s.late.complete['NA:X']).toBeUndefined(); }
    if (route.initial === 'resolved' || route.initial === 'clear') expect(route.s.late.complete).toMatchObject({ 'NA:T': 16, 'NA:X': 19 });
  }
});

test('점심·방과후 단일 소비, 당일 같은 사람 확인, 가용 MG T/X 명시와 다른 날 조건', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day15, LateRun, lateFocus } = await import('/tests/late-driver.js'); const e = await import('/src/engine.js'); const { availableLate } = await import('/src/late-state.js');
    const run = new LateRun(day15('MG')); run.until('LATE-AF-SELECT', lateFocus('MG'));
    // First is day16 (no MG). Move to day17 AF with MG confirmation.
    run.pick(e.options(run.s).findIndex(o => o.label === '혼자 쉬기'));
    run.until('LATE-CLOSE'); run.pick(); run.until('LATE-AF-SELECT', lateFocus('MG'));
    const day17 = e.options(run.s).map(o => o.label); const stale = e.options(run.s)[0]; stale.run(); const once = structuredClone(run.s); stale.run(); const twice = structuredClone(run.s);
    const noInvite = structuredClone(once); noInvite.scene = 'LATE-AF-SELECT'; noInvite.queue = []; noInvite.index = 0; delete noInvite.period.actions[17].afterSchool; noInvite.period.invite.day = 16;
    const wrong = structuredClone(noInvite); wrong.period.invite = { day: 17, code: 'CA' };
    const menus = [noInvite, wrong].map(s => e.options(s).map(o => o.label));
    run.drain(); run.until('LATE-AF-SELECT', lateFocus('MG')); run.pick(e.options(run.s).findIndex(o => o.label === '혼자 쉬기')); run.until('LATE-CLOSE'); run.pick();
    run.until('LATE-AF-SELECT', lateFocus('MG')); const day19 = e.options(run.s).map(o => o.label);
    return { day17, once, twice, menus, day19, noEarly: availableLate(run.s, 'HE', 'afterSchool') };
  });
  expect(r.day17[0]).toContain('새 종이 동작(T)'); expect(r.once).toEqual(r.twice);
  for (const m of r.menus) expect(m).toEqual(['혼자 노트 보기', '혼자 쉬기']);
  expect(r.day19[0]).toContain('멈춤 순서가 달라진 공연(X)'); expect(r.noEarly).toEqual([]);
});

test('명목 부분→다른 날 주요 완료 차액, 상한·반복·복원 독립 검증(새 부분 선택지는 없음)', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day15, LateRun, lateFocus } = await import('/tests/late-driver.js'); const { commitLate } = await import('/src/late-state.js'); const e = await import('/src/engine.js');
    const run = new LateRun(day15('HE')); run.until('D18-RECESS', lateFocus('HE')); run.until('LATE-EVENTS', lateFocus('HE'));
    run.s.affinity['헬륨'] = 99;
    const api = { people: { HE: '헬륨' }, score: (s, key, who, amount) => { if (s.applied[key]) return; const before = s.affinity[who]; s.affinity[who] = Math.min(100, before + amount); s.applied[key] = { who, requested: amount, actual: s.affinity[who] - before }; } };
    const partial = { code: 'HE', event: 'P', kind: 'partial', total: 2 };
    commitLate(run.s, partial, api); commitLate(run.s, partial, api); const first = structuredClone(run.s);
    // Primitive accounting fixture only: no partial scene exists in this window.
    // Continue real days, preserve the partial through an authored 0 choice,
    // then complete the actual P scene on day20 and restore the finished save.
    run.s = e.decodeSave(JSON.stringify(first));
    run.until('EX2-AFTER', (s, opts) => s.scene === 'LATE-HE-U1' ? 2 : lateFocus('HE')(s, opts));
    run.until('LATE-LUNCH-END', lateFocus('HE')); commitLate(run.s, partial, api); run.restore();
    return { first, last: run.s };
  });
  expect(r.first.late.reward['HE:P']).toBe(2); expect(r.first.late.complete['HE:P']).toBeUndefined();
  expect(r.first.late.partial['HE:P']).toBe(18); expect(r.last.late.reward['HE:P']).toBe(5); expect(r.last.late.complete['HE:P']).toBe(20);
  expect(r.last.affinity['헬륨']).toBe(100); expect(r.last.applied['LATE:HE:P:5']).toMatchObject({ requested: 3, actual: 0 });
});

test('미뤄 둔 MG T/X 모두 명시·완료 재진입0·미경험 X 변형·손상 문맥/날짜 거부', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day15, LateRun, lateFocus } = await import('/tests/late-driver.js'); const e = await import('/src/engine.js');
    const run = new LateRun(day15('MG'));
    run.until('D19-RECESS', (s, opts) => s.scene === 'LATE-AF-SELECT' ? opts.findIndex(o => o.label === '혼자 쉬기') : lateFocus('MG')(s, opts));
    run.until('LATE-AF-SELECT', lateFocus('MG')); const labels = e.options(run.s).map(o => o.label);
    run.pick(1); const intro = run.s.queue; // pick drains, X choices ready
    const unknown = structuredClone(run.s); const errors = [];
    for (const mutate of [s => s.late.context = null, s => s.late.context.event = 'R', s => s.day = 21, s => s.late.reward['MG:R'] = 8,
      s => s.late.version = 2, s => s.late.context.slot = 'lunch', s => s.late.attempts['MG:X'] = 16]) {
      const s = structuredClone(unknown); mutate(s); try { e.decodeSave(JSON.stringify(s)); errors.push(false); } catch { errors.push(true); }
    }
    run.pick(0); const committed = structuredClone(run.s); const before = JSON.stringify([committed.affinity, committed.applied, committed.snaps]);
    committed.period.person = 'MG'; committed.late.context = { code: 'MG', event: 'X', slot: 'afterSchool', day: 19 }; e.enter(committed, 'LATE-MG-TURN');
    while (committed.index < committed.queue.length) e.advance(committed); const replay = e.options(committed); replay[0].run();
    return { labels, intro, errors, unchanged: before === JSON.stringify([committed.affinity, committed.applied, committed.snaps]), replay: replay.map(o => o.label) };
  });
  expect(r.labels.slice(0, 2)).toEqual(['마그네슘 · 새 종이 동작(T)', '마그네슘 · 멈춤 순서가 달라진 공연(X)']);
  expect(r.intro[0].text).toBe('오늘은 네 번째에 소리를 내 주세요'); expect(r.errors).toEqual(Array(7).fill(true));
  expect(r.replay).toEqual(['오늘은 마치기']); expect(r.unchanged).toBe(true);
});

test('60개 후반 임의 동선: 미경험/0점 대안·초대 없음·공부/휴식·단일 행동·필수 자료/EX2', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day15, LateRun } = await import('/tests/late-driver.js'); const start = day15('H'); let seed = 20261106; const results = [];
    for (let i = 0; i < 60; i++) {
      const run = new LateRun(structuredClone(start)); run.until('DAY20-HANDOFF', (s, opts) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % opts.length; });
      run.restore(); results.push({ day: run.s.day, returned: run.s.exam2.returned, actions: Object.keys(run.s.period.actions).filter(d => Number(d) >= 16).length });
    }
    return results;
  });
  expect(r).toEqual(Array(60).fill({ day: 20, returned: true, actions: 5 }));
});

test('MG 관람0 재진입은 당일 마감만, 다른 날 실제 관람 회상→T 완료5→다른 날 X', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day15, LateRun, lateFocus } = await import('/tests/late-driver.js'); const e = await import('/src/engine.js');
    const run = new LateRun(day15('MG')); run.until('LATE-MG-T', lateFocus('MG')); const before = run.s.affinity['마그네슘']; run.pick(1);
    const watched = structuredClone(run.s); watched.late.context = { code: 'MG', event: 'T', slot: 'afterSchool', day: 17 }; e.enter(watched, 'LATE-MG-T');
    while (watched.index < watched.queue.length) e.advance(watched); const replay = e.options(watched).map(o => o.label);
    run.until('LATE-MG-T', lateFocus('MG')); const retryIntro = run.s.queue[0].text; run.pick(0);
    const afterT = structuredClone(run.s); run.until('DAY20-HANDOFF', lateFocus('MG'));
    return { before, replay, watched, retryIntro, afterT, last: run.s };
  });
  expect(r.watched.affinity['마그네슘']).toBe(r.before); expect(r.watched.late.complete['MG:T']).toBeUndefined(); expect(r.replay).toEqual(['오늘은 마치기']);
  expect(r.retryIntro).toBe('지난번엔 움직임만 봤지. 오늘 소리도 골라 볼래?'); expect(r.afterT.late.complete['MG:T']).toBe(19);
  expect(r.last.late.complete['MG:X']).toBe(20); expect(r.last.affinity['마그네슘'] - r.before).toBe(10);
});
