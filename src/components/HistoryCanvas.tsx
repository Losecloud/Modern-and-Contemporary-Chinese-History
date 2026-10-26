import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { HistoryEvent, TrackId, getCardZIndex } from '../types/history';
import { HISTORY_EVENTS, HISTORY_MARKERS, TRACKS } from '../data/historyData';
import {
  EVENT_LAYOUT_COORDS,
  EVENT_LEADER_LINES,
  TOTAL_CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CARD_WIDTH,
  PERIOD_BOUNDARIES,
  YEAR_TICKS,
  getScaleAtX,
  EVENT_GROUPS,
  EVENT_GROUP_OF,
  LeaderLineInfo,
  dateToX,
  parseEventDate,
} from '../utils/canvasLayout';
import { TimelineScale } from './TimelineScale';
import { TrackHeader } from './TrackHeader';
import { EventCard } from './EventCard';
import { SvgConnections } from './SvgConnections';
import { LeaderLinesLayer } from './LeaderLinesLayer';

interface HistoryCanvasProps {
  searchQuery: string;
  currentMatchedEventId?: string | null;
  searchMatchRank?: { current: number; total: number };
  activeTracks: Set<TrackId>;
  onToggleTrack: (track: TrackId) => void;
  showConnections: boolean;
  isQuizMode: boolean;
  zoomLevel: number;
  onZoomChange?: (zoom: number) => void;
  onSelectEvent: (event: HistoryEvent) => void;
  onOpenDetailModal: (event: HistoryEvent) => void;
  /** 直接打开该卡片的真题练习弹窗 */
  onOpenPracticeModal?: (event: HistoryEvent) => void;
  /** eventId → 该卡片可练习的真题数量 */
  examCounts?: Record<string, number>;
  onRegisterJumpHandler: (fn: (periodId: number) => void) => void;
  onRegisterNavigateHandler: (fn: (eventId: string) => void) => void;
  onActivePeriodChange?: (periodId: number) => void;
  /** 编辑模式：卡片右边界可拖拽调整宽度 */
  isEditMode?: boolean;
  /** eventId → 自定义卡片宽度（编辑模式保存的结果） */
  cardWidths?: Record<string, number>;
  onResizeCard?: (eventId: string, width: number) => void;
  /** groupId → 自定义卡片左边界 X（编辑模式左右拖拽保存的结果） */
  cardXs?: Record<string, number>;
  onMoveCard?: (groupId: string, x: number) => void;
}

// 视窗位置缓存键（按虚拟画布坐标存储，缩放变化后仍能回到同一历史位置）
const VIEW_STATE_KEY = 'history_canvas_view_v3';
/** eventId → 事件对象，供同年合并组内切换时快速取数 */
const EVENT_BY_ID: Record<string, HistoryEvent> = Object.fromEntries(
  HISTORY_EVENTS.map((e) => [e.id, e])
);
/** groupId → 合并组，拖拽吸附时取该组正确的年份刻度 X */
const GROUP_BY_ID: Record<string, (typeof EVENT_GROUPS)[number]> = Object.fromEntries(
  EVENT_GROUPS.map((g) => [g.groupId, g])
);
// 首页默认停在 1840 年（时间轴该年刻度对应的画布 x，左侧留 120px 边距）
const START_VIEW_X = Math.max(0, (YEAR_TICKS.find((tick) => tick.year === 1840)?.x ?? 3840) - 120);

// 大事记锚点坐标（静态数据，模块级计算一次）：按 x 排序后分四行错位，
// 每次挑「上一个标签最靠左」的一行放，同年密集事件（如 1976 年）也不会互相压盖
const MARKER_ROWS = 4;
const MARKER_ROW_GAP = 21;
const MARKER_COORDS = (() => {
  const list = HISTORY_MARKERS.map((marker) => {
    const parsed = parseEventDate(marker.dateStr);
    return { ...marker, x: dateToX(parsed.dateVal), label: parsed.label, tier: 0 };
  }).sort((a, b) => a.x - b.x);
  const lastX = new Array<number>(MARKER_ROWS).fill(-100000);
  list.forEach((marker) => {
    let tier = 0;
    for (let i = 1; i < MARKER_ROWS; i += 1) {
      if (marker.x - lastX[i] > marker.x - lastX[tier]) tier = i;
    }
    marker.tier = tier;
    lastX[tier] = marker.x;
  });
  return list;
})();

