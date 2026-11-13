// Transient UI only: no timers, notification history or deltas enter a save.
export function createSceneFeedback() {
  let previous = null, notice = null, changes = null;
  function dismiss(entry) {
    clearTimeout(entry.timer);
    const focused = entry.node?.contains(document.activeElement);
    entry.node?.remove();
    if (focused) [...document.querySelectorAll('.next, .choices button, .menu-toggle')].find(node => node.getClientRects().length)?.focus({ preventScroll: true });
  }
  function clear() {
    if (notice) dismiss(notice);
    if (changes) dismiss(changes);
    notice = changes = null;
  }
  function expire(entry, duration, done) {
    entry.timer = setTimeout(() => { dismiss(entry); done(); }, duration);
    return entry;
  }
  function update(root, current, restored = false) {
    if (!current) { clear(); previous = null; return; }
    if (restored) clear();
    if (!restored && (!previous || previous.day !== current.day || previous.location !== current.location)) {
      if (notice) dismiss(notice);
      notice = expire({ day: current.day, location: current.location }, 2000, () => { notice = null; });
    }
    if (!restored && previous) {
      const deltas = Object.entries(current.affinity).flatMap(([name, value]) => {
        const delta = value - (previous.affinity[name] ?? value);
        return delta ? [`${name} · 호감도 ${delta > 0 ? '+' : '−'}${Math.abs(delta)}`] : [];
      });
      if (deltas.length) {
        if (changes) dismiss(changes);
        changes = expire({ deltas }, 2400, () => { changes = null; });
      }
    }
    previous = { day: current.day, location: current.location, affinity: { ...current.affinity } };
    if (notice) {
      const box = document.createElement('section'); box.className = 'scene-notice'; box.setAttribute('aria-label', '날짜·장소 변경');
      const text = document.createElement('p'); text.setAttribute('role', 'status');
      const day = document.createElement('strong'); day.textContent = `DAY ${String(notice.day).padStart(2, '0')}`;
      const place = document.createElement('span'); place.textContent = notice.location;
      text.append(day, place);
      const close = document.createElement('button'); close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label', '장면 알림 닫기');
      close.addEventListener('click', event => { event.stopPropagation(); if (notice) dismiss(notice); notice = null; });
      box.append(text, close); notice.node = box; root.append(box);
    }
    if (changes) {
      const box = document.createElement('div'); box.className = 'affinity-notice'; box.setAttribute('role', 'status');
      box.textContent = changes.deltas.join('\n'); changes.node = box; root.append(box);
    }
  }
  return { update };
}
