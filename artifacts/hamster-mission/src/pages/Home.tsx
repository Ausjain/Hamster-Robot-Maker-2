import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Difficulty, FloorMap, HamsterState, Command } from '../types';
import { useHamsterSimulator } from '../hooks/useHamsterSimulator';
import { FloorDisplay } from '../components/FloorDisplay';
import { CommandEditor } from '../components/CommandEditor';
import { ExecutionControls } from '../components/ExecutionControls';
import { ResultOverlay } from '../components/ResultOverlay';
import { LineTracing } from '../components/LineTracing';

type TabType = 'maze' | 'linetracing';

function startDirLabel(angleDeg: number): string {
  const a = ((angleDeg % 360) + 360) % 360;
  if (a < 22.5 || a >= 337.5) return '오른쪽';
  if (a < 67.5)  return '오른쪽 아래';
  if (a < 112.5) return '아래쪽';
  if (a < 157.5) return '왼쪽 아래';
  if (a < 202.5) return '왼쪽';
  if (a < 247.5) return '왼쪽 위';
  if (a < 292.5) return '위쪽';
  return '오른쪽 위';
}

function angleArrow(angleDeg: number): string {
  const a = ((angleDeg % 360) + 360) % 360;
  if (a < 22.5 || a >= 337.5) return '→';
  if (a < 67.5)  return '↘';
  if (a < 112.5) return '↓';
  if (a < 157.5) return '↙';
  if (a < 202.5) return '←';
  if (a < 247.5) return '↖';
  if (a < 292.5) return '↑';
  return '↗';
}

function statusLabel(s: string): string {
  const m: Record<string,string> = {
    idle:'대기 중', running:'실행 중', paused:'일시정지',
    wallHit:'벽 충돌', outOfBounds:'범위 초과', success:'성공!', incomplete:'미완료',
  };
  return m[s] ?? s;
}

function statusColor(s: string): string {
  if (s === 'success') return 'text-green-400';
  if (s === 'wallHit' || s === 'outOfBounds') return 'text-red-400';
  if (s === 'running') return 'text-blue-400';
  if (s === 'incomplete') return 'text-yellow-400';
  return 'text-slate-300';
}

/* Compute hint waypoints from hintCommands for the easy-mode dotted path */
function computeHintPath(map: FloorMap): { x: number; y: number }[] {
  let h: HamsterState = { ...map.start };
  const pts: { x: number; y: number }[] = [{ x: h.x, y: h.y }];
  for (const cmd of map.hintCommands) {
    if (cmd.type === 'turnLeft') {
      h = { ...h, angleDeg: (h.angleDeg - cmd.angle + 360) % 360 };
    } else if (cmd.type === 'turnRight') {
      h = { ...h, angleDeg: (h.angleDeg + cmd.angle) % 360 };
    } else {
      const dist = (cmd.speed / 100) * cmd.duration * 200;
      const rad  = (h.angleDeg * Math.PI) / 180;
      const sign = cmd.type === 'backward' ? -1 : 1;
      h = { ...h, x: h.x + Math.cos(rad) * dist * sign, y: h.y + Math.sin(rad) * dist * sign };
      pts.push({ x: h.x, y: h.y });
    }
  }
  return pts;
}

/* medium-difficulty hint: text hint for the next needed action */
function mediumHint(map: FloorMap, hamster: HamsterState, currentStep: number, commands: Command[]): string {
  const nextHint = map.hintCommands[currentStep + 1];
  if (!nextHint) return '목표 지점에 도달해 보세요!';
  const typeLabel: Record<string, string> = {
    forward: '앞으로 이동', backward: '뒤로 이동',
    turnLeft: '왼쪽 돌기', turnRight: '오른쪽 돌기',
  };
  return `다음 동작: ${typeLabel[nextHint.type] ?? nextHint.type}`;
}

