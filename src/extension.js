import { RULES } from './config.js';
import { responseLines, heliumReading, chlorineReview, followAction } from './presentation.js';
import { title } from './script.js';
import { lessonCards } from './learning.js';
import { personalEligible } from './mid.js';
import { uncomfortable } from './chronology.js';
import { enterChoiceContent, recordMeaning, choiceAmount, pastMeaning } from './choice-content.js';
import { PEOPLE, PLACES, lunchPeople, lunchPlaceLabel, MET_EVENTS, say, stage, bullets, quotes, clean, actorLines,
  dayParts, PERIOD_NOTES, EXAM, EXAM_POINTS, SNAPS, invitation, introduction, meetOptions,
  mainRows, repeatRow, followRow, quietLine, RELATIONS } from './period.js';

export function initPeriod(s) {
  s.period ||= { met: {}, re: {}, labs: {}, follows: {}, promises: {}, invite: null, person: null, actions: {}, history: [] };
  s.snaps ||= {};
  s.exam ||= { answers: Array(EXAM.length).fill(null), index: 0, submitted: false, result: null, returned: false };
  Object.entries(MET_EVENTS).forEach(([code, key]) => { if (s.events[key]) s.period.met[code] = true; });
}
export function markCurrent(s) {
  const q = s.queue[s.index]; if (!q) return;
  if (q.displayEvent) s.events[q.displayEvent] = true;
  if (q.note && !s.notes.includes(q.note)) s.notes.push(q.note);
  if (q.complete) s.period[q.complete.type][q.complete.code] = true;
  if (q.effect) {
    for (const [key, value] of Object.entries(q.effect)) s.period.promises[key] = value;
  }
  if (q.invite) s.period.invite = { day: s.day, code: q.invite };
  if (q.snap && !s.snaps[q.snap]) s.snaps[q.snap] = { day: s.day, event: s.eventId };
}
const isRude = s => s.mid ? uncomfortable(s) : s.events.takeover || s.events.dismiss;
const nextDay = s => s.day === 9 ? 'D10-AM' : `D${s.day + 1}-AM`;
const lunchEnd = s => s.day === 10 ? 'EX-AF' : s.day === 2 ? 'D2-AF' : 'AF-SELECT';
const has = (s, code) => s.period.met[code];
const seenWater = s => s.lab.observations.some(o => o.sample === 'water');
const event = (s, id) => `DAY-${s.day}:${id}:${s.period.person || 'PLAYER'}`;
export function periodScene(s, id, api) {
  if (!/^(D\d+-AM|D\d+-NOTE|D\d+-RECESS|D2-(AF|H|HE|C|CA)|LUNCH-|MEET-|RE-|TALK-REPEAT|AF-SELECT|LAB-|AF-QUIET|D10-|EX-|AF-EX|DAY11-HANDOFF)/.test(id)) return false;
  const { queue } = api; const p = s.period; const code = p.person; const person = PEOPLE[code];
  s.scene = id;
  s.eventId = event(s, id);
  enterChoiceContent(s, id);
  let q = [];
  let after = null;
  if (/^D[3-9]-AM$/.test(id)) {
    s.day = Number(id.match(/\d+/)[0]); p.invite = null; p.person = null; s.place = '';
    s.time = '아침'; s.location = '교실'; s.cast = s.day === 9 ? ['H', 'C'] : s.day % 2 ? ['H'] : ['C'];
    q = dayParts(s.day).morning; after = `D${s.day}-NOTE`;
  } else if (/^D[3-9]-NOTE$/.test(id)) {
    s.time = '수업'; s.location = '교실'; s.cast = [];
    const note = `D${s.day}-NOTE`; q = [say('수업 핵심 노트', PERIOD_NOTES[note], { note }), ...lessonCards(note)]; after = `D${s.day}-RECESS`;
  } else if (/^D[3-9]-RECESS$/.test(id)) {
    s.time = '쉬는 시간'; s.cast = s.day === 9 ? ['H', 'C'] : s.day % 2 ? ['H'] : ['C']; q = dayParts(s.day).recess;
  } else if (/^D2-(H|HE|C|CA)$/.test(id)) {
    s.cast = [code]; q = actorLines(bullets(id)[1]);
    after = has(s, code) ? `RE-${code}` : `MEET-${code}`;
  } else if (id === 'LUNCH-SELECT') {
    s.time = '점심 · 급식 뒤'; s.location = '장소 선택'; s.cast = []; s.place = ''; p.person = null;
    q = [say('플레이어 독백', '점심 먹고 남은 시간, 어디로 갈까.')];
  } else if (id === 'LUNCH-ACTION') {
    s.time = '점심 · 급식 뒤'; s.location = s.place; s.cast = []; q = [stage(`${s.place}에 도착했다.`)];
  } else if (id === 'LUNCH-PERSON') {
    q = [say('플레이어 독백', '누구에게 말을 걸까?')]; s.cast = [];
  } else if (id === 'LUNCH-STUDY') {
    const line = bullets(id).find(l => l.includes(`**${s.place}:`));
    q = [say('플레이어 독백', quotes(line)[0]), ...s.notes.map(n => say('받은 핵심 노트 재열람', api.notes[n] || PERIOD_NOTES[n]))];
    s.cast = [];
  } else if (id === 'LUNCH-SKIP' || id === 'LUNCH-EMPTY') {
    const line = bullets(id).find(l => l.includes('옥상 “'));
    q = [say('플레이어 독백', quotes(line)[PLACES.indexOf(s.place)])]; s.cast = [];
  } else if (id.startsWith('MEET-')) {
    s.cast = [code]; q = introduction(code);
    if (q.length) q[q.length - 1].met = code;
  } else if (id.startsWith('RE-')) {
    s.cast = [code];
    if (code === 'H') {
      q = [say(person, '이 지도는 빠른 길만 넣으면 끝나는데, 일부러 천천히 걷고 싶은 길도 있어.')];
      if (s.events.recordTaste) q.push(say(person, '그 정류장도 적고 싶고.'));
    } else {
      q = actorLines(bullets(id).filter(l => !l.includes('**조건')).join('\n'));
      if (code === 'HE') q.splice(1, 0, ...heliumReading());
      if (code === 'MG') q.push(stage('종이에는 ‘입구 → 대기 자리’ 다음으로 ‘무대 뒤 → 퇴장’이 있고 두 줄을 잇는 화살표만 비어 있다.'));
    }
  } else if (id === 'TALK-REPEAT') {
    s.cast = [code]; q = actorLines(repeatRow(code)[0]);
  } else if (['D2-AF', 'AF-SELECT', 'EX-AF'].includes(id)) {
    s.time = '방과후'; s.location = '교실 앞'; s.cast = [];
    q = [say('플레이어 독백', id === 'D2-AF' ? '오늘 남은 시간은 어떻게 보낼까.' : '남은 시간은 혼자 보낼 수도, 오늘 들은 일에 함께할 수도 있다.')];
  } else if (id.startsWith('LAB-') && id !== 'LAB-FOLLOW' && id !== 'LAB-CL-read') {
    s.time = '방과후'; s.location = '과학실 · 자료 좌석'; s.cast = [code];
    if (code === 'NA') {
      q = [say(person, s.events.experimentCompleted ? '그날 실제로 측정한 칸과 노트로 아는 칸은 구별했죠.' : '수업에서 배운 설명과 직접 확인한 기록은 구별해야겠죠. 오늘 우리가 측정한 결과는 없고요.')];
      if (s.events.experimentCompleted && !seenWater(s)) q.push(say(person, '물은 그날 안 봤다고 남겼고요.'));
      q.push(say(person, s.events.crispyTaste ? '이건 제 빵집 지도예요. 전에 말한 바삭한 빵도요. 가격은 좀 고민돼요. 그런데 이걸 남도 납득할 순위로 적으려니 계속 비워 둬요.' : '이건 제 빵집 지도예요. 전 바삭한 빵이 좋은데 가격은 좀 고민돼요. 그런데 이걸 남도 납득할 순위로 적으려니 계속 비워 둬요.'));
      if (isRude(s)) q.push(say(person, '전에 제 역할을 제한한 말은 아직 마음에 걸려요.'));
    } else if (code === 'CL') {
      q = [chlorineReview(), ...actorLines(bullets(id)[1])];
    } else {
      q = actorLines(bullets(id).filter(l => !l.includes('**조건') && !l.includes('**앞선')).join('\n'));
      if (code === 'C' && (p.promises.carbonFocus || pastMeaning(s, 'RE-C'))) q.push(say(person, {
        'C-READABILITY': '큰 제목 쪽에 한 표였지. 개인 건 이쪽에 둘게.',
        'C-FOCUS-LEGACY': '한 장에 집중하자는 얘기도 생각해 봤어. 그래도 이건 내 공책에 남기려고.',
      }[pastMeaning(s, 'RE-C')] || '게시할 건 이쪽, 내가 보관할 건 저쪽.'));
      if (code === 'CA' && p.promises.caLunchStop) q.push(say(person, '전에 정한 데서 멈췄으니 이번에도 믿고 물어볼게요.'));
      if (code === 'CA') q.splice(1, 0, stage('자료 검토를 마친다.'));
      if (code === 'MG') q.splice(-1, 0, stage('종이 모형의 동작이 어긋나자 마그네슘이 설명 없이 접는 곳을 바꾼다.'));
    }
  } else if (id === 'LAB-CL-read') {
    q = [stage('“문을 닫으려다 손잡이에서 손을 뗐다. ‘다음엔 네가 닫아.’ 그 말만 남았다.”')];
  } else if (id === 'LAB-FOLLOW') {
    s.time = '방과후'; s.location = '과학실 · 자료 좌석'; s.cast = [code];
    let text = quotes(followRow(code)[0]);
    const conditional = { HE: 'heAgreement', MG: 'mgAttempt', CA: 'caPlayed', CL: 'clRead' };
    if (conditional[code]) text = [text[p.promises[conditional[code]] ? 0 : 1]];
    q = text.map(t => say(person, t));
    if (code === 'NA' && isRude(s)) q.push(say(person, '전에 제 역할을 제한한 말은 아직 마음에 걸려요.'));
  } else if (id === 'AF-QUIET' || id === 'AF-EX') {
    s.time = '방과후'; s.location = '과학실 · 자료 좌석'; s.cast = [code]; q = [quietLine(id, code)];
  } else if (id === 'D10-AM') {
    s.day = 10; p.invite = null; p.person = null; s.place = ''; s.time = '아침'; s.location = '교실'; s.cast = ['H', 'C'];
    q = actorLines(bullets(id).slice(1, 3).join('\n'));
  } else if (id === 'EX-START') {
    s.time = '시험 안내'; s.location = '교실'; s.cast = []; q = actorLines(bullets(id)[1]);
  } else if (id === 'EX-PAPER' || id === 'EX-RESULT') {
    s.time = id === 'EX-PAPER' ? '첫 시험' : '시험 결과'; s.location = '교실'; s.cast = [];
  } else if (id === 'EX-AFTER') {
    s.time = '점심 · 급식 뒤'; s.location = '교실'; s.cast = ['H', 'C'];
    q = actorLines(bullets(id).slice(1, 4).join('\n')); after = 'LUNCH-SELECT';
  } else if (id.startsWith('EX-') && PEOPLE[id.slice(3)]) {
    s.cast = [code]; q = actorLines(bullets(id)[1]);
  } else if (id === 'DAY11-HANDOFF') {
    s.time = '귀가'; s.location = '10일차 완료'; s.cast = [];
    q = [say('플레이어', '내일도 학교는 이어진다.'), say('진행 확인', '첫 시험 결과와 지금까지의 기록을 보존하고 11일차로 이어갈 수 있습니다.')];
  } else return false;
  s.eventId = event(s, id);
  queue(s, q.filter(Boolean), after);
  return true;
}

