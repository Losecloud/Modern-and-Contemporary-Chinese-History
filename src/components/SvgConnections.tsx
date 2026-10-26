import React from 'react';
import { HistoryEvent, TrackId } from '../types/history';
import { EVENT_LAYOUT_COORDS, CARD_WIDTH } from '../utils/canvasLayout';

interface SvgConnectionsProps {
  events: HistoryEvent[];
  activeEventId: string | null;
  selectedEventId: string | null;
  showConnections: boolean;
  /** eventId → 卡片真实渲染高度（未实测时用 FALLBACK_CARD_HEIGHT 兜底） */
  cardHeights?: Record<string, number>;
  /** eventId → 编辑模式下调整过位置/宽度后的实际卡片盒（缺省时回落默认布局坐标） */
  coords?: Record<string, { x: number; y: number; width?: number }>;
  onSelectEvent?: (id: string) => void;
}

type AnchorSide = 'left' | 'right' | 'top' | 'bottom';

/** 边锚点：返回边中点坐标与该边的外法线（控制点沿法线外推，曲线垂直进出卡片边界） */
function edgeAnchor(
  x: number,
  y: number,
  w: number,
  h: number,
  side: AnchorSide
): { px: number; py: number; nx: number; ny: number } {
  switch (side) {
    case 'left':
      return { px: x, py: y + h / 2, nx: -1, ny: 0 };
    case 'right':
      return { px: x + w, py: y + h / 2, nx: 1, ny: 0 };
    case 'top':
      return { px: x + w / 2, py: y, nx: 0, ny: -1 };
    default:
      return { px: x + w / 2, py: y + h, nx: 0, ny: 1 };
  }
}

/** 卡片高度兜底值：仅在尚未完成实测（如卡片未渲染）时使用 */
const FALLBACK_CARD_HEIGHT = 270;

/** 连线颜色沿用轨道主题色：决策=红、斗争=黄、思想=绿，跨轨与马原用中性灰 */
const TRACK_STROKE: Record<TrackId, string> = {
  meeting: '#DC2626',
  armed: '#D97706',
  works: '#059669',
};
const NEUTRAL_STROKE = '#94A3B8';

/** 颜色 → 箭头 marker 与发光滤镜的对应关系 */
const STROKE_STYLE: Record<string, { markerId: string; glowId: string }> = {
  '#DC2626': { markerId: 'arrow-red', glowId: 'glow-red' },
  '#D97706': { markerId: 'arrow-amber', glowId: 'glow-amber' },
  '#059669': { markerId: 'arrow-emerald', glowId: 'glow-emerald' },
  [NEUTRAL_STROKE]: { markerId: 'arrow-subtle', glowId: 'glow-slate' },
};

