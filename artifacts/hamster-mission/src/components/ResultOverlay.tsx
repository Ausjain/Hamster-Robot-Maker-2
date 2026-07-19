import React from 'react';
import { ExecutionStatus } from '../types';

interface ResultOverlayProps {
  status: ExecutionStatus;
}

export function ResultOverlay({ status }: ResultOverlayProps) {
  if (status === 'idle' || status === 'running' || status === 'paused') return null;

  type Config = { bg: string; title: string; subtitle: string };
  const configs: Record<string, Config> = {
    wallHit:     { bg: 'bg-red-500/90',    title: '🚧 벽에 부딪혔어요!',   subtitle: '속도나 이동 시간을 줄여 보세요.' },
    outOfBounds: { bg: 'bg-orange-500/90', title: '⚠️ 바닥을 벗어났어요!', subtitle: '이동 거리를 조절해 보세요.' },
    success:     { bg: 'bg-green-500/90',  title: '🎉 미션 성공!',          subtitle: '정말 잘했어요!' },
    incomplete:  { bg: 'bg-yellow-500/90', title: '🤔 아직 목표에 못 왔어요.', subtitle: '명령을 추가하거나 값을 수정해 보세요.' },
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className={`p-8 md:p-10 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center text-center backdrop-blur-sm ${cfg.bg}`}>
        <h2 className="text-4xl md:text-5xl font-jua text-white mb-3 drop-shadow-md">
          {cfg.title}
        </h2>
        <p className="text-lg md:text-xl text-white font-bold opacity-90">
          {cfg.subtitle}
        </p>
      </div>

      {status === 'success' && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-yellow-300 animate-pulse"
              style={{
                fontSize: `${20 + Math.floor(i * 3.7) % 16}px`,
                top:  `${5 + (i * 37) % 90}%`,
                left: `${3 + (i * 43) % 94}%`,
                animationDelay: `${(i * 0.17) % 1}s`,
                animationDuration: `${0.9 + (i * 0.11) % 0.8}s`,
              }}
            >
              ⭐
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
