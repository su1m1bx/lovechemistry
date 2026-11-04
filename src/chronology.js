import { PEOPLE } from './period.js';

const earliest = (map, code, day) => { map[code] = Math.min(map[code] || day, day); };
export const uncomfortable = s => Boolean(s.events.takeover || s.events.dismiss) && s.mid.sodium.status !== 'resolved';
export function initMid(s) {
  const migrate = !s.mid;
  s.mid ||= {};
  for (const key of ['metDates', 'personal', 'seed', 'echo', 'late', 'play', 'next', 'shared', 'reflections']) s.mid[key] ||= {};
  s.mid.sodium ||= { status: s.events.takeover || s.events.dismiss ? 'unresolved' : 'clear', startedDay: null, resolvedDay: null };
  if (s.mid.sodium.status === 'clear' && (s.events.takeover || s.events.dismiss)) s.mid.sodium.status = 'unresolved';
  if (migrate) syncLegacyHistory(s);
}
export function syncLegacyHistory(s) {
  // v2 saves carry no dates. Only completed, identifiable choices are evidence;
  // affinity and a bare met flag never prove an earlier personal exchange.
  for (const [key, value] of Object.entries(s.choices)) {
    const match = key.match(/^DAY-(\d+):(MEET|RE|LAB|EX-PERSONAL)-?(H|HE|C|NA|MG|CA|CL)?:(H|HE|C|NA|MG|CA|CL)$/);
    const pending = s.eventId === key && s.index < s.queue.length;
    if (!match || pending) continue;
    const day = Number(match[1]); const type = match[2]; const code = match[4];
    if (s.period.met[code]) earliest(s.mid.metDates, code, day);
    const r = type === 'RE' && (code === 'C' && [0, 2].includes(value) || code === 'CA' && [0, 2].includes(value)) ||
      type === 'LAB' && (code === 'MG' || ['H', 'NA', 'CA'].includes(code) && value === 0 || code === 'C' && [0, 2].includes(value));
    if (r) earliest(s.mid.personal, code, day);
  }
  if (s.events.hMet && Object.hasOwn(s.choices, 'A-01')) earliest(s.mid.metDates, 'H', 1);
  if (s.events.carbonMet && Object.hasOwn(s.choices, 'B-03')) earliest(s.mid.metDates, 'C', 2);
  if (s.events.naMet && Object.hasOwn(s.choices, 'B-04-talk')) earliest(s.mid.metDates, 'NA', 2);
  if (s.events.recordTaste && s.scene !== 'A-04-action') earliest(s.mid.personal, 'H', 1);
  if (s.events.bakeryExchange && !['남은 거리감', '방문 약속 없음'].includes(s.events.bakeryExchange) && !s.events.takeover && !s.events.dismiss && s.scene !== 'C-07') earliest(s.mid.personal, 'NA', 2);
  if (s.period.promises.clRead) {
    const day = Object.keys(s.choices).map(k => k.match(/^DAY-(\d+):LAB-CL-read:CL$/)).filter(Boolean).map(m => Number(m[1])).sort((a, b) => a - b)[0];
    if (day && !(s.scene === 'LAB-CL-read' && s.index < s.queue.length)) earliest(s.mid.personal, 'CL', day);
  }
}
export function metOn(s, code) {
  earliest(s.mid.metDates, code, s.day);
}
export function completeMid(s, commit, api) {
  if (!commit) return;
  const { key, code, type, amount = 0, shared, positive } = commit;
  if (Object.hasOwn(s.applied, key)) return;
  api.score(s, key, PEOPLE[code], amount);
  if (type === 'repair') {
    Object.assign(s.mid.sodium, { status: 'watching', startedDay: s.day });
    s.mid.seed.NA = s.day;
    earliest(s.mid.personal, 'NA', s.day);
  } else if (type === 'check') Object.assign(s.mid.sodium, { status: 'resolved', resolvedDay: s.day });
  else if (type === 'agreement') s.mid.heAgreementDay = s.day;
  else if (type === 'clRead') s.mid.clReadDay = s.day;
  else if (type === 'personal') { if (positive) earliest(s.mid.personal, code, s.day); }
  else if (s.mid[type]) {
    s.mid[type][code] = s.day;
    // Both SEED alternatives exchange a personal preference; neither is a
    // refusal of the conversation. Unlike EX-PERSONAL's rest alternative,
    // this is evidence for a later date, not for today's major reward.
    if (type === 'seed') earliest(s.mid.personal, code, s.day);
  }
  if (shared) s.mid.shared[shared] = s.day;
  if (type === 'echo' && s.mid.shared[{ H: 'H-two-seats', C: 'C-shared-page', NA: 'NA-own-lines', MG: 'MG-private-show', CA: 'CA-mutual-cheer', CL: 'CL-two-voices' }[code]]) reflect(s, code);
  if (shared || type === 'next' && positive) reflect(s, code);
  if (type === 'next' && positive) s.mid.shared[`mutual-${code}`] = s.day;
}
export function reflect(s, code) {
  const r = s.mid.reflections[s.day] ||= {};
  r[s.time === '방과후' ? 'afterSchool' : 'lunch'] = code;
}
