import { FloorMap } from './types';

/**
 * Predefined classroom floor maps.
 * The floor is 480×480 SVG units. The hamster is ~16px radius.
 * Movement distance = (speed/100) × duration × 200 pixels.
 *
 * "hintCommands" are pre-loaded in easy mode with intentionally
 * approximate values – students must tune them.
 */
export const FLOOR_MAPS: FloorMap[] = [
  {
    // ── Map 0: ㄱ자 경로 ─────────────────────────────
    // One horizontal wall blocks going straight down from start.
    // Robot must go right past the wall gap, then turn down.
    id: 'map0',
    label: 'ㄱ자 경로',
    width: 480,
    height: 480,
    start: { x: 60, y: 100, angleDeg: 0 },   // facing right
    goal:  { x: 400, y: 380, radius: 32 },
    walls: [
      // horizontal barrier – left+center, gap on the right (x > 320)
      { x: 12, y: 230, w: 308, h: 14 },
    ],
    hintCommands: [
      { type: 'forward',   speed: 50, duration: 1.5, angle: 90 },
      { type: 'turnRight', speed: 50, duration: 1.5, angle: 90 },
      { type: 'forward',   speed: 50, duration: 1.5, angle: 90 },
    ],
  },

  {
    // ── Map 1: 가운데 섬 ──────────────────────────────
    // A central rectangular island blocks the straight path.
    // Robot must go above or below it.
    id: 'map1',
    label: '가운데 섬',
    width: 480,
    height: 480,
    start: { x: 60,  y: 240, angleDeg: 0   },  // facing right
    goal:  { x: 420, y: 240, radius: 32 },
    walls: [
      { x: 180, y: 150, w: 120, h: 180 },       // central island
    ],
    hintCommands: [
      { type: 'forward',   speed: 50, duration: 1.0, angle: 90 },
      { type: 'turnLeft',  speed: 50, duration: 1.0, angle: 90 },
      { type: 'forward',   speed: 50, duration: 1.0, angle: 90 },
      { type: 'turnRight', speed: 50, duration: 1.0, angle: 90 },
      { type: 'forward',   speed: 50, duration: 1.0, angle: 90 },
    ],
  },

  {
    // ── Map 2: 두 기둥 ────────────────────────────────
    // Two vertical pillars create a zigzag – must weave through the gap.
    id: 'map2',
    label: '두 기둥 사이',
    width: 480,
    height: 480,
    start: { x: 60,  y: 60,  angleDeg: 90  },  // facing down
    goal:  { x: 400, y: 400, radius: 32 },
    walls: [
      { x: 190, y: 12,  w: 14, h: 210 },        // left pillar (top half)
      { x: 276, y: 258, w: 14, h: 210 },         // right pillar (bottom half)
    ],
    hintCommands: [
      { type: 'forward',   speed: 50, duration: 1.5, angle: 90 },
      { type: 'turnLeft',  speed: 50, duration: 1.5, angle: 45 },
      { type: 'forward',   speed: 50, duration: 2.0, angle: 90 },
      { type: 'turnRight', speed: 50, duration: 1.5, angle: 45 },
      { type: 'forward',   speed: 50, duration: 1.5, angle: 90 },
    ],
  },

  {
    // ── Map 3: L자 코너 ───────────────────────────────
    // An L-shaped wall occupies the top-left corner.
    // Robot starts bottom-left, goal is top-right.
    id: 'map3',
    label: 'L자 코너',
    width: 480,
    height: 480,
    start: { x: 60,  y: 400, angleDeg: 270 },   // facing up
    goal:  { x: 400, y: 80,  radius: 32 },
    walls: [
      { x: 230, y: 12,  w: 14, h: 250 },         // vertical arm
      { x: 12,  y: 230, w: 218, h: 14 },          // horizontal arm
    ],
    hintCommands: [
      { type: 'forward',   speed: 50, duration: 1.0, angle: 90 },
      { type: 'turnRight', speed: 50, duration: 1.0, angle: 90 },
      { type: 'forward',   speed: 50, duration: 2.0, angle: 90 },
      { type: 'turnLeft',  speed: 50, duration: 1.0, angle: 90 },
      { type: 'forward',   speed: 50, duration: 1.5, angle: 90 },
    ],
  },
];

export function selectMap(seed: number): FloorMap {
  return FLOOR_MAPS[seed % FLOOR_MAPS.length];
}
