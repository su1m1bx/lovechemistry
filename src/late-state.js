// Only the approved 16–20 window. Later events are deliberately not registered.
export const LATE_EVENTS = {
  H: { T: [16, ['lunch']], X: [18, ['afterSchool']] },
  HE: { T: [17, ['lunch']], P: [18, ['lunch']], Q: [20, ['lunch']] },
  C: { T: [16, ['lunch']], X: [18, ['lunch']] },
  NA: { T: [16, ['lunch']], X: [19, ['lunch']] },
  MG: { T: [17, ['afterSchool']], X: [19, ['afterSchool']] },
  CA: { T: [17, ['lunch']], X: [19, ['lunch', 'afterSchool']] },
  CL: { T: [17, ['lunch']], X: [19, ['lunch']] },
};
export const lateEventScene = (c, e) => e === 'P' ? 'LATE-HE-U1' : e === 'Q' ? 'LATE-HE-U2' : `LATE-${c}-${e === 'X' ? 'TURN' : 'T'}`;
export const lateSceneId = id => typeof id === 'string' && (/^D1[6-9]-(AM|RECESS)$/.test(id) || id === 'D20-AM' ||
  ['LATE-LUNCH', 'LATE-ACTION', 'LATE-PERSON', 'LATE-INTRO', 'LATE-EVENTS', 'LATE-LUNCH-END', 'LATE-AF-SELECT', 'LATE-STUDY', 'LATE-NOTE', 'LATE-REST', 'LATE-CLOSE', 'LATE-HE-REQUEST', 'LATE-HE-SOLO', 'DAY20-HANDOFF',
    'LATE-H-T', 'LATE-HE-T', 'LATE-C-T', 'LATE-NA-T', 'LATE-MG-T', 'LATE-CA-T', 'LATE-CL-T', 'LATE-H-TURN', 'LATE-C-TURN', 'LATE-NA-TURN', 'LATE-MG-TURN', 'LATE-CA-TURN', 'LATE-CL-TURN', 'LATE-HE-U1', 'LATE-HE-U2'].includes(id));
