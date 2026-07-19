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
  /** 0–100: used by forward / backward */
  speed: number;
  /** 0.1–3.0 seconds: used by forward / backward */
  duration: number;
  /** 15–180 in 15° steps: used by turnLeft / turnRight */
  angle: number;
}

/** Continuous 2-D robot position on the open floor */
export interface HamsterState {
  x: number;
  y: number;
  /** degrees: 0 = right, 90 = down, 180 = left, 270 = up (SVG screen space) */
  angleDeg: number;
}

/** Axis-aligned wall rectangle */
export interface WallRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One classroom floor map definition */
export interface FloorMap {
  id: string;
  label: string;
  width: number;
  height: number;
  start: HamsterState;
  goal: { x: number; y: number; radius: number };
  walls: WallRect[];
  /** Commands pre-loaded for "easy" difficulty (incomplete / wrong values) */
  hintCommands: Omit<Command, 'id'>[];
}

/* ────────── defaults ────────── */

export const DEFAULT_SPEED = 50;
export const DEFAULT_DURATION = 1.0;
export const DEFAULT_ANGLE = 90;
export const ANGLE_STEPS = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];

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

/** Short label shown inside a command card */
export function commandCardLabel(cmd: Command): { line1: string; line2: string } {
  if (cmd.type === 'forward' || cmd.type === 'backward') {
    return {
      line1: COMMAND_LABELS[cmd.type],
      line2: `속도 ${cmd.speed} / ${cmd.duration.toFixed(1)}초`,
    };
  }
  return {
    line1: COMMAND_LABELS[cmd.type],
    line2: `${cmd.angle}도`,
  };
}

/* ────────── display maps ────────── */

export const COMMAND_LABELS: Record<CommandType, string> = {
  forward: '앞으로',
  turnLeft: '왼쪽 돌기',
  turnRight: '오른쪽 돌기',
  backward: '뒤로',
};

export const COMMAND_ICONS: Record<CommandType, string> = {
  forward: '⬆',
  turnLeft: '↺',
  turnRight: '↻',
  backward: '⬇',
};

export const COMMAND_COLORS: Record<CommandType, { bg: string; border: string; text: string }> = {
  forward:   { bg: '#3b82f6', border: '#1d4ed8', text: '#fff' },
  turnLeft:  { bg: '#f97316', border: '#c2410c', text: '#fff' },
  turnRight: { bg: '#a855f7', border: '#7e22ce', text: '#fff' },
  backward:  { bg: '#ef4444', border: '#b91c1c', text: '#fff' },
};
