import './style.css';
import { fresh, advance, options, metadata, samples, measured, labAction, decodeSave, enter as enterScene } from './engine.js';
import { RULES, SAVE_KEY, README_URL } from './config.js';
import { NOTES, choiceText, title } from './script.js';
import { PEOPLE, MET_EVENTS, PERIOD_NOTES, EXAM, SNAPS } from './period.js';
import { examAnswer, submitExam, finishExam } from './extension.js';
import { NOTE_CARDS } from './learning.js';
import { learningCard } from './cards.js';
import { snapPresentation, revealSnap } from './vn-presentation.js';
import { exam2Answer, exam2Questions, prepareExam2Commit, persistExam2, secondSceneId } from './second-term.js';
import { commitHelium, reconcileHelium, HeliumConflict, persistVerified } from './helium.js';
import { CHARACTER_ART } from './character-art.js';
import { snapImage } from './snaps.js';
import { createTypewriter } from './typewriter.js';

const app = document.querySelector('#app');
const typewriter = createTypewriter();
let loadedDialogue = false;
let state = null;
let screen = 'splash';
let message = '';
let panel = '';
const failedSnapImages = new Set();
const failedCharacterImages = new Set();
let panelReturn = '';
let restoreFocus = '';
let renderedPosition = '';
let statusTimer;
let pendingExam2 = null;
let pendingProgress = null;
let activeTab = false;
let releaseTab;
// Web Locks serialize the entire playable session, not just two LocalStorage
// writes. LocalStorage alone cannot implement a race-free multi-tab mutex.
function acquirePlayLock() {
  if (navigator.locks) navigator.locks.request('love-chemistry.active-play.v1', { ifAvailable: true }, async lock => {
    if (!lock) { render(); return; }
    activeTab = true; render(); await new Promise(resolve => { releaseTab = resolve; }); activeTab = false;
  }).catch(() => { activeTab = false; render(); });
}
acquirePlayLock();
window.addEventListener('pagehide', () => releaseTab?.());
window.addEventListener('pageshow', event => { if (event.persisted) { activeTab = false; render(); acquirePlayLock(); } });
const interactive = 'button, input, select, textarea, a, summary, [contenteditable], .learning-area, .lab, .exam, dialog';
const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};
function button(text, run, disabled = false, cls = '') {
  const b = el('button', text, cls); b.type = 'button'; b.disabled = disabled || (!activeTab && !['불러오기', '도움말 ↗', '닫기'].includes(text));
  b.addEventListener('click', event => { event.stopPropagation(); run(); render(); });
  return b;
}
function help() {
  if (README_URL.startsWith('https://github.com/')) window.open(README_URL, '_blank', 'noopener,noreferrer');
  else message = '도움말 주소를 확인해 주세요. GitHub README 주소가 필요합니다.';
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) throw new Error('저장된 진행이 없습니다.');
    const restored = decodeSave(raw); state = restored; pendingExam2 = null; pendingProgress = null; screen = 'play'; panel = ''; message = '저장한 장면과 모든 기록을 불러왔습니다.';
    // Loaded lines are always complete; the next newly entered line types.
    typewriter.reset(); loadedDialogue = true;
    if (restored.late) {
      try { const reservation = reconcileHelium(restored, localStorage, decodeSave); if (reservation) pendingProgress = { kind: 'conflict', reservation }; }
      catch (error) { pendingProgress = { kind: 'blocked', error: error.message }; }
    }
  } catch (error) { message = `불러오기 실패: ${error.message}`; }
}
function save() {
  if (!activeTab) return;
  if (pendingProgress) { message = '진행 저장/원장 복구를 먼저 완료해 주세요.'; return; }
  if (pendingExam2) { message = '저장 다시 시도로 제출·복귀를 완료하거나 시작 화면으로 돌아갈 수 있습니다.'; return; }
  snapPresentation(state);
  try {
    if (state.late) { const reservation = reconcileHelium(state, localStorage, decodeSave); if (reservation) { pendingProgress = { kind: 'conflict', reservation }; return; } }
    persistVerified(state, localStorage); message = '현재 장면·선택·호감도·실험 상태를 저장했습니다.';
  }
  catch { message = '저장하지 못했습니다. 브라우저 저장 공간 또는 접근 권한을 확인해 주세요. 현재 진행은 유지됩니다.'; }
}
function topbar() {
  const header = el('header');
  if (screen === 'play') {
    const meta = metadata(state);
    const strip = el('section', undefined, 'day-strip');
    strip.append(el('strong', `DAY ${String(meta.day).padStart(2, '0')}`), el('span', meta.time), el('span', meta.location), el('span', state.scene, 'scene-id'));
    header.append(strip);
  } else header.append(el('span', 'L&C / 러브 앤 케미스트리', 'brand'));
  const nav = el('nav'); nav.setAttribute('aria-label', '게임 메뉴');
  if (screen === 'play') {
    nav.className = 'desktop-menu';
    nav.append(...menuButtons());
    const toggle = button('메뉴', () => openPanel('menu'), false, 'menu-toggle');
    toggle.setAttribute('aria-haspopup', 'dialog'); header.append(toggle);
  }
  nav.append(button('도움말 ↗', help)); header.append(nav); return header;
}
function openPanel(next) {
  panelReturn = document.activeElement?.textContent || '메뉴';
  panel = next;
}
function closePanel() { panel = ''; restoreFocus = panelReturn; }
function menuButtons() {
  return [button('저장', save), button('불러오기', load), button('기록', () => openPanel('records')), button('핵심 노트', () => openPanel('notes')), button('시작 화면', returnHome)];
}
function returnHome() {
  if (pendingProgress) { state = null; message = '저장되지 않은 메모리 진행은 버렸습니다. 기존 저장과 성공한 요청 예약은 보존했습니다.'; }
  screen = 'title'; panel = ''; pendingExam2 = null; pendingProgress = null;
}
function logo() {
  const box = el('div', undefined, 'logo');
  const heading = el('h1'); const image = el('img', undefined, 'game-logo');
  image.src = `${import.meta.env.BASE_URL}assets/ui/logo.webp`; image.alt = '러브 앤 케미스트리'; image.width = 1698; image.height = 926;
  image.addEventListener('error', () => { image.replaceWith(document.createTextNode('러브 앤 케미스트리')); });
  heading.append(image); box.append(heading, el('span', '마음이 만나는 작은 학교 이야기', 'subtitle'));
  return box;
}
function splashScreen(main) {
  main.className = 'splash-screen';
  main.append(logo(), button('이야기 열기', () => { screen = 'title'; }, false, 'splash-skip'));
  main.addEventListener('click', () => { screen = 'title'; render(); });
}
function titleScreen(main) {
  main.className = 'title-screen';
  const decoration = el('div', undefined, 'title-decoration');
  const backdrop = el('img', undefined, 'title-panel'); backdrop.src = `${import.meta.env.BASE_URL}assets/ui/title-panel.svg`; backdrop.alt = ''; decoration.append(backdrop); main.append(decoration);
  const intro = el('section', undefined, 'intro');
  intro.append(logo());
  const card = el('section', undefined, 'menu-card');
  card.append(button('새 게임', () => { screen = 'intro'; message = ''; }, false, 'primary'), button('불러오기', load));
  if (state) card.append(button('현재 진행 계속하기', () => { screen = 'play'; }));
  card.append(button('도움말 · GitHub README ↗', help));
  const storage = el('details', undefined, 'title-storage');
  storage.append(el('summary', '저장 안내'), el('p', '저장은 이 브라우저의 LocalStorage에 보관됩니다. 새 게임은 기존 저장 슬롯을 덮어쓰지 않습니다. 헬륨 요청 원장은 일반 저장과 별도로 유지됩니다. 브라우저 데이터 삭제·개발자 도구 조작·저장과 원장의 과거 동시 복원·다른 기기는 통제할 수 없습니다. 한 탭에서만 진행할 수 있습니다.', 'muted'));
  card.append(storage);
  intro.append(card);
  const welcome = el('section', undefined, 'title-art');
  welcome.setAttribute('aria-label', '러브 앤 케미스트리 등장인물');
  const home = el('img', undefined, 'title-home'); home.src = `${import.meta.env.BASE_URL}assets/ui/home.webp`;
  home.alt = '러브 앤 케미스트리의 일곱 등장인물'; home.width = 1350; home.height = 826;
  home.addEventListener('error', () => { home.replaceWith(el('span', '등장인물 이미지 준비 중', 'title-art-fallback')); });
  welcome.append(home);
  main.append(intro, welcome);
}
function introScreen(main) {
  main.className = 'transfer-screen';
  const box = el('section');
  box.append(el('p', 'DAY 01 · 전학 첫날', 'eyebrow'), el('h1', '새로운 교실,\n새로운 만남.'), el('p', '오늘부터 이 학교에서 하루를 보낸다.\n교실 문 앞에서, 나를 부르는 목소리가 들린다.', 'subtitle'), button('이름 정하기 ▸', () => { screen = 'name'; }, false, 'primary'));
  main.append(box);
}
function nameScreen(main) {
  main.className = 'name-screen'; const form = el('form', undefined, 'menu-card');
  const label = el('label', '학교에서 불릴 이름'); label.htmlFor = 'player-name';
  const input = el('input'); input.id = 'player-name'; input.name = 'name'; input.maxLength = 20; input.required = true; input.autocomplete = 'off'; input.placeholder = '1~20자';
  const submit = el('button', '등교하기', 'primary'); submit.type = 'submit';
  form.append(el('p', '전학 첫날', 'eyebrow'), el('h1', '이름을 알려 주세요.'), label, input, submit, button('돌아가기', () => { screen = 'title'; }));
  form.addEventListener('submit', event => { event.preventDefault(); if (!activeTab) return; const name = input.value.trim(); if (!name || name.length > 20) { input.setCustomValidity('공백이 아닌 이름을 1~20자로 입력해 주세요.'); input.reportValidity(); return; } state = fresh(name); screen = 'play'; message = ''; render(); });
  input.addEventListener('input', () => input.setCustomValidity('')); main.append(form); requestAnimationFrame(() => input.focus());
}
function notebook() {
  const box = el('div', undefined, 'panel-content');
  if (panel === 'notes') {
    if (!state.notes.length) box.append(el('p', '아직 받은 핵심 노트가 없습니다.'));
    state.notes.forEach(n => {
      box.append(el('h3', n === 'A-02' ? `원소와 물질 · ${state.events.noteStyle || '수업'}` : n === 'B-02' ? '이온·화합물과 전도성' : `${Number(n.match(/\d+/)[0])}일차 핵심 노트`), el('p', NOTES[n] || PERIOD_NOTES[n], 'pre'));
      (NOTE_CARDS[n] || []).forEach(id => box.append(learningCard(id, true)));
    });
  } else {
    box.append(el('h3', '만난 사람'));
    const encounters = Object.entries(PEOPLE).map(([code, name]) => [MET_EVENTS[code], `${name} · ${code === 'H' ? '학교 안내' : code === 'C' ? '게시판 홍보물 이야기' : code === 'NA' ? '급식 게시판에서의 인사' : '직접 인사를 나눔'}`]);
    encounters.filter(([event]) => state.events[event]).forEach(([, text]) => box.append(el('p', text)));
    box.append(el('h3', '대화와 선택한 행동'));
    const list = el('dl');
    Object.entries(state.choices).filter(([key]) => /^[ABC]-/.test(key)).forEach(([key, value]) => {
      const scene = key.slice(0, 4);
      const day = key.startsWith('A') ? '1일차' : '2일차';
      let text;
      if (key.endsWith(':place') && ['A-04', 'B-04'].includes(scene)) text = `${value} 선택`;
      else if (['A-04-action', 'B-04-action'].includes(key)) {
        text = value === '공부' ? '받은 핵심 노트 다시 읽기' : value === '스킵' ? '조용히 쉬기' : scene === 'A-04' && state.choices['A-04:place'] !== '도서관' ? '아는 사람이 없어 짧게 둘러보기' : '대화 나누기';
      } else if (key === 'B-04-talk') text = choiceText('B-04', value, 2);
      else if (['A-01', 'A-02', 'A-03', 'A-05', 'B-01', 'B-02', 'B-03', 'B-05', 'C-01', 'C-02', 'C-03', 'C-04', 'C-05', 'C-06', 'C-07'].includes(key)) text = choiceText(key, value);
      if (text) list.append(el('dt', `${day} · ${title(scene)}`), el('dd', text.replaceAll('{플레이어명}', state.name)));
    });
    if (!list.children.length) list.append(el('dd', '아직 선택한 대화나 행동이 없습니다.'));
    box.append(list);
    state.period.history.forEach(h => box.append(el('p', `${h.day}일차 · ${h.who} · ${h.title}\n${h.text}`, 'pre')));
    if (state.exam.result) box.append(el('h3', '첫 시험 결과'), el('p', `10일차 · ${state.exam.result.score}/100점`));
    if (state.exam2?.result) box.append(el('h3', '둘째 시험 결과'), el('p', `20일차 · ${state.exam2.result.score}/100점`));
    if (state.events.takeover || state.events.dismiss) box.append(el('h3', '나트륨과 남은 이야기'), el('p', { unresolved: '미해결', watching: '행동을 지켜보는 중', resolved: '해소됨' }[state.mid.sodium.status]));
    const memories = [
      ['recordTaste', '수소가 좋아하는 중고 음반 가게와 버스 정류장 이야기를 나눴다.'],
      ['naSchedule', '나트륨이 방과후에 학교 시뮬레이터를 사용할 일정을 들었다.'],
      ['takeover', '나트륨에게 설명을 듣기보다 내가 대신 쓰겠다고 말했다.'],
      ['dismiss', '나트륨의 추가 측정 제안을 깎아내리는 말을 했다.'],
      ['experimentCompleted', '측정한 결과와 확인하지 못한 조건을 구분해 정리했다.'],
    ].filter(([event]) => state.events[event]);
    if (memories.length) {
      box.append(el('h3', '기억할 이야기'));
      memories.forEach(([, text]) => box.append(el('p', text)));
    }
    if (state.events.naTogether) {
      box.append(el('h3', '전도성 실험 기록'));
      state.lab.observations.forEach((o, i) => box.append(el('p', `${i + 1}번째 측정 · ${samples[o.sample]}: ${o.result}`)));
      Object.entries(samples).filter(([sample]) => !measured(state, sample)).forEach(([, label]) => box.append(el('p', `${label}: 미측정`)));
      if (state.events.interpretation) box.append(el('p', `노트와 함께 정리한 해석: ${state.events.interpretation}`));
    }
  }
  return box;
}
function modal() {
  const dialog = el('dialog', undefined, 'panel'); dialog.setAttribute('aria-labelledby', 'panel-title');
  const heading = el('div', undefined, 'panel-heading');
  const title = el('h2', panel === 'notes' ? '받은 핵심 노트' : panel === 'records' ? '선택과 실제 경험' : panel === 'exam-material' ? '시험 제공 자료' : '게임 메뉴'); title.id = 'panel-title';
  heading.append(title, button('닫기', closePanel)); dialog.append(heading);
  if (panel === 'menu') { const menu = el('div', undefined, 'panel-content mobile-menu'); menu.append(...menuButtons(), button('도움말 ↗', help)); dialog.append(menu); }
  else if (panel === 'exam-material') { const content = el('div', undefined, 'panel-content'); const second = state.scene.startsWith('EX2-'); content.append(learningCard((second ? exam2Questions(state) : EXAM)[(second ? state.exam2 : state.exam).index].card)); dialog.append(content); }
  else dialog.append(notebook());
  dialog.addEventListener('cancel', event => { event.preventDefault(); closePanel(); render(); });
  return dialog;
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
  main.className = 'play-screen';
  if (pendingProgress) { main.append(progressRecovery()); return; }
  const meta = metadata(state);
  const current = state.queue[state.index];
  const snap = snapPresentation(state);
  main.dataset.snapPhase = snap?.phase || '';
  const stage = el('section', undefined, 'stage'); stage.setAttribute('aria-label', '캐릭터 영역');
  stage.dataset.location = meta.location;
  if (snap) stage.append(snapBackdrop(snap.id));
  if (meta.cast.length && snap?.phase !== 'image') {
    const affinity = el('section', undefined, `affinity ${snap ? 'snap-cast' : ''}`); affinity.setAttribute('aria-label', '현재 등장인물 호감도');
    const meters = el('div', undefined, 'meters');
    meta.cast.forEach(c => {
      const speaking = current?.who === c;
      const item = el('div', undefined, `cast-slot ${speaking ? 'speaking' : ''}`); item.dataset.character = c;
      item.setAttribute('aria-label', speaking ? `${c} · 현재 화자` : c);
      const relationship = RULES.stages.find(([n]) => state.affinity[c] >= n)[1];
      const badge = el('div', undefined, 'cast-badge');
      badge.append(el('strong', c), el('span', `${state.affinity[c]}/${RULES.max} · ${relationship}`));
      if (speaking) badge.append(el('span', '말하는 중', 'speaking-label'));
      const meter = el('meter'); meter.min = RULES.min; meter.max = RULES.max; meter.value = state.affinity[c]; meter.setAttribute('aria-label', `${c} 호감도`);
      badge.append(meter); item.append(badge);
      if (!snap) {
        const portrait = el('div', undefined, 'portrait'); const art = CHARACTER_ART[c];
        if (art && !failedCharacterImages.has(c)) {
          portrait.classList.add('has-art');
          const image = el('img', undefined, 'standing'); image.src = art.image; image.alt = `${c} 스탠딩`;
          image.width = art.width; image.height = art.height; image.decoding = 'async';
          image.addEventListener('error', () => { failedCharacterImages.add(c); if (screen === 'play' && metadata(state).cast.includes(c)) render(); });
          portrait.append(image);
        } else {
          portrait.setAttribute('aria-label', `${c} 이미지 준비 중`);
          portrait.append(el('span', c, 'character-name'), el('span', '이미지 준비 중', 'image-note'));
        }
        item.append(portrait);
      }
      meters.append(item);
    });
    affinity.append(meters); stage.append(affinity);
  }
  main.append(stage);
  if (['EX-PAPER', 'EX-RESULT', 'EX2-PAPER', 'EX2-RESULT'].includes(state.scene)) { main.append(examScreen()); return; }
  if (current?.snap) {
    main.append(snapScreen(snap));
    main.addEventListener('click', event => { if (!event.target.closest(interactive)) nextLine(); });
    return;
  }
  const center = el('div', undefined, 'scene-content');
  const dialogue = el('section', undefined, 'dialogue'); dialogue.setAttribute('aria-label', '대사창');
  const who = current?.who || (state.scene === 'DAY16-HANDOFF' ? '현재 제공 범위' : state.lab.task ? '가상 실험' : '선택');
  dialogue.append(el('h2', who.startsWith('플레이어') ? `${state.name}${who.includes('독백') ? ' · 독백' : ''}` : who, 'speaker'));
  const text = current?.text || (state.scene === 'DAY20-HANDOFF' ? '기록을 보존하고 21일차로 이어갈 수 있습니다.' : state.scene === 'DAY16-HANDOFF' ? '기록을 보존하고 16일차로 이어갈 수 있습니다.' : secondSceneId(state.scene) && state.scene !== 'EX2-AFTER' ? '공통 학습 확인을 마쳤습니다.' : state.scene === 'DAY11-HANDOFF' ? '기록을 보존하고 11일차로 이어갈 수 있습니다.' : state.lab.task ? '선택한 조건의 시료를 준비하고 측정 버튼을 눌러 주세요.' : '어떻게 할까?');
  // Retain a card while its following explanation is spoken, without changing queue order.
  const card = current?.card || (current?.who === '화학 교사' ? state.queue[state.index - 1]?.card : null);
  if (card) {
    const area = el('section', undefined, 'learning-area'); area.tabIndex = 0; area.setAttribute('aria-label', '수업 자료'); area.append(learningCard(card)); center.append(area);
  }
  const prose = el('p', text.replaceAll('{플레이어명}', state.name), 'dialogue-text');
  if (current && !card) prose.dataset.typewriter = '';
  if (current && !card && text.length > 330) {
    const area = el('section', undefined, 'learning-area lesson-prose'); area.tabIndex = 0; area.setAttribute('aria-label', who);
    area.append(el('h3', who), prose); center.append(area);
    dialogue.append(el('p', '위의 내용을 읽고 다음으로 이어가세요.', 'reading-hint'));
  } else dialogue.append(prose);
  if (current) {
    dialogue.append(button('다음 ▸', next, false, 'next'));
    dialogue.addEventListener('click', event => { if (!event.target.closest(interactive)) nextLine(); });
  }
  else {
    const available = options(state);
    if (available.length) {
      const choices = el('section', undefined, 'choices'); choices.setAttribute('aria-label', '행동 선택');
      choices.append(el('p', '어떤 마음을 전할까?', 'eyebrow'));
      available.forEach((choice, i) => choices.append(button(`${String(i + 1).padStart(2, '0')}  ${choice.label}`, () => runChoice(choice, i), choice.disabled)));
      center.append(choices); main.classList.add('has-choices');
    }
    if (['DAY16-HANDOFF', 'DAY20-HANDOFF'].includes(state.scene)) dialogue.append(button('진행 저장', save), button('시작 화면으로', returnHome));
  }
  if (state.scene.startsWith('C') && state.scene !== 'C-07' && !center.children.length) center.append(experiment());
  if (center.querySelector('.learning-area, .lab')) main.classList.add('has-content');
  main.append(center, dialogue);
}
function next() {
  if (!activeTab || pendingProgress || screen !== 'play' || panel || !state.queue[state.index] || ['EX-PAPER', 'EX-RESULT', 'EX2-PAPER', 'EX2-RESULT'].includes(state.scene)) return;
  if (typewriter.finish()) return;
  if (state.scene.startsWith('END-')) {
    const candidate = structuredClone(state);
    if (!revealSnap(candidate)) advance(candidate);
    pendingProgress = { kind: candidate.ending.completed && !state.ending.completed ? 'ending' : 'progress', candidate }; retryProgress(); return;
  }
  if (!revealSnap(state)) advance(state);
  message = '';
}
function nextLine() { next(); render(); }
function snapBackdrop(id) {
  const snap = SNAPS[id];
  const source = snapImage(id, state.location);
  const box = el('div', undefined, 'snap-backdrop'); box.dataset.snap = id;
  if (source && !failedSnapImages.has(id)) {
    const image = el('img'); image.src = source; image.alt = snap.description;
    image.addEventListener('error', () => { failedSnapImages.add(id); if (screen === 'play' && snapPresentation(state)?.id === id) render(); });
    box.append(image);
  } else box.append(el('p', `이미지 준비 중\n${snap.description}`, 'snap-fallback'));
  return box;
}
function snapScreen(presentation) {
  const snap = SNAPS[presentation.id];
  const box = el('section', undefined, presentation.phase === 'image' ? 'snap image-phase' : 'dialogue snap'); box.setAttribute('aria-label', '이벤트 스냅');
  if (presentation.phase === 'notice') box.append(el('h2', snap.name, 'speaker'), el('p', snap.character ? `${PEOPLE[snap.character]}와 함께한 순간을 열람했습니다.` : '혼자 고른 순간을 열람했습니다.', 'dialogue-text'));
  box.append(button(presentation.phase === 'image' ? '스냅 정보 보기 ▸' : '스냅 닫고 계속', next, false, 'next'));
  return box;
}
function examScreen() {
  const second = state.scene.startsWith('EX2-');
  const title = second ? '둘째 시험' : '첫 시험';
  const questions = second ? exam2Questions(state) : EXAM;
  const box = el('section', undefined, 'exam'); box.setAttribute('aria-label', title);
  const exam = second ? state.exam2 : state.exam;
  if (state.scene === 'EX-RESULT' || state.scene === 'EX2-RESULT') {
    box.append(el('h2', `${title} 결과 · ${exam.result.score}/100점`));
    const explanations = el('div', undefined, 'exam-explanations'); explanations.tabIndex = 0; explanations.setAttribute('aria-label', '문항별 해설');
    questions.forEach((q, i) => {
      const answer = exam.result.details[i].answer;
      explanations.append(el('h3', `${i + 1}. ${q.prompt}`), el('p', `제출 답: ${answer === null ? '미응답' : q.options[answer]} · ${exam.result.details[i].points}점`), el('p', `정답: ${q.options[q.correct]}\n해설: ${q.explanation}`, 'pre'));
      if (q.card) explanations.append(learningCard(q.card));
    });
    box.append(explanations);
    box.append(button('결과 확인 · 시험 후 일과로', () => { if (second) commitSecondExam('return'); else { finishExam(state, enterScene); save(); } }, Boolean(pendingExam2), 'primary'));
  } else {
    const q = questions[exam.index];
    const heading = el('div', undefined, 'exam-heading');
    const rules = el('details', undefined, 'exam-rules'); rules.append(el('summary', '시험 안내'), el('p', '각 문항 10점, 총 100점입니다. 제출 전 답을 바꿀 수 있고, 미응답은 0점입니다. 시험 성적만으로 호감도가 바뀌지 않습니다. 답안 제출과 결과 확인 때 현재 진행을 저장합니다.'));
    heading.append(el('h2', `${title} · ${exam.index + 1}/${questions.length}`), rules); box.append(heading);
    const question = el('div', undefined, 'exam-question');
    question.append(el('h3', q.prompt));
    if (q.card) {
      question.append(learningCard(q.card));
      question.append(button('제공된 비교 자료 보기', () => openPanel('exam-material'), false, 'exam-material-toggle'));
    }
    const answers = el('fieldset'); answers.append(el('legend', '답안 선택'));
    const count = el('p'); count.setAttribute('aria-live', 'polite');
    const updateCount = () => { count.textContent = `${exam.answers.filter(a => a !== null).length}/${questions.length}문항 응답`; };
    updateCount();
    q.options.forEach((text, i) => {
      const label = el('label', undefined, 'exam-option');
      const radio = el('input'); radio.type = 'radio'; radio.name = q.id; radio.value = i; radio.checked = exam.answers[exam.index] === i;
      radio.disabled = Boolean(pendingExam2) || !activeTab;
      radio.addEventListener('change', () => { (second ? exam2Answer : examAnswer)(state, exam.index, i); updateCount(); });
      label.append(radio, el('span', text)); answers.append(label);
    }); question.append(answers); box.append(question);
    const controls = el('div', undefined, 'exam-navigation');
    controls.append(count, button('이전 문항', () => { exam.index--; }, exam.index === 0 || Boolean(pendingExam2)), button('다음 문항', () => { exam.index++; }, exam.index === questions.length - 1 || Boolean(pendingExam2)), button('답안 제출', () => { if (second) commitSecondExam('submit'); else { submitExam(state, enterScene); save(); } }, Boolean(pendingExam2), 'primary'));
    box.append(controls);
  }
  if (pendingExam2) {
    const failure = el('div', undefined, 'exam-save-failure'); failure.setAttribute('role', 'alert');
    failure.append(el('p', '진행을 저장하지 못했습니다. 아직 결과가 적용되지 않았습니다. 저장을 다시 시도하거나 시작 화면으로 돌아갈 수 있습니다.'), button('저장 다시 시도', retrySecondExam), button('시작 화면으로', () => { pendingExam2 = null; screen = 'title'; panel = ''; }));
    box.append(failure);
  }
  return box;
}
function commitSecondExam(action) {
  if (pendingExam2) return;
  pendingExam2 = prepareExam2Commit(state, action, enterScene);
  if (pendingExam2) retrySecondExam();
}
function retrySecondExam() {
  if (!pendingExam2) return;
  try {
    state = persistExam2(pendingExam2, localStorage, SAVE_KEY); pendingExam2 = null;
    message = '둘째 시험 진행을 저장했습니다.';
  } catch { message = ''; }
}
function runChoice(choice, index) {
  if (!activeTab || pendingProgress) return;
  message = '';
  if (choice.home) { returnHome(); return; }
  if (choice.heliumRequest) {
    pendingProgress = { kind: 'helium', source: structuredClone(state) }; retryProgress();
  } else if (state.scene.startsWith('END-') || ['DAY16-HANDOFF', 'DAY20-HANDOFF'].includes(state.scene) || state.scene === 'EX2-AFTER' && !state.late || state.scene === 'LATE-CLOSE' && [20, 30].includes(state.day)) {
    // Persist the new run identity on expansion, and the resumable day-20
    // boundary, before publishing either transition. Failed retries keep ID.
    const candidate = structuredClone(state); options(candidate)[index].run();
    pendingProgress = { kind: 'progress', candidate }; retryProgress();
  } else choice.run();
}
function retryProgress() {
  if (!activeTab || !pendingProgress) return;
  try {
    if (pendingProgress.kind === 'helium') state = commitHelium(pendingProgress.source, localStorage, decodeSave);
    else if (['progress', 'ending'].includes(pendingProgress.kind)) state = persistVerified(pendingProgress.candidate, localStorage);
    else return;
    pendingProgress = null; message = '진행을 저장했습니다.';
  } catch (error) {
    if (error instanceof HeliumConflict) pendingProgress = { kind: 'conflict', reservation: error.reservation };
    else pendingProgress.error = error.message;
  }
}
function progressRecovery() {
  const box = el('section', undefined, 'exam-save-failure'); box.setAttribute('role', 'alert');
  const kind = pendingProgress.kind;
  if (kind === 'conflict') {
    box.append(el('p', '이전 저장과 이미 예약된 헬륨 요청이 충돌합니다. 선택한 저장은 덮어쓰지 않았습니다. 예약 당시 위치와 같은 요청을 복구하거나 시작 화면으로 돌아가세요.'),
      button('예약 당시 위치에서 복구', () => {
        try {
          const source = decodeSave(pendingProgress.reservation.source);
          state = source; pendingProgress = { kind: 'helium', source }; retryProgress();
        } catch (error) { pendingProgress = { kind: 'blocked', error: error.message }; }
      }));
  } else if (kind === 'blocked') box.append(el('p', pendingProgress.error));
  else if (kind === 'ending') box.append(el('p', '결말을 저장하지 못했습니다. 다시 저장할 수 있습니다.'), button('다시 저장', retryProgress), button('이 화면에 머물기', () => {}));
  else box.append(el('p', '진행을 저장하지 못했습니다. 아직 결과가 적용되지 않았습니다. 저장을 다시 시도하거나 시작 화면으로 돌아갈 수 있습니다.'), button('저장 다시 시도', retryProgress));
  if (pendingProgress.error && kind !== 'blocked') box.append(el('p', pendingProgress.error));
  box.append(button('이전 저장 불러오기', load), button('시작 화면으로', returnHome));
  return box;
}
function render() {
  // Detach before replacing DOM: a stale callback can never paint a new scene.
  typewriter.detach();
  const focusedLabel = document.activeElement?.textContent;
  const position = `${screen}:${state?.day}:${state?.scene}:${state?.index}:${state?.queue[state.index]?.text}:${state?.exam.index}`;
  const scrollPositions = position === renderedPosition ? [...app.querySelectorAll('.panel-content, .learning-area, .lab, .exam-question, .exam-explanations, .dialogue-text')].map(node => [node.className, node.scrollTop]) : [];
  renderedPosition = position;
  app.dataset.screen = screen;
  app.replaceChildren(topbar()); const main = el('main');
  if (screen === 'splash') splashScreen(main); else if (screen === 'title') titleScreen(main); else if (screen === 'intro') introScreen(main); else if (screen === 'name') nameScreen(main); else playScreen(main);
  app.append(main);
  const typed = main.querySelector('[data-typewriter]');
  const lineKey = `${position}:${main.dataset.snapPhase || ''}`;
  typewriter.bind(typed, lineKey, typed?.textContent || '', { instant: loadedDialogue, pause: Boolean(panel) || document.hidden });
  loadedDialogue = false;
  if (!activeTab) app.append(el('p', navigator.locks ? '다른 탭이 진행 중입니다. 이 탭은 읽기 전용입니다. 진행 중인 탭을 닫은 뒤 새로고침해 주세요.' : '단일 탭 잠금을 지원하지 않는 브라우저입니다. 진행과 헬륨 요청은 차단했습니다. 지원 브라우저에서 열어 주세요.', 'status'));
  const status = el('p', message, 'status'); status.setAttribute('role', 'status'); app.append(status);
  clearTimeout(statusTimer);
  if (message) statusTimer = setTimeout(() => { status.textContent = ''; message = ''; }, 4000);
  if (panel) { const dialog = modal(); dialog.append(status); app.append(dialog); dialog.showModal(); }
  for (const [cls, top] of scrollPositions) app.getElementsByClassName(cls)[0]?.scrollTo(0, top);
  if (screen === 'play') {
    const root = panel ? app.querySelector('dialog') : app;
    const target = [...root.querySelectorAll('button:not(:disabled)')].find(b => b.textContent === (restoreFocus || focusedLabel) && b.getClientRects().length) || (restoreFocus ? app.querySelector('.menu-toggle') : null) || root.querySelector('.next') || root.querySelector('.choices button:not(:disabled)') || root.querySelector('button:not(:disabled)');
    target?.focus({ preventScroll: true });
  }
  restoreFocus = '';
}
document.addEventListener('keydown', event => {
  if (event.repeat && event.key === 'Enter') { event.preventDefault(); return; }
  if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'Enter' && !event.target.closest(interactive)) {
    event.preventDefault();
    if (screen === 'splash') { screen = 'title'; render(); }
    else if (screen === 'intro') { screen = 'name'; render(); }
    else if (screen === 'play' && !panel) nextLine();
  }
  if (event.key === 'Escape' && screen === 'play' && !panel) {
    // Consume only the opening key: its native default would cancel the newly
    // opened dialog. Later Escape inputs still use the dialog's cancel handler.
    event.preventDefault(); openPanel('menu'); render();
  }
  if (['ArrowDown', 'ArrowUp'].includes(event.key) && event.target.closest('.choices')) {
    event.preventDefault(); const choices = [...app.querySelectorAll('.choices button:not(:disabled)')];
    choices[(choices.indexOf(document.activeElement) + (event.key === 'ArrowDown' ? 1 : choices.length - 1)) % choices.length]?.focus();
  }
});
document.addEventListener('visibilitychange', () => typewriter.pause(Boolean(panel) || document.hidden));
render();
setTimeout(() => { if (screen === 'splash') { screen = 'title'; render(); } }, 650);
