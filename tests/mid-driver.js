// Browser-side engine driver: exercise the same public API as the DOM.
import * as engine from '/src/engine.js';
import * as exam from '/src/extension.js';
import { EXAM, PEOPLE, SCHEDULE } from '/src/period.js';

export class Run {
  constructor(s = engine.fresh('연결검증')) { this.s = s; this.visited = []; this.snaps = []; }
  restore() {
    const before = JSON.stringify([this.s.affinity, this.s.applied, this.s.choices, this.s.exam]);
    this.s = engine.decodeSave(JSON.stringify(this.s));
    if (before !== JSON.stringify([this.s.affinity, this.s.applied, this.s.choices, this.s.exam])) throw new Error('복원 시 기존 기록 변경');
  }
  drain() {
    for (let n = 0; this.s.index < this.s.queue.length; n++) {
      if (n > 200) throw new Error('응답 무한 루프');
      this.visited.push(`${this.s.day}:${this.s.scene}`);
      this.restore(); const q = this.s.queue[this.s.index];
      if (q.snap) this.snaps.push({ id: q.snap, state: structuredClone(this.s) });
      engine.advance(this.s);
    }
    this.visited.push(`${this.s.day}:${this.s.scene}`);
  }
  pick(index = 0) {
    this.drain(); const opts = engine.options(this.s);
    if (!opts[index]) throw new Error(`선택 없음: ${this.s.day}:${this.s.scene} #${index}`);
    const o = opts[index]; o.run(); const once = JSON.stringify([this.s.affinity, this.s.applied]); o.run();
    if (once !== JSON.stringify([this.s.affinity, this.s.applied])) throw new Error('동일 선택 중복 점수');
    this.drain();
  }
  to(target, decide = () => 0, limit = 1000) {
    for (let n = 0; n < limit; n++) {
      this.drain(); if (this.s.scene === target) return;
      if (this.s.lab.task) {
        engine.labAction(this.s, 'select', this.s.lab.task.sample);
        if (this.s.lab.task.sample === 'salt') { engine.labAction(this.s, 'add'); engine.labAction(this.s, 'dissolve'); }
        engine.labAction(this.s, 'measure'); continue;
      }
      if (this.s.scene === 'EX-PAPER') { EXAM.forEach((q, i) => exam.examAnswer(this.s, i, q.correct)); exam.submitExam(this.s, engine.enter); continue; }
      if (this.s.scene === 'EX-RESULT') { exam.finishExam(this.s, engine.enter); continue; }
      const opts = engine.options(this.s); this.pick(decide(this.s, opts));
    }
    throw new Error(`도달 실패: ${target} at ${this.s.scene}`);
  }
}
const days = { H: [2, 6, 9], HE: [2, 4, 7], C: [2, 5, 9], NA: [2, 5, 8], MG: [3, 6], CA: [2, 4, 8], CL: [3, 7] };
export function focus(code, { mid = true } = {}) {
  return (s, opts) => {
    const id = s.scene; const person = SCHEDULE[s.day] && Object.entries(SCHEDULE[s.day]).find(([, codes]) => codes.includes(code));
    const active = s.day === 10 || s.day > 10 ? Boolean(person) : days[code].includes(s.day);
    if (['A-01', 'B-01'].includes(id)) return 1;
    if (id === 'A-04') return 3;
    if (['B-04', 'LUNCH-SELECT', 'MID-LUNCH'].includes(id)) return active ? opts.findIndex(o => o.place === person[0]) : 2;
    if (['B-04-action', 'LUNCH-ACTION', 'MID-ACTION'].includes(id)) return active ? 0 : 2;
    if (['LUNCH-PERSON', 'MID-PERSON'].includes(id)) return opts.findIndex(o => o.label === PEOPLE[code]);
    if (id === 'B-05') return code === 'NA' ? 1 : 0;
    if (['D2-AF', 'AF-SELECT', 'EX-AF'].includes(id)) return active && opts.length > 1 ? 1 : 0;
    if (id === 'MID-AF') return mid && active && opts.length > 2 ? 2 : 1;
    if (id === 'MID-STUDY') return opts.length - 1;
    return 0;
  };
}
export function checkpoint(code = null, affinity = 0) {
  const s = engine.fresh('이전저장'); s.day = 10;
  if (code) { s.period.met[code] = true; s.events[{ H: 'hMet', HE: 'heMet', C: 'carbonMet', NA: 'naMet', MG: 'mgMet', CA: 'caMet', CL: 'clMet' }[code]] = true; s.affinity[PEOPLE[code]] = affinity; }
  engine.enter(s, 'DAY11-HANDOFF'); s.index = s.queue.length;
  // Simulate actual pre-extension v2 serialization.
  delete s.mid; return s;
}
