import React, { useMemo } from 'react';

const COURSES = [
  { name: "📍 직선 코스", path1: "M 50 190 L 450 190", start: [50, 190], end: [450, 190] },
  { name: "📍 완만한 곡선 코스", path1: "M 50 300 Q 250 50 450 300", start: [50, 300], end: [450, 300] },
  { name: "📍 급커브 코스", path1: "M 50 190 L 200 190 L 200 80 L 350 80 L 350 300 L 450 300", start: [50, 190], end: [450, 300] },
  { name: "📍 S자 코스", path1: "M 50 300 C 150 300 150 100 250 190 C 350 280 350 80 450 80", start: [50, 300], end: [450, 80] },
  { name: "📍 교차로 코스", path1: "M 50 190 L 450 190", path2: "M 250 50 L 250 330", start: [50, 190], end: [450, 190] }
];

export function LineTracing({ missionKey }: { missionKey: number }) {
  const course = useMemo(() => {
    return COURSES[Math.floor(Math.random() * COURSES.length)];
  }, [missionKey]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="bg-white rounded-[2rem] shadow-sm border-[3px] border-amber-100 overflow-hidden relative w-full flex items-center justify-center p-4 print:border-slate-300">
         <div className="absolute top-6 left-6 font-jua text-2xl text-slate-700 bg-amber-50/80 px-4 py-2 rounded-xl shadow-sm z-10 border border-amber-200">
           {course.name}
         </div>
         <svg 
           width="100%" 
           height="100%" 
           viewBox="0 0 500 380" 
           className="max-w-[500px]"
         >
           <rect width="500" height="380" fill="#FAFAFA" rx="16" />
           
           {/* Tracks */}
           <path d={course.path1} fill="none" stroke="#1E293B" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
           {course.path2 && (
             <path d={course.path2} fill="none" stroke="#1E293B" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
           )}

           {/* Start Marker */}
           <g transform={`translate(${course.start[0]}, ${course.start[1]})`}>
             <circle r="22" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="4" />
             <polygon points="-4,-8 8,0 -4,8" fill="#FFFFFF" />
           </g>

           {/* End Flag Marker */}
           <g transform={`translate(${course.end[0]}, ${course.end[1]})`}>
             <circle r="22" fill="#FFFFFF" stroke="#2ECC71" strokeWidth="4" />
             <g transform="translate(0, 2)">
               <line x1="-4" y1="-10" x2="-4" y2="10" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
               <rect x="-4" y="-10" width="14" height="9" fill="#2ECC71" rx="1" />
               <rect x="-4" y="-10" width="7" height="4.5" fill="#27AE60" rx="0.5" />
               <rect x="3" y="-5.5" width="7" height="4.5" fill="#27AE60" rx="0.5" />
             </g>
           </g>
         </svg>
      </div>
    </div>
  );
}
