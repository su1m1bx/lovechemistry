import { test, expect } from '@playwright/test';

const KEY = 'love-chemistry.prototype.v1';
for (const [code, before, total, snap] of [
  ['H', 30, 56, 'SNAP2-H'], ['HE', 20, 31, 'SNAP2-HE'], ['C', 24, 50, 'SNAP2-C'], ['NA', 27, 53, 'SNAP2-NA'],
  ['MG', 24, 50, 'SNAP2-MG'], ['CA', 24, 50, 'SNAP2-CA'], ['CL', 24, 50, 'SNAP2-CL'],
]) test(`${code} 새 게임부터 15일차 최적 경로·스냅 복원·채택 수치`, async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async code => {
    const { Run, focus } = await import('/tests/mid-driver.js');
    const { PEOPLE } = await import('/src/period.js');
    const run = new Run(); run.to('DAY11-HANDOFF', focus(code)); const before = structuredClone(run.s);
    run.to('DAY16-HANDOFF', focus(code));
    return { before: before.affinity[PEOPLE[code]], total: run.s.affinity[PEOPLE[code]], s: run.s, visited: run.visited, snaps: run.snaps.map(s => s.id) };
  }, code);
  expect(r.before).toBe(before); expect(r.total).toBe(total);
  expect(r.snaps).toContain(snap); expect(r.s.day).toBe(15); expect(r.s.exam.result.score).toBe(100);
  for (let day = 11; day <= 15; day++) {
    for (const scene of [`D${day}-AM`, `D${day}-NOTE`, `D${day}-RECESS`, 'MID-LUNCH', 'MID-AF', 'MID-CLOSE']) expect(r.visited).toContain(`${day}:${scene}`);
    expect(r.s.period.actions[day].lunch).toBeTruthy(); expect(r.s.period.actions[day].afterSchool).toBeTruthy();
  }
  expect(r.visited).toContain('15:D15-NIGHT');
});

test('기존 10일 저장의 점수 보존·R 없음/있음·옛 합의와 새 합의 구분', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { Run, focus, checkpoint } = await import('/tests/mid-driver.js');
    const engine = await import('/src/engine.js');
    const cases = [];
    for (const r of [false, true]) {
      const s = checkpoint('H', 9); s.events.recordTaste = r; s.choices['A-04-action'] = r ? '대화' : '스킵';
      const run = new Run(engine.decodeSave(JSON.stringify(s))); run.to('DAY16-HANDOFF', focus('H')); cases.push(run.s);
    }
    const s = checkpoint('HE', 6); s.period.promises.heAgreement = true;
    const run = new Run(engine.decodeSave(JSON.stringify(s))); run.to('DAY16-HANDOFF', (s, opts) => s.scene === 'MID-HE-PREP' ? 1 : focus('HE')(s, opts));
    return { cases, helium: run.s };
  });
  expect(r.cases.map(s => s.affinity['수소'])).toEqual([32, 35]);
  expect(r.helium.affinity['헬륨']).toBe(13); // old 6 + SEED 3 + unagreed HE1 4
  expect(r.helium.snaps['SNAP2-HE']).toBeUndefined(); expect(r.helium.period.promises.heAgreement).toBe(true);
});

test('나트륨 NR1·NC1 다른 날짜 이행: 6→30, SEED·ECHO 이중 보상 및 과거 환급 없음', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { Run, focus, checkpoint } = await import('/tests/mid-driver.js'); const engine = await import('/src/engine.js');
    const s = checkpoint('NA', 6); s.events.takeover = true;
    s.applied.oldBlocked = { who: '나트륨', requested: 0, actual: 0 };
    const run = new Run(engine.decodeSave(JSON.stringify(s))); run.to('DAY16-HANDOFF', focus('NA'));
    return { s: run.s, visited: run.visited };
  });
  expect(r.s.affinity['나트륨']).toBe(30); expect(r.s.mid.sodium).toEqual({ status: 'resolved', startedDay: 11, resolvedDay: 13 });
  expect(r.s.events.takeover).toBe(true); expect(r.s.snaps['SNAP2-NA']).toBeUndefined();
  expect(r.s.applied.oldBlocked.requested).toBe(0); expect(r.s.applied['MID:seed:NA']).toBeUndefined();
  expect(r.visited).not.toContain('13:MID-ECHO'); expect(r.visited).toContain('15:MID-ECHO');
});

