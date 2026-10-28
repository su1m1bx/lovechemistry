import source from '../docs/story.md?raw';

// 대본의 원문을 사용한다. 장면 ID / 표의 행 번호는 서사상의 선택 지점이다.
const sections = Object.fromEntries([...source.matchAll(/#### ([ABC]-\d\d) — ([^\n]+)\n([\s\S]*?)(?=\n#### |\n### |$)/g)]
  .map(([, id, title, body]) => [id, { title, body }]));
export function rows(id, table = 0) {
  const tables = sections[id].body.match(/(?:^\|.*\n?)+/gm) || [];
  return (tables[table] || '').trim().split('\n').slice(2)
    .map(line => line.slice(1, -1).split(/(?<!\\)\|/).map(s => s.trim()));
}
export const title = id => sections[id]?.title || '';
export const prose = id => sections[id].body.split('\n\n').filter(p => /^(수소|플레이어|화학 교사|탄소|나트륨):/.test(p));
export const note = id => sections[id].body.split('\n').filter(l => l.startsWith('- ') && !l.startsWith('- **')).join('\n').replaceAll(/^- /gm, '• ');
export const NOTES = { 'A-02': note('A-02'), 'B-02': note('B-02'), 'C-01': note('C-01') };
export function speech(text) {
  const matches = [...text.matchAll(/(수소|플레이어 독백|플레이어|화학 교사|탄소|나트륨): “([^”]+)”/g)];
  return matches.length ? matches.map(([, who, text]) => ({ who, text })) : [{ who: '안내', text }];
}
export const lines = (...text) => text.flat().flatMap(speech);
export const dialogue = id => lines(prose(id));
export const choiceText = (id, row, table = 0) => rows(id, table)[row][0].replaceAll('‘', '').replaceAll('’', '');
export const reaction = (id, row, table = 0) => lines(rows(id, table)[row][1]);
