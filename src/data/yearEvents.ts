/**
 * 年份—事迹对照表
 *
 * 用途：在「宽关键词匹配」之外补充时间维度。真题题干、考点标签中出现下表事迹时，
 * 即可推断该题所讲历史时段；与知识卡片自身年份窗比对后，可剔除关键词撞车但年代明显不符的题目
 * （例如 1939 年著作群卡片命中 1949 年后的过渡时期题）。
 *
 * 维护约定：
 * - 只登记有明确年份、且题干中可能原样出现的事迹写法；
 * - 持续阶段用 endYear 表示；
 * - 关键词要足够独特，避免「革命」「建设」这类泛词。
 */
export interface YearEventEntry {
  /** 起始年份（单年事件只写 year） */
  year: number;
  /** 持续事件的结束年份 */
  endYear?: number;
  /** 事迹名称，用于对照查阅 */
  label: string;
  /** 题干/考点中可能出现的写法 */
  keywords: string[];
}

export const YEAR_EVENTS: YearEventEntry[] = [
  { year: 1840, endYear: 1842, label: '第一次鸦片战争 ·《南京条约》', keywords: ['第一次鸦片战争', '鸦片战争', '南京条约'] },
  { year: 1851, endYear: 1864, label: '太平天国运动', keywords: ['太平天国', '金田起义', '天朝田亩制度', '资政新篇'] },
  { year: 1856, endYear: 1860, label: '第二次鸦片战争', keywords: ['第二次鸦片战争', '火烧圆明园'] },
  { year: 1861, endYear: 1895, label: '洋务运动', keywords: ['洋务运动', '洋务派', '江南制造总局', '北洋水师'] },
  { year: 1894, endYear: 1895, label: '甲午中日战争 ·《马关条约》', keywords: ['甲午中日战争', '甲午战争', '马关条约', '黄海海战'] },
  { year: 1898, label: '戊戌变法', keywords: ['戊戌变法', '戊戌维新', '戊戌维新运动', '维新运动', '维新派', '百日维新'] },
  { year: 1900, endYear: 1901, label: '义和团运动 · 八国联军侵华', keywords: ['义和团', '八国联军', '辛丑条约'] },
  { year: 1905, label: '中国同盟会成立 · 三民主义', keywords: ['中国同盟会', '同盟会', '三民主义'] },
  { year: 1911, endYear: 1912, label: '辛亥革命 · 中华民国建立', keywords: ['辛亥革命', '武昌起义', '中华民国', '清帝退位', '临时约法'] },
  { year: 1915, endYear: 1923, label: '新文化运动', keywords: ['新文化运动', '新青年', '德先生', '赛先生'] },
  { year: 1917, label: '十月革命', keywords: ['十月革命', '布尔什维克'] },
  { year: 1919, label: '五四运动', keywords: ['五四运动', '巴黎和会'] },
  { year: 1920, label: '中国共产党早期组织', keywords: ['早期马克思主义者', '中国共产党早期组织', '共产党早期组织'] },
  { year: 1921, label: '中国共产党成立 · 中共一大', keywords: ['中共一大', '党的第一次全国代表大会', '中国共产党成立'] },
  { year: 1922, label: '中共二大', keywords: ['中共二大', '党的二大'] },
  { year: 1923, label: '中共三大', keywords: ['中共三大', '党的三大'] },
  { year: 1924, endYear: 1927, label: '大革命 · 第一次国共合作', keywords: ['大革命', '国民革命', '北伐战争', '第一次国共合作', '国民党一大'] },
  { year: 1925, label: '五卅运动', keywords: ['五卅运动', '五卅', '省港大罢工'] },
  { year: 1927, label: '大革命失败 · 武装起义 · 井冈山', keywords: ['南昌起义', '八七会议', '秋收起义', '井冈山革命根据地', '四一二反革命政变', '七一五反革命政变'] },
  { year: 1927, endYear: 1937, label: '土地革命战争', keywords: ['土地革命战争', '十年内战'] },
  { year: 1928, label: '井冈山土地法', keywords: ['井冈山土地法'] },
  { year: 1929, label: '古田会议', keywords: ['古田会议'] },
  { year: 1931, endYear: 1945, label: '九一八事变 · 十四年抗战', keywords: ['九一八事变', '十四年抗战'] },
  { year: 1931, label: '中华苏维埃共和国成立', keywords: ['中华苏维埃'] },
  { year: 1934, endYear: 1936, label: '红军长征', keywords: ['长征', '四渡赤水', '爬雪山', '过草地'] },
  { year: 1935, label: '遵义会议 · 瓦窑堡会议', keywords: ['遵义会议', '瓦窑堡会议'] },
  { year: 1935, endYear: 1948, label: '延安时期（中共中央在陕北）', keywords: ['延安'] },
  { year: 1936, label: '西安事变', keywords: ['西安事变'] },
  { year: 1937, endYear: 1945, label: '全面抗战', keywords: ['七七事变', '卢沟桥事变', '全面抗战', '抗日战争', '抗战胜利'] },
  { year: 1938, label: '《论持久战》', keywords: ['论持久战'] },
  { year: 1939, label: '《〈共产党人〉发刊词》·《中国革命和中国共产党》', keywords: ['共产党人发刊词', '中国革命和中国共产党'] },
  { year: 1940, label: '《新民主主义论》· 百团大战', keywords: ['新民主主义论', '百团大战'] },
  { year: 1941, label: '皖南事变', keywords: ['皖南事变'] },
  { year: 1942, endYear: 1945, label: '延安整风', keywords: ['延安整风', '整风运动'] },
  { year: 1943, label: '《开罗宣言》', keywords: ['开罗宣言'] },
  { year: 1945, label: '中共七大 ·《论联合政府》· 抗战胜利', keywords: ['中共七大', '党的七大', '论联合政府', '抗日战争胜利', '抗战胜利', '波茨坦公告'] },
  { year: 1945, endYear: 1946, label: '重庆谈判 · 双十协定', keywords: ['重庆谈判', '双十协定'] },
  { year: 1946, endYear: 1949, label: '解放战争', keywords: ['解放战争', '三大战役', '渡江战役', '辽沈战役', '淮海战役', '平津战役'] },
  { year: 1946, label: '全面内战爆发', keywords: ['全面内战'] },
  { year: 1947, label: '《中国土地法大纲》· 五四指示', keywords: ['中国土地法大纲', '五四指示'] },
  { year: 1949, label: '七届二中全会 · 新中国成立', keywords: ['七届二中全会', '中国人民政治协商会议', '开国大典', '中华人民共和国成立', '新中国成立'] },
  { year: 1949, endYear: 1956, label: '过渡时期 · 新民主主义社会', keywords: ['过渡时期', '新民主主义社会', '从新民主主义到社会主义'] },
  { year: 1950, endYear: 1953, label: '抗美援朝', keywords: ['抗美援朝', '朝鲜战争'] },
  { year: 1950, endYear: 1952, label: '新解放区土地改革', keywords: ['中华人民共和国土地改革法', '新解放区土地改革', '土地改革法'] },
  { year: 1953, label: '第一个五年计划 · 过渡时期总路线', keywords: ['第一个五年计划', '一五计划', '过渡时期总路线'] },
  { year: 1953, endYear: 1956, label: '社会主义改造 · 三大改造', keywords: ['社会主义改造', '三大改造', '农业合作化', '公私合营', '赎买政策'] },
  { year: 1954, label: '第一届全国人大 · 第一部宪法', keywords: ['第一届全国人民代表大会', '一届人大', '第一部宪法', '五四宪法'] },
  { year: 1956, label: '《论十大关系》· 中共八大', keywords: ['论十大关系', '中共八大', '党的八大'] },
  { year: 1957, label: '《关于正确处理人民内部矛盾的问题》', keywords: ['正确处理人民内部矛盾', '人民内部矛盾'] },
  { year: 1958, endYear: 1960, label: '大跃进 · 人民公社化', keywords: ['大跃进', '人民公社'] },
  { year: 1961, label: '八字方针', keywords: ['八字方针', '调整巩固充实提高'] },
  { year: 1966, endYear: 1976, label: '文化大革命', keywords: ['文化大革命', '文革'] },
  { year: 1971, label: '恢复联合国合法席位', keywords: ['恢复联合国合法席位', '联合国合法席位'] },
  { year: 1972, label: '尼克松访华 · 中美关系正常化', keywords: ['尼克松访华', '中美关系正常化', '中美建交'] },
  { year: 1978, endYear: 2026, label: '改革开放和社会主义现代化建设新时期', keywords: ['改革开放', '十一届三中全会'] },
  { year: 1982, label: '中共十二大 · 八二宪法', keywords: ['中共十二大', '党的十二大', '八二宪法', '1982年宪法'] },
  { year: 1987, label: '中共十三大', keywords: ['中共十三大', '党的十三大'] },
  { year: 1992, label: '南方谈话 · 中共十四大', keywords: ['南方谈话', '中共十四大', '党的十四大'] },
  { year: 1997, label: '中共十五大 · 香港回归', keywords: ['中共十五大', '党的十五大', '香港回归'] },
  { year: 2001, label: '加入世界贸易组织', keywords: ['加入世界贸易组织', '加入WTO'] },
  { year: 2002, label: '中共十六大', keywords: ['中共十六大', '党的十六大'] },
  { year: 2007, label: '中共十七大', keywords: ['中共十七大', '党的十七大'] },
  { year: 2012, endYear: 2026, label: '中国特色社会主义新时代', keywords: ['新时代', '中共十八大', '党的十八大'] },
  { year: 2017, label: '中共十九大', keywords: ['中共十九大', '党的十九大'] },
  { year: 2018, label: '改革开放40周年', keywords: ['改革开放40周年', '改革开放四十周年'] },
  { year: 2019, label: '新中国成立70周年', keywords: ['新中国成立70周年', '新中国成立七十周年'] },
  { year: 2021, label: '中国共产党成立100周年', keywords: ['建党百年', '建党100周年', '中国共产党成立100周年'] },
  { year: 2022, label: '中共二十大', keywords: ['中共二十大', '党的二十大'] },
];

