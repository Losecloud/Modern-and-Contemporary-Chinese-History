/**
 * 把「知识卡片内嵌真题」的作答写入真题练习页所用的同一份本地记录，
 * 使错题本、练习数、正确率统计覆盖两个入口的练习过程。
 *
 * 键名与数据结构必须与 practice/app.js 完全一致（zhizheng-politics-v1），
 * 否则真题练习页读取时会被判为损坏数据。
 */
const STORAGE_KEY = 'zhizheng-politics-v1';

interface StoredRecord {
  selected?: string[];
  correct?: boolean | null;
  method?: 'self' | 'answer';
  at?: string;
  text?: string;
}

interface StoredState {
  records?: Record<string, StoredRecord>;
  favorites?: string[];
  drafts?: Record<string, unknown>;
  lastQuestionId?: string | null;
  version?: number;
}

function readState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as StoredState;
    }
  } catch {
    // 记录损坏时从空状态重建，不影响页面
  }
  return {};
}

export interface ExamRecordInput {
  selected?: string[];
  /** 客观题对错；分析题为 null，交由自评写入 */
  correct?: boolean | null;
  method: 'self' | 'answer';
  text?: string;
}

export function saveExamRecord(questionId: string, input: ExamRecordInput): void {
  try {
    const state = readState();
    const records = { ...(state.records || {}) };
    records[questionId] = {
      selected: (input.selected || []).filter((v) => /^[A-D]$/.test(v)),
      correct: typeof input.correct === 'boolean' ? input.correct : null,
      method: input.method,
      at: new Date().toISOString(),
      text: typeof input.text === 'string' ? input.text.slice(0, 100000) : '',
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        records,
        favorites: Array.isArray(state.favorites) ? state.favorites : [],
        drafts: state.drafts && typeof state.drafts === 'object' ? state.drafts : {},
        lastQuestionId: questionId,
        version: 1,
      })
    );
  } catch {
    // 存储不可用（无痕模式等）时静默降级，不阻断答题
  }
}

export interface StoredExamRecord {
  selected: string[];
  correct: boolean | null;
  text: string;
}

/** 读取指定题目的历史作答，用于卡片内回看时保持与真题练习页一致的状态 */
export function readExamRecords(ids: string[]): Record<string, StoredExamRecord> {
  const state = readState();
  const records = state.records || {};
  const out: Record<string, StoredExamRecord> = {};
  ids.forEach((id) => {
    const record = records[id];
    if (!record) return;
    out[id] = {
      selected: Array.isArray(record.selected)
        ? record.selected.filter((v) => /^[A-D]$/.test(v))
        : [],
      correct: typeof record.correct === 'boolean' ? record.correct : null,
      text: typeof record.text === 'string' ? record.text : '',
    };
  });
  return out;
}
