import { PEOPLE, PLACES, lunchPeople, lunchPlaceLabel, stage } from './period.js';
import { MID_LESSONS, midLessonQueue, midLessonFeedback, lessonCards } from './learning.js';
import { initMid, uncomfortable } from './chronology.js';
import { d, me, MORNINGS, RECESSES, INTRO, SEEDS, INVITES, HINTS, CONSENT, PLAYS, PLAY_END, SHARED_KEYS,
  echoContent, nextContent, lateContent, PERSONAL, MID_TITLES } from './mid-content.js';

const clone = data => structuredClone(data);
export const midSceneId = id => typeof id === 'string' && (Object.hasOwn(MID_TITLES, id) || /^D1[1-5]-(AM|NOTE|RECESS)$/.test(id) || /^MID-PLAY-(H|HE|C|NA|MG|CA|CL|CL-READ)$/.test(id));
const prior = (day, s) => Number.isInteger(day) && day < s.day;
const shared = (s, code) => prior(s.mid.shared[SHARED_KEYS[code]], s);
const facts = (s, code) => ({ shared: shared(s, code), heAgreement: s.mid.heAgreementDay === 12,
  clRead: Boolean(s.mid.clReadDay), caRegret: Boolean(s.period.promises.caPlayed),
  mutual: shared(s, code) || prior(s.mid.shared[`mutual-${code}`], s) });
