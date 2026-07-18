import React, { useState } from 'react';
import { Command, CommandType, Difficulty, ExecutionStatus, COMMAND_COLORS, COMMAND_ICONS, COMMAND_LABELS } from '../types';

interface CommandEditorProps {
  commands: Command[];
  currentStep: number;
  status: ExecutionStatus;
  difficulty: Difficulty;
  onAdd: (type: CommandType) => void;
  onRemove: (id: string) => void;
  onRemoveLast: () => void;
  onClear: () => void;
  onReorder: (from: number, to: number) => void;
}

const COMMAND_TYPES: CommandType[] = ['forward', 'turnLeft', 'turnRight', 'backward'];

export function CommandEditor({
  commands,
  currentStep,
  status,
  difficulty,
  onAdd,
  onRemove,
  onRemoveLast,
  onClear,
  onReorder
}: CommandEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isRunning = status === 'running';

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto mt-4 p-4 md:p-6 bg-slate-800 rounded-3xl border border-slate-700 shadow-xl">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="text-xl font-jua text-white flex items-center gap-2">
          <span>🛠️</span> 
          명령 블록
          {difficulty === 'easy' && <span className="text-sm font-sans text-slate-400 font-normal ml-2">순서를 드래그해서 맞춰보세요!</span>}
        </h3>
        
        <div className="flex gap-2">
          <button 
            onClick={onRemoveLast} 
            disabled={isRunning || commands.length === 0}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-1"
          >
            ✕ 마지막 삭제
          </button>
          <button 
            onClick={onClear}
            disabled={isRunning || commands.length === 0}
            className="px-4 py-2 bg-slate-700 hover:bg-red-900/50 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center gap-1 text-red-300"
          >
            🗑 전체 삭제
          </button>
        </div>
      </div>

      {/* Command Buttons (Hidden in easy if we want, but instructions said "모든 난이도에서 4가지 명령 추가 버튼 표시") */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {COMMAND_TYPES.map(type => (
          <button
            key={type}
            onClick={() => onAdd(type)}
            disabled={isRunning}
            className={`min-h-[60px] flex items-center justify-center gap-2 text-lg font-bold rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:active:border-b-4 disabled:active:translate-y-0 ${COMMAND_COLORS[type]}`}
          >
            <span className="text-2xl">{COMMAND_ICONS[type]}</span>
            <span>{COMMAND_LABELS[type].split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Command Sequence Area */}
      <div className="bg-slate-900 rounded-2xl p-4 min-h-[140px] flex flex-wrap gap-2 items-start content-start relative border-2 border-slate-700">
        {commands.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-jua text-2xl">
            🤔 명령을 추가해 보세요!
          </div>
        ) : (
          commands.map((cmd, i) => (
            <div
              key={cmd.id}
              draggable={!isRunning}
              onDragStart={(e) => {
                setDragIndex(i);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIndex(i);
              }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null && dragIndex !== i) {
                  onReorder(dragIndex, i);
                }
                setDragIndex(null);
                setDragOverIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOverIndex(null);
              }}
              className={`
                relative flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-white shadow-sm cursor-grab active:cursor-grabbing select-none transition-all
                ${COMMAND_COLORS[cmd.type].split(' ')[0]}
                ${dragOverIndex === i ? 'border-l-4 border-l-white ml-2' : ''}
                ${currentStep === i ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-110 z-10' : ''}
                ${isRunning ? 'opacity-80' : 'hover:-translate-y-1 hover:shadow-md'}
              `}
            >
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-mono font-bold border border-slate-600">
                {i + 1}
              </div>
              <span className="text-xl">{COMMAND_ICONS[cmd.type]}</span>
              <span className="text-sm md:text-base hidden sm:inline">{COMMAND_LABELS[cmd.type].split(' ')[0]}</span>
              
              {!isRunning && (
                <button
                  onClick={() => onRemove(cmd.id)}
                  className="ml-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}