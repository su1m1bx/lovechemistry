import { EXAM2_VERSION, EXAM2_VERSIONS } from './exam2-content.js';
import { lessonCards } from './learning.js';
import { lateSceneId } from './late-state.js';

export const SECOND_NOTES = ['D16-NOTE', 'D17-NOTE', 'D18-NOTE', 'D19-NOTE'];
export const secondSceneId = id => SECOND_NOTES.includes(id) || ['EX2-START', 'EX2-PAPER', 'EX2-RESULT', 'EX2-AFTER'].includes(id);
export const exam2Questions = s => EXAM2_VERSIONS[s.exam2.version];
export function initExam2(s) {
  if (!Object.hasOwn(s, 'exam2')) s.exam2 = { version: EXAM2_VERSION, answers: Array(10).fill(null), index: 0, submitted: false, result: null, returned: false };
}
export function secondScene(s, id, api) {
  if (!secondSceneId(id)) return false;
  initExam2(s);
  const lesson = SECOND_NOTES.includes(id);
  if (!lesson && !SECOND_NOTES.every(note => s.notes.includes(note))) throw new Error('16~19일 공통 학습을 먼저 확인해 주세요.');
  if (['EX2-START', 'EX2-PAPER'].includes(id) && s.exam2.submitted || id === 'EX2-RESULT' && (!s.exam2.submitted || s.exam2.returned) || id === 'EX2-AFTER' && !s.exam2.returned) throw new Error('둘째 시험의 진행 상태와 장면이 맞지 않습니다.');
  s.scene = id; s.day = lesson ? Number(id.match(/\d+/)[0]) : 20;
  s.time = lesson ? '수업' : id === 'EX2-AFTER' ? '점심 · 급식 뒤' : id === 'EX2-RESULT' ? '시험 결과' : id === 'EX2-START' ? '시험 안내' : '둘째 시험';
  s.location = id === 'EX2-AFTER' ? '장소 선택' : '교실'; s.cast = []; s.place = '';
  s.eventId = `DAY-${s.day}:${id}`;
  const q = lesson ? [{ who: '수업 핵심 노트', text: api.notes[id], note: id }, ...lessonCards(id)] :
    id === 'EX2-START' ? [{ who: '화학 교사', text: '지난 수업에서 받은 자료를 바탕으로 확인하겠습니다.' }] : [];
  api.queue(s, q, id === 'EX2-START' ? 'EX2-PAPER' : lesson && s.late?.normal ? `D${s.day}-RECESS` : null);
  return true;
}
export function exam2Answer(s, index, answer) {
  if (s.scene !== 'EX2-PAPER' || s.exam2.submitted || !Number.isInteger(index) || !exam2Questions(s)[index] || !Number.isInteger(answer) || answer < 0 || answer > 3) return;
  s.exam2.answers[index] = answer;
}
// Stage the entire operation on a copy. The caller publishes it ONLY after a
// successful single-key LocalStorage replacement; a failed write leaves s intact.
export function prepareExam2Commit(s, action, enter) {
  if (action === 'submit' ? s.scene !== 'EX2-PAPER' || s.exam2.submitted : action !== 'return' || s.scene !== 'EX2-RESULT' || !s.exam2.submitted || s.exam2.returned) return null;
  const next = structuredClone(s); const exam = next.exam2;
  if (action === 'submit') {
    const details = exam2Questions(next).map((q, i) => ({ id: q.id, answer: exam.answers[i], correct: q.correct, points: exam.answers[i] === q.correct ? q.points : 0 }));
    exam.result = { version: exam.version, day: 20, score: details.reduce((n, d) => n + d.points, 0), details };
    exam.submitted = true; enter(next, 'EX2-RESULT');
  } else {
    exam.returned = true; next.events.exam2Returned = true; enter(next, 'EX2-AFTER');
  }
  return next;
}
export function persistExam2(candidate, storage, key) {
  // setItem is atomic for a single value: if it throws, the previous slot survives.
  storage.setItem(key, JSON.stringify(candidate));
  return candidate;
}
export function validExam2(s) {
  const e = s.exam2; const questions = e && EXAM2_VERSIONS[e.version];
  if (!questions || !Array.isArray(e.answers) || e.answers.length !== questions.length ||
    !e.answers.every(a => a === null || Number.isInteger(a) && a >= 0 && a < 4) ||
    !Number.isInteger(e.index) || e.index < 0 || e.index >= questions.length ||
    typeof e.submitted !== 'boolean' || typeof e.returned !== 'boolean' || e.returned && !e.submitted) return false;
  if (!e.submitted && e.result !== null) return false;
  if (e.submitted) {
    const r = e.result;
    if (!r || r.version !== e.version || r.day !== 20 || !Array.isArray(r.details) || r.details.length !== questions.length ||
      !r.details.every((d, i) => d.id === questions[i].id && d.answer === e.answers[i] && d.correct === questions[i].correct && d.points === (d.answer === d.correct ? questions[i].points : 0)) ||
      r.score !== r.details.reduce((n, d) => n + d.points, 0)) return false;
  }
  if (secondSceneId(s.scene) && (s.day !== (SECOND_NOTES.includes(s.scene) ? Number(s.scene.match(/\d+/)[0]) : 20) ||
    !SECOND_NOTES.includes(s.scene) && !SECOND_NOTES.every(n => s.notes.includes(n)))) return false;
  if (s.day > 15 && !secondSceneId(s.scene) && !(s.late?.normal && (lateSceneId(s.scene) || ['MID-NA-REPAIR', 'MID-NA-CHECK'].includes(s.scene)))) return false;
  if (s.late?.normal && s.day >= 16 && !Array.from({ length: Math.min(s.day - 16, 4) }, (_, i) => `D${16 + i}-NOTE`).every(n => s.notes.includes(n))) return false;
  if (s.late?.normal && s.day === 20 && (s.scene.startsWith('LATE-') || s.scene === 'DAY20-HANDOFF' || s.scene.startsWith('MID-NA-')) && !e.returned) return false;
  if (SECOND_NOTES.some(note => s.notes.includes(note) && s.day < Number(note.match(/\d+/)[0]))) return false;
  return !(['EX2-START', 'EX2-PAPER'].includes(s.scene) && e.submitted || s.scene === 'EX2-RESULT' && (!e.submitted || e.returned) ||
    s.scene === 'EX2-AFTER' && !e.returned || e.returned !== Boolean(s.events.exam2Returned));
}
