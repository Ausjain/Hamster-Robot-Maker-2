import React, { useState } from 'react';
import { Difficulty } from '../types';
import { useHamsterSimulator } from '../hooks/useHamsterSimulator';
import { FloorDisplay } from '../components/FloorDisplay';
import { CommandEditor } from '../components/CommandEditor';
import { ExecutionControls } from '../components/ExecutionControls';
import { ResultOverlay } from '../components/ResultOverlay';
import { LineTracing } from '../components/LineTracing';

type TabType = 'maze' | 'linetracing';

export default function Home() {
  const [tab,          setTab]          = useState<TabType>('maze');
  const [difficulty,   setDifficulty]   = useState<Difficulty>('easy');
  const [missionSeed,  setMissionSeed]  = useState(0);

  const sim = useHamsterSimulator(difficulty, missionSeed);

  function newMission() {
    setMissionSeed(prev => (prev + 1) % 4);
  }

  function handleDifficulty(d: Difficulty) {
    if (sim.status === 'running') return;
    setDifficulty(d);
  }

  function handleTab(t: TabType) {
    if (sim.status === 'running') return;
    setTab(t);
  }

  const guideText = {
    easy:   '🟢 제공된 명령의 속도·시간·각도를 조절해서 햄스터를 목표로 보내 보세요!',
    medium: '🟡 첫 번째 명령 이후를 직접 완성해 보세요.',
    hard:   '🔴 아무 힌트 없이 처음부터 도전해 보세요!',
  }[difficulty];

  const diffBtnBase =
    'min-h-[44px] px-4 md:px-5 rounded-full font-bold text-sm md:text-base transition-all duration-300 disabled:opacity-50';

  return (
    <div className="min-h-[100dvh] bg-slate-900 font-sans flex flex-col">

      {/* ── Header ── */}
      <header className="flex-none bg-slate-800 border-b border-slate-700 px-4 py-3 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">

          {/* Left: title + activity tabs */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-2xl font-jua text-white flex items-center gap-2">
              <span>🐹</span> 햄스터 로봇 미션
            </h1>

            {/* Activity tabs */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 gap-0.5">
              <button
                onClick={() => handleTab('maze')}
                className={`px-4 py-2 rounded-lg font-jua text-sm transition-all duration-200 ${
                  tab === 'maze'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🗺️ 미로찾기
              </button>
              <button
                onClick={() => handleTab('linetracing')}
                className={`px-4 py-2 rounded-lg font-jua text-sm transition-all duration-200 ${
                  tab === 'linetracing'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🛤️ 라인트레이싱
              </button>
            </div>
          </div>

          {/* Right: difficulty + (maze only) next map */}
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-900 p-1 rounded-full border border-slate-700">
              <button
                disabled={sim.status === 'running'}
                onClick={() => handleDifficulty('easy')}
                className={`${diffBtnBase} ${difficulty === 'easy' ? 'bg-green-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                쉬움
              </button>
              <button
                disabled={sim.status === 'running'}
                onClick={() => handleDifficulty('medium')}
                className={`${diffBtnBase} ${difficulty === 'medium' ? 'bg-yellow-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                보통
              </button>
              <button
                disabled={sim.status === 'running'}
                onClick={() => handleDifficulty('hard')}
                className={`${diffBtnBase} ${difficulty === 'hard' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                어려움
              </button>
            </div>

            {tab === 'maze' && (
              <button
                onClick={newMission}
                disabled={sim.status === 'running'}
                className="min-h-[44px] px-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-full font-bold shadow-md transition-all active:scale-95"
              >
                🗺️ 다음 맵
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">

        {/* ════ MAZE tab ════ */}
        {tab === 'maze' && (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">

            {/* Left: Floor */}
            <div className="w-full lg:w-1/2 flex flex-col items-center gap-4">
              <p className="text-base font-jua text-indigo-300 text-center px-2">
                {guideText}
              </p>
              <div className="relative w-full flex justify-center">
                <FloorDisplay
                  map={sim.map}
                  hamster={sim.hamster}
                  isAnimating={sim.isAnimating}
                  currentStep={sim.currentStep}
                />
                <ResultOverlay status={sim.status} />
              </div>
            </div>

            {/* Right: Controls + Editor */}
            <div className="w-full lg:w-1/2 flex flex-col gap-5">
              {/* Execution buttons — top of right column */}
              <ExecutionControls
                status={sim.status}
                commandCount={sim.commands.length}
                onStepForward={sim.stepForward}
                onRunAll={sim.runAll}
                onPause={sim.pause}
                onReset={sim.resetPosition}
              />

              {/* Command editor (add buttons + sequence) */}
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
        )}

        {/* ════ LINE TRACING tab ════ */}
        {tab === 'linetracing' && (
          <LineTracing difficulty={difficulty} />
        )}
      </main>
    </div>
  );
}