const hasR = (s, code) => prior(s.mid.personal[code], s);
export const personalEligible = (s, code) => Boolean(s.mid.metDates[code] && s.mid.metDates[code] < 10);
const lunchTarget = s => {
  const c = s.period.person; const m = s.mid;
  if (c === 'NA' && uncomfortable(s)) return m.sodium.status === 'unresolved' ? 'MID-NA-REPAIR' : prior(m.sodium.startedDay, s) ? 'MID-NA-CHECK' : 'MID-REST';
  if (!m.seed[c]) return 'MID-SEED';
  if (!m.echo[c] && prior(m.seed[c], s)) return 'MID-ECHO';
  if (c !== 'HE' && !m.late[c] && prior(m.echo[c], s)) return 'MID-LATE';
  return 'MID-REST';
};
const REST = {
  H: ['오늘은 길도 소리도 더 찾지 않을래. 그냥 이 자리가 좋네.', '창가를 골라야만 같이 앉을 수 있는 건 아니지.'],
  C: ['오늘은 잡지 안 펼쳐도 얘기할 게 있네.', '한 장을 완성하지 않고 가도 아쉽지만은 않아.'],
  NA: ['오늘은 책갈피 꽂는 데까지만 할래요.', '기록 안 하는 시간을 실제로 써 보죠.'],
  MG: ['오늘은 장난감도 휴연.', '공연을 안 해도 관객석은 있지.'],
  CA: ['오늘 점심은 수를 안 놓기로 했어요.', '다음 승부 말고 오늘 휴식부터요.'],
  CL: ['오늘은 왕도 신하도 책 속에서 쉬게 하자.', '새 한 줄 없이 끝나는 날도 문장은 남아.'], HE: ['오늘은 서로의 시간을 비워 두자.', '오늘은 여기까지 보고 가자.'],
};
function playIntro(s, c) {
  const r = hasR(s, c); const p = s.period.promises;
  return {
    H: [d(c, r ? '전에 길 얘기를 했으니, 오늘은 네가 먼저 골라 줬으면 했어.' : '내가 좋아하는 놀이 하나만 보여 줄까?'), stage('수소가 창가 두 자리를 가리킨다.'), d(c, '여행 안 가도 자리만 바꾸면 다른 소리가 들려. 누가 먼저 골라 볼래?')],
    C: [d(c, r ? '이번엔 게시용 말고 정말 내 취향이야.' : '개인 스크랩을 보여 주는 건 업무랑 좀 달라.'), d(c, '좋다고 말해 줬으면 하는 마음은 있어. 그래도 다 좋다고 하면 뭘 더 보여 줄지 모르겠어.'), stage('탄소가 빈티지 잡지의 작은 무늬와 여백을 가리킨다.'), d(c, '이 두 부분, 한 장에 남겨 보고 싶어. 원본은 자르지 말고 접은 종이 위에 그 위치만 표시하자.')],
    NA: [d(c, uncomfortable(s) ? `${s.mid.sodium.startedDay === s.day ? '아까' : '지난번에'} 제 말을 끝까지 들은 건 알겠어요. 그래도 결론을 맡기기는 아직 조심스러워요.` : s.mid.sodium.status === 'resolved' ? '이제 서로 다른 말을 적어도 괜찮을 것 같아요.' : '오늘은 가격 비교 말고, 좋아해서 망설이는 이야기를 할래요.'), d(c, '책갈피는 표처럼 생겼는데 제 마음대로 멈춰도 되거든요. 빵집 지도도 그렇게 쓰면 좋겠어요. 선배는 반대로 부드러운 쪽이 좋아도 되고요.')],
    MG: [d(c, s.period.labs.MG || s.choices[`MID:${s.mid.seed.MG}:MID-SEED:MG`] === 0 ? '그때 봤던 건 움직임, 오늘은 공연.' : '이 종이 자동인형은 내가 좋아서 만든 거야.'), d(c, '고치는 건 잠깐 접고, 공연인 척 한 번만 해 볼래? 대단한 건 안 일어나.')],
    CA: [d(c, p.caPlayed ? '같이 놀던 사람한테만 해 보고 싶었던 게 있어요.' : '처음 같이 노는 거면 예시 한 판으로 해 볼까요?'), d(c, '제 수를 칭찬해 달라는 건 아니에요. 서로 한 수씩 놓고, 상대의 수에서 좋았던 걸 한 번씩 말해 봐요.')],
    CL: [d(c, p.clRead ? '전에는 읽힌 뜻을 들었지. 이번엔 목소리로 듣고 싶어.' : '이건 처음 보여 주는 짧은 글이야. 공개용은 아니고.'), d(c, '여기서만 읽고 밖에 옮기지 말아 줘. 웃음이 안 나면 안 웃어도 돼.')],
    HE: [d(c, s.mid.heAgreementDay === 12 ? '각자 손으로, 물을 때만 설명. 오늘도 그 범위 괜찮니?' : '오늘은 내 모형을 처음부터 볼 수 있어. 손대기 전엔 물어봐 줘.')],
  }[c];
}
export function midScene(s, id, api) {
  if (!midSceneId(id)) return false;
  initMid(s);
  const p = s.period; const c = p.person;
  s.scene = id; s.cast = []; let q = []; let after = null;
  if (/^D1[1-5]-AM$/.test(id)) {
    s.day = Number(id.match(/\d+/)[0]); s.time = '아침'; s.location = '교실'; s.place = ''; p.person = null; p.invite = null;
    q = clone(MORNINGS[s.day]); after = `D${s.day}-NOTE`; s.cast = s.day === 11 || s.day === 15 ? ['H', 'C'] : s.day === 13 ? ['H'] : ['C'];
  } else if (/^D1[1-5]-NOTE$/.test(id)) {
    s.time = '수업'; s.location = '교실'; q = midLessonQueue(s.day);
  } else if (/^D1[1-5]-RECESS$/.test(id)) {
    s.time = '쉬는 시간'; q = clone(RECESSES[s.day]); s.cast = [11, 15].includes(s.day) ? ['H', 'C'] : s.day === 13 ? ['H'] : ['C'];
  } else if (id === 'MID-LUNCH') {
    s.time = '점심 · 급식 뒤'; s.location = '장소 선택'; p.person = null;
    q = [me('누굴 만나든, 혼자 있든 오늘 남은 시간 하나다.')];
  } else if (id === 'MID-ACTION') { s.location = s.place; q = [stage(`${s.place}에 도착했다.`)]; }
  else if (id === 'MID-PERSON') q = [me('오늘 이야기할 한 사람부터 고르자.')];
  else if (id === 'MID-INTRO') {
    s.cast = [c]; q = clone(INTRO[c]); q.at(-1).met = c;
  } else if (id === 'MID-SEED') { s.cast = [c]; q = [d(c, SEEDS[c][0])]; }
  else if (['MID-ECHO', 'MID-NEXT', 'MID-LATE'].includes(id)) {
    s.cast = [c]; q = (id === 'MID-ECHO' ? echoContent : id === 'MID-NEXT' ? nextContent : lateContent)(c, facts(s, c)).intro;
  } else if (id === 'MID-INVITE') {
    s.cast = [c];
    const text = c === 'HE' ? s.day === 12 ? '방과후 자료 자리에 잠깐 있을 거야. 작은 모형을 볼지부터 정하고 싶어.' : '오늘 방과후엔 그 자리에서 내 모형을 접어 볼 거야. 함께할지는 네가 정해.' : INVITES[c];
    q = [d(c, text)]; q.at(-1).invite = c;
    const hint = HINTS[c]?.[s.day] || (s.day === 15 ? ['NA', 'CA'].includes(c) ? '다음에 다시 여쭐게요.' : '다음에 시간 되는지 다시 묻자.' : null);
    if (hint) q.push(d(c, hint)); after = 'MID-AF';
  } else if (id === 'MID-AF') {
    s.time = '방과후'; s.location = '교실 앞'; q = [me('남은 시간은 내가 고를 수 있다.')];
  } else if (id.startsWith('MID-PLAY-') && id !== 'MID-PLAY-CL-READ') { s.cast = [c]; q = playIntro(s, c); }
  else if (id === 'MID-PLAY-CL-READ') {
    s.cast = ['CL']; q = [d('CL', '왕 “내일은 모든 숙제를 금한다.”\n신하 “그 명령도 내일까지 써 오셔야 합니다.”\n왕 “그럼 내일부터 왕을 쉬겠다.”')];
    q.at(-1).midCommit = { key: 'MID:clRead', type: 'clRead', code: 'CL' };
  } else if (id === 'MID-HE-PREP') { s.cast = ['HE']; q = [d('HE', '모형 설명은 알아듣는데 접으면 자꾸 비뚤어져. 남이 만들어 준 걸 전시하고 싶은 건 아니야.')]; }
  else if (id === 'MID-NA-REPAIR') {
    s.cast = ['NA']; q = [d('NA', s.events.takeover ? '전에 제 대신 정해서 쓰겠다고 한 말은 따로 남아 있어요.' : '전에 제안을 하지 말라고 한 말은 따로 남아 있어요.'), d('NA', '취향 얘기를 해도 전에 제 의견을 필요 없다고 한 건 따로 남아 있어요.')];
  } else if (id === 'MID-NA-CHECK') { s.cast = ['NA']; q = [d('NA', '저는 아직 바삭한 빵이 좋아요. 선배가 다르게 골라도 제가 같은 쪽을 고를 수 있죠?')]; }
  else if (id === 'MID-REST') { s.cast = [c]; q = [d(c, REST[c][s.time === '방과후' ? 1 : 0])]; }
  else if (['MID-STUDY', 'MID-BREAK', 'MID-EMPTY'].includes(id)) {
    const texts = { 'MID-STUDY': ['종이가 날리지 않게 한 장만 보자.', '창가에서 오늘 비교를 다시 읽자.', '내 자리에서 표 두 칸부터 보자.', '오늘은 조용히 읽자.', '벤치에서 노트를 잠깐 펼치자.'],
      'MID-BREAK': ['구름은 안 외워도 되네.', '창밖을 보면서 눈을 쉬자.', '종이 울릴 때까지 잠깐 쉬자.', '책도 노트도 잠깐 덮자.', '멀리 보는 시간으로 쓰자.'],
      'MID-EMPTY': ['오늘은 바람 소리만 들리네.', '오늘 그 학생은 이쪽에 없구나.', '지금은 내 일을 할 시간인가 봐.', '찾던 자리는 비어 있네.', '여기서는 새 이야기를 못 듣겠네.'] };
    q = [me(texts[id][PLACES.indexOf(s.place)])];
  } else if (id === 'MID-NOTE') {
    const n = s.mid.readingNote; q = [{ who: '받은 핵심 노트', text: api.notes[n], kind: 'narration' }, ...lessonCards(n)]; after = 'MID-STUDY';
  } else if (id === 'EX-PERSONAL') { s.cast = [c]; q = [me('시험지가 아니라 서로의 취향을 이야기해 볼까.')]; }
  else if (id === 'MID-CLOSE') {
    s.time = '귀가'; s.location = '학교 앞';
    const together = PEOPLE[p.actions[s.day]?.afterSchool]; s.cast = together ? [p.actions[s.day].afterSchool] : [];
    const texts = { 11: ['시험 다음 날도 내가 고른 하루였다.', '오늘 알게 된 건 문제의 답이 아니라 그 사람의 쉬는 방식이었다.'], 12: ['못 한 일 목록 말고 오늘 쉰 시간도 남았다.', '잘하는 걸 보여 주지 않아도 같이 있을 수는 있구나.'], 13: ['오늘 듣지 않은 이야기는 아직 모르는 채로 두자.', '다음에 물어보고 싶은 건 생겼지만, 답을 이미 들은 척하진 말자.'], 14: ['모두 찾아다니지 않아도 하루는 끝난다.', '다시 만났다는 것보다 오늘 무엇을 새로 했는지가 남는다.'] };
    q = [me(s.day === 15 ? '오늘은 여기까지. 남은 말은 끝난 이야기가 아니라 다음에 물어볼 말이다.' : texts[s.day][together ? 1 : 0])];
  } else if (id === 'D15-NIGHT') {
    s.time = '밤'; s.location = '집'; const r = s.mid.reflections[15]; const who = r?.afterSchool || r?.lunch;
    const thoughts = { H: '안내할 길이 없어도 같이 듣고 싶은 소리가 생겼다.', HE: '대신 끝내 주지 않은 모형이어서 남은 시간이 있었다.', C: '좋다는 평가보다, 다음에 보여 주고 싶은 게 생긴 표정이 남았다.', NA: uncomfortable(s) ? '말을 끝까지 듣는 한 번으로 전부 돌아오진 않는다. 다음에도 내 결론으로 덮지 말아야겠다.' : '같은 답을 쓰지 않아도 줄은 나란히 놓일 수 있었다.', MG: '쓸모없는 공연에서 다음 첫 박자를 기다리게 됐다.', CA: '다음 수보다 같이 둘 사람의 반응이 궁금해졌다.', CL: '정답을 고치지 않고 다음 한 줄을 기대하는 시간도 있었다.' };
    q = [me(who ? thoughts[who] : '오늘 더 가까워졌다고 말할 수는 없어도, 아직 말을 걸 수 있는 날은 남아 있다.')];
    if (who) q.push(me(s.affinity[PEOPLE[who]] < 15 ? '서로의 취향을 하나 더 아는 정도.' : s.affinity[PEOPLE[who]] < 30 ? '다시 이야기하고 싶은 친구.' : '다음에 만나고 싶은 이유가 그 취미만은 아닐지도 모른다.'));
  } else if (id === 'DAY16-HANDOFF') { s.time = '범위 종료'; s.location = '15일차 완료'; q = [me('내일의 빈칸은 아직 내가 고를 수 있다.'), { who: '현재 제공 범위', text: '여기까지가 현재 제공된 1~15일차 범위입니다. 다음 학교생활로 이어집니다. 20일차 시험·30일차 방학식과 엔딩은 아직 포함되지 않습니다.', kind: 'narration' }]; }
  s.eventId = `MID:${s.day}:${id}:${p.person || 'PLAYER'}${id === 'MID-REST' ? ':' + s.time : ''}`;
  api.queue(s, clone(q), after); return true;
}

