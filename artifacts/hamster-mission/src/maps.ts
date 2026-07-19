import { HamsterState, WallRect } from './types';

export interface MissionStage {
  id: string;
  stageNum: number;
  label: string;
  title: string;
  subtitle: string;
  successMsg: string;
  width: number;
  height: number;
  start: HamsterState;
  goal: {
    x: number;
    y: number;
    radius: number;
  };
  walls: WallRect[];
}

const MAP_SIZE = 480;
const GRID_COUNT = 8;
const CELL_SIZE = MAP_SIZE / GRID_COUNT;

type GridCell = readonly [column: number, row: number];

/**
 * 통로에 포함되지 않은 격자 칸을 모두 벽으로 채운다.
 *
 * 기존 방식처럼 막대 장애물만 놓는 것이 아니라
 * 실제로 한 칸 너비의 복도를 만드는 방식이다.
 */
function makeCorridorWalls(path: GridCell[]): WallRect[] {
  const openCells = new Set(
    path.map(([column, row]) => `${column},${row}`),
  );

  const walls: WallRect[] = [];

  for (let row = 0; row < GRID_COUNT; row += 1) {
    for (let column = 0; column < GRID_COUNT; column += 1) {
      if (openCells.has(`${column},${row}`)) {
        continue;
      }

      walls.push({
        x: column * CELL_SIZE,
        y: row * CELL_SIZE,
        w: CELL_SIZE,
        h: CELL_SIZE,
      });
    }
  }

  return walls;
}

function horizontalPath(
  startColumn: number,
  endColumn: number,
  row: number,
): GridCell[] {
  const cells: GridCell[] = [];
  const direction = startColumn <= endColumn ? 1 : -1;

  for (
    let column = startColumn;
    column !== endColumn + direction;
    column += direction
  ) {
    cells.push([column, row]);
  }

  return cells;
}

function verticalPath(
  column: number,
  startRow: number,
  endRow: number,
): GridCell[] {
  const cells: GridCell[] = [];
  const direction = startRow <= endRow ? 1 : -1;

  for (
    let row = startRow;
    row !== endRow + direction;
    row += direction
  ) {
    cells.push([column, row]);
  }

  return cells;
}

/**
 * 여러 직선 통로를 연결하고,
 * 연결 지점에서 생기는 중복 칸을 제거한다.
 */
function joinPaths(...parts: GridCell[][]): GridCell[] {
  const result: GridCell[] = [];
  const used = new Set<string>();

  parts.flat().forEach((cell) => {
    const key = `${cell[0]},${cell[1]}`;

    if (!used.has(key)) {
      used.add(key);
      result.push(cell);
    }
  });

  return result;
}

function cellCenter(column: number, row: number) {
  return {
    x: column * CELL_SIZE + CELL_SIZE / 2,
    y: row * CELL_SIZE + CELL_SIZE / 2,
  };
}

/*
 * 1단계
 *
 * S ─ ─ ─ ─ ─ ┐
 *             │
 *             │
 *             │
 *             G
 *
 * 진행 방향: 오른쪽 → 아래
 * 방향 전환: 1회
 */
const STAGE_1_PATH = joinPaths(
  horizontalPath(1, 6, 1),
  verticalPath(6, 1, 6),
);

/*
 * 2단계
 *
 * S ─ ─ ─ ─ ─ ┐
 *             │
 *   G ─ ─ ─ ─ ┘
 *
 * 진행 방향: 오른쪽 → 아래 → 왼쪽
 * 방향 전환: 2회
 */
const STAGE_2_PATH = joinPaths(
  horizontalPath(1, 6, 1),
  verticalPath(6, 1, 4),
  horizontalPath(6, 2, 4),
);

/*
 * 3단계
 *
 * S ─ ─ ─ ─ ─ ┐
 *             │
 *   ┌ ─ ─ ─ ─ ┘
 *   │
 *   G
 *
 * 진행 방향: 오른쪽 → 아래 → 왼쪽 → 아래
 * 방향 전환: 3회
 */
const STAGE_3_PATH = joinPaths(
  horizontalPath(1, 6, 1),
  verticalPath(6, 1, 3),
  horizontalPath(6, 2, 3),
  verticalPath(2, 3, 6),
);

/*
 * 4단계
 *
 * S ─ ─ ─ ─ ─ ┐
 *             │
 *   ┌ ─ ─ ─ ─ ┘
 *   │
 *   └ ─ ─ ─ ─ G
 *
 * 진행 방향: 오른쪽 → 아래 → 왼쪽 → 아래 → 오른쪽
 * 방향 전환: 4회
 */
const STAGE_4_PATH = joinPaths(
  horizontalPath(1, 6, 1),
  verticalPath(6, 1, 3),
  horizontalPath(6, 2, 3),
  verticalPath(2, 3, 6),
  horizontalPath(2, 6, 6),
);

