import React, { useMemo } from 'react';
import { MazeGenerator } from './MazeGenerator';
import { LineTracing } from './LineTracing';
import { RecordArea } from './RecordArea';

const MAZE_MISSIONS = [
  "벽에 닿지 않고 도착하기",
  "오른쪽 돌기를 2번 이하로 사용하기",
  "가장 적은 명령으로 도착하기",
  "한 번에 성공하기",
  "앞으로 이동 명령의 횟수를 기록하기",
];

const LINE_MISSIONS = [
  "속도를 두 가지 이상 시험하기",
  "가장 안정적으로 완주하는 속도 찾기",
  "가장 빠른 완주 속도 찾기",
  "급커브에서 선을 벗어나지 않도록 조절하기",
  "첫 번째 실행과 수정 후 실행 결과 비교하기",
];

interface MissionCardProps {
  activity: 'maze' | 'line';
  difficulty: 'easy' | 'medium' | 'hard';
  missionKey: number;
}

export function MissionCard({ activity, difficulty, missionKey }: MissionCardProps) {
  // Generate stable random mission number (100-999) based on missionKey
  const missionNumber = useMemo(() => {
    return Math.floor(Math.random() * 900) + 100;
  }, [missionKey]);

  // Select 1 or 2 random missions based on activity
  const selectedMissions = useMemo(() => {
    const pool = activity === 'maze' ? [...MAZE_MISSIONS] : [...LINE_MISSIONS];
    pool.sort(() => Math.random() - 0.5); // simple shuffle
    const count = Math.random() > 0.5 ? 2 : 1;
    return pool.slice(0, count);
  }, [activity, missionKey]);

  // Styling based on difficulty
  const difficultyLabel = difficulty === 'easy' ? '쉬움' : difficulty === 'medium' ? '보통' : '어려움';
  const difficultyColor = 
    difficulty === 'easy' ? 'bg-green-100 text-green-800 border-green-200' : 
    difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
    'bg-red-100 text-red-800 border-red-200';

  return (
    <div className="p-10 md:p-12 font-sans flex flex-col h-full bg-white text-slate-800 min-h-[297mm]">
      
      {/* Header Area */}
      <div className="flex justify-between items-end border-b-[4px] border-amber-400 pb-5 mb-8">
        <div className="flex items-center gap-5">
          <h2 className="text-4xl md:text-5xl font-jua text-amber-600">
            {activity === 'maze' ? '🐹 햄스터 미로탐험' : '🏎️ 라인트레이싱 미션'}
          </h2>
          <span className={`px-5 py-2 rounded-2xl font-jua text-2xl border-[2px] ${difficultyColor}`}>
            {difficultyLabel}
          </span>
        </div>
        <div className="text-3xl font-bold text-slate-400 font-mono tracking-wider">
          #{missionNumber}
        </div>
      </div>

      {/* Mission Goal Box */}
      <div className="bg-amber-50/50 border-[3px] border-amber-200 rounded-3xl p-8 mb-10 shadow-sm print:border-amber-300 print:bg-amber-50">
        <h3 className="text-3xl font-jua text-amber-800 mb-6 flex items-center gap-3">
          <span className="drop-shadow-sm text-4xl">⭐</span> 오늘의 미션!
        </h3>
        <ul className="flex flex-col gap-4">
          {selectedMissions.map((mission, idx) => (
            <li key={idx} className="flex items-center gap-4 text-xl md:text-2xl font-bold text-slate-700">
              <span className="text-3xl leading-none flex-shrink-0">✅</span>
              <span>{mission}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Graphic / Challenge Area */}
      <div className="flex-1 flex flex-col items-center justify-center mb-10 min-h-[300px]">
        {activity === 'maze' ? (
          <MazeGenerator difficulty={difficulty} missionKey={missionKey} />
        ) : (
          <LineTracing missionKey={missionKey} />
        )}
      </div>

      {/* Record Area at bottom */}
      <div className="mt-auto pt-4">
        <RecordArea />
      </div>
      
    </div>
  );
}
