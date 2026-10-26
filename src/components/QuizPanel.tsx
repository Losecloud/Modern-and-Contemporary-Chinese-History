import React, { useEffect, useMemo, useState } from 'react';
import { HistoryEvent } from '../types/history';
import {
  MatchedExamQuestion,
  loadExamQuestions,
  pickExamQuestions,
} from '../utils/examQuiz';
import { readExamRecords, saveExamRecord } from '../utils/examProgress';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';

interface QuizPanelProps {
  event: HistoryEvent;
}

interface AnswerState {
  selected: string[];
  revealed: boolean;
  draft: string;
  /** 分析题自评结果；客观题不使用 */
  selfRated?: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  single: '单项选择',
  multiple: '多项选择',
  analysis: '分析题',
};

/** 题序方块内的题型简称 */
const TYPE_SHORT: Record<string, string> = {
  single: '单',
  multiple: '多',
  analysis: '析',
};

const LETTERS = ['A', 'B', 'C', 'D'];

const EMPTY_ANSWER: AnswerState = { selected: [], revealed: false, draft: '' };

const optionClass = (
  selected: boolean,
  correct: boolean,
  wrong: boolean,
  revealed: boolean
) => {
  if (revealed && correct) {
    return 'border-emerald-400/80 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-700';
  }
  if (revealed && wrong) {
    return 'border-red-400/80 bg-red-50 dark:bg-red-950/40 dark:border-red-800';
  }
  if (selected && !revealed) {
    return 'border-slate-400 bg-slate-100 dark:border-slate-500 dark:bg-slate-700/60';
  }
  return 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50';
};

const letterClass = (
  selected: boolean,
  correct: boolean,
  wrong: boolean,
  revealed: boolean,
  multiple: boolean
) => {
  const shape = multiple ? 'rounded-[5px]' : 'rounded-full';
  if (revealed && correct) return `${shape} bg-emerald-600 border-emerald-600 text-white`;
  if (revealed && wrong) return `${shape} bg-red-600 border-red-600 text-white`;
  if (selected && !revealed) {
    return `${shape} bg-slate-600 border-slate-600 text-white dark:bg-slate-400 dark:border-slate-400 dark:text-slate-900`;
  }
  return `${shape} border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300`;
};

