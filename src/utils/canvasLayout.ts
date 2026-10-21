import { TrackId, PeriodId, HistoryEvent } from '../types/history';
import { HISTORY_EVENTS } from '../data/historyData';

export interface CardLayoutPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  minHeight: number;
}

export interface PeriodBoundary {
  id: PeriodId;
  title: string;
  shortTitle: string;
  yearRange: string;
  startX: number;
  endX: number;
  width: number;
  theme: string;
  accentColor: string;
}

export interface YearTick {
  year: number;
  x: number;
  isKeyYear?: boolean;
}

export interface EventLayoutCoord {
  x: number;
  y: number;
  exactX: number;
  isShifted: boolean;
  dateLabel: string;
  shiftAmount: number;
  width?: number;
}

export interface LeaderLineInfo {
  id: string;
  title: string;
  track: TrackId;
  y: number;
  exactX: number;
  placedX: number;
  shiftAmount: number;
  dateLabel: string;
  tier: number;
}

// Fixed horizontal Y positions for the 3 tracks
// Track 3 (思想理论) height is doubled (720px) to accommodate upper 史纲 works and lower 马克思主义思想
export const TRACK_Y_POSITIONS: Record<TrackId, { y: number; label: string; height: number }> = {
  meeting: { y: 130, label: '核心会议与党内决策', height: 360 },
  armed: { y: 530, label: '革命武装、战役与斗争', height: 350 },
  works: { y: 920, label: '思想理论、经典著作与经验教训', height: 720 },
};

// Row 3 lower section Y coordinate for Marxism and Scientific Socialism ideological works
export const WORKS_MARXISM_Y = 1290;

export const CARD_WIDTH = 380;
export const CANVAS_HEIGHT = 1750;

