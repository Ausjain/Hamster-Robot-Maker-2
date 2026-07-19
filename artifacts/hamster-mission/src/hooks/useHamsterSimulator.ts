import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Command, CommandType, ExecutionStatus, HamsterState, makeCommand,
} from '../types';
import { MissionStage, getStage } from '../maps';

const HAMSTER_RADIUS = 16;
const SPEED_SCALE    = 200;  // px per (speed=100, duration=1s)
const ANIM_MS        = 480;  // CSS transition duration
const STEP_DELAY     = 700;  // gap between auto-steps in runAll

/* ── physics ── */

function distancePx(speed: number, duration: number): number {
  return (speed / 100) * duration * SPEED_SCALE;
}

function isAtGoal(s: HamsterState, map: MissionStage): boolean {
  const dx = s.x - map.goal.x;
  const dy = s.y - map.goal.y;
  return Math.sqrt(dx * dx + dy * dy) <= map.goal.radius;
}

function computeMove(
  state: HamsterState,
  cmd: Command,
  map: MissionStage,
): { newState: HamsterState; collision: 'wall' | 'boundary' | null } {
  if (cmd.type === 'turnLeft') {
    return { newState: { ...state, angleDeg: (state.angleDeg - cmd.angle + 360) % 360 }, collision: null };
  }
  if (cmd.type === 'turnRight') {
    return { newState: { ...state, angleDeg: (state.angleDeg + cmd.angle) % 360 }, collision: null };
  }

  const dist = distancePx(cmd.speed, cmd.duration);
  const rad  = (state.angleDeg * Math.PI) / 180;
  const sign = cmd.type === 'backward' ? -1 : 1;
  const dx   = Math.cos(rad) * dist * sign;
  const dy   = Math.sin(rad) * dist * sign;

  const N = 40;
  for (let i = 1; i <= N; i++) {
    const t  = i / N;
    const px = state.x + dx * t;
    const py = state.y + dy * t;

    if (
      px < HAMSTER_RADIUS || px > map.width  - HAMSTER_RADIUS ||
      py < HAMSTER_RADIUS || py > map.height - HAMSTER_RADIUS
    ) {
      const safeT = Math.max(0, (i - 1) / N);
      return {
        newState: { ...state, x: state.x + dx * safeT, y: state.y + dy * safeT },
        collision: 'boundary',
      };
    }

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

export function useHamsterSimulator(stageIndex: number) {
  const map = getStage(stageIndex);

  const [hamster,       setHamster]       = useState<HamsterState>(map.start);
  const [isAnimating,   setIsAnimating]   = useState(false);
  const [commands,      setCommands]      = useState<Command[]>([]);
  const [currentStep,   setCurrentStep]   = useState(-1);
  const [status,        setStatus]        = useState<ExecutionStatus>('idle');
  const [collisionStep, setCollisionStep] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Full reset: clear commands, reset position, clear collision */
  const resetAll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHamster(map.start);
    setIsAnimating(false);
    setCurrentStep(-1);
    setStatus('idle');
    setCommands([]);
    setCollisionStep(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map.id]);

  useEffect(() => {
    resetAll();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [resetAll]);

  /** Reset position only; keep commands */
  function resetPosition() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHamster(map.start);
    setIsAnimating(false);
    setCurrentStep(-1);
    setStatus('idle');
    setCollisionStep(-1);
  }

  /** Clear commands + reset position ("현재 단계 다시 하기") */
  function clearCommands() {
    if (status === 'running') return;
    setCommands([]);
    resetPosition();
  }

  /** Clear commands only; keep hamster position ("명령 모두 지우기") */
  function clearCommandsOnly() {
    if (status === 'running') return;
    setCommands([]);
    setCurrentStep(-1);
    setStatus('idle');
    setCollisionStep(-1);
  }

  /* ── command mutations ── */

  function addCommand(type: CommandType, overrides?: Partial<Omit<Command, 'id' | 'type'>>) {
    if (status === 'running') return;
    setCommands(prev => [...prev, makeCommand(type, overrides)]);
  }

  function removeCommand(id: string) {
    if (status === 'running') return;
    setCommands(prev => prev.filter(c => c.id !== id));
  }

  function removeLastCommand() {
    if (status === 'running') return;
    setCommands(prev => prev.slice(0, -1));
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
      if (result.collision === 'wall') {
        setStatus('wallHit'); setCollisionStep(nextStep);
      } else if (result.collision === 'boundary') {
        setStatus('outOfBounds'); setCollisionStep(nextStep);
      } else if (isAtGoal(result.newState, map)) {
        setStatus('success');
      } else if (isFinal) {
        setStatus('incomplete');
      } else {
        setStatus('paused');
      }
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
    setCollisionStep(-1);

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
          setCollisionStep(step);
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
    map, hamster, isAnimating, commands, currentStep, status, collisionStep,
    addCommand, removeCommand, removeLastCommand,
    clearCommands, clearCommandsOnly,
    updateCommand, reorderCommands,
    stepForward, runAll, pause, resetAll, resetPosition,
  };
}
