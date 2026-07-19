import React, { useState, useEffect, useRef } from 'react';
import {
  Command, CommandType, Difficulty, ExecutionStatus,
  COMMAND_COLORS, COMMAND_ICONS,
  ANGLE_MIN, ANGLE_MAX, DURATION_MAX,
} from '../types';

/* ─── types ─────────────────────────────────────────────── */

interface CommandEditorProps {
  commands: Command[];
  currentStep: number;
  status: ExecutionStatus;
  difficulty: Difficulty;
  onAdd: (type: CommandType, overrides?: Partial<Omit<Command, 'id' | 'type'>>) => void;
  onRemove: (id: string) => void;
  onRemoveLast: () => void;
  onClear: () => void;
  onReorder: (from: number, to: number) => void;
  onUpdate: (id: string, updates: Partial<Omit<Command, 'id' | 'type'>>) => void;
}

const SPEED_SCALE = 200;
function estimatedPx(speed: number, duration: number) {
  return Math.round((speed / 100) * duration * SPEED_SCALE);
}
function clampAngle(v: number) {
  return Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, Math.round(v * 10) / 10));
}
function clampSpeed(v: number) { return Math.min(100, Math.max(0, Math.round(v))); }
function clampDuration(v: number) {
  return Math.min(DURATION_MAX, Math.max(0.1, Math.round(v * 10) / 10));
}

const ADD_BUTTONS: { type: CommandType; label: string; icon: string }[] = [
  { type: 'forward',   label: '앞으로 이동',  icon: '⬆' },
  { type: 'backward',  label: '뒤로 이동',    icon: '⬇' },
  { type: 'turnLeft',  label: '왼쪽 돌기',    icon: '↺' },
  { type: 'turnRight', label: '오른쪽 돌기',  icon: '↻' },
];

/* ─── Sequence card ──────────────────────────────────────── */

