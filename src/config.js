// 임시 규칙은 서사·경험 기록과 분리하여 여기서 조정한다.
export const RULES = Object.freeze({ initial: 0, min: 0, max: 100, up: 5, down: -5,
  stages: [[80, '연인 발전'], [30, '썸'], [15, '친구'], [0, '기본']] });
export const CHARACTERS = ['수소', '헬륨', '탄소', '나트륨', '마그네슘', '칼슘', '염소'];
export const SAVE_KEY = 'love-chemistry.prototype.v1';
// 원격 저장소가 제공되면 GitHub README의 전체 URL을 설정한다.
export const README_URL = import.meta.env.VITE_README_URL || '';
