import React from 'react';
import { Info, Pencil, Check, Sun, Moon } from 'lucide-react';

export type MainView = 'canvas' | 'practice';

interface HeaderProps {
  view: MainView;
  onViewChange: (view: MainView) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenStudyGuide: () => void;
  /** 是否处于编辑模式（编辑模式下按钮变为保存 √） */
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  view,
  onViewChange,
  theme,
  onToggleTheme,
  onOpenStudyGuide,
  isEditMode,
  onToggleEditMode,
}) => {
  const viewButtonClass = (target: MainView) =>
    `px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
      view === target
        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
    }`;

  return (
    <header className="c66">
      {/* Zone 1: Single text element wordmark + 主视图切换 */}
      <div className="c5 gap-5 min-w-0">
        <a href="#" className="c67">
          马原·史纲全景时空画布 (1516—2026)
        </a>
        <div className="c5 gap-0.5 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 shrink-0">
          <button onClick={() => onViewChange('canvas')} className={viewButtonClass('canvas')}>
            无限画布
          </button>
          <button onClick={() => onViewChange('practice')} className={viewButtonClass('practice')}>
            真题练习
          </button>
        </div>
      </div>

      {/* Zone 3: 深浅模式切换（两视图共用）+ 画布视图的编辑与指南入口 */}
      <div className="c5 gap-1">
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-md transition-colors cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        {view === 'canvas' && (
          <>
            <button
              onClick={onToggleEditMode}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isEditMode
                  ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isEditMode ? '保存卡片宽度调整' : '编辑模式：拖拽卡片右边界调整宽度'}
            >
              {isEditMode ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            </button>
            <button
              onClick={onOpenStudyGuide}
              className="p-1.5 rounded-md transition-colors cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="全纲导图指南"
            >
              <Info className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};
