/**
 * LineTracing.tsx — Full line-tracing simulator
 *
 * The hamster robot has two floor sensors (left / right).
 * Students tune: base speed, left/right correction, threshold.
 * The robot follows a black line on a white floor using
 * differential-drive physics.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Difficulty } from '../types';

/* ─── constants ─────────────────────────────────────────── */
const W = 480;
const H = 480;
const LINE_W = 22;          // black line width (SVG units)
const HAMSTER_R = 14;
const SENSOR_FWD = 16;      // how far ahead sensors are (local y)
const SENSOR_LAT = 10;      // lateral offset left/right
const WHEEL_BASE = 20;      // px between wheels (for omega calculation)
const SIM_HZ = 60;          // simulation ticks per second
const SPEED_SCALE = 1.2;    // multiplier: speed-unit → px/s

/* ─── course definitions ─────────────────────────────────── */

type Point = { x: number; y: number };

interface Course {
  id: string;
  label: string;
  /** Pre-sampled path points at fine resolution */
  pts: Point[];
  /** SVG path string for rendering */
  svgD: string;
  start: { x: number; y: number; angleDeg: number };
}

/** Sample a quadratic bezier at t */
function qbez(p0: Point, p1: Point, p2: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

/** Sample a cubic bezier at t */
function cbez(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt*mt*mt*p0.x + 3*mt*mt*t*p1.x + 3*mt*t*t*p2.x + t*t*t*p3.x,
    y: mt*mt*mt*p0.y + 3*mt*mt*t*p1.y + 3*mt*t*t*p2.y + t*t*t*p3.y,
  };
}

function sampleN(n: number, fn: (t: number) => Point): Point[] {
  return Array.from({ length: n + 1 }, (_, i) => fn(i / n));
}

/** Build course from multiple segments */
function buildCourse(
  id: string,
  label: string,
  startDeg: number,
  segments: Point[][],
  svgD: string,
): Course {
  const pts: Point[] = [];
  for (const seg of segments) pts.push(...seg.slice(0, -1));
  if (segments.length > 0) pts.push(segments[segments.length - 1][segments[segments.length - 1].length - 1]);
  const start = pts[0];
  return { id, label, pts, svgD, start: { x: start.x, y: start.y, angleDeg: startDeg } };
}

const COURSES: Course[] = [
  /* 0 — 직선 */
  buildCourse(
    'straight', '직선', 90,
    [sampleN(100, t => ({ x: 240, y: 30 + t * 420 }))],
    'M 240,30 L 240,450',
  ),

  /* 1 — 완만한 곡선 */
  buildCourse(
    'gentle', '완만한 곡선', 90,
    [sampleN(200, t => qbez({ x: 80, y: 30 }, { x: 80, y: 450 }, { x: 400, y: 450 }, t))],
    'M 80,30 Q 80,450 400,450',
  ),

  /* 2 — S자 */
  buildCourse(
    's-curve', 'S자 곡선', 90,
    [
      sampleN(150, t => cbez({ x: 160, y: 30 }, { x: 80, y: 180 }, { x: 400, y: 300 }, { x: 320, y: 450 }, t)),
    ],
    'M 160,30 C 80,180 400,300 320,450',
  ),

  /* 3 — 급커브 (right-angle turn) */
  buildCourse(
    'sharp', '급커브', 0,
    [
      sampleN(100, t => ({ x: 30 + t * 210, y: 240 })),      // horizontal
      sampleN(60,  t => qbez({ x: 240, y: 240 }, { x: 290, y: 240 }, { x: 290, y: 300 }, t)), // corner
      sampleN(100, t => ({ x: 290, y: 300 + t * 150 })),     // vertical
    ],
    'M 30,240 L 240,240 Q 290,240 290,300 L 290,450',
  ),

  /* 4 — 교차로 포함 */
  buildCourse(
    'intersection', '교차로 포함', 90,
    [sampleN(200, t => ({ x: 240, y: 30 + t * 420 }))],
    'M 240,30 L 240,450 M 80,200 L 400,200 M 80,310 L 400,310',
  ),
];

/* ─── geometry helpers ───────────────────────────────────── */