export function midOptions(s, api) {
  const id = s.scene; const p = s.period; const c = p.person; const m = s.mid;
  const opt = (label, run) => ({ label, run, disabled: false });
  const key = s.eventId;
  const choose = (label, value, lines, target, commit) => opt(label, () => {
    if (s.scene !== id || s.eventId !== key || !api.record(s, key, value)) return;
    const q = clone(lines).filter(line => !line.snap || !s.snaps[line.snap]);
    p.history.push({ day: s.day, who: PEOPLE[c] || '플레이어', title: MID_TITLES[id] || id, text: label });
    if (commit) q.at(-1).midCommit = { code: c, ...commit };
    api.queue(s, q, target);
  });
  const response = (choices, type, target, amount) => choices.map((choice, i) => choose(choice.label, i, choice.lines, target, {
    key: `MID:${type}:${c}`, type, amount: amount(i), positive: i === 0, shared: i === 0 ? choice.shared : null,
  }));
  if (id === 'DAY11-HANDOFF') return [opt('11일차로 이어가기', () => api.enter(s, 'D11-AM'))];
  if (/^D1[1-5]-NOTE$/.test(id)) return [choose(MID_LESSONS[s.day][2], 0, [me(MID_LESSONS[s.day][3]), midLessonFeedback(s.day)], `D${s.day}-RECESS`)];
  if (/^D1[1-5]-RECESS$/.test(id)) return [choose('점심 장소 고르기', 0, [me('오늘 일정을 보고 고르자.')], 'MID-LUNCH')];
  if (id === 'MID-LUNCH') return PLACES.map(place => ({ place, ...opt(lunchPlaceLabel(s.day, place), () => {
    if (!api.record(s, `DAY-${s.day}:LUNCH:place`, place)) return;
    s.place = place; api.enter(s, 'MID-ACTION');
  }) }));
  const visit = code => { p.person = code; api.enter(s, p.met[code] ? lunchTarget(s) : 'MID-INTRO'); };
  if (id === 'MID-ACTION') return ['대화', '공부', '휴식(스킵)'].map(action => opt(action, () => {
    if (!api.record(s, `DAY-${s.day}:LUNCH:action`, action)) return;
    p.actions[s.day] = { ...(p.actions[s.day] || {}), lunch: action };
    const people = lunchPeople(s.day, s.place);
    if (action !== '대화') api.enter(s, action === '공부' ? 'MID-STUDY' : 'MID-BREAK');
    else if (people.length > 1) api.enter(s, 'MID-PERSON'); else if (people.length) visit(people[0]); else api.enter(s, 'MID-EMPTY');
  }));
  if (id === 'MID-PERSON') return lunchPeople(s.day, s.place).map(code => opt(PEOPLE[code], () => {
    if (api.record(s, `DAY-${s.day}:LUNCH:person`, code)) visit(code);
  }));
  if (id === 'MID-INTRO') return [choose('조금 더 이야기해도 될까?', 0, [d(c, ['NA', 'CA'].includes(c) ? '네, 잠깐 괜찮아요.' : '응. 지금은 괜찮아.')], lunchTarget(s)), choose('오늘은 인사만 하고 갈게.', 1, [d(c, ['NA', 'CA'].includes(c) ? '네. 다음에 뵈어요.' : '응. 다음에 봐.')], 'MID-AF')];
  if (id === 'MID-SEED') return response(SEEDS[c][1], 'seed', 'MID-INVITE', i => i ? 0 : c === 'HE' ? 3 : 4);
  if (['MID-ECHO', 'MID-LATE', 'MID-NEXT'].includes(id)) {
    const type = id.slice(4).toLowerCase();
    const content = (type === 'echo' ? echoContent : type === 'late' ? lateContent : nextContent)(c, facts(s, c));
    return response(content.choices, type, type === 'next' ? 'MID-CLOSE' : 'MID-INVITE', i => i ? 0 : type === 'next' ? shared(s, c) && !(c === 'NA' && uncomfortable(s)) ? 8 : 5 : c === 'HE' ? 0 : 3);
  }
  if (id === 'MID-AF') {
    const result = [choose('혼자 공부하고 귀가', '공부', [me('오늘 받은 한 장만 보고 가자.'), ...lessonCards(`D${s.day}-NOTE`)], 'MID-CLOSE'), choose('혼자 쉬고 귀가', '휴식', [me('오늘은 아무것도 마저 하지 않고 갈래.')], 'MID-CLOSE')];
    const invited = p.invite?.day === s.day ? p.invite.code : null;
    if (invited) result.push(opt(`${PEOPLE[invited]}와 함께하기`, () => {
      if (!api.record(s, `DAY-${s.day}:AF:action`, invited)) return;
      p.person = invited; p.actions[s.day].afterSchool = invited; s.location = '과학실 · 교사 있는 자료 좌석';
      const target = invited === 'HE' ? s.day === 12 ? 'MID-HE-PREP' : 'MID-PLAY-HE' : !m.play[invited] ? `MID-PLAY-${invited}` : !m.next[invited] && prior(m.play[invited], s) ? 'MID-NEXT' : 'MID-REST';
      api.queue(s, [Object.assign(me(['HE', 'MG'].includes(invited) ? '아까 말씀한 시간, 같이 있어도 될까요?' : '아까 얘기한 것, 같이 해도 돼?'), { cast: [invited] }), d(invited, CONSENT[invited])], target);
    }));
    for (const o of result.slice(0, 2)) { const run = o.run; o.run = () => {
      if (!api.record(s, `DAY-${s.day}:AF:action`, o === result[0] ? '공부' : '휴식')) return;
      p.actions[s.day].afterSchool = o === result[0] ? '공부' : '휴식'; run();
    }; }
    return result;
  }
  if (id === 'MID-HE-PREP') return [
    choose('각자 하나씩 접고, 도와 달라고 한 부분만 말로 설명할까요? 선배 것은 선배 손으로 끝내고요.', 0, [d('HE', '좋아. 15일에 서로 시간이 맞으면 그렇게 해 보자. 내가 네 종이까지 고치려고 하면 말해 줘.'), d('HE', '오늘은 접는 것보다 내가 뭘 기대하는지 정한 시간이네.')], 'MID-CLOSE', { key: 'MID:agreement:HE', type: 'agreement' }),
    choose('오늘은 서툰 모형을 구경만 할게요. 다음 일정을 약속하진 않을래요.', 1, [d('HE', '알겠어. 잘 만든 것만 보여 줄 필요는 없겠지.'), d('HE', '오늘은 접는 것보다 내가 뭘 기대하는지 정한 시간이네.')], 'MID-CLOSE'),
  ];
  if (id === 'MID-PLAY-CL') return [choose('그 범위로 읽어 볼게.', 0, [d('CL', '좋아. 한 줄씩 맡자.')], 'MID-PLAY-CL-READ'), choose('오늘은 안 읽을래.', 1, [d('CL', '응. 원문은 접어 둘게.')], 'MID-CLOSE', { key: 'MID:play:CL', type: 'play' })];
  if (id.startsWith('MID-PLAY-')) {
    const entries = clone(PLAYS[c]);
    entries.forEach((choice, i) => {
      choice.lines = choice.lines.filter(line => !line.snap || !s.snaps[line.snap] && (c !== 'HE' || m.heAgreementDay === 12));
      if (c === 'H') choice.lines.push(d(c, i === 0 ? hasR(s, c) ? '안내할 일이 없어도 불러도 되겠네.' : '다음에 또 다른 소리가 들리는지 물어봐야겠다.' : '오늘은 이 창가를 기억할게.'));
      else choice.lines.push(d(c, c === 'HE' && m.metDates.HE === 15 ? '다음에도 같이 볼지는 그때 물어볼게.' : PLAY_END[c]));
      if (c === 'C' && i === 0 && p.promises.carbonFocus) choice.lines.push(d(c, '네가 무난한 쪽을 권했던 건 기억해. 오늘 내 쪽도 남긴 건 다른 얘기야.'));
      if (c === 'MG' && i === 0 && Object.entries(s.choices).some(([k, v]) => /:LAB-MG:MG$/.test(k) && v === 2)) choice.lines.push(d(c, '오늘은 고치기 전에 즐겨 보는 쪽이구나.'));
    });
    return response(entries, 'play', 'MID-CLOSE', i => c === 'HE' ? i === 0 ? m.heAgreementDay === 12 ? 8 : 4 : 0 : i === 0 ? hasR(s, c) && !(c === 'NA' && uncomfortable(s)) ? 8 : 5 : i === 1 ? 5 : 0);
  }
  if (id === 'MID-NA-REPAIR') return [
    choose('그때 네가 할 말을 내가 정해 버렸어. 미안해. 지금은 네가 무슨 얘길 할지 먼저 고르고 끝까지 말해 줘. 내가 다시 내 결론으로 바꾸지 않을게.', 0,
      [stage('나트륨이 기차표 모양 책갈피를 보여 준다.'), d('NA', '이 모양을 좋아해요. 다 읽은 책의 증거가 아니라 돌아가고 싶은 페이지에 꽂아요.'), stage('중간에 자기 해석을 덧붙이지 않고 듣는다.'), me('끝낸 기록이 아니라 돌아가고 싶은 자리라는 거지?'), d('NA', '맞아요. 그리고 다른 사람에게 쓸모없어 보여도 제가 고르는 거고요.'), me('그건 네가 고르는 그대로 둘게.'), d('NA', '아직 바로 편해지진 않아요. 그래도 방금 제 말을 들은 건 알아요.')], 'MID-INVITE', { key: 'MID:repair:NA', type: 'repair', amount: 4 }),
    choose('지금은 내 쪽 말을 먼저 정리하고 싶어. 이 얘기는 나중에 다시 해도 될까?', 1, [d('NA', '네. 해결됐다고 적진 않을게요.')], 'MID-AF'),
  ];
  if (id === 'MID-NA-CHECK') return [
    choose('응. 나는 오래 머무는 자리가 더 좋고, 넌 바삭한 빵이 먼저라고 했지. 내 추천으로 네 순위를 고치지 않을게.', 0,
      [stage('서로의 다른 우선순위를 한 줄씩 말한다. 나트륨이 자기 문구 하나를 바꾸려 한다.'), me('바꾸는 것도 네가 정해.'), d('NA', '오늘은 창가를 뒤에 적을래요. 제 쪽에서 고르는 거예요.'), stage('그 수정을 그대로 확인한다.'), d('NA', '그때 말은 아직 기억해요. 그래도 이번엔 제가 다르게 말해도 같이 있을 수 있겠네요.'), d('NA', '오늘 방과후엔 서로 적은 줄을 나란히 봐도 괜찮을 것 같아요.')], 'MID-INVITE', { key: 'MID:check:NA', type: 'check', amount: 4 }),
    choose('지금은 더 이야기할 여유가 없어. 오늘 다른 취미 얘기만 할 수 있을까?', 1, [d('NA', '네. 편해졌다고 결론내리지는 말고, 오늘은 책갈피만요.'), stage('책갈피 모양을 잠깐 본다.')], 'MID-INVITE'),
  ];
  if (id === 'MID-STUDY') return [...s.notes.map(n => opt(`${n} 다시 읽기`, () => { m.readingNote = n; api.enter(s, 'MID-NOTE'); })), choose('덮기', 0, [me('오늘 본 만큼만 남겨 두자.')], 'MID-AF')];
  if (['MID-BREAK', 'MID-EMPTY'].includes(id)) return [choose(id === 'MID-BREAK' ? '일과로 돌아가기' : '혼자 둘러보고 마치기', 0, [me('남은 시간도 천천히 정하자.')], 'MID-AF')];
  if (id === 'MID-REST') return [choose('오늘 내 취미는 혼자 조금 더 볼게.', 0, [d(c, ['NA', 'CA'].includes(c) ? '네, 오늘은 각자요.' : '응, 오늘은 각자.')], s.time === '방과후' ? 'MID-CLOSE' : 'MID-INVITE'), choose('잠깐 같이 조용히 있기', 1, [stage('서로 자기 책과 종이를 덮고 잠깐 앉는다.')], s.time === '방과후' ? 'MID-CLOSE' : 'MID-INVITE')];
  if (id === 'MID-CLOSE') return [choose('귀가', 0, [me('오늘 고른 하루를 남겨 두자.')], s.day === 15 ? 'D15-NIGHT' : `D${s.day + 1}-AM`)];
  if (id === 'D15-NIGHT') return [choose('다음 등교를 기다린다', 0, [me('다음에는 내가 먼저 어떤 말을 꺼낼까.')], 'DAY16-HANDOFF')];
  if (id === 'EX-PERSONAL') return response(PERSONAL[c], 'personal', 'EX-AF', i => i ? 0 : c === 'HE' ? 3 : 4);
  return [];
}
