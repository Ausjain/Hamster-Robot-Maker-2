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
  status, commandCount,
  onStepForward, onRunAll, onPause, onReset,
}: ExecutionControlsProps) {
  const isRunning  = status === 'running';
  const isFinished = status === 'wallHit' || status === 'outOfBounds' || status === 'success' || status === 'incomplete';
  const hasCommands = commandCount > 0;

  return (
    <div className="flex flex-wrap gap-2 w-full">
      <button
        onClick={onStepForward}
        disabled={isRunning || isFinished || !hasCommands}
        className="flex-1 min-w-[120px] min-h-[52px] bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50 text-white rounded-2xl font-jua text-base shadow-lg transition-all active:translate-y-0.5 flex items-center justify-center gap-1.5"
      >
        ▶ 한 단계 실행
      </button>

      <button
        onClick={onRunAll}
        disabled={isRunning || isFinished || !hasCommands}
        className="flex-1 min-w-[120px] min-h-[52px] bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl font-jua text-base shadow-lg transition-all active:translate-y-0.5 flex items-center justify-center gap-1.5"
      >
        ⏩ 전체 실행
      </button>

      <button
        onClick={onPause}
        disabled={!isRunning}
        className="flex-1 min-w-[120px] min-h-[52px] bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-white rounded-2xl font-jua text-base shadow-lg transition-all active:translate-y-0.5 flex items-center justify-center gap-1.5"
      >
        ⏸ 일시정지
      </button>

      <button
        onClick={onReset}
        disabled={isRunning}
        className="flex-1 min-w-[120px] min-h-[52px] bg-slate-600 hover:bg-slate-500 active:bg-slate-700 disabled:opacity-50 text-white rounded-2xl font-jua text-base shadow-lg transition-all active:translate-y-0.5 flex items-center justify-center gap-1.5"
      >
        ↺ 다시 시작
      </button>
    </div>
  );
}
