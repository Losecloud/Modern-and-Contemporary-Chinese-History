import React from 'react';
import { TrackId } from '../types/history';
import { LeaderLineInfo, TOTAL_CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/canvasLayout';

interface LeaderLinesLayerProps {
  leaderLines: LeaderLineInfo[];
  activeTracks: Set<TrackId>;
  activeEventId: string | null;
  selectedEventId: string | null;
  searchQuery?: string;
  onSelectEvent: (eventId: string) => void;
}

export const LeaderLinesLayer: React.FC<LeaderLinesLayerProps> = ({
  leaderLines,
  activeTracks,
  activeEventId,
  selectedEventId,
  onSelectEvent,
}) => {
  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: `${TOTAL_CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        pointerEvents: 'none',
        zIndex: 14,
      }}
    >
      <defs>
        <filter id="leader-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.8" />
        </filter>
      </defs>

      {leaderLines.map((line) => {
        if (!activeTracks.has(line.track)) return null;

        const isFocus = activeEventId === line.id || selectedEventId === line.id;
        // Slightly stagger leaderY to prevent overlapping between leader lines in the same cluster
        const leaderY = line.y - 12 - (line.tier * 6);
        const tickTopY = line.y - 24;
        const cardTopY = line.y;

        // Strictly horizontal and vertical path:
        // 1. Vertical from exact timeline tick (exactX, tickTopY) to (exactX, leaderY)
        // 2. Horizontal along track gap from exactX to placedX at leaderY
        // 3. Vertical down to card top-left corner (placedX, cardTopY)
        const pathData = `M ${line.exactX} ${tickTopY} L ${line.exactX} ${leaderY} L ${line.placedX} ${leaderY} L ${line.placedX} ${cardTopY}`;

        // Width of date badge
        const badgeWidth = Math.max(34, line.dateLabel.length * 6.5 + 8);

        return (
          <g key={`leader-${line.id}`} className="transition-opacity duration-150">
            {/* Wide transparent hit area for hover & click */}
            <path
              d={pathData}
              stroke="transparent"
              strokeWidth={14}
              fill="none"
              className="cursor-pointer pointer-events-auto"
              onClick={() => onSelectEvent(line.id)}
            >
              <title>{`准确历史刻度: ${line.dateLabel} (因卡片密集防重叠超30%错位均匀呈现)`}</title>
            </path>

            {/* Vertical tick guide line dropping down from top towards the pin */}
            <line
              x1={line.exactX}
              y1={tickTopY - 6}
              x2={line.exactX}
              y2={tickTopY}
              stroke={isFocus ? '#F59E0B' : '#94A3B8'}
              strokeWidth={isFocus ? 1.8 : 1.2}
            />

            {/* Main orthogonal leader line */}
            <path
              d={pathData}
              stroke={isFocus ? '#F59E0B' : '#94A3B8'}
              strokeWidth={isFocus ? 2 : 1.4}
              strokeDasharray={isFocus ? 'none' : '3 2'}
              fill="none"
              filter={isFocus ? 'url(#leader-glow)' : undefined}
            />

            {/* Exact tick pin anchor dot */}
            <circle
              cx={line.exactX}
              cy={tickTopY}
              r={isFocus ? 3.5 : 2.5}
              fill={isFocus ? '#F59E0B' : '#64748B'}
              stroke="#FFFFFF"
              strokeWidth={0.8}
            />

            {/* Card top-left pin anchor dot */}
            <circle
              cx={line.placedX}
              cy={cardTopY}
              r={isFocus ? 3.5 : 2.5}
              fill={isFocus ? '#F59E0B' : '#64748B'}
              stroke="#FFFFFF"
              strokeWidth={0.8}
            />

            {/* Exact Date badge pill at exact tick */}
            <g
              className="cursor-pointer pointer-events-auto"
              onClick={() => onSelectEvent(line.id)}
            >
              <rect
                x={line.exactX - badgeWidth / 2}
                y={tickTopY - 15}
                width={badgeWidth}
                height={12.5}
                rx={2.5}
                fill={isFocus ? '#FEF3C7' : '#F8FAFC'}
                stroke={isFocus ? '#F59E0B' : '#CBD5E1'}
                strokeWidth={isFocus ? 1 : 0.8}
                className="dark:fill-slate-800 dark:stroke-slate-700"
              />
              <text
                x={line.exactX}
                y={tickTopY - 5.5}
                textAnchor="middle"
                fontSize="9px"
                fontWeight="600"
                fill={isFocus ? '#B45309' : '#64748B'}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                className="select-none dark:fill-slate-300"
              >
                {line.dateLabel}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
