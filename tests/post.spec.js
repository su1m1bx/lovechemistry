import { test, expect } from '@playwright/test';

for (const code of ['H', 'HE', 'C', 'NA', 'MG', 'CA', 'CL']) test(`21~25 먼저 연결 ${code}: 20일 인계·공통일과·R/P/Q/B/J·매 줄 복원`, async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async code => {
    const { day20, PostRun, postFocus } = await import('/tests/post-driver.js');
    const before = day20(code); const snapshot = structuredClone(before); const run = new PostRun(before, { getRandomValues: a => a.fill(0) });
    run.until('D25-RECESS', postFocus(code)); run.until('LATE-CLOSE', postFocus(code)); run.restore();
    return { s: run.s, before: snapshot, visited: run.visited, snaps: run.snaps.map(s => s.id) };
  }, code);
  expect(r.s.day).toBe(25); expect(r.s.exam2).toEqual(r.before.exam2); expect(r.s.exam).toEqual(r.before.exam); expect(r.s.notes).toEqual(r.before.notes);
  expect(r.visited).toContain('21:D21-AM'); expect(r.visited).toContain('25:D25-NOTE');
  expect(r.s.late.complete[`${code}:R`]).toBe(['MG', 'CA', 'CL'].includes(code) ? 22 : code === 'HE' ? 23 : 21);
  expect(r.s.late.complete[`${code}:B`]).toBe(['MG', 'CA', 'CL'].includes(code) ? 24 : 23);
  if (code !== 'HE') expect(r.snaps).toContain(`SNAP-B-${code}`);
});

for (const code of ['H', 'HE', 'C', 'NA', 'MG', 'CA', 'CL']) test(`26~30 ${code}: 정상 행동 공략·80 도달·방학식·해당 결말(HE 수락 분기 고정)`, async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async code => {
    const { day20, PostRun, postFocus } = await import('/tests/post-driver.js'); const { PEOPLE } = await import('/src/period.js'); const e = await import('/src/engine.js');
    const run = new PostRun(day20(code), code === 'HE' ? { getRandomValues: a => a.fill(0) } : null); const before = structuredClone(run.s);
    run.until('END-FINISH', postFocus(code)); run.restore();
    return { s: run.s, before, score: run.s.affinity[PEOPLE[code]], snaps: run.snaps.map(s => s.id), visited: run.visited, options: e.options(run.s).map(o => o.label) };
  }, code);
  expect(r.s).toMatchObject({ day: 30, scene: 'END-FINISH', ending: { candidates: [code], selected: code, completed: true } });
  expect(r.score).toBeGreaterThanOrEqual(80); expect(r.snaps).toContain(`SNAP-END-${code}`);
  expect(r.s.exam2).toEqual(r.before.exam2); expect(r.s.exam).toEqual(r.before.exam); expect(r.s.notes).toEqual(r.before.notes);
  expect(r.visited).toContain('30:D30-CEREMONY'); expect(r.visited.some(v => /D30-NOTE|EX3|31:/.test(v))).toBe(false);
  expect(r.options).toEqual(['결말 화면에 머물기', '시작 화면으로']);
});

test('후반 모든 본문/선택/동의/부분 응답 컴파일, 미정D 비노출·과거 미경험 회상·개인 원문 선노출 금지', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const { day20 } = await import('/tests/post-driver.js'); const { postContent } = await import('/src/post-content.js'); const { LATE_EVENTS } = await import('/src/late-state.js');
    const s = day20('H'); s.day = 29; const missing = []; let choices = 0;
    const source = (await import('/docs/story.md?raw')).default;
    for (const [c, events] of Object.entries(LATE_EVENTS)) for (const event of Object.keys(events)) {
      const content = postContent(s, c, event);
      for (const line of [...content.intro, ...(content.read || []), ...content.choices.flatMap(c => c.lines)]) {
        if (typeof line.who !== 'string' || typeof line.text !== 'string') missing.push({ c, event, line });
        if (/주 완료|부분4|주8|SNAP-|미완료false|→/.test(line.text)) missing.push({ c, event, production: line.text });
        const original = line.text?.replace('같이 노는 날엔', '선배랑 있으면'); // Explicit W shallow-experience replacement in the source.
        if (line.kind === 'dialogue' && !source.includes(original) && !line.text.includes('\n')) missing.push({ c, event, spoken: line.text });
      }
      if (c === 'CL' && ['R', 'B', 'J', 'K', 'T'].includes(event) && !content.consent) missing.push({ c, event, consent: false });
      choices += content.choices.length;
    }
    return { missing, choices, d: Object.hasOwn(LATE_EVENTS.HE, 'D') };
  });
  expect(r.missing).toEqual([]); expect(r.choices).toBeGreaterThan(140); expect(r.d).toBe(false);
});
