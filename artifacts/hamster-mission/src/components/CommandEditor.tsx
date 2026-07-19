import React, { useState, useEffect, useRef } from 'react';
import {
  Command, CommandType, ExecutionStatus,
  COMMAND_COLORS, COMMAND_ICONS, COMMAND_LABELS,
  ANGLE_MIN, ANGLE_MAX, DURATION_MAX,
} from '../types';

/* ─── helpers ────────────────────────────────────────────── */

const SPEED_SCALE = 200;
function estimatedPx(speed: number, duration: number) {
  return Math.round((speed / 100) * duration * SPEED_SCALE);
}
function clampSpeed(v: number)    { return Math.min(100, Math.max(0, Math.round(v))); }
function clampDuration(v: number) { return Math.min(DURATION_MAX, Math.max(0.1, Math.round(v * 10) / 10)); }
function clampAngle(v: number)    { return Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, Math.round(v * 10) / 10)); }
function fmtAngle(v: number)      { return Number.isInteger(v) ? String(v) : v.toFixed(1); }

/* ─── props ──────────────────────────────────────────────── */

interface CommandEditorProps {
  commands: Command[];
  currentStep: number;
  collisionStep: number;
  status: ExecutionStatus;
  onAdd: (type: CommandType) => void;
  onRemove: (id: string) => void;
  onRemoveLast: () => void;
  onClearOnly: () => void;
  onReorder: (from: number, to: number) => void;
  onUpdate: (id: string, updates: Partial<Omit<Command, 'id' | 'type'>>) => void;
}

/* ─── Step button helper ─────────────────────────────────── */

const stepBtnCls = 'flex-1 min-h-[38px] py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 select-none';
const stepBtnStyle: React.CSSProperties = { background: '#1e293b', color: '#94a3b8', borderColor: '#334155' };

/* ─── Individual Command Card ────────────────────────────── */

interface CardProps {
  cmd: Command;
  index: number;
  isActive: boolean;
  isDone: boolean;
  isCollision: boolean;
  canEdit: boolean;
  dragOver: boolean;
  cardRef: React.RefObject<HTMLDivElement | null>;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<Omit<Command, 'id' | 'type'>>) => void;
}

