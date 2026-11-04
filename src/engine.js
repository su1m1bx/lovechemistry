import { RULES, CHARACTERS } from './config.js';
import { dialogue, lines, reaction, choiceText, NOTES, title } from './script.js';
import { initPeriod, markCurrent, periodScene, periodOptions } from './extension.js';
import { PERIOD_NOTES, MET_EVENTS, PEOPLE, EXAM, EXAM_POINTS, SNAPS, PLACES, lunchPeople, lunchPlaceLabel } from './period.js';
import { presentCast, repairPresentation, NA_SCHEDULE_TEXT } from './presentation.js';
import { initMid, metOn, completeMid, syncLegacyHistory } from './chronology.js';
import { midScene, midOptions, midSceneId } from './mid.js';
import { MID_TITLES, SHARED_KEYS } from './mid-content.js';
import { CARDS, lessonCards } from './learning.js';

const LEGACY_SCENES = {
  'A-01': [1, '아침', '교실 앞 복도', ['H']], 'A-02': [1, '수업', '교실', ['H']],
  'A-03': [1, '쉬는 시간', '교실 문가 · 층 복도', ['H']], 'A-04': [1, '점심 · 급식 뒤', '장소 선택', []],
  'A-04-action': [1, '점심 · 급식 뒤', null, []], 'A-05': [1, '방과후', '교실 앞 복도', ['H']],
  'B-01': [2, '아침', '교실', ['H']], 'B-02': [2, '수업', '교실', []], 'B-03': [2, '쉬는 시간', '교실', ['C']],
  'B-04': [2, '점심 · 급식 뒤', '장소 선택', []], 'B-04-action': [2, '점심 · 급식 뒤', null, []],
  'B-04-talk': [2, '점심 · 급식 뒤', '복도', ['NA']], 'B-05': [2, '방과후', '교실', []],
  ...Object.fromEntries(['C-01', 'C-02', 'C-03', 'C-04', 'C-05', 'C-06', 'C-summary', 'C-07'].map(id => [id, [2, '방과후', id === 'C-07' ? '과학실 문 앞' : '과학실 · 가상 실험', ['NA']]])),
};
function legacyMetadata(s, id) {
  const meta = LEGACY_SCENES[id]; if (!meta) return;
  [s.day, s.time] = meta; s.location = meta[2] || s.place; s.cast = [...meta[3]];
  if (id === 'A-04-action') s.cast = lunchPeople(s.day, s.place);
  s.eventId = `DAY-${s.day}:${id}`;
}
const api = () => ({ enter, queue, score, record, notes: { ...NOTES, ...PERIOD_NOTES } });

