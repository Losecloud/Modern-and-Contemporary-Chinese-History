import { TrackId, PeriodId } from '../types/history';

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

// Fixed horizontal Y positions for the 3 tracks to guarantee perfect horizontal alignment
export const TRACK_Y_POSITIONS: Record<TrackId, { y: number; label: string; height: number }> = {
  meeting: { y: 130, label: '核心会议与党内决策', height: 360 },
  armed: { y: 530, label: '革命武装、战役与斗争', height: 350 },
  works: { y: 920, label: '思想理论、经典著作与经验教训', height: 360 },
};

export const CARD_WIDTH = 380;
export const CANVAS_HEIGHT = 1380;

// Explicit layout positions mapped chronologically and track-aligned across 1840 - 2024
export const EVENT_LAYOUT_COORDS: Record<string, { x: number; y: number; width?: number }> = {
  // === Period 1: 1840 - 1919 反对外国侵略与早期救亡图存探索 (X: 80 to 4450) ===
  e_1840_opium_war: { x: 120, y: TRACK_Y_POSITIONS.armed.y },
  e_1841_sanyuanli: { x: 550, y: TRACK_Y_POSITIONS.armed.y },
  e_1841_early_thinkers: { x: 550, y: TRACK_Y_POSITIONS.works.y },
  e_1840_characteristics: { x: 950, y: TRACK_Y_POSITIONS.works.y },
  e_1851_taiping: { x: 1350, y: TRACK_Y_POSITIONS.armed.y },
  e_1853_land_tianchao: { x: 1350, y: TRACK_Y_POSITIONS.works.y },
  e_1861_westernization: { x: 1800, y: TRACK_Y_POSITIONS.meeting.y },
  e_1894_early_reform: { x: 2250, y: TRACK_Y_POSITIONS.works.y },
  e_1895_maguan: { x: 2250, y: TRACK_Y_POSITIONS.armed.y },
  e_1898_wuxu_reform: { x: 2700, y: TRACK_Y_POSITIONS.meeting.y },
  e_1901_xinchou_reforms: { x: 3100, y: TRACK_Y_POSITIONS.meeting.y },
  e_1903_revolutionary_writings: { x: 3100, y: TRACK_Y_POSITIONS.works.y },
  e_1905_tongmenghui: { x: 3550, y: TRACK_Y_POSITIONS.meeting.y },
  e_1911_xinhai_revolution: { x: 3950, y: TRACK_Y_POSITIONS.armed.y },
  e_1912_provisional_gov: { x: 4000, y: TRACK_Y_POSITIONS.meeting.y },
  e_1913_republic_struggle: { x: 4000, y: TRACK_Y_POSITIONS.works.y },

  // === Period 2: 1919 - 1927 五四运动与大革命时期 (X: 4500 to 7750) ===
  e_1915_new_culture: { x: 4550, y: TRACK_Y_POSITIONS.works.y },
  e_1919_may4th: { x: 4750, y: TRACK_Y_POSITIONS.armed.y },
  p1_early_org: { x: 5000, y: TRACK_Y_POSITIONS.meeting.y },
  p1_cpc_1st: { x: 5450, y: TRACK_Y_POSITIONS.meeting.y },
  p1_worker_strikes: { x: 5750, y: TRACK_Y_POSITIONS.armed.y },
  p1_cpc_2nd: { x: 5900, y: TRACK_Y_POSITIONS.meeting.y },
  p1_cpc_3rd: { x: 6350, y: TRACK_Y_POSITIONS.meeting.y },
  p1_kmt_1st: { x: 6800, y: TRACK_Y_POSITIONS.meeting.y },
  e_1924_huangpu: { x: 6950, y: TRACK_Y_POSITIONS.armed.y },
  p1_cpc_4th: { x: 7250, y: TRACK_Y_POSITIONS.meeting.y },
  p1_may30th: { x: 6600, y: TRACK_Y_POSITIONS.armed.y },
  p1_mao_works_early: { x: 6800, y: TRACK_Y_POSITIONS.works.y },
  p1_north_expedition: { x: 7100, y: TRACK_Y_POSITIONS.armed.y },
  e_1927_great_rev_end: { x: 7350, y: TRACK_Y_POSITIONS.works.y },

  // === Period 3: 1927 - 1937 土地革命战争时期 (X: 7800 to 11750) ===
  p2_nanchang_uprising: { x: 7850, y: TRACK_Y_POSITIONS.armed.y },
  p2_aug7_meeting: { x: 8050, y: TRACK_Y_POSITIONS.meeting.y },
  p2_autumn_harvest: { x: 8300, y: TRACK_Y_POSITIONS.armed.y },
  p2_sanwan_reorg: { x: 8750, y: TRACK_Y_POSITIONS.armed.y },
  p2_jinggang_established: { x: 9200, y: TRACK_Y_POSITIONS.armed.y },
  p2_cpc_6th: { x: 8500, y: TRACK_Y_POSITIONS.meeting.y },
  p2_land_revolution_laws: { x: 8950, y: TRACK_Y_POSITIONS.works.y },
  p2_mao_works_road: { x: 9400, y: TRACK_Y_POSITIONS.works.y },
  p2_gutian_meeting: { x: 9200, y: TRACK_Y_POSITIONS.meeting.y },
  p2_soviet_republic: { x: 9800, y: TRACK_Y_POSITIONS.armed.y },
  e_1931_left_deviations: { x: 10100, y: TRACK_Y_POSITIONS.works.y },
  p2_zunyi_meeting: { x: 10450, y: TRACK_Y_POSITIONS.meeting.y },
  p2_wayaobao_meeting: { x: 10900, y: TRACK_Y_POSITIONS.meeting.y },
  e_1935_long_march_vict: { x: 10700, y: TRACK_Y_POSITIONS.armed.y },
  e_1936_xian_incident: { x: 11350, y: TRACK_Y_POSITIONS.armed.y },

  // === Period 4: 1931/1937 - 1945 全民族抗日战争时期 (X: 11800 to 15350) ===
  e_1931_sep18_incident: { x: 11850, y: TRACK_Y_POSITIONS.armed.y },
  p3_kmt_plenum_3rd: { x: 12150, y: TRACK_Y_POSITIONS.meeting.y },
  e_1937_lugouqiao_war: { x: 12450, y: TRACK_Y_POSITIONS.armed.y },
  e_1937_philosophical_works: { x: 12450, y: TRACK_Y_POSITIONS.works.y },
  p3_luochuan_meeting: { x: 12600, y: TRACK_Y_POSITIONS.meeting.y },
  p3_protracted_war: { x: 12900, y: TRACK_Y_POSITIONS.works.y },
  p3_sixth_plenum_6th: { x: 13150, y: TRACK_Y_POSITIONS.meeting.y },
  p3_new_democracy_works: { x: 13500, y: TRACK_Y_POSITIONS.works.y },
  e_1940_hundred_regiments: { x: 13700, y: TRACK_Y_POSITIONS.armed.y },
  p3_rectification: { x: 14000, y: TRACK_Y_POSITIONS.works.y },
  p3_seventh_plenum_6th: { x: 14250, y: TRACK_Y_POSITIONS.meeting.y },
  p3_cpc_7th: { x: 14700, y: TRACK_Y_POSITIONS.meeting.y },
  e_1945_victory_anti_japanese: { x: 14950, y: TRACK_Y_POSITIONS.armed.y },

  // === Period 5: 1945 - 1949 解放战争时期 (X: 15400 to 18550) ===
  e_1945_chongqing_talks: { x: 15450, y: TRACK_Y_POSITIONS.meeting.y },
  p4_may4th_directive: { x: 15700, y: TRACK_Y_POSITIONS.works.y },
  e_1946_civil_war_surge: { x: 15950, y: TRACK_Y_POSITIONS.armed.y },
  p4_land_law_outline: { x: 16300, y: TRACK_Y_POSITIONS.works.y },
  e_1946_second_front: { x: 16400, y: TRACK_Y_POSITIONS.armed.y },
  e_1947_third_road_fall: { x: 16500, y: TRACK_Y_POSITIONS.works.y },
  e_1948_jinsui_speech: { x: 16800, y: TRACK_Y_POSITIONS.works.y },
  p4_seventh_plenum_2nd: { x: 17100, y: TRACK_Y_POSITIONS.meeting.y },
  p4_peoples_dictatorship: { x: 17500, y: TRACK_Y_POSITIONS.works.y },
  p4_cppcc_1st_session: { x: 17900, y: TRACK_Y_POSITIONS.meeting.y },

  // === Period 6: 1949 - 1978 社会主义过渡与建设初步探索 (X: 18600 to 21550) ===
  e_1949_prc_founded: { x: 18650, y: TRACK_Y_POSITIONS.meeting.y },
  p5_seventh_plenum_3rd: { x: 19100, y: TRACK_Y_POSITIONS.meeting.y },
  e_1950_korean_war: { x: 19100, y: TRACK_Y_POSITIONS.armed.y },
  e_1953_socialist_transformation: { x: 19550, y: TRACK_Y_POSITIONS.works.y },
  e_1954_first_npc: { x: 19800, y: TRACK_Y_POSITIONS.meeting.y },
  p5_ten_relations: { x: 20000, y: TRACK_Y_POSITIONS.works.y },
  p5_cpc_8th: { x: 20450, y: TRACK_Y_POSITIONS.meeting.y },
  p5_internal_contradictions: { x: 20900, y: TRACK_Y_POSITIONS.works.y },
  p5_ninth_plenum_8th: { x: 21150, y: TRACK_Y_POSITIONS.meeting.y },
  e_1962_7000_meeting: { x: 21350, y: TRACK_Y_POSITIONS.meeting.y },

  // === Period 7: 1978 - 2024 改革开放与中国特色社会主义新时代 (X: 21600 to 27900) ===
  p6_truth_criterion: { x: 21650, y: TRACK_Y_POSITIONS.works.y },
  p6_third_plenum_11th: { x: 22050, y: TRACK_Y_POSITIONS.meeting.y },
  e_1979_four_cardinal: { x: 22250, y: TRACK_Y_POSITIONS.works.y },
  p6_sixth_plenum_11th: { x: 22500, y: TRACK_Y_POSITIONS.meeting.y },
  p6_cpc_12th: { x: 22950, y: TRACK_Y_POSITIONS.meeting.y },
  e_1984_third_plenum_12th: { x: 23350, y: TRACK_Y_POSITIONS.meeting.y },
  p6_cpc_13th: { x: 23800, y: TRACK_Y_POSITIONS.meeting.y },
  p6_southern_talks: { x: 24250, y: TRACK_Y_POSITIONS.works.y },
  p6_cpc_14th: { x: 24550, y: TRACK_Y_POSITIONS.meeting.y },
  e_1997_cpc_15th: { x: 24950, y: TRACK_Y_POSITIONS.meeting.y },
  e_2002_cpc_16th_17th: { x: 25400, y: TRACK_Y_POSITIONS.meeting.y },
  e_2012_cpc_18th: { x: 25850, y: TRACK_Y_POSITIONS.meeting.y },
  e_2013_third_plenum_18th: { x: 26250, y: TRACK_Y_POSITIONS.meeting.y },
  e_2017_cpc_19th: { x: 26650, y: TRACK_Y_POSITIONS.meeting.y },
  e_2021_centenary_plenum: { x: 27050, y: TRACK_Y_POSITIONS.works.y },
  e_2022_cpc_20th: { x: 27450, y: TRACK_Y_POSITIONS.meeting.y },
  e_2024_third_plenum_20th: { x: 27750, y: TRACK_Y_POSITIONS.meeting.y },
};

