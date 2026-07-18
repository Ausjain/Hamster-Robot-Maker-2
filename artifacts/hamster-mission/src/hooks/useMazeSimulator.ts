import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Cell, Command, CommandType, Difficulty, Direction, ExecutionStatus, HamsterState } from '../types';

const DR = [0, 1, 0, -1];
const DC = [1, 0, -1, 0];
const WALL_FOR_DIR: (keyof Cell)[] = ['right', 'bottom', 'left', 'top'];

function generateMaze(size: number, seed: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ top: true, right: true, bottom: true, left: true }))
  );
  const visited: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  let s = seed;
  function rand() { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }

  const stack: [number, number][] = [[0, 0]];
  visited[0][0] = true;

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const neighbors: { r: number; c: number; dir: keyof Cell; opp: keyof Cell }[] = [];
    if (r > 0 && !visited[r-1][c]) neighbors.push({r:r-1, c, dir:'top', opp:'bottom'});
    if (r < size-1 && !visited[r+1][c]) neighbors.push({r:r+1, c, dir:'bottom', opp:'top'});
    if (c > 0 && !visited[r][c-1]) neighbors.push({r, c:c-1, dir:'left', opp:'right'});
    if (c < size-1 && !visited[r][c+1]) neighbors.push({r, c:c+1, dir:'right', opp:'left'});
    if (neighbors.length === 0) { stack.pop(); continue; }
    const n = neighbors[Math.floor(rand() * neighbors.length)];
    grid[r][c][n.dir] = false;
    grid[n.r][n.c][n.opp] = false;
    visited[n.r][n.c] = true;
    stack.push([n.r, n.c]);
  }
  return grid;
}

function solveMaze(maze: Cell[][], size: number): CommandType[] {
  const parent: ([number,number] | null)[][] = Array.from({length:size}, () => Array(size).fill(null));
  const queue: [number,number][] = [[0,0]];
  parent[0][0] = [-1,-1]; 

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (r === size-1 && c === size-1) break;
    for (let d = 0; d < 4; d++) {
      const nr = r + DR[d], nc = c + DC[d];
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      if (maze[r][c][WALL_FOR_DIR[d]]) continue; 
      if (parent[nr][nc] !== null) continue;
      parent[nr][nc] = [r, c];
      queue.push([nr, nc]);
    }
  }

  const path: [number,number][] = [];
  let cur: [number,number] = [size-1, size-1];
  while (!(cur[0] === 0 && cur[1] === 0)) {
    path.unshift(cur);
    cur = parent[cur[0]][cur[1]]!;
  }
  path.unshift([0, 0]);

  const cmds: CommandType[] = [];
  let facing: Direction = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [r1,c1] = path[i], [r2,c2] = path[i+1];
    const dr = r2-r1, dc = c2-c1;
    let needed: Direction = 0;
    if (dr===0 && dc===1) needed=0;
    else if (dr===1 && dc===0) needed=1;
    else if (dr===0 && dc===-1) needed=2;
    else needed=3;
    
    while (facing !== needed) {
      const right = (facing + 1) % 4 as Direction;
      const left = (facing + 3) % 4 as Direction;
      if (right === needed) { cmds.push('turnRight'); facing = right; }
      else { cmds.push('turnLeft'); facing = left; }
    }
    cmds.push('forward');
  }
  return cmds;
}

function executeStep(
  state: HamsterState,
  cmd: CommandType,
  maze: Cell[][]
): { newState: HamsterState; hitWall: boolean } {
  switch (cmd) {
    case 'turnLeft':
      return { newState: { ...state, direction: ((state.direction + 3) % 4) as Direction }, hitWall: false };
    case 'turnRight':
      return { newState: { ...state, direction: ((state.direction + 1) % 4) as Direction }, hitWall: false };
    case 'forward': {
      if (maze[state.row][state.col][WALL_FOR_DIR[state.direction]]) {
        return { newState: state, hitWall: true };
      }
      return {
        newState: { ...state, row: state.row + DR[state.direction], col: state.col + DC[state.direction] },
        hitWall: false,
      };
    }
    case 'backward': {
      const backDir = ((state.direction + 2) % 4) as Direction;
      if (maze[state.row][state.col][WALL_FOR_DIR[backDir]]) {
        return { newState: state, hitWall: true };
      }
      return {
        newState: { ...state, row: state.row + DR[backDir], col: state.col + DC[backDir] },
        hitWall: false,
      };
    }
  }
}

