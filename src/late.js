import { PEOPLE, PLACES, lunchPeople, lunchPlaceLabel, say, stage } from './period.js';
import { INTRO } from './mid-content.js';
import { uncomfortable } from './chronology.js';
import { lessonCards } from './learning.js';
import { LATE_EVENTS, initLate, lateDay, lateKey, lateSceneId, lateEventScene, availableLate } from './late-state.js';
import { LATE_NAMES, LATE_NOTICES, LATE_GOODBYE, INVITATIONS, lateInvitation, lateContent, SNAP_FOLLOW } from './late-content.js';

export { lateSceneId };
const p = text => say('플레이어', text);
const d = (c, text) => say(PEOPLE[c], text);
const system = text => ({ who: '학교 안내', text, kind: 'narration' });
const eventScene = lateEventScene;
const end = slot => slot === 'lunch' ? 'LATE-LUNCH-END' : 'LATE-CLOSE';
export function lateScene(s, id, api) {
  if (!lateSceneId(id)) return false;
  if (s.day === 20 && id.startsWith('LATE-') && !s.exam2.returned) throw new Error('둘째 시험의 결과 확인 뒤 점심으로 돌아갈 수 있습니다.');
  initLate(s); const m = s.late; const c = s.period.person;
  s.scene = id; s.cast = []; let q = []; let after = null;
  if (/^D(1[6-9]|20)-AM$/.test(id)) {
    s.day = Number(id.match(/\d+/)[0]); s.time = '아침'; s.location = '교실'; s.place = '';
    s.period.person = null; s.period.invite = null; m.context = null; lateDay(s);
    q = s.day === 20 ? [] : [system(LATE_NOTICES[s.day])];
    after = s.day === 20 ? 'EX2-START' : `D${s.day}-NOTE`;
  } else if (/^D1[6-9]-RECESS$/.test(id)) {
    s.time = '쉬는 시간'; s.location = '교실';
    // The source has no authored recess dialogue. Show the real shared roster,
    // not an invented encounter, reward, or invitation.
    q = [system(PLACES.map(place => lunchPlaceLabel(s.day, place)).join('\n'))];
  } else if (id === 'LATE-LUNCH') {
    s.time = '점심 · 급식 뒤'; s.location = '장소 선택'; s.period.person = null; m.context = null;
  } else if (id === 'LATE-ACTION' || id === 'LATE-PERSON') { s.location = s.place; }
  else if (id === 'LATE-INTRO') {
    s.cast = [c]; q = structuredClone(INTRO[c]); q.at(-1).met = c;
    q.push(p(['HE', 'MG'].includes(c) ? '지금 보고 계신 건 뭐예요?' : '지금은 무슨 얘기 중이었어?'));
    after = 'LATE-EVENTS';
  } else if (['LATE-EVENTS', 'LATE-LUNCH-END'].includes(id)) { s.cast = [c]; }
  else if (id === 'LATE-AF-SELECT') { s.time = '방과후'; s.location = '교실 앞'; m.context = null; }
  else if (id === 'LATE-NOTE') {
    q = [{ who: '받은 핵심 노트', text: api.notes[m.readingNote], kind: 'narration' }, ...lessonCards(m.readingNote)]; after = 'LATE-STUDY';
  } else if (id === 'LATE-STUDY' || id === 'LATE-REST') { /* Authored solo close; no filler scene. */ }
  else if (id === 'LATE-CLOSE') {
    s.time = '귀가'; s.location = '학교 앞'; const together = lateDay(s).together;
    s.cast = together ? [together] : [];
    q = together ? [d(together, LATE_GOODBYE[together]), p(['HE', 'MG'].includes(together) ? '네. 조심히 가세요' : '응. 조심히 가')] : [p('가방을 메고 교문으로 향했다')];
    m.context = null;
  } else if (id === 'DAY20-HANDOFF') {
    s.day = 20; s.time = '개발 인계'; s.location = '20일차 완료'; s.period.invite = null; m.context = null;
    q = [system('20일차 일과를 마쳤습니다. 현재 제공 범위는 여기까지입니다. 이 위치에서 진행을 저장할 수 있습니다.')];
  } else if (id === 'LATE-HE-SOLO') { s.cast = []; }
  else if (id === 'LATE-HE-REQUEST') {
    // Result queues are built by the transactional request coordinator.
    throw new Error('헬륨 요청은 예약된 결과로만 복원할 수 있습니다.');
  } else {
    const ctx = m.context;
    if (!ctx || ctx.code !== c || eventScene(c, ctx.event) !== id || ctx.day !== s.day) throw new Error('관계 사건의 진입 문맥이 없습니다.');
    const rule = LATE_EVENTS[c]?.[ctx.event];
    if (!rule || s.day < rule[0] || !rule[1].includes(ctx.slot) || lateDay(s).person !== c ||
      ctx.slot === 'afterSchool' && (s.period.actions[s.day]?.afterSchool !== c || !lateDay(s).confirmed || s.period.invite?.day !== s.day || s.period.invite.code !== c)) throw new Error('오늘 선택한 상대·슬롯의 사건이 아닙니다.');
    s.cast = [c]; s.time = ctx.slot === 'lunch' ? '점심 · 급식 뒤' : '방과후';
    if (m.complete[lateKey(c, ctx.event)]) q = [system('이미 마친 교류입니다. 오늘은 마칠 수 있습니다.')];
    else if (Object.hasOwn(s.choices, `LATE:${s.day}:${ctx.slot}:${c}:${ctx.event}:choice`)) q = [system('오늘 이미 선택한 교류입니다. 다음 유효한 날 다시 선택할 수 있습니다.')];
    else q = lateContent(s, c, ctx.event).intro;
  }
  s.eventId = `LATE:${s.day}:${id}:${c || 'PLAYER'}`;
  api.queue(s, q, after);
  // Empty, authored common phases still transition through the public API.
  if (!q.length && after) api.enter(s, after);
  return true;
}
export function lateOptions(s, api) {
  const id = s.scene; const m = s.late; const c = s.period.person;
  const opt = (label, action, extra = {}) => {
    const scene = s.scene; const eventId = s.eventId;
    return { label, disabled: false, ...extra, run: () => { if (s.scene === scene && s.eventId === eventId && s.index === s.queue.length) action(); } };
  };
  const once = (key, value, action) => { if (api.record(s, key, value)) action(); };
  const action = (slot, value, act) => once(`DAY-${s.day}:${slot === 'lunch' ? 'LUNCH' : 'AF'}:action`, value, () => {
    s.period.actions[s.day] = { ...(s.period.actions[s.day] || {}), [slot]: value }; act();
  });
  const visit = code => {
    s.period.person = code; lateDay(s).person = code;
    if (code === 'NA' && uncomfortable(s)) api.enter(s, s.mid.sodium.status === 'unresolved' ? 'MID-NA-REPAIR' : s.mid.sodium.startedDay < s.day ? 'MID-NA-CHECK' : 'LATE-LUNCH-END');
    else api.enter(s, s.period.met[code] ? 'LATE-EVENTS' : 'LATE-INTRO');
  };
  const begin = (event, slot) => {
    m.context = { code: c, event, slot, day: s.day };
    m.attempts[lateKey(c, event)] = s.day; lateDay(s).event = event;
    api.enter(s, eventScene(c, event));
  };
  const solo = () => [opt('혼자 노트 보기', () => action('afterSchool', '공부', () => api.queue(s, lessonCards(`D${s.day === 20 ? 19 : s.day}-NOTE`), 'LATE-CLOSE'))),
    opt('혼자 쉬기', () => action('afterSchool', '휴식', () => api.enter(s, 'LATE-CLOSE')))];
  if (id === 'DAY16-HANDOFF') return [opt('16일차로 이어가기', () => api.enter(s, 'D16-AM'))];
  if (/^D1[6-9]-RECESS$/.test(id)) return [opt('점심 장소 고르기', () => api.enter(s, 'LATE-LUNCH'))];
  if (id === 'LATE-LUNCH' || id === 'EX2-AFTER') return PLACES.map(place => opt(lunchPlaceLabel(s.day, place), () => {
    initLate(s); lateDay(s);
    once(`DAY-${s.day}:LUNCH:place`, place, () => { s.place = place; api.enter(s, 'LATE-ACTION'); });
  }, { place }));
  if (id === 'LATE-ACTION') return ['대화', '공부', '휴식'].map(value => opt(value, () => action('lunch', value, () => {
    const people = lunchPeople(s.day, s.place);
    if (value !== '대화') api.enter(s, value === '공부' ? 'LATE-STUDY' : 'LATE-REST');
    else if (people.length > 1) api.enter(s, 'LATE-PERSON'); else if (people.length) visit(people[0]); else api.enter(s, 'LATE-REST');
  })));
  if (id === 'LATE-PERSON') return lunchPeople(s.day, s.place).map(code => opt(PEOPLE[code], () => once(`DAY-${s.day}:LUNCH:person`, code, () => visit(code))));
  if (id === 'LATE-EVENTS') return [...availableLate(s, c, 'lunch').map(event => opt(`${PEOPLE[c]} · ${LATE_NAMES[c][event]}`, () => begin(event, 'lunch'))),
    opt('오늘은 초대 확인만 하기', () => api.enter(s, 'LATE-LUNCH-END'))];
  if (id === 'LATE-LUNCH-END') return [opt('방과후에도 이야기할까? — 오늘 가능성 확인', () => once(`LATE:${s.day}:invite`, c, () => {
    const [question, reply] = lateInvitation(s, c); const q = [p(question), d(c, reply)]; q.at(-1).invite = c;
    lateDay(s).confirmed = true; api.queue(s, q, 'LATE-AF-SELECT');
  })), opt('오늘은 여기까지', () => once(`LATE:${s.day}:invite`, false, () => api.queue(s, [d(c, INVITATIONS[c][2])], 'LATE-AF-SELECT')))];
  if (id === 'LATE-AF-SELECT') {
    if (s.period.actions[s.day]?.afterSchool) return [];
    const result = solo(); const day = lateDay(s);
    const code = day.confirmed && s.period.invite?.day === s.day && s.period.invite.code === day.person ? day.person : null;
    if (!code) return result;
    if (code === 'HE') return [opt('헬륨에게 방과후 함께할지 묻기', () => {}, { heliumRequest: true }), ...result];
    const events = availableLate(s, code, 'afterSchool');
    const consent = () => [p(code === 'MG' ? '아까 말씀하신 것, 지금 같이 해도 돼요?' : '아까 얘기한 것, 지금 같이 해도 돼?'), d(code, ['NA', 'CA'].includes(code) ? '네. 여기요' : '응. 이쪽이야')];
    const together = () => { s.period.person = code; day.together = code; s.location = code === 'H' ? '교실 앞 · 경내 길' : '과학실 · 교사 있는 자료 좌석'; };
    if (events.length) return [...events.map(event => opt(`${PEOPLE[code]} · ${LATE_NAMES[code][event]}`, () => action('afterSchool', code, () => {
      together(); m.context = { code, event, slot: 'afterSchool', day: s.day }; m.attempts[lateKey(code, event)] = s.day; day.event = event;
      api.queue(s, consent().map(q => ({ ...q, cast: [code] })), eventScene(code, event));
    }))), ...result];
    return [opt(`${PEOPLE[code]} · 각자 조용히 보기(0)`, () => action('afterSchool', code, () => {
      together(); api.queue(s, [d(code, ['NA', 'CA'].includes(code) ? '각자 보던 것만 잠깐 봐요' : '오늘은 각자 보던 것만 잠깐 보자'), p(code === 'MG' ? '네. 오늘은 이대로 쉴게요' : '응. 오늘은 이대로 쉬자'), stage('각자 조용히 본다.')].map(q => ({ ...q, cast: [code] })), 'LATE-CLOSE');
    })), ...result];
  }
  if (id === 'LATE-STUDY') return [...s.notes.map(note => opt(`${note} 다시 읽기`, () => { m.readingNote = note; api.enter(s, 'LATE-NOTE'); })), opt('덮기', () => api.enter(s, 'LATE-AF-SELECT'))];
  if (id === 'LATE-REST') return [opt('일과로 돌아가기', () => api.enter(s, 'LATE-AF-SELECT'))];
  if (id === 'LATE-CLOSE') return [opt('귀가', () => api.enter(s, s.day === 20 ? 'DAY20-HANDOFF' : `D${s.day + 1}-AM`))];
  if (id === 'DAY20-HANDOFF') return [];
  if (id === 'LATE-HE-REQUEST') {
    const r = Object.values(m.helium.requests).find(r => r.day === s.day);
    if (!r || r.accepted) return [];
    const choices = r.reason === 'puzzle' ? [['저도 제 방식으로 좀 더 볼게요', '응. 다음에 어디서 멈췄는지는 듣고 싶어.'], ['그럼 오늘은 문제 얘기 없이 갈게요', '좋아. 해답 열었는지 검사하러 오진 말고.']] : [['네. 저는 제 쪽에서 쉬다 갈게요', '응. 내가 다시 말 걸 날은 내가 물을게.'], ['그럼 오늘은 먼저 갈게요', '조심히 가. 내일 볼지는 그날 시간 보고.']];
    return choices.map(([label, reply], i) => opt(label, () => once(`LATE:${s.day}:HE:reply`, i, () => api.queue(s, [d('HE', reply), { ...system('혼자 노트 보기 또는 혼자 쉬기로 오늘 방과후를 마칩니다.'), cast: [] }], 'LATE-HE-SOLO'))));
  }
  if (id === 'LATE-HE-SOLO') return [opt('혼자 노트 보기', () => api.queue(s, lessonCards(`D${s.day === 20 ? 19 : s.day}-NOTE`).map(q => ({ ...q, cast: [] })), 'LATE-CLOSE')), opt('혼자 쉬기', () => api.enter(s, 'LATE-CLOSE'))];
  const ctx = m?.context;
  if (ctx && eventScene(c, ctx.event) === id) {
    const key = `LATE:${s.day}:${ctx.slot}:${c}:${ctx.event}:choice`;
    if (m.complete[lateKey(c, ctx.event)] || Object.hasOwn(s.choices, key)) return [opt('오늘은 마치기', () => api.enter(s, end(ctx.slot)))];
    const content = lateContent(s, c, ctx.event);
    return content.choices.map((choice, i) => opt(choice.label, () => once(key, i, () => {
      const q = structuredClone(choice.lines); const total = choice.main ? ctx.event === 'Q' ? 6 : 5 : 0;
      q.at(-1).lateCommit = { code: c, event: ctx.event, kind: choice.main ? 'main' : 'none', total };
      if (choice.snap) {
        if (!s.snaps[choice.snap]) q.push({ who: '이벤트 스냅', text: '', snap: choice.snap, cast: [c], kind: 'narration' });
        q.push(...structuredClone(SNAP_FOLLOW[choice.snap]));
      }
      const ending = typeof content.end === 'function' ? content.end(i) : content.end || []; q.push(...ending);
      s.period.history.push({ day: s.day, who: PEOPLE[c], title: LATE_NAMES[c][ctx.event], text: choice.label });
      // A polite departure is not a shared journey in the closing cast.
      if (ctx.slot === 'afterSchool' && !choice.main && (c === 'H' || c === 'CA')) lateDay(s).together = null;
      api.queue(s, q, end(ctx.slot));
    })));
  }
  return [];
}
