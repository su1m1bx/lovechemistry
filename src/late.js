import { PEOPLE, PLACES, lunchPeople, lunchPlaceLabel, say, stage } from './period.js';
import { INTRO } from './mid-content.js';
import { uncomfortable } from './chronology.js';
import { lessonCards } from './learning.js';
import { LATE_EVENTS, initLate, lateDay, lateKey, lateSceneId, lateEventScene, availableLate, mainReward, partialReward } from './late-state.js';
import { LATE_NAMES, LATE_NOTICES, LATE_GOODBYE, INVITATIONS, lateInvitation, lateContent, SNAP_FOLLOW } from './late-content.js';
import { postCommon, postContent, postName, POST_SNAP_FOLLOW } from './post-content.js';

export { lateSceneId };
const p = text => say('플레이어', text);
const d = (c, text) => say(PEOPLE[c], text);
const system = text => ({ who: '학교 안내', text, kind: 'narration' });
const eventScene = lateEventScene;
const end = slot => slot === 'lunch' ? 'LATE-LUNCH-END' : 'LATE-CLOSE';
const contentFor = (s, c, e) => s.day > 20 ? postContent(s, c, e) : lateContent(s, c, e);
const eventName = (s, c, e) => s.day > 20 ? postName(c, e) : LATE_NAMES[c][e];
const consentKey = ctx => `LATE:${ctx.day}:${ctx.slot}:${ctx.code}:${ctx.event}:consent`;
export function lateScene(s, id, api) {
  if (!lateSceneId(id)) return false;
  if (s.day === 20 && id.startsWith('LATE-') && !s.exam2.returned) throw new Error('둘째 시험의 결과 확인 뒤 점심으로 돌아갈 수 있습니다.');
  initLate(s); const m = s.late; const c = s.period.person;
  s.scene = id; s.cast = []; let q = []; let after = null;
  if (id === 'D30-CEREMONY') {
    s.day = 30; s.time = '방학식'; s.location = '교실'; s.period.person = null; s.period.invite = null; m.context = null; lateDay(s);
    q = [{ who: '화학 교사', kind: 'dialogue', text: '오늘은 방학식입니다. 반납할 자료가 있으면 잊지 말고, 도서관 이용 시간은 문 옆 공지를 보세요.' }, { ...p('책상 안을 한 번 보고 가방을 닫았다. 종이 울리면 바로 집에 가야 할 것 같았는데, 오늘은 조금 달랐다.'), who: '플레이어 독백' }];
  } else if (/^D2[1-9]-(AM|NOTE|RECESS)$/.test(id)) {
    const day = Number(id.match(/\d+/)[0]); const phase = id.split('-')[1];
    if (phase === 'AM') { s.day = day; s.period.person = null; s.period.invite = null; s.place = ''; m.context = null; lateDay(s); }
    s.time = { AM: '아침', NOTE: '수업', RECESS: '쉬는 시간' }[phase]; s.location = '교실';
    const common = postCommon(id); q = common.q; s.cast = common.cast;
    after = phase === 'AM' ? `D${s.day}-NOTE` : phase === 'NOTE' ? `D${s.day}-RECESS` : null;
  } else if (/^D(1[6-9]|20)-AM$/.test(id)) {
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
    if (s.day > 20) q = [stage('급식을 마치고 복도로 나왔다.'), { ...p('오늘 있는 곳을 보고 고르자. 혼자 쉴 자리여도 괜찮고.'), who: '플레이어 독백' }];
  } else if (id === 'LATE-ACTION' || id === 'LATE-PERSON') {
    s.location = s.place;
    if (s.day > 20) q = id === 'LATE-ACTION' ? [stage('선택한 장소에 도착했다. 아직 어느 사람에게 말도 걸지 않았다.')] : [{ ...p('같은 곳에 있어도 각자 시간을 보내고 있다. 오늘은 누구에게 말을 걸까.'), who: '플레이어 독백' }];
  }
  else if (id === 'LATE-INTRO') {
    s.cast = [c]; q = structuredClone(INTRO[c]); q.at(-1).met = c;
    if (s.day !== 30) q.push(p(['HE', 'MG'].includes(c) ? '지금 보고 계신 건 뭐예요?' : s.day > 20 ? '지금은 뭐 보고 있었어?' : '지금은 무슨 얘기 중이었어?'));
    after = s.day === 30 ? 'D30-TALK' : 'LATE-EVENTS';
  } else if (['LATE-EVENTS', 'LATE-LUNCH-END'].includes(id)) {
    s.cast = [c];
    if (id === 'LATE-EVENTS' && s.day > 20) q = [d(c, { H: '개인 지도. 오늘은 한 구간만 볼래.', HE: '내 종이. 다 풀었다고 말하기는 아직 이르고.', C: '내 스크랩. 게시용 말고 이쪽.', NA: '제 수첩이요. 오늘 적을 칸만 보려고요.', MG: '작은 종이 팔. 아직 가방에 넣기 전.', CA: '놀이 종이요. 비품 목록은 끝났어요.', CL: '내가 읽을 페이지. 오늘은 교정 의뢰 아니고.' }[c])];
  }
  else if (id === 'LATE-AF-SELECT') {
    s.time = '방과후'; s.location = '교실 앞'; m.context = null;
    if (s.day > 20) q = [{ ...p('오늘 직접 확인한 사람에게 묻거나, 혼자 마무리할 수 있다.'), who: '플레이어 독백' }];
  }
  else if (id === 'LATE-NOTE') {
    q = [{ who: '받은 핵심 노트', text: api.notes[m.readingNote], kind: 'narration' }, ...lessonCards(m.readingNote)];
    if (s.day > 20) q.push({ ...p('이건 받은 자료. 오늘 내가 새로 측정한 기록은 아니다.'), who: '플레이어 독백' }); else after = 'LATE-STUDY';
  } else if (id === 'LATE-STUDY') {
    if (s.day > 20) q = [p(m.studySlot === 'afterSchool' ? '오늘은 내 노트 한 장만 보고 가자.' : '새로 한 일을 적는 대신, 이미 받은 설명부터 다시 읽자.')];
  } else if (id === 'LATE-REST') {
    if (s.day > 20) q = [stage('가방을 옆에 놓고 앉았다. 종이 넘기는 소리도 멀리서만 들린다.'), { ...p('오늘 이 시간은 비워 두자.'), who: '플레이어 독백' }];
  } else if (id === 'LATE-EMPTY') {
    q = [stage('오늘 안내에는 이 자리의 대화 상대가 없었다. 주변 소리만 들린다.'), { ...p('다른 곳에서 누가 기다렸다는 말은 듣지 않았다. 오늘은 여기서 쉬었다 가자.'), who: '플레이어 독백' }]; after = 'LATE-REST';
  }
  else if (id === 'LATE-CLOSE') {
    s.time = '귀가'; s.location = '학교 앞'; const together = lateDay(s).together;
    s.cast = together ? [together] : [];
    q = together ? [d(together, LATE_GOODBYE[together]), p(['HE', 'MG'].includes(together) ? '네. 조심히 가세요' : '응. 조심히 가')] : [p('가방을 메고 교문으로 향했다')];
    m.context = null;
  } else if (id === 'DAY20-HANDOFF') {
    s.day = 20; s.time = '개발 인계'; s.location = '20일차 완료'; s.period.invite = null; m.context = null;
    q = [system('20일차 일과를 마쳤습니다. 시험과 모든 기록을 보존하고 다음 등교로 이어갈 수 있습니다.')];
  } else if (id === 'D30-TALK') {
    s.cast = [c];
    q = [p(['HE', 'MG'].includes(c) ? '저는 늦잠부터 잘 것 같아요' : '방학 첫날엔 늦잠부터 잘 것 같아'), d(c, { H: '난 눈 뜨면 창밖부터', HE: '나는 알람만 늦출래. 한꺼번에 바꾸면 다시 맞추기 귀찮아서', C: '난 가방부터 비울래. 벌써 종이가 너무 많아', NA: '저는 수첩 빈 페이지부터 확인할래요', MG: '난 손 안 쓰고 좀 누워 있을래', CA: '전 안 뛰고 걷는 날부터요', CL: '난 알람 이름을 ‘일어나지 마’로 바꿔 볼까' }[c])];
    const unfinished = Object.entries(m.attempts).some(([key]) => key.startsWith(c + ':') && !m.complete[key]);
    if (unfinished) q.push(d(c, { H: '아직 같이 안 간 길은 남아 있어. 오늘 다 돌겠다는 말은 안 할게.', HE: '못 같이 본 건 그대로 남았어. 오늘 한꺼번에 끝내자는 뜻은 아니고.', C: '못 고른 면은 내 공책에 남겨 뒀어. 네가 골랐다고 붙이진 않고.', NA: m.partial['NA:B'] ? '표시만 한 건 방문 기록으로 바꾸지 않았어요.' : '아직 안 본 쪽은 수첩에 그대로예요.', MG: '안 한 동작도 있어. 오늘 다 움직일 필요는 없고.', CA: '못 둔 수는 남겨 뒀어요. 제가 이긴 판으로 적진 않았고요.', CL: '못 읽은 건 접힌 채로. 오늘 다 펼치자는 말은 안 할게.' }[c]));
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
    else if (s.choices[consentKey(ctx)] === false) q = [system('오늘 이미 선택한 교류입니다. 다음 유효한 날 다시 선택할 수 있습니다.')];
    else {
      const content = contentFor(s, c, ctx.event); q = content.intro;
      if (ctx.read && content.read) q = [...q, ...content.read];
    }
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
    if (s.day === 30) { api.enter(s, s.period.met[code] ? 'D30-TALK' : 'LATE-INTRO'); return; }
    if (code === 'NA' && uncomfortable(s)) api.enter(s, s.mid.sodium.status === 'unresolved' ? 'MID-NA-REPAIR' : s.mid.sodium.startedDay < s.day ? 'MID-NA-CHECK' : 'LATE-LUNCH-END');
    else api.enter(s, s.period.met[code] ? 'LATE-EVENTS' : 'LATE-INTRO');
  };
  const begin = (event, slot) => {
    m.context = { code: c, event, slot, day: s.day };
    m.attempts[lateKey(c, event)] = s.day; lateDay(s).event = event;
    api.enter(s, eventScene(c, event));
  };
  const solo = () => [opt('혼자 노트 보기', () => action('afterSchool', '공부', () => {
    if (s.day > 20) { m.studySlot = 'afterSchool'; api.enter(s, 'LATE-STUDY'); } else api.queue(s, lessonCards(`D${s.day === 20 ? 19 : s.day}-NOTE`), 'LATE-CLOSE');
  })), opt('혼자 쉬기', () => action('afterSchool', '휴식', () => {
    if (s.day > 20) { m.studySlot = 'afterSchool'; api.enter(s, 'LATE-REST'); } else api.enter(s, 'LATE-CLOSE');
  }))];
  if (id === 'DAY16-HANDOFF') return [opt('16일차로 이어가기', () => api.enter(s, 'D16-AM'))];
  if (id === 'D30-CEREMONY') return [opt('방학식 마치고 점심 장소 고르기', () => api.queue(s, [p('남은 시간도 내가 고르자.')], 'LATE-LUNCH'))];
  if (id === 'D30-TALK') return [opt('오늘은 그 얘기만 하고 쉬기', () => api.queue(s, [d(c, INVITATIONS[c][2])], 'LATE-AF-SELECT')), opt('방과후 잠깐 같이 있어도 될까', () => {
    const [question, reply] = INVITATIONS[c]; lateDay(s).confirmed = true;
    api.queue(s, [p(question), { ...d(c, reply), invite: c }], 'LATE-AF-SELECT');
  })];
  if (/^D(1[6-9]|2[1-9])-RECESS$/.test(id)) return [opt('점심 장소 고르기', () => api.enter(s, 'LATE-LUNCH'))];
  if (id === 'LATE-LUNCH' || id === 'EX2-AFTER') return PLACES.map(place => opt(lunchPlaceLabel(s.day, place), () => {
    initLate(s); lateDay(s);
    once(`DAY-${s.day}:LUNCH:place`, place, () => { s.place = place; api.enter(s, 'LATE-ACTION'); });
  }, { place }));
  if (id === 'LATE-ACTION') return ['대화', '공부', '휴식'].map(value => opt(value, () => action('lunch', value, () => {
    const people = lunchPeople(s.day, s.place);
    if (s.day > 20) m.studySlot = 'lunch';
    if (value !== '대화') api.enter(s, value === '공부' ? 'LATE-STUDY' : 'LATE-REST');
    else if (people.length > 1) api.enter(s, 'LATE-PERSON'); else if (people.length) visit(people[0]); else api.enter(s, s.day > 20 ? 'LATE-EMPTY' : 'LATE-REST');
  })));
  if (id === 'LATE-PERSON') return lunchPeople(s.day, s.place).map(code => opt(PEOPLE[code], () => once(`DAY-${s.day}:LUNCH:person`, code, () => visit(code))));
  if (id === 'LATE-EVENTS') return [...availableLate(s, c, 'lunch').map(event => opt(`${PEOPLE[c]} · ${eventName(s, c, event)}`, () => begin(event, 'lunch'))),
    opt('오늘은 초대 확인만 하기', () => api.enter(s, 'LATE-LUNCH-END')),
    ...(s.day > 20 ? [opt('오늘은 인사만 하고 쉴래', () => api.queue(s, [p(['HE', 'MG'].includes(c) ? '오늘은 인사만 하고 쉴게요' : '오늘은 인사만 하고 쉴게'), d(c, INVITATIONS[c][2])], 'LATE-AF-SELECT'))] : [])];
  if (id === 'LATE-LUNCH-END') return [opt('방과후에도 이야기할까? — 오늘 가능성 확인', () => once(`LATE:${s.day}:invite`, c, () => {
    const [question, reply] = lateInvitation(s, c); const q = [p(question), d(c, reply)]; q.at(-1).invite = c;
    lateDay(s).confirmed = true; api.queue(s, q, 'LATE-AF-SELECT');
  })), opt('오늘은 여기까지', () => once(`LATE:${s.day}:invite`, false, () => api.queue(s, [d(c, INVITATIONS[c][2])], 'LATE-AF-SELECT')))];
  if (id === 'LATE-AF-SELECT') {
    if (s.period.actions[s.day]?.afterSchool) return [];
    const result = solo(); const day = lateDay(s);
    const code = day.confirmed && s.period.invite?.day === s.day && s.period.invite.code === day.person ? day.person : null;
    if (!code) return result;
    if (s.day === 30) return [opt(`${PEOPLE[code]} · 잠깐 함께 앉기`, () => action('afterSchool', code, () => {
      s.period.person = code; day.together = code; s.location = '과학실 · 자료 좌석';
      api.queue(s, [p(code === 'HE' ? '아까 여쭤본 시간, 지금 같이 봐도 될까요?' : code === 'MG' ? '아까 말씀하신 것, 지금 같이 해도 돼요?' : '아까 얘기한 것, 지금 같이 해도 돼?'), d(code, ['NA', 'CA'].includes(code) ? '잠깐 앉았다 가요' : '오늘은 잠깐 앉았다 가자'), stage('과학실 자료 좌석에서 각자 책과 종이를 덮고 쉰다.'), p(['HE', 'MG'].includes(code) ? '이제 갈까요' : '이제 가자')].map(q => ({ ...q, cast: [code] })), 'LATE-CLOSE');
    })), ...result];
    if (code === 'HE') return [opt('헬륨에게 방과후 함께할지 묻기', () => {}, { heliumRequest: true }), ...result];
    const events = availableLate(s, code, 'afterSchool');
    const consent = () => [p(code === 'MG' ? '아까 말씀하신 것, 지금 같이 해도 돼요?' : '아까 얘기한 것, 지금 같이 해도 돼?'), d(code, ['NA', 'CA'].includes(code) ? '네. 여기요' : '응. 이쪽이야')];
    const together = () => { s.period.person = code; day.together = code; s.location = code === 'H' ? '교실 앞 · 경내 길' : '과학실 · 교사 있는 자료 좌석'; };
    if (events.length) return [...events.map(event => opt(`${PEOPLE[code]} · ${eventName(s, code, event)}`, () => action('afterSchool', code, () => {
      together(); m.context = { code, event, slot: 'afterSchool', day: s.day }; m.attempts[lateKey(code, event)] = s.day; day.event = event;
      api.queue(s, consent().map(q => ({ ...q, cast: [code] })), eventScene(code, event));
    }))), ...result];
    return [opt(`${PEOPLE[code]} · 각자 조용히 보기(0)`, () => action('afterSchool', code, () => {
      together(); api.queue(s, [d(code, ['NA', 'CA'].includes(code) ? '각자 보던 것만 잠깐 봐요' : '오늘은 각자 보던 것만 잠깐 보자'), p(code === 'MG' ? '네. 오늘은 이대로 쉴게요' : '응. 오늘은 이대로 쉬자'), stage('각자 조용히 본다.')].map(q => ({ ...q, cast: [code] })), 'LATE-CLOSE');
    })), ...result];
  }
  const studyEnd = () => m.studySlot === 'afterSchool' ? 'LATE-CLOSE' : 'LATE-AF-SELECT';
  if (id === 'LATE-STUDY') return [...s.notes.map(note => opt(`${note} 다시 읽기`, () => { m.readingNote = note; api.enter(s, 'LATE-NOTE'); })), opt('덮기', () => api.enter(s, s.day > 20 ? studyEnd() : 'LATE-AF-SELECT'))];
  if (id === 'LATE-NOTE' && s.day > 20) return [opt('목록으로', () => api.enter(s, 'LATE-STUDY')), opt('덮고 마치기', () => api.enter(s, studyEnd()))];
  if (id === 'LATE-REST') return [opt('일과로 돌아가기', () => api.enter(s, s.day > 20 ? studyEnd() : 'LATE-AF-SELECT'))];
  if (id === 'LATE-CLOSE') return [opt('귀가', () => api.enter(s, s.day === 20 ? 'DAY20-HANDOFF' : s.day === 29 ? 'D30-CEREMONY' : s.day === 30 ? 'END-ENTRY' : `D${s.day + 1}-AM`))];
  if (id === 'DAY20-HANDOFF') return [opt('21일차로 이어가기', () => api.enter(s, 'D21-AM'))];
  if (id === 'LATE-HE-REQUEST') {
    const r = Object.values(m.helium.requests).find(r => r.day === s.day);
    if (!r || r.accepted) return [];
    const choices = r.reason === 'puzzle' ? [['저도 제 방식으로 좀 더 볼게요', '응. 다음에 어디서 멈췄는지는 듣고 싶어.'], ['그럼 오늘은 문제 얘기 없이 갈게요', '좋아. 해답 열었는지 검사하러 오진 말고.']] : [['네. 저는 제 쪽에서 쉬다 갈게요', '응. 내가 다시 말 걸 날은 내가 물을게.'], ['그럼 오늘은 먼저 갈게요', '조심히 가. 내일 볼지는 그날 시간 보고.']];
    return choices.map(([label, reply], i) => opt(label, () => once(`LATE:${s.day}:HE:reply`, i, () => api.queue(s, [d('HE', reply), { ...system('혼자 노트 보기 또는 혼자 쉬기로 오늘 방과후를 마칩니다.'), cast: [] }], 'LATE-HE-SOLO'))));
  }
  if (id === 'LATE-HE-SOLO') return [opt('혼자 노트 보기', () => {
    if (s.day > 20) { m.studySlot = 'afterSchool'; api.enter(s, 'LATE-STUDY'); } else api.queue(s, lessonCards(`D${s.day === 20 ? 19 : s.day}-NOTE`).map(q => ({ ...q, cast: [] })), 'LATE-CLOSE');
  }), opt('혼자 쉬기', () => { if (s.day > 20) { m.studySlot = 'afterSchool'; api.enter(s, 'LATE-REST'); } else api.enter(s, 'LATE-CLOSE'); })];
  const ctx = m?.context;
  if (ctx && eventScene(c, ctx.event) === id) {
    const key = `LATE:${s.day}:${ctx.slot}:${c}:${ctx.event}:choice`;
    if (m.complete[lateKey(c, ctx.event)] || Object.hasOwn(s.choices, key) || s.choices[consentKey(ctx)] === false) return [opt('오늘은 마치기', () => api.enter(s, end(ctx.slot)))];
    const content = contentFor(s, c, ctx.event);
    if (content.consent && !ctx.read) return [opt(content.consent.yes, () => once(consentKey(ctx), true, () => {
      ctx.read = true; api.queue(s, [p(content.consent.yes), ...(content.consent.reply ? [d(c, content.consent.reply)] : []), ...(content.read || [])]);
    })), opt(content.consent.no, () => once(consentKey(ctx), false, () => api.queue(s, [p(content.consent.no), d(c, content.consent.decline)], end(ctx.slot)))),
    ...(content.consent.skip ? [opt(content.consent.skip, () => once(consentKey(ctx), false, () => api.queue(s, [p(content.consent.skip), d(c, content.consent.skipReply)], end(ctx.slot))))] : [])];
    return content.choices.map((choice, i) => opt(choice.label, () => once(key, i, () => {
      const q = [...(s.day > 20 ? [p(choice.label)] : []), ...structuredClone(choice.lines)];
      const total = choice.main ? mainReward(s, c, ctx.event) : choice.partial ? partialReward(s, c, ctx.event) : 0;
      q.at(-1).lateCommit = { code: c, event: ctx.event, kind: choice.main ? 'main' : choice.partial ? 'partial' : 'none', total };
      if (choice.snap) {
        if (!s.snaps[choice.snap]) q.push({ who: '이벤트 스냅', text: '', snap: choice.snap, cast: [c], kind: 'narration' });
        q.push(...structuredClone(SNAP_FOLLOW[choice.snap] || POST_SNAP_FOLLOW[choice.snap]));
      }
      const ending = typeof content.end === 'function' ? content.end(i) : content.end || []; q.push(...ending);
      s.period.history.push({ day: s.day, who: PEOPLE[c], title: eventName(s, c, ctx.event), text: choice.label });
      // A polite departure is not a shared journey in the closing cast.
      if (ctx.slot === 'afterSchool' && !choice.main && !choice.partial && (c === 'H' || c === 'CA')) lateDay(s).together = null;
      api.queue(s, q, end(ctx.slot));
    })));
  }
  return [];
}
