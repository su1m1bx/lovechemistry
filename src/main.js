import './style.css';
import { fresh, advance, options, metadata, samples, measured, labAction, decodeSave } from './engine.js';
import { CHARACTERS, RULES, SAVE_KEY, README_URL } from './config.js';
import { NOTES } from './script.js';

const app = document.querySelector('#app');
let state = null;
let screen = 'title';
let message = '';
let panel = '';
const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};
function button(text, run, disabled = false, cls = '') {
  const b = el('button', text, cls); b.type = 'button'; b.disabled = disabled;
  b.addEventListener('click', () => { run(); render(); });
  return b;
}
function help() {
  if (README_URL.startsWith('https://github.com/')) window.open(README_URL, '_blank', 'noopener,noreferrer');
  else message = 'GitHub 원격 주소가 제공되지 않았습니다. 프로젝트 README 링크 설정이 필요합니다.';
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) throw new Error('저장된 진행이 없습니다.');
    const restored = decodeSave(raw); state = restored; screen = 'play'; panel = ''; message = '저장한 장면과 모든 기록을 불러왔습니다.';
  } catch (error) { message = `불러오기 실패: ${error.message}`; }
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); message = '현재 장면·선택·호감도·실험 상태를 저장했습니다.'; }
  catch { message = '저장하지 못했습니다. 브라우저 저장 공간 또는 접근 권한을 확인해 주세요. 현재 진행은 유지됩니다.'; }
}
function topbar() {
  const header = el('header');
  header.append(el('span', 'L&C / 러브 앤 케미스트리', 'brand'));
  const nav = el('nav'); nav.setAttribute('aria-label', '게임 메뉴');
  if (screen === 'play') {
    nav.append(button('저장', save), button('불러오기', load), button('핵심 노트', () => { panel = panel === 'notes' ? '' : 'notes'; }), button('기록', () => { panel = panel === 'records' ? '' : 'records'; }), button('시작 화면', () => { screen = 'title'; panel = ''; }));
  }
  nav.append(button('도움말 ↗', help)); header.append(nav); return header;
}
function titleScreen(main) {
  main.className = 'title-screen';
  const intro = el('section', undefined, 'intro');
  intro.append(el('p', 'A SMALL SCHOOL STORY', 'eyebrow'), el('h1', '러브 앤\n케미스트리'), el('p', '같은 자료를, 서로 다른 마음으로.\n새로운 학교에서 시작하는 짧은 두 날의 이야기.', 'subtitle'), el('p', '첫 시제품 · 1~2일차 대표 구간', 'edition'));
  const card = el('section', undefined, 'menu-card');
  card.append(el('span', '01 — 처음 만나는 학교', 'eyebrow'), el('h2', '이야기를 시작할까요?'));
  card.append(button('새 게임', () => { screen = 'name'; message = ''; }, false, 'primary'), button('불러오기', load));
  if (state) card.append(button('현재 진행 계속하기', () => { screen = 'play'; }));
  card.append(button('도움말 · GitHub README ↗', help), el('p', '저장은 이 브라우저의 LocalStorage에 보관됩니다. 새 게임은 기존 저장 슬롯을 덮어쓰지 않습니다.', 'muted'));
  main.append(intro, card);
}
function nameScreen(main) {
  main.className = 'name-screen'; const form = el('form', undefined, 'menu-card');
  const label = el('label', '학교에서 불릴 이름'); label.htmlFor = 'player-name';
  const input = el('input'); input.id = 'player-name'; input.name = 'name'; input.maxLength = 20; input.required = true; input.autocomplete = 'off'; input.placeholder = '1~20자';
  const submit = el('button', '등교하기', 'primary'); submit.type = 'submit';
  form.append(el('p', '전학 첫날', 'eyebrow'), el('h1', '이름을 알려 주세요.'), label, input, submit, button('돌아가기', () => { screen = 'title'; }));
  form.addEventListener('submit', event => { event.preventDefault(); const name = input.value.trim(); if (!name) { input.setCustomValidity('공백이 아닌 이름을 입력해 주세요.'); input.reportValidity(); return; } state = fresh(name); screen = 'play'; message = ''; render(); });
  input.addEventListener('input', () => input.setCustomValidity('')); main.append(form); requestAnimationFrame(() => input.focus());
}
function notebook() {
  const box = el('aside', undefined, 'panel'); box.append(el('h2', panel === 'notes' ? '받은 핵심 노트' : '선택과 실제 경험'), button('닫기', () => { panel = ''; }));
  if (panel === 'notes') {
    if (!state.notes.length) box.append(el('p', '아직 받은 핵심 노트가 없습니다.'));
    state.notes.forEach(n => box.append(el('h3', n === 'A-02' ? `원소와 물질 · ${state.events.noteStyle || '수업'}` : '이온·화합물과 전도성'), el('p', NOTES[n], 'pre')));
  } else {
    box.append(el('p', '관계 단계는 수치 요약입니다. 실제 만남과 대화 기록은 별도로 보관합니다.', 'muted'));
    const list = el('dl');
    Object.entries(state.choices).forEach(([key, value]) => {
      const applied = state.applied[key];
      list.append(el('dt', key), el('dd', `${typeof value === 'number' ? `${value + 1}번 선택` : value}${applied?.who ? ` · ${applied.who} ${applied.actual > 0 ? '+' : ''}${applied.actual} (대본 ${applied.requested > 0 ? '+' : ''}${applied.requested})` : ''}`));
    });
    box.append(list, el('h3', '경험 기록'), el('pre', JSON.stringify(state.events, null, 2)));
  }
  return box;
}
function experiment() {
  const lab = state.lab; const task = lab.task;
  const box = el('section', undefined, 'lab'); box.setAttribute('aria-label', '전도성 시뮬레이터');
  box.append(el('p', 'SCHOOL SIMULATOR / 동일 감도 · 별도 깨끗한 가상 시료', 'eyebrow'), el('h2', '식염의 상태와 전도성'), el('p', '모든 조작은 화면 안의 가상 실험입니다. 실제 기기와 연결되지 않습니다.', 'muted'));
  const controls = el('div', undefined, 'lab-controls');
  if (task) {
    controls.append(el('p', `이번 조건: ${samples[task.sample]} · 먼저 시료를 선택하세요.`));
    const selectors = el('div', undefined, 'sample-buttons');
    Object.entries(samples).forEach(([key, label]) => {
      const b = button(label, () => labAction(state, 'select', key), key !== task.sample, lab.selected === key ? 'selected' : '');
      b.setAttribute('aria-pressed', String(lab.selected === key)); selectors.append(b);
    }); controls.append(selectors);
    if (task.sample === 'salt') {
      controls.append(button('별도 순수한 물에 식염 넣기', () => labAction(state, 'add'), lab.selected !== 'salt' || lab.prepared), button('완전히 녹이기', () => labAction(state, 'dissolve'), !lab.prepared || lab.dissolved), el('p', lab.dissolved ? '결정이 사라졌습니다 · 완전히 녹음' : lab.prepared ? '결정이 남아 있습니다 · 녹이기 필요' : '새 시료 준비 전', 'sample-state'));
    }
    controls.append(button('측정', () => labAction(state, 'measure'), !lab.selected || (lab.selected === 'salt' && !lab.dissolved), 'primary'));
  }
  const lamp = el('div', undefined, `lamp ${lab.lamp === '켜짐' ? 'on' : ''}`); lamp.setAttribute('role', 'status'); lamp.append(el('span', '', 'bulb'), el('span', `표시등: ${lab.lamp || '미측정'}`)); controls.append(lamp);
  box.append(controls, el('h3', '관찰 기록 · 실제 측정만 기록'));
  const table = el('table'); const head = el('tr'); ['순서', '시료', '표시등'].forEach(text => head.append(el('th', text))); const thead = el('thead'); thead.append(head); table.append(thead); const body = el('tbody');
  lab.observations.forEach((o, i) => { const tr = el('tr'); [String(i + 1), samples[o.sample] + (o.sample === 'salt' && i > 2 ? ' (재측정)' : ''), o.result].forEach(text => tr.append(el('td', text))); body.append(tr); });
  Object.entries(samples).filter(([key]) => !measured(state, key)).forEach(([, label]) => { const tr = el('tr'); ['—', label, '미측정'].forEach(text => tr.append(el('td', text))); body.append(tr); });
  table.append(body); box.append(table, el('p', '꺼짐은 전류가 절대 0이라는 뜻이 아닙니다. 표시등만으로 이온 종류나 금속 존재를 식별하지 않습니다.', 'muted')); return box;
}
function playScreen(main) {
  main.className = 'play-screen'; const meta = metadata(state);
  const strip = el('section', undefined, 'day-strip'); strip.append(el('strong', `DAY 0${meta.day}`), el('span', meta.time), el('span', meta.location), el('span', state.scene, 'scene-id')); main.append(strip);
  const affinity = el('details', undefined, 'affinity'); affinity.append(el('summary', `호감도 · 수소 ${state.affinity['수소']} / 나트륨 ${state.affinity['나트륨']} / 탄소 ${state.affinity['탄소']}`));
  const meters = el('div', undefined, 'meters'); CHARACTERS.forEach(c => { const item = el('div'); const stage = RULES.stages.find(([n]) => state.affinity[c] >= n)[1]; item.append(el('span', `${c} · ${state.affinity[c]}/${RULES.max} · ${stage}`)); const meter = el('meter'); meter.min = RULES.min; meter.max = RULES.max; meter.value = state.affinity[c]; meter.setAttribute('aria-label', `${c} 호감도`); item.append(meter); meters.append(item); }); affinity.append(meters); main.append(affinity);
  if (panel) main.append(notebook());
  const current = state.queue[state.index];
  const stage = el('section', undefined, 'stage'); stage.setAttribute('aria-label', '캐릭터 영역');
  const cast = state.scene.startsWith('C') && state.scene !== 'C-summary' ? '나트륨' : state.scene === 'B-03' ? '탄소' : state.scene === 'B-04-talk' ? '나트륨' : state.scene.startsWith('A') && (!state.scene.startsWith('A-04') || state.place === '도서관') || state.scene === 'B-01' ? '수소' : '';
  stage.append(el('span', meta.location, 'location-label'));
  const portrait = el('div', undefined, 'portrait'); portrait.setAttribute('aria-label', cast ? `${cast} 이미지 영역 (비어 있음)` : '빈 이미지 영역'); stage.append(portrait);
  stage.append(el('span', cast || '플레이어', 'character-name'), el('span', '캐릭터 이미지 미포함', 'image-note')); main.append(stage);
  const dialogue = el('section', undefined, 'dialogue'); dialogue.setAttribute('aria-label', '대사창');
  const who = current?.who || (state.scene === 'end' ? '시제품 종료' : state.lab.task ? '가상 실험' : '선택');
  dialogue.append(el('h2', who.startsWith('플레이어') ? `${state.name}${who.includes('독백') ? ' · 독백' : ''}` : who, 'speaker'));
  const text = current?.text || (state.scene === 'end' ? '대표 구간이 끝났습니다. 진행을 저장하거나 시작 화면으로 돌아갈 수 있습니다.' : state.lab.task ? '선택한 조건의 시료를 준비하고 측정 버튼을 눌러 주세요.' : '어떻게 할까?');
  dialogue.append(el('p', text.replaceAll('{플레이어명}', state.name), 'dialogue-text'));
  if (current) dialogue.append(button('다음 ▸', () => { advance(state); message = ''; }, false, 'next'));
  else {
    const choices = el('div', undefined, 'choices'); options(state).forEach(({ label, run, disabled }, i) => choices.append(button(`${String(i + 1).padStart(2, '0')}  ${label}`, () => { run(); message = ''; }, disabled)));
    dialogue.append(choices);
    if (state.scene === 'end') dialogue.append(button('진행 저장', save), button('시작 화면으로', () => { screen = 'title'; }));
  }
  main.append(dialogue);
  if (state.scene.startsWith('C') && state.scene !== 'C-07') main.append(experiment());
}
function render() {
  const focusedLabel = document.activeElement?.textContent;
  app.replaceChildren(topbar()); const main = el('main');
  if (screen === 'title') titleScreen(main); else if (screen === 'name') nameScreen(main); else playScreen(main);
  app.append(main); const status = el('p', message, 'status'); status.setAttribute('role', 'status'); app.append(status, el('footer', 'LOVE & CHEMISTRY — FRONTEND PROTOTYPE / 01'));
  // 다음 대사에서 키보드 초점을 유지한다. 선택 후에는 다음 버튼으로 이동한다.
  if (screen === 'play') {
    const target = [...app.querySelectorAll('button:not(:disabled)')].find(b => b.textContent === focusedLabel) || app.querySelector('.next') || app.querySelector('.choices button:not(:disabled)') || app.querySelector('.lab button:not(:disabled)');
    target?.focus({ preventScroll: true });
  }
}
render();
