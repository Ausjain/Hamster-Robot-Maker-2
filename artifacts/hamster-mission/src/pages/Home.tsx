import React, { useState } from 'react';
import { Difficulty, HamsterState } from '../types';
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

function statusLabel(s: string): string {
  const m: Record<string,string> = {
    idle:'대기 중', running:'실행 중', paused:'일시정지',
    wallHit:'벽 충돌', outOfBounds:'범위 초과', success:'성공!', incomplete:'미완료',
  };
  return m[s] ?? s;
}

export default function Home() {
  const [tab,         setTab]         = useState<TabType>('maze');
  const [difficulty,  setDifficulty]  = useState<Difficulty>('easy');
  const [missionSeed, setMissionSeed] = useState(0);

  const sim = useHamsterSimulator(difficulty, missionSeed);

  function newMission() { setMissionSeed(prev => (prev + 1) % 4); }

  function handleDifficulty(d: Difficulty) {
    if (sim.status === 'running') return;
    setDifficulty(d);
  }

  function handleTab(t: TabType) {
    if (sim.status === 'running') return;
    setTab(t);
  }

  const diffBase = 'min-h-[40px] px-4 rounded-full font-bold text-sm transition-all duration-300 disabled:opacity-50';

  return (
    <div className="min-h-[100dvh] bg-slate-900 font-sans flex flex-col">

      {/* ── Top header ── */}
      <header className="flex-none bg-slate-800 border-b border-slate-700 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
          <h1 className="text-2xl font-jua text-white flex items-center gap-2 flex-shrink-0">
            <span>🐹</span> 햄스터 로봇 미션
          </h1>

          <div className="flex items-center gap-3">
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
              <button onClick={newMission} disabled={sim.status === 'running'}
                className="min-h-[40px] px-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-full font-bold shadow transition-all active:scale-95">
                🗺️ 다음 맵
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <nav className="flex-none bg-slate-800 border-b border-slate-700 px-4">
        <div className="max-w-7xl mx-auto flex gap-1">
          <button
            onClick={() => handleTab('maze')}
            className={`flex items-center gap-2 px-6 py-3 font-jua text-base border-b-3 transition-all ${
              tab === 'maze'
                ? 'border-indigo-400 text-white border-b-[3px]'
                : 'border-transparent text-slate-400 hover:text-slate-200 border-b-[3px]'
            }`}
          >
            <span>⊞</span> 미로찾기
          </button>
          <button
            onClick={() => handleTab('linetracing')}
            className={`flex items-center gap-2 px-6 py-3 font-jua text-base border-b-3 transition-all ${
              tab === 'linetracing'
                ? 'border-indigo-400 text-white border-b-[3px]'
                : 'border-transparent text-slate-400 hover:text-slate-200 border-b-[3px]'
            }`}
          >
            <span>∿</span> 라인트레이싱
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-5">

        {/* ════ MAZE ════ */}
        {tab === 'maze' && (
          <div className="flex flex-col gap-4">

            {/* Guide */}
            <p className="text-sm font-jua text-green-400">
              🟢 {
                difficulty === 'easy'   ? '명령 블록을 추가하고 값을 조정한 후 실행해 보세요!' :
                difficulty === 'medium' ? '첫 번째 명령 이후를 직접 완성해 보세요!' :
                                          '아무 힌트 없이 처음부터 도전해 보세요!'
              }
            </p>

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row gap-5 items-start">

              {/* ── Left: Map ── */}
              <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col items-center gap-3">
                <div className="relative w-full flex justify-center">
                  <FloorDisplay
                    map={sim.map}
                    hamster={sim.hamster}
                    isAnimating={sim.isAnimating}
                    currentStep={sim.currentStep}
                  />
                  <ResultOverlay status={sim.status} />
                </div>

                {/* Start direction */}
                <div className="flex items-center gap-2 bg-slate-800 rounded-full px-4 py-2 border border-slate-700">
                  <span className="text-yellow-400">⏱</span>
                  <span className="text-slate-300 text-sm font-bold">
                    출발 방향: <span className="text-white">{startDirLabel(sim.map.start.angleDeg)}</span>
                  </span>
                </div>
              </div>

              {/* ── Right: Controls + Editor ── */}
              <div className="flex-1 flex flex-col gap-5 min-w-0">

                {/* Execution buttons */}
                <ExecutionControls
                  status={sim.status}
                  commandCount={sim.commands.length}
                  onStepForward={sim.stepForward}
                  onRunAll={sim.runAll}
                  onPause={sim.pause}
                  onReset={sim.resetPosition}
                />

                {/* Command palette + sequence */}
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
                <h4 className="font-jua text-white text-base flex items-center gap-2">🔍 실행 정보</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span className="text-slate-400">현재 단계</span>
                  <span className="text-white font-mono font-bold">
                    {sim.currentStep < 0 ? 0 : sim.currentStep + 1} / {sim.commands.length}
                  </span>
                  <span className="text-slate-400">상태</span>
                  <span className={`font-bold ${
                    sim.status === 'success' ? 'text-green-400' :
                    sim.status === 'wallHit' || sim.status === 'outOfBounds' ? 'text-red-400' :
                    sim.status === 'running' ? 'text-blue-400' : 'text-slate-300'
                  }`}>{statusLabel(sim.status)}</span>
                  <span className="text-slate-400">위치</span>
                  <span className="text-white font-mono text-xs">
                    ({Math.round(sim.hamster.x)}, {Math.round(sim.hamster.y)})
                  </span>
                  <span className="text-slate-400">방향</span>
                  <span className="text-white font-bold">
                    → ({Math.round(sim.hamster.angleDeg)}°)
                  </span>
                </div>
              </div>

              {/* 사용 방법 */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 flex flex-col gap-2">
                <h4 className="font-jua text-white text-base flex items-center gap-2">📖 사용 방법</h4>
                <ol className="text-sm text-slate-400 flex flex-col gap-1.5 list-none">
                  {[
                    '블록을 눌러 명령을 추가하세요.',
                    '각도는 슬라이더나 미세조정 버튼으로 조절할 수 있어요.',
                    '드래그해서 순서를 변경할 수 있어요.',
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
                    '속도와 시간 값을 바꾸가며 실험해 보세요.',
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
    </div>
  );
}
