import React, { useMemo } from 'react';

type Direction = 'top' | 'right' | 'bottom' | 'left';
interface Cell {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
  visited: boolean;
}

export function MazeGenerator({ difficulty, missionKey }: { difficulty: 'easy' | 'medium' | 'hard', missionKey: number }) {
  const size = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;
  const cellSize = difficulty === 'easy' ? 60 : difficulty === 'medium' ? 52 : 44;
  const padding = 20;
  const svgSize = size * cellSize + padding * 2;

  const maze = useMemo(() => {
    // We recreate the array safely with useMemo so it regenerates on missionKey change.
    const grid: Cell[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({
        top: true, right: true, bottom: true, left: true, visited: false
      }))
    );

    const stack: [number, number][] = [[0, 0]];
    grid[0][0].visited = true;

    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      const neighbors: { r: number, c: number, dir: Direction, opp: Direction }[] = [];

      if (r > 0 && !grid[r - 1][c].visited) neighbors.push({ r: r - 1, c, dir: 'top', opp: 'bottom' });
      if (r < size - 1 && !grid[r + 1][c].visited) neighbors.push({ r: r + 1, c, dir: 'bottom', opp: 'top' });
      if (c > 0 && !grid[r][c - 1].visited) neighbors.push({ r, c: c - 1, dir: 'left', opp: 'right' });
      if (c < size - 1 && !grid[r][c + 1].visited) neighbors.push({ r, c: c + 1, dir: 'right', opp: 'left' });

      if (neighbors.length > 0) {
        stack.push([r, c]); // push current back to backtrack later
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        grid[r][c][next.dir] = false;
        grid[next.r][next.c][next.opp] = false;
        grid[next.r][next.c].visited = true;
        stack.push([next.r, next.c]);
      }
    }
    return grid;
  }, [size, missionKey]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border-[3px] border-amber-100 flex items-center justify-center print:border-slate-300">
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${svgSize} ${svgSize}`} 
          className="max-w-[400px] max-h-[400px]"
          style={{ overflow: 'visible' }}
        >
          <g transform={`translate(${padding}, ${padding})`}>
            {/* Background Base */}
            <rect width={size * cellSize} height={size * cellSize} fill="#FAFAFA" rx="4" />
            
            {/* Grid Cells (Optional checkerboard effect for cuteness, skipped to keep it clean) */}
            
            {/* Walls */}
            {maze.map((row, r) =>
              row.map((cell, c) => {
                const x = c * cellSize;
                const y = r * cellSize;
                return (
                  <g key={`${r}-${c}`}>
                    {cell.top && <line x1={x} y1={y} x2={x + cellSize} y2={y} stroke="#334155" strokeWidth="4" strokeLinecap="round" />}
                    {cell.right && <line x1={x + cellSize} y1={y} x2={x + cellSize} y2={y + cellSize} stroke="#334155" strokeWidth="4" strokeLinecap="round" />}
                    {cell.bottom && <line x1={x} y1={y + cellSize} x2={x + cellSize} y2={y + cellSize} stroke="#334155" strokeWidth="4" strokeLinecap="round" />}
                    {cell.left && <line x1={x} y1={y} x2={x} y2={y + cellSize} stroke="#334155" strokeWidth="4" strokeLinecap="round" />}
                  </g>
                );
              })
            )}

            {/* Hamster at 0,0 */}
            <g transform={`translate(${cellSize / 2}, ${cellSize / 2})`}>
              <ellipse rx="14" ry="12" fill="#F4A261" />
              <ellipse cx="-8" cy="-11" rx="5" ry="6" fill="#F4A261" />
              <ellipse cx="8" cy="-11" rx="5" ry="6" fill="#F4A261" />
              <ellipse cx="-8" cy="-11" rx="3" ry="4" fill="#E07070" />
              <ellipse cx="8" cy="-11" rx="3" ry="4" fill="#E07070" />
              <circle cx="-5" cy="-3" r="2.5" fill="#333" />
              <circle cx="5" cy="-3" r="2.5" fill="#333" />
              <ellipse cy="2" rx="3" ry="2" fill="#E07070" />
            </g>

            {/* Flag at size-1, size-1 */}
            <g transform={`translate(${(size - 1) * cellSize + cellSize / 2}, ${(size - 1) * cellSize + cellSize / 2})`}>
              <line x1="0" y1="-14" x2="0" y2="14" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="0" y="-14" width="16" height="10" fill="#2ECC71" rx="1" />
              <rect x="0" y="-14" width="8" height="5" fill="#27AE60" rx="0.5" />
              <rect x="8" y="-9" width="8" height="5" fill="#27AE60" rx="0.5" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