export default function Home() {
  const [tab,          setTab]          = useState<TabType>('maze');
  const [difficulty,   setDifficulty]   = useState<Difficulty>('easy');
  const [missionSeed,  setMissionSeed]  = useState(0);
  const [missionCount, setMissionCount] = useState(1);
  const [showHint,     setShowHint]     = useState(false);
  const [confirmNew,   setConfirmNew]   = useState(false);

  const sim = useHamsterSimulator(difficulty, missionSeed);

  /* Track collision position */
  const [collisionPos, setCollisionPos] = useState<{x:number;y:number}|null>(null);
  const prevStatus = useRef(sim.status);
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = sim.status;
    if ((sim.status === 'wallHit' || sim.status === 'outOfBounds') && prev === 'running') {
      setCollisionPos({ x: sim.hamster.x, y: sim.hamster.y });
    } else if (sim.status === 'idle' || sim.status === 'running') {
      setCollisionPos(null);
    }
  }, [sim.status, sim.hamster]);

  /* Hint path */
  const hintPath = useMemo(
    () => difficulty === 'easy' && showHint ? computeHintPath(sim.map) : undefined,
    [difficulty, showHint, sim.map]
  );

  /* Medium hint text */
  const medHintText = difficulty === 'medium' && showHint
    ? mediumHint(sim.map, sim.hamster, sim.currentStep, sim.commands)
    : null;

  function requestNewMission() {
    if (sim.commands.length > 0) {
      setConfirmNew(true);
    } else {
      doNewMission();
    }
  }
  function doNewMission() {
    setMissionSeed(prev => (prev + 1) % 4);
    setMissionCount(c => c + 1);
    setShowHint(false);
    setCollisionPos(null);
    setConfirmNew(false);
  }

  function handleDifficulty(d: Difficulty) {
    if (sim.status === 'running') return;
    setDifficulty(d);
    setShowHint(false);
  }

  function handleTab(t: TabType) {
    if (sim.status === 'running') return;
    setTab(t);
  }

  const diffBase = 'min-h-[40px] px-4 rounded-full font-bold text-sm transition-all duration-200 disabled:opacity-50';

  return (
    <div className="min-h-[100dvh] bg-slate-900 font-sans flex flex-col">

      {/* ── Top header ── */}
      <header className="flex-none bg-slate-800 border-b border-slate-700 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
          <h1 className="text-xl md:text-2xl font-jua text-white flex items-center gap-2 flex-shrink-0">
            <span>🐹</span> 햄스터 로봇 미션
          </h1>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Difficulty */}
            <div className="flex bg-slate-900 p-1 rounded-full border border-slate-700">
              <button disabled={sim.status === 'running'} onClick={() => handleDifficulty('easy')}
                className={`${diffBase} ${difficulty === 'easy' ? 'bg-green-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                쉬움
              </button>
              <button disabled={sim.status === 'running'} onClick={() => handleDifficulty('medium')}
                className={`${diffBase} ${difficulty === 'medium' ? 'bg-yellow-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                보통
              </button>
              <button disabled={sim.status === 'running'} onClick={() => handleDifficulty('hard')}
                className={`${diffBase} ${difficulty === 'hard' ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                어려움
              </button>
            </div>

            {tab === 'maze' && (
              <button onClick={requestNewMission} disabled={sim.status === 'running'}
                className="min-h-[40px] px-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-full font-bold shadow transition-all active:scale-95 text-sm">
                🗺️ 새 미션
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <nav className="flex-none bg-slate-800 border-b border-slate-700 px-4">
        <div className="max-w-7xl mx-auto flex gap-1">
          {(['maze','linetracing'] as TabType[]).map(t => (
            <button key={t}
              onClick={() => handleTab(t)}
              className={`flex items-center gap-2 px-6 py-3 font-jua text-base border-b-[3px] transition-all ${
                tab === t
                  ? 'border-indigo-400 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'maze' ? <><span>⊞</span> 미로찾기</> : <><span>∿</span> 라인트레이싱</>}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-5">

        {/* ════ MAZE ════ */}
        {tab === 'maze' && (
          <div className="flex flex-col gap-4">

            {/* Guide banner */}
            <p className="text-sm font-jua text-green-400">
              🟢 {
                difficulty === 'easy'   ? '명령 블록을 추가하고 값을 조정한 후 실행해 보세요!' :
                difficulty === 'medium' ? '첫 번째 명령 이후를 직접 완성해 보세요!' :
                                          '아무 힌트 없이 처음부터 도전해 보세요!'
              }
            </p>

            {/* ── Two-column layout ── */}
            <div className="flex flex-col lg:flex-row gap-5 items-start">

              {/* ════ LEFT COLUMN (~42%) ════ */}
              <div className="w-full lg:w-[42%] flex-shrink-0 flex flex-col gap-3">

                {/* Start direction + hint */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1.5 border border-slate-700 text-sm">
                    <span className="text-green-400">●</span>
                    <span className="text-slate-300">출발 방향: </span>
                    <span className="text-white font-bold flex items-center gap-1">
                      <span>{angleArrow(sim.map.start.angleDeg)}</span>
                      {startDirLabel(sim.map.start.angleDeg)}
                    </span>
                  </div>

                  {/* Hint button — hidden in hard mode */}
                  {difficulty !== 'hard' && (
                    <button
                      onClick={() => setShowHint(p => !p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                        showHint
                          ? 'bg-yellow-500 text-slate-900'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      👁 {showHint ? '힌트 숨기기' : '힌트 보기'}
                    </button>
                  )}
                </div>

                {/* Medium hint text */}
                {medHintText && (
                  <div className="bg-yellow-900/40 border border-yellow-700 rounded-xl px-3 py-2 text-sm text-yellow-300 font-bold">
                    💡 {medHintText}
                  </div>
                )}

                {/* Map — relative wrapper for overlay */}
                <div className="relative w-full">
                  <FloorDisplay
                    map={sim.map}
                    hamster={sim.hamster}
                    isAnimating={sim.isAnimating}
                    currentStep={sim.currentStep}
                    hintPath={hintPath}
                    collisionPos={collisionPos}
                    successPulse={sim.status === 'success'}
                  />
                  <ResultOverlay status={sim.status} />
                </div>

                {/* ── Status section ── */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400 text-sm">▲</span>
                    <span className="font-jua text-white text-sm">현재 상태</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-xs">위치</span>
                      <span className="text-white font-mono font-bold">
                        ({Math.round(sim.hamster.x)}, {Math.round(sim.hamster.y)})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-xs">방향</span>
                      <span className="text-white font-bold">
                        {Math.round(sim.hamster.angleDeg)}° ({angleArrow(sim.hamster.angleDeg)})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-xs">상태</span>
                      <span className={`font-bold ${statusColor(sim.status)}`}>
                        {statusLabel(sim.status)}
                      </span>
                    </div>
                  </div>

                  {/* Collision/success message */}
                  {sim.status === 'wallHit' && (
                    <p className="text-red-400 text-xs font-bold mt-2">
                      🚨 {sim.currentStep + 1}번째 명령에서 벽에 부딪혔어요. 거리나 각도를 조정해 보세요.
                    </p>
                  )}
                  {sim.status === 'outOfBounds' && (
                    <p className="text-red-400 text-xs font-bold mt-2">
                      🚨 {sim.currentStep + 1}번째 명령에서 범위를 벗어났어요. 거리를 줄여 보세요.
                    </p>
                  )}
                  {sim.status === 'success' && (
                    <p className="text-green-400 text-xs font-bold mt-2">
                      🎉 미션 성공! 총 {sim.commands.length}개의 명령을 사용했어요.
                    </p>
                  )}
                  {sim.status === 'incomplete' && (
                    <p className="text-yellow-400 text-xs font-bold mt-2">
                      ⚠️ 명령이 끝났지만 목표에 도착하지 못했어요. 마지막 이동거리나 회전 각도를 조정해 보세요.
                    </p>
                  )}
                </div>
              </div>

              {/* ════ RIGHT COLUMN (~58%) ════ */}
              <div className="flex-1 flex flex-col gap-4 min-w-0">

                {/* Execution buttons */}
                <ExecutionControls
                  status={sim.status}
                  commandCount={sim.commands.length}
                  onStepForward={sim.stepForward}
                  onRunAll={sim.runAll}
                  onPause={sim.pause}
                  onReset={sim.resetPosition}
                />

                {/* Command editor (sequence + add + settings) */}
                <CommandEditor
                  commands={sim.commands}
                  currentStep={sim.currentStep}
                  status={sim.status}
                  difficulty={difficulty}
                  onAdd={sim.addCommand}
                  onRemove={sim.removeCommand}
                  onRemoveLast={sim.removeLastCommand}
                  onClear={sim.clearCommands}
                  onReorder={sim.reorderCommands}
                  onUpdate={sim.updateCommand}
                />
              </div>
            </div>

            {/* ── Bottom info cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              {/* 실행 정보 */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 flex flex-col gap-3">
                <h4 className="font-jua text-white text-base flex items-center gap-2">✨ 실행 정보</h4>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div className="flex flex-col items-center">
                    <span className="text-slate-400 text-xs">● 명령 단계</span>
                    <span className="text-white font-mono font-bold text-lg">
                      {sim.currentStep < 0 ? 0 : sim.currentStep + 1} / {sim.commands.length}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-slate-400 text-xs">● 상태</span>
                    <span className={`font-bold text-base ${statusColor(sim.status)}`}>{statusLabel(sim.status)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-slate-400 text-xs">● 위치</span>
                    <span className="text-white font-mono text-sm">({Math.round(sim.hamster.x)}, {Math.round(sim.hamster.y)})</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-slate-400 text-xs">↑ 방향</span>
                    <span className="text-white font-bold">{Math.round(sim.hamster.angleDeg)}° ({angleArrow(sim.hamster.angleDeg)})</span>
                  </div>
                </div>
              </div>

              {/* 사용 방법 */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 flex flex-col gap-2">
                <h4 className="font-jua text-white text-base flex items-center gap-2">📖 사용 방법</h4>
                <ol className="text-sm text-slate-400 flex flex-col gap-1.5 list-none">
                  {[
                    '블록을 눌러 명령을 추가하세요.',
                    '각도와 속도, 시간을 조절할 수 있어요.',
                    '드래그해서 순서를 바꿀 수 있어요.',
                    '한 단계 또는 전체 실행으로 로봇을 움직여 보세요!',
                  ].map((t, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">{i+1}</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 팁 */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 flex flex-col gap-2">
                <h4 className="font-jua text-white text-base flex items-center gap-2">💡 팁</h4>
                <ul className="text-sm text-slate-400 flex flex-col gap-1.5">
                  {[
                    '각도를 조금씩 조절하면 더 정확하게 도착할 수 있어요!',
                    '속도와 시간을 바꾸가며 실험해 보세요.',
                    '벽에 부딪히면 각도나 시간을 수정해 보세요!',
                  ].map((t, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-yellow-400 flex-shrink-0">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        )}

        {/* ════ LINE TRACING ════ */}
        {tab === 'linetracing' && (
          <LineTracing difficulty={difficulty} />
        )}
      </main>

      {/* ── Footer legend ── */}
      {tab === 'maze' && (
        <footer className="flex-none bg-slate-950 border-t border-slate-800 px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs text-slate-400">
            <span>🐹 미션: {missionCount} &nbsp;|&nbsp; 난이도: {
              difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움'
            } &nbsp;|&nbsp; 맵: {sim.map.label}</span>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block bg-slate-600 border border-slate-400"></span>벽</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block bg-yellow-200 border border-yellow-400"></span>이동 가능</span>
              <span className="flex items-center gap-1"><span className="text-green-400">⚑</span>목표 지점</span>
              <span className="flex items-center gap-1"><span className="text-red-400">→</span>로봇 방향</span>
              <span className="flex items-center gap-1"><span className="text-red-500">✕</span>충돌 지점</span>
            </div>
          </div>
        </footer>
      )}

      {/* ── "새 미션" confirmation dialog ── */}
      {confirmNew && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border-2 border-slate-600 rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <h3 className="font-jua text-white text-lg">새 미션으로 이동할까요?</h3>
            <p className="text-slate-400 text-sm">
              새 미션으로 이동하면 현재 작성한 명령({sim.commands.length}개)이 삭제됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmNew(false)}
                className="flex-1 min-h-[48px] bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition"
              >
                취소
              </button>
              <button
                onClick={doNewMission}
                className="flex-1 min-h-[48px] bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold transition"
              >
                새 미션 시작
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