export const samples = { solid: '건조한 고체 식염', water: '순수한 물', salt: '식염수' };
export function fresh(name) {
  const state = { version: 2, name, scene: '', index: 0, queue: [], after: null, place: '',
    affinity: Object.fromEntries(CHARACTERS.map(c => [c, RULES.initial])),
    choices: {}, applied: {}, events: {}, notes: [],
    lab: { selected: null, prepared: false, dissolved: false, lamp: null, observations: [], task: null } };
  initPeriod(state); initMid(state); enter(state, 'A-01');
  return state;
}
export const rude = s => s.events.takeover || s.events.dismiss;
export const measured = (s, sample) => s.lab.observations.some(o => o.sample === sample);
export const missing = s => !measured(s, 'water') ? 'water' : !measured(s, 'solid') ? 'solid' : 'salt';
const say = (who, text, extra = {}) => ({ who, text, ...extra });
const na = text => say('나트륨', text);
const h = text => say('수소', text);
const me = text => say('플레이어 독백', text);
function queue(s, q, after = null) { s.queue = q; s.index = 0; s.after = after; markCurrent(s); s.cast = presentCast(s); }
function score(s, key, who, amount) {
  if (Object.hasOwn(s.applied, key)) return;
  const before = who ? s.affinity[who] : 0;
  if (who) s.affinity[who] = Math.max(RULES.min, Math.min(RULES.max, before + amount));
  s.applied[key] = { who: who || null, requested: amount, actual: who ? s.affinity[who] - before : 0 };
}
function record(s, key, value, who, amount = 0) {
  if (Object.hasOwn(s.choices, key)) return false;
  s.choices[key] = value;
  score(s, key, who, amount);
  return true;
}
export function advance(s) {
  const current = s.queue[s.index];
  if (current?.met) { s.period.met[current.met] = true; s.events[MET_EVENTS[current.met]] = true; metOn(s, current.met); }
  if (current?.heard) s.events[current.heard] = true;
  completeMid(s, current?.midCommit, api());
  if (s.index < s.queue.length) s.index++;
  markCurrent(s);
  s.cast = presentCast(s);
  if (s.index === s.queue.length && s.after) {
    const target = s.after; s.after = null; enter(s, target);
  }
  syncLegacyHistory(s);
}
export function enter(s, id) {
  initPeriod(s);
  initMid(s);
  if (id === 'end') id = 'D3-AM';
  if (midScene(s, id, api())) return;
  if (periodScene(s, id, api())) return;
  s.scene = id;
  legacyMetadata(s, id);
  const base = id.slice(0, 4);
  let q = [];
  if (['A-01', 'A-02', 'A-03', 'A-05', 'B-01', 'B-02', 'B-03', 'B-04', 'C-01', 'C-02', 'C-04', 'C-06'].includes(id)) q = dialogue(id);
  if (id === 'A-01') q[1].met = 'H';
  if (id === 'A-02' || id === 'B-02') {
    if (!s.notes.includes(id)) s.notes.push(id);
    q.splice(id === 'A-02' ? 2 : 1, 0, ...lessonCards(id));
    if (id === 'A-02') q.push(me('이름에 수소가 들어간다는 것과 같은 물질이라는 건 다르다. 헷갈릴 때 다시 볼 수 있게 남겨 두자.'));
  }
  if (id === 'A-03') q = [h(s.events.mapInterest ? '아까 말한 지도, 점심 먹고 도서관에서 정리할 거야.' : '점심 먹고 난 도서관에 있어. 길 헷갈리면 거기서 물어봐도 돼.'), q[0],
    h(s.events.order ? '표지부터 확인하고 걸어 볼까?' : '여기까지만 같이 가 보자'),
    say('장면', '수소가 급식실 계단과 도서관 방향을 짚는다. 게시판과 도서관 입구를 확인한 뒤 다음 수업 전에 교실 쪽으로 돌아온다.'), ...q.slice(1)];
  if (id === 'A-04') q = [me('점심 먹고 아직 시간이 남았다. 어디로 갈까.')];
  if (id === 'A-05') q.push(me('혼자 시간을 보내도 되고, 함께할 사람이 있으면 과학실에서 오늘 배운 자료를 보며 이야기할 수도 있다.'));
  if (id === 'B-01') q.splice(1, 0, say('플레이어', s.events.recordTaste ? '네가 말한 정류장 방향은 아직 모르겠어.' : '교실까지는 안 헤맸어.'));
  if (id === 'B-03') q[0].met = 'C';
  if (id === 'B-04') q = [me('오늘 들은 얘기로 갈 만한 곳은 알겠다. 어디서 점심 뒤 시간을 보낼까.')];
  if (id === 'B-04-talk') q = dialogue('B-04').slice(0, -1);
  if (id === 'B-05') q = [me(s.events.naSchedule ? '혼자 움직일까, 아까 말한 가상 측정을 같이 해도 될지 물을까.' : '오늘은 혼자 노트를 정리하고 가자.')];
  if (id === 'C-01') q = [q[0], na(s.events.takeover ? '저도 예측하고 비교할 조건을 제안할게요. 기록만 맡는 건 아니에요.' : s.events.reader ? '저는 녹인 뒤에는 이온이 움직여서 달라질 거라고 예상해요. 다른 결과가 나와도 그대로 남겨 보죠.' : '측정 전에 노트를 같이 보자고 했죠. 화면 설명도 함께 볼게요.'),
    me(s.events.ionNotation ? 'Na와 Na⁺부터 구별하자.' : '설명용 노트와 우리가 직접 누르는 가상 측정을 구분해서 남기자.'), say('판단 전 공통 설명', NOTES['C-01'])];
  if (id === 'C-03') q = [na(s.lab.observations[0].sample === 'solid' ? '다음엔 물만 측정해 볼까요? 식염을 넣기 전 용매의 표시도 알아두고 싶어요.' : '이번엔 고체를 볼까요? 이온이 있어도 움직이지 못하는 조건을 비교해 보고 싶어요.'), na('아니면 식염수부터 보고 돌아와도 돼요. 순서를 적어 두면 구별할 수 있으니까요.')];
  if (id === 'C-04') q.at(-1).heard = 'bakeryRecord';
  if (id === 'C-05') q = [na(missing(s) === 'water' ? '식염수는 켜졌지만 물만의 표시는 아직 안 봤어요. 물 대조를 지금 추가할까요?' : missing(s) === 'solid' ? '물과 식염수는 봤어요. 고체 상태는 아직 안 봤으니 그 조건도 확인할까요?' : '세 조건은 다 있어요. 같은 조건의 식염수를 한 번 더 볼까요, 오늘은 여기서 정리할까요?')];
  if (id === 'C-summary') q = [say('관찰과 노트의 구분', summary(s))];
  if (id === 'C-07') {
    q = [na(s.events.dismiss ? '결과는 저장했어요. 다음엔 제가 왜 그 조건을 제안했는지도 들어 주세요.' : s.events.takeover ? '오늘은 같이 측정했네요. 점심에 제 대신 다 쓰겠다고 한 말은 아직 마음에 걸려요.' : missing(s) === 'salt' ? '세 조건을 구별해서 남겼네요.' : '오늘은 표의 빈칸도 기록이 됐네요.'), ...dialogue('C-07')];
    q.at(-1).heard = 'crispyTaste';
  }
  if (id === 'C-01') q.push(...lessonCards(id));
  queue(s, q);
  return base;
}
const option = (label, run, disabled = false) => ({ label, run, disabled });
function reply(s, q, target) { queue(s, q, target); }
function tableOptions(s, id, table, handler) {
  // 표 선택은 화면 진행 상태와 독립적인 사건 ID로 중복 적용을 방지한다.
  return Array.from({ length: ({ 'A-01': 2, 'A-02': 2, 'A-03': 2, 'A-05': 2, 'B-01': 2, 'B-02': 2, 'B-03': 2, 'B-04': 3, 'C-01': 2, 'C-02': 2, 'C-03': 2, 'C-04': 1, 'C-05': 3, 'C-06': 3, 'C-07': 3 })[id] }, (_, i) => option(choiceText(id, i, table), () => handler(i)));
}
export function options(s) {
  if (s.index < s.queue.length || s.lab.task) return [];
  if (midSceneId(s.scene) || s.scene === 'DAY11-HANDOFF') return midOptions(s, api());
  if (!LEGACY_SCENES[s.scene]) return periodOptions(s, api());
  const id = s.scene;
  const choose = (i, who, amount, q, target, effects = () => {}) => {
    if (!record(s, id, i, who, amount)) return;
    if (id === 'A-05' || id === 'B-05') s.period.actions[s.day] = { ...(s.period.actions[s.day] || {}), afterSchool: i === 0 ? '자유 행동' : id === 'A-05' ? 'H' : 'NA' };
    effects(); reply(s, q, target);
  };
  const standard = (next, who, amounts = [], effect = () => {}) => tableOptions(s, id, 0, i => choose(i, who, amounts[i] || 0, reaction(id, i), next, () => effect(i)));
  if (id === 'A-01') return standard('A-02', '수소', [0, RULES.up], i => { s.events.order = i === 0; s.events.mapInterest = i === 1; });
  if (id === 'A-02') return standard('A-03', null, [], i => { s.events.noteStyle = i === 0 ? '비교표' : '문장'; });
  if (id === 'A-03') return standard('A-04', '수소', [], i => { s.events.libraryIntent = i === 0; });
  if (id === 'A-04' || id === 'B-04') return PLACES.map((place, i) => ({ place, ...option(lunchPlaceLabel(s.day, place), () => {
    if (!record(s, id + ':place', place)) return;
    s.place = place; s.scene = id + '-action';
    legacyMetadata(s, s.scene);
    queue(s, id === 'A-04' ? reaction('A-04', i) : [me(place === '복도' ? '수소가 말한 게시판이다.' : `${place}에 도착했다.`)]);
  }) }));
  if (id === 'A-04-action' || id === 'B-04-action') return ['대화', '공부', '스킵'].map((action, i) => option(action, () => {
    const first = id.startsWith('A'); const library = first && lunchPeople(s.day, s.place).includes('H');
    if (!first && s.place !== '복도') {
      // 2일차 비복도는 D절의 공통 점심 경로로 연결한다. ABC 표 인덱스는 유지한다.
      s.period.actions[2] = { lunch: action }; s.period.invite = null;
      if (!record(s, id, action)) return;
      if (i === 0) {
        const code = lunchPeople(s.day, s.place)[0];
        s.period.person = code;
        enter(s, `D2-${code}`);
      } else enter(s, i === 1 ? 'LUNCH-STUDY' : 'LUNCH-SKIP');
      return;
    }
    if (!record(s, id, action, library ? '수소' : null, library && i === 0 ? RULES.up : 0)) return;
    s.period.actions[s.day] = { ...(s.period.actions[s.day] || {}), lunch: action };
    let q = [];
    if (library) { q = reaction('A-04', i, 1); if (i === 0) s.events.recordTaste = true; }
    else if (!first && i === 0) { q = reaction('B-04', 0, 1); q[0].cast = lunchPeople(s.day, s.place); q.at(-1).met = 'NA'; }
    else q = [me(i === 0 ? '이 구간에 아는 사람이 없어 짧게 둘러본다.' : i === 1 ? '오늘은 표기 차이부터 다시 보자.' : first ? '조용히 쉬며 시간을 보낸다.' : '누굴 만나야 한다는 생각부터 잠깐 내려놓자.')];
    if (i === 1) q.push(...s.notes.map(n => say(`핵심 노트 재열람 · ${n}`, NOTES[n])));
    reply(s, q, first ? 'A-05' : i === 0 ? 'B-04-talk' : 'B-05');
  }));
  if (id === 'A-05') return tableOptions(s, id, 0, i => choose(i, '수소', 0, [...reaction(id, i), say('장면', i === 0 ? '혼자 교내 동선을 확인하며 귀가한다.' : '담당 교사가 있는 과학실 좌석에서 각자 자료를 보다가 인사하고 귀가한다.', { cast: i === 0 ? [] : ['H'] })], 'B-01', () => { s.events.hTogether = i === 1; if (i === 1) s.location = '과학실 · 자료 열람 좌석'; }));
  if (id === 'B-01') return standard('B-02', '수소', [0, RULES.up], i => { s.events.mapFeedback = i === 1; });
  if (id === 'B-02') return standard('B-03', null, [], i => { s.events.ionNotation = i === 0; });
  if (id === 'B-03') return standard('B-04', '탄소', [RULES.up, 0]);
  if (id === 'B-04-talk') return tableOptions(s, 'B-04', 2, i => choose(i, '나트륨', [RULES.up, RULES.disrespect, 0][i], [...reaction('B-04', i, 2), say('나트륨', NA_SCHEDULE_TEXT, { displayEvent: 'naSchedule' })], 'B-05', () => { s.events.reader = i === 0; s.events.takeover = i === 1; s.events.recheck = i === 2; }));
  if (id === 'B-05') return [option('자유 행동 — 혼자 노트를 정리하고 귀가한다.', () => choose(0, null, 0, s.events.naSchedule ? lines('플레이어: “오늘은 따로 정리할게.” 나트륨: “네. 저는 시뮬레이터 써 보고 갈게요.”').map(q => ({ ...q, cast: ['NA'] })) : [me('혼자 노트를 정리하고 귀가한다.')], 'end')),
    ...(s.events.naMet && s.events.naSchedule ? [option('과학실 데이트·나트륨 — 시뮬레이터에서 같이 측정해 볼래? 네 예측도 듣고 싶어.', () => choose(1, '나트륨', 0, [say('나트륨', s.events.takeover ? '같이 할 수는 있어요. 제 예측도 끝까지 들어 주세요.' : '네. 어떤 조건부터 볼지도 같이 정해요.', { cast: ['NA'] })], 'C-01', () => { s.events.naTogether = true; }))] : [])];
  if (id === 'C-01') return tableOptions(s, id, 0, i => choose(i, '나트륨', 0, [...reaction(id, i), say(i === 0 ? '노트 재확인' : '설명용 입자 모형 · 실제 관측 영상 아님', i === 0 ? NOTES['C-01'] : '고체: [Na⁺ Cl⁻ Na⁺ Cl⁻] 격자에 묶인 이온\n식염수: Na⁺ ↔ Cl⁻ ↔ 물속에서 이동하는 이온\n\n' + NOTES['C-01'])], 'C-02'));
  if (id === 'C-02') return tableOptions(s, id, 0, i => startTask(s, id, i, i === 0 ? 'solid' : 'water', 'C-03', [na(i === 0 ? '예측대로 꺼졌네요. 이온이 없다는 뜻은 아니고요.' : '이 감도에서 꺼짐. 전류가 완전히 0이라고 적진 않을게요.')]));
  if (id === 'C-03') return tableOptions(s, id, 0, i => {
    if (i === 0) startTask(s, id, i, missing(s), 'C-04', [na('둘 다 꺼졌지만 같은 물질도 같은 이유도 아니네요.')]);
    else choose(i, '나트륨', 0, [na('좋아요. 아직 안 본 조건은 빈칸으로 둘게요.')], 'C-04');
  });
  if (id === 'C-04') return tableOptions(s, id, 0, i => startTask(s, id, i, 'salt', 'C-05', [na('이번엔 켜졌어요. 제가 예상한 변화예요. 이온이 움직일 수 있다는 노트와 맞춰 봐야겠네요.')]));
  if (id === 'C-05') return tableOptions(s, id, 0, i => {
    if (i === 0) startTask(s, id, i, missing(s), 'C-06', [na('이번 조건과 결과도 따로 적었어요.')]);
    else choose(i, '나트륨', i === 2 ? RULES.disrespect : 0, [na(i === 2 ? '안 할 수는 있어요. 그래도 제안까지 하지 말라는 건 다른 얘기예요.' : missing(s) === 'salt' ? '네. 세 조건은 이미 있으니 재측정은 하지 않은 것으로 남겨요.' : '조금 더 보고 싶긴 하지만, 그 조건은 미측정으로 남기고 지금 기록부터 확인해요.')], 'C-06', () => { s.events.dismiss = i === 2; s.events.additionalDeferred = true; });
  });
  if (id === 'C-06') return tableOptions(s, id, 0, i => {
    let q = [na(i === 0 ? '네. 고체에 이온이 없어서가 아니라 움직일 수 있느냐의 차이죠.' : i === 1 ? '아니요. 녹는다고 금속 Na가 되진 않아요. 이 시료 정보에는 Na⁺와 Cl⁻가 있어요.' : '우리가 고른 용질은 식염뿐이에요. 다른 물질도 그렇다는 결론은 아직 못 내요.')];
    if (i === 0 && !measured(s, 'solid')) q.push(na('고체 설명은 노트에서 배운 것이고, 오늘 고체를 측정한 건 아니라고 적어요.'));
    if (i === 1) q.push(say('노트 재확인', '식염수에서 이동하는 이온이 전하를 운반한다. 물에 녹는다고 금속 Na가 생기지 않는다.'));
    if (i === 2) q.push(na(measured(s, 'water') ? '물만 비교한 건 다른 용질을 시험한 게 아니고요.' : '물 대조도 아직 미실시예요.'));
    choose(i, null, 0, q, 'C-summary', () => { s.events.interpretation = ['이온 이동으로 해석', '금속 생성 오해를 정정', '모든 용질로 일반화하지 않음'][i]; });
  });
  if (id === 'C-summary') return [option('기록 확인 · 시뮬레이터 종료', () => { s.events.experimentCompleted = true; enter(s, 'C-07'); })];
  if (id === 'C-07') return tableOptions(s, id, 0, i => choose(i, '나트륨', i < 2 && !rude(s) ? RULES.up : 0, [na(i === 0 ? rude(s) ? '빵 얘기는 나중에요. 오늘 제가 한 제안도 기억해 주세요.' : '네. 그땐 부스러기 양은 평가에서 빼 주세요.' : i === 1 ? rude(s) ? '취향은 달라도 돼요. 제 의견을 말하는 것도요.' : '그럼 첫 줄부터 다르네요. 다수결로 바삭함을 정하지는 말죠.' : rude(s) ? '네, 먼저 갈게요.' : '네. 선배도요.'), say('장면', '인사하고 귀가한다.', { cast: [] })], 'end', () => { s.events.bakeryExchange = i === 0 ? rude(s) ? '남은 거리감' : '이야기 의향' : i === 1 ? '서로 다른 취향' : '방문 약속 없음'; }));
  return [];
}
function startTask(s, key, value, sample, next, response) {
  if (!record(s, key, value, '나트륨')) return;
  s.lab.task = { sample, next, response }; s.lab.selected = null; s.lab.prepared = false; s.lab.dissolved = false; s.lab.lamp = null;
}
export function labAction(s, action, sample) {
  const lab = s.lab; if (!lab.task || s.index < s.queue.length) return;
  if (action === 'select' && sample === lab.task.sample) { lab.selected = sample; lab.lamp = null; }
  if (action === 'add' && lab.selected === 'salt') lab.prepared = true;
  if (action === 'dissolve' && lab.prepared) lab.dissolved = true;
  if (action === 'measure' && lab.selected && (lab.selected !== 'salt' || lab.dissolved)) {
    lab.lamp = lab.selected === 'salt' ? '켜짐' : '꺼짐';
    lab.observations.push({ sample: lab.selected, result: lab.lamp, scene: s.scene, setting: '동일 감도 · 별도 깨끗한 시료' });
    const { response, next } = lab.task; lab.task = null; reply(s, response, next);
  }
}
export function summary(s) {
  return Object.entries(samples).map(([key, label]) => `${label}: ${measured(s, key) ? key === 'salt' ? '켜짐' : '꺼짐' : '미측정'}`).join('\n') + '\n\n' +
    (measured(s, 'water') ? '이 감도에서 물은 꺼지고 식염수는 켜짐.' : '오늘의 물 대조는 미실시. 순수한 물의 낮은 전도성은 사전 노트에서 배운 내용.') + '\n' +
    (measured(s, 'solid') ? '고체와 식염수의 상태 간 측정 비교를 했다.' : '고체의 이온 격자는 노트 설명이며 오늘의 측정 결과가 아니다.') + '\n' +
    (s.lab.observations.filter(o => o.sample === 'salt').length > 1 ? '별도 식염수 재측정: 켜짐.' : '식염수 재측정: 하지 않음.') + '\n\n식염수의 이온 이동은 시료 정보·노트와 함께 해석한다. 표시등만으로 이온 종류나 금속 존재를 알아낸 것은 아니다. 다른 용질의 전도성, 영양상 적정량, 전극 생성물은 이번 측정으로 확인한 범위가 아니다.';
}
export function metadata(s) {
  return { day: s.day, time: s.time, location: s.location, cast: presentCast(s).map(c => PEOPLE[c]), title: MID_TITLES[s.scene] || title(s.scene) };
}
export function decodeSave(raw) {
  const s = JSON.parse(raw);
  if (s?.version === 1) throw new Error('이 저장은 1~2일차 구버전입니다. 원본은 삭제하지 않았습니다. 수치·진행 규칙이 바뀌어 새 게임으로 시작해 주세요. 새 진행을 저장하거나 시험 답안을 제출하기 전까지 기존 슬롯은 유지됩니다.');
  if (!s || s.version !== 2 || typeof s.name !== 'string' || !s.name.trim() || s.name.length > 20 ||
    !validScene(s.scene) || (s.after !== null && !validScene(s.after)) ||
    !Array.isArray(s.queue) || !Number.isInteger(s.index) || s.index < 0 || s.index > s.queue.length ||
    !s.queue.every(q => typeof q.who === 'string' && typeof q.text === 'string' && (!q.snap || Object.hasOwn(SNAPS, q.snap)) && (!q.card || Object.hasOwn(CARDS, q.card)) && (!q.note || Object.hasOwn(PERIOD_NOTES, q.note) || Object.hasOwn(NOTES, q.note)) &&
      (!q.cast || Array.isArray(q.cast) && q.cast.every(c => Object.hasOwn(PEOPLE, c))) && (!q.met || Object.hasOwn(PEOPLE, q.met)) && validCommit(q.midCommit)) ||
    !CHARACTERS.every(c => Number.isFinite(s.affinity?.[c]) && s.affinity[c] >= RULES.min && s.affinity[c] <= RULES.max) ||
    !s.choices || !s.applied || !s.events || !Array.isArray(s.notes) || !s.notes.every(n => n in { ...NOTES, ...PERIOD_NOTES }) ||
    !Array.isArray(s.lab?.observations) || !s.lab.observations.every(o => samples[o.sample] && o.result === (o.sample === 'salt' ? '켜짐' : '꺼짐')) ||
    (s.lab.task && (!samples[s.lab.task.sample] || !Array.isArray(s.lab.task.response))) ||
    !Number.isInteger(s.day) || s.day < 1 || s.day > 15 || typeof s.time !== 'string' || typeof s.location !== 'string' ||
    !Array.isArray(s.cast) || !s.cast.every(c => PEOPLE[c]) || !s.period || !['met', 're', 'labs', 'follows', 'promises', 'actions'].every(k => s.period[k] && typeof s.period[k] === 'object') ||
    !Array.isArray(s.period.history) || !s.snaps || !Object.keys(s.snaps).every(k => SNAPS[k]) ||
    !Array.isArray(s.exam?.answers) || s.exam.answers.length !== EXAM.length || !s.exam.answers.every(a => a === null || Number.isInteger(a) && a >= 0 && a <= 3) ||
    !Number.isInteger(s.exam.index) || s.exam.index < 0 || s.exam.index >= EXAM.length ||
    typeof s.exam.submitted !== 'boolean' || typeof s.exam.returned !== 'boolean' ||
    s.exam.returned && !s.exam.submitted || s.scene === 'EX-PAPER' && s.exam.submitted || s.scene === 'EX-RESULT' && (!s.exam.submitted || s.exam.returned) ||
    s.exam.submitted && (!s.exam.result || s.exam.result.day !== 10 || !Array.isArray(s.exam.result.details) || s.exam.result.details.length !== EXAM.length ||
      !s.exam.result.details.every((d, i) => d.id === EXAM[i].id && d.answer === s.exam.answers[i] && d.correct === EXAM[i].correct && d.points === (d.answer === d.correct ? EXAM_POINTS : 0)) ||
      s.exam.result.score !== EXAM.reduce((n, q, i) => n + (s.exam.answers[i] === q.correct ? EXAM_POINTS : 0), 0))) throw new Error('지원하지 않거나 손상된 저장 데이터입니다.');
  initMid(s);
  if (!validMid(s.mid)) throw new Error('지원하지 않거나 손상된 확장 기록입니다.');
  repairPresentation(s);
  s.cast = presentCast(s);
  return s;
}
function validScene(id) {
  return typeof id === 'string' && Boolean(Object.hasOwn(LEGACY_SCENES, id) || midSceneId(id) || id === 'end' || /^(D[3-9]-(AM|NOTE|RECESS)|D2-(AF|H|HE|C|CA)|D10-AM|LUNCH-(SELECT|ACTION|PERSON|STUDY|SKIP|EMPTY)|MEET-(HE|NA|MG|CA|CL)|RE-(H|HE|C|NA|MG|CA|CL)|TALK-REPEAT|AF-SELECT|LAB-(H|HE|C|NA|MG|CA|CL|CL-read|FOLLOW)|AF-QUIET|EX-(START|PAPER|RESULT|AFTER|AF|H|HE|C|NA|MG|CA|CL)|AF-EX|DAY11-HANDOFF)$/.test(id));
}
const date = n => Number.isInteger(n) && n >= 1 && n <= 15;
const sharedKeys = new Set([...Object.values(SHARED_KEYS), ...Object.keys(PEOPLE).map(c => `mutual-${c}`)]);
function validCommit(c) {
  return !c || typeof c.key === 'string' && Object.hasOwn(PEOPLE, c.code) && ['repair', 'check', 'agreement', 'personal', 'seed', 'echo', 'late', 'play', 'next', 'clRead'].includes(c.type) &&
    (c.amount === undefined || [0, 3, 4, 5, 8].includes(c.amount)) && (!c.shared || sharedKeys.has(c.shared));
}
function validMid(m) {
  const object = v => v && typeof v === 'object' && !Array.isArray(v);
  const sodium = m.sodium;
  return ['metDates', 'personal', 'seed', 'echo', 'late', 'play', 'next'].every(k => object(m[k]) && Object.entries(m[k]).every(([c, n]) => Object.hasOwn(PEOPLE, c) && date(n))) &&
    object(m.shared) && Object.entries(m.shared).every(([k, n]) => sharedKeys.has(k) && date(n)) && object(m.reflections) && Object.entries(m.reflections).every(([n, r]) => date(Number(n)) && object(r) && Object.entries(r).every(([k, c]) => ['lunch', 'afterSchool'].includes(k) && Object.hasOwn(PEOPLE, c))) &&
    object(sodium) && ['clear', 'unresolved', 'watching', 'resolved'].includes(sodium.status) &&
    (['watching', 'resolved'].includes(sodium.status) ? date(sodium.startedDay) : sodium.startedDay == null) &&
    (sodium.status === 'resolved' ? date(sodium.resolvedDay) && sodium.resolvedDay > sodium.startedDay : sodium.resolvedDay == null) &&
    (m.heAgreementDay == null || m.heAgreementDay === 12) &&
    [m.sodium.startedDay, m.sodium.resolvedDay, m.heAgreementDay, m.clReadDay].every(n => n == null || date(n)) &&
    (!m.readingNote || m.readingNote in PERIOD_NOTES || m.readingNote in NOTES);
}
