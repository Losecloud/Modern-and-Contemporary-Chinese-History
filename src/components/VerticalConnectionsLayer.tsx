import React, { useMemo, useState } from 'react';
import { HistoryEvent, TrackId } from '../types/history';

export interface CardCoord {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VerticalConnectionsLayerProps {
  events: HistoryEvent[];
  cardCoords: Record<string, CardCoord>;
  activeEventId: string | null;
  selectedEventId: string | null;
  showConnections: boolean;
  activeTracks: Set<TrackId>;
  onNavigateTo: (targetId: string) => void;
}

type Side = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';

interface ConnectionItem {
  sourceId: string;
  targetId: string;
  label: string;
  sourceEvent: HistoryEvent;
  targetEvent: HistoryEvent;
  sourceCoord: CardCoord;
  targetCoord: CardCoord;
  sourceSide: Side;
  targetSide: Side;
  sX: number;
  sY: number;
  tX: number;
  tY: number;
  pathData: string;
  midX: number;
  midY: number;
}

export const VerticalConnectionsLayer: React.FC<VerticalConnectionsLayerProps> = ({
  events,
  cardCoords,
  activeEventId,
  selectedEventId,
  showConnections,
  activeTracks,
  onNavigateTo,
}) => {
  const currentFocusId = selectedEventId || activeEventId;
  const [hoveredConnKey, setHoveredConnKey] = useState<string | null>(null);

  // Build events lookup
  const eventMap = useMemo(() => {
    const map = new Map<string, HistoryEvent>();
    events.forEach((e) => map.set(e.id, e));
    return map;
  }, [events]);

  // Compute all connection paths with dedicated start and end ports
  const computedConnections = useMemo(() => {
    // 1. Gather all valid connections where both source and target have coordinates and active tracks
    const rawList: {
      sourceId: string;
      targetId: string;
      label: string;
      sourceEvent: HistoryEvent;
      targetEvent: HistoryEvent;
      sourceCoord: CardCoord;
      targetCoord: CardCoord;
      sourceSide: Side;
      targetSide: Side;
    }[] = [];

    events.forEach((sourceEv) => {
      if (!activeTracks.has(sourceEv.track)) return;
      const sCoord = cardCoords[sourceEv.id];
      if (!sCoord) return;

      sourceEv.connections?.forEach((conn) => {
        const targetEv = eventMap.get(conn.targetId);
        if (!targetEv) return;
        if (!activeTracks.has(targetEv.track)) return;
        const tCoord = cardCoords[conn.targetId];
        if (!tCoord) return;

        const dx = tCoord.x - sCoord.x;
        const dy = tCoord.y - sCoord.y;
        const isSameColumn = Math.abs(dx) <= 50;

        let sourceSide: Side = 'RIGHT';
        let targetSide: Side = 'LEFT';

        if (isSameColumn) {
          // Both cards are in the same track column
          const isAdjacentVertical = dy > 0 && dy < 90;
          if (isAdjacentVertical && sCoord.x > 700) {
            // Direct upper works -> lower marx works in Column 3
            sourceSide = 'BOTTOM';
            targetSide = 'TOP';
          } else if (sCoord.x > 700) {
            // Column 3: route via left gutter
            sourceSide = 'LEFT';
            targetSide = 'LEFT';
          } else {
            // Column 1 or Column 2: route via right gutter
            sourceSide = 'RIGHT';
            targetSide = 'RIGHT';
          }
        } else {
          // Cross-column connection
          if (dx > 50) {
            // Moving from left column to right column
            sourceSide = 'RIGHT';
            targetSide = 'LEFT';
          } else {
            // Moving from right column to left column (e.g. Theory -> Meeting/Armed)
            sourceSide = 'LEFT';
            targetSide = 'RIGHT';
          }
        }

        rawList.push({
          sourceId: sourceEv.id,
          targetId: conn.targetId,
          label: conn.label,
          sourceEvent: sourceEv,
          targetEvent: targetEv,
          sourceCoord: sCoord,
          targetCoord: tCoord,
          sourceSide,
          targetSide,
        });
      });
    });

    // 2. Distribute anchor ports along card edges so multiple connections never overlap
    // Map of cardId_side -> array of { connIdx, role: 'source'|'target', targetY: number }
    const sidePortGroups = new Map<
      string,
      { connIdx: number; role: 'source' | 'target'; destY: number }[]
    >();

    rawList.forEach((item, idx) => {
      // Source attachment
      const sKey = `${item.sourceId}_${item.sourceSide}`;
      if (!sidePortGroups.has(sKey)) sidePortGroups.set(sKey, []);
      sidePortGroups.get(sKey)!.push({
        connIdx: idx,
        role: 'source',
        destY: item.targetCoord.y + item.targetCoord.height / 2,
      });

      // Target attachment
      const tKey = `${item.targetId}_${item.targetSide}`;
      if (!sidePortGroups.has(tKey)) sidePortGroups.set(tKey, []);
      sidePortGroups.get(tKey)!.push({
        connIdx: idx,
        role: 'target',
        destY: item.sourceCoord.y + item.sourceCoord.height / 2,
      });
    });

    // Compute relative offset for each attachment
    const sourceOffsets = new Map<number, number>();
    const targetOffsets = new Map<number, number>();

    sidePortGroups.forEach((entries, key) => {
      // Sort entries by destination Y so lines on the same edge NEVER cross each other
      entries.sort((a, b) => a.destY - b.destY);

      const [cardId, side] = key.split('_');
      const card = cardCoords[cardId];
      if (!card) return;

      const total = entries.length;
      entries.forEach((entry, i) => {
        let relPos = 0.5;
        if (side === 'LEFT' || side === 'RIGHT') {
          // Card height in compact mode is ~68-85px
          const H = card.height;
          const minPad = Math.max(16, Math.min(22, H * 0.25));
          const span = Math.max(12, H - 2 * minPad);
          relPos = total === 1 ? H * 0.5 : minPad + (i / (total - 1)) * span;
        } else {
          // TOP or BOTTOM horizontal edge
          const W = card.width;
          const pad = Math.max(24, Math.min(48, W * 0.15));
          const span = Math.max(20, W - 2 * pad);
          relPos = total === 1 ? pad + 20 : pad + (i / (total - 1)) * span;
        }

        if (entry.role === 'source') {
          sourceOffsets.set(entry.connIdx, relPos);
        } else {
          targetOffsets.set(entry.connIdx, relPos);
        }
      });
    });

    // 3. Build precise SVG paths for each connection
    const result: ConnectionItem[] = [];

    rawList.forEach((item, idx) => {
      const sRel = sourceOffsets.get(idx) ?? item.sourceCoord.height * 0.5;
      const tRel = targetOffsets.get(idx) ?? item.targetCoord.height * 0.5;

      let sX = 0;
      let sY = 0;
      let tX = 0;
      let tY = 0;

      // Calculate start point (sX, sY)
      if (item.sourceSide === 'RIGHT') {
        sX = item.sourceCoord.x + item.sourceCoord.width;
        sY = item.sourceCoord.y + sRel;
      } else if (item.sourceSide === 'LEFT') {
        sX = item.sourceCoord.x;
        sY = item.sourceCoord.y + sRel;
      } else if (item.sourceSide === 'BOTTOM') {
        sX = item.sourceCoord.x + sRel;
        sY = item.sourceCoord.y + item.sourceCoord.height;
      } else {
        sX = item.sourceCoord.x + sRel;
        sY = item.sourceCoord.y;
      }

      // Calculate end point (tX, tY)
      if (item.targetSide === 'RIGHT') {
        tX = item.targetCoord.x + item.targetCoord.width;
        tY = item.targetCoord.y + tRel;
      } else if (item.targetSide === 'LEFT') {
        tX = item.targetCoord.x;
        tY = item.targetCoord.y + tRel;
      } else if (item.targetSide === 'TOP') {
        tX = item.targetCoord.x + tRel;
        tY = item.targetCoord.y;
      } else {
        tX = item.targetCoord.x + tRel;
        tY = item.targetCoord.y + item.targetCoord.height;
      }

      let pathData = '';
      let midX = (sX + tX) / 2;
      let midY = (sY + tY) / 2;

      // Construct path based on side combination
      if (item.sourceSide === 'RIGHT' && item.targetSide === 'LEFT') {
        // Cross-column Rightward: Left column -> Right column
        const stubOut = 24;
        const stubIn = 24;
        const p1X = sX + stubOut;
        const p1Y = sY;
        const p2X = tX - stubIn;
        const p2Y = tY;
        const spanX = Math.max(20, p2X - p1X);
        const ctrl = Math.max(spanX * 0.5, 30);

        pathData = `M ${sX} ${sY} L ${p1X} ${p1Y} C ${p1X + ctrl} ${p1Y}, ${p2X - ctrl} ${p2Y}, ${p2X} ${p2Y} L ${tX} ${tY}`;
        midX = (p1X + p2X) / 2;
        midY = (p1Y + p2Y) / 2;
      } else if (item.sourceSide === 'LEFT' && item.targetSide === 'RIGHT') {
        // Cross-column Leftward: Right column -> Left column
        const stubOut = 24;
        const stubIn = 24;
        const p1X = sX - stubOut;
        const p1Y = sY;
        const p2X = tX + stubIn;
        const p2Y = tY;
        const spanX = Math.max(20, p1X - p2X);
        const ctrl = Math.max(spanX * 0.5, 30);

        pathData = `M ${sX} ${sY} L ${p1X} ${p1Y} C ${p1X - ctrl} ${p1Y}, ${p2X + ctrl} ${p2Y}, ${p2X} ${p2Y} L ${tX} ${tY}`;
        midX = (p1X + p2X) / 2;
        midY = (p1Y + p2Y) / 2;
      } else if (item.sourceSide === 'RIGHT' && item.targetSide === 'RIGHT') {
        // Same-column via Right Gutter (never cutting through intermediate cards!)
        const stub = 20;
        const p1X = sX + stub;
        const p1Y = sY;
        const p2X = tX + stub;
        const p2Y = tY;
        const gutterX = Math.max(sX, tX) + 26 + (idx % 3) * 6;

        pathData = `M ${sX} ${sY} L ${p1X} ${p1Y} C ${gutterX} ${p1Y + 18}, ${gutterX} ${p2Y - 18}, ${p2X} ${p2Y} L ${tX} ${tY}`;
        midX = gutterX;
        midY = (p1Y + p2Y) / 2;
      } else if (item.sourceSide === 'LEFT' && item.targetSide === 'LEFT') {
        // Same-column via Left Gutter (e.g. Column 3 works -> works)
        const stub = 20;
        const p1X = sX - stub;
        const p1Y = sY;
        const p2X = tX - stub;
        const p2Y = tY;
        const gutterX = Math.min(sX, tX) - 26 - (idx % 3) * 6;

        pathData = `M ${sX} ${sY} L ${p1X} ${p1Y} C ${gutterX} ${p1Y + 18}, ${gutterX} ${p2Y - 18}, ${p2X} ${p2Y} L ${tX} ${tY}`;
        midX = gutterX;
        midY = (p1Y + p2Y) / 2;
      } else if (item.sourceSide === 'BOTTOM' && item.targetSide === 'TOP') {
        // Direct vertical bridge within same column row
        pathData = `M ${sX} ${sY} L ${tX} ${tY}`;
        midX = sX;
        midY = (sY + tY) / 2;
      } else {
        // Fallback smooth curve
        pathData = `M ${sX} ${sY} C ${sX + 30} ${sY}, ${tX - 30} ${tY}, ${tX} ${tY}`;
        midX = (sX + tX) / 2;
        midY = (sY + tY) / 2;
      }

      result.push({
        ...item,
        sX,
        sY,
        tX,
        tY,
        pathData,
        midX,
        midY,
      });
    });

    return result;
  }, [events, cardCoords, activeTracks, eventMap]);

  // If showConnections is false and no card is hovered/focused, do not render
  if (!showConnections && !currentFocusId) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-20 overflow-visible"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        {/* Default subtle arrow (refined dart with notch) */}
        <marker
          id="v-arrow-subtle"
          markerWidth="10"
          markerHeight="10"
          refX="7.5"
          refY="5"
          orient="auto"
        >
          <path d="M 0.5 1.5 L 8.5 5 L 0.5 8.5 L 2.8 5 Z" fill="#94A3B8" />
        </marker>

        {/* Outgoing highlight arrow (refined amber dart) */}
        <marker
          id="v-arrow-outgoing"
          markerWidth="11"
          markerHeight="11"
          refX="8"
          refY="5"
          orient="auto"
        >
          <path d="M 0.5 1.5 L 9.5 5 L 0.5 8.5 L 3.2 5 Z" fill="#D97706" />
        </marker>

        {/* Incoming highlight arrow (refined royal blue dart) */}
        <marker
          id="v-arrow-incoming"
          markerWidth="11"
          markerHeight="11"
          refX="8"
          refY="5"
          orient="auto"
        >
          <path d="M 0.5 1.5 L 9.5 5 L 0.5 8.5 L 3.2 5 Z" fill="#2563EB" />
        </marker>

        {/* Glow filter for active branch lines */}
        <filter id="v-glow-gold" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#F59E0B" floodOpacity="0.75" />
        </filter>
        <filter id="v-glow-blue" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#3B82F6" floodOpacity="0.75" />
        </filter>
      </defs>

      {computedConnections.map((conn, idx) => {
        const connKey = `${conn.sourceId}-${conn.targetId}-${idx}`;
        const isOutgoing = currentFocusId === conn.sourceId;
        const isIncoming = currentFocusId === conn.targetId;
        const isHovered = hoveredConnKey === connKey;
        const isConnected = isOutgoing || isIncoming || isHovered;
        const hasAnyFocus = Boolean(currentFocusId);

        // If user disabled global connections and this line is not directly linked to the hovered card, skip
        if (!showConnections && !isConnected) {
          return null;
        }

        // Determine styling
        let strokeColor = '#94A3B8';
        let strokeWidth = 1.5;
        let strokeDasharray = 'none';
        let markerEnd = 'url(#v-arrow-subtle)';
        let opacity = hasAnyFocus ? 0.12 : 0.55;
        let filter: string | undefined = undefined;

        if (isOutgoing) {
          strokeColor = '#D97706';
          strokeWidth = 3.2;
          strokeDasharray = 'none';
          markerEnd = 'url(#v-arrow-outgoing)';
          opacity = 1;
          filter = 'url(#v-glow-gold)';
        } else if (isIncoming) {
          strokeColor = '#2563EB';
          strokeWidth = 3.2;
          strokeDasharray = 'none';
          markerEnd = 'url(#v-arrow-incoming)';
          opacity = 1;
          filter = 'url(#v-glow-blue)';
        } else if (isHovered) {
          strokeColor = '#059669';
          strokeWidth = 3;
          strokeDasharray = 'none';
          opacity = 1;
        } else if (!hasAnyFocus) {
          const dy = Math.abs(conn.tY - conn.sY);
          if (dy > 140) {
            strokeDasharray = '4 3';
            strokeWidth = 1.3;
            opacity = 0.45;
          }
        }

        const labelWidth = Math.max(48, conn.label.length * 11 + 16);

        return (
          <g
            key={`v-conn-${connKey}`}
            className="transition-opacity duration-200"
            style={{ opacity }}
            onMouseEnter={() => setHoveredConnKey(connKey)}
            onMouseLeave={() => setHoveredConnKey(null)}
          >
            {/* Start Node Visual Anchor Dot on the Source Card Edge */}
            <circle
              cx={conn.sX}
              cy={conn.sY}
              r={isConnected ? 3.5 : 2.5}
              fill={strokeColor}
              className="transition-all duration-200"
            />

            {/* Transparent wide path for easier mouse hover & click navigation */}
            <path
              d={conn.pathData}
              fill="none"
              stroke="transparent"
              strokeWidth={18}
              className="pointer-events-auto cursor-pointer"
              onClick={() => onNavigateTo(conn.targetId)}
            >
              <title>{`${conn.sourceEvent.title} → ${conn.targetEvent.title}: ${conn.label}`}</title>
            </path>

            {/* Visual connecting line */}
            <path
              d={conn.pathData}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              markerEnd={markerEnd}
              filter={filter}
            />

            {/* Connection label badge - Prominently shown on connected lines or on hover */}
            {(isConnected || (!hasAnyFocus && conn.label)) && (
              <g
                className="pointer-events-auto cursor-pointer"
                onClick={() => onNavigateTo(conn.targetId)}
                transform={`translate(${conn.midX}, ${conn.midY})`}
              >
                <rect
                  x={-labelWidth / 2}
                  y="-11"
                  width={labelWidth}
                  height="22"
                  rx="6"
                  className={
                    isConnected
                      ? isOutgoing
                        ? 'fill-amber-500 stroke-amber-600'
                        : isIncoming
                        ? 'fill-blue-600 stroke-blue-700'
                        : 'fill-emerald-600 stroke-emerald-700'
                      : 'fill-white/95 dark:fill-slate-800/95 stroke-slate-200 dark:stroke-slate-700'
                  }
                  strokeWidth="1"
                  filter={isConnected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' : undefined}
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  className={`select-none text-[10.5px] ${
                    isConnected
                      ? 'fill-white font-bold'
                      : 'fill-slate-600 dark:fill-slate-300 font-medium'
                  }`}
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
};