function ptDist2(a: Point, b: Point) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/** Return darkness 0-100 at point p for a given course (path proximity) */
function darkness(p: Point, pts: Point[]): number {
  let minD2 = Infinity;
  for (const q of pts) {
    const d2 = ptDist2(p, q);
    if (d2 < minD2) minD2 = d2;
  }
  const halfW = LINE_W / 2;
  const dist = Math.sqrt(minD2);
  if (dist <= halfW) return 100;
  if (dist >= halfW + 6) return 0;
  return Math.round(((halfW + 6 - dist) / 6) * 100);
}

function sensorPos(x: number, y: number, angleDeg: number, side: 'L' | 'R'): Point {
  const rad = (angleDeg * Math.PI) / 180;
  const fwd = SENSOR_FWD;
  const lat = side === 'L' ? -SENSOR_LAT : SENSOR_LAT;
  return {
    x: x + fwd * Math.sin(rad) + lat * Math.cos(rad),
    y: y - fwd * Math.cos(rad) + lat * Math.sin(rad),
  };
}

/* ─── component ─────────────────────────────────────────── */

export interface LineTracingProps {
  difficulty: Difficulty;
}

export function LineTracing({ difficulty }: LineTracingProps) {
  /* Settings */
  const [baseSpeed,   setBaseSpeed]   = useState(40);
  const [leftCorr,    setLeftCorr]    = useState(20);
  const [rightCorr,   setRightCorr]   = useState(20);
  const [threshold,   setThreshold]   = useState(50);
  const [courseIdx,   setCourseIdx]   = useState(0);

  /* Sim state (refs for animation loop) */
  const xRef         = useRef(0);
  const yRef         = useRef(0);
  const angRef       = useRef(0); // degrees
  const runningRef   = useRef(false);
  const rafRef       = useRef<number | null>(null);
  const lastTRef     = useRef<number | null>(null);

  /* Display state */
  const [hamster, setHamster]     = useState<{ x: number; y: number; a: number }>({ x: 0, y: 0, a: 0 });
  const [leftBlack,  setLeftBlack]  = useState(false);
  const [rightBlack, setRightBlack] = useState(false);
  const [leftDark,   setLeftDark]   = useState(0);
  const [rightDark,  setRightDark]  = useState(0);
  const [isRunning,  setIsRunning]  = useState(false);
  const [outcome,    setOutcome]    = useState<'none' | 'finished' | 'lost'>('none');

  const course = COURSES[courseIdx % COURSES.length];

  /* ── init / reset ── */
  function resetSim() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    runningRef.current = false;
    lastTRef.current = null;
    xRef.current = course.start.x;
    yRef.current = course.start.y;
    angRef.current = course.start.angleDeg;
    setHamster({ x: course.start.x, y: course.start.y, a: course.start.angleDeg });
    setLeftBlack(false);
    setRightBlack(false);
    setLeftDark(0);
    setRightDark(0);
    setIsRunning(false);
    setOutcome('none');
  }

  useEffect(() => { resetSim(); }, [courseIdx]);

  /* ── simulation tick ── */
  const tick = useCallback((timestamp: number) => {
    if (!runningRef.current) return;

    if (lastTRef.current === null) lastTRef.current = timestamp;
    const dt = Math.min((timestamp - lastTRef.current) / 1000, 0.05);
    lastTRef.current = timestamp;

    const x0 = xRef.current;
    const y0 = yRef.current;
    const a0 = angRef.current;

    /* Sensor readings */
    const lp = sensorPos(x0, y0, a0, 'L');
    const rp = sensorPos(x0, y0, a0, 'R');
    const ld = darkness(lp, course.pts);
    const rd = darkness(rp, course.pts);
    const lb = ld >= threshold;
    const rb = rd >= threshold;

    setLeftDark(ld);
    setRightDark(rd);
    setLeftBlack(lb);
    setRightBlack(rb);

    /* Differential drive */
    let lw: number, rw: number;
    if (!lb && !rb) { lw = baseSpeed; rw = baseSpeed; }          // both white → straight
    else if (lb && !rb) { lw = baseSpeed - leftCorr; rw = baseSpeed + leftCorr; }  // line left → steer left
    else if (!lb && rb) { lw = baseSpeed + rightCorr; rw = baseSpeed - rightCorr; } // line right → steer right
    else { lw = baseSpeed; rw = baseSpeed; }                      // both black → intersection / straight

    const v     = ((lw + rw) / 2) * SPEED_SCALE;
    const omega = ((rw - lw) / WHEEL_BASE) * SPEED_SCALE * 0.4; // degrees/s
    const newA  = a0 + omega * dt;
    const rad   = (newA * Math.PI) / 180;
    const newX  = x0 + v * Math.sin(rad) * dt;
    const newY  = y0 - v * Math.cos(rad) * dt;

    /* Out of bounds → lost */
    if (newX < 0 || newX > W || newY < 0 || newY > H) {
      runningRef.current = false;
      setIsRunning(false);
      setOutcome('lost');
      return;
    }

    /* Too far from line for too long → lost (checked by darkness at center) */
    const centerD = darkness({ x: newX, y: newY }, course.pts);
    
    xRef.current = newX;
    yRef.current = newY;
    angRef.current = newA;
    setHamster({ x: newX, y: newY, a: newA });

    /* Check if reached end of path */
    const endPt = course.pts[course.pts.length - 1];
    if (ptDist2({ x: newX, y: newY }, endPt) < (HAMSTER_R * 2) ** 2) {
      runningRef.current = false;
      setIsRunning(false);
      setOutcome('finished');
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [course, baseSpeed, leftCorr, rightCorr, threshold]);

  /* ── run / pause ── */
  function handleRun() {
    if (outcome !== 'none') return;
    runningRef.current = true;
    setIsRunning(true);
    lastTRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  }

  function handlePause() {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsRunning(false);
  }

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  /* ── sensor circle colors ── */
  function sensorColor(isBlack: boolean, dark: number) {
    if (isBlack) return '#1e1e1e';
    const g = Math.round(200 + (100 - dark) * 0.55);
    return `rgb(${g},${g},${g})`;
  }

  const lp = sensorPos(hamster.x, hamster.y, hamster.a, 'L');
  const rp = sensorPos(hamster.x, hamster.y, hamster.a, 'R');
  const hamRad = (hamster.a * Math.PI) / 180;

  /* ── difficulty → accessible courses ── */
  const availableCourses = difficulty === 'easy'
    ? COURSES.slice(0, 2)
    : difficulty === 'medium'
    ? COURSES.slice(0, 4)
    : COURSES;

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-start">

      {/* ══ LEFT: Course SVG ══ */}
      <div className="w-full lg:w-1/2 flex flex-col items-center gap-3">
        <div className="bg-slate-800 p-4 rounded-[2rem] shadow-xl border-4 border-slate-700 flex items-center justify-center relative overflow-hidden">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${W} ${H}`}
            className="max-w-[480px] max-h-[480px] w-full h-auto"
            style={{ display: 'block', background: '#f8f8f0' }}
          >
            {/* White floor */}
            <rect width={W} height={H} fill="#f8f8f0" rx="10"/>

            {/* Black line */}
            <path
              d={course.svgD}
              fill="none"
              stroke="#1a1a1a"
              strokeWidth={LINE_W}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Start marker */}
            <circle cx={course.start.x} cy={course.start.y} r={20}
                    fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="5 3"/>
            <text x={course.start.x} y={course.start.y + 36}
                  textAnchor="middle" fontSize="12" fontWeight="bold" fill="#15803d">
              출발
            </text>

            {/* End marker */}
            {(() => {
              const ep = course.pts[course.pts.length - 1];
              return (
                <g>
                  <circle cx={ep.x} cy={ep.y} r={20}
                          fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="5 3"/>
                  <text x={ep.x} y={ep.y + 36}
                        textAnchor="middle" fontSize="12" fontWeight="bold" fill="#b45309">
                    도착
                  </text>
                </g>
              );
            })()}

            {/* Hamster */}
            <g style={{
              transform: `translate(${hamster.x}px,${hamster.y}px) rotate(${hamster.a}deg)`,
              transformOrigin: '0 0',
            }}>
              {/* shadow */}
              <ellipse cx="2" cy="4" rx="16" ry="11" fill="rgba(0,0,0,0.15)"/>
              {/* body */}
              <ellipse rx="14" ry="12" fill="#F4A261"/>
              {/* ears */}
              <ellipse cx="-8" cy="-12" rx="5" ry="5" fill="#F4A261"/>
              <ellipse cx="8"  cy="-12" rx="5" ry="5" fill="#F4A261"/>
              <ellipse cx="-8" cy="-12" rx="3" ry="3" fill="#E07070"/>
              <ellipse cx="8"  cy="-12" rx="3" ry="3" fill="#E07070"/>
              {/* eyes */}
              <circle cx="-4" cy="-2" r="3" fill="#1e293b"/>
              <circle cx="4"  cy="-2" r="3" fill="#1e293b"/>
              <circle cx="-3" cy="-3" r="1" fill="white"/>
              <circle cx="5"  cy="-3" r="1" fill="white"/>
              {/* direction arrow */}
              <polygon points="0,-14 -4,-6 4,-6" fill="#ef4444" opacity="0.9"/>
            </g>

            {/* Sensors */}
            <circle cx={lp.x} cy={lp.y} r={5}
                    fill={sensorColor(leftBlack, leftDark)}
                    stroke={leftBlack ? '#fff' : '#666'}
                    strokeWidth="1.5"/>
            <circle cx={rp.x} cy={rp.y} r={5}
                    fill={sensorColor(rightBlack, rightDark)}
                    stroke={rightBlack ? '#fff' : '#666'}
                    strokeWidth="1.5"/>

            {/* Outcome overlay */}
            {outcome !== 'none' && (
              <g>
                <rect width={W} height={H} fill={outcome === 'finished' ? 'rgba(34,197,94,0.75)' : 'rgba(239,68,68,0.75)'} rx="10"/>
                <text x={W/2} y={H/2 - 20} textAnchor="middle" fontSize="44" fontWeight="bold" fill="white">
                  {outcome === 'finished' ? '🎉 완주!' : '😵 이탈!'}
                </text>
                <text x={W/2} y={H/2 + 30} textAnchor="middle" fontSize="20" fill="white">
                  {outcome === 'finished' ? '라인을 잘 따라갔어요!' : '보정값을 조절해 보세요.'}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Course picker */}
        <div className="flex flex-wrap gap-2 justify-center">
          {availableCourses.map((c, i) => (
            <button
              key={c.id}
              onClick={() => { setCourseIdx(COURSES.indexOf(c)); }}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-full text-sm font-bold transition-all disabled:opacity-50"
              style={COURSES.indexOf(c) === courseIdx % COURSES.length
                ? { background: '#6366f1', color: '#fff' }
                : { background: '#334155', color: '#94a3b8' }
              }
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Sensor readout */}
        <div className="flex gap-4 items-center bg-slate-800 rounded-2xl px-6 py-3 border border-slate-700">
          <div className="flex flex-col items-center gap-1">
            <span className="text-slate-400 text-xs font-bold">왼쪽 센서</span>
            <div className="w-10 h-10 rounded-full border-4 flex items-center justify-center font-bold text-sm transition-colors"
                 style={{ background: sensorColor(leftBlack, leftDark), borderColor: leftBlack ? '#fff' : '#475569', color: leftBlack ? '#fff' : '#333' }}>
              {leftBlack ? '●' : '○'}
            </div>
            <span className={`text-xs font-bold ${leftBlack ? 'text-slate-200' : 'text-slate-500'}`}>
              {leftBlack ? '검은선' : '흰바닥'}
            </span>
          </div>

          <div className="flex flex-col items-center px-4 gap-0.5">
            <span className="text-slate-500 text-xs">어두운 정도</span>
            <div className="text-slate-300 font-mono text-sm">L:{leftDark} / R:{rightDark}</div>
            <span className="text-slate-500 text-xs">기준값: {threshold}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-slate-400 text-xs font-bold">오른쪽 센서</span>
            <div className="w-10 h-10 rounded-full border-4 flex items-center justify-center font-bold text-sm transition-colors"
                 style={{ background: sensorColor(rightBlack, rightDark), borderColor: rightBlack ? '#fff' : '#475569', color: rightBlack ? '#fff' : '#333' }}>
              {rightBlack ? '●' : '○'}
            </div>
            <span className={`text-xs font-bold ${rightBlack ? 'text-slate-200' : 'text-slate-500'}`}>
              {rightBlack ? '검은선' : '흰바닥'}
            </span>
          </div>
        </div>
      </div>

      {/* ══ RIGHT ══ */}
      <div className="w-full lg:w-1/2 flex flex-col gap-5">

        {/* ── Execution buttons ── */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRun}
            disabled={isRunning || outcome !== 'none'}
            className="flex-1 min-w-[120px] min-h-[54px] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-2xl font-jua text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            ▶ 실행
          </button>
          <button
            onClick={handlePause}
            disabled={!isRunning}
            className="flex-1 min-w-[120px] min-h-[54px] bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white rounded-2xl font-jua text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            ⏸ 일시정지
          </button>
          <button
            onClick={resetSim}
            disabled={isRunning}
            className="flex-1 min-w-[120px] min-h-[54px] bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white rounded-2xl font-jua text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            ⏮ 처음부터
          </button>
        </div>

        {/* ── Settings panel ── */}
        <div className="bg-slate-800 rounded-3xl border border-slate-700 p-5 flex flex-col gap-5 shadow-xl">
          <h3 className="text-xl font-jua text-white">⚙️ 센서 및 속도 설정</h3>

          {/* Base speed */}
          <SettingSlider
            label="🚀 기본 속도"
            value={baseSpeed}
            min={0} max={100} step={1}
            onChange={v => { setBaseSpeed(v); if (!isRunning) resetSim(); }}
            color="#3b82f6"
            nudges={[-10, -1, +1, +10]}
          />

          {/* Threshold */}
          <SettingSlider
            label="🎯 센서 기준값 (밝기 임계)"
            value={threshold}
            min={0} max={100} step={1}
            onChange={v => setThreshold(v)}
            color="#8b5cf6"
            nudges={[-10, -1, +1, +10]}
            hint="이 값 이상이면 검은선으로 판단해요"
          />

          {/* Left correction */}
          <SettingSlider
            label="← 왼쪽 보정값"
            value={leftCorr}
            min={0} max={100} step={1}
            onChange={v => setLeftCorr(v)}
            color="#f97316"
            nudges={[-10, -1, +1, +10]}
            hint="왼쪽 센서가 검은선일 때 꺾는 힘"
          />

          {/* Right correction */}
          <SettingSlider
            label="→ 오른쪽 보정값"
            value={rightCorr}
            min={0} max={100} step={1}
            onChange={v => setRightCorr(v)}
            color="#a855f7"
            nudges={[-10, -1, +1, +10]}
            hint="오른쪽 센서가 검은선일 때 꺾는 힘"
          />

          {/* Logic reference card */}
          <div className="bg-slate-900 rounded-2xl p-4 text-xs text-slate-400 leading-relaxed">
            <p className="text-slate-300 font-bold mb-2">🤖 센서 동작 원리</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span>⬜ + ⬜ 흰바닥·흰바닥</span><span>→ 직진</span>
              <span>⬛ + ⬜ 검은선·흰바닥</span><span>→ 왼쪽으로 꺾기</span>
              <span>⬜ + ⬛ 흰바닥·검은선</span><span>→ 오른쪽으로 꺾기</span>
              <span>⬛ + ⬛ 검은선·검은선</span><span>→ 직진 (교차로)</span>
            </div>
            <p className="mt-2 text-slate-500">로봇을 실제로 움직여 보면서 값을 바꿔 보세요!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SettingSlider sub-component ───────────────────────── */

interface SettingSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  color: string;
  nudges?: number[];
  hint?: string;
}

function SettingSlider({ label, value, min, max, step, onChange, color, nudges, hint }: SettingSliderProps) {
  function clamp(v: number) { return Math.min(max, Math.max(min, Math.round(v / step) * step)); }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-slate-300 font-bold text-sm">{label}</label>
        <span className="text-xl font-jua font-bold" style={{ color }}>{value}</span>
      </div>
      {hint && <p className="text-xs text-slate-500 mb-1">{hint}</p>}
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(clamp(Number(e.target.value)))}
        className="w-full h-3 rounded-full cursor-pointer"
        style={{ accentColor: color }}
      />
      {nudges && (
        <div className="flex gap-1 mt-1">
          {nudges.map(d => (
            <button
              key={d}
              onClick={() => onChange(clamp(value + d))}
              className="flex-1 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 border"
              style={{ background: '#334155', color: '#94a3b8', borderColor: '#475569' }}
            >
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