export const QuizPanel: React.FC<QuizPanelProps> = ({ event }) => {
  const [questions, setQuestions] = useState<MatchedExamQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});

  useEffect(() => {
    let alive = true;
    setQuestions(null);
    setError(null);
    setAnswers({});
    setIndex(0);
    loadExamQuestions()
      .then((all) => {
        if (!alive) return;
        const matched = pickExamQuestions(event, all, 6);
        setQuestions(matched);
        // 与真题练习页共用进度：已作答过的题直接呈现判定结果
        const stored = readExamRecords(matched.map((q) => q.id));
        const initial: Record<string, AnswerState> = {};
        matched.forEach((q) => {
          const record = stored[q.id];
          if (!record) return;
          initial[q.id] = {
            selected: record.selected,
            revealed: true,
            draft: record.text,
            selfRated: typeof record.correct === 'boolean' ? record.correct : undefined,
          };
        });
        setAnswers(initial);
      })
      .catch((err: Error) => {
        if (!alive) return;
        setError(err.message || '题库加载失败');
      });
    return () => {
      alive = false;
    };
  }, [event, reloadKey]);

  const current = questions && questions.length > 0 ? questions[index] : null;
  const answer = current ? answers[current.id] || EMPTY_ANSWER : EMPTY_ANSWER;

  const correctSet = useMemo(
    () => new Set((current?.answer || []).map((v) => v.toUpperCase())),
    [current]
  );

  const isMultiple = current?.type === 'multiple';
  const isAnalysis = current?.type === 'analysis';
  const revealed = answer.revealed;

  const isRight =
    !!current &&
    current.type !== 'analysis' &&
    revealed &&
    answer.selected.length === correctSet.size &&
    answer.selected.every((letter) => correctSet.has(letter));

  const patchCurrent = (patch: Partial<AnswerState>) => {
    if (!current) return;
    setAnswers((prev) => ({
      ...prev,
      [current.id]: { ...(prev[current.id] || EMPTY_ANSWER), ...patch },
    }));
  };

  const toggleOption = (letter: string) => {
    if (!current || revealed) return;
    if (isMultiple) {
      const next = answer.selected.includes(letter)
        ? answer.selected.filter((v) => v !== letter)
        : [...answer.selected, letter];
      patchCurrent({ selected: next });
    } else {
      patchCurrent({ selected: [letter] });
    }
  };

  /** 提交客观题：判定后写入真题练习的同一份记录 */
  const submitAnswer = () => {
    if (!current) return;
    patchCurrent({ revealed: true });
    if (isAnalysis) return;
    const correct =
      answer.selected.length === correctSet.size &&
      answer.selected.every((letter) => correctSet.has(letter));
    saveExamRecord(current.id, {
      selected: answer.selected,
      correct,
      method: 'answer',
    });
  };

  /** 分析题自评：与真题练习页口径一致，自评不计入客观题正确率 */
  const rateAnalysis = (correct: boolean) => {
    if (!current) return;
    patchCurrent({ revealed: true, selfRated: correct });
    saveExamRecord(current.id, {
      selected: [],
      correct,
      method: 'self',
      text: answer.draft,
    });
  };

  const resetQuestion = () =>
    patchCurrent({ selected: [], revealed: false, draft: '', selfRated: undefined });

  const canSubmit = isAnalysis || answer.selected.length > 0;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-xs text-slate-500 dark:text-slate-400">
        <p>{error}</p>
        <button
          onClick={() => setReloadKey((v) => v + 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
        >
          重新载入
        </button>
      </div>
    );
  }

  if (!questions) {
    return (
      <p className="py-16 text-center text-xs text-slate-400 dark:text-slate-500">
        正在载入该知识点的真题…
      </p>
    );
  }

  if (!current) {
    return (
      <div className="py-14 text-center">
        <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
          本卡片暂未匹配到对应真题
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed mt-1">
          题库中没有以该事件或著作命题的原题，因此不做近似凑题；可到「真题练习」按专题浏览相关章节。
        </p>
      </div>
    );
  }

  const options = current.options
    ? LETTERS.filter((letter) => current.options && current.options[letter])
    : [];

  return (
    <div className="flex flex-col gap-4">
      {/* 题头 */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">
          {TYPE_LABEL[current.type] || '真题'}
        </span>
        <span>{current.year} 年真题</span>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span>第 {current.number} 题</span>
        {(current.knowledgePoint || current.topic) && (
          <>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-600 dark:text-slate-300">
              {current.knowledgePoint || current.topic}
            </span>
          </>
        )}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              title={`第 ${i + 1} 题 · ${TYPE_LABEL[q.type] || '真题'}`}
              aria-current={i === index ? 'true' : undefined}
              className={`shrink-0 w-5 h-5 flex items-center justify-center text-[11px] font-medium border rounded-[5px] transition-colors ${
                i === index
                  ? 'bg-slate-600 border-slate-600 text-white dark:bg-slate-400 dark:border-slate-400 dark:text-slate-900'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {TYPE_SHORT[q.type] || '题'}
            </button>
          ))}
        </div>
        {current.matchReason && (
          <span className="w-full text-slate-400 dark:text-slate-500">
            命中考点：{current.matchReason}
          </span>
        )}
      </div>

      {/* 题干 */}
      <p className="text-[15px] leading-[1.85] font-medium text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words">
        {current.stem}
      </p>

      {/* 选项 / 分析题作答 */}
      {isAnalysis ? (
        <textarea
          value={answer.draft}
          onChange={(e) => patchCurrent({ draft: e.target.value })}
          disabled={revealed}
          rows={6}
          placeholder="先写下你的思路，再对照参考答案。"
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 text-[13px] leading-relaxed text-slate-800 dark:text-slate-200 outline-none focus:border-slate-400 resize-y select-text"
        />
      ) : (
        <div
          className="flex flex-col gap-2.5"
          role={isMultiple ? 'group' : 'radiogroup'}
          aria-label="作答选项"
        >
          {options.map((letter) => {
            const chosen = answer.selected.includes(letter);
            const correct = revealed && correctSet.has(letter);
            const wrong = revealed && chosen && !correctSet.has(letter);
            // 多选漏选：正确答案但未勾选，字母位改为「漏」字标记（错选仍用红色主题）
            const missed = revealed && isMultiple && correctSet.has(letter) && !chosen;
            return (
              <button
                key={letter}
                type="button"
                role={isMultiple ? 'checkbox' : 'radio'}
                aria-checked={chosen}
                disabled={revealed}
                title={missed ? '漏选' : undefined}
                onClick={() => toggleOption(letter)}
                className={`w-full text-left flex items-start gap-3 px-3.5 py-3 rounded-lg border transition-colors cursor-pointer disabled:cursor-default ${optionClass(
                  chosen,
                  correct,
                  wrong,
                  revealed
                )}`}
              >
                <span
                  className={`shrink-0 w-6 h-6 flex items-center justify-center text-[11px] font-medium border ${letterClass(
                    chosen,
                    correct,
                    wrong,
                    revealed,
                    isMultiple
                  )}`}
                >
                  {missed ? '漏' : letter}
                </span>
                <span className="text-[13.5px] leading-[1.7] text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">
                  {current.options?.[letter]}
                </span>
              </button>
            );
          })}
          {options.length === 0 && (
            <p className="text-xs text-slate-400">本题选项暂未收录，请查看原始资料。</p>
          )}
        </div>
      )}

      {/* 操作栏 */}
      {!revealed && (
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {isAnalysis
              ? '分析题对照参考要点自评'
              : isMultiple
                ? '多项选择 · 需全部选对才计为正确'
                : '单项选择 · 选择一个答案'}
          </span>
          <button
            onClick={submitAnswer}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold transition-colors cursor-pointer hover:bg-slate-700 dark:hover:bg-white disabled:opacity-40 disabled:cursor-default"
          >
            {isAnalysis ? '查看参考答案' : '提交答案'}
          </button>
        </div>
      )}

      {/* 答案与解析 */}
      {revealed && (
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
            {isAnalysis ? (
              <span className="text-amber-700 dark:text-amber-300">
                {answer.selfRated === true
                  ? '已标记掌握'
                  : answer.selfRated === false
                    ? '已加入待巩固'
                    : '对照参考要点自评'}
              </span>
            ) : isRight ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> 回答正确
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-red-700 dark:text-red-400">
                <XCircle className="w-4 h-4" /> 再想一遍这个知识点
              </span>
            )}
            {!isAnalysis && (
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                正确答案 {(current.answer || []).join('、')} · 你的答案{' '}
                {answer.selected.join('、') || '未选'}
              </span>
            )}
          </div>

          {(current.referenceAnswer || current.explanation) && (
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                {isAnalysis ? '参考作答要点' : '知识点解析'}
              </div>
              <p className="text-[13px] leading-[1.85] text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">
                {isAnalysis
                  ? current.referenceAnswer || current.explanation
                  : current.explanation}
              </p>
            </div>
          )}

          {isAnalysis && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                对照答案后自评：
              </span>
              <button
                onClick={() => rateAnalysis(true)}
                className={`px-3 py-1.5 rounded-md border text-[11px] cursor-pointer transition-colors ${
                  answer.selfRated === true
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                ✓ 已掌握
              </button>
              <button
                onClick={() => rateAnalysis(false)}
                className={`px-3 py-1.5 rounded-md border text-[11px] cursor-pointer transition-colors ${
                  answer.selfRated === false
                    ? 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                ↻ 继续巩固
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            {current.sourceUrl && /^https?:/i.test(current.sourceUrl) ? (
              <a
                href={current.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline underline-offset-2"
              >
                原始资料：{current.sourceTitle || current.year + ' 年真题'}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span />
            )}
            <button
              onClick={resetQuestion}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> 重新作答
            </button>
          </div>
        </div>
      )}

      {/* 上一题 / 下一题 */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setIndex((v) => Math.max(0, v - 1))}
          disabled={index === 0}
          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-40 disabled:cursor-default"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> 上一题
        </button>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {index === questions.length - 1 ? '已是最后一题' : '做完一题，停下来想一想'}
        </span>
        <button
          onClick={() => setIndex((v) => Math.min(questions.length - 1, v + 1))}
          disabled={index === questions.length - 1}
          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-white cursor-pointer disabled:opacity-40 disabled:cursor-default"
        >
          下一题 <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
