import React from 'react';
import { X, BookOpen, GitFork, ArrowRight, Lightbulb } from 'lucide-react';
import { PERIODS } from '../data/historyData';

interface StudyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToPeriod: (periodId: number) => void;
  onSelectEvent: (eventId: string) => void;
}

export const StudyGuideModal: React.FC<StudyGuideModalProps> = ({
  isOpen,
  onClose,
  onJumpToPeriod,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                中国近现代史纲要全景逻辑脉络 (1840 — 2024)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                涵盖从鸦片战争到二十届三中全会全史实、四大水平阅读连贯轨道与七大历史时期
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          {/* Guide 1: Four Horizontal Tracks */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GitFork className="w-4 h-4 text-amber-600" />
              <span>一、三大横向轨道的宏大逻辑体系</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20">
                <span className="text-xs font-bold text-red-700 dark:text-red-400 block mb-1">
                  1. 核心会议轨（第一排决策主轴）
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  洋务中体西用 → 戊戌变法维新 → 同盟会建立（三民主义） → 南京临时政府（《临时约法》） → 中共早期组织与一大（最高纲领） → 二大（反帝反封纲领） → 三大与国民党一大（国共合作） → 四大（领导权与工农同盟） → 八七会议（枪杆子夺政权） → 六大（争取群众） → 遵义会议（走向政治成熟） → 瓦窑堡会议（统一战线新政策） → 洛川会议（全面抗战） → 六届六中（马克思主义中国化） → 七大（毛泽东思想写入党章） → 重庆谈判与旧政协 → 七届二中（两个务必、重心转移城市） → 一届政协（《共同纲领》） → 七届三中（三年恢复） → 中共八大（主要矛盾分析） → 八届九中（八字方针） → 十一届三中（伟大转折） → 十一届六中（历史决议与活的灵魂） → 十二大（中国特色社会主义） → 十三大（初级阶段） → 十四大（市场经济） → 十五大至十七大 → 十八大进入新时代 → 十九大与百年大会 → 二十大与二十届三中全会（推进中国式现代化）。
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-1">
                  2. 革命武装斗争轨（第二排实践铁血支撑）
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  三元里抗英（近代第一次大规模反侵略武装） → 太平天国金田起义（旧式农民战争最高峰） → 甲午海战破产 → 黄花岗起义与武昌起义（推翻清王朝） → 五四爱国运动（新民主主义开端） → 早期工运罢工高潮 → 五卅运动与省港大罢工 → 北伐战争胜利进军 → 南昌起义（打响第一枪/建军开端） → 秋收起义与广州起义 → 三湾改编（支部建在连上） → 井冈山革命根据地（工农武装割据星火） → 中华苏维埃政权建立 → 红军长征 → 九一八率先抗战 → 平型关大捷与台儿庄战役 → 解放战争三阶段（挺进大别山进攻序幕与三大战役战略决战） → 第二条战线学生民主运动。
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                  3. 思想理论、经典著作与经验教训轨（第三排理论升华与规律总结）
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  两半社会特征与救亡探索（睁眼看世界、《天朝田亩制度》《资政新篇》《革命军》《新青年》） → 早期思想萌芽（《中国社会各阶级的分析》、大革命失败深刻教训总结） → 革命道路理论与土地纲领（《井冈山土地法》《兴国土地法》《星星之火》《反对本本主义》、三次“左倾”错误剖析） → 毛泽东思想成熟与整风文献（《实践论》《矛盾论》《论持久战》《新民主主义论》《改造我们的学习》《历史决议》） → 建国纲领与探索（《五四指示》《土地法大纲》《论人民民主专政》《论十大关系》《正确处理人民内部矛盾》、七千人大会民主反思） → 改革开放与中国式现代化创新（真理标准大讨论、《解放思想实事求是》、四项基本原则、十一届六中全会决议、南方谈话、建党百年决议与全面深化改革决定）。
                </p>
              </div>
            </div>
          </div>

          {/* Guide 2: Period Quick Jumps */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>二、八大历史时期全景快速跳跃导航（含序篇马克思主义）</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PERIODS.map((period) => (
                <div
                  key={period.id}
                  onClick={() => {
                    onJumpToPeriod(period.id);
                    onClose();
                  }}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-amber-50/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {period.title.split('（')[0]}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mb-1">
                    {period.yearRange}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {period.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            开始浏览画布
          </button>
        </div>
      </div>
    </div>
  );
};