function CommandCard({
  cmd, index, isActive, isDone, isCollision, canEdit, dragOver,
  cardRef, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
  onRemove, onUpdate,
}: CardProps) {
  const col   = COMMAND_COLORS[cmd.type];
  const isMove = cmd.type === 'forward' || cmd.type === 'backward';

  /* Local text-input state — stays in sync with cmd values */
  const [speedTxt, setSpeedTxt] = useState(String(cmd.speed));
  const [durTxt,   setDurTxt]   = useState(cmd.duration.toFixed(1));
  const [angleTxt, setAngleTxt] = useState(fmtAngle(cmd.angle));

  /* Sync when external update happens (e.g. parent reorder) */
  const prevId = useRef(cmd.id);
  useEffect(() => {
    if (cmd.id !== prevId.current) {
      prevId.current = cmd.id;
      setSpeedTxt(String(cmd.speed));
      setDurTxt(cmd.duration.toFixed(1));
      setAngleTxt(fmtAngle(cmd.angle));
    } else {
      setSpeedTxt(String(cmd.speed));
      setDurTxt(cmd.duration.toFixed(1));
      setAngleTxt(fmtAngle(cmd.angle));
    }
  }, [cmd.id, cmd.speed, cmd.duration, cmd.angle]);

  /* Update helpers */
  function applySpeed(v: number)    { const c = clampSpeed(v);    onUpdate({ speed: c });    setSpeedTxt(String(c)); }
  function applyDuration(v: number) { const c = clampDuration(v); onUpdate({ duration: c }); setDurTxt(c.toFixed(1)); }
  function applyAngle(v: number)    { const c = clampAngle(v);    onUpdate({ angle: c });    setAngleTxt(fmtAngle(c)); }

  /* Drag state ring color */
  const borderStyle: React.CSSProperties = {
    outline: isActive    ? '3px solid #ffffff' :
             isCollision ? '3px solid #ef4444' : undefined,
    outlineOffset: '2px',
  };

  return (
    <div
      ref={cardRef}
      draggable={canEdit}
      onDragStart={e => { onDragStart(); e.dataTransfer.effectAllowed = 'move'; }}
      onDragOver={e  => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={e => { e.preventDefault(); onDrop(); }}
      onDragEnd={onDragEnd}
      className={[
        'rounded-2xl overflow-hidden border-2 transition-all',
        dragOver ? 'translate-y-1 shadow-xl opacity-80' : '',
        isActive ? 'shadow-lg shadow-white/20' : '',
      ].join(' ')}
      style={{ borderColor: isCollision ? '#ef4444' : col.border, ...borderStyle }}
    >
      {/* ── Card header ── */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 select-none"
        style={{ background: col.bg }}
      >
        {/* Drag handle */}
        {canEdit && (
          <span className="text-white/50 text-lg cursor-grab active:cursor-grabbing leading-none">⠿</span>
        )}

        {/* Step number */}
        <span className="text-white text-xs font-mono font-bold bg-black/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
          {index + 1}
        </span>

        {/* Icon + Label */}
        <span className="text-lg">{COMMAND_ICONS[cmd.type]}</span>
        <span className="font-jua text-white text-sm flex-1 leading-tight">{COMMAND_LABELS[cmd.type]}</span>

        {/* Status badges */}
        {isActive && (
          <span className="text-[10px] font-bold bg-white/30 text-white px-2 py-0.5 rounded-full flex-shrink-0">
            실행 중
          </span>
        )}
        {isDone && !isActive && (
          <span className="text-green-300 text-base flex-shrink-0">✓</span>
        )}
        {isCollision && (
          <span className="text-[10px] font-bold bg-red-900/60 text-red-200 px-2 py-0.5 rounded-full flex-shrink-0">
            충돌!
          </span>
        )}

        {/* Delete */}
        {canEdit && (
          <button
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/60 text-white text-sm flex-shrink-0 transition-all active:scale-90"
            aria-label="삭제"
          >×</button>
        )}
      </div>

      {/* ── Card body ── */}
      <div className="bg-slate-800 px-4 py-3 flex flex-col gap-3">
        {isMove ? (
          <>
            {/* Speed row */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold">속도</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number" min={0} max={100} step={1}
                    value={speedTxt}
                    onChange={e => setSpeedTxt(e.target.value)}
                    onBlur={() => { const n = parseInt(speedTxt, 10); applySpeed(isNaN(n) ? cmd.speed : n); }}
                    onKeyDown={e => { if (e.key === 'Enter') { const n = parseInt(speedTxt, 10); applySpeed(isNaN(n) ? cmd.speed : n); } }}
                    className="w-14 text-right rounded-lg px-2 py-1 text-sm font-bold font-mono border-2 outline-none min-h-[36px]"
                    style={{ background: '#0f172a', borderColor: col.bg, color: col.bg }}
                  />
                </div>
              </div>
              <input type="range" min={0} max={100} step={1} value={cmd.speed}
                onChange={e => applySpeed(Number(e.target.value))}
                className="w-full h-3 rounded-full cursor-pointer"
                style={{ accentColor: col.bg }}/>
              <div className="flex gap-1.5">
                {([-10,-1,+1,+10] as number[]).map(d => (
                  <button key={d} onClick={() => applySpeed(cmd.speed + d)}
                    className={stepBtnCls} style={stepBtnStyle}>
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration row */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold">시간(초)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number" min={0.1} max={DURATION_MAX} step={0.1}
                    value={durTxt}
                    onChange={e => setDurTxt(e.target.value)}
                    onBlur={() => { const n = parseFloat(durTxt); applyDuration(isNaN(n) ? cmd.duration : n); }}
                    onKeyDown={e => { if (e.key === 'Enter') { const n = parseFloat(durTxt); applyDuration(isNaN(n) ? cmd.duration : n); } }}
                    className="w-14 text-right rounded-lg px-2 py-1 text-sm font-bold font-mono border-2 outline-none min-h-[36px]"
                    style={{ background: '#0f172a', borderColor: col.bg, color: col.bg }}
                  />
                </div>
              </div>
              <input type="range" min={0.1} max={DURATION_MAX} step={0.1} value={cmd.duration}
                onChange={e => applyDuration(Number(e.target.value))}
                className="w-full h-3 rounded-full cursor-pointer"
                style={{ accentColor: col.bg }}/>
              <div className="flex gap-1.5">
                {([-1,-0.1,+0.1,+1] as number[]).map(d => (
                  <button key={d} onClick={() => applyDuration(cmd.duration + d)}
                    className={stepBtnCls} style={stepBtnStyle}>
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated distance */}
            <div className="flex justify-between items-center text-xs border-t border-slate-700 pt-2">
              <span className="text-slate-500">가상 이동거리</span>
              <span className="text-slate-300 font-mono font-bold">약 {estimatedPx(cmd.speed, cmd.duration)}px</span>
            </div>
          </>
        ) : (
          /* Turn card body */
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold">각도</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min={ANGLE_MIN} max={ANGLE_MAX} step={0.1}
                  value={angleTxt}
                  onChange={e => {
                    setAngleTxt(e.target.value);
                    const n = parseFloat(e.target.value);
                    if (!isNaN(n)) applyAngle(n);
                  }}
                  onBlur={() => { const n = parseFloat(angleTxt); applyAngle(isNaN(n) ? cmd.angle : n); }}
                  onKeyDown={e => { if (e.key === 'Enter') { const n = parseFloat(angleTxt); applyAngle(isNaN(n) ? cmd.angle : n); } }}
                  className="w-16 text-right rounded-lg px-2 py-1 text-base font-bold font-mono border-2 outline-none min-h-[36px]"
                  style={{ background: '#0f172a', borderColor: col.bg, color: col.bg }}
                />
                <span className="text-white font-bold">°</span>
              </div>
            </div>
            <input type="range" min={ANGLE_MIN} max={ANGLE_MAX} step={0.1} value={cmd.angle}
              onChange={e => applyAngle(Number(e.target.value))}
              className="w-full h-3 rounded-full cursor-pointer"
              style={{ accentColor: col.bg }}/>
            <div className="grid grid-cols-6 gap-1 mt-0.5">
              {([-10,-1,-0.1,+0.1,+1,+10] as number[]).map(d => (
                <button key={d} onClick={() => applyAngle(cmd.angle + d)}
                  className="min-h-[38px] py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 select-none"
                  style={stepBtnStyle}>
                  {d > 0 ? `+${d}°` : `${d}°`}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 pt-1">
              <span>{cmd.type === 'turnLeft' ? '← 왼쪽으로 회전' : '→ 오른쪽으로 회전'}</span>
              <span className="text-slate-400 font-mono">{fmtAngle(cmd.angle)}°</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main CommandEditor ─────────────────────────────────── */

const ADD_BUTTONS: { type: CommandType; icon: string }[] = [
  { type: 'forward',   icon: '⬆' },
  { type: 'backward',  icon: '⬇' },
  { type: 'turnLeft',  icon: '↺' },
  { type: 'turnRight', icon: '↻' },
];

export function CommandEditor({
  commands, currentStep, collisionStep, status,
  onAdd, onRemove, onRemoveLast, onClearOnly, onReorder, onUpdate,
}: CommandEditorProps) {
  const isRunning = status === 'running';
  const canEdit   = !isRunning;

  /* drag-and-drop state */
  const [dragIdx,     setDragIdx]     = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  /* card refs for auto-scroll */
  const cardRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* scroll to newly added card */
  useEffect(() => {
    if (commands.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [commands.length]);

  /* scroll to currently active card during execution */
  useEffect(() => {
    if (currentStep >= 0 && cardRefs.current[currentStep]) {
      cardRefs.current[currentStep]!.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStep]);

  return (
    <div className="flex flex-col gap-3 w-full">

      {/* ── Section header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-jua text-white text-base flex items-center gap-1.5">
          📋 내 명령 순서
          <span className="text-slate-400 font-sans text-xs font-normal">({commands.length}개)</span>
        </h3>
        <div className="flex gap-1.5">
          <button onClick={onRemoveLast} disabled={!canEdit || commands.length === 0}
            className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-300 rounded-xl text-xs font-bold transition min-h-[36px]">
            × 마지막
          </button>
          <button onClick={onClearOnly} disabled={!canEdit || commands.length === 0}
            className="px-2.5 py-1.5 bg-slate-700 hover:bg-red-900/50 disabled:opacity-40 text-red-400 rounded-xl text-xs font-bold transition min-h-[36px]">
            🗑 모두 지우기
          </button>
        </div>
      </div>

      {/* ── Add buttons (4 in a row) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {ADD_BUTTONS.map(({ type, icon }) => {
          const col = COMMAND_COLORS[type];
          return (
            <button
              key={type}
              onClick={() => onAdd(type)}
              disabled={isRunning}
              className="flex items-center justify-center gap-1 min-h-[48px] rounded-xl font-jua text-sm text-white shadow transition-all active:scale-95 active:brightness-90 disabled:opacity-50"
              style={{ background: col.bg, border: `2px solid ${col.border}` }}
            >
              <span>{icon}</span>
              <span>+{COMMAND_LABELS[type]}</span>
            </button>
          );
        })}
      </div>

      {/* ── Vertical card list ── */}
      <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-420px)] min-h-[120px] pr-0.5">
        {commands.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[120px] text-slate-600 gap-2 rounded-2xl border-2 border-dashed border-slate-700">
            <span className="text-4xl">🤖</span>
            <span className="font-jua text-sm">위 버튼으로 명령을 추가하세요!</span>
          </div>
        ) : (
          commands.map((cmd, i) => {
            if (!cardRefs.current[i]) cardRefs.current[i] = null;
            return (
              <CommandCard
                key={cmd.id}
                cmd={cmd}
                index={i}
                isActive={currentStep === i}
                isDone={status !== 'idle' && currentStep > i}
                isCollision={collisionStep === i}
                canEdit={canEdit}
                dragOver={dragOverIdx === i}
                cardRef={{ current: cardRefs.current[i] } as React.RefObject<HTMLDivElement | null>}
                onDragStart={() => setDragIdx(i)}
                onDragOver={() => setDragOverIdx(i)}
                onDragLeave={() => setDragOverIdx(null)}
                onDrop={() => {
                  if (dragIdx !== null && dragIdx !== i) onReorder(dragIdx, i);
                  setDragIdx(null); setDragOverIdx(null);
                }}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                onRemove={() => onRemove(cmd.id)}
                onUpdate={updates => onUpdate(cmd.id, updates)}
              />
            );
          })
        )}
        <div ref={bottomRef}/>
      </div>

    </div>
  );
}
