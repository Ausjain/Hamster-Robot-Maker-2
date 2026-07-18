import React from 'react';
import { Cell, HamsterState } from '../types';

interface MazeDisplayProps {
  maze: Cell[][];
  size: number;
  hamster: HamsterState;
  currentStep: number;
}

export function MazeDisplay({ maze, size, hamster, currentStep }: MazeDisplayProps) {
  const cellSize = size === 4 ? 72 : size === 5 ? 60 : 50;
  const padding = 16;
  const svgSize = size * cellSize + padding * 2;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="bg-slate-800 p-4 md:p-6 rounded-[2rem] shadow-xl border-4 border-slate-700 flex items-center justify-center relative overflow-hidden">
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${svgSize} ${svgSize}`} 
          className="max-w-[500px] max-h-[500px] w-full h-auto drop-shadow-lg"
          style={{ overflow: 'visible' }}
        >
          <g transform={`translate(${padding}, ${padding})`}>
            {/* Background */}
            <rect width={size * cellSize} height={size * cellSize} fill="#FEF9C3" rx="8" />
            
            {/* Start point highlight */}
            <circle cx={cellSize / 2} cy={cellSize / 2} r={cellSize / 2 - 8} fill="#dcfce3" />

            {/* Current Step Highlight */}
            {currentStep >= 0 && (
              <circle 
                cx={hamster.col * cellSize + cellSize / 2} 
                cy={hamster.row * cellSize + cellSize / 2} 
                r={cellSize / 2 - 4} 
                fill="#fde047" 
                opacity="0.5" 
                className="transition-all duration-300"
              />
            )}

            {/* Grid & Walls */}
            {maze.map((row, r) =>
              row.map((cell, c) => {
                const x = c * cellSize;
                const y = r * cellSize;
                return (
                  <g key={`${r}-${c}`}>
                    {cell.top && <line x1={x} y1={y} x2={x + cellSize} y2={y} stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />}
                    {cell.right && <line x1={x + cellSize} y1={y} x2={x + cellSize} y2={y + cellSize} stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />}
                    {cell.bottom && <line x1={x} y1={y + cellSize} x2={x + cellSize} y2={y + cellSize} stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />}
                    {cell.left && <line x1={x} y1={y} x2={x} y2={y + cellSize} stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />}
                  </g>
                );
              })
            )}

            {/* Hamster */}
            <g 
              transform={`translate(${hamster.col * cellSize + cellSize / 2} ${hamster.row * cellSize + cellSize / 2}) rotate(${hamster.direction * 90})`}
              className="transition-transform duration-300"
            >
              <ellipse rx="16" ry="13" fill="#F4A261"/>
              <ellipse cx="-9" cy="-12" rx="5" ry="6" fill="#F4A261"/>
              <ellipse cx="9" cy="-12" rx="5" ry="6" fill="#F4A261"/>
              <ellipse cx="-9" cy="-12" rx="3" ry="4" fill="#E07070"/>
              <ellipse cx="9" cy="-12" rx="3" ry="4" fill="#E07070"/>
              <circle cx="-5" cy="-2" r="3" fill="#1e293b"/>
              <circle cx="5" cy="-2" r="3" fill="#1e293b"/>
              <circle cx="-4" cy="-3" r="1" fill="white"/>
              <circle cx="6" cy="-3" r="1" fill="white"/>
              <ellipse cx="13" cy="0" rx="4" ry="3" fill="#E07070"/>
              <polygon points="17,-4 24,0 17,4" fill="#ef4444" opacity="0.9"/>
            </g>

            {/* Goal Flag */}
            <g transform={`translate(${(size - 1) * cellSize + cellSize / 2} ${(size - 1) * cellSize + cellSize / 2})`}>
              <line x1="0" y1="-20" x2="0" y2="20" stroke="#334155" strokeWidth="2.5" strokeLinecap="round"/>
              <rect x="0" y="-20" width="22" height="14" fill="#22c55e" rx="2"/>
              <rect x="0" y="-20" width="11" height="7" fill="#16a34a"/>
              <rect x="11" y="-13" width="11" height="7" fill="#16a34a"/>
              <text x="11" y="-5" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">GOAL</text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}