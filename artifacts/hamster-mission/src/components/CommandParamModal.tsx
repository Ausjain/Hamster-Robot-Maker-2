import React, { useState, useEffect } from 'react';
import {
  Command, CommandType, ANGLE_STEPS, COMMAND_ICONS, COMMAND_LABELS, COMMAND_COLORS,
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

export function CommandParamModal({ command, onUpdate, onClose }: CommandParamModalProps) {
  // Local copies so the user sees live feedback before the hook updates
  const [speed,    setSpeed]    = useState(50);
  const [duration, setDuration] = useState(1.0);
  const [angle,    setAngle]    = useState(90);

  useEffect(() => {
    if (command) {
      setSpeed(command.speed);
      setDuration(command.duration);
      setAngle(command.angle);
    }
  }, [command]);

  if (!command) return null;

  const isMove  = command.type === 'forward' || command.type === 'backward';
  const colors  = COMMAND_COLORS[command.type];
  const label   = COMMAND_LABELS[command.type];
  const icon    = COMMAND_ICONS[command.type];

  function handleSpeed(v: number) {
    setSpeed(v);
    onUpdate(command.id, { speed: v });
  }
  function handleDuration(v: number) {
    const rounded = Math.round(v * 10) / 10;
    setDuration(rounded);
    onUpdate(command.id, { duration: rounded });
  }
  function handleAngle(v: number) {
    setAngle(v);
    onUpdate(command.id, { angle: v });
  }

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: '#1e293b', border: '2px solid #334155' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: colors.bg }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <span className="text-xl font-jua text-white">{label}</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/35 text-white text-xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {isMove ? (
            <>
              {/* Speed */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-300 font-bold text-base">⚡ 속도</label>
                  <span
                    className="text-2xl font-jua font-bold"
                    style={{ color: colors.bg }}
                  >
                    {speed}
                  </span>
                </div>
                <input
                  type="range"
                  min={0} max={100} step={5}
                  value={speed}
                  onChange={e => handleSpeed(Number(e.target.value))}
                  className="w-full h-3 rounded-full cursor-pointer accent-current appearance-none"
                  style={{ accentColor: colors.bg }}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0</span><span>느림 ← → 빠름</span><span>100</span>
                </div>
              </div>

              {/* Duration */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-300 font-bold text-base">⏱ 이동 시간</label>
                  <span className="text-2xl font-jua font-bold" style={{ color: colors.bg }}>
                    {duration.toFixed(1)}초
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1} max={3.0} step={0.1}
                  value={duration}
                  onChange={e => handleDuration(Number(e.target.value))}
                  className="w-full h-3 rounded-full cursor-pointer"
                  style={{ accentColor: colors.bg }}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0.1초</span><span>짧게 ← → 길게</span><span>3.0초</span>
                </div>
              </div>

              {/* Distance preview */}
              <div className="rounded-2xl px-4 py-3" style={{ background: '#0f172a' }}>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">예상 이동 거리</span>
                  <span className="text-white font-bold font-mono">
                    {estimatedPx(speed, duration)} px
                  </span>
                </div>
                {/* mini progress bar */}
                <div className="mt-2 h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${Math.min(100, (estimatedPx(speed, duration) / 600) * 100)}%`,
                      background: colors.bg,
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            /* Angle selector */
            <>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-slate-300 font-bold text-base">🔄 회전 각도</label>
                  <span className="text-2xl font-jua font-bold" style={{ color: colors.bg }}>
                    {angle}°
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {ANGLE_STEPS.map(step => (
                    <button
                      key={step}
                      onClick={() => handleAngle(step)}
                      className="py-2 rounded-xl text-sm font-bold transition-all active:scale-95 border-2"
                      style={angle === step
                        ? { background: colors.bg, color: '#fff', borderColor: colors.border }
                        : { background: '#334155', color: '#94a3b8', borderColor: '#475569' }
                      }
                    >
                      {step}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual angle indicator */}
              <div className="flex justify-center">
                <div className="relative w-24 h-24">
                  <svg width="96" height="96" viewBox="-48 -48 96 96">
                    {/* reference circle */}
                    <circle r="40" fill="#0f172a" stroke="#334155" strokeWidth="2"/>
                    {/* arc */}
                    {(() => {
                      const rad = (angle * Math.PI) / 180;
                      const r = 36;
                      const x = Math.cos(rad - Math.PI / 2) * r;
                      const y = Math.sin(rad - Math.PI / 2) * r;
                      const large = angle > 180 ? 1 : 0;
                      return (
                        <>
                          <path
                            d={`M 0,-${r} A ${r},${r} 0 ${large},${command.type === 'turnRight' ? 1 : 0} ${command.type === 'turnRight' ? x : -x},${y}`}
                            fill="none"
                            stroke={colors.bg}
                            strokeWidth="6"
                            strokeLinecap="round"
                          />
                        </>
                      );
                    })()}
                    {/* center dot */}
                    <circle r="4" fill={colors.bg}/>
                    {/* start arrow */}
                    <line x1="0" y1="-12" x2="0" y2="-36" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
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
