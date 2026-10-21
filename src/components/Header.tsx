import React from 'react';

interface HeaderProps {
  activePeriodId: number;
  onJumpToPeriod: (periodId: number) => void;
  onOpenStudyGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePeriodId,
  onJumpToPeriod,
  onOpenStudyGuide,
}) => {
  const periods = [
    { id: 0, name: '马克思主义' },
    { id: 1, name: '旧民主主义' },
    { id: 2, name: '新民主主义' },
    { id: 3, name: '土地革命' },
    { id: 4, name: '抗日战争' },
    { id: 5, name: '解放战争' },
    { id: 6, name: '新中国成立' },
    { id: 7, name: '改革开放与新时代' },
  ];

  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shrink-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 hover:opacity-85 transition-opacity"
      >
        马原·史纲全景时空画布 (1516—2024)
      </a>

      {/* Zone 2: 7 Periods Navigation - Active state is bold neutral text */}
      <nav className="hidden lg:flex items-center gap-5 text-xs xl:text-sm">
        {periods.map((p) => {
          const isActive = activePeriodId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onJumpToPeriod(p.id)}
              className={`transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'font-bold text-slate-950 dark:text-white bg-slate-200/85 dark:bg-slate-700/85 px-2.5 py-1 rounded-md shadow-xs'
                  : 'font-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-2 py-1'
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenStudyGuide}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          全纲导图指南
        </button>
      </div>
    </header>
  );
};
