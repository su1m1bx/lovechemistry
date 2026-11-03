import { PEOPLE, mainRows, quotes, actorLines, clean, say, stage } from './period.js';

// 표시할 대사/실제 행동과 제작 메모를 명시적으로 분류한다.
// 따옴표만 추출하면 사라지는 행동, 이름 없이 이어지는 인물 대사를 함께 보존한다.
const production = text => ({ kind: 'production', text });
const RESPONSE_PARTS = {
  'RE-CA': {
    0: q => [say('칼슘', q[0]), stage('목록 한 줄을 함께 확인하고 짧게 종이 승부를 해 본다.'), say('칼슘', q[1])],
    1: q => [say('칼슘', q[0]), stage('확인 뒤 각자 쉰다.')],
  },
  'LAB-H': { 0: q => [stage('수소가 지도를 접는다.'), say('수소', q[0])] },
  'LAB-C': { 0: q => [stage('탄소가 두 장에 ‘게시용’과 ‘개인 스크랩’이라고 적어 나란히 둔다.'), say('탄소', q[0])] },
  'LAB-NA': { 0: q => [stage('나트륨이 ‘내 취향’ 칸에 ‘부스러기는 감수’라고 적는다.'), say('나트륨', q[0])] },
  'LAB-MG': {
    0: q => [say('마그네슘', q[0]), stage('함께 변경 위치와 접기 순서를 메모하고 한 번 시도한다.'), production('잘 움직였다고 확정하지 않는다.')],
  },
  'LAB-CA': {
    0: q => [stage('짧은 종이 놀이를 한다.'), production('이 대본의 한 판에서는 승패가 고정되어 있다.'), stage('칼슘이 마지막 수를 놓쳐 진다.'), say('칼슘', q[0]), say('플레이어', q[1])],
  },
  'LAB-CL': {
    0: q => [say('염소', q[0]), stage('두 사람이 같은 문장에서 다른 대목을 짚는다.')],
    2: q => [production('원문은 표시하지 않는다.'), say('염소', q[0])],
  },
};
export function responseParts(id, row) {
  const text = mainRows(id)[row][1];
  return RESPONSE_PARTS[id]?.[row]?.(quotes(text)) || actorLines(text);
}
export const responseLines = (id, row) => responseParts(id, row).filter(p => p.kind !== 'production');
export const heliumReading = () => [stage('헬륨이 원고를 읽는다.'), say('헬륨', '자료가 필요한 학생은 점심시간이 끝나기 전에 도서관 자료실에서 신청서를 작성해 주세요.'), stage('원고의 ‘학생은’ 뒤를 살핀다.')];
export const chlorineReview = () => stage('과학 자료에서 Cl₂ 기체와 Cl⁻ 이온을 수업에서 배운 물질 구분으로 확인한다.');
export function followAction(code, promises) {
  const text = {
    HE: promises.heAgreement ? '약속대로 막힌 곳만 읽고 표시해 헬륨에게 직접 돌려준다.' : '오늘 읽다가 막힌 곳만 함께 확인하고 표시한다.',
    MG: '바뀐 단계만 함께 메모하고 서로 같은 순서를 따라 접는다.',
    CA: promises.caPlayed ? '아쉬웠던 수 하나만 함께 살핀다.' : '예시 수 하나만 함께 살핀다.',
    CL: promises.clRead ? '개인 해석 메모를 밖에 옮기지 않고 염소에게만 보여 준다.' : '잡지의 한 표현을 함께 읽는다.',
  }[code];
  return text ? [stage(text)] : [];
}

export const NA_SCHEDULE_TEXT = '저는 방과후 과학실의 학교 시뮬레이터를 쓸 거예요. 고체 식염이랑 물, 식염수를 측정해 보고 설명을 정리하려고요.';