export const PERIOD_BOUNDARIES: PeriodBoundary[] = [
  {
    id: 1,
    title: '一、反对外国侵略与早期救亡图存探索',
    shortTitle: '早期救亡探索',
    yearRange: '1840 — 1919',
    startX: 80,
    endX: 4480,
    width: 4400,
    theme: '两半社会形成 · 太平天国 · 洋务运动 · 戊戌变法 · 辛亥革命',
    accentColor: '#B91C1C',
  },
  {
    id: 2,
    title: '二、五四运动与中国共产党创建、大革命时期',
    shortTitle: '五四与大革命',
    yearRange: '1919 — 1927',
    startX: 4500,
    endX: 7780,
    width: 3280,
    theme: '新民主主义开端 · 开天辟地 · 第一次国共合作 · 北伐胜利与背叛',
    accentColor: '#DC2626',
  },
  {
    id: 3,
    title: '三、土地革命战争与中国革命新道路',
    shortTitle: '土地革命时期',
    yearRange: '1927 — 1937',
    startX: 7800,
    endX: 11780,
    width: 3980,
    theme: '武装起义 · 支部建在连上 · 农村包围城市 · 遵义生死转折',
    accentColor: '#D97706',
  },
  {
    id: 4,
    title: '四、全民族抗日战争的中流砥柱',
    shortTitle: '抗日战争时期',
    yearRange: '1931/1937 — 1945',
    startX: 11800,
    endX: 15380,
    width: 3580,
    theme: '全面抗战 · 《论持久战》 · 新民主主义成熟 · 中共七大',
    accentColor: '#059669',
  },
  {
    id: 5,
    title: '五、人民解放战争与筹建新中国',
    shortTitle: '解放战争时期',
    yearRange: '1945 — 1949',
    startX: 15400,
    endX: 18580,
    width: 3180,
    theme: '土地改革 · 三大战役 · 两个务必 · 协商建国',
    accentColor: '#7C3AED',
  },
  {
    id: 6,
    title: '六、社会主义过渡与建设道路初步探索',
    shortTitle: '过渡与初步探索',
    yearRange: '1949 — 1978',
    startX: 18600,
    endX: 21580,
    width: 2980,
    theme: '恢复经济 · 一化三改 · 《论十大关系》 · 中共八大主要矛盾',
    accentColor: '#2563EB',
  },
  {
    id: 7,
    title: '七、改革开放与中国特色社会主义新时代',
    shortTitle: '改革开放与新时代',
    yearRange: '1978 — 2024',
    startX: 21600,
    endX: 28200,
    width: 6600,
    theme: '伟大历史转折 · 邓小平理论成熟 · 十八大新时代 · 中国式现代化',
    accentColor: '#0D9488',
  },
];

