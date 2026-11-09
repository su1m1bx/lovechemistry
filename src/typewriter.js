// Ephemeral presentation only. Never write a partial line/cursor to game state.
export function graphemes(text) {
  if (typeof Intl.Segmenter === 'function') return [...new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(text)].map(part => part.segment);
  // Older browsers: retain combining marks, emoji modifiers, ZWJ sequences,
  // flags and decomposed Hangul rather than slicing UTF-16 surrogate pairs.
  const result = [];
  for (const char of text.normalize('NFC')) {
    const last = result.at(-1);
    if (last && (/^[\p{Mark}\uFE0E\uFE0F\u{1F3FB}-\u{1F3FF}\u{E0020}-\u{E007F}]$/u.test(char) || char === '\u200D' || last.endsWith('\u200D') || (/^\p{Regional_Indicator}$/u.test(char) && /^\p{Regional_Indicator}$/u.test(last)))) result[result.length - 1] += char;
    else result.push(char);
  }
  return result;
}

export function createTypewriter() {
  let identity = null, text = '', parts = [], count = 0, timer, node, visible, paused = false;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  function detach() { clearTimeout(timer); timer = undefined; node = visible = null; }
  function paint() {
    if (!node?.isConnected) return;
    const typing = count < parts.length;
    if (visible) visible.textContent = parts.slice(0, count).join('');
    node.dataset.typing = String(typing);
    node.setAttribute('aria-busy', String(typing));
    const main = node.closest('main');
    if (main) main.dataset.typing = String(typing);
    const next = main?.querySelector('.next');
    if (next) { next.title = typing ? '한 번 누르면 현재 대사를 모두 표시합니다.' : '다음 대사로 진행합니다.'; next.setAttribute('aria-description', next.title); }
  }
  function schedule() {
    clearTimeout(timer);
    if (!node?.isConnected || paused || count >= parts.length) return;
    timer = setTimeout(() => { count++; paint(); schedule(); }, /[.!?。！？…]/u.test(parts[count - 1] || '') ? 110 : 30);
  }
  function finish() {
    if (!node || count >= parts.length) return false;
    clearTimeout(timer); count = parts.length; paint(); return true;
  }
  function bind(target, key, fullText, { instant = false, pause = false } = {}) {
    detach();
    if (!target) { identity = null; parts = []; count = 0; return; }
    if (identity !== key || text !== fullText) { identity = key; text = fullText; parts = graphemes(text); count = Math.min(1, parts.length); }
    node = target; paused = pause;
    if (instant || motion.matches) count = parts.length;
    if (count === parts.length) node.textContent = text;
    else {
      const accessible = document.createElement('span'); accessible.className = 'sr-only'; accessible.textContent = text;
      visible = document.createElement('span'); visible.className = 'dialogue-visible'; visible.setAttribute('aria-hidden', 'true');
      node.replaceChildren(accessible, visible);
    }
    paint(); schedule();
  }
  function pause(value) { paused = value; schedule(); }
  motion.addEventListener('change', () => { if (motion.matches) finish(); });
  return { bind, detach, finish, pause, reset() { detach(); identity = null; } };
}
