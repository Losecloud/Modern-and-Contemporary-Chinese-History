import React from 'react';
import { HistoryEvent, TrackDefinition } from '../types/history';
import { HighlightText, HighlightSearch } from './HighlightText';
import {
  Building2,
  ShieldAlert,
  BookOpen,
  ArrowRight,
  Maximize2,
  Sparkles,
  GitBranch,
  Search,
} from 'lucide-react';

interface EventCardProps {
  event: HistoryEvent;
  track: TrackDefinition;
  isActive: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  isQuizMode: boolean;
  searchQuery?: string;
  isCurrentSearchFocus?: boolean;
  searchMatchRank?: { current: number; total: number };
  onHover: (id: string | null) => void;
  onSelect: (event: HistoryEvent) => void;
  onOpenDetail: (event: HistoryEvent) => void;
  onNavigateTo: (targetId: string) => void;
}

export const EventCard = React.memo<EventCardProps>(({
  event,
  track,
  isActive,
  isSelected,
  isDimmed,
  isQuizMode,
  searchQuery,
  isCurrentSearchFocus = false,
  searchMatchRank,
  onHover,
  onSelect,
  onOpenDetail,
  onNavigateTo,
}) => {
  const getTrackIcon = () => {
    switch (event.track) {
      case 'meeting':
        return <Building2 className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />;
      case 'armed':
        return <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'works':
      default:
        return <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    if (isCurrentSearchFocus) {
      return 'ring-2 ring-amber-500 border-amber-500 shadow-2xl scale-[1.01]';
    }
    if (isSelected) {
      return 'ring-2 ring-amber-500 border-amber-500 shadow-xl';
    }
    if (isActive) {
      return 'border-amber-400 shadow-lg';
    }
    switch (event.track) {
      case 'meeting':
        return 'border-red-200/90 dark:border-red-900/50 hover:border-red-400';
      case 'armed':
        return 'border-amber-200/90 dark:border-amber-900/50 hover:border-amber-400';
      case 'works':
      default:
        return 'border-emerald-200/90 dark:border-emerald-900/50 hover:border-emerald-400';
    }
  };

  const getHeaderBg = () => {
    switch (event.track) {
      case 'meeting':
        return 'bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border-b border-red-100 dark:border-red-950/60';
      case 'armed':
        return 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-100 dark:border-amber-950/60';
      case 'works':
      default:
        return 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-emerald-100 dark:border-emerald-950/60';
    }
  };

  return (
    <div
      id={`event-card-${event.id}`}
      onMouseEnter={() => onHover(event.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(event)}
      style={{ width: '380px' }}
      className={`group relative flex flex-col rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border transition-all duration-200 cursor-pointer select-text text-left ${getBorderColor()} ${
        isDimmed ? 'opacity-30 blur-[0.5px] scale-[0.98]' : 'opacity-100 scale-100'
      } ${event.isMilestone ? 'ring-1 ring-amber-500/30' : ''}`}
    >
      {/* Current Search Target Badge */}
      {isCurrentSearchFocus && searchMatchRank && (
        <div className="absolute -top-3 left-4 z-20 flex items-center gap-1 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
          <Search className="w-3 h-3" />
          <span>匹配结果 ({searchMatchRank.current}/{searchMatchRank.total})</span>
        </div>
      )}

      {/* Milestone Indicator */}
      {event.isMilestone && !isCurrentSearchFocus && (
        <div className="absolute -top-2.5 right-12 z-20 flex items-center gap-1 bg-amber-500 text-white text-[11px] font-medium px-2 py-0.5 rounded-full shadow-xs">
          <Sparkles className="w-3 h-3" />
          <span>核心枢纽</span>
        </div>
      )}

      {/* Card Header */}
      <div className={`p-3.5 ${getHeaderBg()} rounded-t-xl flex flex-col gap-1`}>
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            {getTrackIcon()}
            <span className={track.accentText}>{track.shortName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
              {event.dateStr}
            </span>
          </div>

          {/* Top-right button specifically triggers full detail view */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(event);
            }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 transition-colors shadow-2xs"
            title="查看完整原话及深度解析"
          >
            <Maximize2 className="w-3 h-3" />
            <span className="text-[10.5px]">详情</span>
          </button>
        </div>

        <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
          <HighlightSearch text={event.title} query={searchQuery} />
        </h3>

        {event.subtitle && (
          <p className="text-[12.5px] text-slate-600 dark:text-slate-400 font-normal leading-normal">
            <HighlightSearch text={event.subtitle} query={searchQuery} />
          </p>
        )}
      </div>

      {/* Card Body: Objective font size, Verbatim text, In-place Highlights */}
      <div className="p-3.5 flex flex-col gap-2.5 text-[14px] leading-relaxed text-slate-800 dark:text-slate-200">
        {event.items.map((item, idx) => (
          <div
            key={idx}
            className="relative text-[13.5px] leading-[1.65] font-normal tracking-[0.01em]"
          >
            <HighlightText
              text={item.text}
              highlights={item.highlights}
              trackId={event.track}
              searchQuery={searchQuery}
              isQuizMode={isQuizMode}
            />
          </div>
        ))}

        {/* Exam Summary / Historical takeaway verbatim quote */}
        {event.examSummary && (
          <div className="mt-1 p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 text-[13px] leading-relaxed text-amber-950 dark:text-amber-200">
            <div className="text-[11px] font-semibold tracking-wide text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
              <span>★ 核心考点原话结论</span>
            </div>
            <HighlightText
              text={event.examSummary}
              highlights={[
                '领导核心',
                '土地制度的革命',
                '第一代中央领导集体',
                '工人阶级领导的以工农联盟为基础的人民民主专政',
                '思想路线在全党范围确立起来',
                '革命重心从农村转向城市',
              ]}
              trackId={event.track}
              searchQuery={searchQuery}
              isQuizMode={isQuizMode}
            />
          </div>
        )}
      </div>

      {/* Card Footer: Mind Map Branch Links */}
      {event.connections.length > 0 && (
        <div className="mt-auto px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-b-xl border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-[11.5px]">
          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0">
            <GitBranch className="w-3 h-3" />
            <span>导图分支:</span>
          </span>
          {event.connections.map((conn, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                onNavigateTo(conn.targetId);
              }}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 transition-colors cursor-pointer"
              title={`导图跳转到: ${conn.label}`}
            >
              <span>{conn.label}</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-60" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
