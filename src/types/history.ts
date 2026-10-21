export type TrackId = 'meeting' | 'armed' | 'works';

export type PeriodId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface HistoryItem {
  text: string;
  highlights: string[];
}

export interface ConnectionLink {
  targetId: string;
  label: string;
  direction?: 'forward' | 'cross' | 'branch';
}

export interface HistoryEvent {
  id: string;
  periodId: PeriodId;
  track: TrackId;
  dateStr: string;
  year: number; // For chronological ordering and time-scale positioning
  title: string;
  subtitle?: string;
  isMilestone?: boolean; // 核心节点 (第一排核心/关键转折)
  isScientificSocialism?: boolean; // 科学社会主义/马原脉络卡片，采用专属灰黑风格显示在第二排、第三排
  category?: 'history' | 'marxism'; // 所属知识域
  items: HistoryItem[];
  connections: ConnectionLink[];
  examSummary?: string; // 总结性结论/考点命题原话
  tags?: string[];
  xOffset?: number; // timeline standard scale horizontal offset
}

export interface PeriodInfo {
  id: PeriodId;
  title: string;
  yearRange: string;
  startYear: number;
  endYear: number;
  theme: string;
  summary: string;
  accentColor: string;
  bgTint: string;
}

export interface TrackDefinition {
  id: TrackId;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  iconName: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  dotColor: string;
}

export function getCardZIndex(event: HistoryEvent, globalIndex: number, isHovered: boolean, isSelected: boolean, isHighlighted: boolean): number {
  if (isSelected) return 500;
  if (isHovered) return 400;
  if (isHighlighted) return 300;
  const hubBonus = event.isMilestone ? 100 : 0;
  return 10 + hubBonus + globalIndex;
}

