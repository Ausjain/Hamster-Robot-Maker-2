import React, { useState, useEffect, useRef } from 'react';
import { useHamsterSimulator } from '../hooks/useHamsterSimulator';
import { FloorDisplay } from '../components/FloorDisplay';
import { CommandEditor } from '../components/CommandEditor';
import { ExecutionControls } from '../components/ExecutionControls';
import { ResultOverlay } from '../components/ResultOverlay';
import { LineTracing } from '../components/LineTracing';
import { MISSION_STAGES } from '../maps';

type TabType = 'maze' | 'linetracing';

function angleArrow(a: number): string {
  const n = ((a % 360) + 360) % 360;
  if (n < 22.5 || n >= 337.5) return '→';
  if (n < 67.5)  return '↘';
  if (n < 112.5) return '↓';
  if (n < 157.5) return '↙';
  if (n < 202.5) return '←';
  if (n < 247.5) return '↖';
  if (n < 292.5) return '↑';
  return '↗';
}

function startDirLabel(a: number): string {
  const n = ((a % 360) + 360) % 360;
  if (n < 22.5 || n >= 337.5) return '오른쪽';
  if (n < 67.5)  return '오른쪽 아래';
  if (n < 112.5) return '아래쪽';
  if (n < 157.5) return '왼쪽 아래';
  if (n < 202.5) return '왼쪽';
  if (n < 247.5) return '왼쪽 위';
  if (n < 292.5) return '위쪽';
  return '오른쪽 위';
}

function statusLabel(s: string): string {
  const m: Record<string,string> = {
    idle:'대기 중', running:'실행 중', paused:'일시정지',
    wallHit:'벽 충돌', outOfBounds:'범위 초과', success:'성공!', incomplete:'미완료',
  };
  return m[s] ?? s;
}

function statusColor(s: string): string {
  if (s === 'success')  return 'text-green-400';
  if (s === 'wallHit' || s === 'outOfBounds') return 'text-red-400';
  if (s === 'running')  return 'text-blue-400';
  if (s === 'incomplete') return 'text-yellow-400';
  return 'text-slate-300';
}

const TOTAL_STAGES = MISSION_STAGES.length;

