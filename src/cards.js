import { CARDS } from './learning.js';

const node = (tag, text, cls) => {
  const el = document.createElement(tag); if (text) el.textContent = text; if (cls) el.className = cls; return el;
};
function table(headers, rows) {
  const t = node('table'); const head = node('thead'); const tr = node('tr');
  headers.forEach(text => { const th = node('th', text); th.scope = 'col'; tr.append(th); }); head.append(tr); t.append(head);
  const body = node('tbody'); rows.forEach(row => { const tr = node('tr'); row.forEach(text => tr.append(node('td', text))); body.append(tr); }); t.append(body); return t;
}
function comparison(items) {
  const box = node('div', '', 'card-comparison');
  items.forEach(([title, diagram, caption]) => {
    const part = node('div', '', 'card-part'); part.append(node('h4', title), node('div', diagram, 'science-diagram'), node('p', caption)); box.append(part);
  }); return box;
}
export function learningCard(id, feedback = false) {
  const card = CARDS[id]; const box = node('figure', '', 'learning-card'); box.setAttribute('aria-label', card.title); box.dataset.card = id;
  box.append(node('h3', card.title));
  if (card.headers) box.append(table(card.headers, card.rows));
  if (card.type === 'molecules') box.append(comparison([
    ['수소 H₂', '[ H ] — [ H ]', '수소 원자 2개 · 한 원소로 된 물질'], ['물 H₂O', '[ H ] — [ O ] — [ H ]', '수소 2개 + 산소 1개 · 화합물'],
  ]));
  if (card.type === 'ions') box.append(comparison([
    ['고체 식염 · 격자에 묶임', 'Na⁺　Cl⁻　Na⁺\nCl⁻　Na⁺　Cl⁻\nNa⁺　Cl⁻　Na⁺', '이온 있음 · 자유로운 이동 어려움'],
    ['식염수 · 이온이 나뉘어 퍼짐', 'Na⁺ →　　　　　← Cl⁻\n　　　　← Cl⁻\n　　 Na⁺ →', '이동 가능한 이온이 전류를 운반'],
  ]));
  if (card.type === 'carbon') box.append(comparison([
    ['다이아몬드 · 그물 구조', '　　C\n　╱ │ ╲\n C — C — C\n　╲ │ ╱\n　　C', '탄소 원자 · 입체 그물 구조의 설명용 모형'],
    ['흑연 · 층 구조', 'C — C — C — C\n　C — C — C\n\nC — C — C — C\n　C — C — C', '탄소 원자 · 층 구조 · 전기가 통함'],
  ]));
  if (card.type === 'periodic') {
    const grid = node('div', '', 'periodic-grid'); grid.append(node('p', '족 ↓ 세로 열 · 주기 → 가로 행'));
    grid.append(table(['주기 / 족', '1족', '2족', '…', '18족'], [['1주기', 'H', '—', '…', 'He'], ['2주기', 'Li', 'Be', '…', 'Ne'], ['3주기', 'Na ★', 'Mg', '…', 'Ar']]));
    grid.append(node('p', '★ Na = 1족 · 3주기')); box.append(grid);
  }
  if (card.type === 'shells') box.append(node('p', '1족 세로 열: Li (2주기) ↓ Na (3주기) · 껍질 번호는 안쪽부터', 'science-diagram'));
  if (card.caption) box.append(node('figcaption', card.caption, 'muted'));
  if (feedback) box.append(node('p', card.feedback));
  return box;
}