export interface YearSpan {
  start: number;
  end: number;
  label: string;
}

/** 去掉空白与书名号/引号，避免《新民主主义论》这类写法因符号差异漏配 */
const normalizeText = (value: string) =>
  (value || '').replace(/\s+/g, '').replace(/[《》〈〉<>「」“”"']/g, '');

/**
 * 从题干/考点文本推断提到的事迹时段，可能返回多条。
 * 只要其中一条与卡片年份窗相交，即视为时间上可以匹配。
 */
export function inferYearSpans(text: string): YearSpan[] {
  const content = normalizeText(text);
  if (!content) return [];

  const spans: YearSpan[] = [];
  // 「大革命」是「文化大革命」的子串，需排除后者，避免 1966—1976 的题被误判为 1924—1927
  const haystack = content.replace(/文化大革命/g, '');
  YEAR_EVENTS.forEach((entry) => {
    const pool = entry.keywords.includes('大革命') ? haystack : content;
    if (entry.keywords.some((keyword) => pool.includes(normalizeText(keyword)))) {
      spans.push({ start: entry.year, end: entry.endYear ?? entry.year, label: entry.label });
    }
  });

  // 题干里直接写明的年份也是可靠时间信号（如「1939年10月」「1945年4月」）
  (content.match(/(\d{4})年/g) || []).forEach((token) => {
    const year = Number(token.replace('年', ''));
    if (year >= 1840 && year <= 2030) {
      spans.push({ start: year, end: year, label: `${year}年` });
    }
  });

  return spans;
}
