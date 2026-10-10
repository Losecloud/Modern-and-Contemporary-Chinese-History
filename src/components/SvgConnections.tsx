import React from 'react';
import { HistoryEvent } from '../types/history';
import { EVENT_LAYOUT_COORDS, CARD_WIDTH } from '../utils/canvasLayout';

interface SvgConnectionsProps {
  events: HistoryEvent[];
  activeEventId: string | null;
  selectedEventId: string | null;
  showConnections: boolean;
  onSelectEvent?: (id: string) => void;
}

export const SvgConnections = React.memo<SvgConnectionsProps>(({
  events,
  activeEventId,
  selectedEventId,
  showConnections,
  onSelectEvent,
}) => {
  if (!showConnections) return null;

  const currentFocusId = selectedEventId || activeEventId;

  // Flatten all connections
  const connectionsList: {
    sourceId: string;
    targetId: string;
    label: string;
    sourceEvent: HistoryEvent;
  }[] = [];

  events.forEach((ev) => {
    ev.connections.forEach((conn) => {
      if (EVENT_LAYOUT_COORDS[conn.targetId]) {
        connectionsList.push({
          sourceId: ev.id,
          targetId: conn.targetId,
          label: conn.label,
          sourceEvent: ev,
        });
      }
    });
  });

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10 overflow-visible"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        {/* Default subtle arrow (refined dart with notch) */}
        <marker
          id="arrow-subtle"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
        >
          <path d="M 1 2 L 9 5 L 1 8 L 3.5 5 Z" fill="#94A3B8" />
        </marker>

        {/* Outgoing highlight arrow (refined amber dart) */}
        <marker
          id="arrow-outgoing"
          markerWidth="11"
          markerHeight="11"
          refX="8.5"
          refY="5"
          orient="auto"
        >
          <path d="M 0.5 1.5 L 9.5 5 L 0.5 8.5 L 3.5 5 Z" fill="#D97706" />
        </marker>

        {/* Incoming highlight arrow (refined royal blue dart) */}
        <marker
          id="arrow-incoming"
          markerWidth="11"
          markerHeight="11"
          refX="8.5"
          refY="5"
          orient="auto"
        >
          <path d="M 0.5 1.5 L 9.5 5 L 0.5 8.5 L 3.5 5 Z" fill="#2563EB" />
        </marker>

        {/* Glow filter for active branch lines */}
        <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#F59E0B" floodOpacity="0.6" />
        </filter>
        <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#3B82F6" floodOpacity="0.6" />
        </filter>
      </defs>

      {connectionsList.map((conn, idx) => {
        const sourceCoord = EVENT_LAYOUT_COORDS[conn.sourceId];
        const targetCoord = EVENT_LAYOUT_COORDS[conn.targetId];

        if (!sourceCoord || !targetCoord) return null;

        const estCardHeight = 270;
        const sX = sourceCoord.x + CARD_WIDTH;
        const sY = sourceCoord.y + 110;
        const tX = targetCoord.x;
        const tY = targetCoord.y + 110;

        const isOutgoing = currentFocusId === conn.sourceId;
        const isIncoming = currentFocusId === conn.targetId;
        const isConnected = isOutgoing || isIncoming;
        const hasAnyFocus = Boolean(currentFocusId);

        const dx = tX - sX;
        const dy = tY - sY;

        let pathData = '';
        let midX = (sX + tX) / 2;
        let midY = (sY + tY) / 2;

        // Requirement 6: Constrain end and start segments to strictly horizontal/vertical for 25-35px
        // so arrow markers are cleanly formed (0-degree horizontal arrow →)
        if (dx > 40) {
          // Normal forward connection
          const startStub = 25; // 25px horizontal lead-out
          const endStub = 32;   // 32px strictly horizontal lead-in into target card

          const p1X = sX + startStub;
          const p1Y = sY;
          const p2X = tX - endStub;
          const p2Y = tY;

          const spanX = p2X - p1X;
          const controlOffset = Math.max(spanX * 0.45, 40);

          // Path: Start at sX sY -> Horizontal line to p1X p1Y -> Cubic Bezier to p2X p2Y -> Strictly Horizontal line to tX tY
          pathData = `M ${sX} ${sY} L ${p1X} ${p1Y} C ${p1X + controlOffset} ${p1Y}, ${p2X - controlOffset} ${p2Y}, ${p2X} ${p2Y} L ${tX} ${tY}`;

          midX = (p1X + p2X) / 2;
          midY = (p1Y + p2Y) / 2;
        } else {
          // Vertical cross-column connection (e.g. going down to lower track or up)
          const sBottomX = sourceCoord.x + CARD_WIDTH / 2;
          const sBottomY = sourceCoord.y + estCardHeight;
          const tTopX = targetCoord.x + CARD_WIDTH / 2;
          const tTopY = targetCoord.y;

          if (targetCoord.y > sourceCoord.y) {
            // Downward branch: early vertical constraint at start and end
            const startStubY = 25;
            const endStubY = 30;

            const p1X = sBottomX;
            const p1Y = sBottomY + startStubY;
            const p2X = tTopX;
            const p2Y = tTopY - endStubY;

            pathData = `M ${sBottomX} ${sBottomY} L ${p1X} ${p1Y} C ${p1X} ${p1Y + 40}, ${p2X} ${p2Y - 40}, ${p2X} ${p2Y} L ${tTopX} ${tTopY}`;
            midX = (sBottomX + tTopX) / 2;
            midY = (sBottomY + tTopY) / 2;
          } else {
            // Upward branch
            const sTopX = sourceCoord.x + CARD_WIDTH / 2;
            const sTopY = sourceCoord.y;
            const tBottomX = targetCoord.x + CARD_WIDTH / 2;
            const tBottomY = targetCoord.y + estCardHeight;

            const p1Y = sTopY - 25;
            const p2Y = tBottomY + 30;

            pathData = `M ${sTopX} ${sTopY} L ${sTopX} ${p1Y} C ${sTopX} ${p1Y - 40}, ${tBottomX} ${p2Y + 40}, ${tBottomX} ${p2Y} L ${tBottomX} ${tBottomY}`;
            midX = (sTopX + tBottomX) / 2;
            midY = (sTopY + tBottomY) / 2;
          }
        }

        // Determine styles
        let strokeColor = '#94A3B8';
        let strokeWidth = 1.6;
        let strokeDasharray = 'none';
        let markerEnd = 'url(#arrow-subtle)';
        let opacity = hasAnyFocus ? 0.12 : 0.65;
        let filter = undefined;

        if (isOutgoing) {
          strokeColor = '#D97706';
          strokeWidth = 3;
          strokeDasharray = 'none';
          markerEnd = 'url(#arrow-outgoing)';
          opacity = 1;
          filter = 'url(#glow-gold)';
        } else if (isIncoming) {
          strokeColor = '#2563EB';
          strokeWidth = 3;
          strokeDasharray = 'none';
          markerEnd = 'url(#arrow-incoming)';
          opacity = 1;
          filter = 'url(#glow-blue)';
        } else if (!hasAnyFocus) {
          if (Math.abs(dy) > 100) {
            strokeDasharray = '4 3';
            strokeWidth = 1.4;
            opacity = 0.55;
          }
        }

        return (
          <g
            key={`conn-${conn.sourceId}-${conn.targetId}-${idx}`}
            className="transition-all duration-200"
            style={{ opacity }}
          >
            {/* Visual curved path with strictly horizontal end arrow */}
            <path
              d={pathData}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              markerEnd={markerEnd}
              filter={filter}
            />

            {/* Label along the connection */}
            {(isConnected || (!hasAnyFocus && conn.label)) && (
              <g
                className="pointer-events-auto cursor-pointer"
                onClick={() => onSelectEvent && onSelectEvent(conn.targetId)}
                transform={`translate(${midX}, ${midY})`}
              >
                <rect
                  x={-(conn.label.length * 6 + 10)}
                  y="-11"
                  width={conn.label.length * 12 + 20}
                  height="22"
                  rx="6"
                  className={
                    isConnected
                      ? isOutgoing
                        ? 'fill-amber-500 text-white dark:fill-amber-600'
                        : 'fill-blue-600 text-white dark:fill-blue-500'
                      : 'fill-white/95 dark:fill-slate-800/95 stroke-slate-200 dark:stroke-slate-700'
                  }
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  className={
                    isConnected
                      ? 'fill-white font-medium text-[11px]'
                      : 'fill-slate-600 dark:fill-slate-300 font-normal text-[10.5px]'
                  }
                >
                  {conn.label}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
});
