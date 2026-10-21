import React, { useState } from 'react';
import { HistoryEvent } from '../types/history';
import { TRACKS, PERIODS, HISTORY_EVENTS } from '../data/historyData';
import { HighlightText } from './HighlightText';
import {
  X,
  Building2,
  ShieldAlert,
  BookOpen,
  Compass,
  ArrowRight,
  GitBranch,
  Copy,
  Check,
  BookMarked,
  HelpCircle,
} from 'lucide-react';

interface EventDetailModalProps {
  event: HistoryEvent | null;
  onClose: () => void;
  onNavigateTo: (targetId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onNavigateTo,
}) => {
  const [copied, setCopied] = useState(false);
  const [quizMode, setQuizMode] = useState(false);

  if (!event) return null;

  const track = TRACKS.find((t) => t.id === event.track);
  const period = PERIODS.find((p) => p.id === event.periodId);

  // Find incoming (predecessors)
  const incomingEvents: { event: HistoryEvent; label: string }[] = [];
  HISTORY_EVENTS.forEach((e) => {
    e.connections.forEach((c) => {
      if (c.targetId === event.id) {
        incomingEvents.push({ event: e, label: c.label });
      }
    });
  });

  // Find outgoing (successors)
  const outgoingEvents: { event: HistoryEvent; label: string }[] = [];
  event.connections.forEach((c) => {
    const target = HISTORY_EVENTS.find((e) => e.id === c.targetId);
    if (target) {
      outgoingEvents.push({ event: target, label: c.label });
    }
  });

  const handleCopyNotes = () => {
    const content = `【${event.dateStr} ${event.title}】\n时期：${period?.title}\n所属：${track?.name}\n\n${event.items.map((it) => it.text).join('\n')}\n${event.examSummary ? `\n★核心考点：${event.examSummary}` : ''}`;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMarxism = Boolean(event.isScientificSocialism || event.periodId === 0);

  const getIcon = () => {
    if (isMarxism) {
      return <BookOpen className="w-5 h-5 text-slate-400" />;
    }
    switch (event.track) {
      case 'meeting':
        return <Building2 className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'armed':
        return <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'works':
      default:
        return <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${isMarxism ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'} flex items-start justify-between gap-4`}>
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className={`px-2 py-0.5 rounded-md font-medium ${isMarxism ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                {period?.title.split('（')[0]}
              </span>
              <span aria-hidden="true">/</span>
              <span className={`flex items-center gap-1 font-medium ${isMarxism ? 'text-slate-500 dark:text-zinc-400' : track?.accentText}`}>
                {getIcon()}
                {isMarxism ? '马原·科学社会主义' : track?.name}
              </span>
              <span aria-hidden="true">/</span>
              <span className={`font-mono tabular-nums font-semibold ${isMarxism ? 'text-slate-600 dark:text-zinc-300' : 'text-slate-700 dark:text-slate-300'}`}>
                {event.dateStr}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {event.title}
            </h2>

            {event.subtitle && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {event.subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setQuizMode(!quizMode)}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                quizMode
                  ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-300 text-amber-900 dark:text-amber-200'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
              title="切换考点挖空自测模式"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{quizMode ? '考点显露' : '背诵自测'}</span>
            </button>

            <button
              onClick={handleCopyNotes}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
              title="复制笔记内容"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-800 dark:text-slate-200">
          {/* Main Verbatim Bullet Points */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookMarked className="w-4 h-4" />
              <span>史纲原始文献与核心条目（原话完整收录）</span>
            </h4>
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
              {event.items.map((item, idx) => (
                <div key={idx} className="text-[14.5px] leading-relaxed">
                  <HighlightText
                    text={item.text}
                    highlights={item.highlights}
                    trackId={event.track}
                    isQuizMode={quizMode}
                    isScientificSocialism={isMarxism}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Core Takeaway / Exam Key Points */}
          {event.examSummary && (
            <div className={`p-4 rounded-xl border ${isMarxism ? 'bg-slate-800/80 border-slate-700/80' : 'bg-amber-500/10 border-amber-400/40 dark:border-amber-500/30'}`}>
              <div className={`text-xs font-bold mb-1.5 ${isMarxism ? 'text-amber-400' : 'text-amber-800 dark:text-amber-300'}`}>
                ★ 命题结论与历史经验总结
              </div>
              <div className="text-[14px] leading-relaxed text-slate-800 dark:text-slate-200">
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
                  isQuizMode={quizMode}
                  isScientificSocialism={isMarxism}
                />
              </div>
            </div>
          )}

          {/* Mind Map Connections Breakdown */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="w-4 h-4" />
              <span>思维导图因果分支网络（前因与后继）</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Incoming / Predecessors */}
              <div className="p-3.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block mb-2">
                  ← 前置动因 / 历史起因 ({incomingEvents.length})
                </span>
                {incomingEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">本阶段起始发端事件</p>
                ) : (
                  <div className="space-y-2">
                    {incomingEvents.map((inc, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onNavigateTo(inc.event.id);
                        }}
                        className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all text-xs flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {inc.event.title}
                          </div>
                          <div className="text-[11px] text-blue-600 dark:text-blue-400">
                            {inc.label}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing / Successors */}
              <div className="p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block mb-2">
                  → 后继影响 / 导图分支 ({outgoingEvents.length})
                </span>
                {outgoingEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">现行阶段最新成果</p>
                ) : (
                  <div className="space-y-2">
                    {outgoingEvents.map((out, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onNavigateTo(out.event.id);
                        }}
                        className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 transition-all text-xs flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {out.event.title}
                          </div>
                          <div className="text-[11px] text-amber-600 dark:text-amber-400">
                            {out.label}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>点击上方关联卡片可直接在画布中定位跳转</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            完成阅读
          </button>
        </div>
      </div>
    </div>
  );
};