export function periodOptions(s, api) {
  const { enter, queue, score, record } = api;
  const id = s.scene; const p = s.period; const code = p.person; const person = PEOPLE[code];
  const eventKey = s.eventId;
  const option = (label, run) => ({ label, run, disabled: false });
  const respond = (response, target) => queue(s, response, target);
  const select = (label, i, response, target, { amount = 0, effect = {}, rewardKey = s.eventId } = {}) => option(label, () => {
    if (s.scene !== id || s.eventId !== eventKey) return;
    if (!record(s, eventKey, i)) return;
    recordMeaning(s, id, i);
    score(s, rewardKey + ':relation', person, amount);
    p.history.push({ day: s.day, who: person || '플레이어', title: title(id) || title(id.split('-read')[0]) || '학교생활', text: label });
    // 효과는 즉시 응답을 실제로 마친 뒤 복귀 줄에 도달할 때 기록한다.
    const end = response[response.length - 1];
    if (end) end.effect = { ...(end.effect || {}), ...effect };
    respond(response, target);
  });
  const invited = p.invite?.day === s.day ? p.invite.code : null;
  const finishLunch = (response, i, label, amount = 0, effect = {}) => {
    const invite = invitation(code); if (invite.length) invite[invite.length - 1].invite = code;
    return select(label, i, [...response, ...invite], lunchEnd(s), { amount, effect });
  };
  const finishLab = (label, i, response, returnLine, amount, snap, effect = {}, rewardKey) => {
    const entries = [...response];
    // 실제 응답·행동 이후 스냅, 그 뒤 복귀 대사. 완료 기록도 이 위치를 따른다.
    const complete = id === 'LAB-FOLLOW' ? code === 'HE' && i === 1 ? null : { type: 'follows', code } : { type: 'labs', code };
    if (snap && !s.snaps[snap]) entries.push(say('스냅', SNAPS[snap].description, { snap, effect, complete }));
    entries.push(say(person, returnLine, { effect, complete }));
    return select(label, i, entries, nextDay(s), { amount, rewardKey });
  };
  if (/^D[3-9]-RECESS$/.test(id)) return [select('노트를 확인하고 점심 장소 고르기', 0, actorLines(bullets(`D${s.day}-AM`).at(-1)), 'LUNCH-SELECT')];
  if (id === 'LUNCH-SELECT') return PLACES.map(place => ({ place, ...option(lunchPlaceLabel(s.day, place), () => {
    if (!record(s, `DAY-${s.day}:LUNCH:place`, place)) return;
    s.place = place; enter(s, 'LUNCH-ACTION');
  }) }));
  if (id === 'LUNCH-ACTION') return ['대화', '공부', '스킵'].map(action => option(action, () => {
    if (!record(s, `DAY-${s.day}:LUNCH:action`, action)) return;
    p.actions[s.day] = { ...(p.actions[s.day] || {}), lunch: action };
    p.history.push({ day: s.day, who: '플레이어', title: '점심', text: `${s.place} · ${action === '스킵' ? '휴식' : action}` });
    const people = lunchPeople(s.day, s.place);
    if (action !== '대화') enter(s, action === '공부' ? 'LUNCH-STUDY' : 'LUNCH-SKIP');
    else if (people.length > 1) enter(s, 'LUNCH-PERSON');
    else if (people.length === 1) visit(people[0]);
    else enter(s, 'LUNCH-EMPTY');
  }));
  function visit(target) {
    p.person = target;
    enter(s, !has(s, target) ? `MEET-${target}` : s.day === 10 ? `EX-${target}` : !p.re[target] ? `RE-${target}` : 'TALK-REPEAT');
  }
  if (id === 'LUNCH-PERSON') return lunchPeople(s.day, s.place).map(target => option(PEOPLE[target], () => {
    if (!record(s, `DAY-${s.day}:LUNCH:person`, target)) return;
    visit(target);
  }));
  if (['LUNCH-STUDY', 'LUNCH-SKIP', 'LUNCH-EMPTY'].includes(id)) return [select(id === 'LUNCH-STUDY' ? '노트 재열람 마치기' : id === 'LUNCH-SKIP' ? '쉬는 시간 마치기' : '혼자 둘러보고 마치기', 0, [say('플레이어', id === 'LUNCH-STUDY' ? '확인한 데까지만 기억해 두자.' : '다음 일과로 가자.')], lunchEnd(s))];
  if (id.startsWith('MEET-')) return meetOptions(code).map((o, i) => select(o.label, i, [say(person, o.response)], i === 0 ? s.day === 10 ? `EX-${code}` : `RE-${code}` : lunchEnd(s)));
  if (id.startsWith('RE-')) return mainRows(id, s).map((row, i) => {
    const effect = code === 'CA' && i === 0 ? { caLunchStop: true, caPlayed: true } : code === 'CA' && i === 2 ? { caPlayed: true } : code === 'C' && i === 1 ? { carbonFocus: true } : {};
    const o = finishLunch(responseLines(id, i, s), i, clean(row[0]), choiceAmount(s, id, i, RELATIONS[id][i]), effect);
    const run = o.run; o.run = () => { if (Object.hasOwn(s.choices, s.eventId)) return; run(); s.queue.at(-1).complete = { type: 're', code }; }; return o;
  });
  if (id === 'TALK-REPEAT') return repeatRow(code).slice(1).map((text, i) => {
    const [label, response] = quotes(text);
    const invite = invitation(code); invite.at(-1).invite = code;
    return select(label, i, [say(person, response), ...invite], lunchEnd(s), { amount: i === 0 ? code === 'HE' ? 2 : 3 : 0, rewardKey: `TALK-REPEAT:${code}` });
  });
  if (['AF-SELECT', 'D2-AF', 'EX-AF'].includes(id)) {
    const target = invited;
    const result = [option('자유 행동 · 혼자 정리하고 귀가', () => {
      if (!record(s, `DAY-${s.day}:AF:action`, '자유 행동')) return;
      p.actions[s.day] = { ...(p.actions[s.day] || {}), afterSchool: '자유 행동' };
      const q = [say('플레이어', s.day === 10 ? '첫 시험을 마쳤다. 오늘은 여기까지 하고 돌아가자.' : '오늘은 혼자 정리하고 돌아가자.')];
      if (target && s.day !== 10) {
        q[0].cast = [target];
        q.push(say(PEOPLE[target], quotes(mainRows('AF-SELECT').find(r => r[0] === PEOPLE[target])[2])[1]));
      }
      respond(q, s.day === 10 ? 'DAY11-HANDOFF' : nextDay(s));
    })];
    if (target) result.push(option(`${PEOPLE[target]}와 함께하기`, () => {
      if (!record(s, `DAY-${s.day}:AF:action`, target)) return;
      p.actions[s.day] = { ...(p.actions[s.day] || {}), afterSchool: target }; p.person = target;
      p.history.push({ day: s.day, who: PEOPLE[target], title: '방과후', text: '자료 좌석에서 함께해도 되는지 물었다.' });
      let q; let next;
      if (s.day === 10) {
        q = [say('플레이어', ['HE', 'MG'].includes(target) ? '오늘 말씀한 자료 자리에서 잠깐 함께 있어도 될까요?' : '아까 말한 자료 자리에서 잠깐 같이 있어도 돼?'), say(PEOPLE[target], ['NA', 'CA'].includes(target) ? '네, 좋아요.' : '좋아.')]; next = 'AF-EX';
      } else {
        const row = mainRows('AF-SELECT').find(r => r[0] === PEOPLE[target]);
        q = [say('플레이어', quotes(row[1])[0]), say(PEOPLE[target], quotes(row[2])[0])];
        next = !p.labs[target] ? `LAB-${target}` : !p.follows[target] ? 'LAB-FOLLOW' : 'AF-QUIET';
      }
      q[0].cast = [target]; s.cast = [target]; respond(q, next);
    }));
    return result;
  }
  if (/^LAB-(H|HE|C|NA|MG|CA)$/.test(id)) return mainRows(id, s).map((row, i) => {
    let amount = choiceAmount(s, id, i, RELATIONS[id][i]); const effect = {}; let snap = i === 0 && ['H', 'C', 'NA', 'MG'].includes(code) ? `SNAP-${code}` : null;
    if (code === 'HE' && i === 0) effect.heAgreement = true;
    if (code === 'C' && i === 0) effect.carbonSaved = true;
    if (code === 'NA') { effect.naTaste = true; if (isRude(s) && amount > 0) amount = 0; }
    if (code === 'H' && i === 0) effect.busTalk = true;
    if (code === 'MG' && i === 0) effect.mgAttempt = true;
    if (code === 'CA' && i === 0) { effect.caPlayed = true; effect.caLabStop = true; if (p.promises.caLunchStop) { amount = RULES.major; snap = 'SNAP-CA'; } }
    const returnLine = quotes(row[3]).at(-1);
    return finishLab(clean(row[0]), i, responseLines(id, i, s), returnLine, amount, snap, effect);
  });
  if (id === 'LAB-CL') return [select('여기서만 읽어 볼게', 0, [say(person, '응. 읽고 떠오른 걸 말해 줘.')], 'LAB-CL-read', { effect: { clPrivate: true } }),
    finishLab('오늘은 읽지 않을게. 허락해 준 건 고마워.', 1, responseLines('LAB-CL', 2), '그럼 오늘은 안내문만 정리하자.', 0, null)];
  if (id === 'LAB-CL-read') return mainRows('LAB-CL').slice(0, 2).map((row, i) => finishLab(clean(row[0]), i, responseLines('LAB-CL', i), quotes(row[3]).at(-1), 5, i === 0 ? 'SNAP-CL' : null, { clRead: true }));
  if (id === 'LAB-FOLLOW') {
    const promise = p.promises;
    const data = {
      H: [['나도 오늘 보고 싶은 길을 말하고 싶어.', '오늘은 각자 노트를 보고 싶어.'], ['그럼 네 지도 없는 길부터 듣자.', '좋아. 옆에 있어도 서로 다른 걸 할 수 있지.'], '오늘 길 얘기는 여기까지.'],
      HE: [[promise.heAgreement ? '약속대로 막힌 곳만 표시해 직접 돌려주기' : '오늘 읽다가 막힌 곳만 함께 확인하기', '오늘은 더 검토할 여유가 없어요.'], ['빈 줄은 고치지 않았네. 내가 원한 검토야.', promise.heAgreement ? '날짜를 약속한 건 아니니까 오늘은 미뤄도 돼.' : '알겠어. 오늘은 더 검토하지 말자.'], '맡긴다는 게 전부 대신하라는 뜻은 아니네.'],
      C: [['오늘은 네가 개인적으로 고른 이유부터 듣고 싶어.', '나는 게시물 정리가 더 마음 편해.'], ['이 색은 아무도 안 골라도 보고 싶었어.', '그럼 오늘은 그쪽만 같이 보자.'], '오늘 고른 건 여기 남겨 둘래.'],
      NA: [['그때 좋아한 맛 옆에 오늘 느낌을 더 적어도 되지.', '난 한 번 고른 맛을 오래 좋아해서 지금은 비교만 해 보고 싶어.'], ['기록이 정답표는 아니네요.', '그럼 서로 다른 기록으로 남겨요.'], '오늘 기록은 오늘 날짜로 남겨요.'],
      MG: [['바뀐 단계만 함께 메모하고 서로 같은 순서를 따라 접기', '오늘은 설명을 들으며 구경할게요.'], ['이번엔 어디서 달라졌는지 둘 다 알겠네.', '응. 손을 안 대도 변한 곳은 말해 줄게.'], '안 된 단계도 같이 찾았으니 남겨 두자.'],
      CA: [[promise.caPlayed ? '아쉬웠던 수만 같이 보고 오늘은 끝낼래.' : '예시 수 하나만 보고 오늘은 끝낼래.', '오늘은 놀이 말고 쉬고 싶어.'], ['그 수만 보고 마치는 걸로요.', '좋아요. 그럼 저도 목록을 덮을게요.'], '오늘은 여기까지.'],
      CL: [[promise.clRead ? '밖에 옮기지 않고 개인 해석 메모를 지금 염소에게만 보여 주기' : '잡지의 한 표현을 함께 읽기', '오늘은 새 원고 대신 잡지 이야기만 하기'], [promise.clRead ? '공개용 설명으로 고치지 않았네. 그 메모는 여기 둘게.' : '좋아. 그 장엄한 광고부터 보자.', '좋아. 그 장엄한 광고부터 보자.'], '오늘 읽은 뜻은 오늘 자리에서 끝내자.'],
    }[code];
    return data[0].map((label, i) => {
      let amount = i === 0 ? code === 'HE' ? 3 : 5 : 0; let snap = null; const effect = {};
      if (i === 0 && code === 'HE' && promise.heAgreement) { amount = RULES.major; snap = 'SNAP-HE'; effect.heReturned = true; }
      if (i === 0 && code === 'MG' && promise.mgAttempt) { amount = RULES.major; effect.mgFollowed = true; }
      if (i === 0 && code === 'CL') { amount = promise.clRead && promise.clPrivate ? RULES.major : 5; if (promise.clRead) effect.clDelivered = true; }
      if (code === 'NA' && isRude(s)) amount = 0;
      const q = [];
      if (i === 0) q.push(...followAction(code, promise));
      q.push(say(person, data[1][i]));
      return finishLab(label, i, q, code === 'HE' && i === 1 ? '오늘은 여기까지만 보자.' : data[2], amount, snap, effect,
        code === 'HE' && i === 1 ? s.eventId + ':defer' : `LAB-FOLLOW:${code}`);
    });
  }
  if (id === 'AF-QUIET' || id === 'AF-EX') return [id === 'AF-EX' ? '나도 오늘 한 일만 적고 덮을게.' : '나도 내 노트를 조용히 볼게.', id === 'AF-EX' ? '말하지 않고 잠깐 같이 있고 싶어.' : '오늘 한 일 한 가지만 이야기하고 갈래?'].map((label, i) => select(label, i,
    [id === 'AF-QUIET' ? i === 0 ? stage('상대가 고개를 끄덕인다.') : say(person, '오늘은 여기서 함께 마무리한 걸로 하자.') : stage(i === 0 ? '상대가 정리를 마친다.' : '상대가 자리를 함께한다.'), ...(id === 'AF-EX' ? [say('플레이어', '같은 학교에서 첫 시험까지 보냈다. 다음에 무엇을 할지는 또 정하면 돼.')] : [])], id === 'AF-EX' ? 'DAY11-HANDOFF' : nextDay(s)));
  if (id === 'D10-AM') return [select('시험 안내 확인하기', 0, [say('플레이어', '내가 아는 것부터 차분히 확인하자.')], 'EX-START')];
  if (id === 'EX-START') return [select('시험 보기', 0, [say('플레이어', '시작하겠습니다.')], 'EX-PAPER')];
  if (/^EX-(H|HE|C|NA|MG|CA|CL)$/.test(id)) return bullets(id).filter(l => l.startsWith('- 선택')).map((line, i) => {
    const label = quotes(line)[0]; const response = actorLines(line.split('→')[1]);
    const memory = { H: ['busTalk', '종점 얘기도 나중에 더 하고 싶어.'], HE: ['heAgreement', '우리 원고 때처럼 범위부터 정했네.'], C: ['carbonSaved', '남겨 둔 그 시안은 잘 있어.'], NA: ['naTaste', '오늘 빵집 목록엔 시험 점수 칸이 없어요.'], MG: ['mgAttempt', '그때도 바뀐 곳을 찾으니 다시 볼 수 있었지.'], CA: ['caLunchStop', '놀 때처럼 멈출 수도 있는 거죠.'], CL: ['clRead', '내 글처럼 여러 뜻을 남겨도 되는 경우와 시험 문제는 구별해야겠네.'] }[code];
    if (p.promises[memory[0]] || code === 'NA' && s.events.crispyTaste) response.push(say(person, memory[1]));
    const inviteLine = actorLines(bullets(id).at(-1)).filter(q => q.text.includes('방과후')).at(-1);
    inviteLine.invite = code;
    return select(label, i, [...response, inviteLine], personalEligible(s, code) ? 'EX-PERSONAL' : 'EX-AF');
  });
  return [];
}

export function examAnswer(s, index, answer) {
  if (s.scene !== 'EX-PAPER' || s.exam.submitted || !EXAM[index] || !Number.isInteger(answer) || answer < 0 || answer > 3) return;
  s.exam.answers[index] = answer;
}
export function submitExam(s, enter) {
  if (s.scene !== 'EX-PAPER' || s.exam.submitted) return;
  const details = EXAM.map((q, i) => ({ id: q.id, answer: s.exam.answers[i], correct: q.correct, points: s.exam.answers[i] === q.correct ? EXAM_POINTS : 0 }));
  s.exam.result = { day: 10, score: details.reduce((n, d) => n + d.points, 0), details };
  s.exam.submitted = true; enter(s, 'EX-RESULT');
}
export function finishExam(s, enter) {
  if (s.scene !== 'EX-RESULT' || !s.exam.submitted || s.exam.returned) return;
  s.exam.returned = true; enter(s, 'EX-AFTER');
}
