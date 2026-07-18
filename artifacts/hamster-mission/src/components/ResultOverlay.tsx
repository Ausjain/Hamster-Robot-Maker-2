import React from 'react';
import { ExecutionStatus } from '../types';

interface ResultOverlayProps {
  status: ExecutionStatus;
}

export function ResultOverlay({ status }: ResultOverlayProps) {
  if (status === 'idle' || status === 'running' || status === 'paused') {
    return null;
  }

  let bgClass = '';
  let title = '';
  let subtitle = '';

  if (status === 'wallHit') {
    bgClass = 'bg-red-500/90 text-white';
    title = '🚧 벽에 부딪혔어요!';
    subtitle = '명령을 고쳐 보세요.';
  } else if (status === 'success') {
    bgClass = 'bg-green-500/90 text-white';
    title = '🎉 미션 성공!';
    subtitle = '정말 잘했어요!';
  } else if (status === 'incomplete') {
    bgClass = 'bg-yellow-500/90 text-white';
    title = '🤔 아직 도착하지 못했어요.';
    subtitle = '명령이 부족해요. 더 추가해 보세요.';
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className={`p-8 md:p-12 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center text-center backdrop-blur-sm transform transition-all animate-in zoom-in duration-300 ${bgClass}`}>
        <h2 className="text-4xl md:text-5xl font-jua mb-4 drop-shadow-md">
          {title}
        </h2>
        <p className="text-xl md:text-2xl font-sans font-bold opacity-90">
          {subtitle}
        </p>
      </div>
      
      {/* Decorative stars for success */}
      {status === 'success' && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div 
              key={i}
              className="absolute text-yellow-300 text-3xl animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${1 + Math.random()}s`
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