test('나트륨 보류는 완료 키 미소비·다음 실제 방문에서 다시 이행 가능', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { Run, focus, checkpoint } = await import('/tests/mid-driver.js'); const engine = await import('/src/engine.js');
    const result = [];
    for (const defer of ['repair', 'check']) {
      const s = checkpoint('NA', 6); s.events.dismiss = true; const run = new Run(engine.decodeSave(JSON.stringify(s)));
      let deferred;
      run.to('DAY16-HANDOFF', (s, opts) => {
        if (defer === 'repair' && s.scene === 'MID-NA-REPAIR' && s.day === 11 || defer === 'check' && s.scene === 'MID-NA-CHECK' && s.day === 13) { deferred = structuredClone(s); return 1; }
        return focus('NA')(s, opts);
      }); result.push({ s: run.s, deferred });
    } return result;
  });
  expect(r[0].s.mid.sodium).toEqual({ status: 'resolved', startedDay: 13, resolvedDay: 15 });
  expect(r[1].s.mid.sodium).toEqual({ status: 'resolved', startedDay: 11, resolvedDay: 15 });
  expect(r[0].s.applied['MID:repair:NA'].requested).toBe(4); expect(r[1].s.applied['MID:check:NA'].requested).toBe(4);
});

for (const code of ['HE', 'MG', 'CA', 'CL', 'NA']) test(`15일 초면 ${code}: 이전 경험·합의 날조 없음`, async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async code => {
    const { Run, focus, checkpoint } = await import('/tests/mid-driver.js'); const engine = await import('/src/engine.js');
    const s = checkpoint(); const run = new Run(engine.decodeSave(JSON.stringify(s)));
    run.to('DAY16-HANDOFF', (s, opts) => s.day < 15 ? s.scene === 'MID-ACTION' ? 2 : s.scene === 'MID-AF' ? 1 : s.scene === 'MID-STUDY' ? opts.length - 1 : 0 : focus(code)(s, opts));
    return run.s;
  }, code);
  expect(r.mid.metDates[code]).toBe(15); expect(r.mid.personal[code]).toBe(15);
  expect(r.mid.heAgreementDay).toBeUndefined(); expect(r.applied[`MID:play:${code}`].requested).toBe(code === 'HE' ? 4 : 5);
  expect(r.snaps['SNAP2-HE']).toBeUndefined(); expect(r.mid.next[code]).toBeUndefined();
});

test('새 카드·문제 자료·제작문 미노출·모바일·미선택 인물 호감도 비표시', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  const state = await page.evaluate(async () => {
    const { fresh, enter } = await import('/src/engine.js'); const s = fresh('카드검증'); s.day = 15; enter(s, 'D15-NOTE'); return s;
  });
  await page.evaluate(([key, s]) => localStorage.setItem(key, JSON.stringify(s)), [KEY, state]);
  await page.getByRole('button', { name: '불러오기', exact: true }).click();
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  await expect(page.locator('.learning-card table')).toBeVisible();
  await expect(page.locator('.learning-card')).toContainText('플레이어의 새 실측이 아님');
  await expect(page.locator('.affinity')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('main')).not.toContainText(/제작용|발화 아님|SNAP2-|추천 \+|R 있으면/);
});

test('10일차 종료 구형 슬롯에서 실제 화면으로 15일 밤·제공 범위까지 이어가기', async ({ page }) => {
  test.setTimeout(60000); await page.goto('/');
  const plan = await page.evaluate(async () => {
    const { Run, focus, checkpoint } = await import('/tests/mid-driver.js'); const engine = await import('/src/engine.js');
    const start = checkpoint('H', 9); start.events.recordTaste = true;
    start.queue = [{ who: '이번 버전의 범위 종료', text: '여기까지가 1~10일차 제공 범위입니다.' }]; start.index = 1;
    const run = new Run(engine.decodeSave(JSON.stringify(start))); const picks = [];
    run.to('DAY16-HANDOFF', (s, opts) => { const index = focus('H')(s, opts); picks.push({ scene: s.scene, index }); return index; });
    return { start, picks, final: run.s };
  });
  await page.evaluate(([key, s]) => localStorage.setItem(key, JSON.stringify(s)), [KEY, plan.start]);
  await page.getByRole('button', { name: '불러오기', exact: true }).click();
  const cards = new Set();
  async function drain() {
    for (let n = 0; n < 100; n++) {
      const card = await page.locator('.dialogue .learning-card').count() ? await page.locator('.dialogue .learning-card').getAttribute('data-card') : null;
      if (card) cards.add(card);
      if (await page.getByRole('button', { name: '다음 ▸', exact: true }).count()) await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
      else if (await page.getByRole('button', { name: '스냅 닫고 계속', exact: true }).count()) await page.getByRole('button', { name: '스냅 닫고 계속', exact: true }).click();
      else break;
    }
  }
  for (const pick of plan.picks) { await drain(); await expect(page.locator('.scene-id')).toHaveText(pick.scene); await page.locator('.choices button').nth(pick.index).click(); }
  await drain(); await expect(page.locator('.scene-id')).toHaveText('DAY16-HANDOFF');
  await expect(page.locator('.dialogue')).toContainText('1~15일차'); await expect(page.locator('.affinity')).toHaveCount(0);
  expect([...cards]).toEqual(['molecules', 'ions', 'periodic', 'conduction', 'observation']);
  await page.getByRole('button', { name: '저장', exact: true }).click();
  const final = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  expect(final.affinity).toEqual(plan.final.affinity); expect(final.applied).toEqual(plan.final.applied);
});

