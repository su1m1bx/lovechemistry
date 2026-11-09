import { test, expect } from '@playwright/test';
test.use({ reducedMotion: 'reduce' });
import { menuAction } from './ui-driver.js';

const KEY = 'love-chemistry.prototype.v1';
async function load(page, state) {
  await page.evaluate(([key, state]) => localStorage.setItem(key, JSON.stringify(state)), [KEY, state]);
  await page.reload(); await page.getByRole('button', { name: '불러오기', exact: true }).click();
}
async function save(page) {
  await menuAction(page, '저장');
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
}
const scores = s => ({ affinity: s.affinity, choices: s.choices, applied: s.applied, exam: s.exam });

for (const action of [1, 2]) test(`공통 4일차 수업: ${action === 1 ? '공부' : '휴식'} 경로도 시험 전에 족·주기를 배우고 노트와 같은 도식 재열람`, async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async action => {
    const { Run } = await import('/tests/mid-driver.js');
    const { NOTE_CARDS, CARDS } = await import('/src/learning.js');
    const { PERIOD_NOTES } = await import('/src/period.js');
    const run = new Run(); let lesson;
    const restore = run.restore.bind(run);
    run.restore = () => { if (run.s.scene === 'D4-NOTE' && !lesson) lesson = structuredClone(run.s); restore(); };
    run.to('EX-PAPER', (s) => ['A-04-action', 'B-04-action', 'LUNCH-ACTION'].includes(s.scene) ? action : 0);
    return { lesson, exam: run.s, cards: NOTE_CARDS['D4-NOTE'], note: PERIOD_NOTES['D4-NOTE'], feedback: CARDS.periodic.feedback };
  }, action);
  expect(result.cards).toContain('periodic');
  expect(result.lesson.queue.find(q => q.card === 'periodic')).toBeTruthy();
  expect(result.lesson.queue[0].text).toBe(result.note);
  expect(result.note).toContain('세로 열'); expect(result.note).toContain('가로 행');
  expect(result.exam.notes).toContain('D4-NOTE');
  expect(Object.keys(result.exam.period.met).sort()).toEqual(['C', 'H']);
  await load(page, result.lesson);
  while (!await page.locator('.learning-area [data-card="periodic"]').count()) await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  const diagram = await page.locator('.learning-area .periodic-grid').textContent();
  expect(diagram).toContain('족 ↓ 세로 열'); expect(diagram).toContain('주기 → 가로 행');
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  await expect(page.locator('.dialogue-text')).toHaveText(result.feedback);
  const before = await save(page);
  await page.getByRole('button', { name: '핵심 노트', exact: true }).click();
  expect(await page.locator('.panel .periodic-grid').textContent()).toBe(diagram);
  await expect(page.locator('.panel')).toContainText(result.note);
  expect(await save(page)).toEqual(before);
  // A pre-extension slot at the exam only stores received note IDs, not new cards.
  const old = structuredClone(result.exam); delete old.mid;
  await load(page, old);
  await page.getByRole('button', { name: '핵심 노트', exact: true }).click();
  expect(await page.locator('.panel .periodic-grid').textContent()).toBe(diagram);
  await expect(page.locator('.panel')).toContainText(result.note);
  expect(scores(await save(page))).toEqual(scores(old));
});

for (const [scene, rudeChoice, event] of [['B-04-talk', 1, 'takeover'], ['C-05', 2, 'dismiss']]) {
  test(`${scene} 무례 직후 즉시 일관성: 다음 대사 전·저장·복원·중복 클릭`, async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async ({ scene, rudeChoice }) => {
      const e = await import('/src/engine.js');
      const s = e.fresh('즉시검증'); s.day = 2; s.period.person = 'NA';
      s.period.met.NA = true; s.events.naMet = true; s.affinity['나트륨'] = 10;
      e.enter(s, scene); while (s.index < s.queue.length) e.advance(s);
      const before = structuredClone(s); const o = e.options(s)[rudeChoice]; o.run();
      const immediate = structuredClone(s); o.run(); const repeated = structuredClone(s);
      return { before, immediate, repeated, restored: e.decodeSave(JSON.stringify(s)) };
    }, { scene, rudeChoice });
    expect(result.immediate.events[event]).toBe(true);
    expect(result.immediate.mid.sodium.status).toBe('unresolved');
    expect(result.immediate.index).toBe(0);
    expect(result.immediate.affinity['나트륨']).toBe(6);
    expect(result.immediate.applied[scene]).toEqual({ who: '나트륨', requested: -4, actual: -4 });
    expect(result.immediate.choices[scene]).toBe(rudeChoice);
    expect(result.repeated).toEqual(result.immediate);
    expect(result.restored.mid.sodium).toEqual(result.immediate.mid.sodium);
    expect(scores(result.restored)).toEqual(scores(result.immediate));
    await load(page, result.before); await page.locator('.choices button').nth(rudeChoice).click();
    const immediate = await save(page); // no next dialogue or reload before this save
    expect(immediate.mid.sodium).toEqual(result.immediate.mid.sodium);
    expect(immediate.index).toBe(0);
    await page.getByRole('button', { name: '기록', exact: true }).click();
    await expect(page.locator('.panel')).toContainText('미해결');
    expect(await save(page)).toEqual(immediate);
    await page.reload(); await page.getByRole('button', { name: '불러오기', exact: true }).click();
    expect(await save(page)).toEqual(immediate);
    await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
    const after = await save(page);
    expect(after.mid.sodium).toEqual(immediate.mid.sodium); expect(scores(after)).toEqual(scores(immediate));
  });
}

test('정중한 선택은 clear 유지, 기존 watching·resolved와 과거 무례·보상은 보존', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const e = await import('/src/engine.js'); const { initMid } = await import('/src/chronology.js'); const rows = [];
    for (const scene of ['B-04-talk', 'C-05']) {
      const s = e.fresh('정상'); s.day = 2; s.period.person = 'NA'; e.enter(s, scene);
      while (s.index < s.queue.length) e.advance(s);
      e.options(s)[scene === 'B-04-talk' ? 0 : 1].run();
      rows.push({ clear: s.mid.sodium.status, restored: e.decodeSave(JSON.stringify(s)).mid.sodium.status });
    }
    for (const status of ['watching', 'resolved']) {
      const s = e.fresh('회복'); s.day = 15; s.events.takeover = true; s.events.dismiss = true;
      s.mid.sodium = { status, startedDay: 11, resolvedDay: status === 'resolved' ? 13 : null };
      s.applied['MID:repair:NA'] = { who: '나트륨', requested: 4, actual: 4 };
      s.affinity['나트륨'] = 20; const before = structuredClone(s);
      initMid(s); rows.push({ before, after: e.decodeSave(JSON.stringify(s)) });
    }
    return rows;
  });
  expect(results.slice(0, 2)).toEqual([{ clear: 'clear', restored: 'clear' }, { clear: 'clear', restored: 'clear' }]);
  for (const r of results.slice(2)) {
    expect(r.after.mid.sodium).toEqual(r.before.mid.sodium); expect(r.after.events).toEqual(r.before.events);
    expect(scores(r.after)).toEqual(scores(r.before));
  }
});