export const PERIOD_BOUNDARIES: PeriodBoundary[] = [
  {
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
  {
    id: 1,
    title: '一、反对外国侵略与早期救亡图存探索',
    shortTitle: '早期救亡探索',
    yearRange: '1840 — 1919',
    startX: 3800,
    endX: 8200,
    width: 4400,
    theme: '两半社会形成 · 太平天国 · 洋务运动 · 戊戌变法 · 辛亥革命',
    accentColor: '#B91C1C',
  },
  {
    id: 2,
    title: '二、五四运动与中国共产党创建、大革命时期',
    shortTitle: '五四与大革命',
    yearRange: '1919 — 1927',
    startX: 8220,
    endX: 11500,
    width: 3280,
    theme: '新民主主义开端 · 开天辟地 · 第一次国共合作 · 北伐胜利与背叛',
    accentColor: '#DC2626',
  },
  {
    id: 3,
    title: '三、土地革命战争与中国革命新道路',
    shortTitle: '土地革命时期',
    yearRange: '1927 — 1937',
    startX: 11520,
    endX: 15500,
    width: 3980,
    theme: '武装起义 · 支部建在连上 · 农村包围城市 · 遵义生死转折',
    accentColor: '#D97706',
  },
  {
    id: 4,
    title: '四、全民族抗日战争的中流砥柱',
    shortTitle: '抗日战争时期',
    yearRange: '1931/1937 — 1945',
    startX: 15520,
    endX: 19100,
    width: 3580,
    theme: '全面抗战 · 《论持久战》 · 新民主主义成熟 · 中共七大',
    accentColor: '#059669',
  },
  {
    id: 5,
    title: '五、人民解放战争与筹建新中国',
    shortTitle: '解放战争时期',
    yearRange: '1945 — 1949',
    startX: 19120,
    endX: 22300,
    width: 3180,
    theme: '土地改革 · 三大战役 · 两个务必 · 协商建国',
    accentColor: '#7C3AED',
  },
  {
    id: 6,
    title: '六、社会主义过渡与建设道路初步探索',
    shortTitle: '过渡与初步探索',
    yearRange: '1949 — 1978',
    startX: 22320,
    endX: 25300,
    width: 2980,
    theme: '恢复经济 · 一化三改 · 《论十大关系》 · 中共八大主要矛盾',
    accentColor: '#2563EB',
  },
  {
    id: 7,
    title: '七、改革开放与中国特色社会主义新时代',
    shortTitle: '改革开放与新时代',
    yearRange: '1978 — 2024',
    startX: 25320,
    endX: 31920,
    width: 6600,
    theme: '伟大历史转折 · 邓小平理论成熟 · 十八大新时代 · 中国式现代化',
    accentColor: '#0D9488',
  },
];

// Discrete explicit years to display on timeline scale across 1516 - 2024
export const YEAR_TICKS: YearTick[] = [
  // Period 0 (1516 - 1840 马克思主义创立背景)
  { year: 1516, x: 200, isKeyYear: true },
  { year: 1755, x: 750, isKeyYear: true },
  { year: 1810, x: 1300, isKeyYear: true },
  { year: 1830, x: 1900, isKeyYear: true },
  { year: 1831, x: 2350, isKeyYear: true },
  { year: 1836, x: 2850, isKeyYear: true },
  { year: 1838, x: 3350, isKeyYear: true },

  // Period 1 (1840 - 1919)
  { year: 1840, x: 3840, isKeyYear: true },
  { year: 1841, x: 4270, isKeyYear: true },
  { year: 1842, x: 4470 },
  { year: 1844, x: 4670 },
  { year: 1848, x: 4900, isKeyYear: true },
  { year: 1851, x: 5070, isKeyYear: true },
  { year: 1853, x: 5270 },
  { year: 1856, x: 5400 },
  { year: 1861, x: 5520, isKeyYear: true },
  { year: 1864, x: 5670 },
  { year: 1867, x: 5720, isKeyYear: true },
  { year: 1871, x: 5800, isKeyYear: true },
  { year: 1875, x: 5860 },
  { year: 1878, x: 5900 },
  { year: 1894, x: 5970, isKeyYear: true },
  { year: 1895, x: 6170, isKeyYear: true },
  { year: 1898, x: 6420, isKeyYear: true },
  { year: 1901, x: 6820, isKeyYear: true },
  { year: 1903, x: 7020 },
  { year: 1905, x: 7270, isKeyYear: true },
  { year: 1911, x: 7670, isKeyYear: true },
  { year: 1912, x: 7820, isKeyYear: true },
  { year: 1913, x: 7970, isKeyYear: true },
  { year: 1915, x: 8100, isKeyYear: true },
  { year: 1917, x: 8170, isKeyYear: true },

  // Period 2 (1919 - 1927)
  { year: 1919, x: 8470, isKeyYear: true },
  { year: 1920, x: 8720, isKeyYear: true },
  { year: 1921, x: 9170, isKeyYear: true },
  { year: 1922, x: 9620, isKeyYear: true },
  { year: 1923, x: 10070, isKeyYear: true },
  { year: 1924, x: 10520, isKeyYear: true },
  { year: 1925, x: 10970, isKeyYear: true },
  { year: 1926, x: 11220 },
  { year: 1927, x: 11370, isKeyYear: true },

  // Period 3 (1927 - 1937)
  { year: 1927, x: 11570, isKeyYear: true },
  { year: 1928, x: 12220, isKeyYear: true },
  { year: 1929, x: 12920, isKeyYear: true },
  { year: 1930, x: 13270 },
  { year: 1931, x: 13520, isKeyYear: true },
  { year: 1934, x: 13920 },
  { year: 1935, x: 14170, isKeyYear: true },
  { year: 1936, x: 15070, isKeyYear: true },
  { year: 1937, x: 15370 },

  // Period 4 (1931/1937 - 1945)
  { year: 1937, x: 15870, isKeyYear: true },
  { year: 1938, x: 16620, isKeyYear: true },
  { year: 1939, x: 17220, isKeyYear: true },
  { year: 1940, x: 17470 },
  { year: 1941, x: 17720, isKeyYear: true },
  { year: 1942, x: 17840 },
  { year: 1945, x: 18420, isKeyYear: true },

  // Period 5 (1945 - 1949)
  { year: 1945, x: 19170, isKeyYear: true },
  { year: 1946, x: 19420, isKeyYear: true },
  { year: 1947, x: 20020, isKeyYear: true },
  { year: 1948, x: 20520, isKeyYear: true },
  { year: 1949, x: 20820, isKeyYear: true },

  // Period 6 (1949 - 1978)
  { year: 1949, x: 22370, isKeyYear: true },
  { year: 1950, x: 22820, isKeyYear: true },
  { year: 1953, x: 23270, isKeyYear: true },
  { year: 1954, x: 23520, isKeyYear: true },
  { year: 1956, x: 23720, isKeyYear: true },
  { year: 1957, x: 24620, isKeyYear: true },
  { year: 1961, x: 24870, isKeyYear: true },
  { year: 1962, x: 25070, isKeyYear: true },
  { year: 1976, x: 25170 },

  // Period 7 (1978 - 2024)
  { year: 1978, x: 25370, isKeyYear: true },
  { year: 1979, x: 25970, isKeyYear: true },
  { year: 1981, x: 26220, isKeyYear: true },
  { year: 1982, x: 26670, isKeyYear: true },
  { year: 1984, x: 27070, isKeyYear: true },
  { year: 1987, x: 27520, isKeyYear: true },
  { year: 1992, x: 27970, isKeyYear: true },
  { year: 1997, x: 28670, isKeyYear: true },
  { year: 2002, x: 29120, isKeyYear: true },
  { year: 2007, x: 29370 },
  { year: 2012, x: 29570, isKeyYear: true },
  { year: 2013, x: 29970, isKeyYear: true },
  { year: 2017, x: 30370, isKeyYear: true },
  { year: 2021, x: 30770, isKeyYear: true },
  { year: 2022, x: 31170, isKeyYear: true },
  { year: 2024, x: 31470, isKeyYear: true },
];

export const TOTAL_CANVAS_WIDTH = 32200;

/**
 * Parses event dateStr to extract precise starting date number and a clean label
 */
export function parseEventDate(dateStr: string, fallbackYear?: number): { dateVal: number; label: string } {
  if (dateStr.includes('18世纪')) return { dateVal: 1755, label: '18世纪' };
  if (dateStr.includes('19世纪初')) return { dateVal: 1810, label: '19世纪初' };
  if (dateStr.includes('19世纪30-40年代')) return { dateVal: 1830, label: '1830s' };
  if (dateStr.includes('19世纪30年代末')) return { dateVal: 1838, label: '1838' };

  let startPart = dateStr.split(/[—–~]/)[0].trim();
  if (startPart.includes(' / ')) {
    startPart = startPart.split(' / ')[0].trim();
  }

  const m = startPart.match(/(\d{4})(?:[\.年](\d{1,2}))?(?:[\.月](\d{1,2}))?/);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = m[2] ? parseInt(m[2], 10) : 1;
    const day = m[3] ? parseInt(m[3], 10) : 1;
    const dateVal = year + (month - 1) / 12 + (day - 1) / 365;
    let label = String(year);
    if (m[2]) label += '.' + m[2];
    if (m[3]) label += '.' + m[3];
    return { dateVal, label };
  }

  const y = fallbackYear || 1921;
  return { dateVal: y, label: String(Math.floor(y)) };
}

