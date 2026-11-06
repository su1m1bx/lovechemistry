import { test, expect } from '@playwright/test';
import { menuAction } from './ui-driver.js';
const KEY = 'love-chemistry.prototype.v1';

for (const [scene, code, index, meaning] of [['RE-C', 'C', 1, 'C-READABILITY'], ['LAB-MG', 'MG', 2, 'MG-OBSERVE-NOTES']]) {
  test(`${scene}: 새 선택의 버전·0점·기록·응답·회상·복원`, async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async ({ scene, code, index }) => {
      const e = await import('/src/engine.js'); const { PEOPLE } = await import('/src/period.js');
      const zero = e.fresh('초기0'); zero.day = 5; zero.period.person = code; zero.period.met[code] = true;
      e.enter(zero, scene); while (zero.index < zero.queue.length) e.advance(zero);
      e.options(zero)[index].run(); const zeroApplied = structuredClone(zero.applied[zero.eventId + ':relation']);
      let s = e.fresh('새선택'); s.day = 5; s.period.person = code; s.period.met[code] = true; s.affinity[PEOPLE[code]] = 12;
      e.enter(s, scene); while (s.index < s.queue.length) e.advance(s);
      const before = structuredClone(s); s = e.decodeSave(JSON.stringify(s));
      const option = e.options(s)[index]; const label = option.label; option.run(); const selected = structuredClone(s); option.run();
      const repeated = structuredClone(s); s = e.decodeSave(JSON.stringify(s)); const restored = structuredClone(s);
      while (s.index < s.queue.length) e.advance(s);
      if (code === 'C') { s.period.person = code; e.enter(s, 'LAB-C'); }
      const intro = s.queue.map(q => q.text);
      s.day = 14; s.period.person = code; s.mid.personal[code] = 5; e.enter(s, `MID-PLAY-${code}`);
      while (s.index < s.queue.length) e.advance(s); e.options(s)[0].run();
      return { before, label, selected, restored, repeated, intro, recall: s.queue.map(q => q.text), person: PEOPLE[code], zeroApplied };
    }, { scene, code, index });
    const key = result.before.eventId;
    expect(result.before.choiceContent[key].contentVersion).toBe('choices-2026-11-05');
    expect(result.before.choiceContent[key].meanings[index]).toBe(meaning);
    expect(result.selected.choiceMeanings[key]).toEqual({ contentVersion: 'choices-2026-11-05', meaning });
    expect(result.selected.applied[key + ':relation']).toMatchObject({ requested: 0, actual: 0 });
    expect(result.zeroApplied).toMatchObject({ requested: 0, actual: 0 });
    expect(result.selected.affinity[result.person]).toBe(12);
    expect(result.selected.period.history.at(-1).text).toBe(result.label);
    expect(result.repeated).toEqual(result.selected); expect(result.restored).toEqual(result.selected);
    expect(result.recall.join('\n')).toContain(code === 'C' ? '게시물에선 큰 제목을 골랐지' : '그땐 바뀐 데 적었지');
    if (code === 'C') expect(result.intro.join('\n')).toContain('큰 제목 쪽에 한 표였지');
    else {
      expect(result.selected.queue.map(q => q.text)).toContain('종이를 펴 바뀐 곳을 손가락으로 짚는다.');
      expect(result.selected.period.promises.mgAttempt).not.toBe(true);
      expect(result.selected.snaps['SNAP-MG']).toBeUndefined();
    }
    await page.evaluate(([key, s]) => localStorage.setItem(key, JSON.stringify(s)), [KEY, result.before]);
    await page.getByRole('button', { name: '불러오기', exact: true }).click();
    await page.locator('.choices button').nth(index).click();
    await menuAction(page, '기록'); await expect(page.locator('.panel')).toContainText(result.label);
  });

  for (const initial of [0, 12]) test(`${scene}: 구형 진행 중 큐·선택·감점 ${initial} 보존, 새 진입만 개작`, async ({ page }) => {
    await page.goto('/');
    const r = await page.evaluate(async ({ scene, code, index, initial }) => {
      const e = await import('/src/engine.js'); const { PEOPLE } = await import('/src/period.js');
      const original = e.fresh('구형'); original.day = 5; original.period.person = code; original.period.met[code] = true;
      original.affinity[PEOPLE[code]] = initial; e.enter(original, scene);
      delete original.choiceContent; delete original.choiceMeanings; delete original.exam2;
      // The stored old introduction is authoritative, including an unfinished cursor.
      original.queue = [{ who: PEOPLE[code], text: '이전 저장에 들어 있던 대사' }]; original.index = 0;
      let s = e.decodeSave(JSON.stringify(original)); const atLoad = structuredClone(s);
      while (s.index < s.queue.length) e.advance(s);
      const label = e.options(s)[index].label; e.options(s)[index].run(); const selected = structuredClone(s);
      delete s.choiceContent; delete s.choiceMeanings;
      s = e.decodeSave(JSON.stringify(s)); const restored = structuredClone(s);
      while (s.index < s.queue.length) e.advance(s);
      s.day = 14; s.period.person = code; e.enter(s, `MID-PLAY-${code}`); while (s.index < s.queue.length) e.advance(s); e.options(s)[0].run();
      const recall = s.queue.map(q => q.text);
      s.day = 9; s.period.person = code; e.enter(s, scene); while (s.index < s.queue.length) e.advance(s);
      return { original, atLoad, selected, restored, label, recall, next: s.choiceContent[s.eventId], person: PEOPLE[code] };
    }, { scene, code, index, initial });
    expect(r.atLoad.queue).toEqual(r.original.queue); expect(r.atLoad.index).toBe(0);
    expect(r.label).toContain(code === 'C' ? '한 장만 남겨야' : '완벽한 설명서');
    expect(r.selected.affinity[r.person]).toBe(Math.max(0, initial - 3));
    expect(r.selected.applied[r.original.eventId + ':relation']).toMatchObject({ requested: -3, actual: Math.max(0, initial - 3) - initial });
    expect(r.restored).toEqual(r.selected);
    expect(r.recall.join('\n')).toContain(code === 'C' ? '집중할 건 하나여도' : '설명서는 덜 됐지만');
    expect(r.next.contentVersion).toBe('choices-2026-11-05');
  });
}

