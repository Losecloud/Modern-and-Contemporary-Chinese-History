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

/**
 * 卡片宽度自适应：正文越精炼，卡片越窄（只改宽度，不改任何文本内容）
 * <100 字 → 200px；<180 字 → 300px；其余 → 标准 380px
 */
export function computeCardWidth(event: HistoryEvent): number {
  const textLen =
    (event.items?.reduce((n, it) => n + (it.text?.length ?? 0), 0) ?? 0) +
    (event.examSummary?.length ?? 0) +
    (event.subtitle?.length ?? 0);
  if (textLen < 100) return 200;
  if (textLen < 180) return 300;
  return CARD_WIDTH;
}

// ──────────────────────────────────────────────────────────────────────────────
// 卡片宽度自定义（编辑模式拖拽结果，localStorage 持久化）
// ──────────────────────────────────────────────────────────────────────────────
const CARD_WIDTH_STORAGE_KEY = 'history_card_width_overrides_v1';

export function loadCardWidthOverrides(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CARD_WIDTH_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Record<string, number> = {};
    Object.entries(parsed).forEach(([id, w]) => {
      if (typeof w === 'number' && Number.isFinite(w)) result[id] = w;
    });
    return result;
  } catch {
    return {};
  }
}

export function saveCardWidthOverrides(overrides: Record<string, number>): void {
  try {
    localStorage.setItem(CARD_WIDTH_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // 存储不可用（如隐私模式）时静默忽略，仅本次会话生效
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 卡片水平位置自定义（编辑模式左右拖拽结果，localStorage 持久化）
// 键为 groupId（同年合并组共用同一卡片位），值为卡片左边界画布 X 坐标
// ──────────────────────────────────────────────────────────────────────────────
const CARD_X_STORAGE_KEY = 'history_card_x_overrides_v1';

export function loadCardXOverrides(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CARD_X_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Record<string, number> = {};
    Object.entries(parsed).forEach(([id, x]) => {
      if (typeof x === 'number' && Number.isFinite(x)) result[id] = x;
    });
    return result;
  } catch {
    return {};
  }
}

export function saveCardXOverrides(overrides: Record<string, number>): void {
  try {
    localStorage.setItem(CARD_X_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // 存储不可用（如隐私模式）时静默忽略，仅本次会话生效
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 分段压缩时间轴的核心参数（单点定义，改动这里即可全局生效）
// ──────────────────────────────────────────────────────────────────────────────

/** 时间轴最左端留出的内边距（px） */
const LEFT_MARGIN = 80;
/** 1840 年后主线的基准比例：每年 = BASE_PX_PER_YEAR px（> CARD_WIDTH 可让相邻年卡片自然分开） */
const BASE_PX_PER_YEAR = 180;
/** 分段配置：[yearStart, yearEnd, 压缩系数]。压缩系数 1.0 = 严格等比例，< 1 表示稀疏期压缩，> 1 表示密集期放大 */
const COMPRESS_SEGMENTS: ReadonlyArray<{ yearStart: number; yearEnd: number; scale: number }> = [
  // 孤立点压缩：1516（莫尔《乌托邦》）是该时期唯一的起点事件，与 1755 之间空白过大，
  // 单独压成约 1 个刻度格的间距（≈420px），避免整段马克思主义时间轴被拉出十屏空白
  { yearStart: 1516, yearEnd: 1750, scale: 0.01 },
  { yearStart: 1750, yearEnd: 1840, scale: 0.25 }, // 稀疏期：空想社会主义与工人运动集中段，压缩为主线的 1/4
  { yearStart: 1840, yearEnd: 1919, scale: 1.0 },  // 早期救亡：常规等比例
  { yearStart: 1919, yearEnd: 1950, scale: 1.5 },  // 新民主主义密集期：1.5× = 270px/年，消除相邻年卡片重叠
  { yearStart: 1950, yearEnd: 2026, scale: 1.0 },  // 主线后续：常规等比例
];

/**
 * 单一坐标变换函数：年份 → 画布 X 坐标
 * 所有组件（刻度、时期边界、事件卡片、引导线）都从这一处派生。
 */
export function yearToX(year: number): number {
  let x = LEFT_MARGIN;
  for (const seg of COMPRESS_SEGMENTS) {
    if (year <= seg.yearStart) break;
    // 当前分段内的区间长度：从分段起点到 min(目标年, 分段终点)
    const segEndClamped = Math.min(year, seg.yearEnd);
    const span = segEndClamped - seg.yearStart;
    if (span > 0) {
      x += span * seg.scale * BASE_PX_PER_YEAR;
    }
    if (year <= seg.yearEnd) break;
  }
  return Math.round(x);
}

/**
 * 反查某个画布 X 坐标所在分段的时间比例系数（1.0 = 常规，1.5 = 密集期放大）
 * 用于在全局俯瞰图标题旁实时标注当前视图的缩放系数。
 */
export function getScaleAtX(x: number): number {
  for (const seg of COMPRESS_SEGMENTS) {
    const startX = yearToX(seg.yearStart);
    const endX = yearToX(seg.yearEnd);
    if (x >= startX && x < endX) return seg.scale;
  }
  return 1;
}

// ──────────────────────────────────────────────────────────────────────────────
// 时期边界（从分段函数派生坐标，其余展示属性保留原值）
// ──────────────────────────────────────────────────────────────────────────────

interface PeriodMeta {
  id: PeriodId;
  startYear: number;
  endYear: number;
  title: string;
  shortTitle: string;
  yearRange: string;
  theme: string;
  accentColor: string;
}

const PERIOD_META: PeriodMeta[] = [
  {
    id: 0, startYear: 1516, endYear: 1840,
    title: '序、马克思主义的创立背景与思想渊源',
    shortTitle: '马克思主义',
    yearRange: '1516 — 1840',
    theme: '空想社会主义演进 · 欧洲三大工人运动 · 三大理论来源 · 19世纪三大自然科学发现',
    accentColor: '#475569',
  },
  {
    id: 1, startYear: 1840, endYear: 1919,
    title: '一、反对外国侵略与早期救亡图存探索',
    shortTitle: '早期救亡探索',
    yearRange: '1840 — 1919',
    theme: '两半社会形成 · 太平天国 · 洋务运动 · 戊戌变法 · 辛亥革命',
    accentColor: '#B91C1C',
  },
  {
    id: 2, startYear: 1919, endYear: 1927,
    title: '二、五四运动与中国共产党创建、大革命时期',
    shortTitle: '五四与大革命',
    yearRange: '1919 — 1927',
    theme: '新民主主义开端 · 开天辟地 · 第一次国共合作 · 北伐胜利与背叛',
    accentColor: '#DC2626',
  },
  {
    id: 3, startYear: 1927, endYear: 1937,
    title: '三、土地革命战争与中国革命新道路',
    shortTitle: '土地革命时期',
    yearRange: '1927 — 1937',
    theme: '武装起义 · 支部建在连上 · 农村包围城市 · 遵义生死转折',
    accentColor: '#D97706',
  },
  {
    id: 4, startYear: 1937, endYear: 1945,
    title: '四、全民族抗日战争的中流砥柱',
    shortTitle: '抗日战争时期',
    yearRange: '1931/1937 — 1945',
    theme: '全面抗战 · 《论持久战》 · 新民主主义成熟 · 中共七大',
    accentColor: '#059669',
  },
  {
    id: 5, startYear: 1945, endYear: 1949,
    title: '五、人民解放战争与筹建新中国',
    shortTitle: '解放战争时期',
    yearRange: '1945 — 1949',
    theme: '土地改革 · 三大战役 · 两个务必 · 协商建国',
    accentColor: '#7C3AED',
  },
  {
    id: 6, startYear: 1949, endYear: 1978,
    title: '六、社会主义过渡与建设道路初步探索',
    shortTitle: '过渡与初步探索',
    yearRange: '1949 — 1978',
    theme: '恢复经济 · 一化三改 · 《论十大关系》 · 中共八大主要矛盾',
    accentColor: '#2563EB',
  },
  {
    id: 7, startYear: 1978, endYear: 2026,
    title: '七、改革开放与中国特色社会主义新时代',
    shortTitle: '改革开放与新时代',
    yearRange: '1978 — 2026',
    theme: '伟大历史转折 · 邓小平理论成熟 · 十八大新时代 · 中国式现代化',
    accentColor: '#0D9488',
  },
];

export const PERIOD_BOUNDARIES: PeriodBoundary[] = PERIOD_META.map((m) => {
  const startX = yearToX(m.startYear);
  const endX = yearToX(m.endYear);
  return {
    ...m,
    startX,
    endX,
    width: endX - startX,
  };
});

// ──────────────────────────────────────────────────────────────────────────────
// 年份刻度（保留原有关键年份集合，坐标统一从 yearToX 重算）
// ──────────────────────────────────────────────────────────────────────────────

// 原始关键年份集合（与原代码保持一致，便于历史对照；重复年份会在生成时去重）
const RAW_KEY_YEARS: Array<{ year: number; isKeyYear: boolean }> = [
  // Period 0 (1516 - 1840)
  { year: 1516, isKeyYear: true },
  { year: 1755, isKeyYear: true },
  { year: 1810, isKeyYear: true },
  { year: 1830, isKeyYear: true },
  { year: 1831, isKeyYear: true },
  { year: 1836, isKeyYear: true },
  { year: 1838, isKeyYear: true },

  // Period 1 (1840 - 1919)
  { year: 1840, isKeyYear: true },
  { year: 1841, isKeyYear: true },
  { year: 1842, isKeyYear: false },
  { year: 1844, isKeyYear: false },
  { year: 1848, isKeyYear: true },
  { year: 1851, isKeyYear: true },
  { year: 1853, isKeyYear: false },
  { year: 1856, isKeyYear: false },
  { year: 1861, isKeyYear: true },
  { year: 1864, isKeyYear: false },
  { year: 1867, isKeyYear: true },
  { year: 1871, isKeyYear: true },
  { year: 1875, isKeyYear: false },
  { year: 1878, isKeyYear: false },
  { year: 1894, isKeyYear: true },
  { year: 1895, isKeyYear: true },
  { year: 1898, isKeyYear: true },
  { year: 1901, isKeyYear: true },
  { year: 1903, isKeyYear: false },
  { year: 1905, isKeyYear: true },
  { year: 1911, isKeyYear: true },
  { year: 1912, isKeyYear: true },
  { year: 1913, isKeyYear: true },
  { year: 1915, isKeyYear: true },
  { year: 1917, isKeyYear: true },

  // Period 2 (1919 - 1927)
  { year: 1919, isKeyYear: true },
  { year: 1920, isKeyYear: true },
  { year: 1921, isKeyYear: true },
  { year: 1922, isKeyYear: true },
  { year: 1923, isKeyYear: true },
  { year: 1924, isKeyYear: true },
  { year: 1925, isKeyYear: true },
  { year: 1926, isKeyYear: false },
  { year: 1927, isKeyYear: true },

  // Period 3 (1927 - 1937)
  { year: 1928, isKeyYear: true },
  { year: 1929, isKeyYear: true },
  { year: 1930, isKeyYear: false },
  { year: 1931, isKeyYear: true },
  { year: 1934, isKeyYear: false },
  { year: 1935, isKeyYear: true },
  { year: 1936, isKeyYear: true },
  { year: 1937, isKeyYear: true },

  // Period 4 (1937 - 1945) — 1937 已在上段，保留一次
  { year: 1938, isKeyYear: true },
  { year: 1939, isKeyYear: true },
  { year: 1940, isKeyYear: false },
  { year: 1941, isKeyYear: true },
  { year: 1942, isKeyYear: false },
  { year: 1945, isKeyYear: true },

  // Period 5 (1945 - 1949)
  { year: 1946, isKeyYear: true },
  { year: 1947, isKeyYear: true },
  { year: 1948, isKeyYear: true },
  { year: 1949, isKeyYear: true },

  // Period 6 (1949 - 1978)
  { year: 1950, isKeyYear: true },
  { year: 1953, isKeyYear: true },
  { year: 1954, isKeyYear: true },
  { year: 1956, isKeyYear: true },
  { year: 1957, isKeyYear: true },
  { year: 1961, isKeyYear: true },
  { year: 1962, isKeyYear: true },
  { year: 1976, isKeyYear: false },

  // Period 7 (1978 - 2026)
  { year: 1978, isKeyYear: true },
  { year: 1979, isKeyYear: true },
  { year: 1981, isKeyYear: true },
  { year: 1982, isKeyYear: true },
  { year: 1984, isKeyYear: true },
  { year: 1987, isKeyYear: true },
  { year: 1992, isKeyYear: true },
  { year: 1997, isKeyYear: true },
  { year: 2002, isKeyYear: true },
  { year: 2007, isKeyYear: false },
  { year: 2012, isKeyYear: true },
  { year: 2013, isKeyYear: true },
  { year: 2017, isKeyYear: true },
  { year: 2021, isKeyYear: true },
  { year: 2022, isKeyYear: true },
  { year: 2024, isKeyYear: true },
  { year: 2025, isKeyYear: true },
  { year: 2026, isKeyYear: true },
];

// 用 yearToX 重算所有刻度坐标，按 (year, x) 去重（Period 3 和 Period 4 边界的 1937 等）
const tickDedup = new Set<string>();
export const YEAR_TICKS: YearTick[] = RAW_KEY_YEARS
  .map(({ year, isKeyYear }) => ({ year, x: yearToX(year), isKeyYear }))
  .filter((t) => {
    const key = `${t.year}-${t.x}`;
    if (tickDedup.has(key)) return false;
    tickDedup.add(key);
    return true;
  })
  .sort((a, b) => a.x - b.x);

// ──────────────────────────────────────────────────────────────────────────────
// 画布总宽 = 最后一个时期的 endX + 右侧余量
// ──────────────────────────────────────────────────────────────────────────────

const RIGHT_PADDING = 100;
export const TOTAL_CANVAS_WIDTH = PERIOD_BOUNDARIES[PERIOD_BOUNDARIES.length - 1].endX + RIGHT_PADDING;

// ──────────────────────────────────────────────────────────────────────────────
// 日期解析与坐标转换
// ──────────────────────────────────────────────────────────────────────────────

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
 * Unified date → x conversion. Ignores periodId since yearToX already handles
 * compression segments globally. Kept for backward compatibility with callers
 * that pass periodId.
 */
export function dateToX(dateVal: number, _periodId?: number): number {
  return yearToX(dateVal);
}

// ──────────────────────────────────────────────────────────────────────────────
// 画布布局计算（unchanged logic — only dateToX behavior changed above）
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 同年合并组（sheet 选项卡）：同轨 + 同年 的多张卡片合并到同一个卡片位。
 * 组内成员共享同一 x/y/width，因此组内不再产生位移与延伸线；
 * 组间仍沿用「30% 重叠触发位移 / 位移后保留 25% 重叠」的规则。
 */
export interface EventGroup {
  groupId: string;
  rowKey: string;
  track: TrackId;
  memberIds: string[];
  /** 默认展示成员：优先核心枢纽（isMilestone），否则取时间最早的一张 */
  primaryId: string;
  y: number;
  x: number;
  exactX: number;
  width: number;
  dateLabel: string;
  isShifted: boolean;
}

export function computeCanvasLayout(events: HistoryEvent[]): {
  coords: Record<string, EventLayoutCoord>;
  leaderLines: LeaderLineInfo[];
  groups: EventGroup[];
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
    width: number;
    sortVal: number;
    yearKey: number;
    isMilestone: boolean;
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
      width: computeCardWidth(ev),
      sortVal: parsed.dateVal,
      yearKey: Math.floor(parsed.dateVal),
      isMilestone: Boolean(ev.isMilestone),
    });
  });

  const coords: Record<string, EventLayoutCoord> = {};
  const leaderLines: LeaderLineInfo[] = [];
  const groups: EventGroup[] = [];

  for (const [rowKey, list] of Object.entries(rows)) {
    // 1) 先按年份聚合成组（组内按日期先后排序，核心枢纽优先作为默认展示）
    const bucket = new Map<number, typeof list>();
    for (const item of list) {
      const arr = bucket.get(item.yearKey) ?? [];
      arr.push(item);
      bucket.set(item.yearKey, arr);
    }
    const groupSeeds = [...bucket.entries()]
      .map(([yearKey, membersOfYear]) => {
        const sorted = [...membersOfYear].sort((a, b) => a.sortVal - b.sortVal);
        const primary = sorted.find((m) => m.isMilestone) ?? sorted[0];
        return { yearKey, members: sorted, primary, exactX: sorted[0].exactX };
      })
      .sort((a, b) => a.exactX - b.exactX);

    // 2) 组与组之间再做重叠位移
    let lastPlacedX = -99999;
    let lastWidth = CARD_WIDTH;
    let clusterTier = 0;

    groupSeeds.forEach((seed) => {
      const groupWidth = Math.max(...seed.members.map((m) => m.width));
      let placedX = seed.exactX;
      let isShifted = false;

      // 以「较窄卡」为基准控制重叠：30% 重叠触发位移，位移后仅保留 25% 重叠
      // 等宽 380px 时等价于原 266px 阈值 / 285px 步长，保持既有观感
      const narrowWidth = Math.min(lastWidth, groupWidth);
      const shiftThreshold = lastWidth - narrowWidth * 0.3;
      const shiftStep = lastWidth - narrowWidth * 0.25;
      if (placedX < lastPlacedX + shiftThreshold) {
        placedX = lastPlacedX + shiftStep;
        isShifted = true;
        clusterTier++;
      } else {
        clusterTier = 0;
      }

      lastPlacedX = placedX;
      lastWidth = groupWidth;

      const groupId = `grp_${rowKey}_${seed.yearKey}`;
      groups.push({
        groupId,
        rowKey,
        track: seed.primary.track,
        memberIds: seed.members.map((m) => m.id),
        primaryId: seed.primary.id,
        y: seed.primary.y,
        x: placedX,
        exactX: seed.exactX,
        width: groupWidth,
        dateLabel: String(seed.yearKey),
        isShifted,
      });

      seed.members.forEach((m) => {
        coords[m.id] = {
          x: placedX,
          y: m.y,
          exactX: m.exactX,
          isShifted,
          dateLabel: m.dateLabel,
          shiftAmount: placedX - m.exactX,
          width: groupWidth,
        };
      });

      if (isShifted) {
        leaderLines.push({
          id: seed.primary.id,
          title: seed.primary.title,
          track: seed.primary.track,
          y: seed.primary.y,
          exactX: seed.exactX,
          placedX,
          shiftAmount: placedX - seed.exactX,
          dateLabel: String(seed.yearKey),
          tier: clusterTier % 3,
        });
      }
    });
  }

  return { coords, leaderLines, groups };
}

// Precompute coordinates and leader lines for default events
const initialLayout = computeCanvasLayout(HISTORY_EVENTS);
export const EVENT_LAYOUT_COORDS: Record<string, EventLayoutCoord> = initialLayout.coords;
export const EVENT_LEADER_LINES: LeaderLineInfo[] = initialLayout.leaderLines;
/** 同年合并组列表（sheet 选项卡的渲染单位） */
export const EVENT_GROUPS: EventGroup[] = initialLayout.groups;
/** eventId → groupId 反查表（搜索定位、导图跳转时用于切换选项卡） */
export const EVENT_GROUP_OF: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const g of initialLayout.groups) {
    for (const id of g.memberIds) map[id] = g.groupId;
  }
  return map;
})();
