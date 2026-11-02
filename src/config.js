// 임시 규칙은 서사·경험 기록과 분리하여 여기서 조정한다.
// 2026-11-02 사용자 채택: science-reference.md 첫 시험·호감도 조정 추천안 전체.
export const RULES = Object.freeze({ initial: 0, min: 0, max: 100, up: 3, down: -3, major: 8, disrespect: -4,
  stages: [[80, '연인 발전'], [30, '썸'], [15, '친구'], [0, '기본']] });
export const CHARACTERS = ['수소', '헬륨', '탄소', '나트륨', '마그네슘', '칼슘', '염소'];
export const SAVE_KEY = 'love-chemistry.prototype.v1';
// 도움말 주소는 Git 설정과 독립적이며 빌드 환경 변수로 재정의할 수 있다.
export const README_URL = import.meta.env.VITE_README_URL || 'https://github.com/su1m1bx/lovechemistry#readme';
