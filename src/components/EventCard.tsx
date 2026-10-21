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
  Globe2,
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
  cardWidth?: string | number;
  isCompact?: boolean;
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
  cardWidth,
  isCompact = false,
  onHover,
  onSelect,
  onOpenDetail,
  onNavigateTo,
}) => {
  const isMarxism = Boolean(event.isScientificSocialism || event.periodId === 0);

  const getTrackIcon = () => {
    if (isMarxism) {
      return <Globe2 className="w-4 h-4 text-slate-400 shrink-0" />;
    }
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
      return isMarxism
        ? 'ring-2 ring-slate-400 border-slate-400 shadow-md'
        : 'ring-2 ring-amber-500 border-amber-500 shadow-xl';
    }
    if (isActive) {
      return isMarxism ? 'border-slate-400 shadow-sm' : 'border-amber-400 shadow-lg';
    }
    if (isMarxism) {
      return 'border-slate-300/80 dark:border-zinc-700/60 hover:border-slate-400/90 shadow-2xs';
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
    if (isMarxism) {
      return 'bg-gradient-to-r from-slate-100/90 via-slate-100/70 to-slate-200/50 dark:from-zinc-800/60 dark:via-zinc-800/50 dark:to-zinc-800/40 border-b border-slate-200/80 dark:border-zinc-700/60';
    }
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

  const getCardContainerClass = () => {
    if (isMarxism) {
      return 'bg-slate-50/95 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 ring-1 ring-slate-200/80 dark:ring-zinc-800/70 shadow-2xs';
    }
    return 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200';
  };

  return (
    <div
      id={`event-card-${event.id}`}
      onMouseEnter={() => onHover(event.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(event)}
      style={{ width: cardWidth ?? '380px' }}
      className={`group relative flex flex-col rounded-xl backdrop-blur-xs border transition-all duration-200 cursor-pointer select-text text-left ${getCardContainerClass()} ${getBorderColor()} ${
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

      {/* Card Header (In compact mode this is the entire card body for maximum density) */}
      <div className={`p-3.5 ${getHeaderBg()} ${isCompact ? 'rounded-xl' : 'rounded-t-xl'} flex flex-col gap-1`}>
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            {getTrackIcon()}
            {isMarxism ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200/80 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 border border-slate-300/70 dark:border-zinc-700/60 shadow-2xs">
                马原·科学社会主义
              </span>
            ) : (
              <span className={track.accentText}>{track.shortName}</span>
            )}
            <span className={isMarxism ? 'text-slate-400 dark:text-zinc-500' : ''} aria-hidden="true">·</span>
            <span className={`font-mono tabular-nums ${isMarxism ? 'text-slate-500 dark:text-zinc-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
              {event.dateStr}
            </span>
          </div>

          {/* Top-right button specifically triggers full detail view */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(event);
            }}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors shadow-2xs ${
              isMarxism
                ? 'bg-white/90 dark:bg-zinc-800/70 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:border-slate-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400'
            }`}
            title="查看完整原话及深度解析"
          >
            <Maximize2 className="w-3 h-3" />
            <span className="text-[10.5px]">详情</span>
          </button>
        </div>

        <h3 className={`text-[15.5px] font-semibold tracking-tight leading-snug ${isMarxism ? 'text-slate-750 dark:text-zinc-200' : 'text-slate-900 dark:text-slate-100'}`}>
          <HighlightSearch text={event.title} query={searchQuery} />
        </h3>

        {event.subtitle && (
          <p className={`text-[12px] font-normal leading-normal ${isMarxism ? 'text-slate-500 dark:text-zinc-400' : 'text-slate-600 dark:text-slate-400'}`}>
            <HighlightSearch text={event.subtitle} query={searchQuery} />
          </p>
        )}
      </div>

      {/* Card Body and Footer: Only rendered in full detailed mode (!isCompact) */}
      {!isCompact && (
        <>
          {/* Card Body: Objective font size, Verbatim text, In-place Highlights */}
          <div className={`p-3.5 flex flex-col gap-2.5 text-[14px] leading-relaxed ${isMarxism ? 'text-slate-600 dark:text-zinc-300' : 'text-slate-800 dark:text-slate-200'}`}>
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
                  isScientificSocialism={isMarxism}
                />
              </div>
            ))}

            {/* Exam Summary / Historical takeaway verbatim quote */}
            {event.examSummary && (
              <div
                className={`mt-1 p-2.5 rounded-lg border text-[13px] leading-relaxed ${
                  isMarxism
                    ? 'bg-slate-100/70 dark:bg-zinc-800/40 border-slate-200/80 dark:border-zinc-700/60 text-slate-600 dark:text-zinc-300 shadow-2xs'
                    : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/50 text-amber-950 dark:text-amber-200'
                }`}
              >
                <div className={`text-[11px] font-medium tracking-wide mb-1 flex items-center gap-1 ${
                  isMarxism ? 'text-slate-500 dark:text-zinc-400' : 'text-amber-700 dark:text-amber-400'
                }`}>
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
                    '唯物史观',
                    '剩余价值学说',
                    '两大发现',
                    '两个必然',
                    '工人阶级的圣经',
                    '百科全书',
                    '一国胜利论',
                    '理想到现实的伟大飞跃',
                    '开辟人类历史新纪元',
                    '独立政治力量',
                  ]}
                  trackId={event.track}
                  searchQuery={searchQuery}
                  isQuizMode={isQuizMode}
                  isScientificSocialism={isMarxism}
                />
              </div>
            )}
          </div>

          {/* Card Footer: Mind Map Branch Links */}
          {event.connections.length > 0 && (
            <div
              className={`mt-auto px-3.5 py-2.5 rounded-b-xl border-t flex flex-wrap items-center gap-1.5 text-[11.5px] ${
                isMarxism
                  ? 'bg-slate-50/60 dark:bg-zinc-900/40 border-slate-200/70 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-400'
                  : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className={`flex items-center gap-1 shrink-0 ${isMarxism ? 'text-slate-400 dark:text-zinc-500' : 'text-slate-400 dark:text-slate-500'}`}>
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
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    isMarxism
                      ? 'bg-white/80 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/60 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 hover:border-slate-400'
                      : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400'
                  }`}
                  title={`导图跳转到: ${conn.label}`}
                >
                  <span>{conn.label}</span>
                  <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});
