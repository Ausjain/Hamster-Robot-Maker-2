import React, { useState } from 'react';
import { Difficulty } from '../types';
import { useMazeSimulator } from '../hooks/useMazeSimulator';
import { MazeDisplay } from '../components/MazeDisplay';
import { CommandEditor } from '../components/CommandEditor';
import { ExecutionControls } from '../components/ExecutionControls';
import { ResultOverlay } from '../components/ResultOverlay';

export default function Home() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [missionSeed, setMissionSeed] = useState(42);

  const simulator = useMazeSimulator(difficulty, missionSeed);

  function newMission() { 
    setMissionSeed(Math.floor(Math.random() * 100000)); 
  }

  const handleDifficultyChange = (d: Difficulty) => {
    if (simulator.status === 'running') return;
    setDifficulty(d);
  };

  const getDifficultyGuide = () => {
    switch (difficulty) {
      case 'easy': return '🟢 명령 순서를 바꿔서 햄스터를 출발시켜 보세요!';
      case 'medium': return '🟡 부족한 명령을 추가해서 미로를 완성하세요!';
      case 'hard': return '🔴 모든 명령을 직접 만들어 보세요!';
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-900 font-sans flex flex-col">
      {/* Top Header */}
      <header className="flex-none bg-slate-800 shadow-md border-b border-slate-700 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-jua text-white flex items-center gap-2">
            <span>🐹</span> 햄스터 로봇 미션
          </h1>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-900 p-1 rounded-full shadow-inner border border-slate-700">
              <button 
                disabled={simulator.status === 'running'}
                className={`min-h-[44px] px-4 md:px-6 rounded-full font-bold text-sm md:text-base transition-all duration-300 disabled:opacity-50 ${difficulty === 'easy' ? 'bg-green-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`} 
                onClick={() => handleDifficultyChange('easy')}
              >
                쉬움
              </button>
              <button 
                disabled={simulator.status === 'running'}
                className={`min-h-[44px] px-4 md:px-6 rounded-full font-bold text-sm md:text-base transition-all duration-300 disabled:opacity-50 ${difficulty === 'medium' ? 'bg-yellow-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`} 
                onClick={() => handleDifficultyChange('medium')}
              >
                보통
              </button>
              <button 
                disabled={simulator.status === 'running'}
                className={`min-h-[44px] px-4 md:px-6 rounded-full font-bold text-sm md:text-base transition-all duration-300 disabled:opacity-50 ${difficulty === 'hard' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`} 
                onClick={() => handleDifficultyChange('hard')}
              >
                어려움
              </button>
            </div>
            
            <button 
              onClick={newMission} 
              disabled={simulator.status === 'running'}
              className="min-h-[44px] px-4 md:px-6 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-full font-bold shadow-md transition-all active:scale-95"
            >
              새 미션
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Maze */}
        <div className="w-full lg:w-1/2 flex flex-col items-center">
          <div className="mb-4 text-center">
            <p className="text-xl font-jua text-indigo-300">
              {getDifficultyGuide()}
            </p>
          </div>
          
          <div className="relative w-full flex justify-center">
            <MazeDisplay 
              maze={simulator.maze}
              size={simulator.size}
              hamster={simulator.hamster}
              currentStep={simulator.currentStep}
            />
            <ResultOverlay status={simulator.status} />
          </div>
        </div>

        {/* Right Column: Controls & Editor */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <ExecutionControls 
            status={simulator.status}
            commandCount={simulator.commands.length}
            onStepForward={simulator.stepForward}
            onRunAll={simulator.runAll}
            onPause={simulator.pause}
            onReset={simulator.resetPosition}
          />

          <CommandEditor 
            commands={simulator.commands}
            currentStep={simulator.currentStep}
            status={simulator.status}
            difficulty={difficulty}
            onAdd={simulator.addCommand}
            onRemove={simulator.removeCommand}
            onRemoveLast={simulator.removeLastCommand}
            onClear={simulator.clearCommands}
            onReorder={simulator.reorderCommands}
          />
        </div>
      </main>
    </div>
  );
}