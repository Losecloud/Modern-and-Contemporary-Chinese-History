import { HistoryEvent } from '../types/history';
import { inferYearSpans, YearSpan } from '../data/yearEvents';

export type ExamQuestionType = 'single' | 'multiple' | 'analysis';

export interface ExamQuestion {
  id: string;
  year: number;
  number: number;
  type: ExamQuestionType;
  subject: string;
  topic: string;
  tags: string[];
  stem: string;
  options: Record<string, string> | null;
  answer: string[] | null;
  explanation: string | null;
  referenceAnswer: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  knowledgePoint: string | null;
}

/** 题库命中的题目附带命中依据，便于界面说明匹配逻辑 */
export interface MatchedExamQuestion extends ExamQuestion {
  matchReason?: string;
}

interface ExamData {
  questions?: ExamQuestion[];
}

let loader: Promise<ExamQuestion[]> | null = null;

/** 懒加载真题题库脚本（与真题练习页共用同一份数据文件） */
export function loadExamQuestions(): Promise<ExamQuestion[]> {
  const cached = (window as unknown as { __EXAM_DATA__?: ExamData }).__EXAM_DATA__;
  if (cached?.questions?.length) return Promise.resolve(cached.questions);
  if (loader) return loader;

  loader = new Promise<ExamQuestion[]>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('practice/questions-data.js', document.baseURI).href;
    script.async = true;
    script.onload = () => {
      const data = (window as unknown as { __EXAM_DATA__?: ExamData }).__EXAM_DATA__;
      if (data?.questions?.length) resolve(data.questions);
      else reject(new Error('题库格式不正确'));
    };
    script.onerror = () => reject(new Error('题库加载失败'));
    document.head.appendChild(script);
  }).catch((err) => {
    loader = null;
    throw err;
  });

  return loader;
}

const normalize = (value: string) => (value || '').replace(/\s+/g, '').toLowerCase();

