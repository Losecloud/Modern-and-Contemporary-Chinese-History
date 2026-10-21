import type { HistoryEvent, PeriodInfo, TrackDefinition } from '../types/history';

/**
 * 知识卡片数据来自外部独立数据文件 data/historyData.js（JSON 结构，含 tracks/periods/events），
 * 在应用脚本执行前通过 <script src="data/historyData.js"> 注入到 window.HISTORY_DATA。
 * 这样构建产物可直接双击打开（离线 file://），修改数据后刷新页面即可生效，无需重新构建。
 */
export interface HistoryDataBundle {
  tracks: TrackDefinition[];
  periods: PeriodInfo[];
  events: HistoryEvent[];
}

declare global {
  interface Window {
    HISTORY_DATA?: HistoryDataBundle;
  }
}

const DATA: HistoryDataBundle =
  (typeof window !== 'undefined' && window.HISTORY_DATA) || {
    tracks: [],
    periods: [],
    events: [],
  };

export const TRACKS: TrackDefinition[] = DATA.tracks;
export const PERIODS: PeriodInfo[] = DATA.periods;
export const HISTORY_EVENTS: HistoryEvent[] = DATA.events;
