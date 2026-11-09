import { test, expect } from '@playwright/test';
test.use({ reducedMotion: 'reduce' });
import { beginNew, menuAction } from './ui-driver.js';

const SAVE_KEY = 'love-chemistry.prototype.v1';
const people = { H: '수소', HE: '헬륨', C: '탄소', NA: '나트륨', MG: '마그네슘', CA: '칼슘', CL: '염소' };
const placeFor = { H: 3, HE: 0, C: 2, NA: 1, MG: 1, CA: 4, CL: 3 };
const available = { H: [2, 6, 9], HE: [2, 4, 7], C: [2, 5, 9], NA: [2, 5, 8], MG: [3, 6], CA: [2, 4, 8], CL: [3, 7] };
// Keep the original missing-art regression explicit now that real art ships.
// The separate loaded-image test below overrides its exact URL as before.
test.beforeEach(async ({ page }) => { await page.route('**/assets/snaps/*.webp', route => route.abort()); });
const scene = page => page.locator('.scene-id').textContent();
async function save(page) {
  await menuAction(page, '저장');
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
}
async function restore(page) {
  const before = await save(page);
  await page.reload(); await page.getByRole('button', { name: '불러오기', exact: true }).click();
  expect(await save(page)).toEqual(before); return before;
}
async function drain(page, snaps = []) {
  for (let n = 0; n < 100; n++) {
    if (await page.getByRole('button', { name: '다음 ▸', exact: true }).count()) {
      await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
    } else if (await page.getByRole('button', { name: '스냅 정보 보기 ▸', exact: true }).count()) {
      await page.getByRole('button', { name: '스냅 정보 보기 ▸', exact: true }).click();
    } else if (await page.getByRole('button', { name: '스냅 닫고 계속', exact: true }).count()) {
      const state = await restore(page); const id = state.queue[state.index].snap; snaps.push(id);
      expect(state.snaps[id]).toBeTruthy();
      await expect(page.locator('.snap-backdrop')).toContainText('이미지 준비 중');
      await page.getByRole('button', { name: '스냅 닫고 계속', exact: true }).click();
      const after = await restore(page);
      expect(after.affinity).toEqual(state.affinity); expect(after.applied).toEqual(state.applied); expect(after.snaps).toEqual(state.snaps);
    } else return;
  }
  throw new Error('대사 진행이 끝나지 않음');
}
async function choose(page, i, snaps = []) {
  await drain(page, snaps); await page.locator('.choices button').nth(i).click(); await drain(page, snaps);
}
async function start(page) {
  await page.goto('/'); await beginNew(page);
  await page.getByLabel('학교에서 불릴 이름').fill('확장검증'); await page.getByRole('button', { name: '등교하기' }).click();
  for (const i of [1, 0, 0, 3, 0, 1, 1, 0, 0]) await choose(page, i);
  expect(await scene(page)).toBe('B-04');
}
async function runToExam(page, { plan = {}, nonSocial = null, snaps = [], snapshots = false } = {}) {
  for (let step = 0; step < 150; step++) {
    await drain(page, snaps); const id = await scene(page);
    if (id === 'EX-PAPER') return;
    const dayText = await page.locator('.day-strip strong').textContent();
    const day = Number(dayText.match(/\d+/)[0]);
    let index = 0;
    if (id === 'B-04' || id === 'LUNCH-SELECT') index = plan[day] ? placeFor[plan[day]] : 2;
    else if (id === 'B-04-action' || id === 'LUNCH-ACTION') index = nonSocial === 'study' ? 1 : nonSocial === 'skip' ? 2 : plan[day] ? 0 : 2;
    else if (id === 'B-05') index = 0; // C는 기존 시제품 테스트에서 별도 검증.
    else if (['AF-SELECT', 'D2-AF'].includes(id)) index = plan[day] && !nonSocial ? 1 : 0;
    if (snapshots && /^LAB-(H|C|NA|MG|CA|CL-read)$/.test(id)) {
      const before = await restore(page);
      const snapId = id === 'LAB-CL-read' ? 'SNAP-CL' : 'SNAP-' + id.slice(4);
      expect(before.snaps[snapId]).toBeUndefined();
    }
    const choices = page.locator('.choices button');
    expect(await choices.count(), `${id}에 선택지가 있어야 함`).toBeGreaterThan(index);
    await expect(choices).not.toContainText(['미구현']);
    await choose(page, index, snaps);
  }
  throw new Error('시험에 도달하지 못함');
}
async function takeExam(page, { empty = false, restoreDuring = false } = {}) {
  const right = [0, 2, 1, 3, 0, 1, 2, 3, 1, 2];
  if (restoreDuring && !empty) {
    await page.getByRole('radio').nth(1).check();
    await page.getByRole('button', { name: '다음 문항', exact: true }).click();
    await page.getByRole('button', { name: '이전 문항', exact: true }).click();
    await expect(page.getByRole('radio').nth(1)).toBeChecked();
    await restore(page); await expect(page.getByRole('radio').nth(1)).toBeChecked();
  }
  if (!empty) for (let i = 0; i < right.length; i++) {
    await page.getByRole('radio').nth(right[i]).check();
    if (restoreDuring && i === 3) await restore(page);
    if (i < right.length - 1) await page.getByRole('button', { name: '다음 문항', exact: true }).click();
  }
  const before = await save(page); expect(before.exam.submitted).toBe(false);
  await page.getByRole('button', { name: '답안 제출', exact: true }).click();
  await expect(page.locator('.exam h2')).toHaveText(`첫 시험 결과 · ${empty ? 0 : 100}/100점`);
  const autoSaved = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), SAVE_KEY);
  expect(autoSaved.exam.submitted).toBe(true); expect(autoSaved.scene).toBe('EX-RESULT');
  const submitted = await restore(page); expect(submitted.affinity).toEqual(before.affinity);
  await expect(page.locator('.exam')).toContainText('해설:');
  expect(submitted.exam.result.details).toHaveLength(10);
  await page.getByRole('button', { name: '결과 확인 · 시험 후 일과로', exact: true }).click(); await drain(page);
  const after = await restore(page); expect(after.exam.returned).toBe(true); expect(after.exam.result).toEqual(submitted.exam.result);
  expect(await scene(page)).toBe('LUNCH-SELECT');
}
async function finish10(page, code = null) {
  await choose(page, code ? placeFor[code] : 2);
  await choose(page, code ? 0 : 2);
  if (code && ['NA', 'MG', 'H', 'CL'].includes(code)) await choose(page, ['MG', 'CL'].includes(code) ? 1 : 0);
  if ((await scene(page)).startsWith('MEET-')) await choose(page, 0);
  if (code) await choose(page, 0);
  else await choose(page, 0); // 휴식 마치기
  if (await scene(page) === 'EX-PERSONAL') await choose(page, 0);
  await expect(page.locator('.scene-id')).toHaveText('EX-AF');
  await choose(page, code ? 1 : 0);
  if (code) await choose(page, 0);
  await expect(page.locator('.scene-id')).toHaveText('DAY11-HANDOFF');
  await expect(page.locator('.choices')).toContainText('11일차로 이어가기');
  return save(page);
}