// 장면의 현장 인물만 지정한다. 대사에 언급된 이름이나 화자를 검색하지 않는다.
const MORNING_CAST = { 3: ['H'], 4: ['C'], 5: ['H'], 6: ['C'], 7: ['H'], 8: ['C'], 9: ['H', 'C'], 10: ['H', 'C'] };
const companion = s => s.period.person ? [s.period.person] : [];
const sceneCasts = {
  'A-01': ['H'], 'A-02': ['H'], 'A-03': ['H'], 'A-04': [],
  'A-04-action': s => ({ 도서관: ['H'] })[s.place] || [],
  'A-05': ['H'], 'B-01': ['H'], 'B-02': ['H'], 'B-03': ['C'], 'B-04': [], 'B-04-action': [], 'B-04-talk': ['NA'],
  'B-05': s => Object.hasOwn(s.choices, 'B-05') && s.events.naSchedule ? ['NA'] : [],
  ...Object.fromEntries(['C-01', 'C-02', 'C-03', 'C-04', 'C-05', 'C-06', 'C-summary', 'C-07'].map(id => [id, ['NA']])),
  ...Object.fromEntries(Object.entries(MORNING_CAST).flatMap(([day, cast]) => [[`D${day}-AM`, cast], [`D${day}-RECESS`, cast], [`D${day}-NOTE`, cast]])),
  ...Object.fromEntries(['LUNCH-SELECT', 'LUNCH-ACTION', 'LUNCH-PERSON', 'LUNCH-STUDY', 'LUNCH-SKIP', 'LUNCH-EMPTY', 'EX-START', 'EX-PAPER', 'EX-RESULT', 'DAY11-HANDOFF'].map(id => [id, []])),
  ...Object.fromEntries(Object.keys(PEOPLE).flatMap(code => [`D2-${code}`, `MEET-${code}`, `RE-${code}`, `LAB-${code}`, `EX-${code}`].map(id => [id, companion]))),
  ...Object.fromEntries(['TALK-REPEAT', 'LAB-CL-read', 'LAB-FOLLOW', 'AF-QUIET', 'AF-EX'].map(id => [id, companion])),
  ...Object.fromEntries(['D2-AF', 'AF-SELECT', 'EX-AF'].map(id => [id, s => {
    const choice = s.choices[`DAY-${s.day}:AF:action`];
    return PEOPLE[choice] ? [choice] : [];
  }])),
  'EX-AFTER': ['H', 'C'],
};
export function presentCast(s) {
  const rule = sceneCasts[s.scene];
  let cast = typeof rule === 'function' ? rule(s) : rule || s.cast;
  for (const line of s.queue.slice(0, s.index + 1)) if (line.cast) cast = line.cast;
  return [...new Set(cast)];
}

// 기존 v2 슬롯의 응답 큐도 점수·분기를 다시 실행하지 않고 표시 단위만 이관한다.
export function repairPresentation(s) {
  const oldQueue = s.queue; const replacement = []; let index = 0;
  const rowScene = s.scene === 'LAB-CL-read' ? 'LAB-CL' : s.scene;
  const isResponseScene = /^(RE|LAB)-(H|HE|C|NA|MG|CA|CL)$/.test(rowScene);
  for (let i = 0; i < oldQueue.length; i++) {
    const line = oldQueue[i];
    if (i === s.index) index = replacement.length;
    let parts = null;
    if (!line.kind && line.who === '장면') {
      if (s.scene === 'RE-HE' && line.text.startsWith('헬륨이 원고를 읽는다. “')) parts = heliumReading();
      if (s.scene === 'LAB-CL' && line.text === '과학 자료에서 Cl₂ 기체와 Cl⁻ 이온을 B-02의 물질 구분으로 확인한다.') parts = [chlorineReview()];
      if (s.scene === 'A-05' && line.text === '혼자 교내 동선을 확인하며 귀가한다.') parts = [{ ...line, cast: [] }];
      if (s.scene === 'C-07' && line.text === '인사하고 귀가한다.') parts = [{ ...line, cast: [] }];
    }
    if (!line.kind && line.who === '장면' && isResponseScene) {
      const row = mainRows(rowScene).findIndex(row => clean(row[1]) === line.text);
      if (row !== -1) parts = responseLines(rowScene, row);
    }
    if (parts?.length) {
      const { who, text, ...effects } = line;
      Object.assign(parts.at(-1), effects);
      replacement.push(...parts);
    } else replacement.push(line);
  }
  if (s.index === oldQueue.length) index = replacement.length;
  s.queue = replacement; s.index = index;
  if (s.scene === 'B-04-talk' && Object.hasOwn(s.choices, 'B-04-talk')) {
    const scheduleIndex = s.queue.findIndex(q => q.text === NA_SCHEDULE_TEXT);
    if (scheduleIndex !== -1) {
      s.queue[scheduleIndex].displayEvent = 'naSchedule';
      if (s.index < scheduleIndex) delete s.events.naSchedule;
      else s.events.naSchedule = true;
    }
  }
}
