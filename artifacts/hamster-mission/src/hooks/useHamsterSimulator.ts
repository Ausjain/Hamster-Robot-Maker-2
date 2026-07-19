import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Command, CommandType, Difficulty, ExecutionStatus, HamsterState, makeCommand, FloorMap,
} from '../types';
import { selectMap } from '../maps';

const HAMSTER_RADIUS = 16;
const SPEED_SCALE = 200;   // pixels per (speed=100, duration=1 s)
const ANIM_MS    = 480;    // CSS transition duration
const STEP_DELAY = 700;    // gap between auto-steps in runAll

/* ── physics ── */

function distancePx(speed: number, duration: number): number {
  return (speed / 100) * duration * SPEED_SCALE;
}

function isAtGoal(s: HamsterState, map: FloorMap): boolean {
  const dx = s.x - map.goal.x;
  const dy = s.y - map.goal.y;
  return Math.sqrt(dx * dx + dy * dy) <= map.goal.radius;
}

function computeMove(
  state: HamsterState,
  cmd: Command,
  map: FloorMap,
): { newState: HamsterState; collision: 'wall' | 'boundary' | null } {
  // Rotations are instant
  if (cmd.type === 'turnLeft') {
    return {
      newState: { ...state, angleDeg: (state.angleDeg - cmd.angle + 360) % 360 },
      collision: null,
    };
  }
  if (cmd.type === 'turnRight') {
    return {
      newState: { ...state, angleDeg: (state.angleDeg + cmd.angle) % 360 },
      collision: null,
    };
  }

  const dist  = distancePx(cmd.speed, cmd.duration);
  const rad   = (state.angleDeg * Math.PI) / 180;
  const sign  = cmd.type === 'backward' ? -1 : 1;
  const dx    = Math.cos(rad) * dist * sign;
  const dy    = Math.sin(rad) * dist * sign;

  // Sample N points along the movement segment for collision detection
  const N = 40;
  for (let i = 1; i <= N; i++) {
    const t  = i / N;
    const px = state.x + dx * t;
    const py = state.y + dy * t;

    // Out of bounds
    if (
      px < HAMSTER_RADIUS ||
      px > map.width  - HAMSTER_RADIUS ||
      py < HAMSTER_RADIUS ||
      py > map.height - HAMSTER_RADIUS
    ) {
      const safeT = Math.max(0, (i - 1) / N);
      return {
        newState: { ...state, x: state.x + dx * safeT, y: state.y + dy * safeT },
        collision: 'boundary',
      };
    }

    // Wall rectangles (inflated by hamster radius)
    for (const wall of map.walls) {
      if (
        px >= wall.x - HAMSTER_RADIUS && px <= wall.x + wall.w + HAMSTER_RADIUS &&
        py >= wall.y - HAMSTER_RADIUS && py <= wall.y + wall.h + HAMSTER_RADIUS
      ) {
        const safeT = Math.max(0, (i - 1) / N);
        return {
          newState: { ...state, x: state.x + dx * safeT, y: state.y + dy * safeT },
          collision: 'wall',
        };
      }
    }
  }

  return { newState: { ...state, x: state.x + dx, y: state.y + dy }, collision: null };
}

/* ── hook ── */

export function useHamsterSimulator(difficulty: Difficulty, missionSeed: number) {
  const map = selectMap(missionSeed);

  const [hamster,     setHamster]     = useState<HamsterState>(map.start);
  const [isAnimating, setIsAnimating] = useState(false);
  const [commands,    setCommands]    = useState<Command[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [status,      setStatus]      = useState<ExecutionStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function makeHints(): Command[] {
    return map.hintCommands.map(h => ({ ...h, id: crypto.randomUUID() }));
  }

  const resetAll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHamster(map.start);
    setIsAnimating(false);
    setCurrentStep(-1);
    setStatus('idle');
    setCommands(difficulty === 'easy' ? makeHints() : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map.id, difficulty]);

  useEffect(() => {
    resetAll();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [resetAll]);

  /* Reset hamster position only; keep commands */
  function resetPosition() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHamster(map.start);
    setIsAnimating(false);
    setCurrentStep(-1);
    setStatus('idle');
  }

  /* ── command mutations ── */

  function addCommand(type: CommandType) {
    if (status === 'running') return;
    setCommands(prev => [...prev, makeCommand(type)]);
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

  function updateCommand(id: string, updates: Partial<Omit<Command, 'id' | 'type'>>) {
    if (status === 'running') return;
    setCommands(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
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

  /* ── execution ── */

  function stepForward() {
    if (status === 'running') return;
    const nextStep = currentStep + 1;
    if (nextStep >= commands.length) { setStatus('incomplete'); return; }

    const result = computeMove(hamster, commands[nextStep], map);
    setCurrentStep(nextStep);
    setStatus('running');
    setHamster(result.newState);
    setIsAnimating(true);
    const isFinal = nextStep === commands.length - 1;

    timerRef.current = setTimeout(() => {
      setIsAnimating(false);
      if      (result.collision === 'wall')     setStatus('wallHit');
      else if (result.collision === 'boundary') setStatus('outOfBounds');
      else if (isAtGoal(result.newState, map))  setStatus('success');
      else if (isFinal)                         setStatus('incomplete');
      else                                      setStatus('paused');
    }, ANIM_MS + 80);
  }

  function runAll() {
    if (commands.length === 0) return;
    let h: HamsterState = { ...map.start };
    let step = -1;
    setHamster(h);
    setIsAnimating(false);
    setCurrentStep(-1);
    setStatus('running');

    function tick() {
      step += 1;
      if (step >= commands.length) {
        setCurrentStep(step - 1);
        setIsAnimating(false);
        setStatus(isAtGoal(h, map) ? 'success' : 'incomplete');
        return;
      }

      const result = computeMove(h, commands[step], map);
      setCurrentStep(step);
      setHamster(result.newState);
      setIsAnimating(true);

      if (result.collision) {
        timerRef.current = setTimeout(() => {
          setIsAnimating(false);
          setStatus(result.collision === 'wall' ? 'wallHit' : 'outOfBounds');
        }, ANIM_MS);
        return;
      }

      h = result.newState;
      if (isAtGoal(h, map)) {
        timerRef.current = setTimeout(() => { setIsAnimating(false); setStatus('success'); }, ANIM_MS);
        return;
      }
      timerRef.current = setTimeout(tick, STEP_DELAY);
    }

    timerRef.current = setTimeout(tick, 200);
  }

  function pause() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsAnimating(false);
    setStatus('paused');
  }

  return {
    map, hamster, isAnimating, commands, currentStep, status,
    addCommand, removeCommand, removeLastCommand, clearCommands,
    updateCommand, reorderCommands,
    stepForward, runAll, pause, resetAll, resetPosition,
  };
}
