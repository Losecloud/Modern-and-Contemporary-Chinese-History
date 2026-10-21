import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { HistoryEvent, TrackId, getCardZIndex } from '../types/history';
import { HISTORY_EVENTS, TRACKS } from '../data/historyData';
import {
  EVENT_LAYOUT_COORDS,
  EVENT_LEADER_LINES,
  TOTAL_CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CARD_WIDTH,
  PERIOD_BOUNDARIES,
} from '../utils/canvasLayout';
import { TimelineScale } from './TimelineScale';
import { TrackHeader } from './TrackHeader';
import { EventCard } from './EventCard';
import { SvgConnections } from './SvgConnections';
import { LeaderLinesLayer } from './LeaderLinesLayer';
import { MapPin, Navigation } from 'lucide-react';

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
  onRegisterJumpHandler: (fn: (periodId: number) => void) => void;
  onRegisterNavigateHandler: (fn: (eventId: string) => void) => void;
  onActivePeriodChange?: (periodId: number) => void;
}

export const HistoryCanvas: React.FC<HistoryCanvasProps> = ({
  searchQuery,
  currentMatchedEventId,
  searchMatchRank,
  activeTracks,
  showConnections,
  isQuizMode,
  zoomLevel,
  onZoomChange,
  onSelectEvent,
  onOpenDetailModal,
  onRegisterJumpHandler,
  onRegisterNavigateHandler,
  onActivePeriodChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
  }, [onZoomChange, onActivePeriodChange]);

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
      const coord = EVENT_LAYOUT_COORDS[eventId];
      if (coord && containerRef.current) {
        const targetScrollLeft = Math.max(
          0,
          (coord.x + CARD_WIDTH / 2) * zoomLevelRef.current - containerRef.current.clientWidth / 2
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
    []
  );

  useEffect(() => {
    onRegisterJumpHandler(jumpToPeriod);
    onRegisterNavigateHandler(navigateToCard);
  }, [jumpToPeriod, navigateToCard, onRegisterJumpHandler, onRegisterNavigateHandler]);

  // Initial size measure & window resize listener
  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

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

    // Filter events in current horizontal window
    const inWindowEvents = HISTORY_EVENTS.filter((ev) => {
      if (!activeTracks.has(ev.track)) return false;
      const coord = EVENT_LAYOUT_COORDS[ev.id];
      if (!coord) return false;
      return coord.x + CARD_WIDTH >= minVisibleX - 10 && coord.x <= maxVisibleX + 10;
    });

    // Hidden above: card bottom is completely above visible top edge (under 96px top ruler)
    const aboveRaw = inWindowEvents
      .filter((ev) => {
        const coord = EVENT_LAYOUT_COORDS[ev.id];
        const cardBottom = coord.y + 260;
        return cardBottom <= minVisibleY + 96;
      })
      .map((ev) => {
        const coord = EVENT_LAYOUT_COORDS[ev.id];
        const screenX = (coord.x + CARD_WIDTH / 2) * zoomLevel - scrollLeft;
        return {
          event: ev,
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
    const belowRaw = inWindowEvents
      .filter((ev) => {
        const coord = EVENT_LAYOUT_COORDS[ev.id];
        return coord.y >= maxVisibleY - 70;
      })
      .map((ev) => {
        const coord = EVENT_LAYOUT_COORDS[ev.id];
        const screenX = (coord.x + CARD_WIDTH / 2) * zoomLevel - scrollLeft;
        return {
          event: ev,
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
  }, [scrollState, zoomLevel, activeTracks]);

  // Color styles and theme labels for ▲ / ▼ according to the track (3 tracks)
  const getTriangleTheme = (trackId: TrackId) => {
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

  const scrollProgress =
    containerRef.current && containerRef.current.scrollWidth > containerRef.current.clientWidth
      ? scrollState.scrollLeft /
        (containerRef.current.scrollWidth - containerRef.current.clientWidth)
      : 0;

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-100/70 dark:bg-slate-950 flex flex-col select-none">
      {/* Top ▲ markers at exact horizontal X of each hidden card (Direct clean triangle, no bounce animation) */}
      {hiddenAboveCards.map(({ event, coord, displayX }) => {
        const theme = getTriangleTheme(event.track);
        return (
          <div
            key={`above-${event.id}`}
            style={{
              position: 'absolute',
              left: `${displayX}px`,
              top: '100px',
              zIndex: 35,
              transform: 'translateX(-50%)',
            }}
          >
            <button
              onClick={() => scrollToY(coord.y)}
              className={`group relative flex items-center justify-center w-7 h-7 rounded-md border backdrop-blur-md transition-transform hover:scale-110 active:scale-95 cursor-pointer ${theme.btnClass}`}
              title={`点击向上移动至【${theme.themeName}】: ${event.title}`}
            >
              <svg viewBox="0 0 10 9" className="w-3.5 h-3" fill={theme.fill} aria-hidden="true">
                <polygon points="5 0.5, 9.5 8.5, 0.5 8.5" />
              </svg>
              {/* Micro hover tooltip */}
              <div className="absolute top-full mt-1.5 hidden group-hover:flex z-50 flex-col items-center pointer-events-none whitespace-nowrap">
                <span className="px-2 py-1 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-medium shadow-md">
                  {theme.themeName} · {event.title}
                </span>
              </div>
            </button>
          </div>
        );
      })}

      {/* Bottom ▼ markers at exact horizontal X of each hidden card (Direct clean triangle, no bounce animation) */}
      {hiddenBelowCards.map(({ event, coord, displayX }) => {
        const theme = getTriangleTheme(event.track);
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
              className={`group relative flex items-center justify-center w-7 h-7 rounded-md border backdrop-blur-md transition-transform hover:scale-110 active:scale-95 cursor-pointer ${theme.btnClass}`}
              title={`点击向下移动至【${theme.themeName}】: ${event.title}`}
            >
              <svg viewBox="0 0 10 9" className="w-3.5 h-3" fill={theme.fill} aria-hidden="true">
                <polygon points="0.5 0.5, 9.5 0.5, 5 8.5" />
              </svg>
              {/* Micro hover tooltip */}
              <div className="absolute bottom-full mb-1.5 hidden group-hover:flex z-50 flex-col items-center pointer-events-none whitespace-nowrap">
                <span className="px-2 py-1 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-medium shadow-md">
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
        className={`relative flex-1 w-full h-full overflow-x-auto overflow-y-auto select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
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
            {/* Top Timeline Scale Ruler with Discrete Years */}
            <TimelineScale
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
              onSelectEvent={navigateToCard}
            />

            {/* Orthogonal Horizontal-Vertical Leader Lines for displaced cards pointing to exact ticks */}
            <LeaderLinesLayer
              leaderLines={EVENT_LEADER_LINES}
              activeTracks={activeTracks}
              activeEventId={activeEventId}
              selectedEventId={selectedEventId}
              searchQuery={searchQuery}
              onSelectEvent={navigateToCard}
            />

            {/* Event Cards (pointer-events set to none during drag to preserve 60fps) */}
            <div style={{ pointerEvents: isDragging ? 'none' : 'auto' }}>
              {HISTORY_EVENTS.map((event, globalIndex) => {
                const coord = EVENT_LAYOUT_COORDS[event.id];
                if (!coord) return null;

                const isTrackVisible = activeTracks.has(event.track);
                if (!isTrackVisible) return null;

                const matchesSearch = isEventMatchingSearch(event);
                const isCardActive = activeEventId === event.id;
                const isCardSelected = selectedEventId === event.id;
                const isDimmed = searchQuery.trim() !== '' && !matchesSearch;

                const trackDef = TRACKS.find((t) => t.id === event.track)!;
                const isHighlighted = isCardActive || isCardSelected || event.id === currentMatchedEventId;
                const zIndex = getCardZIndex(event, globalIndex, isCardActive, isCardSelected, isHighlighted);

                return (
                  <div
                    key={event.id}
                    style={{
                      position: 'absolute',
                      left: `${coord.x}px`,
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
                      onHover={handleCardHover}
                      onSelect={handleCardSelect}
                      onOpenDetail={handleCardDetail}
                      onNavigateTo={navigateToCard}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Canvas Navigation Mini Bar (Bottom Right) */}
      <div className="absolute bottom-4 right-6 z-30 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-xs">
        <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-500 font-mono text-[11px]">
          横向进度 {Math.round(scrollProgress * 100)}%
        </span>
        <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-75"
            style={{ width: `${Math.max(scrollProgress * 100, 4)}%` }}
          />
        </div>

        <div className="h-3 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
          <span>拖拽平移 · 滚轮缩放 · Alt+滚轮上下滚动</span>
        </div>
      </div>
    </div>
  );
};