test('한 회차에서 전원 첫 만남·동행, 첫 시험 저장 복원 후 10일차 완료', async ({ page }) => {
  test.setTimeout(120000);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const snaps = []; await start(page);
  await runToExam(page, { plan: { 2: 'HE', 3: 'MG', 4: 'CA', 5: 'NA', 6: 'H', 7: 'CL', 8: 'NA', 9: 'C' }, snaps, snapshots: true });
  let s = await save(page); expect(Object.keys(s.period.met).sort()).toEqual(Object.keys(people).sort());
  expect(Object.keys(s.period.labs).sort()).toEqual(Object.keys(people).sort());
  expect(s.notes).toContain('D4-NOTE'); expect(s.notes).toHaveLength(9);
  await page.getByRole('button', { name: '핵심 노트', exact: true }).click();
  await expect(page.locator('.panel [data-card="shells"] table')).toContainText('Li');
  await expect(page.locator('.panel [data-card="shells"] table')).toContainText('Na'); await page.getByRole('button', { name: '닫기', exact: true }).click();
  await takeExam(page, { restoreDuring: true });
  s = await finish10(page, 'MG'); expect(s.day).toBe(10); expect(s.exam.result.score).toBe(100);
  expect(snaps.sort()).toEqual(['SNAP-MG', 'SNAP-NA', 'SNAP-H', 'SNAP-CL', 'SNAP-C', 'SNAP-CA'].sort());
  for (let day = 3; day <= 9; day++) { expect(s.period.actions[day].lunch).toBe('대화'); expect(s.period.actions[day].afterSchool).toBeTruthy(); }
  expect(errors).toEqual([]);
});

