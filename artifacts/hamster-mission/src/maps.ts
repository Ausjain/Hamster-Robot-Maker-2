import { HamsterState, WallRect } from './types';

/** One fixed mission stage */
export interface MissionStage {
  id: string;
  stageNum: number;
  label: string;      // "1단계"
  title: string;      // "기본 이동"
  subtitle: string;   // "앞으로 이동과 한 번의 방향 전환"
  successMsg: string;
  width: number;
  height: number;
  start: HamsterState;
  goal: { x: number; y: number; radius: number };
  walls: WallRect[];
}

/**
 * 5 fixed mission stages.
 * Physics: distance_px = (speed/100) * duration * 200
 * At speed=50: distance = duration * 100 px
 * Hamster radius = 16 px. Map = 480×480.
 */
export const MISSION_STAGES: MissionStage[] = [
  {
    // ── Stage 1: 기본 이동 ──────────────────────────────────
    // Simple ㄱ자: go right, turn right, go down.
    // Wall blocks going down from start without going right first.
    // Solution (3 commands): forward(50,3.5) → turnRight(90) → forward(50,3.2)
    id: 'stage1',
    stageNum: 1,
    label: '1단계',
    title: '기본 이동',
    subtitle: '앞으로 이동과 한 번의 방향 전환',
    successMsg: '1단계 성공! 다음에는 방향을 두 번 바꾸어 보세요.',
    width: 480, height: 480,
    start: { x: 60, y: 80, angleDeg: 0 },      // facing right
    goal:  { x: 400, y: 400, radius: 40 },
    walls: [
      { x: 12, y: 230, w: 295, h: 14 },          // horizontal bar, gap on right (x > 323)
    ],
  },

  {
    // ── Stage 2: 명령 연결 ──────────────────────────────────
    // ㄷ자: go right → turn down → go left, 2 direction changes.
    // Wall blocks going down from anywhere except right edge.
    // Solution (5 commands): forward(50,3.9) → turnRight(90) → forward(50,3.6) → turnLeft(90) → forward(50,3.9)
    // dist: 390px right (60→450), 360px down (80→440), 390px left (450→60). Goal at (60,420).
    id: 'stage2',
    stageNum: 2,
    label: '2단계',
    title: '명령 연결',
    subtitle: '방향 전환을 두 번 사용해 목표에 도달해 보세요',
    successMsg: '2단계 성공! 이제 왼쪽과 오른쪽을 모두 사용해 보세요.',
    width: 480, height: 480,
    start: { x: 60, y: 80, angleDeg: 0 },       // facing right
    goal:  { x: 60, y: 420, radius: 40 },
    walls: [
      { x: 12, y: 220, w: 415, h: 14 },           // wide horizontal bar, gap only on right (x > 443)
    ],
  },

  {
    // ── Stage 3: 양쪽 회전 ─────────────────────────────────
    // L자 코너: start facing UP, need both left and right turns.
    // Solution (5 commands): forward(50,1.0) → turnRight(90) → forward(50,2.0) → turnLeft(90) → forward(50,1.5)
    id: 'stage3',
    stageNum: 3,
    label: '3단계',
    title: '양쪽 회전',
    subtitle: '왼쪽과 오른쪽 방향 전환을 모두 사용해 보세요',
    successMsg: '3단계 성공! 다음에는 회전 각도를 더 정확히 맞춰야 해요.',
    width: 480, height: 480,
    start: { x: 60, y: 400, angleDeg: 270 },     // facing UP
    goal:  { x: 400, y: 80, radius: 36 },
    walls: [
      { x: 230, y: 12,  w: 14, h: 250 },           // vertical arm
      { x: 12,  y: 230, w: 218, h: 14 },            // horizontal arm
    ],
  },

  {
    // ── Stage 4: 각도 미세 조정 ────────────────────────────
    // Central island: navigate around it. 90° angles work but require careful timing.
    // Going BELOW the island: right → down → right → up → right → goal.
    // Solution (7 commands): forward(50,1.0) → turnRight(90) → forward(50,1.9) → turnLeft(90)
    //                       → forward(50,2.5) → turnLeft(90) → forward(50,1.9)
    id: 'stage4',
    stageNum: 4,
    label: '4단계',
    title: '각도 미세 조정',
    subtitle: '속도와 시간을 비교하고 충돌 원인을 찾아 수정해 보세요',
    successMsg: '4단계 성공! 마지막 단계에서는 모든 값을 스스로 조절해 보세요.',
    width: 480, height: 480,
    start: { x: 60,  y: 240, angleDeg: 0 },      // facing right
    goal:  { x: 420, y: 240, radius: 36 },
    walls: [
      { x: 180, y: 150, w: 120, h: 180 },          // central island
    ],
  },

  {
    // ── Stage 5: 종합 미션 ─────────────────────────────────
    // Two pillars creating a zigzag — requires diagonal (non-90°) turns.
    // Left pillar: top half. Right pillar: bottom half.
    // Solution hints: go down, diagonal left-turn ~45°, forward, diagonal right-turn, forward.
    id: 'stage5',
    stageNum: 5,
    label: '5단계',
    title: '종합 미션',
    subtitle: '속도·시간·각도를 모두 조절하며 미션을 완수해 보세요',
    successMsg: '모든 미로 미션 성공! 이제 실제 햄스터 로봇으로 도전해 보세요.',
    width: 480, height: 480,
    start: { x: 60,  y: 60,  angleDeg: 90 },     // facing DOWN
    goal:  { x: 400, y: 400, radius: 36 },
    walls: [
      { x: 190, y: 12,  w: 14, h: 210 },           // left pillar (top half)
      { x: 276, y: 258, w: 14, h: 210 },            // right pillar (bottom half)
    ],
  },
];

export function getStage(index: number): MissionStage {
  const i = Math.max(0, Math.min(MISSION_STAGES.length - 1, index));
  return MISSION_STAGES[i];
}

/* ── Backward-compat alias used by types.ts consumers ── */
export type FloorMap = MissionStage;
export const FLOOR_MAPS = MISSION_STAGES;
export function selectMap(seed: number): MissionStage {
  return getStage(seed % MISSION_STAGES.length);
}
