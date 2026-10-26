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
  /** 是否渲染画布内的泳道背景引导线（固定时间轴层只渲染刻度条） */
  showGuides?: boolean;
  /** 是否渲染顶部刻度条（画布缩放层内只保留引导线） */
  showRuler?: boolean;
}

export const TimelineScale = React.memo<TimelineScaleProps>(({
  onJumpToPeriod,
  onJumpToX,
  showGuides = true,
  showRuler = true,
}) => {

  return (
    <>
      {/* Background Swimlane Guide Lines across the entire horizontal canvas */}
      <div className={showGuides ? 'c85' : 'hidden'}>
        {/* Horizontal lane backgrounds for 3 tracks */}
        <div
          style={{ top: '100px', height: '390px', width: `${TOTAL_CANVAS_WIDTH}px` }}
          className="c91 c88"
        />
        <div
          style={{ top: '500px', height: '380px', width: `${TOTAL_CANVAS_WIDTH}px` }}
          className="c92 c88"
        />
        {/* Track 3: 思想理论轨（拓高一倍至760px，包含上部史纲思想理论与下部马克思主义思想） */}
        <div
          style={{ top: '890px', height: '760px', width: `${TOTAL_CANVAS_WIDTH}px` }}
          className="c93 c88"
        >
          {/* 内部虚线分隔带与低调提示，清晰区分上部史纲理论与下部马原思想 */}
          <div
            style={{ top: '370px', width: '100%' }}
            className="c94"
          >
            <div className="c95">
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
              width: '0px',
              height: `${CANVAS_HEIGHT}px`,
            }}
            className={`absolute c90`}
          >
            <div className="c96">
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
            className={`absolute c89`}
          />
        ))}
      </div>

      {/* Top Standard Timeline Ruler */}
      <div
        style={{ width: `${TOTAL_CANVAS_WIDTH}px`, height: '96px', position: 'relative' }}
        className={showRuler ? 'c79' : 'hidden'}
      >
        {/* Row 1: Period Overview Banners across the canvas */}
        <div className="c80">
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
                className="c81"
                onClick={() => onJumpToPeriod(boundary.startX)}
                title="点击对齐到此时期"
              >
                <div className="c11">
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

                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="hidden xl:inline truncate max-w-sm">{boundary.theme}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Row 2: Standard Detailed Year Ticks Bar (Every year 1920, 1921, 1922... 1992 labeled) */}
        <div className="c82">
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
              className="c83"
              title={`年份: ${t.year}`}
            >
              <div className="c13">
                <span
                  className={`c84 ${
                    t.isKeyYear ? 'text-slate-800 dark:text-slate-200 font-bold' : 'text-slate-400 dark:text-slate-500'
                  }`}
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