test('120개 임의 회차: 15일 종료·매 줄 저장 검증·행동 중복 방지', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { Run } = await import('/tests/mid-driver.js'); const { SCHEDULE } = await import('/src/period.js');
    const scenes = new Set();
    for (let seed = 1; seed <= 120; seed++) {
      let n = (seed * 2654435761) >>> 0; const random = size => { n = (n * 1664525 + 1013904223) >>> 0; return Math.floor(n / 4294967296 * size); };
      const run = new Run(); run.to('DAY16-HANDOFF', (s, opts) => {
        scenes.add(s.scene);
        if (seed % 2 && ['LUNCH-SELECT', 'MID-LUNCH'].includes(s.scene)) {
          const occupied = opts.map((o, i) => SCHEDULE[s.day][o.place]?.length ? i : -1).filter(i => i >= 0); return occupied[random(occupied.length)];
        }
        if (seed % 2 && ['LUNCH-ACTION', 'MID-ACTION'].includes(s.scene)) return 0;
        if (seed % 2 && ['D2-AF', 'AF-SELECT', 'MID-AF'].includes(s.scene)) return opts.length - 1;
        if (s.scene === 'MID-STUDY') return opts.length - 1;
        return random(opts.length);
      });
      if (run.s.day !== 15) throw new Error('일자 변경');
      for (let d = 11; d <= 15; d++) if (!run.s.period.actions[d].lunch || !run.s.period.actions[d].afterSchool) throw new Error('행동 기록 누락');
    } return [...scenes];
  });
  expect(result).toContain('MID-HE-PREP'); expect(result).toContain('MID-NA-REPAIR'); expect(result).toContain('MID-PLAY-CL-READ');
});

test('새 개인 선택은 10일 이전 만남 증거만 허용, 저장의 새 필드·ID 검증', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { Run, checkpoint } = await import('/tests/mid-driver.js'); const e = await import('/src/engine.js');
    const routes = [];
    for (const evidence of [false, true]) {
      const s = checkpoint('MG', 90); s.period.person = 'MG';
      if (evidence) s.choices['DAY-3:MEET-MG:MG'] = 0;
      const run = new Run(e.decodeSave(JSON.stringify(s))); e.enter(run.s, 'EX-MG'); run.pick(0); routes.push(run.s.scene);
    }
    const bad = [];
    for (const mutate of [s => { s.day = 16; }, s => { s.scene = 'MID-UNKNOWN'; }, s => { s.snaps['SNAP2-UNKNOWN'] = {}; }, s => { s.notes.push('D16-NOTE'); }, s => { s.mid.sodium.status = 'forgotten'; }, s => { s.queue[0].card = 'unknown'; }]) {
      const s = e.fresh('검증'); mutate(s); try { e.decodeSave(JSON.stringify(s)); bad.push(false); } catch { bad.push(true); }
    }
    return { routes, bad };
  });
  expect(result.routes).toEqual(['EX-AF', 'EX-PERSONAL']); expect(result.bad).toEqual(Array(6).fill(true));
});

test('11~15일 학습 선택 뒤의 즉시 설명은 실제 교사 대사이며 관계 보상 없음', async ({ page }) => {
  await page.goto('/');
  const responses = await page.evaluate(async () => {
    const e = await import('/src/engine.js'); const result = [];
    for (let day = 11; day <= 15; day++) {
      const s = e.fresh('학습'); s.day = day; e.enter(s, `D${day}-NOTE`);
      while (s.index < s.queue.length) e.advance(s);
      const before = structuredClone(s.affinity); e.options(s)[0].run();
      result.push({ teacher: s.queue.at(-1), unchanged: JSON.stringify(before) === JSON.stringify(s.affinity) });
    } return result;
  });
  for (const r of responses) { expect(r.unchanged).toBe(true); expect(r.teacher.who).toBe('화학 교사'); expect(r.teacher.kind).toBe('dialogue'); }
  expect(responses[0].teacher.text).toContain('두 원소'); expect(responses[1].teacher.text).toContain('양성자 수 11');
  expect(responses[2].teacher.text).toContain('1족, 3주기'); expect(responses[3].teacher.text).toContain('이동할 수'); expect(responses[4].teacher.text).toContain('이온의 종류를 식별한 것은 아닙니다');
});

