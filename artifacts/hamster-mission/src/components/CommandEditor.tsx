import React, { useState } from 'react';
import {
  Command, CommandType, Difficulty, ExecutionStatus,
  COMMAND_COLORS, COMMAND_ICONS, COMMAND_LABELS,
  commandCardLabel, ANGLE_MIN, ANGLE_MAX, DURATION_MAX,
} from '../types';
import { CommandParamModal } from './CommandParamModal';

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

/* one set of "template" values per command type */
interface MoveTemplate  { speed: number; duration: number }
interface TurnTemplate  { angle: number; angleInput: string }

const SPEED_SCALE = 200;
function estimatedPx(speed: number, duration: number) {
  return Math.round((speed / 100) * duration * SPEED_SCALE);
}
function clampAngle(v: number) {
  return Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, Math.round(v * 10) / 10));
}
function fmtAngle(v: number) {
  return Number.isInteger(v) ? `${v}°` : `${v.toFixed(1)}°`;
}
function angleDir(deg: number): string {
  const dirs: Record<number, string> = { 0: '오른쪽', 90: '아래쪽', 180: '왼쪽', 270: '위쪽' };
  return dirs[((deg % 360) + 360) % 360] ?? `${deg}°`;
}

/* ─── PaletteCard components ────────────────────────────── */

