// The two revised choices have independent meanings, not retroactive score fixes.
export const CHOICE_VERSION = 'choices-2026-11-05';
const definitions = {
  'RE-C': { index: 1, meaning: 'C-READABILITY', oldMeaning: 'C-FOCUS-LEGACY',
    label: '“게시할 건 큰 제목 쪽에 한 표. 난 한눈에 읽히는 게 좋아.”',
    response: '탄소 “역시 저쪽인가. 난 작은 그림 쪽인데…… 둘 다 붙일 벽이 없다는 게 문제네.”',
    oldLabel: '“한 장만 남겨야 기억하기 쉬울 것 같아. 이번엔 무난한 쪽에 집중하자.”',
    oldResponse: '일할 땐 그게 맞을 수도 있지. 그래도 내가 좋아한 쪽까지 없어지는 건 조금 싫어.' },
  'LAB-MG': { index: 2, meaning: 'MG-OBSERVE-NOTES', oldMeaning: 'MG-HALT-LEGACY',
    label: '“저는 순서가 보여야 따라가겠어요. 이번엔 구경하면서 바뀐 곳만 적을게요.”',
    response: '마그네슘 “여기. 이 접힌 선. ……내가 너무 빨랐네.” 종이를 펴 바뀐 곳을 손가락으로 짚는다.',
    oldLabel: '“완벽한 설명서가 될 때까지는 더 접지 말고 기록부터 끝내죠.”',
    oldResponse: '정리는 필요하지만, 지금 바꿔 보려던 것까지 멈추면 재미가 없어. 오늘은 내가 먼저 해 볼게.' },
};
const legacyRows = {
  'RE-C': [
    ['“멀리선 큰 제목이 먼저야. 난 작은 그림이 있는 쪽을 더 오래 보고 싶어.”', '탄소 “전달이랑 취향을 따로 말해 주니까 내가 고를 수 있겠다.”'],
    [definitions['RE-C'].oldLabel, `탄소 “${definitions['RE-C'].oldResponse}”`],
    ['“고르기 전에 네가 아까워하는 부분부터 듣고 싶어.”', '탄소 “제목 옆의 작은 그림. 그걸 골랐던 기분은 남기고 싶어.”'],
  ],
  'LAB-MG': [
    ['“바뀐 곳을 적고 제가 한 번 접어 봐도 돼요?”', '마그네슘 “응. 내가 방금 생략했네. 여기를 바꿨어.”', '', '마그네슘 “실패한 접기에도 번호를 붙이자.”'],
    ['“지금은 움직이는 걸 구경하고 싶어요. 설명은 달라진 부분만 듣고요.”', '마그네슘 “좋아. 안 움직이는 것도 같이 보여 줄게.”', '', '마그네슘 “오늘 바뀐 곳은 내가 적어 둘게.”'],
    [definitions['LAB-MG'].oldLabel, `마그네슘 “${definitions['LAB-MG'].oldResponse}”`, '', '마그네슘 “설명할 수 있는 데부터 남겨 둘게.”'],
  ],
};
const sceneFromKey = key => key.match(/^DAY-(?:[1-9]|1[0-5]):(RE-C:C|LAB-MG:MG)$/)?.[1].replace(/:(C|MG)$/, '');
const meanings = (id, version) => [0, 1, 2].map(i => i === definitions[id].index ? version === 'legacy' ? definitions[id].oldMeaning : definitions[id].meaning : `${id}/${i}`);
export function initChoiceContent(s) {
  if (!Object.hasOwn(s, 'choiceContent')) s.choiceContent = {};
  if (!Object.hasOwn(s, 'choiceMeanings')) s.choiceMeanings = {};
  if (!s.choiceContent || typeof s.choiceContent !== 'object' || Array.isArray(s.choiceContent) ||
    !s.choiceMeanings || typeof s.choiceMeanings !== 'object' || Array.isArray(s.choiceMeanings)) return;
  for (const [key, value] of Object.entries(s.choices)) {
    const id = sceneFromKey(key); if (!id || s.choiceMeanings[key]) continue;
    const def = definitions[id];
    const proof = s.period.history.some(h => h.day === Number(key.match(/^DAY-(\d+):/)[1]) && h.text === def.oldLabel) ||
      s.eventId === key && s.queue.some(q => q.text === def.oldResponse);
    s.choiceMeanings[key] = { contentVersion: 'legacy', meaning: value === def.index && proof ? def.oldMeaning : 'legacy' };
  }
  // A serialized, unfinished old scene must finish with its original choices.
  if (definitions[s.scene] && !s.choiceContent[s.eventId]) s.choiceContent[s.eventId] = { contentVersion: 'legacy', meanings: meanings(s.scene, 'legacy') };
}
export function enterChoiceContent(s, id) {
  if (!definitions[id]) return;
  s.choiceContent ||= {}; s.choiceMeanings ||= {};
  if (!Object.hasOwn(s.choices, s.eventId)) s.choiceContent[s.eventId] = { contentVersion: CHOICE_VERSION, meanings: meanings(id, CHOICE_VERSION) };
}
export function choiceRows(id, s, original) {
  if (!definitions[id]) return original;
  if (s?.choiceContent?.[s.eventId]?.contentVersion === 'legacy') return legacyRows[id];
  const def = definitions[id]; const result = original.map(row => [...row]);
  result[def.index][0] = def.label; result[def.index][1] = def.response;
  return result;
}
export function recordMeaning(s, id, index) {
  if (!definitions[id]) return;
  const content = s.choiceContent[s.eventId];
  s.choiceMeanings[s.eventId] = { contentVersion: content.contentVersion, meaning: content.meanings[index] };
}
export const choiceAmount = (s, id, index, amount) => definitions[id]?.index === index ? s.choiceContent?.[s.eventId]?.contentVersion === CHOICE_VERSION ? 0 : -3 : amount;
export function pastMeaning(s, id) {
  const key = Object.keys(s.choices).find(key => sceneFromKey(key) === id && s.choices[key] === definitions[id].index);
  return key ? s.choiceMeanings?.[key]?.meaning || 'legacy' : null;
}
export function validChoiceContent(s) {
  const object = v => v && typeof v === 'object' && !Array.isArray(v);
  if (!object(s.choiceContent) || !object(s.choiceMeanings)) return false;
  const version = v => ['legacy', CHOICE_VERSION].includes(v);
  return Object.entries(s.choiceContent).every(([key, v]) => {
    const id = sceneFromKey(key); return id && object(v) && version(v.contentVersion) && JSON.stringify(v.meanings) === JSON.stringify(meanings(id, v.contentVersion));
  }) && Object.entries(s.choiceMeanings).every(([key, v]) => {
    const id = sceneFromKey(key); const i = s.choices[key];
    return id && object(v) && version(v.contentVersion) && Number.isInteger(i) && i >= 0 && i < 3 &&
      (!s.choiceContent[key] || s.choiceContent[key].contentVersion === v.contentVersion) &&
      (v.meaning === meanings(id, v.contentVersion)[i] || v.contentVersion === 'legacy' && v.meaning === 'legacy');
  });
}