export const lateKey = (code, event) => `${code}:${event}`;
export function initLate(s) {
  if (!s.late) s.late = { version: 1, runId: crypto.randomUUID(), normal: true, reward: {}, complete: {}, partial: {}, attempts: {}, days: {}, context: null, helium: { refused: 0, requests: {} } };
  return s.late;
}
export const lateDay = s => (s.late.days[s.day] ||= { person: null, event: null, confirmed: false, together: null });
export function availableLate(s, code, slot) {
  const m = s.late; if (!m || s.day < 16 || s.day > 20) return [];
  const today = m.days[s.day];
  return Object.entries(LATE_EVENTS[code] || {}).filter(([event, [first, slots]]) => {
    const key = lateKey(code, event);
    if (s.day < first || !slots.includes(slot) || m.complete[key] || m.attempts[key] === s.day) return false;
    if (['T', 'X'].includes(event) && ['T', 'X'].includes(today?.event)) return false;
    if (event === 'Q' && (m.attempts['HE:P'] === s.day || !s.exam2.returned)) return false;
    return true;
  }).map(([event]) => event);
}
// Nominal totals are independent of the actual affinity delta (including at 100).
// No in-window scene invents a partial choice; this primitive also supports
// authored partial -> main retries when a later window is connected.
export function commitLate(s, commit, api) {
  if (!commit) return;
  const { code, event, kind, total } = commit; const m = s.late; const key = lateKey(code, event);
  if (!m || m.complete[key] || kind === 'none') return;
  const prior = m.reward[key] || 0; const target = Math.max(prior, total);
  api.score(s, `LATE:${key}:${target}`, api.people[code], target - prior);
  m.reward[key] = target;
  if (kind === 'main') m.complete[key] = s.day;
  else if (!m.partial[key]) m.partial[key] = s.day;
}
const object = x => x && typeof x === 'object' && !Array.isArray(x);
const date = n => Number.isInteger(n) && n >= 16 && n <= 20;
const key = k => Object.entries(LATE_EVENTS).some(([c, events]) => Object.keys(events).some(e => k === lateKey(c, e)));
export function validLateCommit(c) {
  return !c || object(c) && key(lateKey(c.code, c.event)) && (c.kind === 'main' ? c.total === (c.event === 'Q' ? 6 : 5) : c.kind === 'partial' ? ['P', 'Q'].includes(c.event) && c.total === (c.event === 'Q' ? 3 : 2) : c.kind === 'none' && c.total === 0);
}
export function validLate(s, roster) {
  const m = s.late; if (!m) return !lateSceneId(s.scene);
  if (!object(m) || !date(s.day) || m.version !== 1 || typeof m.runId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(m.runId) || m.normal !== true ||
    !['reward', 'complete', 'partial', 'attempts', 'days'].every(k => object(m[k])) ||
    !Object.entries(m.reward).every(([k, n]) => key(k) && Number.isInteger(n) && n >= 0 && n <= (k.endsWith(':Q') ? 6 : 5)) ||
    !['complete', 'partial', 'attempts'].every(map => Object.entries(m[map]).every(([k, d]) => key(k) && date(d) && d <= s.day && d >= LATE_EVENTS[k.split(':')[0]][k.split(':')[1]][0])) ||
    !Object.entries(m.complete).every(([k]) => m.reward[k] === (k.endsWith(':Q') ? 6 : 5)) ||
    !Object.entries(m.days).every(([d, v]) => date(Number(d)) && Number(d) <= s.day && object(v) &&
      (v.person === null || Object.hasOwn(LATE_EVENTS, v.person) && ['옥상', '복도', '교실', '도서관', '운동장'].some(place => roster(Number(d), place).includes(v.person))) && typeof v.confirmed === 'boolean' &&
      (v.together === null || v.together === v.person) && (v.event === null || Object.hasOwn(LATE_EVENTS[v.person] || {}, v.event))) ||
    !object(m.helium) || !Number.isInteger(m.helium.refused) || m.helium.refused < 0 || m.helium.refused > 2 || !object(m.helium.requests)) return false;
  if (m.context && (!object(m.context) || !key(lateKey(m.context.code, m.context.event)) ||
    !LATE_EVENTS[m.context.code][m.context.event][1].includes(m.context.slot) || m.context.day !== s.day ||
    m.attempts[lateKey(m.context.code, m.context.event)] !== s.day || m.days[s.day]?.person !== m.context.code)) return false;
  const headers = Object.entries(LATE_EVENTS).flatMap(([c, events]) => Object.keys(events).map(e => lateEventScene(c, e)));
  if (headers.includes(s.scene) && (!m.context || lateEventScene(m.context.code, m.context.event) !== s.scene)) return false;
  if (s.queue.some(q => q.lateCommit && (!m.context || q.lateCommit.code !== m.context.code || q.lateCommit.event !== m.context.event))) return false;
  if (/^D1[6-9]-(AM|RECESS)$/.test(s.scene) && Number(s.scene.match(/\d+/)[0]) !== s.day || ['D20-AM', 'DAY20-HANDOFF'].includes(s.scene) && s.day !== 20) return false;
  const requests = Object.entries(m.helium.requests).sort(([, a], [, b]) => a.day - b.day);
  if (m.helium.refused !== (requests.at(-1)?.[1].refused || 0)) return false;
  if (['LATE-HE-REQUEST', 'LATE-HE-SOLO'].includes(s.scene)) {
    const r = m.helium.requests[`${m.runId}:${s.day}:HE:afterSchool`];
    if (!r || s.period.actions[s.day]?.afterSchool !== 'HE' || s.scene === 'LATE-HE-SOLO' && r.accepted) return false;
  }
  return requests.every(([id, r]) => id === `${m.runId}:${r.day}:HE:afterSchool` && [17, 18, 20].includes(r.day) && r.day <= s.day &&
    typeof r.accepted === 'boolean' && ['puzzle', 'rest'].includes(r.reason) && [0.4, 0.5, 0.6, 0.7, 1].includes(r.probability) && Number.isInteger(r.refused) && r.refused >= 0 && r.refused <= 2);
}
