import { LateRun, day15, lateFocus } from './late-driver.js';
import { PEOPLE } from '/src/period.js';
import * as e from '/src/engine.js';
import { commitHelium } from '/src/helium.js';
import { LATE_EVENTS, lateEventScene } from '/src/late-state.js';

export function day20(code = 'H') {
  const run = new LateRun(day15(code)); run.until('DAY20-HANDOFF', lateFocus(code)); return run.s;
}
export function postFocus(code) {
  const prior = lateFocus(code, { request: true });
  return (s, opts) => {
    if (s.scene === 'LATE-EVENTS') {
      const order = code === 'HE' ? ['X', 'R', 'P', 'Q', 'L', 'W', 'T'] : ['R', 'P', 'Q', 'W', 'T', 'X'];
      for (const event of order) { const i = opts.findIndex(o => o.label.startsWith(PEOPLE[code]) && o.label.endsWith(`(${event})`)); if (i >= 0) return i; }
      return opts.findIndex(o => o.label.includes('초대 확인만'));
    }
    if (s.scene === 'LATE-STUDY') return opts.length - 1;
    if (s.scene === 'LATE-NOTE') return opts.length - 1;
    if (s.scene === 'LATE-AF-SELECT') {
      const person = opts.findIndex(o => o.label.startsWith(PEOPLE[code]));
      return person >= 0 ? person : opts.findIndex(o => o.label === '혼자 쉬기');
    }
    if (s.late?.context) return 0;
    return prior(s, opts);
  };
}
export class PostRun extends LateRun {
  constructor(s, random = null) { super(s); this.random = random; }
  until(target, decide = () => 0, limit = 1000) {
    for (let i = 0; i < limit; i++) {
      this.drain(); if (this.s.scene === target) return;
      const opts = e.options(this.s); const choice = decide(this.s, opts);
      if (!opts[choice]) throw new Error(`선택 없음 ${this.s.day}:${this.s.scene} #${choice}`);
      if (opts[choice].heliumRequest) this.s = commitHelium(this.s, this.storage, e.decodeSave, this.random || crypto);
      else this.pick(choice);
    }
    throw new Error(`최종 기간 도달 실패 ${target}: ${this.s.scene}`);
  }
}

// Constructed-state boundary fixtures, never counted as normal-play routes.
export function eventFixture(s, code, event, day) {
  s.day = day; const slot = LATE_EVENTS[code][event][1][0];
  s.period.person = code; s.period.invite = { day, code };
  s.period.actions[day] = { lunch: '대화', ...(slot === 'afterSchool' ? { afterSchool: code } : {}) };
  s.late.days[day] = { person: code, event, confirmed: true, together: slot === 'afterSchool' ? code : null };
  s.late.context = { day, code, event, slot }; s.late.attempts[`${code}:${event}`] = day;
  e.enter(s, lateEventScene(code, event)); return new PostRun(s);
}
export function endingFixture(s, affinity = {}) {
  s.day = 30; Object.keys(s.affinity).forEach(name => { s.affinity[name] = affinity[name] || 0; });
  s.period.actions[30] = { lunch: '휴식', afterSchool: '휴식' }; s.period.person = null; s.period.invite = null;
  s.late.days[30] = { person: null, event: null, confirmed: false, together: null }; s.late.context = null;
  delete s.ending; e.enter(s, 'END-ENTRY'); return new PostRun(s);
}