export default function Home() {
  const [tab,          setTab]          = useState<TabType>('maze');
  const [stageIndex,   setStageIndex]   = useState(0);   // 0-based
  const [confirmStage, setConfirmStage] = useState<number | null>(null);

  const sim = useHamsterSimulator(stageIndex);

  /* Collision position: captured when status transitions to wallHit/outOfBounds */
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

  /* Clear collision pos on stage change */
  useEffect(() => { setCollisionPos(null); }, [stageIndex]);

  function requestStageChange(newIdx: number) {
    if (newIdx === stageIndex) return;
    if (sim.commands.length > 0) {
      setConfirmStage(newIdx);
    } else {
      doStageChange(newIdx);
    }
  }

  function doStageChange(newIdx: number) {
    setStageIndex(newIdx);
    setConfirmStage(null);
    setCollisionPos(null);
  }

  function handleTab(t: TabType) {
    if (sim.status === 'running') return;
    setTab(t);
  }

  const stage   = sim.map;
  const isSuccess = sim.status === 'success';
  const canNext   = isSuccess && stageIndex < TOTAL_STAGES - 1;

  /* Stage button colors */
  const stageColors = ['#3b82f6','#f97316','#22c55e','#a855f7','#ef4444'];

  return (
    <div className="min-h-[100dvh] bg-slate-900 font-sans flex flex-col">

      {/* ── Header ── */}
      <header className="flex-none bg-slate-800 border-b border-slate-700 px-4 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-xl font-jua text-white flex items-center gap-2 flex-shrink-0">
            <span>🐹</span> 햄스터 로봇 미션
          </h1>

          {/* Stage buttons */}
          {tab === 'maze' && (
            <div className="flex items-center gap-1.5">
              {MISSION_STAGES.map((s, i) => {
                const isActive = i === stageIndex;
                return (
                  <button
                    key={s.id}
                    onClick={() => requestStageChange(i)}
                    disabled={sim.status === 'running'}
                    className="min-h-[40px] px-3 rounded-xl font-jua text-sm transition-all active:scale-95 disabled:opacity-50"
                    style={{
                      background: isActive ? stageColors[i] : '#1e293b',
                      color: isActive ? '#fff' : '#94a3b8',
                      border: isActive ? `2px solid ${stageColors[i]}` : '2px solid #334155',
                      boxShadow: isActive ? `0 0 12px ${stageColors[i]}60` : undefined,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ── Tab bar ── */}
      <nav className="flex-none bg-slate-800 border-b border-slate-700 px-4">
        <div className="max-w-7xl mx-auto flex gap-1">
          {(['maze','linetracing'] as TabType[]).map(t => (
            <button key={t}
              onClick={() => handleTab(t)}
              className={`flex items-center gap-2 px-6 py-3 font-jua text-base border-b-[3px] transition-all ${
                tab === t ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
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
          <div className="flex flex-col lg:flex-row gap-5 items-start">

            {/* ════ LEFT COLUMN (42%) ════ */}
            <div className="w-full lg:w-[42%] flex-shrink-0 flex flex-col gap-3">

              {/* Stage title */}
              <div className="flex flex-col gap-0.5">
                <h2 className="font-jua text-white text-lg flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold text-white"
                        style={{ background: stageColors[stageIndex] }}>
                    {stage.label}
                  </span>
                  {stage.title}
                </h2>
                <p className="text-slate-400 text-sm">{stage.subtitle}</p>
              </div>

              {/* Start direction */}
              <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1.5 border border-slate-700 text-sm self-start">
                <span className="text-green-400">●</span>
                <span className="text-slate-300">출발 방향: </span>
                <span className="text-white font-bold">
                  {angleArrow(stage.start.angleDeg)} {startDirLabel(stage.start.angleDeg)}
                </span>
              </div>

              {/* Map */}
              <div className="relative w-full">
                <FloorDisplay
                  map={sim.map}
                  hamster={sim.hamster}
                  isAnimating={sim.isAnimating}
                  currentStep={sim.currentStep}
                  collisionPos={collisionPos}
                  successPulse={sim.status === 'success'}
                />
                <ResultOverlay status={sim.status} />
              </div>

              {/* Current state */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-400">▲</span>
                  <span className="font-jua text-white text-sm">현재 상태</span>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-xs">위치</span>
                    <span className="text-white font-mono font-bold text-xs">
                      ({Math.round(sim.hamster.x)}, {Math.round(sim.hamster.y)})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-xs">방향</span>
                    <span className="text-white font-bold text-xs">
                      {Math.round(sim.hamster.angleDeg)}° ({angleArrow(sim.hamster.angleDeg)})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-xs">실행</span>
                    <span className="text-white font-bold text-xs">
                      {Math.max(0, sim.currentStep + 1)} / {sim.commands.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-xs">상태</span>
                    <span className={`font-bold text-xs ${statusColor(sim.status)}`}>
                      {statusLabel(sim.status)}
                    </span>
                  </div>
                </div>

                {/* Feedback messages */}
                {sim.status === 'wallHit' && (
                  <p className="text-red-400 text-xs font-bold mt-2">
                    🚧 {sim.collisionStep + 1}번째 명령에서 벽에 부딪혔어요. 이동시간이나 각도를 조절해 보세요.
                  </p>
                )}
                {sim.status === 'outOfBounds' && (
                  <p className="text-red-400 text-xs font-bold mt-2">
                    🚧 {sim.collisionStep + 1}번째 명령에서 범위를 벗어났어요. 이동 거리를 줄여 보세요.
                  </p>
                )}
                {sim.status === 'success' && (
                  <p className="text-green-400 text-xs font-bold mt-2">
                    🎉 {stage.successMsg} (총 {sim.commands.length}개 명령 사용)
                  </p>
                )}
                {sim.status === 'incomplete' && (
                  <p className="text-yellow-400 text-xs font-bold mt-2">
                    ⚠️ 명령은 끝났지만 목표에 도착하지 못했어요. 마지막 명령의 이동거리나 회전 각도를 확인해 보세요.
                  </p>
                )}
              </div>
            </div>

            {/* ════ RIGHT COLUMN (58%) ════ */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">

              {/* Execution buttons */}
              <ExecutionControls
                status={sim.status}
                commandCount={sim.commands.length}
                onStepForward={sim.stepForward}
                onRunAll={sim.runAll}
                onPause={sim.pause}
                onReset={sim.resetPosition}
              />

              {/* Stage control row */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={sim.clearCommands}
                  disabled={sim.status === 'running'}
                  className="flex-1 min-h-[44px] bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded-xl font-jua text-sm transition-all active:scale-95"
                >
                  🔄 현재 단계 다시 하기
                </button>

                {canNext && (
                  <button
                    onClick={() => requestStageChange(stageIndex + 1)}
                    className="flex-1 min-h-[44px] text-white rounded-xl font-jua text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                    style={{ background: stageColors[stageIndex + 1], border: `2px solid ${stageColors[stageIndex + 1]}` }}
                  >
                    {MISSION_STAGES[stageIndex + 1].label}로 이동 →
                  </button>
                )}

                {isSuccess && stageIndex === TOTAL_STAGES - 1 && (
                  <div className="flex-1 min-h-[44px] bg-yellow-500/20 border border-yellow-500 rounded-xl flex items-center justify-center px-3">
                    <span className="text-yellow-300 font-jua text-sm">🏆 전체 미션 완료!</span>
                  </div>
                )}
              </div>

              {/* Command editor (add buttons + vertical card list) */}
              <CommandEditor
                commands={sim.commands}
                currentStep={sim.currentStep}
                collisionStep={sim.collisionStep}
                status={sim.status}
                onAdd={sim.addCommand}
                onRemove={sim.removeCommand}
                onRemoveLast={sim.removeLastCommand}
                onClearOnly={sim.clearCommandsOnly}
                onReorder={sim.reorderCommands}
                onUpdate={sim.updateCommand}
              />
            </div>
          </div>
        )}

        {/* ════ LINE TRACING ════ */}
        {tab === 'linetracing' && (
          <LineTracing difficulty="easy" />
        )}
      </main>

      {/* ── Footer legend ── */}
      {tab === 'maze' && (
        <footer className="flex-none bg-slate-950 border-t border-slate-800 px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs text-slate-400">
            <span>
              🐹 {stage.label} &nbsp;|&nbsp; {stage.title}
            </span>
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

      {/* ── Stage change confirmation ── */}
      {confirmStage !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border-2 border-slate-600 rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <h3 className="font-jua text-white text-lg">
              {MISSION_STAGES[confirmStage].label}(으)로 이동할까요?
            </h3>
            <p className="text-slate-400 text-sm">
              단계를 바꾸면 현재 작성한 명령({sim.commands.length}개)이 삭제됩니다. 이동할까요?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmStage(null)}
                className="flex-1 min-h-[48px] bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition"
              >
                취소
              </button>
              <button
                onClick={() => doStageChange(confirmStage)}
                className="flex-1 min-h-[48px] text-white rounded-xl font-bold transition"
                style={{ background: stageColors[confirmStage] }}
              >
                이동
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
