import React from 'react';
import { ExecutionStatus } from '../types';

interface ExecutionControlsProps {
  status: ExecutionStatus;
  commandCount: number;
  onStepForward: () => void;
  onRunAll: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function ExecutionControls({
  status,
  commandCount,
  onStepForward,
  onRunAll,
  onPause,
  onReset
}: ExecutionControlsProps) {
  const isIdle = status === 'idle';
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isFinished = status === 'wallHit' || status === 'success' || status === 'incomplete';
  
  const hasCommands = commandCount > 0;

  return (
    <div className="flex flex-wrap justify-center gap-3 md:gap-4 w-full max-w-4xl mx-auto mt-6">
      <button
        onClick={onStepForward}
        disabled={isRunning || isFinished || !hasCommands}
        className="flex-1 min-w-[140px] min-h-[56px] bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50 disabled:active:translate-y-0 text-white rounded-2xl font-jua text-xl shadow-lg hover:shadow-xl active:translate-y-1 transition-all flex items-center justify-center gap-2"
      >
        <span>▶</span> 한 단계 실행
      </button>

      <button
        onClick={onRunAll}
        disabled={isRunning || isFinished || !hasCommands}
        className="flex-1 min-w-[140px] min-h-[56px] bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 disabled:active:translate-y-0 text-white rounded-2xl font-jua text-xl shadow-lg hover:shadow-xl active:translate-y-1 transition-all flex items-center justify-center gap-2"
      >
        <span>⏩</span> 전체 실행
      </button>

      <button
        onClick={onPause}
        disabled={!isRunning}
        className="flex-1 min-w-[140px] min-h-[56px] bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 disabled:active:translate-y-0 text-white rounded-2xl font-jua text-xl shadow-lg hover:shadow-xl active:translate-y-1 transition-all flex items-center justify-center gap-2"
      >
        <span>⏸</span> 일시정지
      </button>

      <button
        onClick={onReset}
        disabled={isRunning && status !== 'paused'} // Only disabled if running actively
        className="flex-1 min-w-[140px] min-h-[56px] bg-slate-600 hover:bg-slate-500 active:bg-slate-700 disabled:opacity-50 disabled:active:translate-y-0 text-white rounded-2xl font-jua text-xl shadow-lg hover:shadow-xl active:translate-y-1 transition-all flex items-center justify-center gap-2"
      >
        <span>⏮</span> 처음부터 다시
      </button>
    </div>
  );
}