/** 去掉括注与书名号，便于把卡片标题当检索词 */
const cleanTitle = (value: string) =>
  normalize(value)
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[《》「」“”"']/g, '');

/**
 * 卡片标题 → 真题常用说法。
 * 只登记「同一考点在题目里的另一种写法」，不登记上位概念。
 */
const TITLE_ALIASES: Record<string, string[]> = {
  德法年鉴: ['德法年鉴'],
  西里西亚: ['西里西亚'],
  神圣家族: ['神圣家族'],
  费尔巴哈: ['费尔巴哈'],
  哲学的贫困: ['哲学的贫困'],
  第一国际: ['第一国际', '国际工人协会'],
  资本论: ['资本论'],
  巴黎公社: ['巴黎公社'],
  哥达纲领批判: ['哥达纲领批判'],
  反杜林论: ['反杜林论'],
  一国胜利论: ['一国胜利', '一国首先胜利'],
  战时共产主义: ['战时共产主义'],
  新经济政策: ['新经济政策'],
  苏联模式: ['苏联模式', '斯大林模式'],
  三元里: ['三元里'],
  太平天国: ['太平天国', '金田起义'],
  天朝田亩制度: ['天朝田亩制度', '资政新篇'],
  辛丑条约: ['辛丑条约', '清末新政'],
  章炳麟: ['章炳麟', '邹容', '陈天华', '革命军', '警世钟', '猛回头'],
  武昌起义: ['武昌起义', '辛亥革命'],
  孙中山: ['孙中山', '护法运动', '二次革命'],
  衙前: ['衙前'],
  中共二大: ['中共二大', '党的二大'],
  中共三大: ['中共三大', '党的三大'],
  中共四大: ['中共四大', '党的四大'],
  五卅运动: ['五卅运动', '五卅', '省港大罢工'],
  黄埔军校: ['黄埔军校'],
  中共六大: ['中共六大', '党的六大'],
  中华苏维埃: ['中华苏维埃'],
  土地法: ['井冈山土地法', '兴国土地法'],
  左倾: ['左倾', '王明', '瞿秋白', '李立三'],
  九一八: ['九一八'],
  百团大战: ['百团大战'],
  五届三中全会: ['五届三中全会'],
  七届三中全会: ['七届三中全会'],
  八届九中全会: ['八届九中全会', '八字方针'],
  十二届三中全会: ['十二届三中全会'],
  十六大: ['十六大', '十七大'],
  第三次科技革命: ['第三次科技革命', '新科技革命'],
  论十大关系: ['论十大关系'],
  实践论: ['实践论'],
  矛盾论: ['矛盾论'],
  十月革命: ['十月革命'],
  魏源: ['魏源', '海国图志'],
  第一次世界大战: ['第一次世界大战'],
  井冈山: ['井冈山'],
  十三大: ['十三大'],
  五四指示: ['五四指示'],
  关于正确处理人民内部矛盾: ['正确处理人民内部矛盾'],
};

/** 过于泛化、几乎每题都出现的词不能当锚点 */
const GENERIC_TERMS = new Set([
  '中国共产党', '马克思主义', '社会主义', '毛泽东', '中国革命', '中国人民',
  '中国特色社会主义', '革命', '建设', '发展', '历史', '社会', '国家', '人民', '中国',
]);

/**
 * 上位概念：它们是整章/整门课的名称，不是某张卡片要记的具体知识点。
 * 出现在卡片标签或考点结论里时不能作为筛题依据，否则会把整章题目都拉进来。
 */
const UMBRELLA_TERMS = new Set([
  '毛泽东思想', '邓小平理论', '三个代表', '三个代表重要思想', '科学发展观',
  '习近平新时代中国特色社会主义思想', '马克思主义中国化', '马克思主义中国化时代化',
  '中国特色社会主义理论体系', '新民主主义革命理论', '社会主义改造理论',
  '中国式现代化', '四个自信', '五位一体', '四个全面',
]);

function aliasAnchors(event: HistoryEvent): string[] {
  const title = cleanTitle(event.title);
  const out: string[] = [];
  Object.keys(TITLE_ALIASES).forEach((key) => {
    if (title.includes(normalize(key))) {
      TITLE_ALIASES[key].forEach((alias) => out.push(normalize(alias)));
    }
  });
  return out;
}

/**
 * 只从标题派生锚点——标题才是「这张卡片要记的事」。
 * 形如「毛泽东:《论联合政府》」的标题会拆成独立段，避免拼出「毛泽东:论联合」这类噪声。
 */
function titleAnchorsOf(event: HistoryEvent): string[] {
  const title = cleanTitle(event.title);
  const segments = title
    .split(/[与和、:：]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out = new Set<string>();

  [title, ...segments].forEach((segment) => {
    if (segment.length >= 4 && segment.length <= 24) out.add(segment);
    // 「中共X大」与「党的X大」互为常见写法
    const partyCong = segment.match(/^中共(.+大)$/);
    if (partyCong) {
      out.add('党的' + partyCong[1]);
      out.add('中共' + partyCong[1]);
    }
    const partyDe = segment.match(/^党的(.+大)$/);
    if (partyDe) {
      out.add('中共' + partyDe[1]);
      out.add('党的' + partyDe[1]);
    }
    // 长描述性标题取前缀，覆盖「太平天国农民起义」→「太平天国」
    if (segment.length >= 6) {
      [6, 5, 4].forEach((n) => {
        if (segment.length > n) out.add(segment.slice(0, n));
      });
    }
  });

  // 别名是人工登记的精确写法（如「资本论」只有三个字），不受长度下限约束
  const aliases = aliasAnchors(event).filter((t) => !GENERIC_TERMS.has(t));
  // 卡片标签是人工标注的知识点，与标题同属「这张卡要记什么」，排除上位概念后可用
  const tags = (event.tags || [])
    .map((tag) => normalize(tag))
    .filter(
      (t) => t.length >= 3 && !GENERIC_TERMS.has(t) && !UMBRELLA_TERMS.has(t)
    );
  return [...new Set([...out, ...aliases, ...tags])].filter(
    (t) => t.length >= 3 && !GENERIC_TERMS.has(t)
  );
}

/** 正文依据（高亮、标签、考点结论）：只用于排序加成，不能单独决定取题 */
function secondaryAnchorsOf(event: HistoryEvent): string[] {
  const list: string[] = [];
  (event.items || []).forEach((item) => {
    (item.highlights || []).forEach((h) => {
      const t = normalize(h);
      if (t.length >= 4) list.push(t);
    });
  });
  const quotes = String(event.examSummary || '').match(/[「“"]([^」”"]{4,24})[」”"]/g) || [];
  quotes.forEach((quote) => {
    const t = normalize(quote.replace(/[「”"”」]/g, ''));
    if (t.length >= 4) list.push(t);
  });
  return [...new Set(list)].filter(
    (t) => !GENERIC_TERMS.has(t) && !UMBRELLA_TERMS.has(t)
  );
}

/** 按卡片的学科归属限定题库范围，避免马原卡片混入史纲题 */
function subjectsFor(event: HistoryEvent): string[] {
  const isMarx = Boolean(
    event.isScientificSocialism || event.category === 'marxism' || event.periodId === 0
  );
  if (isMarx) return ['马原'];
  if (event.periodId === 7) return ['史纲', '毛中特', '新思想'];
  return ['史纲', '毛中特'];
}

/**
 * 按知识卡片匹配真题，以「卡片标题所指的那件事」为中心：
 * 1. 标题锚点命中才可取题，命中位置限于题干或题目的知识点标签；
 * 2. 正文锚点（标签、高亮、考点结论）只做排序加成，且需题干里同时命中两条才可作为补充；
 * 3. 上位概念词（毛泽东思想、中国特色社会主义理论体系等）一律不作为筛题依据。
 */
export function pickExamQuestions(
  event: HistoryEvent,
  questions: ExamQuestion[],
  limit = 6
): MatchedExamQuestion[] {
  return pickFromIndex(event, questions, buildQuestionIndex(questions), limit);
}

/** 题库归一化索引：批量算卡片真题数时只处理一次，避免逐卡重复归一化 760 道题干 */
interface QuestionIndex {
  stems: string[];
  labels: string[];
  timeSpans: YearSpan[][];
  focusSpans: YearSpan[][];
}

function buildQuestionIndex(questions: ExamQuestion[]): QuestionIndex {
  return {
    stems: questions.map((q) => normalize(q.stem)),
    labels: questions.map((q) =>
      normalize((q.knowledgePoint || '') + '|' + (q.tags || []).join('|'))
    ),
    timeSpans: questions.map((q) =>
      inferYearSpans(
        [q.stem, q.topic, q.knowledgePoint, ...(q.tags || [])].join('|')
      )
    ),
    // 考点/标签指向的年代更能代表题目主体；题干里的年代可能只是背景材料。
    // 不纳入 topic：topic 是题库章节名（如「中国共产党成立与大革命」），会把整章题都推断成章节起始年。
    focusSpans: questions.map((q) =>
      inferYearSpans(
        [q.knowledgePoint, ...(q.tags || [])].join('|')
      )
    ),
  };
}

/** 卡片自身的历史年份窗；马原卡片（periodId 0）不参与时间匹配 */
function cardYearSpanOf(event: HistoryEvent): YearSpan | null {
  if (event.periodId === 0) return null;
  const years = (event.dateStr || '').match(/\d{4}/g)?.map(Number) || [];
  if (years.length) {
    return { start: Math.min(...years), end: Math.max(...years), label: event.dateStr };
  }
  if (Number.isFinite(event.year)) {
    const year = Math.floor(event.year);
    return { start: year, end: year, label: String(year) };
  }
  return null;
}

/** 年份相邻容许量：允许紧邻年代作为背景材料被一并练习 */
const YEAR_TOLERANCE = 1;

/**
 * 锚点包含判断：中文届次编号存在「十」前缀子串问题，
 * 如「七届三中全会」会命中「十七届三中全会」、「八大」会命中「十八大」。
 * 锚点以中文数字开头时，若匹配位置前一字符是「十」，视为不同届次，跳过该次命中。
 */
function anchorIncludes(text: string, anchor: string): boolean {
  if (!text || !anchor) return false;
  const needsBoundary = /^[一二三四五六七八九]/.test(anchor);
  let from = 0;
  while (from <= text.length - anchor.length) {
    const at = text.indexOf(anchor, from);
    if (at === -1) return false;
    if (!needsBoundary || at === 0 || text[at - 1] !== '十') return true;
    from = at + 1;
  }
  return false;
}

/** 批量计算每张卡片可练习的真题数量，供卡片右上角真题入口显示 */
export function computeExamCounts(
  events: HistoryEvent[],
  questions: ExamQuestion[],
  limit = 6
): Record<string, number> {
  const index = buildQuestionIndex(questions);
  const counts: Record<string, number> = {};
  events.forEach((event) => {
    counts[event.id] = pickFromIndex(event, questions, index, limit).length;
  });
  return counts;
}

function pickFromIndex(
  event: HistoryEvent,
  questions: ExamQuestion[],
  index: QuestionIndex,
  limit = 6
): MatchedExamQuestion[] {
  const primary = titleAnchorsOf(event);
  const secondary = secondaryAnchorsOf(event);
  if (!primary.length && !secondary.length) return [];
  const allowed = subjectsFor(event);
  const cardSpan = cardYearSpanOf(event);

  const { stems, labels, timeSpans, focusSpans } = index;
  const dfCache = new Map<string, number>();
  const df = (anchor: string) => {
    const cached = dfCache.get(anchor);
    if (cached !== undefined) return cached;
    const count = stems.filter((s) => anchorIncludes(s, anchor)).length;
    dfCache.set(anchor, count);
    return count;
  };
  // 越短的词越容易撞车，用文档频率上限压制泛词
  const maxDf = (anchor: string) =>
    anchor.length <= 3 ? 25 : anchor.length === 4 ? 45 : anchor.length === 5 ? 60 : 80;

  const results: { question: MatchedExamQuestion; score: number }[] = [];

  questions.forEach((question, index) => {
    if (!allowed.includes(question.subject)) return;

    // 时间匹配：题目能推断出的年代与卡片年份窗全不相交时直接排除；
    // 推断不出年代的题目仍沿用宽关键词匹配，不做时间否决。
    if (cardSpan) {
      const focused = focusSpans[index];
      const spans = focused.length ? focused : timeSpans[index];
      const timeMatched =
        !spans.length ||
        spans.some(
          (span) =>
            span.start <= cardSpan.end + YEAR_TOLERANCE &&
            span.end >= cardSpan.start - YEAR_TOLERANCE
        );
      if (!timeMatched) return;
    }

    const stem = stems[index];
    const label = labels[index];

    let score = 0;
    const primaryStem: string[] = [];
    const primaryLabel: string[] = [];
    const secondaryStem: string[] = [];
    let secondaryLabel = '';

    primary.forEach((anchor) => {
      // df 护栏只压题干撞车；考点标签是人工标注的精确知识点，短词也可直接命中
      if (anchorIncludes(stem, anchor) && !(df(anchor) > maxDf(anchor) && anchor.length <= 4)) {
        score += 3 * (Math.min(anchor.length, 10) / 4);
        primaryStem.push(anchor);
      }
      if (anchorIncludes(label, anchor)) {
        score += 2.5;
        primaryLabel.push(anchor);
      }
    });

    secondary.forEach((anchor) => {
      if (df(anchor) > maxDf(anchor)) return;
      if (anchorIncludes(stem, anchor)) {
        score += Math.min(anchor.length, 12) / 8;
        secondaryStem.push(anchor);
      } else if (anchorIncludes(label, anchor)) {
        score += 0.5;
        if (!secondaryLabel) secondaryLabel = anchor;
      }
    });

    // 取题门槛：标题锚点命中，或题干里同时命中两条正文关键词
    const admitted =
      primaryStem.length > 0 ||
      primaryLabel.length > 0 ||
      secondaryStem.length >= 2;
    if (!admitted || score <= 0) return;

    const reason =
      primaryStem[0] || primaryLabel[0] || secondaryStem[0] || secondaryLabel;
    results.push({ question: { ...question, matchReason: reason }, score });
  });

  // 先按匹配度取题，再把选中题目按「单选 → 多选 → 分析」的练习顺序排布
  const chosen = results
    .sort((a, b) => b.score - a.score || b.question.year - a.question.year)
    .slice(0, limit)
    .map((item) => item.question);

  const typeOrder: Record<string, number> = {
    single: 0,
    multiple: 1,
    analysis: 2,
  };
  return chosen.sort(
    (a, b) => (typeOrder[a.type] ?? 3) - (typeOrder[b.type] ?? 3)
  );
}
