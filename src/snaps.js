// ID에서 인물·장면을 추측하지 않는다. 같은 인물의 서로 다른 순간은 독립 ID다.
// Explicit, visually reviewed source-to-scene associations, not SNAP-N arithmetic.
// The author confirmed all five SNAP-1 sources belong to their first scenes.
// SNAP4 is intentionally absent; CA/MG art has not been made yet.
export const SNAP_ART = {
  'SNAP-H': { source: '수소/SNAP-1.png' },
  'SNAP2-H': { source: '수소/SNAP-2.png', locations: ['옥상'] },
  'SNAP3-H': { source: '수소/SNAP-3.png' },
  'SNAP-HE': { source: '헬륨/SNAP-1.png' },
  'SNAP2-HE': { source: '헬륨/SNAP-2.png' },
  'SNAP3-HE': { source: '헬륨/SNAP-3.png' },
  'SNAP-C': { source: '탄소/SNAP-1.png' },
  'SNAP2-C': { source: '탄소/SNAP-2.png' },
  'SNAP3-C': { source: '탄소/SNAP-3.png' },
  'SNAP-NA': { source: '나트륨/SNAP-1.png' },
  'SNAP2-NA': { source: '나트륨/SNAP-2.png' },
  'SNAP3-NA': { source: '나트륨/SNAP-3.png' },
  'SNAP-CL': { source: '염소/SNAP-1.png' },
  'SNAP2-CL': { source: '염소/SNAP-2.png' },
  'SNAP3-CL': { source: '염소/SNAP-3.png' },
};
const define = (id, character, scene, name, description) => [id, { character, scene, name, description, image: `${import.meta.env.BASE_URL}assets/snaps/${id}.webp` }];
// The rooftop art must not turn the later library variant into a rooftop visit.
// Rendering only: no changes to acquisition, dialogue queues or saved positions.
export const snapImage = (id, location) => !SNAP_ART[id]?.locations || SNAP_ART[id].locations.includes(location) ? SNAPS[id].image : null;
export const SNAPS = Object.fromEntries([
  define('SNAP-END-H', 'H', 'END-H', '수소 · 안내 없이 고른 만남', '교문. 수소와 플레이어가 두 방향 사이에 나란히 선다. 안내 없이 고른 만남.'),
  define('SNAP-END-HE', 'HE', 'END-HE', '헬륨 · 직접 남긴 시간', '교문. 헬륨과 플레이어가 각자 가방을 든 채 마주 본다. 직접 남긴 시간의 애정.'),
  define('SNAP-END-C', 'C', 'END-C', '탄소 · 서로를 먼저', '교문. 탄소와 플레이어가 기록보다 서로를 먼저 바라본다. 특정인에게 보이고 싶은 기쁨.'),
  define('SNAP-END-NA', 'NA', 'END-NA', '나트륨 · 같이 갈 사람', '교문. 나트륨과 플레이어가 닫은 수첩 곁에서 자기 목적지를 말한다. 미지의 기대.'),
  define('SNAP-END-MG', 'MG', 'END-MG', '마그네슘 · 일 없는 동행', '교문. 마그네슘과 플레이어가 인형을 넣은 빈손으로 나란히 선다. 일 없는 동행.'),
  define('SNAP-END-CA', 'CA', 'END-CA', '칼슘 · 새 약속', '교문. 칼슘과 플레이어가 승부 종이가 아닌 상대를 본다. 경쟁 밖의 설렘.'),
  define('SNAP-END-CL', 'CL', 'END-CL', '염소 · 같은 뜻', '교문. 염소와 플레이어가 고백 뒤 잠깐 웃는다. 뜻을 숨기지 않은 안도.'),
  define('SNAP-END-SOLO', null, 'END-SOLO', '혼자 고른 돌아가는 길', '교문 밖. 플레이어가 혼자 가방을 고쳐 메고 귀갓길을 고른다. 담담한 첫날 기대.'),
  define('SNAP3-H', 'H', 'LATE-H-TURN', '수소 · 오늘 고른 짧은 길', '도서관 앞 경내 길. 수소와 플레이어가 오늘 구간을 표시한 종이를 접고 첫발을 뗀다. 함께 걷는 기대.'),
  define('SNAP3-HE', 'HE', 'LATE-HE-TURN', '헬륨 · 끝까지 들은 설명', '옥상. 자기 수정안을 옆에 둔 헬륨이 플레이어의 설명을 끝까지 듣는다. 궁금해서 듣는 긴장.'),
  define('SNAP3-NA', 'NA', 'LATE-NA-TURN', '나트륨 · 방문 희망', '복도. 나트륨과 플레이어가 서로 다른 방문 희망을 종이에 나란히 표시한다. 아직 모르는 곳에 대한 기대.'),
  define('SNAP3-MG', 'MG', 'LATE-MG-TURN', '마그네슘 · 기다리는 시작', '자료 좌석. 마그네슘과 플레이어가 역할을 교환하고 종이 팔을 움직인다. 기다리는 즐거움.'),
  define('SNAP3-CL', 'CL', 'LATE-CL-TURN', '염소 · 오늘의 한 줄', '도서관 또는 자료 좌석. 염소와 플레이어가 새 사적 한 줄을 읽고 눈을 마주친다. 당황과 기대.'),
  define('SNAP-B-H', 'H', 'LATE-H-B', '수소 · 번갈아 고른 모퉁이', '경내 통로. 수소와 플레이어가 서로 고른 방향으로 나란히 선다. 상대 선택에 따라 걷는 설렘.'),
  define('SNAP-B-C', 'C', 'LATE-C-B', '탄소 · 두 배치', '자료 좌석. 탄소와 플레이어가 게시용과 개인용 두 종이를 따로 포갠다. 취향이 보인 당황.'),
  define('SNAP-B-NA', 'NA', 'LATE-NA-B', '나트륨 · 방문 전 희망', '자료 좌석. 나트륨과 플레이어가 방문 희망 둘을 읽고 라벨을 남긴다. 서로 다른 기대.'),
  define('SNAP-B-MG', 'MG', 'LATE-MG-B', '마그네슘 · 서로의 신호', '자료 좌석. 마그네슘과 플레이어가 두 신호에 종이 팔을 멈추고 손에서 시선을 돌린다. 장난스러운 긴장.'),
  define('SNAP-B-CA', 'CA', 'LATE-CA-B', '칼슘 · 상대편에서', '자료 좌석. 칼슘과 플레이어가 돌려 본 종이에서 각자 수를 다시 짚는다. 동등한 경쟁의 기대.'),
  define('SNAP-B-CL', 'CL', 'LATE-CL-B', '염소 · 두 줄의 끝', '자료 좌석. 염소와 플레이어가 새 두 줄 원고를 접고 두 손을 거둔다. 더 말하고 싶은 고요.'),
  define('SNAP3-C', 'C', 'LATE-C-TURN', '탄소 · 가까운 그림', '교실, 탄소와 플레이어가 작은 무늬를 함께 가까이 본다. 큰 반응 없이도 보아 주었다는 안도.'),
  define('SNAP3-CA', 'CA', 'LATE-CA-TURN', '칼슘 · 접어 둔 예시 판', '오늘 선택한 점심 자리 또는 교사 있는 과학실 자료 좌석, 칼슘과 플레이어가 오늘 예시 판 종이를 접고 같은 자리에 쉰다. 진 사람의 멈춤을 존중받는 안도.'),
  define('SNAP-H', 'H', 'LAB-H', '수소 · 지도를 잠깐 접는 시간', '과학실, 접힌 지도 곁에서 가고 싶은 길을 이야기하는 수소와 플레이어. 안내 역할 밖의 시간.'),
  define('SNAP-HE', 'HE', 'LAB-FOLLOW', '헬륨 · 조언의 범위', '과학실, 합의한 범위의 원고를 주고받는 두 사람. 유능함과 상대 결정권의 공존.'),
  define('SNAP-C', 'C', 'LAB-C', '탄소 · 남겨 둘 시안', '과학실, 쓰임을 구별해 시안을 남기는 두 사람. 인기와 취향의 공존.'),
  define('SNAP-NA', 'NA', 'LAB-NA', '나트륨 · 숫자로 만들지 않는 칸', '과학실, 자기 취향 한 줄을 남기는 나트륨과 읽는 플레이어. 정답표 밖의 즐거움.'),
  define('SNAP-MG', 'MG', 'LAB-MG', '마그네슘 · 움직임 메모', '과학실, 종이 모형과 단계 메모를 함께 살피는 두 사람. 실패도 공유하는 동료.'),
  define('SNAP-CA', 'CA', 'LAB-CA', '칼슘 · 한 판의 끝', '과학실, 끝난 종이 놀이를 남겨 두는 두 사람. 승패보다 종료 약속을 신뢰함.'),
  define('SNAP-CL', 'CL', 'LAB-CL-read', '염소 · 남겨 둔 두 뜻', '과학실, 한 문장에서 다른 뜻을 읽는 두 사람. 같은 독해 없이도 가능한 친밀감.'),
  define('SNAP2-H', 'H', 'MID-ECHO', '수소 · 길 말고 너', '오늘 선택한 점심 장소에서 지도를 꺼내던 손을 멈추고 서로를 바라보는 두 사람. 안내할 이유가 아닌 상대를 기다리는 순간.'),
  define('SNAP2-HE', 'HE', 'MID-PLAY-HE', '헬륨 · 자기 손의 결과', '과학실 자료 좌석, 비뚤어진 작은 모형을 자기 손으로 세운 헬륨과 옆에서 자기 것을 접은 플레이어. 대행 대신 존중받는 시행착오.'),
  define('SNAP2-C', 'C', 'MID-PLAY-C', '탄소 · 서로의 자리', '과학실 자료 좌석, 잡지 원본 옆에서 무늬와 여백을 각각 가리키는 두 사람. 한 사람을 평가하는 대신 서로의 자리를 남기는 공유.'),
  define('SNAP2-NA', 'NA', 'MID-SEED', '나트륨 · 지연된 책갈피', '복도 창가, 책갈피와 펼친 책을 사이에 두고 농담하는 나트륨과 웃는 플레이어. 사적 수집가의 유머가 드러나는 순간.'),
  define('SNAP2-MG', 'MG', 'MID-PLAY-MG', '마그네슘 · 공동 출연자', '과학실 자료 좌석, 작은 종이 인형의 쓸모없는 공연에 둘이 진지하게 박자를 맞춘 순간. 기술자와 보조가 아니라 공동 출연자.'),
  define('SNAP2-CA', 'CA', 'MID-ECHO', '칼슘 · 반대편 응원', '운동장 가장자리에서 종이의 상대편 길을 함께 가리키는 두 사람. 이기고 싶은 마음을 남기면서 상대도 응원하는 변화.'),
  define('SNAP2-CL', 'CL', 'MID-PLAY-CL-READ', '염소 · 우리 판본', '과학실 자료 좌석, 짧은 희극을 사이에 놓고 서로 다른 목소리로 읽다가 웃는 두 사람. 함께 장난을 만드는 사적인 시간.'),
]);
