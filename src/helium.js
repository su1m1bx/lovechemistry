import { SAVE_KEY } from './config.js';
import { say, stage } from './period.js';
import { lateDay, HE_REQUEST_DAYS, availableLate, lateEventScene, priorExchange } from './late-state.js';

export const HE_LEDGER_KEY = 'love-chemistry.helium-reservations.v1';
export const requestId = s => `${s.late.runId}:${s.day}:HE:afterSchool`;
export const heliumProbability = (affinity, refused) => refused >= 2 ? 1 : affinity < 15 ? 0.4 : affinity < 30 ? 0.5 : affinity < 80 ? 0.6 : 0.7;
const object = x => x && typeof x === 'object' && !Array.isArray(x);
const context = s => ({ probability: heliumProbability(s.affinity['헬륨'], s.late.helium.refused), refused: s.late.helium.refused,
  reason: ['T', 'P'].includes(s.late.days[s.day]?.event) ? 'puzzle' : 'rest',
  ...(s.day > 20 ? { event: availableLate(s, 'HE', 'afterSchool').find(e => ['B', 'J', 'K'].includes(e)) || null } : {}) });
const eligible = s => s.scene === 'LATE-AF-SELECT' && s.index === s.queue.length && HE_REQUEST_DAYS.includes(s.day) &&
  s.late?.days[s.day]?.person === 'HE' && s.late.days[s.day].confirmed && s.period.invite?.day === s.day && s.period.invite.code === 'HE' && !s.period.actions[s.day]?.afterSchool;

