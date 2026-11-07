// Canonical events share reward/completion keys across all permitted slots.
export const LATE_EVENTS = {
  H: { T: [16, ['lunch']], X: [18, ['afterSchool']], R: [21, ['lunch', 'afterSchool']] },
  HE: { T: [17, ['lunch']], P: [18, ['lunch']], Q: [20, ['lunch']], X: [21, ['lunch']], R: [23, ['lunch']], L: [25, ['lunch']] },
  C: { T: [16, ['lunch']], X: [18, ['lunch']], R: [21, ['lunch']] },
  NA: { T: [16, ['lunch']], X: [19, ['lunch']], R: [21, ['lunch']] },
  MG: { T: [17, ['afterSchool']], X: [19, ['afterSchool']], R: [22, ['afterSchool']] },
  CA: { T: [17, ['lunch']], X: [19, ['lunch', 'afterSchool']], R: [22, ['lunch', 'afterSchool']] },
  CL: { T: [17, ['lunch']], X: [19, ['lunch']], R: [22, ['lunch', 'afterSchool']] },
};
for (const [c, events] of Object.entries(LATE_EVENTS)) {
  if (c !== 'HE') Object.assign(events, { P: [['H', 'C', 'NA'].includes(c) ? 23 : 24, ['lunch']], Q: [['H', 'C', 'NA'].includes(c) ? 25 : 26, ['lunch']] });
  Object.assign(events, { B: [23, ['afterSchool']], J: [25, ['afterSchool']], K: [27, ['afterSchool']], W: [27, ['lunch']] });
}
export const HE_REQUEST_DAYS = [17, 18, 20, 21, 23, 25, 27, 28, 29];
export const lateEventScene = (c, e) => ['X', 'R'].includes(e) ? `LATE-${c}-TURN` :
  ({ P: 1, Q: 2, J: 4, K: 5 }[e] ? `LATE-${c}-U${{ P: 1, Q: 2, J: 4, K: 5 }[e]}` : e === 'L' ? 'LATE-HE-U3' : e === 'W' && c !== 'HE' ? `LATE-${c}-U3` : `LATE-${c}-${e}`);
export const lateSceneId = id => typeof id === 'string' && (/^D(1[6-9]|2[1-9])-(AM|RECESS)$/.test(id) || /^D2[1-9]-NOTE$/.test(id) || id === 'D20-AM' ||
  ['D30-CEREMONY', 'D30-TALK'].includes(id) || /^END-(ENTRY|FINISH|H|HE|C|NA|MG|CA|CL|SOLO)$/.test(id) ||
  Object.entries(LATE_EVENTS).some(([c, events]) => Object.keys(events).some(e => lateEventScene(c, e) === id)) ||
  ['LATE-LUNCH', 'LATE-ACTION', 'LATE-PERSON', 'LATE-INTRO', 'LATE-EVENTS', 'LATE-LUNCH-END', 'LATE-AF-SELECT', 'LATE-STUDY', 'LATE-NOTE', 'LATE-REST', 'LATE-CLOSE', 'LATE-HE-REQUEST', 'LATE-HE-SOLO', 'DAY20-HANDOFF',
    'LATE-EMPTY'].includes(id));
