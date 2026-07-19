import React from 'react';
import { FloorMap, HamsterState } from '../types';

interface FloorDisplayProps {
  map: FloorMap;
  hamster: HamsterState;
  isAnimating: boolean;
  currentStep: number;
}

export function FloorDisplay({ map, hamster, isAnimating, currentStep }: FloorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="bg-slate-800 p-4 md:p-5 rounded-[2rem] shadow-xl border-4 border-slate-700 flex items-center justify-center relative overflow-hidden">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${map.width} ${map.height}`}
          className="max-w-[480px] max-h-[480px] w-full h-auto"
          style={{ display: 'block' }}
        >
          <defs>
            {/* classroom tile pattern */}
            <pattern id="tile" width="60" height="60" patternUnits="userSpaceOnUse">
              <rect width="60" height="60" fill="#FEF9C3"/>
              <rect width="60" height="60" fill="none" stroke="#E8E3A8" strokeWidth="0.8"/>
            </pattern>
            {/* subtle radial glow at goal */}
            <radialGradient id="goalGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#fde047" stopOpacity="0.7"/>
              <stop offset="100%" stopColor="#fde047" stopOpacity="0"/>
            </radialGradient>
          </defs>

          {/* Floor */}
          <rect width={map.width} height={map.height} fill="url(#tile)" rx="10"/>

          {/* Outer border */}
          <rect
            x="6" y="6"
            width={map.width - 12} height={map.height - 12}
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
            rx="6"
          />

          {/* Interior walls */}
          {map.walls.map((wall, i) => (
            <g key={i}>
              {/* shadow */}
              <rect x={wall.x + 3} y={wall.y + 3} width={wall.w} height={wall.h}
                    fill="rgba(0,0,0,0.25)" rx="4"/>
              {/* wall body */}
              <rect x={wall.x} y={wall.y} width={wall.w} height={wall.h}
                    fill="#334155" rx="4"/>
              {/* highlight stripe */}
              <rect x={wall.x} y={wall.y} width={wall.w} height={Math.min(4, wall.h)}
                    fill="rgba(255,255,255,0.12)" rx="4"/>
            </g>
          ))}

          {/* Start area */}
          <circle cx={map.start.x} cy={map.start.y} r={28} fill="#dcfce7" stroke="#22c55e" strokeWidth="2.5"/>
          <text
            x={map.start.x} y={map.start.y + 5}
            textAnchor="middle" fontSize="13" fontWeight="bold" fill="#15803d"
          >
            출발
          </text>

          {/* Goal glow */}
          <circle cx={map.goal.x} cy={map.goal.y} r={map.goal.radius + 10}
                  fill="url(#goalGlow)"/>

          {/* Goal zone */}
          <circle
            cx={map.goal.x} cy={map.goal.y} r={map.goal.radius}
            fill="#fef08a" stroke="#ca8a04" strokeWidth="2.5" strokeDasharray="7 3"
          />

          {/* Goal flag */}
          <g transform={`translate(${map.goal.x}, ${map.goal.y - 4})`}>
            <line x1="0" y1="-22" x2="0" y2="18" stroke="#334155" strokeWidth="3" strokeLinecap="round"/>
            <polygon points="0,-22 22,-12 0,-2" fill="#22c55e"/>
            <text x="11" y="-11" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
              GOAL
            </text>
          </g>

          {/* Hamster — drawn facing right (angleDeg=0) */}
          <g
            style={{
              transform: `translate(${hamster.x}px, ${hamster.y}px) rotate(${hamster.angleDeg}deg)`,
              transformOrigin: '0px 0px',
              transition: isAnimating ? 'transform 0.48s cubic-bezier(0.4,0,0.2,1)' : 'none',
            }}
          >
            {/* drop shadow */}
            <ellipse cx="3" cy="5" rx="18" ry="12" fill="rgba(0,0,0,0.18)"/>
            {/* body */}
            <ellipse rx="16" ry="13" fill="#F4A261"/>
            {/* ears (perpendicular to facing = top of body) */}
            <ellipse cx="-9" cy="-13" rx="5" ry="6" fill="#F4A261"/>
            <ellipse cx="9"  cy="-13" rx="5" ry="6" fill="#F4A261"/>
            <ellipse cx="-9" cy="-13" rx="3" ry="4" fill="#E07070"/>
            <ellipse cx="9"  cy="-13" rx="3" ry="4" fill="#E07070"/>
            {/* eyes */}
            <circle cx="-5" cy="-2" r="3.2" fill="#1e293b"/>
            <circle cx="5"  cy="-2" r="3.2" fill="#1e293b"/>
            <circle cx="-4" cy="-3" r="1.1" fill="white"/>
            <circle cx="6"  cy="-3" r="1.1" fill="white"/>
            {/* cheek / nose area */}
            <ellipse cx="13" cy="0" rx="4" ry="3" fill="#E07070"/>
            {/* direction arrow – points right (facing direction) */}
            <polygon points="16,-4 25,0 16,4" fill="#ef4444" opacity="0.9"/>
          </g>
        </svg>
      </div>

      {/* Map name badge */}
      <div className="mt-3 px-4 py-1 bg-slate-700 rounded-full text-slate-300 text-sm font-sans">
        🗺️ {map.label}
      </div>
    </div>
  );
}