export const HistoryCanvas: React.FC<HistoryCanvasProps> = ({
  searchQuery,
  currentMatchedEventId,
  searchMatchRank,
  activeTracks,
  onToggleTrack,
  showConnections,
  isQuizMode,
  zoomLevel,
  onZoomChange,
  onSelectEvent,
  onOpenDetailModal,
  onOpenPracticeModal,
  examCounts,
  onRegisterJumpHandler,
  onRegisterNavigateHandler,
  onActivePeriodChange,
  isEditMode = false,
  cardWidths,
  onResizeCard,
  cardXs,
  onMoveCard,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // eventId → 卡片真实渲染高度（连线锚点统一取边界中点，需实测高度）
  const [cardHeights, setCardHeights] = useState<Record<string, number>>({});
  const handleCardHeight = useCallback((eventId: string, height: number) => {
    setCardHeights((prev) => (prev[eventId] === height ? prev : { ...prev, [eventId]: height }));
  }, []);
  // 选中卡片后：只保留「自身 + 与它有直接连线的卡片（出边与入边）」，其余卡片淡化
  const relatedEventIds = useMemo(() => {
    if (!selectedEventId) return null;
    const related = new Set<string>([selectedEventId]);
    HISTORY_EVENTS.forEach((ev) => {
      if (ev.id === selectedEventId) {
        ev.connections.forEach((conn) => related.add(conn.targetId));
      }
      if (ev.connections.some((conn) => conn.targetId === selectedEventId)) related.add(ev.id);
    });
    return related;
  }, [selectedEventId]);
  // 同年合并组的当前选项卡：groupId → eventId（进入页面时随机起始，避免总从第一张开始）
  const [groupActiveTab, setGroupActiveTab] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    EVENT_GROUPS.forEach((g) => {
      if (g.memberIds.length > 1) {
        initial[g.groupId] = g.memberIds[Math.floor(Math.random() * g.memberIds.length)];
      }
    });
    return initial;
  });

  const handleTabChange = useCallback((groupId: string, eventId: string) => {
    setGroupActiveTab((prev) =>
      prev[groupId] === eventId ? prev : { ...prev, [groupId]: eventId }
    );
  }, []);

  // 带 sheet 的卡片自动轮播：每 5 分钟切到组内下一个选项，保证不同时期的内容都能兼顾看到
  useEffect(() => {
    const timer = setInterval(() => {
      setGroupActiveTab((prev) => {
        const next: Record<string, string> = { ...prev };
        EVENT_GROUPS.forEach((g) => {
          if (g.memberIds.length <= 1) return;
          const curIdx = g.memberIds.indexOf(prev[g.groupId] ?? g.primaryId);
          next[g.groupId] = g.memberIds[(curIdx + 1) % g.memberIds.length];
        });
        return next;
      });
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Viewport scroll metrics
  const [scrollState, setScrollState] = useState({
    scrollLeft: 0,
    scrollTop: 0,
    clientWidth: 1200,
    clientHeight: 800,
  });

  // High-performance direct drag references (zero lag, 60fps/120fps hardware parity with mouse wheel)
  const isDraggingRef = useRef(false);
  const lastClientXRef = useRef(0);
  const lastClientYRef = useRef(0);
  // 拖拽真正发生前不触发 pointer-events:none，保证单击卡片事件可达（点击激活连线）
  const dragMovedRef = useRef(false);
  const pressStartRef = useRef({ x: 0, y: 0 });
  const activePeriodRef = useRef<number>(1);

  // —— 缩放帧同步引用：滚轮缩放期间直写 DOM、状态经 rAF 合并提交，杜绝逐事件全量重渲染 ——
  const wrapperRef = useRef<HTMLDivElement>(null); // 外层尺寸容器（决定滚动范围）
  const innerRef = useRef<HTMLDivElement>(null); // 缩放变换容器（transform: scale）
  const zoomLevelRef = useRef(zoomLevel); // 立即跟随滚轮更新，保证同帧连续事件不丢
  const pendingZoomRef = useRef<number | null>(null); // 待提交的最新缩放状态
  const frameRafRef = useRef<number | null>(null); // rAF 去重句柄

  // —— 编辑模式：卡片水平拖拽 ——
  // 拖拽过程中用本地状态实时渲染位置与延伸线，抬手后再提交给父级持久化
  const [dragPosition, setDragPosition] = useState<{ groupId: string; x: number } | null>(null);
  const dragPositionRef = useRef<{ groupId: string; x: number } | null>(null);

  /** 卡片位实际左边界 X：拖拽中 > 已保存的自定义位置 > 默认布局 */
  const resolveGroupX = useCallback(
    (groupId: string, fallbackX: number) => {
      if (dragPosition?.groupId === groupId) return dragPosition.x;
      const saved = cardXs?.[groupId];
      return typeof saved === 'number' ? saved : fallbackX;
    },
    [dragPosition, cardXs]
  );

  const handleMoveCard = useCallback((eventId: string, rawX: number) => {
    const groupId = EVENT_GROUP_OF[eventId] ?? eventId;
    const exactX = GROUP_BY_ID[groupId]?.exactX ?? EVENT_LAYOUT_COORDS[eventId]?.exactX ?? rawX;
    // 吸附：左边界接近该卡片正确的年份刻度（屏幕 12px 内）时直接对齐
    const snapDistance = 12 / (zoomLevelRef.current || 1);
    const snapped = Math.abs(rawX - exactX) <= snapDistance ? exactX : rawX;
    const next = Math.max(0, Math.min(TOTAL_CANVAS_WIDTH - 60, snapped));
    dragPositionRef.current = { groupId, x: next };
    setDragPosition(dragPositionRef.current);
  }, []);

  const handleMoveCardEnd = useCallback(() => {
    const pos = dragPositionRef.current;
    dragPositionRef.current = null;
    setDragPosition(null);
    if (pos) onMoveCard?.(pos.groupId, Math.round(pos.x));
  }, [onMoveCard]);

  // 延伸线随卡片位置实时生成：只要左边界与正确刻度错位就画线（含拖拽后被移开的卡片）
  const leaderLines = useMemo<LeaderLineInfo[]>(() => {
    const lines: LeaderLineInfo[] = [];
    EVENT_GROUPS.forEach((group) => {
      if (!activeTracks.has(group.track)) return;
      const placedX = resolveGroupX(group.groupId, group.x);
      if (Math.abs(placedX - group.exactX) < 0.5) return;
      const base = EVENT_LEADER_LINES.find((line) => line.id === group.primaryId);
      lines.push({
        id: group.primaryId,
        title: EVENT_BY_ID[group.primaryId]?.title ?? '',
        track: group.track,
        y: group.y,
        exactX: group.exactX,
        placedX,
        shiftAmount: placedX - group.exactX,
        dateLabel: group.dateLabel,
        tier: base?.tier ?? 0,
      });
    });
    return lines;
  }, [activeTracks, resolveGroupX]);

  // 连线锚点用的实际卡片盒：编辑模式拖动/调宽后位置与宽度都会实时反映到连线上
  const resolvedCoords = useMemo(() => {
    const map: Record<string, { x: number; y: number; width: number }> = {};
    EVENT_GROUPS.forEach((group) => {
      const x = resolveGroupX(group.groupId, group.x);
      group.memberIds.forEach((id) => {
        const coord = EVENT_LAYOUT_COORDS[id];
        if (!coord) return;
        map[id] = {
          x,
          y: coord.y,
          width: cardWidths?.[group.groupId] ?? cardWidths?.[id] ?? coord.width ?? CARD_WIDTH,
        };
      });
    });
    return map;
  }, [resolveGroupX, cardWidths]);

  // Count events per track (3 tracks)
  const eventCounts = useMemo(() => {
    const counts: Record<TrackId, number> = {
      meeting: 0,
      armed: 0,
      works: 0,
    };
    HISTORY_EVENTS.forEach((e) => {
      counts[e.track] = (counts[e.track] || 0) + 1;
    });
    return counts;
  }, []);

  // —— 帧合并刷新：缩放状态提交与滚动状态刷新合并到每帧至多一次 ——
  const queueSaveView = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const zoom = zoomLevelRef.current || 1;
    const next = { x: el.scrollLeft / zoom, y: el.scrollTop / zoom };
    savedViewRef.current = next;
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      try {
        localStorage.setItem(VIEW_STATE_KEY, JSON.stringify(next));
      } catch {
        // 隐私模式或存储受限时忽略，仅影响记忆功能
      }
    }, 300);
  }, []);

  const flushFrame = useCallback(() => {
    // 提交最新缩放状态（每帧至多一次，且始终取最新值，快速滚轮不丢步）
    if (pendingZoomRef.current !== null) {
      const z = pendingZoomRef.current;
      pendingZoomRef.current = null;
      onZoomChange?.(z);
    }

    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollTop, clientWidth, clientHeight } = el;

    // Check active period in real-time, but ONLY notify parent when boundary actually changes!
    const virtualX = scrollLeft / zoomLevelRef.current + 200;
    const boundary = PERIOD_BOUNDARIES.find((p) => virtualX >= p.startX && virtualX <= p.endX);
    if (boundary && boundary.id !== activePeriodRef.current) {
      activePeriodRef.current = boundary.id;
      onActivePeriodChange?.(boundary.id);
    }

    setScrollState({ scrollLeft, scrollTop, clientWidth, clientHeight });
    queueSaveView();
  }, [onZoomChange, onActivePeriodChange, queueSaveView]);

  const scheduleFlush = useCallback(() => {
    if (frameRafRef.current !== null) return;
    frameRafRef.current = requestAnimationFrame(() => {
      frameRafRef.current = null;
      flushFrame();
    });
  }, [flushFrame]);

  const flushNow = useCallback(() => {
    if (frameRafRef.current !== null) {
      cancelAnimationFrame(frameRafRef.current);
      frameRafRef.current = null;
    }
    flushFrame();
  }, [flushFrame]);

  // —— 视窗位置记忆：按虚拟画布坐标（除以缩放）缓存，下次打开恢复到上次停留处 ——
  const savedViewRef = useRef<{ x: number; y: number } | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  // Update viewport metrics and active period（滚动状态刷新按帧合并，避免滚轮期间逐事件重渲染）
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    // When actively dragging with mouse, skip React state re-render entirely to guarantee 60fps/120fps hardware lock
    if (isDraggingRef.current) {
      return;
    }

    scheduleFlush();
  }, [scheduleFlush]);

  // 卸载时取消未执行的帧刷新
  useEffect(
    () => () => {
      if (frameRafRef.current !== null) cancelAnimationFrame(frameRafRef.current);
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    },
    []
  );

  // Smooth scroll to X position
  const scrollToX = useCallback((x: number) => {
    if (!containerRef.current) return;
    const target = Math.max(0, x - 120);
    containerRef.current.scrollTo({
      left: target,
      behavior: 'smooth',
    });
  }, []);

  // Smooth scroll vertically to target Y（读 ref 保持回调稳定，缩放提交时不再级联重渲染连线层）
  const scrollToY = useCallback((y: number) => {
    if (!containerRef.current) return;
    const target = Math.max(0, y * zoomLevelRef.current - 130);
    containerRef.current.scrollTo({
      top: target,
      behavior: 'smooth',
    });
  }, []);

  // Jump to historical period
  const jumpToPeriod = useCallback(
    (periodId: number) => {
      const boundary = PERIOD_BOUNDARIES.find((b) => b.id === periodId);
      if (boundary) {
        scrollToX(boundary.startX);
      }
    },
    [scrollToX]
  );

  // Jump to specific event card with smooth viewport centering（读 ref 保持回调稳定）
  const navigateToCard = useCallback(
    (eventId: string) => {
      setSelectedEventId(eventId);
      // 目标事件若在同年合并组内，先切换到对应选项卡
      const groupId = EVENT_GROUP_OF[eventId];
      if (groupId) {
        setGroupActiveTab((prev) =>
          prev[groupId] === eventId ? prev : { ...prev, [groupId]: eventId }
        );
      }
      const coord = EVENT_LAYOUT_COORDS[eventId];
      if (coord && containerRef.current) {
        // 编辑模式可能调整过卡片位置，居中跳转需按当前实际左边界计算
        const savedX = groupId ? cardXs?.[groupId] : undefined;
        const cardX = typeof savedX === 'number' ? savedX : coord.x;
        const targetScrollLeft = Math.max(
          0,
          (cardX + (coord.width ?? CARD_WIDTH) / 2) * zoomLevelRef.current - containerRef.current.clientWidth / 2
        );
        const targetScrollTop = Math.max(
          0,
          coord.y * zoomLevelRef.current - 150
        );
        containerRef.current.scrollTo({
          left: targetScrollLeft,
          top: targetScrollTop,
          behavior: 'smooth',
        });
      }
    },
    [cardXs]
  );

  // 搜索定位到组内成员时，自动切换到该成员所在选项卡，保证高亮内容可见
  useEffect(() => {
    if (!currentMatchedEventId) return;
    const groupId = EVENT_GROUP_OF[currentMatchedEventId];
    if (!groupId) return;
    setGroupActiveTab((prev) =>
      prev[groupId] === currentMatchedEventId ? prev : { ...prev, [groupId]: currentMatchedEventId }
    );
  }, [currentMatchedEventId]);

  useEffect(() => {
    onRegisterJumpHandler(jumpToPeriod);
    onRegisterNavigateHandler(navigateToCard);
  }, [jumpToPeriod, navigateToCard, onRegisterJumpHandler, onRegisterNavigateHandler]);

  // 初始定位：优先恢复上次停留位置，首次打开则从 1840 年开始
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      let target: { x: number; y: number } | null = savedViewRef.current;
      if (!target) {
        try {
          const raw = localStorage.getItem(VIEW_STATE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { x?: number; y?: number };
            if (typeof parsed.x === 'number') {
              target = { x: parsed.x, y: typeof parsed.y === 'number' ? parsed.y : 0 };
            }
          }
        } catch {
          // 缓存损坏时回落到默认起始年
        }
      }
      const zoom = zoomLevelRef.current || 1;
      el.style.scrollBehavior = 'auto';
      el.scrollLeft = Math.max(0, (target ? target.x : START_VIEW_X) * zoom);
      el.scrollTop = Math.max(0, (target ? target.y : 0) * zoom);
    }
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('resize', handleScroll);
    };
    // 仅在挂载时恢复一次视窗位置：若依赖 handleScroll（其依赖链含内联 onActivePeriodChange），
    // 父组件每次渲染都会重跑本 effect 并回写 scrollLeft，打断上/下搜索切换刚发起的平滑跳转
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global Pointer Events for instantaneous 1:1 hardware drag panning (same smoothness as mouse wheel)
  useEffect(() => {
    const onGlobalPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      e.preventDefault();

      // 仅当指针真正移动超过阈值时，才进入拖拽态（禁用卡片 pointer-events 以保证平移流畅）
      if (
        !dragMovedRef.current &&
        (Math.abs(e.clientX - pressStartRef.current.x) > 3 ||
          Math.abs(e.clientY - pressStartRef.current.y) > 3)
      ) {
        dragMovedRef.current = true;
        setIsDragging(true);
      }

      // Synchronous delta calculation: 0ms latency, runs at display refresh rate
      const dx = e.clientX - lastClientXRef.current;
      const dy = e.clientY - lastClientYRef.current;
      lastClientXRef.current = e.clientX;
      lastClientYRef.current = e.clientY;

      containerRef.current.scrollLeft -= dx;
      containerRef.current.scrollTop -= dy;
    };

    const onGlobalPointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        dragMovedRef.current = false;
        setIsDragging(false);

        // Instantly flush final scroll position for ▲ / ▼ indicators
        flushNow();
      }
    };

    window.addEventListener('pointermove', onGlobalPointerMove, { passive: false });
    window.addEventListener('pointerup', onGlobalPointerUp);
    window.addEventListener('pointercancel', onGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', onGlobalPointerMove);
      window.removeEventListener('pointerup', onGlobalPointerUp);
      window.removeEventListener('pointercancel', onGlobalPointerUp);
    };
  }, [flushNow]);

  // 外部（工具栏按钮等）改动缩放状态时同步 ref
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  // Mouse wheel interaction:
  // 1. Alt + Wheel: Vertical scroll (上下滚动)
  // 2. Normal Wheel: Proportional canvas zoom (整个画布的比例缩放，下滚为缩小，上滚为放大)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Ensure native scrollBehavior doesn't lag or animate focal zoom
      container.style.scrollBehavior = 'auto';

      // 1. Alt + wheel: Vertical scroll (上下滚动)
      if (e.altKey) {
        e.preventDefault();
        container.scrollTop += e.deltaY;
        return;
      }

      // Shift + wheel: Horizontal scroll (水平平移)
      if (e.shiftKey) {
        e.preventDefault();
        container.scrollLeft += e.deltaY || e.deltaX;
        return;
      }

      // 2. Normal wheel or Ctrl + wheel (touchpad pinch): Proportional canvas zoom centered on mouse cursor
      // 滚轮上滚为放大 (deltaY < 0 -> zoom in)，下滚为缩小 (deltaY > 0 -> zoom out)
      e.preventDefault();
      const currentZoom = zoomLevelRef.current;

      // 与滚轮增量成比例的平滑缩放（100px/格 ≈ 8%，与原手感一致；触控板小增量同样平滑）
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
      const rawFactor = Math.pow(1.0008, -dy);
      const factor = Math.min(1.25, Math.max(0.8, rawFactor));
      const targetZoom = Math.min(
        2.0,
        Math.max(0.4, Number((currentZoom * factor).toFixed(3)))
      );

      if (targetZoom === currentZoom) return;

      // Mouse position relative to viewport container
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // World coordinate of canvas point under cursor before zoom
      const canvasX = (container.scrollLeft + mouseX) / currentZoom;
      const canvasY = (container.scrollTop + mouseY) / currentZoom;

      // Desired scroll position so that (canvasX, canvasY) remains precisely under (mouseX, mouseY)
      const nextScrollLeft = Math.max(0, canvasX * targetZoom - mouseX);
      const nextScrollTop = Math.max(0, canvasY * targetZoom - mouseY);

      // 同步直写 DOM：先更新外层滚动尺寸与缩放变换，再写滚动位置——
      // 滚动范围先于滚动值更新，缩放中心不会被旧尺寸截断漂移；无须等待 React 提交帧
      if (wrapperRef.current) {
        wrapperRef.current.style.width = `${Math.round(TOTAL_CANVAS_WIDTH * targetZoom)}px`;
        wrapperRef.current.style.height = `${Math.round(CANVAS_HEIGHT * targetZoom)}px`;
      }
      if (innerRef.current) {
        innerRef.current.style.transform = `scale(${targetZoom}) translate3d(0, 0, 0)`;
      }
      container.scrollLeft = nextScrollLeft;
      container.scrollTop = nextScrollTop;

      // 立即更新 ref：同帧内连续滚轮事件基于最新缩放继续计算，不丢任何一步
      zoomLevelRef.current = targetZoom;
      pendingZoomRef.current = targetZoom;
      // React 状态提交按帧合并（每帧至多一次全量重渲染）
      scheduleFlush();
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [scheduleFlush]);

  // Mouse / Pointer Down Handler
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only primary button
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.closest('button') ||
      target.closest('input')
    ) {
      return;
    }

    if (!containerRef.current) return;
    isDraggingRef.current = true;
    dragMovedRef.current = false;
    pressStartRef.current = { x: e.clientX, y: e.clientY };
    lastClientXRef.current = e.clientX;
    lastClientYRef.current = e.clientY;

    containerRef.current.style.scrollBehavior = 'auto'; // Instant 1:1 response
  };

  // Calculate hidden cards above and below the visible viewport
  const { hiddenAboveCards, hiddenBelowCards } = useMemo(() => {
    const { scrollLeft, scrollTop, clientWidth, clientHeight } = scrollState;
    const minVisibleX = scrollLeft / zoomLevel;
    const maxVisibleX = (scrollLeft + clientWidth) / zoomLevel;
    const minVisibleY = scrollTop / zoomLevel;
    const maxVisibleY = (scrollTop + clientHeight) / zoomLevel;

    // 以「同年合并组」为单位取窗口内当前展示的卡片（每组只产生一个上下箭头）
    const inWindowCards = EVENT_GROUPS
      .filter((g) => activeTracks.has(g.track))
      .map((g) => {
        const activeId = groupActiveTab[g.groupId] ?? g.primaryId;
        const coord = EVENT_LAYOUT_COORDS[activeId];
        // 上下指示箭头需跟随编辑模式调整后的实际位置
        const movedX = resolveGroupX(g.groupId, g.x);
        return {
          event: EVENT_BY_ID[activeId],
          coord: coord ? { ...coord, x: movedX } : coord,
        };
      })
      .filter((item) => {
        if (!item.event || !item.coord) return false;
        const { coord } = item;
        return coord.x + (coord.width ?? CARD_WIDTH) >= minVisibleX - 10 && coord.x <= maxVisibleX + 10;
      });

    // Hidden above: card bottom is completely above visible top edge (under 96px top ruler)
    const aboveRaw = inWindowCards
      .filter(({ coord }) => coord.y + 260 <= minVisibleY + 96)
      .map(({ event, coord }) => {
        const screenX = (coord.x + (coord.width ?? CARD_WIDTH) / 2) * zoomLevel - scrollLeft;
        return {
          event,
          coord,
          screenX,
        };
      })
      .filter((item) => item.screenX >= 20 && item.screenX <= clientWidth - 20)
      .sort((a, b) => a.screenX - b.screenX);

    // Stagger close triangles so both ▲ symbols are clearly visible side by side
    const above = aboveRaw.map((item, idx, arr) => {
      let offset = 0;
      if (idx > 0 && Math.abs(item.screenX - arr[idx - 1].screenX) < 26) {
        offset = 14;
      } else if (idx < arr.length - 1 && Math.abs(arr[idx + 1].screenX - item.screenX) < 26) {
        offset = -14;
      }
      return { ...item, displayX: item.screenX + offset };
    });

    // Hidden below: card top is completely below visible bottom edge
    const belowRaw = inWindowCards
      .filter(({ coord }) => coord.y >= maxVisibleY - 70)
      .map(({ event, coord }) => {
        const screenX = (coord.x + (coord.width ?? CARD_WIDTH) / 2) * zoomLevel - scrollLeft;
        return {
          event,
          coord,
          screenX,
        };
      })
      .filter((item) => item.screenX >= 20 && item.screenX <= clientWidth - 20)
      .sort((a, b) => a.screenX - b.screenX);

    const below = belowRaw.map((item, idx, arr) => {
      let offset = 0;
      if (idx > 0 && Math.abs(item.screenX - arr[idx - 1].screenX) < 26) {
        offset = 14;
      } else if (idx < arr.length - 1 && Math.abs(arr[idx + 1].screenX - item.screenX) < 26) {
        offset = -14;
      }
      return { ...item, displayX: item.screenX + offset };
    });

    return {
      hiddenAboveCards: above,
      hiddenBelowCards: below,
    };
  }, [scrollState, zoomLevel, activeTracks, groupActiveTab, resolveGroupX]);

  // Color styles and theme labels for ▲ / ▼ according to the track (3 tracks)
  const getTriangleTheme = (trackId: TrackId, isMarxism = false) => {
    // 马原·科学社会主义卡片为灰调主题，指示标同步使用 slate 灰，与卡片头部一致
    if (isMarxism) {
      return {
        themeName: '马原·科学社会主义',
        color: 'text-slate-500 dark:text-zinc-400',
        fill: '#94a3b8',
        btnClass:
          'bg-slate-100/95 dark:bg-zinc-800/90 border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700/90 shadow-xs',
      };
    }
    switch (trackId) {
      case 'meeting':
        return {
          themeName: '核心会议',
          color: 'text-red-400 dark:text-red-300',
          fill: '#f87171',
          btnClass:
            'bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/80 shadow-xs',
        };
      case 'armed':
        return {
          themeName: '武装斗争',
          color: 'text-amber-500 dark:text-amber-300',
          fill: '#fbbf24',
          btnClass:
            'bg-amber-50/95 dark:bg-amber-950/90 border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/80 shadow-xs',
        };
      case 'works':
      default:
        return {
          themeName: '思想著作与教训',
          color: 'text-emerald-500 dark:text-emerald-300',
          fill: '#34d399',
          btnClass:
            'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 shadow-xs',
        };
    }
  };

  // Filter events by search query
  const isEventMatchingSearch = useCallback(
    (event: HistoryEvent) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      if (event.title.toLowerCase().includes(q)) return true;
      if (event.subtitle?.toLowerCase().includes(q)) return true;
      if (event.dateStr.toLowerCase().includes(q)) return true;
      if (event.examSummary?.toLowerCase().includes(q)) return true;
      return event.items.some(
        (item) =>
          item.text.toLowerCase().includes(q) ||
          item.highlights.some((h) => h.toLowerCase().includes(q))
      );
    },
    [searchQuery]
  );

  // Stable memoized handlers for EventCard to eliminate unnecessary re-renders
  const handleCardHover = useCallback((id: string | null) => {
    if (!isDraggingRef.current) {
      setActiveEventId(id);
    }
  }, []);

  const handleCardSelect = useCallback(
    (ev: HistoryEvent) => {
      // 点击卡片激活其导图连线并持续显示；再次点击同一卡片则取消激活
      setSelectedEventId((prev) => (prev === ev.id ? null : ev.id));
      onSelectEvent(ev);
    },
    [onSelectEvent]
  );

  const handleCardDetail = useCallback(
    (ev: HistoryEvent) => {
      onOpenDetailModal(ev);
    },
    [onOpenDetailModal]
  );

  // 按下 ESC 取消当前激活的卡片连线
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEventId(null);
        setActiveEventId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── 全局俯瞰图 Minimap 计算 ──
  const MAP_WIDTH = TOTAL_CANVAS_WIDTH;
  const virtualScrollX = scrollState.scrollLeft / zoomLevel;
  const virtualClientW = scrollState.clientWidth / zoomLevel;

  const minimapEvents = useMemo(
    () =>
      EVENT_GROUPS
        .filter((g) => activeTracks.has(g.track))
        .map((g) => ({
          id: g.groupId,
          track: g.track,
          xPct: ((g.exactX + g.width / 2) / MAP_WIDTH) * 100,
        })),
    [activeTracks]
  );

  const minimapPeriods = useMemo(
    () =>
      PERIOD_BOUNDARIES.map((p) => ({
        id: p.id,
        title: p.shortTitle,
        xPct: (p.startX / MAP_WIDTH) * 100,
      })),
    []
  );

  // 当前视口中心所在区段的时间比例系数（1.5× 表示处于密集期放大区段）
  const viewScale = getScaleAtX(virtualScrollX + virtualClientW / 2);
  // 选中事件所属的同年合并组（用于俯瞰图高亮）
  const selectedGroupId = selectedEventId ? EVENT_GROUP_OF[selectedEventId] : undefined;
  const visibleEventCount = HISTORY_EVENTS.filter((e) => activeTracks.has(e.track)).length;

  const viewportBox = {
    leftPct: Math.max(0, (virtualScrollX / MAP_WIDTH) * 100),
    widthPct: Math.min(100, (virtualClientW / MAP_WIDTH) * 100),
  };

  const handleMinimapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickPct = (e.clientX - rect.left) / rect.width;
      const targetX = clickPct * TOTAL_CANVAS_WIDTH;
      scrollToX(targetX);
    },
    [scrollToX]
  );

  return (
    <div className="c73">
      {/* Top ▲ markers at exact horizontal X of each hidden card (Direct clean triangle, no bounce animation) */}
      {hiddenAboveCards.map(({ event, coord, displayX }) => {
        const theme = getTriangleTheme(
          event.track,
          Boolean(event.isScientificSocialism || event.periodId === 0)
        );
        return (
          <div
            key={`above-${event.id}`}
            style={{
              position: 'absolute',
              left: `${displayX}px`,
              top: `${Math.round(96 * zoomLevel + 6)}px`,
              zIndex: 35,
              transform: 'translateX(-50%)',
            }}
          >
            <button
              onClick={() => scrollToY(coord.y)}
              className={`c112 hover:scale-110 active:scale-95 ${theme.btnClass}`}
              title={`点击向上移动至【${theme.themeName}】: ${event.title}`}
            >
              <svg viewBox="0 0 10 9" className="w-3.5 h-3" fill={theme.fill} aria-hidden="true">
                <polygon points="5 0.5, 9.5 8.5, 0.5 8.5" />
              </svg>
              {/* Micro hover tooltip */}
              <div className="absolute top-full mt-1.5 z-50 flex-col items-center pointer-events-none whitespace-nowrap hidden group-hover:flex">
                <span className="c78" style={theme.fill ? { background: '#0f172a', color: '#f1f5f9' } : undefined}>
                  {theme.themeName} · {event.title}
                </span>
              </div>
            </button>
          </div>
        );
      })}

      {/* Bottom ▼ markers at exact horizontal X of each hidden card (Direct clean triangle, no bounce animation) */}
      {hiddenBelowCards.map(({ event, coord, displayX }) => {
        const theme = getTriangleTheme(
          event.track,
          Boolean(event.isScientificSocialism || event.periodId === 0)
        );
        return (
          <div
            key={`below-${event.id}`}
            style={{
              position: 'absolute',
              left: `${displayX}px`,
              bottom: '12px',
              zIndex: 35,
              transform: 'translateX(-50%)',
            }}
          >
            <button
              onClick={() => scrollToY(coord.y)}
              className={`c112 hover:scale-110 active:scale-95 ${theme.btnClass}`}
              title={`点击向下移动至【${theme.themeName}】: ${event.title}`}
            >
              <svg viewBox="0 0 10 9" className="w-3.5 h-3" fill={theme.fill} aria-hidden="true">
                <polygon points="0.5 0.5, 9.5 0.5, 5 8.5" />
              </svg>
              {/* Micro hover tooltip */}
              <div className="absolute bottom-full mb-1.5 hidden group-hover:flex z-50 flex-col items-center pointer-events-none whitespace-nowrap">
                <span className="c78 shadow-md">
                  {theme.themeName} · {event.title}
                </span>
              </div>
            </button>
          </div>
        );
      })}

      {/* Scrollable Canvas Viewport with GPU hardware-accelerated pan */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        style={{
          willChange: 'scroll-position',
          touchAction: 'none',
        }}
        className={`c74 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* 顶部时间轴固定层：脱离缩放变换，垂直方向始终吸附视口顶部；负边距抵消占位，保持画布坐标原点不变 */}
        <div
          className="sticky top-0 z-30"
          style={{
            width: `${Math.round(TOTAL_CANVAS_WIDTH * zoomLevel)}px`,
            height: `${Math.round(96 * zoomLevel)}px`,
            marginBottom: `${-Math.round(96 * zoomLevel)}px`,
          }}
        >
          <div
            style={{
              width: `${TOTAL_CANVAS_WIDTH}px`,
              height: '96px',
              transform: `scale(${zoomLevel})`,
              transformOrigin: '0 0',
            }}
          >
            <TimelineScale
              showGuides={false}
              scrollLeft={scrollState.scrollLeft / zoomLevel}
              onJumpToPeriod={(startX) => scrollToX(startX)}
              onJumpToX={(x) => scrollToX(x)}
            />
          </div>
        </div>

        {/* Sizing wrapper ensuring container scrollWidth/scrollHeight tracks zoomLevel exactly */}
        <div
          ref={wrapperRef}
          style={{
            width: `${Math.round(TOTAL_CANVAS_WIDTH * zoomLevel)}px`,
            height: `${Math.round(CANVAS_HEIGHT * zoomLevel)}px`,
            position: 'relative',
          }}
        >
          {/* Transform Container for Zooming with 3D Composite Layer */}
          <div
            ref={innerRef}
            style={{
              width: `${TOTAL_CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              transform: `scale(${zoomLevel}) translate3d(0, 0, 0)`,
              transformOrigin: '0 0',
              backfaceVisibility: 'hidden',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
            className="origin-top-left"
          >
            {/* 画布缩放层内只保留泳道背景引导线，刻度条移出到下方固定层 */}
            <TimelineScale
              showRuler={false}
              scrollLeft={scrollState.scrollLeft / zoomLevel}
              onJumpToPeriod={(startX) => scrollToX(startX)}
              onJumpToX={(x) => scrollToX(x)}
            />

            {/* Left Vertical Category Header (极简单列竖排标题，精确对应各排) */}
            <TrackHeader
              activeTracks={activeTracks}
              eventCounts={eventCounts}
              scrollLeft={scrollState.scrollLeft / zoomLevel}
            />

            {/* Mind Map Connections with Strictly Horizontal Arrow Lead-in */}
            <SvgConnections
              events={HISTORY_EVENTS}
              activeEventId={activeEventId}
              selectedEventId={selectedEventId}
              showConnections={showConnections}
              cardHeights={cardHeights}
              coords={resolvedCoords}
              onSelectEvent={navigateToCard}
            />

            {/* Orthogonal Horizontal-Vertical Leader Lines for displaced cards pointing to exact ticks */}
            <LeaderLinesLayer
              leaderLines={leaderLines}
              activeTracks={activeTracks}
              activeEventId={activeEventId}
              selectedEventId={selectedEventId}
              searchQuery={searchQuery}
              onSelectEvent={navigateToCard}
            />

            {/* 大事记锚点（非核心显示）：只补时间轴背景节点，不参与卡片布局与真题匹配 */}
            {MARKER_COORDS.length > 0 && (
              <div
                className="absolute pointer-events-none"
                style={{ left: 0, top: 1662, width: `${TOTAL_CANVAS_WIDTH}px` }}
              >
                {MARKER_COORDS.map((marker) => (
                  <div
                    key={marker.id}
                    title={marker.note ? `${marker.title}｜${marker.note}` : marker.title}
                    className="absolute whitespace-nowrap rounded-full border border-dashed border-slate-300/80 bg-white/75 px-1.5 py-0.5 text-[10px] leading-none text-slate-500 pointer-events-auto dark:border-slate-600/70 dark:bg-slate-800/75 dark:text-slate-400"
                    style={{ left: `${marker.x}px`, top: `${marker.tier * MARKER_ROW_GAP}px` }}
                  >
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{marker.label}</span>
                    <span className="ml-1">{marker.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Event Cards (pointer-events set to none during drag to preserve 60fps) */}
            <div style={{ pointerEvents: isDragging ? 'none' : 'auto' }}>
              {EVENT_GROUPS.map((group, groupIndex) => {
                if (!activeTracks.has(group.track)) return null;

                // 同组内默认展示核心枢纽，其次为时间最早的一张；用户切换后按切换结果显示
                const activeId = groupActiveTab[group.groupId] ?? group.primaryId;
                const event = EVENT_BY_ID[activeId];
                const coord = EVENT_LAYOUT_COORDS[activeId];
                if (!event || !coord) return null;

                const groupEvents = group.memberIds
                  .map((id) => EVENT_BY_ID[id])
                  .filter((m): m is HistoryEvent => Boolean(m));

                const matchesSearch = isEventMatchingSearch(event);
                const isCardActive = activeEventId === event.id;
                const isCardSelected = selectedEventId === event.id;
                // 选中态与搜索态共用同一套淡化样式：非相关卡片降到 30% 透明度并轻微缩小
                const isSelectionRelated =
                  !relatedEventIds ||
                  relatedEventIds.has(event.id) ||
                  group.memberIds.some((id) => relatedEventIds.has(id));
                const isDimmed =
                  (searchQuery.trim() !== '' && !matchesSearch) || !isSelectionRelated;

                const trackDef = TRACKS.find((t) => t.id === event.track)!;
                const isHighlighted = isCardActive || isCardSelected || event.id === currentMatchedEventId;
                const cardX = resolveGroupX(group.groupId, coord.x);
                const zIndex = getCardZIndex(event, groupIndex, isCardActive, isCardSelected, isHighlighted);

                return (
                  <div
                    key={group.groupId}
                    style={{
                      position: 'absolute',
                      left: `${cardX}px`,
                      top: `${coord.y}px`,
                      zIndex,
                    }}
                  >
                    <EventCard
                      event={event}
                      track={trackDef}
                      isActive={isCardActive}
                      isSelected={isCardSelected}
                      isDimmed={isDimmed}
                      isQuizMode={isQuizMode}
                      searchQuery={searchQuery}
                      isCurrentSearchFocus={event.id === currentMatchedEventId}
                      searchMatchRank={
                        event.id === currentMatchedEventId ? searchMatchRank : undefined
                      }
                      cardWidth={
                        cardWidths?.[group.groupId] ?? cardWidths?.[activeId] ?? coord.width
                      }
                      isEditMode={isEditMode}
                      onResizeWidth={(eventId, width) =>
                        // 同一卡片位上的多个事件共用一张卡，宽度按组保存，切换 sheet 后保持
                        onResizeCard?.(EVENT_GROUP_OF[eventId] ?? eventId, width)
                      }
                      resizeScale={zoomLevel}
                      placedX={cardX}
                      dragScale={zoomLevel}
                      onMoveCard={isEditMode ? handleMoveCard : undefined}
                      onMoveCardEnd={handleMoveCardEnd}
                      groupEvents={groupEvents}
                      onTabChange={(id) => handleTabChange(group.groupId, id)}
                      onHover={handleCardHover}
                      onSelect={handleCardSelect}
                      onOpenDetail={handleCardDetail}
                      onOpenPractice={onOpenPracticeModal}
                      examCount={examCounts?.[event.id]}
                      onNavigateTo={navigateToCard}
                      onCardHeight={handleCardHeight}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 全局俯瞰图 Minimap（Bottom Right） */}
      <div className="c113">
        <div className="c146">
          <span className="font-bold">全局俯瞰图</span>
          {/* 轨道图例开关：决策 / 斗争 / 思想，悬浮即可显隐对应轨道 */}
          <div className="flex items-center gap-0.5">
            {TRACKS.map((t) => {
              const isActive = activeTracks.has(t.id);
              const shortLabel =
                t.id === 'meeting' ? '决策' : t.id === 'armed' ? '斗争' : '思想';
              return (
                <button
                  key={t.id}
                  onClick={() => onToggleTrack(t.id)}
                  title={`${isActive ? '隐藏' : '显示'}${t.badge}`}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: t.dotColor }}
                  />
                  <span>{shortLabel}</span>
                </button>
              );
            })}
          </div>
          <span className="flex items-center gap-1.5">
            <span className="c147">
              {visibleEventCount} 事件 · {minimapEvents.length} 卡片位 · {minimapPeriods.length - 1} 时期
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                viewScale !== 1
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
              title="当前视口所在区段的时间轴比例系数（1919-1950 为 1.5× 放大区段）"
            >
              {viewScale < 0.1 ? viewScale.toFixed(2) : viewScale.toFixed(1)}×
            </span>
          </span>
        </div>
        <div className="c148" style={{ height: 56 }} onClick={handleMinimapClick}>
          {/* 三轨道横向背景色带 */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-red-500/8 dark:bg-red-500/10" />
          <div className="absolute top-1/3 left-0 right-0 h-1/3 bg-amber-500/8 dark:bg-amber-500/10 border-y border-slate-200/60 dark:border-slate-700/50" />
          <div className="absolute top-2/3 left-0 right-0 h-1/3 bg-emerald-500/8 dark:bg-emerald-500/10" />

          {/* 时期分界竖线 */}
          {minimapPeriods.map((p) => (
            <div
              key={`period-sep-${p.id}`}
              className="c151"
              style={{ left: `${p.xPct}%` }}
              title={p.title}
            />
          ))}

          {/* 事件散点 —— 三轨道精确分段：meeting 0-33%, armed 33-66%, works 66-100% */}
          {minimapEvents.map((e) => {
            const trackColor =
              e.track === 'meeting'
                ? 'bg-red-600'
                : e.track === 'armed'
                ? 'bg-amber-600'
                : 'bg-emerald-600';
            const isSelected = e.id === selectedGroupId;
            const topY =
              e.track === 'meeting'
                ? 17 // 红带上缘 17%
                : e.track === 'armed'
                ? 50 // 琥珀带中心
                : 83; // 翠绿带下缘 83%
            return (
              <div
                key={`mm-${e.id}`}
                className={`c149 ${trackColor} ${isSelected ? 'w-3 h-3 ring-2 ring-amber-400' : ''}`}
                style={{ left: `${e.xPct}%`, top: `${topY}%` }}
              />
            );
          })}

          {/* 当前视口矩形框 */}
          <div
            className="c150"
            style={{
              left: `${viewportBox.leftPct}%`,
              width: `${viewportBox.widthPct}%`,
              top: '0',
              height: '100%',
            }}
          />
        </div>
      </div>
    </div>
  );
};