for (const action of ['study', 'skip']) test(`매일 ${action}: 미만남·무가점, 미응답 시험도 정상 완료`, async ({ page }) => {
  test.setTimeout(120000); await start(page);
  await runToExam(page, { nonSocial: action });
  const before = await save(page); expect(Object.keys(before.period.met).sort()).toEqual(['C', 'H']); expect(before.period.labs).toEqual({}); expect(before.snaps).toEqual({});
  await takeExam(page, { empty: true, restoreDuring: true });
  const end = await finish10(page); expect(end.affinity).toEqual(before.affinity); expect(end.exam.result.score).toBe(0);
});

for (const [code, maximum] of [['H', 26], ['HE', 17], ['C', 20], ['NA', 20], ['MG', 20], ['CA', 20], ['CL', 20]]) test(`${people[code]} 집중 경로·관계 수치·스냅 전중후 복원`, async ({ page }) => {
  test.setTimeout(120000); await start(page); const snaps = [];
  await runToExam(page, { plan: Object.fromEntries(available[code].map(d => [d, code])), snaps, snapshots: true });
  const s = await save(page);
  // EX-PERSONAL 이전. 나트륨은 2일차 가상 실험 대신 자유 행동이므로 별도 최적과 다르다.
  expect(s.affinity[people[code]]).toBe(maximum);
  expect(s.period.labs[code]).toBe(true); expect(s.period.follows[code]).toBe(true);
  if (code !== 'NA') expect(snaps).toContain('SNAP-' + code);
  expect(Object.keys(s.snaps)).toHaveLength(new Set(snaps).size);
});

