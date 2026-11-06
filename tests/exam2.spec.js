import { test, expect } from '@playwright/test';
import { menuAction } from './ui-driver.js';
const KEY = 'love-chemistry.prototype.v1';
async function fixture(page, scene = 'EX2-PAPER') {
  await page.goto('/');
  return page.evaluate(async scene => {
    const e = await import('/src/engine.js'); const ex1 = await import('/src/extension.js'); const x = await import('/src/second-term.js');
    const s = e.fresh('시험검증'); s.day = 10; e.enter(s, 'EX-PAPER'); ex1.examAnswer(s, 0, 0); ex1.submitExam(s, e.enter); ex1.finishExam(s, e.enter);
    for (const id of x.SECOND_NOTES) { e.enter(s, id); while (s.index < s.queue.length) e.advance(s); }
    e.enter(s, scene); return s;
  }, scene);
}
async function load(page, s) {
  await page.evaluate(([key, s]) => localStorage.setItem(key, JSON.stringify(s)), [KEY, s]);
  await menuAction(page, '불러오기');
}
async function saved(page) { await menuAction(page, '저장'); return page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY); }

test('EX2 원문 10문항·보기·정답·해설·각 10점과 버전 정본 일치', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const source = (await import('/docs/science-reference.md?raw')).default;
    const { EXAM2_VERSION, EXAM2_VERSIONS } = await import('/src/exam2-content.js');
    const rows = source.split('\n').filter(l => /^\| EX2-Q\d/.test(l)).map(line => {
      const [id, question, explanation] = line.slice(1, -1).split('|').map(s => s.trim());
      const parts = question.split(/[①②③④] /); const correct = '①②③④'.indexOf(explanation.match(/\*\*([①②③④])\*\*/)[1]);
      return { id: id.split(' · ')[0], prompt: parts[0].trim(), options: parts.slice(1).map(s => s.trim()), correct, points: 10, explanation: explanation.replace(/^\*\*[①②③④]\*\*\. /, '') };
    });
    return { rows, actual: EXAM2_VERSIONS[EXAM2_VERSION].map(({ card, ...q }) => q) };
  });
  expect(r.rows).toHaveLength(10); expect(r.actual).toEqual(r.rows);
});

test('16~19일 독립 노트·카드·즉시 설명과 실측·관계·첫 시험 불변, 15일 인계에 계속하기 제공', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const e = await import('/src/engine.js'); const x = await import('/src/second-term.js');
    let s = e.fresh('수업'); const unchanged = s => JSON.stringify([s.affinity, s.applied, s.choices, s.lab, s.exam, s.mid]);
    const before = unchanged(s); const lessons = [];
    for (const id of x.SECOND_NOTES) {
      e.enter(s, id); const notes = [...s.notes]; const queue = structuredClone(s.queue);
      while (s.index < s.queue.length) { s = e.decodeSave(JSON.stringify(s)); e.advance(s); }
      lessons.push({ id, notes, queue, options: e.options(s).length });
    }
    const after = unchanged(s);
    const old = e.fresh('범위'); old.day = 15; e.enter(old, 'DAY16-HANDOFF'); while (old.index < old.queue.length) e.advance(old);
    return { before, after, lessons, boundary: { day: old.day, scene: old.scene, choices: e.options(old).length } };
  });
  expect(r.after).toBe(r.before); expect(r.boundary).toEqual({ day: 15, scene: 'DAY16-HANDOFF', choices: 1 });
  expect(r.lessons.flatMap(l => l.queue.filter(q => q.card).map(q => q.card))).toEqual(['providedRecords', 'unmeasuredRecord', 'conduction', 'comparisonConditions', 'shells', 'coldWaterComparison', 'ions', 'forms', 'graphiteEvidence']);
  for (const l of r.lessons) {
    expect(l.notes).toContain(l.id); expect(l.options).toBe(0);
    for (let i = 0; i < l.queue.length; i++) if (l.queue[i].card) expect(l.queue[i + 1].who).toBe('화학 교사');
  }
});

