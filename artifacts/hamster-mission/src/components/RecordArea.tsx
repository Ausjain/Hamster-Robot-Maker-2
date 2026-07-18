import React from 'react';

const SECTIONS = [
  { icon: '⚙️', title: '설정값', color: 'bg-slate-100', text: 'text-slate-700' },
  { icon: '▶️', title: '실행 결과', color: 'bg-blue-50', text: 'text-blue-800' },
  { icon: '✏️', title: '수정한 점', color: 'bg-amber-50', text: 'text-amber-800' }
];

export function RecordArea() {
  return (
    <div className="border-[3px] border-slate-300 rounded-3xl overflow-hidden flex flex-col bg-white w-full print:border-slate-300">
      {SECTIONS.map((sec, i) => (
        <div key={i} className="flex border-b-[3px] border-slate-300 last:border-b-0 min-h-[120px]">
           <div className={`w-36 md:w-44 ${sec.color} flex flex-col items-center justify-center border-r-[3px] border-slate-300 p-4`}>
              <span className="text-3xl md:text-4xl mb-2 drop-shadow-sm">{sec.icon}</span>
              <span className={`font-jua text-xl md:text-2xl ${sec.text}`}>{sec.title}</span>
           </div>
           <div className="flex-1 p-5 md:p-6 flex flex-col justify-around gap-6 bg-white">
              <div className="border-b-[2px] border-dashed border-slate-300 w-full h-8"></div>
              <div className="border-b-[2px] border-dashed border-slate-300 w-full h-8"></div>
              <div className="border-b-[2px] border-dashed border-slate-300 w-full h-8"></div>
           </div>
        </div>
      ))}
    </div>
  );
}