/*
 * 5단계
 *
 * S ─ ─ ─ ─ ─ ┐
 *             │
 *   ┌ ─ ─ ─ ─ ┘
 *   │
 *   └ ─ ─ ─ ─ ┐
 *             │
 *             G
 *
 * 진행 방향:
 * 오른쪽 → 아래 → 왼쪽 → 아래 → 오른쪽 → 아래
 *
 * 방향 전환: 5회
 */
const STAGE_5_PATH = joinPaths(
  horizontalPath(1, 6, 1),
  verticalPath(6, 1, 3),
  horizontalPath(6, 2, 3),
  verticalPath(2, 3, 5),
  horizontalPath(2, 6, 5),
  verticalPath(6, 5, 6),
);

const stage1Start = cellCenter(1, 1);
const stage1Goal = cellCenter(6, 6);

const stage2Start = cellCenter(1, 1);
const stage2Goal = cellCenter(2, 4);

const stage3Start = cellCenter(1, 1);
const stage3Goal = cellCenter(2, 6);

const stage4Start = cellCenter(1, 1);
const stage4Goal = cellCenter(6, 6);

const stage5Start = cellCenter(1, 1);
const stage5Goal = cellCenter(6, 6);

export const MISSION_STAGES: MissionStage[] = [
  {
    id: 'stage1',
    stageNum: 1,
    label: '1단계',
    title: '한 번 꺾기',
    subtitle: 'ㄱ자 통로에서 방향을 한 번 바꾸어 보세요.',
    successMsg: '1단계 성공! 방향을 한 번 바꾸어 도착했어요.',
    width: MAP_SIZE,
    height: MAP_SIZE,
    start: {
      ...stage1Start,
      angleDeg: 0,
    },
    goal: {
      ...stage1Goal,
      radius: 23,
    },
    walls: makeCorridorWalls(STAGE_1_PATH),
  },

  {
    id: 'stage2',
    stageNum: 2,
    label: '2단계',
    title: '두 번 꺾기',
    subtitle: 'ㄷ자 통로에서 방향을 두 번 바꾸어 보세요.',
    successMsg: '2단계 성공! 두 번의 방향 전환을 연결했어요.',
    width: MAP_SIZE,
    height: MAP_SIZE,
    start: {
      ...stage2Start,
      angleDeg: 0,
    },
    goal: {
      ...stage2Goal,
      radius: 23,
    },
    walls: makeCorridorWalls(STAGE_2_PATH),
  },

  {
    id: 'stage3',
    stageNum: 3,
    label: '3단계',
    title: '세 번 꺾기',
    subtitle: '지그재그 통로에서 방향을 세 번 바꾸어 보세요.',
    successMsg: '3단계 성공! 세 번의 방향 전환을 완성했어요.',
    width: MAP_SIZE,
    height: MAP_SIZE,
    start: {
      ...stage3Start,
      angleDeg: 0,
    },
    goal: {
      ...stage3Goal,
      radius: 23,
    },
    walls: makeCorridorWalls(STAGE_3_PATH),
  },

  {
    id: 'stage4',
    stageNum: 4,
    label: '4단계',
    title: '네 번 꺾기',
    subtitle: '긴 ㄹ자 통로에서 방향을 네 번 바꾸어 보세요.',
    successMsg: '4단계 성공! 네 번의 방향 전환을 완성했어요.',
    width: MAP_SIZE,
    height: MAP_SIZE,
    start: {
      ...stage4Start,
      angleDeg: 0,
    },
    goal: {
      ...stage4Goal,
      radius: 23,
    },
    walls: makeCorridorWalls(STAGE_4_PATH),
  },

  {
    id: 'stage5',
    stageNum: 5,
    label: '5단계',
    title: '다섯 번 꺾기',
    subtitle: '가장 긴 미로에서 방향을 다섯 번 바꾸어 보세요.',
    successMsg: '모든 단계 성공! 다섯 번의 방향 전환을 완성했어요.',
    width: MAP_SIZE,
    height: MAP_SIZE,
    start: {
      ...stage5Start,
      angleDeg: 0,
    },
    goal: {
      ...stage5Goal,
      radius: 23,
    },
    walls: makeCorridorWalls(STAGE_5_PATH),
  },
];

export function getStage(index: number): MissionStage {
  const safeIndex = Math.max(
    0,
    Math.min(MISSION_STAGES.length - 1, index),
  );

  return MISSION_STAGES[safeIndex];
}

/* 기존 파일에서 이 이름을 사용하는 경우를 위한 호환 코드 */
export type FloorMap = MissionStage;

export const FLOOR_MAPS = MISSION_STAGES;

export function selectMap(seed: number): MissionStage {
  const safeSeed = Math.abs(Math.floor(seed));
  return MISSION_STAGES[safeSeed % MISSION_STAGES.length];
}