test('exam2 없는 v2는 메모리에서만 초기화, EX1·큐·선택 보존', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async key => {
    const e = await import('/src/engine.js'); let s = e.fresh('구저장'); delete s.exam2;
    const raw = JSON.stringify(s); localStorage.setItem(key, raw); const restored = e.decodeSave(raw);
    const { exam2, ...rest } = restored; return { old: s, rest, exam2, raw, persisted: localStorage.getItem(key) };
  }, KEY);
  expect(r.rest).toEqual(r.old); expect(r.persisted).toBe(r.raw);
  expect(r.exam2).toMatchObject({ answers: Array(10).fill(null), index: 0, submitted: false, result: null, returned: false });
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 360, height: 640 }]) test(`EX2 UI ${viewport.width}: 답 변경·응답 수·복원·제출·해설·20일 점심 복귀`, async ({ page }) => {
  await page.setViewportSize(viewport); const start = await fixture(page); await load(page, start);
  await expect(page.locator('.exam h2')).toHaveText('둘째 시험 · 1/10');
  await page.getByRole('radio').nth(0).check(); await page.getByRole('radio').nth(1).check();
  await expect(page.locator('.exam')).toContainText('1/10문항 응답');
  await page.getByRole('button', { name: '다음 문항' }).click(); await page.getByRole('button', { name: '이전 문항' }).click();
  await expect(page.getByRole('radio').nth(1)).toBeChecked();
  const midway = await saved(page); await page.reload(); await menuAction(page, '불러오기');
  expect((await saved(page)).exam2).toEqual(midway.exam2);
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: '다음 문항' }).click();
  await page.getByRole('radio').nth(2).check();
  if (viewport.width === 360) {
    await page.getByRole('button', { name: '제공된 비교 자료 보기' }).click();
    await expect(page.locator('.panel')).toContainText('같은 찬물 조건'); await page.keyboard.press('Escape');
  } else await expect(page.locator('.exam .learning-card')).toContainText('같은 찬물 조건');
  await page.getByRole('button', { name: '답안 제출' }).click();
  await expect(page.locator('.exam h2')).toHaveText('둘째 시험 결과 · 20/100점');
  const submitted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  expect(submitted.scene).toBe('EX2-RESULT'); expect(submitted.exam).toEqual(start.exam);
  expect(submitted.exam2.result.details).toHaveLength(10);
  await expect(page.locator('.exam-explanations')).toContainText('해설:');
  await page.reload(); await menuAction(page, '불러오기');
  expect((await saved(page)).exam2).toEqual(submitted.exam2);
  await page.getByRole('button', { name: '결과 확인 · 시험 후 일과로' }).click();
  const returned = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  expect(returned).toMatchObject({ scene: 'EX2-AFTER', day: 20, time: '점심 · 급식 뒤', events: { exam2Returned: true }, exam2: { returned: true } });
  expect(returned.exam).toEqual(start.exam); expect(returned.affinity).toEqual(start.affinity); expect(returned.applied).toEqual(start.applied);
  await page.reload(); await menuAction(page, '불러오기'); expect((await saved(page)).exam2).toEqual(returned.exam2);
  await load(page, midway); expect((await saved(page)).exam2).toEqual(midway.exam2);
});

test('EX2 제출·복귀 저장 실패: 이전 슬롯·상태 유지, 고정 후보 재시도, 홈·이전 저장 복원', async ({ page }) => {
  const start = await fixture(page); await load(page, start);
  await page.getByRole('radio').nth(1).check(); const before = await saved(page);
  await page.evaluate(() => { window.realSetItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('quota'); }; });
  await page.getByRole('button', { name: '답안 제출' }).click();
  await expect(page.getByRole('alert')).toContainText('아직 결과가 적용되지 않았습니다');
  await expect(page.locator('.scene-id')).toHaveText('EX2-PAPER');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY)).toEqual(before);
  await page.getByRole('button', { name: '저장 다시 시도' }).click();
  await expect(page.locator('.scene-id')).toHaveText('EX2-PAPER');
  await page.evaluate(() => { Storage.prototype.setItem = window.realSetItem; });
  await page.getByRole('button', { name: '저장 다시 시도' }).click();
  await expect(page.locator('.exam h2')).toHaveText('둘째 시험 결과 · 10/100점');
  const submitted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('quota'); }; });
  await page.getByRole('button', { name: '결과 확인 · 시험 후 일과로' }).click();
  await expect(page.locator('.scene-id')).toHaveText('EX2-RESULT');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY)).toEqual(submitted);
  await page.getByRole('button', { name: '시작 화면으로', exact: true }).click();
  await page.evaluate(() => { Storage.prototype.setItem = window.realSetItem; });
  await page.getByRole('button', { name: '불러오기', exact: true }).click();
  await expect(page.locator('.scene-id')).toHaveText('EX2-RESULT');
  await page.getByRole('button', { name: '결과 확인 · 시험 후 일과로' }).click();
  expect((await saved(page)).exam2.returned).toBe(true);
  await load(page, before); expect((await saved(page)).exam2.submitted).toBe(false);
});

test('EX2 버전·결과·날짜 검증과 중복 커밋 방지, 모르는 문항 버전은 재채점 없이 거부', async ({ page }) => {
  const start = await fixture(page);
  const r = await page.evaluate(async s => {
    const e = await import('/src/engine.js'); const x = await import('/src/second-term.js');
    x.exam2Questions(s).forEach((q, i) => x.exam2Answer(s, i, q.correct));
    const result = x.prepareExam2Commit(s, 'submit', e.enter); const restored = e.decodeSave(JSON.stringify(result));
    const returned = x.prepareExam2Commit(restored, 'return', e.enter);
    const mutations = [c => c.exam2.version = 'future', c => c.exam2.result.version = 'future', c => c.exam2.result.score = 90,
      c => c.exam2.result.details[0].correct = 3, c => c.exam2.result.details[0].points = 11,
      c => c.exam2.result.details[0].id = 'EX1-Q01', c => c.day = 19, c => c.exam2.answers.pop(), c => c.exam2.index = 10];
    const errors = mutations.map(mutate => { const c = structuredClone(result); mutate(c); try { e.decodeSave(JSON.stringify(c)); return false; } catch { return true; } });
    return { result, restored, returned, errors, againSubmit: x.prepareExam2Commit(result, 'submit', e.enter), againReturn: x.prepareExam2Commit(returned, 'return', e.enter) };
  }, start);
  expect(r.result.exam2.result.score).toBe(100); expect(r.restored).toEqual(r.result);
  expect(r.returned.day).toBe(20); expect(r.againSubmit).toBeNull(); expect(r.againReturn).toBeNull();
  expect(r.errors).toEqual(Array(9).fill(true));
  const corrupt = structuredClone(r.result); corrupt.exam2.version = 'future'; await load(page, corrupt);
  await expect(page.getByRole('status')).toContainText('불러오기 실패');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY)).toEqual(corrupt);
});