// Discrete explicit years to display on timeline scale across 1840 - 2024
export const YEAR_TICKS: YearTick[] = [
  // Period 1 (1840 - 1919)
  { year: 1840, x: 120, isKeyYear: true },
  { year: 1841, x: 550, isKeyYear: true },
  { year: 1842, x: 750 },
  { year: 1844, x: 950 },
  { year: 1851, x: 1350, isKeyYear: true },
  { year: 1853, x: 1550 },
  { year: 1856, x: 1680 },
  { year: 1861, x: 1800, isKeyYear: true },
  { year: 1865, x: 2000 },
  { year: 1894, x: 2250, isKeyYear: true },
  { year: 1895, x: 2450, isKeyYear: true },
  { year: 1898, x: 2700, isKeyYear: true },
  { year: 1901, x: 3100, isKeyYear: true },
  { year: 1903, x: 3300 },
  { year: 1905, x: 3550, isKeyYear: true },
  { year: 1911, x: 3950, isKeyYear: true },
  { year: 1912, x: 4100, isKeyYear: true },
  { year: 1913, x: 4250 },
  { year: 1915, x: 4380 },
  { year: 1917, x: 4450 },

  // Period 2 (1919 - 1927)
  { year: 1919, x: 4750, isKeyYear: true },
  { year: 1920, x: 5000, isKeyYear: true },
  { year: 1921, x: 5450, isKeyYear: true },
  { year: 1922, x: 5900, isKeyYear: true },
  { year: 1923, x: 6350, isKeyYear: true },
  { year: 1924, x: 6800, isKeyYear: true },
  { year: 1925, x: 7250, isKeyYear: true },
  { year: 1926, x: 7500 },
  { year: 1927, x: 7650, isKeyYear: true },

  // Period 3 (1927 - 1937)
  { year: 1927, x: 7850, isKeyYear: true },
  { year: 1928, x: 8500, isKeyYear: true },
  { year: 1929, x: 9200, isKeyYear: true },
  { year: 1930, x: 9550 },
  { year: 1931, x: 9800, isKeyYear: true },
  { year: 1934, x: 10200 },
  { year: 1935, x: 10450, isKeyYear: true },
  { year: 1936, x: 11350, isKeyYear: true },
  { year: 1937, x: 11650 },

  // Period 4 (1931/1937 - 1945)
  { year: 1937, x: 12150, isKeyYear: true },
  { year: 1938, x: 12900, isKeyYear: true },
  { year: 1939, x: 13500, isKeyYear: true },
  { year: 1940, x: 13750 },
  { year: 1941, x: 14000, isKeyYear: true },
  { year: 1942, x: 14120 },
  { year: 1945, x: 14700, isKeyYear: true },

  // Period 5 (1945 - 1949)
  { year: 1945, x: 15450, isKeyYear: true },
  { year: 1946, x: 15700, isKeyYear: true },
  { year: 1947, x: 16300, isKeyYear: true },
  { year: 1948, x: 16800, isKeyYear: true },
  { year: 1949, x: 17100, isKeyYear: true },

  // Period 6 (1949 - 1978)
  { year: 1949, x: 18650, isKeyYear: true },
  { year: 1950, x: 19100, isKeyYear: true },
  { year: 1953, x: 19550, isKeyYear: true },
  { year: 1954, x: 19800, isKeyYear: true },
  { year: 1956, x: 20000, isKeyYear: true },
  { year: 1957, x: 20900, isKeyYear: true },
  { year: 1961, x: 21150, isKeyYear: true },
  { year: 1962, x: 21350, isKeyYear: true },
  { year: 1976, x: 21450 },

  // Period 7 (1978 - 2024)
  { year: 1978, x: 21650, isKeyYear: true },
  { year: 1979, x: 22250, isKeyYear: true },
  { year: 1981, x: 22500, isKeyYear: true },
  { year: 1982, x: 22950, isKeyYear: true },
  { year: 1984, x: 23350, isKeyYear: true },
  { year: 1987, x: 23800, isKeyYear: true },
  { year: 1992, x: 24250, isKeyYear: true },
  { year: 1997, x: 24950, isKeyYear: true },
  { year: 2002, x: 25400, isKeyYear: true },
  { year: 2007, x: 25650 },
  { year: 2012, x: 25850, isKeyYear: true },
  { year: 2013, x: 26250, isKeyYear: true },
  { year: 2017, x: 26650, isKeyYear: true },
  { year: 2021, x: 27050, isKeyYear: true },
  { year: 2022, x: 27450, isKeyYear: true },
  { year: 2024, x: 27750, isKeyYear: true },
];

export const TOTAL_CANVAS_WIDTH = 28400;