export function useMazeSimulator(difficulty: Difficulty, missionSeed: number) {
  const size = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;
  const maze = useMemo(() => generateMaze(size, missionSeed), [size, missionSeed]);

  const initHamster: HamsterState = { row: 0, col: 0, direction: 0 };

  const [hamster, setHamster] = useState<HamsterState>(initHamster);
  const [commands, setCommands] = useState<Command[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function makeCmd(type: CommandType): Command { return { id: crypto.randomUUID(), type }; }

  const getInitialCommands = useCallback((): Command[] => {
    const solution = solveMaze(maze, size).map(makeCmd);
    if (difficulty === 'easy') {
      return [...solution].sort(() => Math.random() - 0.5);
    }
    if (difficulty === 'medium') {
      const half = solution.filter((_, i) => i % 2 === 0);
      return [...half].sort(() => Math.random() - 0.5);
    }
    return [];
  }, [maze, size, difficulty]);

  const resetAll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHamster({ row: 0, col: 0, direction: 0 });
    setCurrentStep(-1);
    setStatus('idle');
    setCommands(getInitialCommands());
  }, [getInitialCommands]);

  useEffect(() => {
    resetAll();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetAll]);

  function resetPosition() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHamster({ row: 0, col: 0, direction: 0 });
    setCurrentStep(-1);
    setStatus('idle');
  }

  function addCommand(type: CommandType) {
    if (status === 'running') return;
    setCommands(prev => [...prev, makeCmd(type)]);
    setStatus('idle');
  }

  function removeCommand(id: string) {
    if (status === 'running') return;
    setCommands(prev => prev.filter(c => c.id !== id));
  }

  function removeLastCommand() {
    if (status === 'running') return;
    setCommands(prev => prev.slice(0, -1));
  }

  function clearCommands() {
    if (status === 'running') return;
    setCommands([]);
    resetPosition();
  }

  function reorderCommands(fromIdx: number, toIdx: number) {
    if (status === 'running') return;
    setCommands(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }

  function stepForward() {
    if (status === 'running') return;
    const nextStep = currentStep + 1;
    if (nextStep >= commands.length) {
      setStatus('incomplete');
      return;
    }
    const result = executeStep(hamster, commands[nextStep].type, maze);
    setCurrentStep(nextStep);
    if (result.hitWall) {
      setStatus('wallHit');
      return;
    }
    setHamster(result.newState);
    if (result.newState.row === size-1 && result.newState.col === size-1) {
      setStatus('success');
    } else if (nextStep === commands.length - 1) {
      setStatus('incomplete');
    } else {
      setStatus('paused');
    }
  }

  function runAll() {
    if (commands.length === 0) return;
    let h = { row: 0, col: 0, direction: 0 as Direction };
    let step = -1;
    setHamster(h);
    setCurrentStep(-1);
    setStatus('running');

    function tick() {
      step += 1;
      if (step >= commands.length) {
        setCurrentStep(step - 1);
        setStatus(h.row === size-1 && h.col === size-1 ? 'success' : 'incomplete');
        return;
      }
      const result = executeStep(h, commands[step].type, maze);
      setCurrentStep(step);
      if (result.hitWall) {
        setStatus('wallHit');
        return;
      }
      h = result.newState;
      setHamster(h);
      if (h.row === size-1 && h.col === size-1) {
        setStatus('success');
        return;
      }
      timerRef.current = setTimeout(tick, 500);
    }
    timerRef.current = setTimeout(tick, 300);
  }

  function pause() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('paused');
  }

  return {
    maze, size, hamster, commands, currentStep, status,
    addCommand, removeCommand, removeLastCommand, clearCommands, reorderCommands,
    stepForward, runAll, pause, resetAll, resetPosition,
  };
}