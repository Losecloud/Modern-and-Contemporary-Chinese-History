const fs = require('fs');

const OFFSET = 3720;

// ==========================================
// 1. Process canvasLayout.ts
// ==========================================
let layoutCode = fs.readFileSync('src/utils/canvasLayout.ts', 'utf8');

// Update TOTAL_CANVAS_WIDTH
layoutCode = layoutCode.replace(
  /export const TOTAL_CANVAS_WIDTH = \d+;/,
  'export const TOTAL_CANVAS_WIDTH = 32200;'
);

// Update PERIOD_BOUNDARIES
const period0Boundary = `  {
    id: 0,
    title: '序、马克思主义的创立背景与思想渊源',
    shortTitle: '马克思主义',
    yearRange: '1516 — 1840',
    startX: 80,
    endX: 3780,
    width: 3700,
    theme: '空想社会主义演进 · 欧洲三大工人运动 · 三大理论来源 · 19世纪三大自然科学发现',
    accentColor: '#475569',
  },
`;

layoutCode = layoutCode.replace(
  /export const PERIOD_BOUNDARIES: PeriodBoundary\[\] = \[/,
  'export const PERIOD_BOUNDARIES: PeriodBoundary[] = [\n' + period0Boundary
);

// Offset existing period boundaries
layoutCode = layoutCode.replace(/id:\s*([1-7]),[\s\S]*?startX:\s*(\d+),[\s\S]*?endX:\s*(\d+),/g, (match, id, startX, endX) => {
  const newStart = parseInt(startX, 10) + OFFSET;
  const newEnd = parseInt(endX, 10) + OFFSET;
  return match.replace(`startX: ${startX}`, `startX: ${newStart}`).replace(`endX: ${endX}`, `endX: ${newEnd}`);
});

// Offset existing event layout coords
// Replace lines like: e_1840_opium_war: { x: 120, y: TRACK_Y_POSITIONS.armed.y },
layoutCode = layoutCode.replace(/([a-zA-Z0-9_]+):\s*\{\s*x:\s*(\d+),\s*y:\s*([a-zA-Z0-9_.]+)\s*\},/g, (match, key, x, y) => {
  const newX = parseInt(x, 10) + OFFSET;
  return `${key}: { x: ${newX}, y: ${y} },`;
});

// New Marxism & Scientific Socialism coordinates to add to EVENT_LAYOUT_COORDS
const newEventCoords = `  // === Period 0: 1516 - 1840 马克思主义的创立背景与思想渊源 ===
  m_1516_utopia: { x: 200, y: TRACK_Y_POSITIONS.works.y },
  m_1755_code_nature: { x: 750, y: TRACK_Y_POSITIONS.works.y },
  m_1800_critical_utopian: { x: 1300, y: TRACK_Y_POSITIONS.works.y },
  m_1830_three_sources: { x: 1900, y: TRACK_Y_POSITIONS.works.y },
  m_1838_three_discoveries: { x: 2500, y: TRACK_Y_POSITIONS.works.y },
  m_1831_lyon_uprisings: { x: 2950, y: TRACK_Y_POSITIONS.armed.y },
  m_1836_chartist_movement: { x: 3350, y: TRACK_Y_POSITIONS.armed.y },

  // === 1840年之后科学社会主义事件（显示在第二排、第三排，灰黑卡片） ===
  m_1843_deutsch_franz: { x: 4100, y: TRACK_Y_POSITIONS.works.y },
  m_1844_silesian_weavers: { x: 4500, y: TRACK_Y_POSITIONS.armed.y },
  m_1844_holy_family: { x: 4500, y: TRACK_Y_POSITIONS.works.y },
  m_1845_theses_feuerbach: { x: 4900, y: TRACK_Y_POSITIONS.works.y },
  m_1845_german_ideology: { x: 5300, y: TRACK_Y_POSITIONS.works.y },
  m_1847_poverty_philosophy: { x: 5500, y: TRACK_Y_POSITIONS.works.y },
  m_1848_communist_manifesto: { x: 5700, y: TRACK_Y_POSITIONS.works.y },
  m_1864_first_international: { x: 5800, y: TRACK_Y_POSITIONS.armed.y },
  m_1867_capital_vol1: { x: 6200, y: TRACK_Y_POSITIONS.works.y },
  m_1871_paris_commune: { x: 6300, y: TRACK_Y_POSITIONS.armed.y },
  m_1871_civil_war_france: { x: 6600, y: TRACK_Y_POSITIONS.works.y },
  m_1875_critique_gotha: { x: 7000, y: TRACK_Y_POSITIONS.works.y },
  m_1878_anti_duhring: { x: 7400, y: TRACK_Y_POSITIONS.works.y },
  m_1915_lenin_one_country: { x: 7950, y: TRACK_Y_POSITIONS.works.y },
  m_1917_october_revolution: { x: 8050, y: TRACK_Y_POSITIONS.armed.y },
  m_1918_war_communism: { x: 8650, y: TRACK_Y_POSITIONS.works.y },
  m_1921_new_economic_policy: { x: 9450, y: TRACK_Y_POSITIONS.works.y },
  m_1936_soviet_model: { x: 14200, y: TRACK_Y_POSITIONS.armed.y },
  m_1945_world_socialism: { x: 19600, y: TRACK_Y_POSITIONS.works.y },
`;

layoutCode = layoutCode.replace(
  /export const EVENT_LAYOUT_COORDS: Record<string, \{ x: number; y: number; width\?: number \}> = \{/,
  'export const EVENT_LAYOUT_COORDS: Record<string, { x: number; y: number; width?: number }> = {\n' + newEventCoords
);

// Offset YEAR_TICKS and add Period 0 ticks
const newYearTicks = `  // Period 0 (1516 - 1840 马克思主义创立背景)
  { year: 1516, x: 200, isKeyYear: true },
  { year: 1755, x: 750, isKeyYear: true },
  { year: 1810, x: 1300, isKeyYear: true },
  { year: 1831, x: 2950, isKeyYear: true },
  { year: 1836, x: 3350, isKeyYear: true },
  { year: 1838, x: 3600 },
`;

// Offset existing year ticks
layoutCode = layoutCode.replace(/\{\s*year:\s*(\d+),\s*x:\s*(\d+)(.*?)\},/g, (match, year, x, rest) => {
  const newX = parseInt(x, 10) + OFFSET;
  return `{ year: ${year}, x: ${newX}${rest} },`;
});

layoutCode = layoutCode.replace(
  /export const YEAR_TICKS: YearTick\[\] = \[/,
  'export const YEAR_TICKS: YearTick[] = [\n' + newYearTicks
);

fs.writeFileSync('src/utils/canvasLayout.ts', layoutCode, 'utf8');
console.log('src/utils/canvasLayout.ts updated successfully');