export const SvgConnections = React.memo<SvgConnectionsProps>(({
  events,
  activeEventId,
  selectedEventId,
  showConnections,
  cardHeights,
  coords,
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
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ width: '100%', height: '100%', zIndex: currentFocusId ? 450 : 5 }}
    >
      <defs>
        {/* 小三角箭头：markerUnits=userSpaceOnUse 保证不随线宽放大，尺寸恒定。
            refX 比箭头尖端坐标小 4：曲线终点在边界外 4px 处留出 gap，
            箭头相对终点前移 4px，使尖端正好贴住卡片边界，并由箭头本体压住这段 gap。 */}
        <marker
          id="arrow-subtle"
          markerUnits="userSpaceOnUse"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <path d="M 1 1.5 L 9 5 L 1 8.5 Z" fill={NEUTRAL_STROKE} />
        </marker>

        {/* Track-colored arrows: meeting=red, armed=amber, works=emerald */}
        <marker
          id="arrow-red"
          markerUnits="userSpaceOnUse"
          markerWidth="12"
          markerHeight="12"
          refX="7"
          refY="6"
          orient="auto"
        >
          <path d="M 1 1.5 L 11 6 L 1 10.5 Z" fill={TRACK_STROKE.meeting} />
        </marker>
        <marker
          id="arrow-amber"
          markerUnits="userSpaceOnUse"
          markerWidth="12"
          markerHeight="12"
          refX="7"
          refY="6"
          orient="auto"
        >
          <path d="M 1 1.5 L 11 6 L 1 10.5 Z" fill={TRACK_STROKE.armed} />
        </marker>
        <marker
          id="arrow-emerald"
          markerUnits="userSpaceOnUse"
          markerWidth="12"
          markerHeight="12"
          refX="7"
          refY="6"
          orient="auto"
        >
          <path d="M 1 1.5 L 11 6 L 1 10.5 Z" fill={TRACK_STROKE.works} />
        </marker>

        {/* Glow filters for focused branch lines */}
        <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#DC2626" floodOpacity="0.6" />
        </filter>
        <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#D97706" floodOpacity="0.6" />
        </filter>
        <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#059669" floodOpacity="0.6" />
        </filter>
        <filter id="glow-slate" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#64748B" floodOpacity="0.6" />
        </filter>
      </defs>

      {connectionsList.map((conn, idx) => {
        // 优先使用编辑模式调整后的实际卡片盒（位置/宽度），保证锚点跟随卡片变化
        const sourceCoord = coords?.[conn.sourceId] ?? EVENT_LAYOUT_COORDS[conn.sourceId];
        const targetCoord = coords?.[conn.targetId] ?? EVENT_LAYOUT_COORDS[conn.targetId];

        if (!sourceCoord || !targetCoord) return null;

        // 统一锚点：始终落在卡片边界中点（横向链接取左右边界中点，跨轨链接取上下边界中点）
        const sourceWidth = sourceCoord.width ?? CARD_WIDTH;
        const targetWidth = targetCoord.width ?? CARD_WIDTH;
        const sourceHeight = cardHeights?.[conn.sourceId] ?? FALLBACK_CARD_HEIGHT;
        const targetHeight = cardHeights?.[conn.targetId] ?? FALLBACK_CARD_HEIGHT;

        // 两卡矩形重叠（相邻卡片互相压盖）时，连线会被卡片遮住，只剩夹缝里一截残线，
        // 既难看又看不出方向，因此直接跳过这条连线
        const boxesOverlap =
          sourceCoord.x < targetCoord.x + targetWidth &&
          targetCoord.x < sourceCoord.x + sourceWidth &&
          sourceCoord.y < targetCoord.y + targetHeight &&
          targetCoord.y < sourceCoord.y + sourceHeight;
        if (boxesOverlap) return null;

        const isOutgoing = currentFocusId === conn.sourceId;
        const isIncoming = currentFocusId === conn.targetId;
        const isConnected = isOutgoing || isIncoming;
        const hasAnyFocus = Boolean(currentFocusId);

        const srcCenterX = sourceCoord.x + sourceWidth / 2;
        const tgtCenterX = targetCoord.x + targetWidth / 2;
        const srcMidY = sourceCoord.y + sourceHeight / 2;
        const tgtMidY = targetCoord.y + targetHeight / 2;

        // 自适应选边：连线优先从「朝向对方的最近边中点」进出，而不是固定走右出左进/上出下进。
        // 判据取两卡中心相对位移的主轴：水平位移大 → 左右进出；垂直位移大 → 上下进出；
        // 方向由位移符号决定（目标在右→右出左进，在左→左出右进，在下→下出上进，在上→上出下进）。
        const dx = tgtCenterX - srcCenterX;
        const dy = tgtMidY - srcMidY;
        const useHorizontalSides = Math.abs(dx) >= Math.abs(dy);
        let srcSide: AnchorSide;
        let tgtSide: AnchorSide;
        if (useHorizontalSides) {
          srcSide = dx >= 0 ? 'right' : 'left';
          tgtSide = dx >= 0 ? 'left' : 'right';
        } else {
          srcSide = dy >= 0 ? 'bottom' : 'top';
          tgtSide = dy >= 0 ? 'top' : 'bottom';
        }

        const s = edgeAnchor(sourceCoord.x, sourceCoord.y, sourceWidth, sourceHeight, srcSide);
        const t = edgeAnchor(targetCoord.x, targetCoord.y, targetWidth, targetHeight, tgtSide);

        // 全程单条三次贝塞尔（React Flow getBezierPath 同款）：两个控制点分别沿
        // 源/目标边的外法线外推，外推量随锚点间距自适应摊开（上限 320px）。
        // 曲线在两端垂直于卡片边界进出，中段自然平滑过渡，全路径没有任何折角。
        // 线身终点外退 4px：留出 gap 后由箭头本体压住，箭头尖仍贴住卡片边界
        const ARROW_GAP = 4;
        const endX = t.px + t.nx * ARROW_GAP;
        const endY = t.py + t.ny * ARROW_GAP;
        const dist = Math.hypot(endX - s.px, endY - s.py);
        const ctrl = Math.min(dist * 0.45, 320);
        const c1X = s.px + s.nx * ctrl;
        const c1Y = s.py + s.ny * ctrl;
        const c2X = endX + t.nx * ctrl;
        const c2Y = endY + t.ny * ctrl;
        const pathData = `M ${s.px} ${s.py} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${endX} ${endY}`;

        // 标签放在贝塞尔曲线 t=0.5 处：B(0.5) = (P0 + 3·C1 + 3·C2 + P3) / 8
        const midX = (s.px + 3 * c1X + 3 * c2X + endX) / 8;
        const midY = (s.py + 3 * c1Y + 3 * c2Y + endY) / 8;

        // 颜色取「源卡片的主题色」：决策红 / 斗争黄 / 思想绿，马原与科学社会主义卡片用中性灰
        const isNeutral = Boolean(
          conn.sourceEvent.isScientificSocialism || conn.sourceEvent.periodId === 0
        );
        const strokeColor = isNeutral ? NEUTRAL_STROKE : TRACK_STROKE[conn.sourceEvent.track];
        const strokeStyle = STROKE_STYLE[strokeColor] ?? STROKE_STYLE[NEUTRAL_STROKE];

        let strokeWidth = 1.6;
        let strokeDasharray = 'none';
        let markerEnd = `url(#${strokeStyle.markerId})`;
        // 默认未选中/未悬浮时仅 0.2 透明度弱化显示，不抢卡片视觉焦点
        let opacity = hasAnyFocus ? 0.12 : 0.2;
        let filter = undefined;

        if (isConnected) {
          strokeWidth = 3;
          opacity = 1;
          filter = `url(#${strokeStyle.glowId})`;
        } else if (!hasAnyFocus) {
          if (Math.abs(dy) > 100) {
            strokeDasharray = '4 3';
            strokeWidth = 1.4;
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
                  fill={isConnected ? strokeColor : undefined}
                  className={
                    isConnected
                      ? ''
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