interface SeqCardProps {
  cmd: Command;
  index: number;
  isActive: boolean;
  isDone: boolean;
  isSelected: boolean;
  canEdit: boolean;
  dragOver: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

function SeqCard({
  cmd, index, isActive, isDone, isSelected, canEdit, dragOver,
  onSelect, onRemove, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
}: SeqCardProps) {
  const col = COMMAND_COLORS[cmd.type];
  const isMove = cmd.type === 'forward' || cmd.type === 'backward';
  const angleFmt = Number.isInteger(cmd.angle) ? `${cmd.angle}°` : `${cmd.angle.toFixed(1)}°`;

  return (
    <div
      draggable={canEdit}
      onDragStart={e => { onDragStart(); e.dataTransfer.effectAllowed = 'move'; }}
      onDragOver={e => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={e => { e.preventDefault(); onDrop(); }}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
      className={[
        'relative flex-shrink-0 flex flex-col px-3 py-2.5 rounded-xl select-none cursor-pointer',
        'transition-all duration-150 min-w-[84px]',
        dragOver ? 'border-l-4 border-white ml-1' : '',
        isActive ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-110 z-10 shadow-xl' : '',
        isSelected ? 'ring-4 ring-offset-2 ring-offset-slate-900 scale-105 z-10 shadow-lg' : '',
        isDone && !isActive ? 'opacity-60' : '',
        !isActive && !isSelected ? 'hover:brightness-110 active:scale-95' : '',
      ].join(' ')}
      style={{
        background: col.bg,
        color: col.text,
        outline: isSelected ? `3px solid #f9fafb` : undefined,
        outlineOffset: isSelected ? '2px' : undefined,
      }}
    >
      {/* Step number */}
      <div className="absolute -top-2 -left-2 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-mono font-bold border border-slate-600">
        {index + 1}
      </div>

      {/* Done checkmark */}
      {isDone && (
        <div className="absolute -top-2 -right-5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">✓</div>
      )}

      <div className="flex items-center gap-1.5">
        <span className="text-base">{COMMAND_ICONS[cmd.type]}</span>
        <span className="text-xs font-bold leading-tight whitespace-nowrap">
          {isMove ? (cmd.type === 'forward' ? '앞으로' : '뒤로') : (cmd.type === 'turnLeft' ? '왼쪽' : '오른쪽')}
        </span>
      </div>
      <div className="text-[11px] font-mono mt-1 opacity-95 leading-snug">
        {isMove ? (
          <>
            <div>속도 {cmd.speed}</div>
            <div>{cmd.duration.toFixed(1)}초</div>
          </>
        ) : (
          <div className="font-bold text-sm">{angleFmt}</div>
        )}
      </div>

      {/* Delete button */}
      {canEdit && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-xs"
          aria-label="삭제"
        >×</button>
      )}
    </div>
  );
}

/* ─── Inline Settings Panel ─────────────────────────────── */

interface SettingsPanelProps {
  cmd: Command;
  onUpdate: (id: string, updates: Partial<Omit<Command, 'id' | 'type'>>) => void;
}

function SettingsPanel({ cmd, onUpdate }: SettingsPanelProps) {
  const col = COMMAND_COLORS[cmd.type];
  const isMove = cmd.type === 'forward' || cmd.type === 'backward';

  // Local string states for direct number input
  const [speedInput, setSpeedInput] = useState(String(cmd.speed));
  const [durInput,   setDurInput]   = useState(cmd.duration.toFixed(1));
  const [angleInput, setAngleInput] = useState(
    Number.isInteger(cmd.angle) ? String(cmd.angle) : cmd.angle.toFixed(1)
  );

  // Sync local state when a different command is selected or cmd value changes externally
  const prevId = useRef(cmd.id);
  useEffect(() => {
    prevId.current = cmd.id;
    setSpeedInput(String(cmd.speed));
    setDurInput(cmd.duration.toFixed(1));
    setAngleInput(Number.isInteger(cmd.angle) ? String(cmd.angle) : cmd.angle.toFixed(1));
  }, [cmd.id]);

  function updateSpeed(v: number) {
    const clamped = clampSpeed(v);
    onUpdate(cmd.id, { speed: clamped });
    setSpeedInput(String(clamped));
  }
  function updateDuration(v: number) {
    const clamped = clampDuration(v);
    onUpdate(cmd.id, { duration: clamped });
    setDurInput(clamped.toFixed(1));
  }
  function updateAngle(v: number) {
    const clamped = clampAngle(v);
    onUpdate(cmd.id, { angle: clamped });
    setAngleInput(Number.isInteger(clamped) ? String(clamped) : clamped.toFixed(1));
  }

  const stepBtn = 'flex-1 min-h-[40px] py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 select-none';
  const stepStyle = { background: '#334155', color: '#94a3b8', borderColor: '#475569' };

  return (
    <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: col.border }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 font-jua text-white text-base"
           style={{ background: col.bg }}>
        <span className="text-xl">{COMMAND_ICONS[cmd.type]}</span>
        <span>선택한 명령: {isMove ? (cmd.type === 'forward' ? '앞으로 이동' : '뒤로 이동') : (cmd.type === 'turnLeft' ? '왼쪽 돌기' : '오른쪽 돌기')}</span>
      </div>

      <div className="bg-slate-800 px-4 py-4 flex flex-col gap-4">
        {isMove ? (
          <>
            {/* Speed */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-300 text-sm font-bold">속도</span>
                <input
                  type="number" min={0} max={100} step={1}
                  value={speedInput}
                  onChange={e => setSpeedInput(e.target.value)}
                  onBlur={() => { const n = parseInt(speedInput, 10); updateSpeed(isNaN(n) ? cmd.speed : n); }}
                  onKeyDown={e => { if (e.key === 'Enter') { const n = parseInt(speedInput, 10); updateSpeed(isNaN(n) ? cmd.speed : n); } }}
                  className="w-16 text-right rounded-lg px-2 py-1 text-sm font-bold font-mono border-2 outline-none"
                  style={{ background: '#0f172a', borderColor: col.bg, color: col.bg }}
                />
              </div>
              <input type="range" min={0} max={100} step={1} value={cmd.speed}
                onChange={e => updateSpeed(Number(e.target.value))}
                className="w-full h-3 rounded-full cursor-pointer mb-2"
                style={{ accentColor: col.bg }}/>
              <div className="flex gap-1.5">
                {[-10,-1,+1,+10].map(d => (
                  <button key={d} onClick={() => updateSpeed(cmd.speed + d)}
                    className={stepBtn} style={stepStyle}>
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-300 text-sm font-bold">시간(초)</span>
                <input
                  type="number" min={0.1} max={DURATION_MAX} step={0.1}
                  value={durInput}
                  onChange={e => setDurInput(e.target.value)}
                  onBlur={() => { const n = parseFloat(durInput); updateDuration(isNaN(n) ? cmd.duration : n); }}
                  onKeyDown={e => { if (e.key === 'Enter') { const n = parseFloat(durInput); updateDuration(isNaN(n) ? cmd.duration : n); } }}
                  className="w-16 text-right rounded-lg px-2 py-1 text-sm font-bold font-mono border-2 outline-none"
                  style={{ background: '#0f172a', borderColor: col.bg, color: col.bg }}
                />
              </div>
              <input type="range" min={0.1} max={DURATION_MAX} step={0.1} value={cmd.duration}
                onChange={e => updateDuration(Number(e.target.value))}
                className="w-full h-3 rounded-full cursor-pointer mb-2"
                style={{ accentColor: col.bg }}/>
              <div className="flex gap-1.5">
                {[-1,-0.1,+0.1,+1].map(d => (
                  <button key={d} onClick={() => updateDuration(cmd.duration + d)}
                    className={stepBtn} style={stepStyle}>
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated distance */}
            <div className="flex justify-between text-xs text-slate-500 border-t border-slate-700 pt-2">
              <span>가상 이동거리</span>
              <span className="text-slate-300 font-mono font-bold">약 {estimatedPx(cmd.speed, cmd.duration)}px</span>
            </div>
          </>
        ) : (
          <>
            {/* Angle */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-300 text-sm font-bold">각도(°)</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min={ANGLE_MIN} max={ANGLE_MAX} step={0.1}
                    value={angleInput}
                    onChange={e => {
                      setAngleInput(e.target.value);
                      const n = parseFloat(e.target.value);
                      if (!isNaN(n)) updateAngle(n);
                    }}
                    onBlur={() => { const n = parseFloat(angleInput); updateAngle(isNaN(n) ? cmd.angle : n); }}
                    onKeyDown={e => { if (e.key === 'Enter') { const n = parseFloat(angleInput); updateAngle(isNaN(n) ? cmd.angle : n); } }}
                    className="w-20 text-right rounded-lg px-2 py-1 text-base font-bold font-mono border-2 outline-none"
                    style={{ background: '#0f172a', borderColor: col.bg, color: col.bg }}
                  />
                  <span className="text-white font-bold text-base">°</span>
                </div>
              </div>

              <input type="range" min={ANGLE_MIN} max={ANGLE_MAX} step={0.1} value={cmd.angle}
                onChange={e => updateAngle(Number(e.target.value))}
                className="w-full h-3 rounded-full cursor-pointer mb-2"
                style={{ accentColor: col.bg }}/>
              <div className="flex justify-between text-[10px] text-slate-600 mb-2">
                <span>{ANGLE_MIN}°</span><span>{ANGLE_MAX}°</span>
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {([-10,-1,-0.1,+0.1,+1,+10] as number[]).map(d => (
                  <button key={d} onClick={() => updateAngle(cmd.angle + d)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all active:scale-95`}
                    style={stepStyle}>
                    {d > 0 ? `+${d}°` : `${d}°`}
                  </button>
                ))}
              </div>

              <div className="flex justify-between text-xs text-slate-500 border-t border-slate-700 pt-2 mt-2">
                <span>{cmd.type === 'turnLeft' ? '← 왼쪽으로 회전' : '→ 오른쪽으로 회전'}</span>
                <span className="text-slate-300 font-mono font-bold">
                  {Number.isInteger(cmd.angle) ? `${cmd.angle}°` : `${cmd.angle.toFixed(1)}°`}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main CommandEditor ─────────────────────────────────── */

export function CommandEditor({
  commands, currentStep, status, difficulty,
  onAdd, onRemove, onRemoveLast, onClear, onReorder, onUpdate,
}: CommandEditorProps) {
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [dragIndex,    setDragIndex]    = useState<number | null>(null);
  const [dragOverIdx,  setDragOverIdx]  = useState<number | null>(null);

  const isRunning = status === 'running';
  const canEdit   = !isRunning;

  // When the selected command is deleted, clear selection
  useEffect(() => {
    if (selectedId && !commands.find(c => c.id === selectedId)) {
      setSelectedId(null);
    }
  }, [commands, selectedId]);

  // Clear selection when execution starts
  useEffect(() => {
    if (isRunning) setSelectedId(null);
  }, [isRunning]);

  const selectedCmd = commands.find(c => c.id === selectedId) ?? null;

  function handleSelect(id: string) {
    if (!canEdit) return;
    setSelectedId(prev => prev === id ? null : id);
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ══ Sequence section ══ */}
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-jua text-white flex items-center gap-2">
            📋 내 명령 순서
            <span className="text-slate-400 text-sm font-sans">(드래그해서 순서 변경)</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">총 {commands.length}단계</span>
            <button onClick={onRemoveLast} disabled={!canEdit || commands.length === 0}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded-xl text-xs font-bold transition min-h-[36px]">
              × 마지막 삭제
            </button>
            <button onClick={onClear} disabled={!canEdit || commands.length === 0}
              className="px-3 py-1.5 bg-slate-700 hover:bg-red-900/50 disabled:opacity-50 text-red-400 rounded-xl text-xs font-bold transition min-h-[36px]">
              🗑 모두 지우기
            </button>
          </div>
        </div>

        {/* Sequence cards — horizontal scroll */}
        <div className="bg-slate-900 rounded-2xl px-3 py-3 border-2 border-slate-700 min-h-[110px] flex items-start gap-2.5 overflow-x-auto">
          {commands.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2 min-h-[80px]">
              <span className="text-3xl">🤖</span>
              <span className="font-jua text-sm">아래 버튼으로 명령을 추가하세요!</span>
            </div>
          ) : (
            <>
              {commands.map((cmd, i) => {
                const isActive = currentStep === i;
                const isDone   = status !== 'idle' && status !== 'paused' && currentStep > i;
                return (
                  <SeqCard
                    key={cmd.id}
                    cmd={cmd}
                    index={i}
                    isActive={isActive}
                    isDone={isDone}
                    isSelected={selectedId === cmd.id}
                    canEdit={canEdit}
                    dragOver={dragOverIdx === i}
                    onSelect={() => handleSelect(cmd.id)}
                    onRemove={() => { onRemove(cmd.id); }}
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={() => setDragOverIdx(i)}
                    onDragLeave={() => setDragOverIdx(null)}
                    onDrop={() => {
                      if (dragIndex !== null && dragIndex !== i) onReorder(dragIndex, i);
                      setDragIndex(null); setDragOverIdx(null);
                    }}
                    onDragEnd={() => { setDragIndex(null); setDragOverIdx(null); }}
                  />
                );
              })}
              {/* placeholder slot */}
              {canEdit && (
                <div className="flex-shrink-0 flex flex-col items-center justify-center px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-600 text-slate-500 text-xs font-bold min-w-[80px] min-h-[80px]">
                  + 명령 추가
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ══ Add buttons (4 in a row) ══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ADD_BUTTONS.map(btn => {
          const col = COMMAND_COLORS[btn.type];
          return (
            <button
              key={btn.type}
              onClick={() => onAdd(btn.type)}
              disabled={isRunning}
              className="flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl font-jua text-sm text-white shadow-md transition-all active:scale-95 active:brightness-90 disabled:opacity-50"
              style={{ background: col.bg, border: `2px solid ${col.border}` }}
            >
              <span className="text-base">{btn.icon}</span>
              <span>+{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══ Inline settings panel ══ */}
      {selectedCmd ? (
        <SettingsPanel cmd={selectedCmd} onUpdate={onUpdate} />
      ) : (
        <div className="bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center min-h-[80px] px-4 py-4">
          <span className="text-slate-500 font-jua text-sm text-center">
            ✏️ 수정할 명령 블록을 눌러 주세요.
          </span>
        </div>
      )}

    </div>
  );
}
