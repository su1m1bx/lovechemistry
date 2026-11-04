// Presentation only: never award a snap, complete an event, or reconstruct a queue here.
// Old v2 saves have no ui field. Their actual queue/cursor remains the source of truth.
export function snapPresentation(state) {
  const current = state.queue[state.index];
  const stored = state.ui?.snap;
  if (current?.snap) {
    const same = stored?.id === current.snap && stored.scene === state.scene &&
      stored.day === state.day && stored.index === state.index;
    const phase = same && stored.phase === 'notice' ? 'notice' : 'image';
    state.ui = { snap: { id: current.snap, scene: state.scene, day: state.day, index: state.index, phase } };
    return state.ui.snap;
  }
  state.ui = { snap: null };
  // Snap follow-up is the original queue after the interruption. A new queue or
  // explicit departure ends it; loading a pre-UI save at a follow-up works too.
  if (!current) return null;
  for (let i = state.index; i >= 0; i--) {
    const line = state.queue[i];
    if (line.cast?.length === 0) return null;
    if (line.snap) return { id: line.snap, phase: 'follow' };
  }
  return null;
}

export function revealSnap(state) {
  const snap = snapPresentation(state);
  if (snap?.phase !== 'image') return false;
  state.ui.snap.phase = 'notice';
  return true;
}
