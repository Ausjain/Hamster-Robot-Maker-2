export type CommandType = 'forward' | 'backward' | 'turnLeft' | 'turnRight';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ExecutionStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'wallHit'
  | 'outOfBounds'
  | 'success'
  | 'incomplete';

/** A single robot command with configurable parameters */
export interface Command {
  id: string;
  type: CommandType;
  /** 0–100 */
  speed: number;
  /** 0.1–5.0 seconds */
  duration: number;
  /** 1–180 degrees (0.1 precision) */
  angle: number;
}

/** Continuous 2-D robot position */
export interface HamsterState {
  x: number;
  y: number;
  /** degrees: 0=right, 90=down, 180=left, 270=up */
  angleDeg: number;
}

/** Axis-aligned wall rectangle */
export interface WallRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ────────── defaults ────────── */

export const DEFAULT_SPEED    = 50;
export const DEFAULT_DURATION = 1.0;
export const DEFAULT_ANGLE    = 90;
export const ANGLE_MIN        = 1;
export const ANGLE_MAX        = 180;
export const DURATION_MAX     = 5.0;

export function makeCommand(
  type: CommandType,
  overrides?: Partial<Omit<Command, 'id' | 'type'>>,
): Command {
  return {
    id: crypto.randomUUID(),
    type,
    speed: DEFAULT_SPEED,
    duration: DEFAULT_DURATION,
    angle: DEFAULT_ANGLE,
    ...overrides,
  };
}

/* ────────── display maps ────────── */

export const COMMAND_LABELS: Record<CommandType, string> = {
  forward:   '앞으로 이동',
  backward:  '뒤로 이동',
  turnLeft:  '왼쪽 돌기',
  turnRight: '오른쪽 돌기',
};

export const COMMAND_ICONS: Record<CommandType, string> = {
  forward:   '⬆',
  turnLeft:  '↺',
  turnRight: '↻',
  backward:  '⬇',
};

export const COMMAND_COLORS: Record<CommandType, { bg: string; border: string; text: string }> = {
  forward:   { bg: '#3b82f6', border: '#1d4ed8', text: '#fff' },
  turnLeft:  { bg: '#f97316', border: '#c2410c', text: '#fff' },
  turnRight: { bg: '#a855f7', border: '#7e22ce', text: '#fff' },
  backward:  { bg: '#ef4444', border: '#b91c1c', text: '#fff' },
};
