// Real event queues captured through public choices. No new events/rewards.
import { Run, focus } from './mid-driver.js';
import { day20, PostRun, postFocus } from './post-driver.js';
import { day15, LateRun, lateFocus } from './late-driver.js';
import * as e from '/src/engine.js';
import { PEOPLE } from '/src/period.js';
export function standingState(code) {
  const s = e.fresh('에셋검증');
  if (code !== 'H') { s.day = 2; s.period.person = code; e.enter(s, `RE-${code}`); }
  const first = s.queue.findIndex(q => q.who === PEOPLE[code]); if (first >= 0) s.index = first;
  return e.decodeSave(JSON.stringify(s));
}
export function multiState() {
  const s = e.fresh('에셋검증'); e.enter(s, 'D9-AM'); s.index = s.queue.findIndex(q => q.who === '수소'); return s;
}
export function snapState(id) {
  const c = id.split('-').at(-1);
  if (id === 'SNAP3-C') {
    const r = new LateRun(day15(c)); r.until('DAY20-HANDOFF', lateFocus(c));
    return { s: r.snaps.find(s => s.id === id).state, ledger: null };
  }
  const run = id.startsWith('SNAP3-') ? new PostRun(day20(c), c === 'HE' ? { getRandomValues: a => a.fill(0) } : null) : new Run();
  if (run instanceof PostRun) run.until('END-FINISH', postFocus(c)); else run.to('DAY16-HANDOFF', focus(c));
  const item = run.snaps.find(s => s.id === id); if (!item) throw new Error(`실제 경로에 스냅 없음: ${id}`);
  const source = structuredClone(item.state);
  const ledger = run.storage?.getItem('love-chemistry.helium-reservations.v1');
  const full = ledger ? JSON.parse(ledger) : null;
  return { s: source, ledger: full ? { ...full, reservations: Object.fromEntries(Object.entries(full.reservations).filter(([key]) => source.late.helium.requests[key])) } : null };
}