export function readHeliumLedger(storage, decode) {
  const raw = storage.getItem(HE_LEDGER_KEY);
  if (raw === null) return { version: 1, reservations: {} };
  let ledger;
  try {
    ledger = JSON.parse(raw);
    if (!object(ledger) || ledger.version !== 1 || !object(ledger.reservations)) throw new Error();
    for (const [id, r] of Object.entries(ledger.reservations)) {
      if (!object(r) || r.id !== id || typeof r.seed !== 'string' || !/^[0-9a-f]{32}$/.test(r.seed) || typeof r.source !== 'string') throw new Error();
      const s = decode(r.source);
      if (!eligible(s) || id !== requestId(s) || JSON.stringify(context(s)) !== JSON.stringify(r.context)) throw new Error();
    }
  } catch { throw new Error('헬륨 요청 원장이 손상되었습니다. 원장과 저장 원본을 보존하고 복구해 주세요. 새 추첨은 차단했습니다.'); }
  return ledger;
}
export function heliumOutcome(reservation) {
  const { probability, refused, reason } = reservation.context;
  const accepted = parseInt(reservation.seed.slice(0, 8), 16) / 0x100000000 < probability;
  const source = JSON.parse(reservation.source);
  return { day: source.day, accepted, probability, reason, refused: accepted ? 0 : refused + 1, ...(source.day > 20 ? { event: reservation.context.event } : {}) };
}
// A rollback cannot silently fork a reserved request. Loading never writes.
export function reconcileHelium(s, storage, decode) {
  const ledger = readHeliumLedger(storage, decode);
  if (!s.late) return null;
  const reservations = Object.values(ledger.reservations).filter(r => r.id.startsWith(s.late.runId + ':')).sort((a, b) => JSON.parse(a.source).day - JSON.parse(b.source).day);
  for (const r of reservations) {
    if (JSON.stringify(s.late.helium.requests[r.id]) !== JSON.stringify(heliumOutcome(r))) return r;
  }
  // A saved receipt without its ledger is not permission to reroll.
  if (Object.keys(s.late.helium.requests).some(id => !ledger.reservations[id])) throw new Error('저장의 헬륨 요청에 대응하는 원장이 없습니다. 진행을 차단했습니다. 원장과 저장 원본을 함께 복구해 주세요.');
  return null;
}
export class HeliumConflict extends Error {
  constructor(reservation) { super('이전 저장과 이미 예약된 헬륨 요청이 충돌합니다. 예약 당시 위치를 복구하거나 시작 화면으로 돌아가세요.'); this.reservation = reservation; }
}
export function reserveHelium(s, storage, decode, random = crypto) {
  if (!eligible(s)) throw new Error('오늘 직접 확인한 헬륨 요청이 아닙니다.');
  const conflict = reconcileHelium(s, storage, decode);
  if (conflict && conflict.source !== JSON.stringify(s)) throw new HeliumConflict(conflict);
  const ledger = readHeliumLedger(storage, decode); const id = requestId(s);
  if (ledger.reservations[id]) return ledger.reservations[id];
  // Generate entropy, not an outcome. Only a read-verified reservation may be
  // interpreted as a draw. Retry reuses the source and seed already written.
  const seed = [...random.getRandomValues(new Uint32Array(4))].map(n => n.toString(16).padStart(8, '0')).join('');
  const reservation = { id, seed, source: JSON.stringify(s), context: context(s) };
  ledger.reservations[id] = reservation;
  const raw = JSON.stringify(ledger); storage.setItem(HE_LEDGER_KEY, raw);
  if (storage.getItem(HE_LEDGER_KEY) !== raw) throw new Error('헬륨 요청 예약을 읽어 검증하지 못했습니다.');
  return reservation;
}
export function prepareHeliumResult(reservation, decode) {
  const s = decode(reservation.source); const r = heliumOutcome(reservation); const day = lateDay(s);
  s.late.helium.requests[reservation.id] = r; s.late.helium.refused = r.refused;
  s.choices[`DAY-${s.day}:AF:action`] = 'HE';
  s.period.actions[s.day] = { ...s.period.actions[s.day], afterSchool: 'HE' };
  s.period.person = 'HE'; s.time = '방과후'; s.location = '과학실 · 교사 있는 자료 좌석';
  s.scene = 'LATE-HE-REQUEST'; s.eventId = `LATE:${s.day}:HE:request`; s.index = 0; s.cast = ['HE'];
  s.queue = [say('플레이어', '아까 여쭤본 시간, 지금 같이 봐도 될까요?')]; s.after = null;
  if (r.accepted) {
    day.together = 'HE';
    s.queue.push(say('헬륨', s.affinity['헬륨'] >= 30 && (s.day <= 20 || priorExchange(s, 'HE')) ? '응. 내 것도 챙겼어. 네 얘기를 먼저 듣고 싶네.' : '응. 오늘은 같이 볼 수 있어. 네 종이도 가져와.'));
    if (r.event) {
      s.late.context = { day: s.day, code: 'HE', event: r.event, slot: 'afterSchool' };
      s.late.attempts[`HE:${r.event}`] = s.day; day.event = r.event;
      s.after = lateEventScene('HE', r.event);
    } else {
      s.queue.push(say('헬륨', '오늘은 새로 끝낼 건 없고 각자 보던 것만 보자'), stage('각자 조용히 본다.'));
      s.after = 'LATE-CLOSE';
    }
  } else {
    day.together = null;
    s.queue.push(say('헬륨', r.reason === 'puzzle' ? '오늘은 혼자 풀래. 네가 옆에 있으면 자꾸 설명부터 하게 돼.' : '오늘은 혼자 쉬고 갈게.'));
    if (s.day > 20 && r.reason === 'rest' && s.affinity['헬륨'] >= 30 && priorExchange(s, 'HE')) s.queue.push(say('헬륨', '네 얘길 대충 듣고 싶진 않아서'));
  }
  s.period.history.push({ day: s.day, who: '헬륨', title: '방과후 요청', text: r.accepted ? r.event ? `오늘 동행 수락 · ${r.event}` : '오늘 동행 수락 · 각자 조용히 보기' : '오늘 동행 거절 · 단독 마감' });
  return s;
}
export function persistVerified(candidate, storage, key = SAVE_KEY) {
  const raw = JSON.stringify(candidate); storage.setItem(key, raw);
  if (storage.getItem(key) !== raw) throw new Error('저장한 진행을 읽어 검증하지 못했습니다.');
  return candidate;
}
export function commitHelium(s, storage, decode, random = crypto) {
  const reservation = reserveHelium(s, storage, decode, random);
  // Outcome, counter, consumed action and exact return queue are one value.
  return persistVerified(prepareHeliumResult(reservation, decode), storage);
}