test('새 주요 사건 대안·당일 R 제외·스냅 없는 후속·세부 기억 조건', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const e = await import('/src/engine.js'); const { PEOPLE } = await import('/src/period.js');
    const rows = [];
    for (const code of Object.keys(PEOPLE)) for (const prior of [false, true]) for (const choice of [0, 1, 2]) {
      if (code === 'CL' && choice === 2) continue;
      let s = e.fresh('대안'); s.day = 15; s.time = '방과후'; s.period.person = code;
      s.period.actions[15] = { lunch: '대화', afterSchool: code }; s.mid.personal[code] = prior ? 14 : 15;
      if (code === 'HE' && prior) s.mid.heAgreementDay = 12;
      e.enter(s, `MID-PLAY-${code}`); const intro = s.queue.map(q => q.text).join(' ');
      while (s.index < s.queue.length) e.advance(s);
      if (code === 'CL') { e.options(s)[0].run(); while (s.index < s.queue.length) e.advance(s); }
      const o = e.options(s)[choice]; o.run(); const before = s.affinity[PEOPLE[code]];
      while (s.index < s.queue.length) { s = e.decodeSave(JSON.stringify(s)); e.advance(s); }
      rows.push({ code, prior, choice, before, total: s.affinity[PEOPLE[code]], intro, snaps: Object.keys(s.snaps), shared: s.mid.shared });
    }
    const variants = [];
    for (const code of ['H', 'CA']) {
      let s = e.fresh('선행없음'); s.day = 15; s.time = '점심 · 급식 뒤'; s.period.person = code; s.mid.seed[code] = 12;
      e.enter(s, 'MID-ECHO'); while (s.index < s.queue.length) e.advance(s); e.options(s)[0].run();
      while (s.index < s.queue.length) { s = e.decodeSave(JSON.stringify(s)); e.advance(s); } variants.push(s.snaps);
    }
    return { rows, variants };
  });
  for (const r of results.rows) {
    expect(r.before).toBe(0); // relation is committed only when the real response finishes
    const expected = r.choice === 0 ? r.prior ? 8 : r.code === 'HE' ? 4 : 5 : r.choice === 1 && r.code !== 'HE' ? 5 : 0;
    expect(r.total).toBe(expected);
    if (r.choice !== 0) { expect(r.snaps).toEqual([]); expect(r.shared).toEqual({}); }
    if (r.code === 'MG') expect(r.intro).not.toContain('그때 봤던');
    if (r.code === 'CA') expect(r.intro).toContain('처음 같이 노는');
    if (r.code === 'CL') expect(r.intro).toContain('처음 보여 주는');
  }
  expect(results.variants).toEqual([{}, {}]);
});

for (const code of ['H', 'HE', 'C', 'NA', 'MG', 'CA', 'CL']) test(`${code} 신규 스냅 전·중·복귀 DOM 저장, 이미지 실패와 중복 효과 없음`, async ({ page }) => {
  await page.goto('/');
  const states = await page.evaluate(async code => {
    const { Run, focus } = await import('/tests/mid-driver.js'); const run = new Run(); run.to('DAY16-HANDOFF', focus(code));
    const at = run.snaps.find(x => x.id === `SNAP2-${code}`).state;
    const pre = structuredClone(at); pre.index--; delete pre.snaps[`SNAP2-${code}`]; return { pre, at };
  }, code);
  await page.route(`**/assets/snaps/SNAP2-${code}.webp`, route => route.abort());
  for (const s of [states.pre, states.at]) {
    await page.evaluate(([key, s]) => localStorage.setItem(key, JSON.stringify(s)), [KEY, s]); await page.reload();
    await page.getByRole('button', { name: '불러오기', exact: true }).click();
    if (s === states.pre) await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
    await expect(page.locator('.snap')).toContainText('장면 설명으로 표시');
    await page.getByRole('button', { name: '저장', exact: true }).click();
    const during = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    await page.reload(); await page.getByRole('button', { name: '불러오기', exact: true }).click();
    await page.getByRole('button', { name: '스냅 닫고 계속', exact: true }).click();
    await expect(page.locator('.dialogue-text')).toHaveText(during.queue[during.index + 1].text);
    await page.getByRole('button', { name: '저장', exact: true }).click();
    const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    expect(after.affinity).toEqual(during.affinity); expect(after.applied).toEqual(during.applied);
    await page.reload(); await page.getByRole('button', { name: '불러오기', exact: true }).click();
    await expect(page.locator('.dialogue-text')).toHaveText(after.queue[after.index].text);
  }
});
