import { Run, focus } from './mid-driver.js';
import * as e from '/src/engine.js';
import * as x from '/src/second-term.js';
import { commitHelium } from '/src/helium.js';
import { PEOPLE, SCHEDULE } from '/src/period.js';

export function memoryStorage() {
  const data = new Map(); return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
export class LateRun extends Run {
  constructor(s) { super(s); this.storage = memoryStorage(); this.results = []; }
  until(target, decide = () => 0, limit = 300) {
    for (let i = 0; i < limit; i++) {
      this.drain(); if (this.s.scene === target) return;
      if (this.s.scene === 'EX2-PAPER') {
        this.restore(); x.exam2Questions(this.s).forEach((q, i) => x.exam2Answer(this.s, i, q.correct));
        this.s = x.prepareExam2Commit(this.s, 'submit', e.enter); this.restore(); this.results.push(structuredClone(this.s)); continue;
      }
      if (this.s.scene === 'EX2-RESULT') { this.s = x.prepareExam2Commit(this.s, 'return', e.enter); this.restore(); continue; }
      const opts = e.options(this.s); const choice = decide(this.s, opts);
      if (opts[choice]?.heliumRequest) this.s = commitHelium(this.s, this.storage, e.decodeSave);
      else this.pick(choice);
    }
    throw new Error(`후반 도달 실패 ${target}: ${this.s.scene}`);
  }
}
export function lateFocus(code, { xFirst = false, request = false } = {}) {
  return (s, opts) => {
    const where = Object.entries(SCHEDULE[s.day] || {}).find(([, codes]) => codes.includes(code));
    if (['LATE-LUNCH', 'EX2-AFTER'].includes(s.scene)) return where ? opts.findIndex(o => o.place === where[0]) : 2;
    if (s.scene === 'LATE-ACTION') return where ? 0 : 2;
    if (s.scene === 'LATE-PERSON') return opts.findIndex(o => o.label === PEOPLE[code]);
    if (s.scene === 'LATE-EVENTS' && xFirst) { const x = opts.findIndex(o => o.label.endsWith('(X)')); return x < 0 ? 0 : x; }
    if (s.scene === 'LATE-AF-SELECT') {
      const chosen = opts.findIndex(o => o.label.startsWith(PEOPLE[code]) && (!o.heliumRequest || request));
      if (chosen >= 0) return chosen;
      return opts.findIndex(o => o.label === '혼자 쉬기');
    }
    if (s.scene === 'LATE-H-TURN') return 1;
    if (s.scene === 'LATE-STUDY') return opts.length - 1;
    return 0;
  };
}
export function day15(code = 'H') {
  const r = new Run(); r.to('DAY16-HANDOFF', focus(code)); return r.s;
}
