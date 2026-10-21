import React from 'react';
import {
  PERIOD_BOUNDARIES,
  TOTAL_CANVAS_WIDTH,
  CANVAS_HEIGHT,
  YEAR_TICKS,
} from '../utils/canvasLayout';
import { PERIODS } from '../data/historyData';

interface TimelineScaleProps {
  scrollLeft: number;
  onJumpToPeriod: (startX: number) => void;
  onJumpToX?: (x: number) => void;
}

export const TimelineScale = React.memo<TimelineScaleProps>(({
  onJumpToPeriod,
  onJumpToX,
}) => {

  return (
    <>
      {/* Background Swimlane Guide Lines across the entire horizontal canvas */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Horizontal lane backgrounds for 3 tracks */}
        <div
          style={{ top: '100px', height: '390px', width: `${TOTAL_CANVAS_WIDTH}px` }}
          className="absolute left-0 bg-red-500/[0.015] dark:bg-red-500/[0.025] border-y border-red-500/10 dark:border-red-500/20"
        />
        <div
          style={{ top: '500px', height: '380px', width: `${TOTAL_CANVAS_WIDTH}px` }}
          className="absolute left-0 bg-amber-500/[0.015] dark:bg-amber-500/[0.025] border-b border-amber-500/10 dark:border-amber-500/20"
        />
        {/* Track 3: 思想理论轨（拓高一倍至760px，包含上部史纲思想理论与下部马克思主义思想） */}
        <div
          style={{ top: '890px', height: '760px', width: `${TOTAL_CANVAS_WIDTH}px` }}
          className="absolute left-0 bg-emerald-500/[0.015] dark:bg-emerald-500/[0.025] border-b border-emerald-500/10 dark:border-emerald-500/20"
        >
          {/* 内部虚线分隔带与低调提示，清晰区分上部史纲理论与下部马原思想 */}
          <div
            style={{ top: '370px', width: '100%' }}
            className="absolute left-0 border-t border-dashed border-slate-300/80 dark:border-slate-700/60 flex items-center"
          >
            <div className="sticky left-14 -mt-2.5 px-2.5 py-0.5 rounded bg-slate-100/90 dark:bg-zinc-800/90 border border-slate-200/90 dark:border-zinc-700 text-[10px] text-slate-500 dark:text-zinc-400 select-none shadow-2xs">
              ↓ 马克思主义（思想）与科学社会主义经典著作
            </div>
          </div>
        </div>

        {/* Vertical period boundary dividers across full canvas height */}
        {PERIOD_BOUNDARIES.map((p) => (
          <div
            key={`divider-${p.id}`}
            style={{
              left: `${p.endX}px`,
              top: '0px',
              height: `${CANVAS_HEIGHT}px`,
            }}
            className="absolute border-r-2 border-dashed border-slate-300 dark:border-slate-700/80"
          >
            <div className="sticky top-28 -ml-3 mt-4 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap rotate-90 origin-left">
              时期交界分界
            </div>
          </div>
        ))}

        {/* Year vertical tick guide lines down into the canvas (strictly left-aligned with ruler tick t.x) */}
        {YEAR_TICKS.filter((t) => t.isKeyYear).map((t, idx) => (
          <div
            key={`year-guide-${t.year}-${idx}`}
            style={{
              left: `${t.x}px`,
              top: '90px',
              height: `${CANVAS_HEIGHT - 90}px`,
            }}
            className="absolute border-r border-dotted border-slate-200/80 dark:border-slate-800/70"
          />
        ))}
      </div>

      {/* Top Standard Timeline Ruler */}
      <div
        style={{ width: `${TOTAL_CANVAS_WIDTH}px`, height: '96px' }}
        className="sticky top-0 z-[999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex flex-col shadow-sm select-none"
      >
        {/* Row 1: Period Overview Banners across the canvas */}
        <div className="relative h-12 w-full border-b border-slate-100 dark:border-slate-800 overflow-hidden">
          {PERIOD_BOUNDARIES.map((boundary) => {
            const periodInfo = PERIODS.find((p) => p.id === boundary.id);
            return (
              <div
                key={boundary.id}
                style={{
                  position: 'absolute',
                  left: `${boundary.startX}px`,
                  width: `${boundary.width}px`,
                  height: '100%',
                }}
                className="px-4 py-1.5 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                onClick={() => onJumpToPeriod(boundary.startX)}
                title="点击对齐到此时期"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: boundary.accentColor }}
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
                    {boundary.title}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    ({boundary.yearRange})
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="hidden xl:inline truncate max-w-sm">{boundary.theme}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Row 2: Standard Detailed Year Ticks Bar (Every year 1920, 1921, 1922... 1992 labeled) */}
        <div className="relative h-12 w-full flex items-center bg-slate-50/70 dark:bg-slate-900/60">
          {YEAR_TICKS.map((t, idx) => (
            <div
              key={`tick-${t.year}-${idx}`}
              style={{
                position: 'absolute',
                left: `${t.x}px`,
                top: 0,
                bottom: 0,
              }}
              onClick={() => onJumpToX && onJumpToX(t.x)}
              className="flex flex-col justify-between py-1 cursor-pointer group"
              title={`年份: ${t.year}`}
            >
              <div className="flex items-center gap-1">
                <span
                  className={`text-[11px] font-mono tabular-nums font-semibold transition-colors ${
                    t.isKeyYear
                      ? 'text-slate-800 dark:text-slate-200 font-bold'
                      : 'text-slate-400 dark:text-slate-500'
                  } group-hover:text-amber-600`}
                >
                  {t.year}
                </span>
              </div>
              <div
                className={`w-[1.5px] ${
                  t.isKeyYear
                    ? 'h-3 bg-slate-600 dark:bg-slate-300'
                    : 'h-1.5 bg-slate-300 dark:bg-slate-600'
                } group-hover:bg-amber-500`}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
});
