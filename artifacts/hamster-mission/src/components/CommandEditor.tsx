import React, { useState } from 'react';
import {
  Command, CommandType, Difficulty, ExecutionStatus,
  COMMAND_COLORS, COMMAND_ICONS, COMMAND_LABELS,
  commandCardLabel,
} from '../types';
import { CommandParamModal } from './CommandParamModal';

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
  onUpdate: (id: string, updates: Partial<Omit<Command, 'id' | 'type'>>) => void;
}

const COMMAND_TYPES: CommandType[] = ['forward', 'turnLeft', 'turnRight', 'backward'];

export function CommandEditor({
  commands, currentStep, status, difficulty,
  onAdd, onRemove, onRemoveLast, onClear, onReorder, onUpdate,
}: CommandEditorProps) {
  const [dragIndex,    setDragIndex]    = useState<number | null>(null);
  const [dragOverIdx,  setDragOverIdx]  = useState<number | null>(null);
  const [editingId,    setEditingId]    = useState<string | null>(null);

  const isRunning  = status === 'running';
  const canEdit    = !isRunning;
  const editingCmd = commands.find(c => c.id === editingId) ?? null;

  function openEdit(id: string) {
    if (!canEdit) return;
    setEditingId(id);
  }

  return (
    <>
      <CommandParamModal
        command={editingCmd}
        onUpdate={onUpdate}
        onClose={() => setEditingId(null)}
      />

      <div className="flex flex-col gap-5 w-full mx-auto p-4 md:p-5 bg-slate-800 rounded-3xl border border-slate-700 shadow-xl">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-xl font-jua text-white flex items-center gap-2">
              🛠️ 명령 블록
            </h3>
            {difficulty === 'easy' && (
              <p className="text-xs text-slate-400 mt-0.5">
                카드를 눌러 속도·시간·각도를 수정하고, 드래그로 순서를 바꿔보세요!
              </p>
            )}
            {(difficulty === 'medium' || difficulty === 'hard') && (
              <p className="text-xs text-slate-400 mt-0.5">
                명령을 추가하고 값을 직접 설정해 보세요!
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onRemoveLast}
              disabled={!canEdit || commands.length === 0}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition flex items-center gap-1"
            >
              ✕ 마지막
            </button>
            <button
              onClick={onClear}
              disabled={!canEdit || commands.length === 0}
              className="px-3 py-2 bg-slate-700 hover:bg-red-900/50 disabled:opacity-50 text-red-300 rounded-xl font-bold text-sm transition flex items-center gap-1"
            >
              🗑 전체
            </button>
          </div>
        </div>

        {/* ── Add buttons ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {COMMAND_TYPES.map(type => {
            const col = COMMAND_COLORS[type];
            return (
              <button
                key={type}
                onClick={() => onAdd(type)}
                disabled={isRunning}
                className="min-h-[56px] flex items-center justify-center gap-2 rounded-2xl font-bold text-base shadow-md transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: col.bg,
                  color: col.text,
                  boxShadow: `0 4px 0 ${col.border}`,
                }}
              >
                <span className="text-xl">{COMMAND_ICONS[type]}</span>
                <span>{COMMAND_LABELS[type].split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* ── Command sequence ── */}
        <div className="bg-slate-900 rounded-2xl p-3 min-h-[160px] flex flex-wrap gap-2 items-start content-start relative border-2 border-slate-700 overflow-y-auto max-h-[340px]">
          {commands.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2">
              <span className="text-4xl">🤖</span>
              <span className="font-jua text-lg">명령을 추가해 보세요!</span>
            </div>
          ) : (
            commands.map((cmd, i) => {
              const col   = COMMAND_COLORS[cmd.type];
              const card  = commandCardLabel(cmd);
              const isActive = currentStep === i;

              return (
                <div
                  key={cmd.id}
                  draggable={canEdit}
                  onDragStart={e => { setDragIndex(i); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragOver={e  => { e.preventDefault(); setDragOverIdx(i); }}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={e => {
                    e.preventDefault();
                    if (dragIndex !== null && dragIndex !== i) onReorder(dragIndex, i);
                    setDragIndex(null);
                    setDragOverIdx(null);
                  }}
                  onDragEnd={() => { setDragIndex(null); setDragOverIdx(null); }}
                  onClick={() => openEdit(cmd.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') openEdit(cmd.id); }}
                  className={[
                    'relative flex flex-col px-3 py-2 rounded-xl select-none transition-all cursor-pointer',
                    isRunning ? 'opacity-80' : 'hover:brightness-110 active:scale-95',
                    dragOverIdx === i ? 'border-l-4 border-l-white ml-1' : '',
                    isActive
                      ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-105 z-10 shadow-lg'
                      : '',
                  ].join(' ')}
                  style={{ background: col.bg, color: col.text, minWidth: '100px' }}
                >
                  {/* step number badge */}
                  <div
                    className="absolute -top-2 -left-2 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-mono font-bold border border-slate-600"
                  >
                    {i + 1}
                  </div>

                  {/* icon + label */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{COMMAND_ICONS[cmd.type]}</span>
                    <span className="text-sm font-bold">{card.line1}</span>
                  </div>

                  {/* parameter sub-label */}
                  <div className="text-xs font-mono opacity-90 pl-6 leading-tight">
                    {card.line2}
                  </div>

                  {/* delete button */}
                  {canEdit && (
                    <button
                      onClick={e => { e.stopPropagation(); onRemove(cmd.id); }}
                      className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white text-xs transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── hint ── */}
        {commands.length > 0 && canEdit && (
          <p className="text-center text-xs text-slate-500">
            ✏️ 카드를 클릭하면 값을 수정할 수 있어요
          </p>
        )}
      </div>
    </>
  );
}
