import { test, expect } from '@playwright/test';

const KEY = 'love-chemistry.prototype.v1';
async function drain(page) {
  for (let n = 0; n < 80 && await page.getByRole('button', { name: '다음 ▸', exact: true }).count(); n++) {
    await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  }
}
async function pick(page, i) {
  await drain(page); await page.locator('.choices button').nth(i).click(); await drain(page);
}
async function save(page) {
  await page.getByRole('button', { name: '저장', exact: true }).click();
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
}
async function restore(page) {
  const before = await save(page); await page.reload();
  await page.getByRole('button', { name: '불러오기', exact: true }).click();
  expect(await save(page)).toEqual(before); return before;
}
async function seed(page, scene, { code = null, day = 2, promises = {} } = {}) {
  await page.goto('/');
  const state = await page.evaluate(async ({ scene, code, day, promises }) => {
    const { fresh, enter } = await import('/src/engine.js');
    const { MET_EVENTS } = await import('/src/period.js');
    const s = fresh('표시검증'); s.day = day; s.period.person = code; s.period.promises = promises;
    if (code) { s.period.met[code] = true; s.events[MET_EVENTS[code]] = true; }
    enter(s, scene); return s;
  }, { scene, code, day, promises });
  await page.evaluate(([key, state]) => localStorage.setItem(key, JSON.stringify(state)), [KEY, state]);
  await page.getByRole('button', { name: '불러오기', exact: true }).click();
}
async function actualDay2(page, place) {
  await page.goto('/'); await page.getByRole('button', { name: '새 게임', exact: true }).click();
  await page.getByLabel('학교에서 불릴 이름').fill('재현'); await page.getByRole('button', { name: '등교하기', exact: true }).click();
  for (const i of [0, 0, 0, 2, 2, 0, 0, 0, 0, place, 0, 0]) await pick(page, i);
}

test('2일차 옥상 첫 의견 응답은 장면이 아니라 헬륨의 대사', async ({ page }) => {
  await actualDay2(page, 0); await expect(page.locator('.scene-id')).toHaveText('RE-HE');
  await page.locator('.choices button').first().click();
  await expect(page.locator('.speaker')).toHaveText('헬륨');
  await expect(page.locator('.dialogue-text')).toHaveText('좋아. 바꾸고 싶은 곳과 남길 곳이 분명하네.');
});

test('칼슘 대화와 한 판: 화자·행동·제작 설명을 분리', async ({ page }) => {
  await actualDay2(page, 4);
  await page.locator('.choices button').first().click();
  await expect(page.locator('.speaker')).toHaveText('칼슘');
  await expect(page.locator('.dialogue-text')).toHaveText('좋아요. 끝나고 재경기하고 싶어도 먼저 물을게요.');
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  await expect(page.locator('.speaker')).toHaveText('장면');
  await expect(page.locator('.dialogue-text')).toHaveText('목록 한 줄을 함께 확인하고 짧게 종이 승부를 해 본다.');
  await drain(page); await pick(page, 1);
  await expect(page.locator('.scene-id')).toHaveText('LAB-CA');
  await page.locator('.choices button').first().click();
  const observed = [];
  while (!await page.locator('.snap').count()) {
    observed.push({ who: await page.locator('.speaker').textContent(), text: await page.locator('.dialogue-text').textContent() });
    await expect(page.locator('.dialogue-text')).not.toContainText(/이 대본|조건|SNAP|기록한다/);
    await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  }
  expect(observed).toContainEqual({ who: '장면', text: '칼슘이 마지막 수를 놓쳐 진다.' });
  expect(observed).toContainEqual({ who: '칼슘', text: '한 번만 더… 아니, 한 판이었죠. 이건 다음에 생각할래요.' });
  expect(observed).toContainEqual({ who: '재현', text: '응. 오늘 수는 여기 남겨 두자.' });
});

test('나트륨 일정은 해당 대사 표시 전에는 없고 표시 직후부터 저장·복원', async ({ page }) => {
  await seed(page, 'B-04-talk', { code: 'NA' }); await drain(page);
  await page.locator('.choices button').first().click();
  let s = await restore(page); expect(Boolean(s.events.naSchedule)).toBe(false);
  await page.getByRole('button', { name: '기록', exact: true }).click();
  await expect(page.locator('.panel')).not.toContainText('학교 시뮬레이터를 사용할 일정을 들었다.');
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  await expect(page.locator('.dialogue-text')).toContainText('저는 방과후 과학실의 학교 시뮬레이터를 쓸 거예요.');
  s = await restore(page); expect(s.events.naSchedule).toBe(true);
  await drain(page);
  await expect(page.locator('.choices')).toContainText('과학실 데이트·나트륨');
});