test('옛 숫자·carbonFocus만으로 새 의미를 추론하거나 과거 감점을 환급하지 않음', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(async () => {
    const e = await import('/src/engine.js'); const s = e.fresh('옛기록');
    s.choices['DAY-5:RE-C:C'] = 1; s.choices['DAY-6:LAB-MG:MG'] = 2;
    s.applied['DAY-5:RE-C:C:relation'] = { who: '탄소', requested: -3, actual: 0 };
    s.applied['DAY-6:LAB-MG:MG:relation'] = { who: '마그네슘', requested: -3, actual: -3 };
    s.period.promises.carbonFocus = true; delete s.choiceContent; delete s.choiceMeanings;
    const old = structuredClone(s); const fixed = e.decodeSave(JSON.stringify(s));
    fixed.day = 14; fixed.period.person = 'C'; e.enter(fixed, 'LAB-C'); const intro = fixed.queue.map(q => q.text);
    const recall = [];
    for (const c of ['C', 'MG']) { fixed.period.person = c; e.enter(fixed, `MID-PLAY-${c}`); while (fixed.index < fixed.queue.length) e.advance(fixed); e.options(fixed)[0].run(); recall.push(...fixed.queue.map(q => q.text)); }
    return { old, meanings: fixed.choiceMeanings, applied: fixed.applied, intro, recall };
  });
  expect(r.meanings['DAY-5:RE-C:C']).toEqual({ contentVersion: 'legacy', meaning: 'legacy' });
  expect(r.meanings['DAY-6:LAB-MG:MG']).toEqual({ contentVersion: 'legacy', meaning: 'legacy' });
  expect(r.intro).toContain('게시할 건 이쪽, 내가 보관할 건 저쪽.');
  expect(r.recall).toContain('이 종이는 내가 여기 넣어 둘게.'); expect(r.recall).toContain('오늘 네 소리는 들었어.');
  for (const [k, v] of Object.entries(r.old.applied)) expect(r.applied[k]).toEqual(v);
});
