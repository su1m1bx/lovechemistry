import science from '../docs/science-reference.md?raw';
import { sections, rows, sceneText, source } from './script.js';
import { RULES } from './config.js';

export const PEOPLE = { H: '수소', HE: '헬륨', C: '탄소', NA: '나트륨', MG: '마그네슘', CA: '칼슘', CL: '염소' };
export const PLACES = ['옥상', '복도', '교실', '도서관', '운동장'];
export const SCHEDULE = {
  2: { 옥상: ['HE'], 복도: ['NA'], 교실: ['C'], 도서관: ['H'], 운동장: ['CA'] },
  3: { 복도: ['MG'], 도서관: ['CL'] },
  4: { 옥상: ['HE'], 운동장: ['CA'] },
  5: { 복도: ['NA'], 교실: ['C'] },
  6: { 도서관: ['H'], 복도: ['MG'] },
  7: { 도서관: ['CL'], 옥상: ['HE'] },
  8: { 운동장: ['CA'], 복도: ['NA'] },
  9: { 도서관: ['H'], 교실: ['C'] },
  10: { 옥상: ['HE'], 복도: ['NA', 'MG'], 교실: ['C'], 도서관: ['H', 'CL'], 운동장: ['CA'] },
};
export const MET_EVENTS = { H: 'hMet', HE: 'heMet', C: 'carbonMet', NA: 'naMet', MG: 'mgMet', CA: 'caMet', CL: 'clMet' };
export const say = (who, text, extra = {}) => ({ who, text, ...extra });
export const stage = text => say('장면', text);
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
export const PERIOD_NOTES = Object.fromEntries(Array.from({ length: 7 }, (_, i) => {
  const day = i + 3;
  return [`D${day}-NOTE`, dayParts(day).note + (day === 4 ? '\n\n보충 핵심 노트\n' + SUPPLEMENT : '')];
}));
export const EXAM = science.split('\n').filter(l => /^\| EX1-Q\d/.test(l)).map(line => {
  const [id, question, explanation] = line.slice(1, -1).split('|').map(s => s.trim());
  const parts = question.split(/[①②③④] /);
  return { id: id.split(' · ')[0], prompt: parts[0].trim(), options: parts.slice(1).map(s => s.trim()),
    correct: '①②③④'.indexOf(explanation.match(/\*\*([①②③④])\*\*/)[1]), explanation: explanation.replace(/\*\*/g, '') };
});
export const EXAM_POINTS = 10;
const snapRows = source.split('\n').filter(l => l.startsWith('| SNAP-'));
export const SNAPS = Object.fromEntries(snapRows.map(line => {
  const [id, , description] = line.slice(1, -1).split('|').map(s => s.trim());
  const code = id.slice(5);
  return [id, { name: `${PEOPLE[code]} · ${sections[code === 'HE' ? 'LAB-HE' : `LAB-${code}`].title}`, description,
    image: `${import.meta.env.BASE_URL}assets/snaps/${id}.webp` }];
}));
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
export const mainRows = id => rows(id);
export const repeatRow = code => rows('TALK-REPEAT').find(r => r[0].startsWith(PEOPLE[code] + ' '));
export const followRow = code => rows('LAB-FOLLOW').find(r => r[0].startsWith(PEOPLE[code] + ','));
export const quietLine = (id, code) => actorLines(bullets(id).find(l => l.includes('수소 “')) || '').find(q => q.who === PEOPLE[code]);

// 승인된 추천표. 조건부 변화와 1회 적용은 엔진에서 처리하며 UI는 계산하지 않는다.
const UP = RULES.up; const DOWN = RULES.down;
export const RELATIONS = {
  'RE-H': [UP, 0, UP], 'RE-HE': [UP, 0], 'RE-C': [UP, DOWN, UP], 'RE-NA': [UP, 0, 0],
  'RE-MG': [UP, 0], 'RE-CA': [UP, 0, UP], 'RE-CL': [UP, 0],
  'LAB-H': [UP, 0], 'LAB-HE': [UP, 0], 'LAB-C': [UP, 0, UP], 'LAB-NA': [UP, 0, UP],
  'LAB-MG': [UP, 0, DOWN], 'LAB-CA': [UP, 0], 'LAB-CL-read': [UP, UP],
};