test('시험 답 선택 즉시 응답 수만 갱신하고 답·초점·저장을 보존', async ({ page }) => {
  await seed(page, 'EX-PAPER', { day: 10 });
  await page.getByRole('radio').first().check();
  await expect(page.locator('.exam')).toContainText('1/10문항 응답');
  await expect(page.getByRole('radio').first()).toBeFocused();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).exam.answers[0], KEY)).toBeNull();
  await page.getByRole('radio').nth(2).check();
  await expect(page.locator('.exam')).toContainText('1/10문항 응답');
  await expect(page.getByRole('radio').nth(2)).toBeFocused();
  const s = await restore(page); expect(s.exam.index).toBe(0); expect(s.exam.answers[0]).toBe(2); expect(s.exam.submitted).toBe(false);
  await page.getByRole('button', { name: '다음 문항', exact: true }).click();
  await page.getByRole('radio').nth(1).check();
  await expect(page.locator('.exam')).toContainText('2/10문항 응답');
});

test('현재 헬륨만 호감도와 관계 단계를 표시', async ({ page }) => {
  await seed(page, 'RE-HE', { code: 'HE' });
  await expect(page.locator('.affinity')).toContainText('헬륨');
  await expect(page.locator('.affinity')).toContainText('기본');
  await expect(page.locator('.affinity')).not.toContainText('수소');
  await expect(page.locator('.affinity')).not.toContainText('나트륨');
});

for (const [code, name] of Object.entries({ H: '수소', HE: '헬륨', C: '탄소', NA: '나트륨', MG: '마그네슘', CA: '칼슘', CL: '염소' })) {
  test(`${name}의 모든 RE·LAB 응답: 대사별 화자, 행동 보존, 현재 호감도와 스냅 복원`, async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    const cases = await page.evaluate(async code => {
      const { mainRows, quotes } = await import('/src/period.js');
      return ['RE-', 'LAB-'].flatMap(prefix => mainRows(prefix + code).map((row, i) => ({
        scene: prefix + code === 'LAB-CL' && i < 2 ? 'LAB-CL-read' : prefix + code,
        i: prefix + code === 'LAB-CL' && i === 2 ? 1 : i,
        quotes: quotes(row[1]),
        lab: prefix === 'LAB-',
      })));
    }, code);
    for (const c of cases) {
      await seed(page, c.scene, { code, day: 5, promises: { clPrivate: true, caLunchStop: true } });
      await drain(page);
      await page.locator('.choices button').nth(c.i).click();
      const s = await save(page);
      const boundary = c.lab ? s.queue.findIndex(q => q.snap) : s.queue.findIndex(q => q.invite);
      const response = s.queue.slice(0, boundary < 0 ? s.queue.length - 1 : boundary);
      const spoken = response.filter(q => q.kind === 'dialogue');
      expect(spoken.map(q => q.text)).toEqual(c.quotes);
      for (const [i, q] of spoken.entries()) expect(q.who).toBe(c.scene === 'LAB-CA' && c.i === 0 && i === 1 ? '플레이어' : name);
      for (const q of response) {
        await expect(page.locator('.speaker')).toHaveText(q.who === '플레이어' ? '표시검증' : q.who);
        await expect(page.locator('.dialogue-text')).toHaveText(q.text);
        await expect(page.locator('.dialogue-text')).not.toContainText(/이 대본|확정하지 않는다|SNAP-|→|\*\*조건/);
        await expect(page.locator('.affinity meter')).toHaveCount(1);
        await expect(page.getByRole('meter', { name: `${name} 호감도`, exact: true })).toHaveCount(1);
        await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
      }
      if (boundary >= 0 && s.queue[boundary].snap) {
        await expect(page.locator('.snap')).toBeVisible();
        const atSnap = await restore(page);
        await expect(page.locator('.affinity')).toContainText(name);
        await page.getByRole('button', { name: '스냅 닫고 계속', exact: true }).click();
        const after = await restore(page);
        expect(after.affinity).toEqual(atSnap.affinity); expect(after.applied).toEqual(atSnap.applied);
        await expect(page.locator('.speaker')).toHaveText(name);
      }
    }
  });
}

