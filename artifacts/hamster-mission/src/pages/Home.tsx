import React, { useState } from 'react';
import { MissionCard } from '@/components/MissionCard';
import { Printer, RefreshCw } from 'lucide-react';

export default function Home() {
  const [activity, setActivity] = useState<'maze' | 'line'>('maze');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [missionKey, setMissionKey] = useState(0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-amber-50/50 font-sans pb-20">
      {/* Control Panel - hidden in print */}
      <div className="no-print bg-white shadow-sm border-b border-amber-100 p-6 mb-8 flex flex-col items-center gap-8">
        <h1 className="text-4xl md:text-5xl font-jua text-amber-600 drop-shadow-sm">
          🐹 햄스터 로봇 미션 생성기
        </h1>
        
        <div className="flex flex-wrap justify-center gap-8 lg:gap-16 w-full max-w-4xl">
          {/* Activity Toggle */}
          <div className="flex flex-col gap-3">
            <span className="text-lg font-bold text-slate-500 text-center">활동 선택</span>
            <div className="flex bg-slate-100 p-1 rounded-full shadow-inner">
              <button 
                className={`min-h-[48px] px-8 rounded-full font-bold text-lg transition-all duration-300 ${activity === 'maze' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`} 
                onClick={() => setActivity('maze')}
              >
                미로찾기
              </button>
              <button 
                className={`min-h-[48px] px-8 rounded-full font-bold text-lg transition-all duration-300 ${activity === 'line' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`} 
                onClick={() => setActivity('line')}
              >
                라인트레이싱
              </button>
            </div>
          </div>

          {/* Difficulty Toggle */}
          <div className="flex flex-col gap-3">
            <span className="text-lg font-bold text-slate-500 text-center">난이도 선택</span>
            <div className="flex bg-slate-100 p-1 rounded-full shadow-inner">
              <button 
                className={`min-h-[48px] px-6 rounded-full font-bold text-lg transition-all duration-300 ${difficulty === 'easy' ? 'bg-green-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`} 
                onClick={() => setDifficulty('easy')}
              >
                쉬움
              </button>
              <button 
                className={`min-h-[48px] px-6 rounded-full font-bold text-lg transition-all duration-300 ${difficulty === 'medium' ? 'bg-yellow-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`} 
                onClick={() => setDifficulty('medium')}
              >
                보통
              </button>
              <button 
                className={`min-h-[48px] px-6 rounded-full font-bold text-lg transition-all duration-300 ${difficulty === 'hard' ? 'bg-red-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`} 
                onClick={() => setDifficulty('hard')}
              >
                어려움
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          <button 
            onClick={() => setMissionKey(k => k + 1)} 
            className="min-h-[56px] px-8 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-full font-bold text-xl shadow-lg hover:shadow-xl transform transition hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3"
          >
            <RefreshCw className="w-6 h-6" />
            새 미션 만들기
          </button>
          <button 
            onClick={handlePrint} 
            className="min-h-[56px] px-8 bg-slate-800 hover:bg-slate-900 active:bg-black text-white rounded-full font-bold text-xl shadow-lg hover:shadow-xl transform transition hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3"
          >
            <Printer className="w-6 h-6" />
            인쇄
          </button>
        </div>
      </div>

      {/* Print Area Container */}
      <div className="flex justify-center px-4">
        <div className="bg-white shadow-2xl rounded-[2rem] w-full max-w-[210mm] overflow-hidden print:shadow-none print:rounded-none">
          <div id="print-area">
            <MissionCard activity={activity} difficulty={difficulty} missionKey={missionKey} />
          </div>
        </div>
      </div>
    </div>
  );
}
