import React, { useEffect, useRef } from 'react';
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
  FileQuestion,
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
  /** 同年合并组内的全部事件（>1 时在卡片顶部渲染 sheet 选项卡） */
  groupEvents?: HistoryEvent[];
  /** 切换到同组内指定事件 */
  onTabChange?: (eventId: string) => void;
  onHover: (id: string | null) => void;
  onSelect: (event: HistoryEvent) => void;
  onOpenDetail: (event: HistoryEvent) => void;
  /** 直接打开该卡片的真题练习弹窗 */
  onOpenPractice?: (event: HistoryEvent) => void;
  /** 该卡片可练习的真题数量；undefined 表示仍在计算 */
  examCount?: number;
  onNavigateTo: (targetId: string) => void;
  /** 编辑模式：显示右边界宽度拖拽手柄 */
  isEditMode?: boolean;
  onResizeWidth?: (eventId: string, width: number) => void;
  /** 编辑模式：卡片当前左边界画布 X（拖拽起点） */
  placedX?: number;
  /** 画布缩放系数：拖拽位移需除以该系数才能换算为卡片实际位移 */
  dragScale?: number;
  /** 编辑模式：水平拖拽中实时回传新的左边界 X */
  onMoveCard?: (eventId: string, x: number) => void;
  /** 编辑模式：拖拽结束（用于提交并持久化位置） */
  onMoveCardEnd?: () => void;
  /** 画布缩放系数：拖拽位移需除以该系数才能换算为卡片实际宽度 */
  resizeScale?: number;
  /** 上报卡片实际渲染高度：连线以「边界中点」为锚点，需要真实高度而非估算值 */
  onCardHeight?: (eventId: string, height: number) => void;
}