test('등장 상태: 두 명·언급만 한 이름·선택 전·혼자·시험·불러오기', async ({ page }) => {
  await seed(page, 'D9-AM', { day: 9 });
  await expect(page.locator('.affinity meter')).toHaveCount(2);
  await expect(page.locator('.affinity')).toContainText('수소'); await expect(page.locator('.affinity')).toContainText('탄소');
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  await expect(page.locator('.speaker')).toHaveText('수소'); await expect(page.locator('.affinity meter')).toHaveCount(2);
  await restore(page); await expect(page.locator('.affinity meter')).toHaveCount(2);
  await seed(page, 'D9-NOTE', { day: 9 });
  await expect(page.locator('.speaker')).toHaveText('수업 핵심 노트');
  await expect(page.locator('.affinity meter')).toHaveCount(2);
  await seed(page, 'B-01'); await drain(page);
  await expect(page.locator('.affinity meter')).toHaveCount(1); await expect(page.locator('.affinity')).toContainText('수소');
  await expect(page.locator('.affinity')).not.toContainText('나트륨'); await expect(page.locator('.affinity')).not.toContainText('칼슘');
  for (const scene of ['B-04', 'LUNCH-SELECT', 'LUNCH-ACTION', 'EX-PAPER', 'DAY11-HANDOFF']) {
    await seed(page, scene, { day: scene === 'EX-PAPER' || scene === 'DAY11-HANDOFF' ? 10 : 3 });
    await expect(page.locator('.affinity')).toHaveCount(0);
    await restore(page); await expect(page.locator('.affinity')).toHaveCount(0);
  }
  await seed(page, 'EX-PAPER', { day: 10 });
  await page.getByRole('button', { name: '답안 제출', exact: true }).click();
  await expect(page.locator('.affinity')).toHaveCount(0);
  await restore(page); await expect(page.locator('.affinity')).toHaveCount(0);
  await seed(page, 'A-05', { day: 1 }); await drain(page);
  await expect(page.locator('.affinity')).toContainText('수소');
  await page.locator('.choices button').first().click();
  await expect(page.locator('.affinity')).toContainText('수소');
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  await expect(page.locator('.speaker')).toHaveText('장면'); await expect(page.locator('.affinity')).toHaveCount(0);
});

test('기존 v2 응답 큐와 조기 일정 기록을 불러와도 점수·분기 재실행 없이 표시 교정', async ({ page }) => {
  await page.goto('/');
  const old = await page.evaluate(async () => {
    const { fresh, enter, advance, options } = await import('/src/engine.js');
    const { mainRows } = await import('/src/period.js');
    const s = fresh('이전표시'); s.day = 2; s.period.person = 'CA'; enter(s, 'RE-CA');
    while (s.index < s.queue.length) advance(s); options(s)[0].run();
    s.queue = [{ who: '장면', text: mainRows('RE-CA')[0][1] }, s.queue.at(-1)]; s.index = 0;
    return s;
  });
  await page.evaluate(([key, old]) => localStorage.setItem(key, JSON.stringify(old)), [KEY, old]);
  await page.getByRole('button', { name: '불러오기', exact: true }).click();
  await expect(page.locator('.speaker')).toHaveText('칼슘');
  const fixed = await save(page); expect(fixed.affinity).toEqual(old.affinity); expect(fixed.applied).toEqual(old.applied); expect(fixed.choices).toEqual(old.choices); expect(fixed.after).toBe(old.after);
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click(); await expect(page.locator('.speaker')).toHaveText('장면');
  await restore(page); await expect(page.locator('.speaker')).toHaveText('장면');
  await seed(page, 'B-04-talk', { code: 'NA' }); await drain(page); await page.locator('.choices button').first().click();
  const schedule = await save(page); schedule.events.naSchedule = true; delete schedule.queue.at(-1).displayEvent;
  await page.evaluate(([key, s]) => localStorage.setItem(key, JSON.stringify(s)), [KEY, schedule]);
  await page.reload(); await page.getByRole('button', { name: '불러오기', exact: true }).click();
  expect(Boolean((await save(page)).events.naSchedule)).toBe(false);
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click();
  expect((await save(page)).events.naSchedule).toBe(true);
});
