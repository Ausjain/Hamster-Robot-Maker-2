import React, { useState, useEffect, useCallback } from 'react';
import {
  Command, COMMAND_ICONS, COMMAND_LABELS, COMMAND_COLORS,
  ANGLE_MIN, ANGLE_MAX, DURATION_MAX,
} from '../types';

interface CommandParamModalProps {
  command: Command | null;
  onUpdate: (id: string, updates: Partial<Omit<Command, 'id' | 'type'>>) => void;
  onClose: () => void;
}

const SPEED_SCALE = 200; // must match hook

function estimatedPx(speed: number, duration: number) {
  return Math.round((speed / 100) * duration * SPEED_SCALE);
}

function clampAngle(v: number): number {
  return Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, Math.round(v * 10) / 10));
}

export function CommandParamModal({ command, onUpdate, onClose }: CommandParamModalProps) {
  const [speed,       setSpeed]       = useState(50);
  const [duration,    setDuration]    = useState(1.0);
  const [angle,       setAngle]       = useState(90);
  const [angleInput,  setAngleInput]  = useState('90');

  useEffect(() => {
    if (command) {
      setSpeed(command.speed);
      setDuration(command.duration);
      setAngle(command.angle);
      setAngleInput(String(command.angle));
    }
  }, [command?.id]);

  if (!command) return null;
  // From here, command is non-null; capture id for callbacks
  const cmd = command;

  const isMove  = cmd.type === 'forward' || cmd.type === 'backward';
  const colors  = COMMAND_COLORS[cmd.type];
  const label   = COMMAND_LABELS[cmd.type];
  const icon    = COMMAND_ICONS[cmd.type];

  /* ── speed ── */
  function handleSpeed(v: number) {
    setSpeed(v);
    onUpdate(cmd.id, { speed: v });
  }

  /* ── duration ── */
  function handleDuration(v: number) {
    const clamped = Math.min(DURATION_MAX, Math.max(0.1, Math.round(v * 10) / 10));
    setDuration(clamped);
    onUpdate(cmd.id, { duration: clamped });
  }

  /* ── angle ── */
  function applyAngle(raw: number) {
    const v = clampAngle(raw);
    setAngle(v);
    setAngleInput(Number.isInteger(v) ? String(v) : v.toFixed(1));
    onUpdate(cmd.id, { angle: v });
  }

  function nudgeAngle(delta: number) {
    applyAngle(angle + delta);
  }

  function handleAngleInput(text: string) {
    setAngleInput(text);
    const n = parseFloat(text);
    if (!isNaN(n)) applyAngle(n);
  }

  function handleAngleInputBlur() {
    const n = parseFloat(angleInput);
    applyAngle(isNaN(n) ? angle : n);
  }

  const nudgeBtns: { label: string; delta: number }[] = [
    { label: '−10°', delta: -10 },
    { label: '−1°',  delta: -1  },
    { label: '−0.1°',delta: -0.1},
    { label: '+0.1°',delta: +0.1},
    { label: '+1°',  delta: +1  },
    { label: '+10°', delta: +10 },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: '#1e293b', border: `2px solid ${colors.border}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ background: colors.bg }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <span className="text-xl font-jua text-white">{label}</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white text-xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 flex flex-col gap-5">
          {isMove ? (
            <>
              {/* ── Speed ── */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-300 font-bold text-sm">⚡ 속도</label>
                  <span className="text-2xl font-jua font-bold" style={{ color: colors.bg }}>{speed}</span>
                </div>
                <input
                  type="range" min={0} max={100} step={1}
                  value={speed}
                  onChange={e => handleSpeed(Number(e.target.value))}
                  className="w-full h-3 rounded-full cursor-pointer"
                  style={{ accentColor: colors.bg }}
                />
                <div className="flex justify-between mt-2 gap-1">
                  {[-10, -1, +1, +10].map(d => (
                    <button
                      key={d}
                      onClick={() => handleSpeed(Math.min(100, Math.max(0, speed + d)))}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border"
                      style={{ background: '#334155', color: '#94a3b8', borderColor: '#475569' }}
                    >
                      {d > 0 ? `+${d}` : d}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Duration ── */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-300 font-bold text-sm">⏱ 이동 시간</label>
                  <span className="text-2xl font-jua font-bold" style={{ color: colors.bg }}>{duration.toFixed(1)}초</span>
                </div>
                <input
                  type="range" min={0.1} max={DURATION_MAX} step={0.1}
                  value={duration}
                  onChange={e => handleDuration(Number(e.target.value))}
                  className="w-full h-3 rounded-full cursor-pointer"
                  style={{ accentColor: colors.bg }}
                />
                <div className="flex justify-between mt-2 gap-1">
                  {[-1, -0.1, +0.1, +1].map(d => (
                    <button
                      key={d}
                      onClick={() => handleDuration(duration + d)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border"
                      style={{ background: '#334155', color: '#94a3b8', borderColor: '#475569' }}
                    >
                      {d > 0 ? `+${d}초` : `${d}초`}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0.1초</span><span>짧게 ← → 길게</span><span>{DURATION_MAX}초</span>
                </div>
              </div>

              {/* Distance preview */}
              <div className="rounded-2xl px-4 py-3" style={{ background: '#0f172a' }}>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">예상 이동 거리</span>
                  <span className="text-white font-bold font-mono">{estimatedPx(speed, duration)} px</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{ width: `${Math.min(100, (estimatedPx(speed, duration) / 1000) * 100)}%`, background: colors.bg }}
                  />
                </div>
              </div>
            </>
          ) : (
            /* ── Angle ── */
            <>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-300 font-bold text-sm">🔄 회전 각도</label>
                  {/* numeric input */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={ANGLE_MIN} max={ANGLE_MAX} step={0.1}
                      value={angleInput}
                      onChange={e => handleAngleInput(e.target.value)}
                      onBlur={handleAngleInputBlur}
                      className="w-20 text-right font-jua text-lg font-bold rounded-xl px-2 py-1 border-2 outline-none"
                      style={{
                        background: '#0f172a',
                        borderColor: colors.bg,
                        color: colors.bg,
                      }}
                    />
                    <span className="text-white font-bold text-lg">°</span>
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range" min={ANGLE_MIN} max={ANGLE_MAX} step={0.1}
                  value={angle}
                  onChange={e => applyAngle(Number(e.target.value))}
                  className="w-full h-3 rounded-full cursor-pointer"
                  style={{ accentColor: colors.bg }}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1°</span><span>조금 ← → 많이</span><span>180°</span>
                </div>

                {/* Fine-tune buttons */}
                <div className="grid grid-cols-6 gap-1 mt-3">
                  {nudgeBtns.map(b => (
                    <button
                      key={b.label}
                      onClick={() => nudgeAngle(b.delta)}
                      className="py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border"
                      style={{ background: '#334155', color: '#94a3b8', borderColor: '#475569' }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual angle indicator */}
              <div className="flex items-center justify-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg width="96" height="96" viewBox="-48 -48 96 96">
                    <circle r="40" fill="#0f172a" stroke="#334155" strokeWidth="2"/>
                    {(() => {
                      const rad  = (angle * Math.PI) / 180;
                      const r    = 36;
                      const endX = Math.sin(rad) * r * (command.type === 'turnRight' ? 1 : -1);
                      const endY = -Math.cos(rad) * r;
                      const large = angle > 180 ? 1 : 0;
                      const sweep = command.type === 'turnRight' ? 1 : 0;
                      return (
                        <>
                          <path
                            d={`M 0,-${r} A ${r},${r} 0 ${large},${sweep} ${endX},${endY}`}
                            fill="none"
                            stroke={colors.bg}
                            strokeWidth="6"
                            strokeLinecap="round"
                          />
                          {/* endpoint arrow */}
                          <circle cx={endX} cy={endY} r={4} fill={colors.bg}/>
                        </>
                      );
                    })()}
                    {/* start marker */}
                    <line x1="0" y1="-14" x2="0" y2="-38" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                    <polygon points="0,-40 -4,-32 4,-32" fill="#64748b"/>
                    {/* center dot */}
                    <circle r="3" fill={colors.bg}/>
                  </svg>
                </div>
                <div className="text-slate-400 text-xs leading-relaxed">
                  <p className="font-bold text-white text-sm mb-1">
                    {command.type === 'turnLeft' ? '← 왼쪽 돌기' : '→ 오른쪽 돌기'}
                  </p>
                  <p>현재: <span className="text-white font-bold">{Number.isInteger(angle) ? angle : angle.toFixed(1)}°</span></p>
                  <p className="text-slate-500 mt-1">범위: 1° ~ 180°</p>
                  <p className="text-slate-500">0.1° 단위 조절 가능</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl font-jua text-lg text-white transition-all active:scale-95"
            style={{ background: colors.bg }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