test('구버전 저장은 설명과 함께 보존하고 새 게임만으로 덮어쓰지 않는다', async ({ page }) => {
  await page.goto('/'); const old = JSON.stringify({ version: 1, scene: 'end', name: '이전진행' });
  await page.evaluate(([key, raw]) => localStorage.setItem(key, raw), [SAVE_KEY, old]);
  await page.getByRole('button', { name: '불러오기', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('구버전'); await expect(page.getByRole('status')).toContainText('원본은 삭제하지 않았습니다');
  expect(await page.evaluate(k => localStorage.getItem(k), SAVE_KEY)).toBe(old);
  await start(page); expect(await page.evaluate(k => localStorage.getItem(k), SAVE_KEY)).toBe(old);
});

test('헬륨 후속 보류 뒤 7일차 실제 반환으로 한 번만 보상·스냅 적용', async ({ page }) => {
  test.setTimeout(120000); await start(page);
  const snaps = [];
  for (const i of [0, 0, 0, 0, 1, 0]) await choose(page, i, snaps); // 2일 옥상, 인사·RE·동행·LAB 합의
  expect(await scene(page)).toBe('D3-RECESS');
  // 3일차는 혼자 휴식.
  for (const i of [0, 2, 2, 0, 0]) await choose(page, i, snaps);
  expect(await scene(page)).toBe('D4-RECESS');
  for (const i of [0, 0, 0, 0, 1]) await choose(page, i, snaps);
  expect(await scene(page)).toBe('LAB-FOLLOW');
  await choose(page, 1, snaps);
  let s = await save(page); expect(s.period.follows.HE).toBeUndefined(); expect(s.snaps['SNAP-HE']).toBeUndefined(); expect(s.period.promises.heAgreement).toBe(true);
  await runToExam(page, { plan: { 7: 'HE' }, snaps });
  s = await save(page); expect(s.period.follows.HE).toBe(true); expect(s.period.promises.heReturned).toBe(true); expect(snaps).toEqual(['SNAP-HE']); expect(s.affinity['헬륨']).toBe(17);
});

for (const code of ['HE', 'NA', 'MG', 'CA', 'CL']) test(`10일차 ${people[code]} 초면도 과거 경험 없이 대화·동행 완료`, async ({ page }) => {
  test.setTimeout(120000); await start(page); await runToExam(page, { nonSocial: 'skip' });
  await takeExam(page, { empty: true }); const s = await finish10(page, code);
  expect(s.period.met[code]).toBe(true); expect(s.period.re[code]).toBeUndefined(); expect(s.period.labs[code]).toBeUndefined();
  expect(s.snaps).toEqual({}); expect(s.affinity[people[code]]).toBe(0);
});

test('임의 선택 80회차: 필수 경로 차단 없음·저장 라운드트립·점수 중복 없음', async ({ page }) => {
  test.setTimeout(120000); await page.goto('/');
  const result = await page.evaluate(async () => {
    const engine = await import('/src/engine.js'); const extension = await import('/src/extension.js');
    const { EXAM, SCHEDULE } = await import('/src/period.js');
    const visited = new Set(); const reached = [];
    for (let seed = 1; seed <= 80; seed++) {
      let random = seed; const next = n => { random = (random * 1664525 + 1013904223) >>> 0; return Math.floor(random / 4294967296 * n); };
      let s = engine.fresh('분기검증'); let done = false;
      for (let step = 0; step < 600; step++) {
        visited.add(s.scene);
        s = engine.decodeSave(JSON.stringify(s));
        if (s.index < s.queue.length) { engine.advance(s); continue; }
        if (s.scene === 'DAY11-HANDOFF') { reached.push(s.day); done = true; break; }
        if (s.lab.task) {
          engine.labAction(s, 'select', s.lab.task.sample);
          if (s.lab.task.sample === 'salt') { engine.labAction(s, 'add'); engine.labAction(s, 'dissolve'); }
          engine.labAction(s, 'measure'); continue;
        }
        if (s.scene === 'EX-PAPER') {
          EXAM.forEach((q, i) => extension.examAnswer(s, i, next(4)));
          extension.submitExam(s, engine.enter); continue;
        }
        if (s.scene === 'EX-RESULT') { extension.finishExam(s, engine.enter); continue; }
        const opts = engine.options(s).filter(o => !o.disabled);
        if (!opts.length) throw new Error(`선택지 없음: ${s.day}일 ${s.scene}`);
        let choice = opts[next(opts.length)];
        // 절반은 실제 인물이 있는 장소의 교류를 우선하여 후속 사건도 탐색한다.
        if (seed % 2) {
          if (s.scene === 'LUNCH-SELECT') {
            const occupied = opts.filter(o => SCHEDULE[s.day][o.place]); choice = occupied[next(occupied.length)];
          }
          if (['LUNCH-ACTION', 'B-04-action'].includes(s.scene)) choice = opts[0];
          if (['AF-SELECT', 'D2-AF'].includes(s.scene)) choice = opts.at(-1);
        }
        choice.run();
        const once = JSON.stringify(s.affinity); const applied = JSON.stringify(s.applied);
        choice.run();
        if (JSON.stringify(s.affinity) !== once || JSON.stringify(s.applied) !== applied) throw new Error(`중복 점수: ${s.scene}`);
      }
      if (!done) throw new Error(`종료 불가: ${seed} ${s.scene}`);
    }
    return { reached, visited: [...visited] };
  });
  expect(result.reached).toHaveLength(80); expect(new Set(result.reached)).toEqual(new Set([10]));
  expect(result.visited).toContain('EX-PAPER'); expect(result.visited).toContain('LAB-FOLLOW');
});

test('스냅 실제 이미지 로드와 실패 대체 모두 진행·점수에 영향 없음', async ({ page }) => {
  await page.goto('/');
  const seeded = await page.evaluate(async () => {
    const { fresh, enter, advance, options } = await import('/src/engine.js');
    const s = fresh('이미지검증'); s.day = 2; s.period.person = 'H'; s.period.met.H = true;
    enter(s, 'LAB-H'); while (s.index < s.queue.length) advance(s);
    options(s)[0].run(); return s;
  });
  await page.route('**/assets/snaps/SNAP-H.webp', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>' }));
  await page.evaluate(([key, s]) => localStorage.setItem(key, JSON.stringify(s)), [SAVE_KEY, seeded]);
  await page.getByRole('button', { name: '불러오기', exact: true }).click();
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  await expect(page.locator('.speaker')).toHaveText('수소');
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  await expect(page.locator('.snap-backdrop img')).toBeVisible();
  await expect.poll(() => page.locator('.snap-backdrop img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  const before = await restore(page);
  await page.unroute('**/assets/snaps/SNAP-H.webp');
  await page.route('**/assets/snaps/SNAP-H.webp', route => route.abort());
  await page.reload(); await page.getByRole('button', { name: '불러오기', exact: true }).click();
  await expect(page.locator('.snap-backdrop')).toContainText('이미지 준비 중');
  expect((await save(page)).affinity).toEqual(before.affinity);
  await page.getByRole('button', { name: '스냅 정보 보기 ▸', exact: true }).click();
  await page.getByRole('button', { name: '스냅 닫고 계속', exact: true }).click();
  await expect(page.locator('.dialogue')).toContainText('지도는 다음에 다시 펼치자.');
  expect((await save(page)).applied).toEqual(before.applied);
});

test('조건별 관계 수치와 스냅 생략: 무례·미합의·미열람·미시도는 별도 기록', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const { fresh, enter, advance, options, decodeSave } = await import('/src/engine.js');
    function check(code, id, choice, promises = {}, rude = false) {
      let s = fresh('조건검증'); s.day = 5; s.period.person = code; s.period.promises = promises;
      s.events.takeover = rude; enter(s, id);
      while (s.index < s.queue.length) advance(s);
      options(s)[choice].run();
      while (s.day === 5 && s.index < s.queue.length) { s = decodeSave(JSON.stringify(s)); advance(s); }
      return { affinity: s.affinity, snaps: s.snaps, promises: s.period.promises, follows: s.period.follows, events: s.events };
    }
    return {
      rudeNA: check('NA', 'LAB-NA', 0, {}, true),
      rudeFollow: check('NA', 'LAB-FOLLOW', 0, {}, true),
      noAgreement: check('HE', 'LAB-FOLLOW', 0),
      noAttempt: check('MG', 'LAB-FOLLOW', 0),
      noRead: check('CL', 'LAB-FOLLOW', 0),
      noStop: check('CA', 'LAB-CA', 0),
      otherReading: check('CL', 'LAB-CL-read', 1, { clPrivate: true }),
      noReading: check('CL', 'LAB-CL', 1),
      mgNegative: check('MG', 'LAB-MG', 2),
      cNegative: check('C', 'RE-C', 1),
    };
  });
  expect(results.rudeNA.affinity['나트륨']).toBe(0); expect(results.rudeNA.snaps['SNAP-NA']).toBeTruthy(); expect(results.rudeNA.events.takeover).toBe(true);
  expect(results.rudeFollow.affinity['나트륨']).toBe(0); expect(results.rudeFollow.events.takeover).toBe(true);
  expect(results.noAgreement.affinity['헬륨']).toBe(3); expect(results.noAgreement.snaps).toEqual({});
  expect(results.noAttempt.affinity['마그네슘']).toBe(5); expect(results.noRead.affinity['염소']).toBe(5);
  expect(results.noStop.affinity['칼슘']).toBe(5); expect(results.noStop.snaps).toEqual({});
  expect(results.otherReading.affinity['염소']).toBe(5); expect(results.otherReading.snaps).toEqual({});
  expect(results.noReading.affinity['염소']).toBe(0); expect(results.noReading.promises.clRead).toBeUndefined();
  expect(results.mgNegative.events.takeover).toBe(false); expect(results.cNegative.events.takeover).toBe(false);
});