interface MoveCardProps {
  type: 'forward' | 'backward';
  tpl: MoveTemplate;
  onChange: (p: Partial<MoveTemplate>) => void;
  onAdd: () => void;
  disabled: boolean;
}
function MoveCard({ type, tpl, onChange, onAdd, disabled }: MoveCardProps) {
  const col = COMMAND_COLORS[type];
  const { speed, duration } = tpl;

  function setSpeed(v: number) { onChange({ speed: Math.min(100, Math.max(0, v)) }); }
  function setDur(v: number)   { onChange({ duration: Math.min(DURATION_MAX, Math.max(0.1, Math.round(v * 10) / 10)) }); }

  return (
    <div className="rounded-2xl overflow-hidden border-2 flex flex-col" style={{ borderColor: col.border }}>
      {/* Header — click to add */}
      <button
        onClick={onAdd}
        disabled={disabled}
        className="flex items-center justify-between px-4 py-2.5 font-jua text-base text-white transition-all active:brightness-90 disabled:opacity-50"
        style={{ background: col.bg }}
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">{COMMAND_ICONS[type]}</span>
          {COMMAND_LABELS[type]}
        </span>
        <span className="text-sm bg-white/20 rounded-full px-2 py-0.5">+ 추가</span>
      </button>

      {/* Body */}
      <div className="bg-slate-800 px-4 py-3 flex flex-col gap-3">
        {/* Speed */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-400 text-xs font-bold">속도</span>
            <span className="text-white font-bold text-sm font-mono">{speed}</span>
          </div>
          <input type="range" min={0} max={100} step={1} value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="w-full h-2.5 rounded-full cursor-pointer" style={{ accentColor: col.bg }}/>
          <div className="flex gap-1 mt-1.5">
            {[-10,-1,+1,+10].map(d => (
              <button key={d} onClick={() => setSpeed(speed + d)}
                className="flex-1 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95"
                style={{ background:'#334155', color:'#94a3b8', borderColor:'#475569' }}>
                {d > 0 ? `+${d}` : d}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-400 text-xs font-bold">시간(초)</span>
            <span className="text-white font-bold text-sm font-mono">{duration.toFixed(1)}</span>
          </div>
          <input type="range" min={0.1} max={DURATION_MAX} step={0.1} value={duration}
            onChange={e => setDur(Number(e.target.value))}
            className="w-full h-2.5 rounded-full cursor-pointer" style={{ accentColor: col.bg }}/>
          <div className="flex justify-between text-[10px] text-slate-600 mt-0.5"><span>0.1</span><span>{DURATION_MAX}</span></div>
          <div className="flex gap-1 mt-1">
            {[-1,-0.1,+0.1,+1].map(d => (
              <button key={d} onClick={() => setDur(duration + d)}
                className="flex-1 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95"
                style={{ background:'#334155', color:'#94a3b8', borderColor:'#475569' }}>
                {d > 0 ? `+${d}` : d}
              </button>
            ))}
          </div>
        </div>

        {/* preview */}
        <div className="text-[10px] text-slate-500 flex justify-between">
          <span>예상 이동</span>
          <span className="text-slate-300 font-mono">{estimatedPx(speed, duration)} px</span>
        </div>
      </div>
    </div>
  );
}

interface TurnCardProps {
  type: 'turnLeft' | 'turnRight';
  tpl: TurnTemplate;
  onChange: (p: Partial<TurnTemplate>) => void;
  onAdd: () => void;
  disabled: boolean;
}
function TurnCard({ type, tpl, onChange, onAdd, disabled }: TurnCardProps) {
  const col = COMMAND_COLORS[type];
  const { angle, angleInput } = tpl;

  function apply(raw: number) {
    const v = clampAngle(raw);
    onChange({ angle: v, angleInput: Number.isInteger(v) ? String(v) : v.toFixed(1) });
  }
  function nudge(d: number) { apply(angle + d); }

  return (
    <div className="rounded-2xl overflow-hidden border-2 flex flex-col" style={{ borderColor: col.border }}>
      {/* Header */}
      <button
        onClick={onAdd}
        disabled={disabled}
        className="flex items-center justify-between px-4 py-2.5 font-jua text-base text-white transition-all active:brightness-90 disabled:opacity-50"
        style={{ background: col.bg }}
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">{COMMAND_ICONS[type]}</span>
          {COMMAND_LABELS[type]}
        </span>
        <span className="text-sm bg-white/20 rounded-full px-2 py-0.5">+ 추가</span>
      </button>

      {/* Body */}
      <div className="bg-slate-800 px-4 py-3 flex flex-col gap-3">
        {/* Angle */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-400 text-xs font-bold">각도(도)</span>
            <div className="flex items-center gap-1">
              <input
                type="number" min={ANGLE_MIN} max={ANGLE_MAX} step={0.1}
                value={angleInput}
                onChange={e => { onChange({ angleInput: e.target.value }); const n = parseFloat(e.target.value); if (!isNaN(n)) apply(n); }}
                onBlur={() => apply(parseFloat(angleInput) || angle)}
                className="w-16 text-right rounded-lg px-2 py-0.5 text-sm font-bold font-mono border-2 outline-none"
                style={{ background:'#0f172a', borderColor: col.bg, color: col.bg }}
              />
              <span className="text-white text-sm">°</span>
            </div>
          </div>
          <input type="range" min={ANGLE_MIN} max={ANGLE_MAX} step={0.1} value={angle}
            onChange={e => apply(Number(e.target.value))}
            className="w-full h-2.5 rounded-full cursor-pointer" style={{ accentColor: col.bg }}/>

          {/* Fine-tune buttons */}
          <div className="grid grid-cols-4 gap-1 mt-2">
            {[-1,-0.1,+0.1,+1].map(d => (
              <button key={d} onClick={() => nudge(d)}
                className="py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95"
                style={{ background:'#334155', color:'#94a3b8', borderColor:'#475569' }}>
                {d > 0 ? `+${d}°` : `${d}°`}
              </button>
            ))}
          </div>
        </div>

        {/* direction hint */}
        <div className="text-[10px] text-slate-500 flex justify-between items-center">
          <span>{type === 'turnLeft' ? '← 왼쪽으로' : '→ 오른쪽으로'} 회전</span>
          <span className="text-slate-300 font-mono">{fmtAngle(angle)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main CommandEditor ─────────────────────────────────── */

export function CommandEditor({
  commands, currentStep, status, difficulty,
  onAdd, onRemove, onRemoveLast, onClear, onReorder, onUpdate,
}: CommandEditorProps) {
  /* template state */
  const [fwdTpl,  setFwdTpl]  = useState<MoveTemplate>({ speed: 50, duration: 1.5 });
  const [bwdTpl,  setBwdTpl]  = useState<MoveTemplate>({ speed: 50, duration: 1.5 });
  const [ltTpl,   setLtTpl]   = useState<TurnTemplate>({ angle: 90, angleInput: '90' });
  const [rtTpl,   setRtTpl]   = useState<TurnTemplate>({ angle: 90, angleInput: '90' });

  /* sequence editing */
  const [dragIndex,   setDragIndex]   = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [editingId,   setEditingId]   = useState<string | null>(null);

  const isRunning  = status === 'running';
  const canEdit    = !isRunning;
  const editingCmd = commands.find(c => c.id === editingId) ?? null;

  function addMove(type: 'forward' | 'backward') {
    const tpl = type === 'forward' ? fwdTpl : bwdTpl;
    onAdd(type, { speed: tpl.speed, duration: tpl.duration });
  }
  function addTurn(type: 'turnLeft' | 'turnRight') {
    const tpl = type === 'turnLeft' ? ltTpl : rtTpl;
    onAdd(type, { angle: tpl.angle });
  }

  return (
    <>
      <CommandParamModal command={editingCmd} onUpdate={onUpdate} onClose={() => setEditingId(null)}/>

      {/* ══ Palette (2×2 grid of command type cards) ══ */}
      <section className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-jua text-white flex items-center gap-2">🛠️ 명령 블록</h3>
          <div className="flex gap-2">
            <button onClick={onRemoveLast} disabled={!canEdit || commands.length === 0}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded-xl text-xs font-bold transition">
              × 마지막 삭제
            </button>
            <button onClick={onClear} disabled={!canEdit || commands.length === 0}
              className="px-3 py-1.5 bg-slate-700 hover:bg-red-900/50 disabled:opacity-50 text-red-400 rounded-xl text-xs font-bold transition">
              🗑 모두 지우기
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400 -mt-1">
          블록을 눌러 추가하고, 값을 조정하거나 드래그로 순서를 바꾸세요.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <MoveCard type="forward"  tpl={fwdTpl} onChange={p => setFwdTpl(t => ({...t,...p}))} onAdd={() => addMove('forward')}  disabled={isRunning}/>
          <MoveCard type="backward" tpl={bwdTpl} onChange={p => setBwdTpl(t => ({...t,...p}))} onAdd={() => addMove('backward')} disabled={isRunning}/>
          <TurnCard type="turnLeft"  tpl={ltTpl} onChange={p => setLtTpl(t => ({...t,...p}))}  onAdd={() => addTurn('turnLeft')}  disabled={isRunning}/>
          <TurnCard type="turnRight" tpl={rtTpl} onChange={p => setRtTpl(t => ({...t,...p}))}  onAdd={() => addTurn('turnRight')} disabled={isRunning}/>
        </div>
      </section>

      {/* ══ Sequence ══ */}
      <section className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-jua text-white flex items-center gap-2">📋 내 명령 순서</h3>
          <span className="text-slate-400 text-sm">총 단계: {commands.length}</span>
        </div>
        {difficulty === 'easy' && (
          <p className="text-xs text-slate-400 -mt-1">드래그로 순서를 변경하고, 카드를 눌러 값을 수정하세요!</p>
        )}

        <div className="bg-slate-900 rounded-2xl p-3 min-h-[120px] flex flex-wrap gap-2 items-start content-start relative border-2 border-slate-700 overflow-y-auto max-h-[280px]">
          {commands.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
              <span className="text-4xl">🤖</span>
              <span className="font-jua text-base">위 블록을 눌러 명령을 추가하세요!</span>
            </div>
          ) : (
            <>
              {commands.map((cmd, i) => {
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
                      setDragIndex(null); setDragOverIdx(null);
                    }}
                    onDragEnd={() => { setDragIndex(null); setDragOverIdx(null); }}
                    onClick={() => { if (canEdit) setEditingId(cmd.id); }}
                    role="button" tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' && canEdit) setEditingId(cmd.id); }}
                    className={[
                      'relative flex flex-col px-3 py-2 rounded-xl select-none transition-all cursor-pointer',
                      isRunning ? 'opacity-80' : 'hover:brightness-110 active:scale-95',
                      dragOverIdx === i ? 'border-l-4 border-l-white ml-1' : '',
                      isActive ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-105 z-10 shadow-lg' : '',
                    ].join(' ')}
                    style={{ background: col.bg, color: col.text, minWidth: '90px' }}
                  >
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-mono font-bold border border-slate-600">
                      {i + 1}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{COMMAND_ICONS[cmd.type]}</span>
                      <span className="text-xs font-bold leading-tight">{card.line1}</span>
                    </div>
                    <div className="text-[10px] font-mono opacity-90 pl-5 leading-tight">{card.line2}</div>
                    {canEdit && (
                      <button
                        onClick={e => { e.stopPropagation(); onRemove(cmd.id); }}
                        className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/60 text-white text-xs"
                      >×</button>
                    )}
                  </div>
                );
              })}

              {/* + add slot */}
              {canEdit && (
                <div className="flex flex-col items-center justify-center px-3 py-2 rounded-xl border-2 border-dashed border-slate-600 text-slate-500 text-xs font-bold min-w-[80px] min-h-[56px] select-none">
                  + 명령 추가
                </div>
              )}
            </>
          )}
        </div>
        {commands.length > 0 && canEdit && (
          <p className="text-center text-xs text-slate-500">✏️ 카드를 클릭하면 값을 수정할 수 있어요</p>
        )}
      </section>
    </>
  );
}