/** 选项卡标题：取事件名主段并限长，避免同年多卡时选项卡撑爆 */
const shortTabLabel = (title: string): string => {
  const head = title.split(/[：:（(]/)[0].trim() || title;
  return head.length > 9 ? `${head.slice(0, 9)}…` : head;
};

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
  groupEvents,
  onTabChange,
  onHover,
  onSelect,
  onOpenDetail,
  onOpenPractice,
  examCount,
  onNavigateTo,
  isEditMode = false,
  onResizeWidth,
  placedX,
  dragScale = 1,
  onMoveCard,
  onMoveCardEnd,
  resizeScale = 1,
  onCardHeight,
}) => {
  const isMarxism = Boolean(event.isScientificSocialism || event.periodId === 0);
  const hasTabs = Boolean(groupEvents && groupEvents.length > 1);
  /** 拖拽结束后短时间内屏蔽 click，避免把拖动误判为选中卡片 */
  const suppressClickUntilRef = useRef(0);
  /** 卡片根节点：用于向画布上报真实高度（连线锚点取边界中点） */
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !onCardHeight) return;
    const report = () => {
      const height = Math.round(el.offsetHeight);
      if (height > 0) onCardHeight(event.id, height);
    };
    report();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [event.id, onCardHeight]);

  /** 编辑模式：按住卡片主体左右拖动（按钮与缩放手柄除外），避免与画布平移冲突 */
  const handleCardPointerDown = (e: React.PointerEvent) => {
    if (!isEditMode || !onMoveCard || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea')) return;
    e.preventDefault();
    e.stopPropagation();
    const startClientX = e.clientX;
    const startX = placedX ?? 0;
    const scale = dragScale || 1;
    let moved = false;
    const handleMove = (ev: PointerEvent) => {
      if (!moved && Math.abs(ev.clientX - startClientX) < 3) return;
      moved = true;
      onMoveCard(event.id, startX + (ev.clientX - startClientX) / scale);
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      if (!moved) return;
      suppressClickUntilRef.current = Date.now() + 350;
      onMoveCardEnd?.();
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  const getTrackIcon = () => {
    if (isMarxism) {
      return <Globe2 className="c3 c111" />;
    }
    switch (event.track) {
      case 'meeting':
        return <Building2 className="c3 c108" />;
      case 'armed':
        return <ShieldAlert className="c3 c109" />;
      case 'works':
      default:
        return <BookOpen className="c3 c110" />;
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
      ref={rootRef}
      onMouseEnter={() => onHover(event.id)}
      onMouseLeave={() => onHover(null)}
      onPointerDown={isEditMode && onMoveCard ? handleCardPointerDown : undefined}
      onClick={() => {
        if (Date.now() < suppressClickUntilRef.current) return;
        onSelect(event);
      }}
      style={{ width: cardWidth ?? '380px' }}
      className={`c39 ${getCardContainerClass()} ${getBorderColor()} ${
        isEditMode && onMoveCard ? 'cursor-grab active:cursor-grabbing select-none' : ''
      } ${
        isDimmed ? 'opacity-30 blur-[0.5px] scale-[0.98]' : 'opacity-100 scale-100'
      } ${event.isMilestone ? 'ring-1 ring-amber-500/30' : ''}`}
    >
      {/* 编辑模式：右边界拖拽手柄，用于调整卡片宽度 */}
      {isEditMode && onResizeWidth && (
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const cardEl = e.currentTarget.parentElement as HTMLElement | null;
            const startX = e.clientX;
            const startWidth = cardEl?.offsetWidth ?? 380;
            const scale = resizeScale || 1;
            const handleMove = (ev: PointerEvent) => {
              const next = Math.min(760, Math.max(180, startWidth + (ev.clientX - startX) / scale));
              onResizeWidth(event.id, Math.round(next));
            };
            const handleUp = () => {
              window.removeEventListener('pointermove', handleMove);
              window.removeEventListener('pointerup', handleUp);
            };
            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp);
          }}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-0 bottom-0 right-0 translate-x-1/2 w-2 cursor-col-resize z-20 rounded-full bg-amber-400/40 hover:bg-amber-400/80"
          title="拖拽调整卡片宽度"
        />
      )}

      {/* 同年合并 sheet 选项卡：按时间排序，核心枢纽带星标并可优先展示 */}
      {hasTabs && (
        <div className="flex items-stretch gap-1 px-2 pt-2 pb-1.5 rounded-t-xl border-b border-slate-200/70 dark:border-slate-700/60 bg-slate-100/80 dark:bg-slate-800/60">
          {groupEvents!.map((member) => {
            const isTabActive = member.id === event.id;
            return (
              <button
                key={member.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onTabChange?.(member.id);
                }}
                onMouseEnter={() => {
                  if (!isTabActive) onTabChange?.(member.id);
                }}
                title={member.title}
                className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-1.5 py-1 rounded-md text-[10.5px] leading-none transition-colors cursor-pointer ${
                  isTabActive
                    ? 'bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-100 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-900/60'
                }`}
              >
                {member.isMilestone && <Sparkles className="w-2.5 h-2.5 shrink-0 text-amber-500" />}
                <span className="truncate">{shortTabLabel(member.title)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Current Search Target Badge */}
      {isCurrentSearchFocus && searchMatchRank && (
        <div className="c60">
          <Search className="c1" />
          <span>匹配结果 ({searchMatchRank.current}/{searchMatchRank.total})</span>
        </div>
      )}

      {/* Milestone Indicator */}
      {event.isMilestone && !isCurrentSearchFocus && !hasTabs && (
        <div className="c61">
          <Sparkles className="c1" />
          <span>核心枢纽</span>
        </div>
      )}

      {/* Card Header (In compact mode this is the entire card body for maximum density) */}
      <div className={`c42 ${getHeaderBg()} ${isCompact ? 'rounded-xl' : hasTabs ? 'rounded-none' : 'rounded-t-xl'}`}>
        <div className="c43">
          <div className="c10 font-medium">
            {getTrackIcon()}
            {isMarxism && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200/80 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 border border-slate-300/70 dark:border-zinc-700/60 shadow-2xs">
                马原·科学社会主义
              </span>
            )}
            <span className={`c24 ${isMarxism ? 'text-slate-500 dark:text-zinc-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
              {event.dateStr}
            </span>
          </div>

          {/* Top-right exam entry: count + direct practice modal, followed by full detail */}
          <div className="c10 shrink-0">
            {onOpenPractice && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPractice(event);
                }}
                disabled={examCount === 0}
                className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-1 rounded-md border text-[10.5px] font-medium transition-colors ${
                  examCount === 0
                    ? 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-default'
                    : 'border-amber-300/80 bg-amber-50/80 text-amber-700 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50 cursor-pointer'
                }`}
                title={
                  examCount === 0
                    ? '本题库暂无与该知识点对应的真题'
                    : `点击直接练习该知识点的真题${examCount ? `（${examCount} 道）` : ''}`
                }
              >
                <FileQuestion className="w-3 h-3" />
                <span className="font-mono tabular-nums leading-none">
                  {examCount ?? '…'}
                </span>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(event);
              }}
              className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="查看完整原话及深度解析"
            >
              <Maximize2 className="c1" />
            </button>
          </div>
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
          <div className={`c47 ${isMarxism ? 'c49' : 'c48'}`}>
            {event.items.map((item, idx) => (
              <div
                key={idx}
                className="c50"
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
                className={`c51 ${
                  isMarxism ? 'c53' : 'c52'
                }`}
              >
                <div className={`text-[11px] font-medium tracking-wide mb-1 ${
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
              className={`c44 ${
                isMarxism ? 'c46' : 'c45'
              }`}
            >
              <span className={`flex items-center gap-1 shrink-0 ${isMarxism ? 'text-slate-400 dark:text-zinc-500' : 'text-slate-400 dark:text-slate-500'}`}>
                <GitBranch className="c1" />
                <span>导图分支:</span>
              </span>
              {event.connections.map((conn, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateTo(conn.targetId);
                  }}
                  className={`c54 ${
                    isMarxism ? 'c56' : 'c55'
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
