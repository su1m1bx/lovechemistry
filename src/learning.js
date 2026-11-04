// 검토된 학생용 내용만 사용한다. 제작 지시는 이 데이터나 화면에 포함하지 않는다.
const talk = text => ({ who: '화학 교사', text, kind: 'dialogue' });
const card = id => ({ who: '핵심 카드', text: CARDS[id].title, kind: 'card', card: id });
export const CARDS = {
  molecules: { title: '같은 원소가 있어도, 물질은 다를 수 있어', type: 'molecules', caption: '설명용 모형 · 결합선은 실제 결합각을 나타내지 않음', feedback: '물에는 수소와 산소, 두 원소가 함께 있습니다. 그래서 화합물이라고 해요.' },
  ions: { title: '이온이 되어도 원소는 그대로', headers: ['형태', '양성자 수', '전자 수'], rows: [['중성 Na 원자', '11', '11'], ['Na⁺ 이온', '11 · 그대로', '10 · 하나 줄어듦']], feedback: '전자 수는 11에서 10으로 줄고, 원소를 구분하는 양성자 수 11은 그대로입니다.' },
  materials: { title: '금속과 식염 속 이온은 달라', headers: ['형태', '구분'], rows: [['Na 금속', '나트륨 홑원소 물질'], ['식염 NaCl', 'Na⁺와 Cl⁻로 된 이온 화합물']], feedback: '식염 속 이온을 금속 나트륨과 같은 것으로 보면 안 돼요. 섭취량 판단은 별도입니다.' },
  conduction: { title: '이온이 있느냐, 움직일 수 있느냐', type: 'ions', caption: '설명용 모형 · 물 분자 생략 · 용액의 화살표는 전압을 걸었을 때 각 이온의 이동 방향 예시', feedback: '고체에도 이온은 있지만 자유롭게 이동하지 못합니다. 식염수에서는 이동할 수 있는 이온이 전류를 운반해요.' },
  shells: { title: '껍질별 전자 수로 위치를 비교해', type: 'shells', headers: ['중성 바닥상태 원자', '안쪽 1번 껍질', '2번 껍질', '3번 껍질', '위치'], rows: [['Li', '2', '1', '—', '1족 · 2주기'], ['Na', '2', '8', '1', '1족 · 3주기']], feedback: '바깥 전자는 둘 다 1개입니다. Na는 전자가 들어 있는 껍질이 셋이라 3주기예요.' },
  exceptions: { title: '수소와 헬륨의 예외도 함께', headers: ['원소', '기억할 점'], rows: [['H', '1족 비금속 · 알칼리 금속 아님'], ['He', '첫 껍질에 2개가 가득 찬 18족']], feedback: '족의 일반적인 패턴을 예외 없이 적용하지 마세요.' },
  periodic: { title: '세로는 족, 가로는 주기', type: 'periodic', feedback: '세로 열은 족, 가로 행은 주기입니다. Na의 위치를 다시 짚으면 1족, 3주기입니다.' },
  history: { title: '빈칸도 근거가 되는 표', headers: ['초기 주기율표', '현대 주기율표'], rows: [['원자량·성질을 바탕으로 빈칸 예측', '원자번호 순으로 배열']], feedback: '빈칸은 발견하지 않은 원소를 예측하고 나중에 확인하려고 남긴 거예요.' },
  carbon: { title: '같은 탄소, 다른 배열', type: 'carbon', caption: '설명용 모형 · 연필심 전체가 순수 흑연인 것은 아님', feedback: '원자의 종류는 둘 다 탄소입니다. 같은 원소지만 배열이 다른 이런 물질을 동소체라고 해요. 흑연은 전기가 통해요.' },
  magnesium: { title: '같은 족도 모든 성질이 같지는 않아', headers: ['제공된 자료', '족', '찬물에서의 반응'], rows: [['Mg', '2족', 'Ca보다 훨씬 느림'], ['Ca', '2족', '물과 반응']], caption: '자료 비교 · 실제 금속 조작 없음', feedback: '속도가 반드시 같을까요? 아니에요. 제시된 조건에서 차이가 있습니다.' },
  observation: { title: '관찰과 설명을 다른 칸에', headers: ['구분', '교사 제공 예시'], rows: [['관찰', '식염수 측정에서 표시등 켜짐'], ['노트로 설명', '용액의 이온 이동으로 전류가 흐름']], caption: '교사 제공 예시 · 플레이어의 새 실측이 아님', feedback: '이 표시만으로 이온의 종류를 식별한 것은 아닙니다. 다른 모든 용질을 확인한 것도 아니에요.' },
};
export const NOTE_CARDS = {
  'A-02': ['molecules'], 'B-02': ['ions', 'materials', 'conduction'], 'C-01': ['conduction'],
  'D3-NOTE': ['ions'], 'D4-NOTE': ['periodic', 'shells', 'exceptions'], 'D5-NOTE': ['history'], 'D6-NOTE': ['carbon'], 'D8-NOTE': ['magnesium'],
  'D11-NOTE': ['molecules'], 'D12-NOTE': ['ions'], 'D13-NOTE': ['periodic'], 'D14-NOTE': ['conduction'], 'D15-NOTE': ['observation'],
};
export const LESSON_NOTES = {
  'A-02': '원소는 양성자 수로 구분하는 원자의 종류다. H₂는 수소 원자 두 개가 결합한 홑원소 물질, H₂O는 수소와 산소가 결합한 화합물이다.',
  'B-02': '중성 Na는 양성자 11·전자 11, Na⁺는 양성자 11·전자 10이다. 식염 속 Na⁺·Cl⁻는 금속 Na·Cl₂ 기체와 다르다. 고체에도 이온은 있으나 자유롭게 움직이지 못한다. 식염수에서는 이온이 이동한다. 표시등만으로 이온 종류를 알아낼 수 없고, 꺼짐은 이 기기의 미감지다.',
  'C-01': '식염은 Na⁺와 Cl⁻로 된 이온 화합물이다. 물에 완전히 녹이면 이온이 용액 안에서 이동할 수 있다. 금속 Na가 생기지 않는다. 순수한 물은 이 감도에서 꺼짐이다. 이온의 종류는 시료 라벨·노트와 함께 해석한다. 다른 용질이나 전극 생성물은 이 비교로 확인한 범위가 아니다.',
  ...Object.fromEntries(Object.entries(NOTE_CARDS).filter(([id]) => id.startsWith('D')).map(([id, cards]) => [id, cards.map(c => `${CARDS[c].title}\n${CARDS[c].feedback}`).join('\n\n')])),
};
export function lessonCards(note) {
  return (NOTE_CARDS[note] || []).flatMap(id => [card(id), talk(CARDS[id].feedback)]);
}
export const MID_LESSONS = {
  11: ['오늘은 같은 원소가 들어 있어도 같은 물질은 아니라는 것 하나만 다시 봅시다.', 'H₂와 H₂O는 다른 물질입니다. 물이 수소 기체처럼 타는 것은 아니에요.', '비교를 보고 마치기', '글자 일부가 같아도 전체 물질을 봐야겠네.'],
  12: ['오늘은 원자가 이온이 되어도 원소가 달라지지 않는다는 한 가지입니다.', '전자가 하나 줄어 양전하를 띱니다. 양성자 수는 그대로라 나트륨이라는 원소는 바뀌지 않아요.', '두 칸을 비교하고 마치기', '달라진 수와 그대로인 수를 나눠 보자.'],
  13: ['오늘은 주기율표에서 족과 주기를 찾는 방법만 짚습니다.', 'Na는 1족, 3주기에 있습니다. 족은 세로 열 번호, 주기는 가로 행 번호예요.', '표의 방향을 보고 마치기', '방향 표시부터 읽자.'],
  14: ['오늘은 식염에서 이온이 움직일 수 있는지만 비교해요.', '고체에도 이온은 있습니다. 식염수에서는 이동할 수 있는 이온이 전류를 운반해요.', '두 상태를 비교하고 마치기', '있느냐와 움직일 수 있느냐는 다른 질문이네.'],
  15: ['오늘은 관찰한 사실과 설명을 나누어 적는 연습만 합시다.', '이 예시는 식염수에서 본 결과입니다. 모든 녹는 물질도 그렇다고 넓힐 수는 없어요.', '기록과 설명을 나눠 보고 마치기', '확인한 데까지만 쓰자.'],
};
export const midLessonQueue = day => {
  const note = `D${day}-NOTE`;
  return [talk(MID_LESSONS[day][0]), { ...card(NOTE_CARDS[note][0]), note }, talk(MID_LESSONS[day][1])];
};
export const midLessonFeedback = day => talk(CARDS[NOTE_CARDS[`D${day}-NOTE`][0]].feedback);