export const lateKey = (code, event) => `${code}:${event}`;
export function initLate(s) {
  if (!s.late) s.late = { version: 1, runId: crypto.randomUUID(), normal: true, reward: {}, complete: {}, partial: {}, attempts: {}, days: {}, context: null, helium: { refused: 0, requests: {} } };
  return s.late;
}
export const lateDay = s => (s.late.days[s.day] ||= { person: null, event: null, confirmed: false, together: null });
export function availableLate(s, code, slot) {
  const m = s.late; if (!m || s.day < 16 || s.day > 29) return [];
  const today = m.days[s.day];
  return Object.entries(LATE_EVENTS[code] || {}).filter(([event, [first, slots]]) => {
    const key = lateKey(code, event);
    if (s.day < first || !slots.includes(slot) || m.complete[key] || m.attempts[key] === s.day) return false;
    if (['T', 'X', 'R'].includes(event) && ['T', 'X', 'R'].includes(today?.event)) return false;
    if (event === 'Q' && (m.attempts[`${code}:P`] === s.day || !s.exam2.returned)) return false;
    if (event === 'K' && m.attempts[`${code}:J`] === s.day) return false;
    if (code === 'HE' && ['J', 'K'].includes(event) && !(m.complete[`HE:${event === 'J' ? 'B' : 'J'}`] < s.day)) return false;
    return true;
  }).map(([event]) => event);
}
export const priorLate = (s, c, e) => Boolean(s.late.complete[lateKey(c, e)] && s.late.complete[lateKey(c, e)] < s.day);
export function priorExchange(s, c) {
  return Boolean(s.mid.personal[c] && s.mid.personal[c] < s.day ||
    ['complete', 'partial'].some(map => Object.entries(s.late[map]).some(([key, day]) => key.startsWith(c + ':') && day < s.day)));
}
export const mainReward = (s, c, e) => e === 'R' ? priorExchange(s, c) ? 8 : 5 : ['B', 'J', 'K'].includes(e) ? 8 : e === 'Q' ? 6 : 5;
export const partialReward = (s, c, e) => e === 'R' ? mainReward(s, c, e) === 8 ? 4 : 2 : ['B', 'J', 'K'].includes(e) ? 4 : e === 'Q' ? 3 : 2;
// Nominal totals are independent of the actual affinity delta (including at 100).
// Authored partial choices pay their nominal total, never mark main completion.
export function commitLate(s, commit, api) {
  if (!commit) return;
  const { code, event, kind, total } = commit; const m = s.late; const key = lateKey(code, event);
  if (!m || m.complete[key] || kind === 'none' || kind === 'partial' && m.partial[key]) return;
  const prior = m.reward[key] || 0; const target = Math.max(prior, total);
  api.score(s, `LATE:${key}:${target}`, api.people[code], target - prior);
  m.reward[key] = target;
  if (kind === 'main') m.complete[key] = s.day;
  else if (!m.partial[key]) m.partial[key] = s.day;
}
const object = x => x && typeof x === 'object' && !Array.isArray(x);
const date = n => Number.isInteger(n) && n >= 16 && n <= 30;
const maxReward = e => ['R', 'B', 'J', 'K'].includes(e) ? 8 : e === 'Q' ? 6 : 5;
const key = k => Object.entries(LATE_EVENTS).some(([c, events]) => Object.keys(events).some(e => k === lateKey(c, e)));
export function validLateCommit(c) {
  return !c || object(c) && key(lateKey(c.code, c.event)) && (c.kind === 'main' ? c.total === maxReward(c.event) || c.event === 'R' && c.total === 5 : c.kind === 'partial' ? !['T', 'X'].includes(c.event) && (c.total === (['R', 'B', 'J', 'K'].includes(c.event) ? 4 : c.event === 'Q' ? 3 : 2) || c.event === 'R' && c.total === 2) : c.kind === 'none' && c.total === 0);
}
export function validLate(s, roster) {
  const m = s.late; if (!m) return !lateSceneId(s.scene);
  if (!object(m) || !date(s.day) || m.version !== 1 || typeof m.runId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(m.runId) || m.normal !== true ||
    !['reward', 'complete', 'partial', 'attempts', 'days'].every(k => object(m[k])) ||
    !Object.entries(m.reward).every(([k, n]) => key(k) && Number.isInteger(n) && n >= 0 && n <= maxReward(k.split(':')[1]) && (n === 0 || m.complete[k] || m.partial[k])) ||
    !['complete', 'partial', 'attempts'].every(map => Object.entries(m[map]).every(([k, d]) => key(k) && date(d) && d <= s.day && d >= LATE_EVENTS[k.split(':')[0]][k.split(':')[1]][0])) ||
    !Object.entries(m.complete).every(([k]) => m.reward[k] === maxReward(k.split(':')[1]) || k.endsWith(':R') && m.reward[k] === 5) ||
    !Object.entries(m.days).every(([d, v]) => date(Number(d)) && Number(d) <= s.day && object(v) &&
      (v.person === null || Object.hasOwn(LATE_EVENTS, v.person) && ['옥상', '복도', '교실', '도서관', '운동장'].some(place => roster(Number(d), place).includes(v.person))) && typeof v.confirmed === 'boolean' &&
      (v.together === null || v.together === v.person) && (v.event === null || Object.hasOwn(LATE_EVENTS[v.person] || {}, v.event))) ||
    !object(m.helium) || !Number.isInteger(m.helium.refused) || m.helium.refused < 0 || m.helium.refused > 2 || !object(m.helium.requests)) return false;
  if (m.studySlot !== undefined && !['lunch', 'afterSchool'].includes(m.studySlot) || m.readingNote && !s.notes.includes(m.readingNote)) return false;
  if (m.context && (!object(m.context) || !key(lateKey(m.context.code, m.context.event)) ||
    m.context.read !== undefined && typeof m.context.read !== 'boolean' ||
    !LATE_EVENTS[m.context.code][m.context.event][1].includes(m.context.slot) || m.context.day !== s.day ||
    m.attempts[lateKey(m.context.code, m.context.event)] !== s.day || m.days[s.day]?.person !== m.context.code)) return false;
  const headers = Object.entries(LATE_EVENTS).flatMap(([c, events]) => Object.keys(events).map(e => lateEventScene(c, e)));
  if (headers.includes(s.scene) && (!m.context || lateEventScene(m.context.code, m.context.event) !== s.scene)) return false;
  if (s.queue.some(q => q.lateCommit && (!m.context || q.lateCommit.code !== m.context.code || q.lateCommit.event !== m.context.event))) return false;
  if (/^D(1[6-9]|2[1-9])-(AM|NOTE|RECESS)$/.test(s.scene) && Number(s.scene.match(/\d+/)[0]) !== s.day || ['D20-AM', 'DAY20-HANDOFF'].includes(s.scene) && s.day !== 20) return false;
  const requests = Object.entries(m.helium.requests).sort(([, a], [, b]) => a.day - b.day);
  if (m.helium.refused !== (requests.at(-1)?.[1].refused || 0)) return false;
  if (['LATE-HE-REQUEST', 'LATE-HE-SOLO'].includes(s.scene)) {
    const r = m.helium.requests[`${m.runId}:${s.day}:HE:afterSchool`];
    if (!r || s.period.actions[s.day]?.afterSchool !== 'HE' || s.scene === 'LATE-HE-SOLO' && r.accepted) return false;
  }
  return requests.every(([id, r]) => id === `${m.runId}:${r.day}:HE:afterSchool` && HE_REQUEST_DAYS.includes(r.day) && r.day <= s.day &&
    typeof r.accepted === 'boolean' && ['puzzle', 'rest'].includes(r.reason) && [0.4, 0.5, 0.6, 0.7, 1].includes(r.probability) && Number.isInteger(r.refused) && r.refused >= 0 && r.refused <= 2 &&
    (r.day <= 20 ? r.event === undefined : r.event === null || ['B', 'J', 'K'].includes(r.event)));
}
