import science from '../docs/science-reference.md?raw';
import { rows, sceneText } from './script.js';
import { LESSON_NOTES } from './learning.js';
import { choiceRows } from './choice-content.js';
export { SNAPS } from './snaps.js';

export const PEOPLE = { H: '수소', HE: '헬륨', C: '탄소', NA: '나트륨', MG: '마그네슘', CA: '칼슘', CL: '염소' };
export const PLACES = ['옥상', '복도', '교실', '도서관', '운동장'];
export const SCHEDULE = {
  1: { 도서관: ['H'] },
  2: { 옥상: ['HE'], 복도: ['NA'], 교실: ['C'], 도서관: ['H'], 운동장: ['CA'] },
  3: { 복도: ['MG'], 도서관: ['CL'] },
  4: { 옥상: ['HE'], 운동장: ['CA'] },
  5: { 복도: ['NA'], 교실: ['C'] },
  6: { 도서관: ['H'], 복도: ['MG'] },
  7: { 도서관: ['CL'], 옥상: ['HE'] },
  8: { 운동장: ['CA'], 복도: ['NA'] },
  9: { 도서관: ['H'], 교실: ['C'] },
  10: { 옥상: ['HE'], 복도: ['NA', 'MG'], 교실: ['C'], 도서관: ['H', 'CL'], 운동장: ['CA'] },
  11: { 복도: ['NA'], 교실: ['C'], 도서관: ['H'] },
  12: { 옥상: ['HE'], 복도: ['MG'], 운동장: ['CA'] },
  13: { 옥상: ['H'], 복도: ['NA'], 교실: ['C'], 도서관: ['CL'] },
  14: { 복도: ['MG'], 교실: ['C'], 도서관: ['CL'], 운동장: ['CA'] },
  15: { 옥상: ['HE'], 복도: ['NA', 'MG'], 교실: ['C'], 도서관: ['H', 'CL'], 운동장: ['CA'] },
  16: { 복도: ['NA'], 교실: ['C'], 도서관: ['H'] },
  17: { 옥상: ['HE'], 복도: ['MG'], 도서관: ['CL'], 운동장: ['CA'] },
  18: { 옥상: ['HE'], 교실: ['C'], 도서관: ['H'] },
  19: { 복도: ['NA', 'MG'], 도서관: ['CL'], 운동장: ['CA'] },
  20: { 옥상: ['HE'], 복도: ['NA', 'MG'], 교실: ['C'], 도서관: ['H', 'CL'], 운동장: ['CA'] },
};
// 점심(급식 뒤)의 배치와 선택지 표시는 같은 원본을 사용한다.
export const lunchPeople = (day, place) => SCHEDULE[day]?.[place] || [];
export function lunchPlaceLabel(day, place) {
  const people = lunchPeople(day, place);
  return `${place} · ${people.length ? people.map(code => PEOPLE[code]).join(', ') : '만날 인물 없음'}`;
}
export const MET_EVENTS = { H: 'hMet', HE: 'heMet', C: 'carbonMet', NA: 'naMet', MG: 'mgMet', CA: 'caMet', CL: 'clMet' };
export const say = (who, text, extra = {}) => ({ who, text, kind: 'dialogue', ...extra });
export const stage = text => say('장면', text, { kind: 'narration' });
export const clean = text => text.replaceAll('**', '').replaceAll('`', '').replace(/^- /, '').trim();
export const bullets = id => sceneText(id).split('\n').filter(l => l.startsWith('- '));
export const quotes = text => [...text.matchAll(/“([^”]+)”/g)].map(m => m[1]);
export const actorLines = text => {
  const matches = [...text.matchAll(/(플레이어 독백|플레이어|화학 교사|교사|수소|헬륨|탄소|나트륨|마그네슘|칼슘|염소)[:：]? “([^”]+)”/g)];
  return matches.map(([, who, text]) => say(who === '교사' ? '화학 교사' : who, text));
};
export const dayParts = day => {
  const b = bullets(`D${day}-AM`);
  return { morning: actorLines(b.find(l => l.includes('**아침:')) || b[1]),
    note: quotes(b.find(l => l.includes('**수업 노트')) || '')[0],
    recess: actorLines(b.find(l => l.includes('**쉬는 시간:')) || '') };
};
export const SUPPLEMENT = science.match(/> 보충 핵심 노트: ([^\n]+)/)[1];
export const PERIOD_NOTES = { ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => {
  const day = i + 3;
  return [`D${day}-NOTE`, dayParts(day).note + (day === 4 ? '\n\n보충 핵심 노트\n' + SUPPLEMENT : '')];
})), ...LESSON_NOTES };
export const EXAM = science.split('\n').filter(l => /^\| EX1-Q\d/.test(l)).map(line => {
  const [id, question, explanation] = line.slice(1, -1).split('|').map(s => s.trim());
  const parts = question.split(/[①②③④] /);
  return { id: id.split(' · ')[0], prompt: parts[0].trim(), options: parts.slice(1).map(s => s.trim()),
    correct: '①②③④'.indexOf(explanation.match(/\*\*([①②③④])\*\*/)[1]), explanation: explanation.replace(/\*\*/g, '') };
});
export const EXAM_POINTS = 10;
EXAM[1].explanation = '양성자 수는 11로 그대로, 전자는 11→10으로 하나 줄어 Na⁺가 됩니다.';
EXAM[3].explanation = '안쪽 껍질부터 Li는 2,1 · Na는 2,8,1입니다. 바깥 전자는 둘 다 1개, Na는 껍질이 셋이라 3주기입니다.';
EXAM[5].prompt = '제공된 Mg/Ca 비교 자료를 읽고 옳은 설명을 고르세요.';
EXAM[5].card = 'magnesium';
EXAM[6].explanation = '다이아몬드와 흑연은 같은 탄소 원소이지만 배열이 다른 동소체입니다. 흑연은 전기가 통합니다.';
EXAM[8].explanation = '고체 식염에도 이온이 있지만 자유롭게 이동하지 못합니다. 식염수에서는 이동 가능한 이온이 전류를 운반합니다.';
EXAM[9].prompt = '다른 모둠이 제공한 예시 기록: 식염수만 측정해 표시등이 켜졌다. 물 대조는 하지 않았다. 적절한 기록은?';
export const invitation = code => actorLines(sceneText(`RE-${code}`).split('\n').find(l => l.startsWith(PEOPLE[code] + ' “')) || '');
export const introduction = code => {
  const b = bullets(`MEET-${code}`);
  const text = b.filter(l => !l.includes('**조건') && !l.startsWith('- 선택')).join('\n');
  const q = actorLines(text);
  if (code === 'CL') q.unshift(stage('안내문 예문: “비가 오면 모임 장소를 자료실로 바꾼다. 그것은 그대로 지켜 주세요.”'));
  return q;
};
export const meetOptions = code => bullets(`MEET-${code}`).filter(l => l.startsWith('- 선택')).map(l => {
  const q = quotes(l); return { label: q[0], response: q[1] };
});
export const mainRows = (id, s) => choiceRows(id, s, rows(id));
export const repeatRow = code => rows('TALK-REPEAT').find(r => r[0].startsWith(PEOPLE[code] + ' '));
export const followRow = code => rows('LAB-FOLLOW').find(r => r[0].startsWith(PEOPLE[code] + ','));
export const quietLine = (id, code) => actorLines(bullets(id).find(l => l.includes('수소 “')) || '').find(q => q.who === PEOPLE[code]);

// 승인된 추천표. 조건부 변화와 1회 적용은 엔진에서 처리하며 UI는 계산하지 않는다.
const UP = 4; const LAB = 5;
export const RELATIONS = {
  'RE-H': [UP, 0, UP], 'RE-HE': [3, 0], 'RE-C': [UP, 0, UP], 'RE-NA': [UP, 0, 0],
  'RE-MG': [UP, 0], 'RE-CA': [UP, 0, UP], 'RE-CL': [UP, 0],
  'LAB-H': [LAB, 0], 'LAB-HE': [4, 0], 'LAB-C': [LAB, 0, LAB], 'LAB-NA': [LAB, 0, LAB],
  'LAB-MG': [LAB, 0, 0], 'LAB-CA': [LAB, 0], 'LAB-CL-read': [LAB, LAB],
};