/**
 * Calculates exact timeline X coordinate from dateVal for the given period
 */
export function dateToX(dateVal: number, periodId: number): number {
  const boundary = PERIOD_BOUNDARIES.find((p) => p.id === periodId);
  if (!boundary) return 1000;
  const ticks = YEAR_TICKS.filter((t) => t.x >= boundary.startX - 50 && t.x <= boundary.endX + 50);
  if (ticks.length === 0) return boundary.startX;
  if (ticks.length === 1) return ticks[0].x;

  if (dateVal <= ticks[0].year) return ticks[0].x;
  if (dateVal >= ticks[ticks.length - 1].year) return ticks[ticks.length - 1].x;

  for (let i = 0; i < ticks.length - 1; i++) {
    const t0 = ticks[i];
    const t1 = ticks[i + 1];
    if (t0.year === t1.year) continue;
    if (dateVal >= t0.year && dateVal <= t1.year) {
      const frac = (dateVal - t0.year) / (t1.year - t0.year);
      return Math.round(t0.x + frac * (t1.x - t0.x));
    }
  }
  return ticks[ticks.length - 1].x;
}

/**
 * Systematic canvas layout computation:
 * 1. Strictly aligns card left edge to exact event date tick (exactX).
 * 2. If overlap between adjacent cards exceeds 30% (distance < 266px), offsets the minimum
 *    number of cards by 285px to maintain readability.
 * 3. Any displaced card produces an orthogonal horizontal-vertical leader line back to exactX.
 */
