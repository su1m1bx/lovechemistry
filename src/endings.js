import { PEOPLE, say, stage } from './period.js';
import { SHARED_KEYS } from './mid-content.js';

const CODES = Object.keys(PEOPLE);
const p = text => say('플레이어', text);
const me = text => say('플레이어 독백', text);
const d = (c, text) => say(PEOPLE[c], text);
export const endingSceneId = id => ['END-ENTRY', 'END-FINISH', ...[...CODES, 'SOLO'].map(c => `END-${c}`)].includes(id);
export const endingCandidates = s => CODES.filter(c => s.affinity[PEOPLE[c]] >= 80);

export function endingMemory(s, code) {
  const candidates = [];
  const sharedLines = { H: '나란히 있어도 서로 먼저 듣는 소리가 달랐다.', HE: '그 기울어진 모형은 끝까지 그 사람 손에 있었다.', C: '한 장에 남은 작은 무늬와 빈 곳을 번갈아 봤었다.', NA: '서로 읽는 순서는 달라도, 각자 쓴 줄은 그대로 남았다.', MG: '네 박자 안에서 종이 팔을 움직이는 쪽과 소리 내는 쪽을 바꿨다.', CA: '상대편 길을 보면서도 자기 수는 직접 골랐다.', CL: '종이 밖으로 안 옮긴 대사를 서로 다른 목소리로 읽었다.' };
  const newLines = { H: '함께 걷고 각자 멈춘 곳이 달랐다', C: sharedLines.C, NA: '각자 그린 선을 교문 표시에서 포개 봤다', MG: '가운데 종이에서 번갈아 손을 멈췄다.', CA: '서로 추천한 길을 보고도 자기 수는 직접 골랐다', CL: sharedLines.CL };
  for (const c of code === 'SOLO' ? CODES : [code]) {
    const shared = s.mid.shared[SHARED_KEYS[c]];
    if (shared) candidates.push({ code: c, day: shared, text: sharedLines[c] });
    const joint = s.late.complete[`${c}:J`];
    if (joint && newLines[c]) candidates.push({ code: c, day: joint, text: newLines[c] });
  }
  candidates.sort((a, b) => b.day - a.day || CODES.indexOf(a.code) - CODES.indexOf(b.code));
  return candidates[0]?.text || null;
}
const FINAL = {
  H: '이번엔 길 말고, 너 만나러 갈게.', HE: '다음엔 내가 먼저 물어볼게. 네가 보고 싶다고.', C: '다음에 예쁜 거 보면, 제일 먼저 너 보여 줄래.', NA: '다음 목적지는 아직 몰라도, 같이 갈 사람은 알아요.', MG: '다음엔 할 일 없어도 와.', CA: '한 번 더 보고 싶은 건, 선배예요.', CL: '좋아해. 이건 다음 판본에서도 안 바꿀게.', SOLO: '방학 첫날의 길은, 내가 골랐다.',
};
const EXPRESSIONS = {
  H: [['오늘은 네가 고른 방향으로 같이 걷자', '그럼 오늘 하나만. 나 또 세 군데 말하려고 했네.'], ['오늘은 바로 가고, 다음에 둘이 걸을 날 정하자', '좋아. 다음엔 안내 말고 약속이라고 적을게.']],
  HE: [['저도 선배 만날 시간을 정하고 싶어요', '좋아. 네 달력부터 봐.'], ['제가 먼저 데이트 신청해도 돼요?', '응. 이번 대답은 미리 해 둘게. 만나고 싶어.']],
  C: [['둘만 볼 사진을 남기자', '공개는 안 해도 오늘 기분은 못 숨기겠네.'], ['사진 대신 오늘 네가 좋았던 걸 말할게', '그건 나만 듣는 걸로. 좀 더 말해도 되고.']],
  NA: [['네가 가 보고 싶은 집부터 같이 보자', '그럼 첫 후보는 제가. 다음은 선배가 골라요.'], ['각자 한 집씩 골라서 만나자', '두 군데면 오래 걸리겠네요. ……저는 좋아요.']],
  MG: [['그럼 오늘은 아무것도 안 고치고 같이 걸어요', '좋아. 손은 비었네.'], ['방학엔 제가 쓸모없는 걸 하나 만들어 올게요', '안 움직여도 가져와. 너는 와야 하고.']],
  CA: [['다음엔 내가 먼저 같이 놀자고 할게', '네. 기다려 볼게요. 먼저 말하면 제가 진 걸로…… 아, 그것도 승부로 만들었네.'], ['게임 없는 날에도 만나자', '좋아요. 그날은 같이 걷는 쪽으로. 뛰지는 말고요.']],
  CL: [['이 문장 그대로 기억할게', '응. 오래된 광고보다 자주 떠올려도 되고.'], ['다음 문장은 내가 먼저 말할게', '그럼 난 듣는 쪽. 이번에는 끝까지.']],
  SOLO: [['도서관 이용 시간을 확인하고 간다', '공지에서 방학 이용 시간을 읽었다. 공책 모서리에 적고 다시 가방에 넣었다.'], ['오늘은 아무것도 정하지 않고 바로 귀가한다', '공책은 꺼내지 않았다. 교문 밖 소리가 더 가까워졌다.']],
};
function endingIntro(s, c) {
  const q = []; const memory = endingMemory(s, c);
  const hasMap = s.mid.personal.H || s.late.complete['H:T'] || s.late.complete['H:X'] || s.late.complete['H:R'];
  const starts = {
    H: [stage('교문에서 수소가 나란히 선다.'), d(c, '오늘은 학교 길 알려 줄 일도 없네'), stage(hasMap ? '수소가 접은 종이를 가방에 넣는다.' : '수소가 지도 소품 없이 오늘 교문 밖 두 방향을 가리킨다.')],
    HE: [stage('교문 근처의 조용한 자리에서 지금 새로 마주친다.'), d(c, '잠깐 같이 걸을래?')],
    C: [stage('교문 옆, 탄소가 오늘 학교 게시물을 돌아본 뒤 플레이어를 알아본다.')],
    NA: [stage('교문 게시판 옆. 나트륨이 자기 수첩을 넣다 플레이어를 보고 멈춘다.')],
    MG: [stage('교문 안쪽에서 마그네슘과 오늘 새로 마주친다.'), ...(!s.mid.play.MG && !s.late.complete['MG:T'] && !s.late.complete['MG:R'] ? [d(c, '이건 내 장난감')] : []), stage('마그네슘이 작은 종이 인형을 꺼내 움직인다.')],
    CA: [stage('교문으로 가는 운동장 가장자리에서 칼슘과 마주친다.')],
    CL: [stage('도서관 앞을 지나 교문으로 나오는 길에서 염소와 마주친다.')],
    SOLO: [me('종이 울렸는데 서둘러 들어갈 교실은 없었다. 집까지는 이제 안다. 오늘은 어느 쪽으로 갈까.')],
  };
  q.push(...starts[c]); if (memory && c !== 'SOLO') q.push(me(memory));
  if (c === 'H') {
    if (!s.mid.shared['H-two-seats'] && !s.late.complete['H:X'] && !s.late.complete['H:R']) q.push(d(c, '방학엔 내가 좋아하는 길 하나 보여 줄게'));
    q.push(d(c, '나, 방학 때도 불러도 돼? 길 모른다는 핑계는 이제 좀 안 통하니까.'), p('길 안 물어보고 너 만나자고 할게.'), d(c, '응. 그게 듣고 싶었어.'));
  }
  if (c === 'HE') {
    if (!s.mid.shared['HE-own-hands-done']) q.push(d(c, '내가 만들고 싶은 모형이 있어. 다음엔 처음부터 보여 줄게.'));
    q.push(stage('헬륨이 자기 일정의 빈 날을 보여 주며 만나고 싶은 시간을 직접 고른다.'), d(c, '할 일 없는 날이라서 만나자는 건 아니야. 너를 만나고 싶어서 남겨 뒀어.'), p('그날도 각자 퍼즐 보실 건가요?'), d(c, '그럴 수도 있지. 끝나고 네가 무슨 생각 했는지 듣고 싶고. ……나 너 좋아해. 이건 추측 문제로 안 낼게.'));
  }
  if (c === 'C') q.push(d(c, '오늘 거 하나 남길까? 사진도 좋고, 그냥 기억해도 되고.'), p('네가 왜 남기고 싶은지가 더 궁금해.'), d(c, '좋아하는 사람이랑 방학 시작한 날이니까. ……이 정도면 티 좀 났지?'), p('응. 나도 같은 이유로 남기고 싶어.'));
  if (c === 'NA') {
    if (['unresolved', 'watching'].includes(s.mid.sodium.status)) q.push(p('전에 네 말을 덮은 건 미안해. 오늘 고르는 건 네가 말해 줘.'), d(c, '그 일은 아직 불편해요. 그래도 지금 선배를 좋아하는 마음까지 없는 건 아니에요. 그 얘기는 앞으로도 할 거예요.'));
    q.push(d(c, '어느 집이 제일 좋은지는 아직 몰라요. 그래도 선배랑 가고 싶은 건 정했어요.'), p('빵 때문이야, 나 때문이야?'), d(c, '빵만이면 혼자도 가요.'), stage('나트륨이 잠깐 멈춘다.'), d(c, '선배 좋아해요. 그건 확인 질문 안 받을래요.'));
  }
  if (c === 'MG') q.push(d(c, '끝났어.'), p('그럼 가실 거예요?'), d(c, '인형 얘기. 난 조금 더.'), stage('잠깐 뒤, 마그네슘이 말한다.'), d(c, '너랑 있고 싶어서.'), p('모형 없어도요?'), d(c, '응. 좋아하니까. 너.'));
  if (c === 'CA') q.push(d(c, '방학에도 한 번 더 같이 놀아요.'), p('몇 번까지?'), d(c, '그건…… 제가 자꾸 늘릴 것 같은데요.'), stage('칼슘이 웃는다.'), d(c, '그래서 먼저 말할게요. 선배 좋아해요. 재경기 핑계 안 대도 만나고 싶어요.'), p('나도. 이기면 끝나는 약속 말고.'));
  if (c === 'CL') q.push(d(c, '여기서만 들어 줘. 오늘 문장은 짧아.'), p('응. 듣고 있어.'), d(c, '너 좋아해.'), stage('잠깐 침묵한다.'), p('다른 뜻은?'), d(c, '이번엔 없어. 덧붙이면 내가 도망갈 것 같아서.'), p('나도 좋아해.'), d(c, '……그 답은 고칠 데 없네.'));
  return q;
}
function confirmation(s, c) {
  return {
    H: [p('좋아해. 길 모를 때만 찾는 사이 말고, 너랑 사귀고 싶어.'), d(c, '응. 나도 너 좋아해. 방학이라고 안 숨을게.')],
    HE: [p('저도 선배 좋아해요. 연인으로 만나고 싶어요.'), d(c, '응. 나도 그렇게 만나고 싶어.'), stage(s.late.complete['HE:L'] ? '각자 자기 일정 수첩과 가방을 넣고 마주 본다.' : '각자 가방을 넣고 마주 본다.')],
    C: [p('사진을 남기든 안 남기든, 너랑 사귀고 싶어.'), d(c, '좋아. 나도 너랑. 지금은 나만 보고 말해 줘.')],
    NA: [p('나도 너 좋아해. 연인으로 만나자.'), d(c, '네. 제가 가고 싶은 곳도 제가 말할게요. 선배도요.'), d(c, '전 바삭한 빵이 있는 곳'), p('난 오래 앉을 수 있는 자리'), d(c, '먼저 볼 건 서로 말했네요.')],
    MG: [p('저도 좋아해요. 선배랑 사귀고 싶어요.'), d(c, '응. 나도.'), stage('마그네슘이 오늘 교문에서 보여 준 인형을 스스로 가방에 넣고 빈손으로 나란히 선다.')],
    CA: [p('나도 연인으로 만나고 싶어.'), d(c, '네. 저도요. 이건 재경기 말고 새 약속이에요.')],
    CL: [p('나도 같은 뜻으로 말할게. 너랑 사귀고 싶어.'), d(c, '응. 그 뜻으로 들었어. 나도.')],
  }[c];
}
export function endingScene(s, id, api) {
  if (!endingSceneId(id)) return false;
  if (s.day !== 30 || !s.exam2.returned || !s.period.actions[30]?.lunch || !s.period.actions[30]?.afterSchool) throw new Error('방학식의 두 행동과 귀가 뒤 결말을 확인할 수 있습니다.');
  if (s.ending?.completed && id !== 'END-FINISH') return endingScene(s, 'END-FINISH', api);
  if (id === 'END-ENTRY' && s.ending?.selected) return true;
  if (id.startsWith('END-') && !['END-ENTRY', 'END-FINISH'].includes(id) && s.ending?.expression !== null && s.scene === id) return true;
  s.scene = id; s.time = id === 'END-FINISH' ? '이야기 완료' : '방학식 · 귀가'; s.location = '교문'; s.cast = []; s.eventId = `ENDING:${id}`;
  let q = []; let after = null;
  if (id === 'END-ENTRY') {
    if (!s.ending) { const candidates = endingCandidates(s); s.ending = { version: 1, candidates, selected: candidates.length === 0 ? 'SOLO' : candidates.length === 1 ? candidates[0] : null, expression: null, completed: false }; }
    const n = s.ending.candidates.length;
    q = [me(n === 0 ? '혼자 서니 교문이 평소보다 넓어 보였다.' : n === 1 ? '교문 앞에서 그 사람을 알아봤다.' : '오늘은 누구에게 내 마음을 말하고 싶을까.')];
    after = s.ending.selected ? `END-${s.ending.selected}` : null;
  } else if (id === 'END-FINISH') {
    if (!s.ending || s.ending.expression === null || !s.ending.selected) throw new Error('결말의 마지막 말을 먼저 확인해 주세요.');
    s.ending.completed = true;
    q = [{ who: '이야기 완료', kind: 'narration', text: '이 이야기는 여기까지입니다. 방학식까지의 진행과 선택한 결말을 저장했습니다.' }];
  } else {
    const c = id.slice(4); if (s.ending?.selected !== c) throw new Error('저장한 최종 선택과 다른 결말입니다.');
    s.cast = c === 'SOLO' ? [] : [c]; q = endingIntro(s, c);
  }
  api.queue(s, q, after); return true;
}
export function endingOptions(s, api) {
  const opt = (label, run, extra = {}) => ({ label, run, disabled: false, ...extra });
  if (s.scene === 'END-FINISH') return [opt('결말 화면에 머물기', () => {}), opt('시작 화면으로', () => {}, { home: true })];
  if (s.scene === 'END-ENTRY' && s.ending.selected === null) return s.ending.candidates.map(c => opt(PEOPLE[c], () => {
    if (s.scene !== 'END-ENTRY' || s.ending.selected || !api.record(s, 'ENDING:SELECT', c)) return;
    s.ending.selected = c; s.cast = [c];
    api.queue(s, [p(['HE', 'MG'].includes(c) ? '잠깐 이야기할 수 있을까요?' : '잠깐 이야기할 수 있을까?'), d(c, ['NA', 'CA'].includes(c) ? '네' : '응')], `END-${c}`);
  }));
  const c = s.ending.selected;
  if (s.scene !== `END-${c}` || s.ending.expression !== null) return [];
  return EXPRESSIONS[c].map(([label, response], i) => opt(label, () => {
    if (s.scene !== `END-${c}` || s.ending.expression !== null || !api.record(s, 'ENDING:EXPRESSION', i)) return;
    s.ending.expression = i; const q = [p(label)];
    if (c === 'SOLO') {
      q.push(me(response)); const memory = endingMemory(s, c);
      q.push(me(memory || (s.mid.personal && Object.keys(s.mid.personal).length ? '가방이 조금 가벼워진 기분이었다.' : '처음엔 기호만 따라 적던 노트에, 지금은 왜 그렇게 썼는지 한 줄을 붙일 수 있었다.')));
    } else {
      if (c === 'C' && i === 0) q.push(stage('종이 배치와 함께 서는 범위를 지금 동의한 뒤 촬영한다.'));
      q.push(d(c, response));
      if (c === 'C' && i === 1) q.push(p('오늘은 사진 찍기 전에 먼저 물어봐 준 게 좋았어'), d(c, '네가 무슨 답 할지, 나도 궁금했거든'));
      q.push(...confirmation(s, c));
    }
    const snap = `SNAP-END-${c}`;
    if (!s.snaps[snap]) q.push({ who: '이벤트 스냅', text: '', snap, cast: c === 'SOLO' ? [] : [c], kind: 'narration' });
    q.push(c === 'SOLO' ? p(FINAL[c]) : d(c, FINAL[c])); api.queue(s, q, 'END-FINISH');
  }));
}
export function validEnding(s) {
  const e = s.ending;
  if (!e) return !endingSceneId(s.scene);
  return e.version === 1 && s.day === 30 && endingSceneId(s.scene) && Array.isArray(e.candidates) && new Set(e.candidates).size === e.candidates.length &&
    JSON.stringify(e.candidates) === JSON.stringify(endingCandidates(s)) &&
    (e.selected === null ? e.candidates.length > 1 : e.selected === 'SOLO' ? e.candidates.length === 0 : e.candidates.includes(e.selected)) &&
    (e.expression === null || [0, 1].includes(e.expression) && e.selected !== null) && typeof e.completed === 'boolean' &&
    (e.selected !== null || s.scene === 'END-ENTRY') &&
    (!e.selected || ['END-ENTRY', `END-${e.selected}`, 'END-FINISH'].includes(s.scene)) &&
    (!e.completed || s.scene === 'END-FINISH' && e.expression !== null) && (s.scene !== 'END-FINISH' || e.completed) &&
    Boolean(s.period.actions[30]?.lunch && s.period.actions[30]?.afterSchool);
}
