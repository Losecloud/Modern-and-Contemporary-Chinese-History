import React, { useEffect, useState } from 'react';
import { HistoryEvent } from '../types/history';
import { TRACKS, PERIODS, HISTORY_EVENTS } from '../data/historyData';
import { HighlightText } from './HighlightText';
import { QuizPanel } from './QuizPanel';
import { loadExamQuestions, pickExamQuestions } from '../utils/examQuiz';
import {
  X,
  Building2,
  ShieldAlert,
  BookOpen,
  Compass,
  ArrowRight,
  GitBranch,
  BookMarked,
  HelpCircle,
  FileQuestion,
} from 'lucide-react';

interface EventDetailModalProps {
  event: HistoryEvent | null;
  /** 打开弹窗时直接进入真题练习，用于卡片右上角真题数量按钮 */
  initialPracticeMode?: boolean;
  onClose: () => void;
  onNavigateTo: (targetId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  initialPracticeMode = false,
  onClose,
  onNavigateTo,
}) => {
  const [quizMode, setQuizMode] = useState(false);
  // 真题练习模式：把弹窗正文切换为该知识点的真题答题区
  const [practiceMode, setPracticeMode] = useState(initialPracticeMode);
  // 该卡片可用的真题数量：null 表示尚未判定，0 表示题库无对应真题
  const [matchCount, setMatchCount] = useState<number | null>(null);

  useEffect(() => {
    if (!event) return;
    let alive = true;
    setMatchCount(null);
    loadExamQuestions()
      .then((all) => {
        if (!alive) return;
        setMatchCount(pickExamQuestions(event, all, 6).length);
      })
      .catch(() => {
        if (alive) setMatchCount(null);
      });
    return () => {
      alive = false;
    };
  }, [event]);

  if (!event) return null;

  const noExam = matchCount === 0;

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

  const isMarxism = Boolean(event.isScientificSocialism || event.periodId === 0);

  const getIcon = () => {
    if (isMarxism) {
      return <BookOpen className="c4 text-slate-400" />;
    }
    switch (event.track) {
      case 'meeting':
        return <Building2 className="c4 c108" />;
      case 'armed':
        return <ShieldAlert className="c4 c109" />;
      case 'works':
      default:
        return <BookOpen className="c4 c110" />;
    }
  };

  return (
    <div className="c25">
      <div
        className="c26"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`c27 ${isMarxism ? 'c31' : 'c30'}`}>
          <div className="c7">
            <div className="c12 c18">
              <span className={`px-2 py-0.5 rounded-md font-medium ${isMarxism ? 'c38' : 'c37'}`}>
                {period?.title.split('（')[0]}
              </span>
              <span aria-hidden="true">/</span>
              <span className={`c10 font-medium ${isMarxism ? 'text-slate-500 dark:text-zinc-400' : track?.accentText}`}>
                {getIcon()}
                {isMarxism ? '马原·科学社会主义' : track?.name}
              </span>
              <span aria-hidden="true">/</span>
              <span className={`c24 ${isMarxism ? 'text-slate-600 dark:text-zinc-300' : 'text-slate-700 dark:text-slate-300'}`}>
                {event.dateStr}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {event.title}
            </h2>

            {event.subtitle && (
              <p className="c19">
                {event.subtitle}
              </p>
            )}
          </div>

          <div className="c10 shrink-0">
            <button
              onClick={() => setPracticeMode(!practiceMode)}
              disabled={noExam}
              className={`c33 ${practiceMode ? 'c36' : 'c35'} ${
                noExam ? 'opacity-40 cursor-not-allowed grayscale' : ''
              }`}
              title={
                noExam
                  ? '本题库暂无与该知识点对应的真题'
                  : '在详情中直接练习本知识点的历年真题'
              }
            >
              <FileQuestion className="c3" />
              <span>
                {practiceMode
                  ? '收起真题'
                  : matchCount === null
                    ? '练真题'
                    : `练真题(${matchCount})`}
              </span>
            </button>

            {!practiceMode && (
              <button
                onClick={() => setQuizMode(!quizMode)}
                className={`c33 ${quizMode ? 'c36' : 'c35'}`}
                title="切换考点挖空自测模式"
              >
                <HelpCircle className="c3" />
                <span>{quizMode ? '考点显露' : '背诵自测'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="c34"
            >
              <X className="c4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        {practiceMode ? (
          <div className="c28">
            <QuizPanel event={event} />
          </div>
        ) : (
        <div className="c28">
          {/* Main Verbatim Bullet Points */}
          <div className="c16">
            <h4 className="c21">
              <BookMarked className="c3" />
              <span>史纲原始文献与核心条目（原话完整收录）</span>
            </h4>
            <div className="c101">
              {event.items.map((item, idx) => (
                <div key={idx} className="c102">
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
            <div className={`p-4 rounded-xl border ${isMarxism ? 'bg-slate-100/80 border-slate-200/80 dark:bg-zinc-800/50 dark:border-zinc-700/60' : 'bg-amber-500/10 border-amber-400/40 dark:border-amber-500/30'}`}>
              <div className={`text-xs font-bold mb-1.5 ${isMarxism ? 'text-amber-700 dark:text-amber-300' : 'text-amber-800 dark:text-amber-300'}`}>
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
            <h4 className="c21">
              <GitBranch className="c3" />
              <span>思维导图因果分支网络（前因与后继）</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Incoming / Predecessors */}
              <div className="c62">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block mb-2">
                  ← 前置动因 / 历史起因 ({incomingEvents.length})
                </span>
                {incomingEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">本阶段起始发端事件</p>
                ) : (
                  <div className="c17">
                    {incomingEvents.map((inc, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onNavigateTo(inc.event.id);
                        }}
                        className="c64 group"
                      >
                        <div>
                          <div className="c22">
                            {inc.event.title}
                          </div>
                          <div className="text-[11px] text-blue-600 dark:text-blue-400">
                            {inc.label}
                          </div>
                        </div>
                        <ArrowRight className="c2 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing / Successors */}
              <div className="c63">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block mb-2">
                  → 后继影响 / 导图分支 ({outgoingEvents.length})
                </span>
                {outgoingEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">现行阶段最新成果</p>
                ) : (
                  <div className="c17">
                    {outgoingEvents.map((out, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onNavigateTo(out.event.id);
                        }}
                        className="c65 group"
                      >
                        <div>
                          <div className="c22">
                            {out.event.title}
                          </div>
                          <div className="text-[11px] text-amber-600 dark:text-amber-400">
                            {out.label}
                          </div>
                        </div>
                        <ArrowRight className="c2 text-slate-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Modal Footer */}
        <div className="c29">
          <span>点击上方关联卡片可直接在画布中定位跳转</span>
          <button
            onClick={onClose}
            className="c32"
          >
            完成阅读
          </button>
        </div>
      </div>
    </div>
  );
};