export function computeCanvasLayout(events: HistoryEvent[]): {
  coords: Record<string, EventLayoutCoord>;
  leaderLines: LeaderLineInfo[];
} {
  const rows: Record<string, Array<{
    id: string;
    title: string;
    dateStr: string;
    dateLabel: string;
    periodId: PeriodId;
    track: TrackId;
    y: number;
    exactX: number;
  }>> = {
    meeting: [],
    armed: [],
    works_upper: [],
    works_lower: [],
  };

  events.forEach((ev) => {
    const isMarxism = Boolean(ev.isScientificSocialism || ev.periodId === 0);
    const parsed = parseEventDate(ev.dateStr, ev.year);
    const exactX = dateToX(parsed.dateVal, ev.periodId);

    let rowKey: string = ev.track;
    let y = TRACK_Y_POSITIONS[ev.track].y;
    if (ev.track === 'works') {
      rowKey = isMarxism ? 'works_lower' : 'works_upper';
      y = isMarxism ? WORKS_MARXISM_Y : TRACK_Y_POSITIONS.works.y;
    }

    rows[rowKey].push({
      id: ev.id,
      title: ev.title,
      dateStr: ev.dateStr,
      dateLabel: parsed.label,
      periodId: ev.periodId,
      track: ev.track,
      y,
      exactX,
    });
  });

  const coords: Record<string, EventLayoutCoord> = {};
  const leaderLines: LeaderLineInfo[] = [];

  for (const [, list] of Object.entries(rows)) {
    list.sort((a, b) => a.exactX - b.exactX);
    let lastPlacedX = -99999;
    let clusterTier = 0;

    list.forEach((item) => {
      let placedX = item.exactX;
      let isShifted = false;

      // Overlap > 30% check: (lastPlacedX + 380) - placedX > 114  =>  placedX < lastPlacedX + 266
      if (placedX < lastPlacedX + 266) {
        placedX = lastPlacedX + 285;
        isShifted = true;
        clusterTier++;
      } else {
        clusterTier = 0;
      }

      lastPlacedX = placedX;

      coords[item.id] = {
        x: placedX,
        y: item.y,
        exactX: item.exactX,
        isShifted,
        dateLabel: item.dateLabel,
        shiftAmount: placedX - item.exactX,
      };

      if (isShifted) {
        leaderLines.push({
          id: item.id,
          title: item.title,
          track: item.track,
          y: item.y,
          exactX: item.exactX,
          placedX,
          shiftAmount: placedX - item.exactX,
          dateLabel: item.dateLabel,
          tier: clusterTier % 3,
        });
      }
    });
  }

  return { coords, leaderLines };
}

// Precompute coordinates and leader lines for default events
const initialLayout = computeCanvasLayout(HISTORY_EVENTS);
export const EVENT_LAYOUT_COORDS: Record<string, EventLayoutCoord> = initialLayout.coords;
export const EVENT_LEADER_LINES: LeaderLineInfo[] = initialLayout.leaderLines;
