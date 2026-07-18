export type CommandType = 'forward' | 'turnLeft' | 'turnRight' | 'backward';
export type Direction = 0 | 1 | 2 | 3; // 0=오른쪽(→), 1=아래(↓), 2=왼쪽(←), 3=위(↑)
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'wallHit' | 'success' | 'incomplete';

export interface Command {
  id: string;
  type: CommandType;
}

export interface Cell {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export interface HamsterState {
  row: number;
  col: number;
  direction: Direction;
}

export const COMMAND_LABELS: Record<CommandType, string> = {
  forward: '앞으로 한 칸',
  turnLeft: '왼쪽으로 90도 돌기',
  turnRight: '오른쪽으로 90도 돌기',
  backward: '뒤로 한 칸',
};

export const COMMAND_ICONS: Record<CommandType, string> = {
  forward: '⬆️',
  turnLeft: '↩️',
  turnRight: '↪️',
  backward: '⬇️',
};

export const COMMAND_COLORS: Record<CommandType, string> = {
  forward:   'bg-blue-500 text-white border-blue-600',
  turnLeft:  'bg-orange-500 text-white border-orange-600',
  turnRight: 'bg-purple-500 text-white border-purple-600',
  backward:  'bg-rose-500 text-white border-rose-600',
};
