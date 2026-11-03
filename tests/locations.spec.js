import { test, expect } from '@playwright/test';

const KEY = 'love-chemistry.prototype.v1';
async function drain(page) {
  for (let n = 0; n < 50 && await page.getByRole('button', { name: '다음 ▸', exact: true }).count(); n++) {
    await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  }
}
async function readState(page) {
  await page.getByRole('button', { name: '저장', exact: true }).click();
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
}
async function load(page, state) {
  await page.evaluate(([key, state]) => localStorage.setItem(key, JSON.stringify(state)), [KEY, state]);
  await page.reload(); await page.getByRole('button', { name: '불러오기', exact: true }).click(); await drain(page);
}
function experience(s) {
  return { events: s.events, met: s.period.met, invite: s.period.invite, promises: s.period.promises, affinity: s.affinity };
}

for (let day = 1; day <= 10; day++) test(`${day}일차 점심: 원본 배치 표시·도착 후 일치·미만남 기록 및 저장 보존`, async ({ page }) => {
  test.setTimeout(60000); await page.goto('/');
  const { state, places, schedule, names } = await page.evaluate(async day => {
    const { fresh, enter } = await import('/src/engine.js');
    const { PLACES, SCHEDULE, PEOPLE } = await import('/src/period.js');
    const s = fresh('위치검증'); s.day = day;
    s.events.hMet = true; if (day >= 2) s.events.carbonMet = true;
    enter(s, day === 1 ? 'A-04' : day === 2 ? 'B-04' : 'LUNCH-SELECT');
    return { state: s, places: PLACES, schedule: SCHEDULE[day], names: PEOPLE };
  }, day);
  await load(page, state);
  const expectedLabels = places.map(place => `${place} · ${schedule[place]?.length ? schedule[place].map(c => names[c]).join(', ') : '만날 인물 없음'}`);
  expect(await page.locator('.choices button').allTextContents()).toEqual(expectedLabels.map((text, i) => `${String(i + 1).padStart(2, '0')}  ${text}`));
  await expect(page.locator('.affinity')).toHaveCount(0);
  let before = await readState(page); expect(experience(before)).toEqual(experience(state));
  expect(before.choices).toEqual(state.choices); expect(before.applied).toEqual(state.applied);
  await load(page, before); const roundTrip = await readState(page); expect(roundTrip).toEqual(before);
  for (const [i, place] of places.entries()) {
    await load(page, before); await page.locator('.choices button').nth(i).click(); await drain(page);
    const arrived = await readState(page);
    expect(arrived.place).toBe(place); expect(experience(arrived)).toEqual(experience(before));
    expect(day <= 2 ? arrived.choices[`${day === 1 ? 'A' : 'B'}-04:place`] : arrived.choices[`DAY-${day}:LUNCH:place`]).toBe(place);
    for (const [personIndex, code] of (schedule[place] || []).entries()) {
      await load(page, arrived); await page.locator('.choices button').first().click();
      if (day === 10 && schedule[place].length > 1) {
        await drain(page);
        expect(await page.locator('.choices button').allTextContents()).toEqual(schedule[place].map((c, i) => `${String(i + 1).padStart(2, '0')}  ${names[c]}`));
        await expect(page.locator('.affinity')).toHaveCount(0);
        await page.locator('.choices button').nth(personIndex).click();
      }
      await expect(page.locator('.character-name')).toHaveText(names[code]);
      await expect(page.locator('.affinity meter')).toHaveCount(1);
      await expect(page.getByRole('meter', { name: `${names[code]} 호감도`, exact: true })).toHaveCount(1);
    }
    if (!schedule[place]?.length) for (const action of [1, 2]) {
      await load(page, arrived); await expect(page.locator('.choices button').nth(action)).toBeEnabled();
      await page.locator('.choices button').nth(action).click();
      const after = await readState(page); expect(experience(after)).toEqual(experience(before));
      await expect(page.locator('.affinity')).toHaveCount(0);
    }
  }
});

test('알 수 없는 이름도 원소명으로 표시하되 3일차 만남·동행을 미리 만들지 않는다', async ({ page }) => {
  await page.goto('/');
  const before = await page.evaluate(async () => {
    const { fresh, enter } = await import('/src/engine.js');
    const s = fresh('미소개검증'); enter(s, 'D3-AM'); return s;
  });
  await load(page, before); // 아침·수업·쉬는 시간의 전언까지만 읽기
  await page.locator('.choices button').first().click(); await drain(page);
  await expect(page.locator('.choices')).toContainText('복도 · 마그네슘');
  await expect(page.locator('.choices')).toContainText('도서관 · 염소');
  await expect(page.locator('.choices')).toContainText('운동장 · 만날 인물 없음');
  const selected = await readState(page);
  expect(selected.period.met.MG).toBeUndefined(); expect(selected.period.met.CL).toBeUndefined();
  expect(selected.period.invite).toBeNull(); expect(selected.affinity).toEqual(before.affinity);
  await expect(page.locator('.affinity')).toHaveCount(0);
});
