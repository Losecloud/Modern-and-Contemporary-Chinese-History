import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { HistoryEvent, TrackId } from '../types/history';
import { HISTORY_EVENTS, TRACKS } from '../data/historyData';
import {
  EVENT_LAYOUT_COORDS,
  TOTAL_CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CARD_WIDTH,
  PERIOD_BOUNDARIES,
} from '../utils/canvasLayout';
import { TimelineScale } from './TimelineScale';
import { TrackHeader } from './TrackHeader';
import { EventCard } from './EventCard';
import { SvgConnections } from './SvgConnections';
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
  const activePeriodRef = useRef<number>(1);

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

  // Update viewport metrics and active period
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    // When actively dragging with mouse, skip React state re-render entirely to guarantee 60fps/120fps hardware lock
    if (isDraggingRef.current) {
      return;
    }

    const { scrollLeft, scrollTop, clientWidth, clientHeight } = containerRef.current;

    // Check active period in real-time, but ONLY notify parent when boundary actually changes!
    const virtualX = scrollLeft / zoomLevel + 200;
    const boundary = PERIOD_BOUNDARIES.find((p) => virtualX >= p.startX && virtualX <= p.endX);
    if (boundary && boundary.id !== activePeriodRef.current) {
      activePeriodRef.current = boundary.id;
      onActivePeriodChange?.(boundary.id);
    }

    setScrollState({ scrollLeft, scrollTop, clientWidth, clientHeight });
  }, [zoomLevel, onActivePeriodChange]);

  // Smooth scroll to X position
  const scrollToX = useCallback((x: number) => {
    if (!containerRef.current) return;
    containerRef.current.style.scrollBehavior = 'smooth';
    const target = Math.max(0, x - 120);
    containerRef.current.scrollTo({
      left: target,
      behavior: 'smooth',
    });
  }, []);

  // Smooth scroll vertically to target Y
  const scrollToY = useCallback((y: number) => {
    if (!containerRef.current) return;
    containerRef.current.style.scrollBehavior = 'smooth';
    const target = Math.max(0, y * zoomLevel - 130);
    containerRef.current.scrollTo({
      top: target,
      behavior: 'smooth',
    });
  }, [zoomLevel]);

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

  // Jump to specific event card with smooth viewport centering
  const navigateToCard = useCallback(
    (eventId: string) => {
      setSelectedEventId(eventId);
      const coord = EVENT_LAYOUT_COORDS[eventId];
      if (coord && containerRef.current) {
        containerRef.current.style.scrollBehavior = 'smooth';
        const targetScrollLeft = Math.max(
          0,
          (coord.x + CARD_WIDTH / 2) * zoomLevel - containerRef.current.clientWidth / 2
        );
        const targetScrollTop = Math.max(
          0,
          coord.y * zoomLevel - 150
        );
        containerRef.current.scrollTo({
          left: targetScrollLeft,
          top: targetScrollTop,
          behavior: 'smooth',
        });
      }
    },
    [zoomLevel]
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
        setIsDragging(false);

        // Instantly flush final scroll position for ▲ / ▼ indicators
        if (containerRef.current) {
          const { scrollLeft, scrollTop, clientWidth, clientHeight } = containerRef.current;
          setScrollState({ scrollLeft, scrollTop, clientWidth, clientHeight });

          const virtualX = scrollLeft / zoomLevel + 200;
          const boundary = PERIOD_BOUNDARIES.find((p) => virtualX >= p.startX && virtualX <= p.endX);
          if (boundary && boundary.id !== activePeriodRef.current) {
            activePeriodRef.current = boundary.id;
            onActivePeriodChange?.(boundary.id);
          }
        }
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
  }, [zoomLevel, onActivePeriodChange]);

  const zoomLevelRef = useRef(zoomLevel);
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

      // 2. Normal wheel: Proportional canvas zoom (整个画布的比例缩放)
      // 滚轮下滚为缩小 (deltaY > 0 -> zoom out)，上滚为放大 (deltaY < 0 -> zoom in)
      e.preventDefault();
      const currentZoom = zoomLevelRef.current;
      const isZoomIn = e.deltaY < 0; // 上滚为放大
      const zoomStep = 0.08;
      const targetZoom = Math.min(
        1.8,
        Math.max(0.45, Number((currentZoom + (isZoomIn ? zoomStep : -zoomStep)).toFixed(2)))
      );

      if (targetZoom === currentZoom) return;

      // Mouse-centered focal zoom calculation
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const canvasX = (container.scrollLeft + mouseX) / currentZoom;
      const canvasY = (container.scrollTop + mouseY) / currentZoom;

      const nextScrollLeft = Math.max(0, canvasX * targetZoom - mouseX);
      const nextScrollTop = Math.max(0, canvasY * targetZoom - mouseY);

      onZoomChange?.(targetZoom);

      // Keep focus point locked under cursor
      requestAnimationFrame(() => {
        if (container) {
          container.scrollLeft = nextScrollLeft;
          container.scrollTop = nextScrollTop;
        }
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [onZoomChange]);

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
    lastClientXRef.current = e.clientX;
    lastClientYRef.current = e.clientY;
    setIsDragging(true);

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
      setSelectedEventId(ev.id);
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
        {/* Transform Container for Zooming with 3D Composite Layer */}
        <div
          style={{
            width: `${TOTAL_CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            transform: `scale(${zoomLevel}) translate3d(0, 0, 0)`,
            transformOrigin: '0 0',
            backfaceVisibility: 'hidden',
          }}
          className="relative origin-top-left"
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

          {/* Event Cards (pointer-events set to none during drag to preserve 60fps) */}
          <div style={{ pointerEvents: isDragging ? 'none' : 'auto' }}>
            {HISTORY_EVENTS.map((event) => {
              const coord = EVENT_LAYOUT_COORDS[event.id];
              if (!coord) return null;

              const isTrackVisible = activeTracks.has(event.track);
              if (!isTrackVisible) return null;

              const matchesSearch = isEventMatchingSearch(event);
              const isCardActive = activeEventId === event.id;
              const isCardSelected = selectedEventId === event.id;
              const isDimmed = searchQuery.trim() !== '' && !matchesSearch;

              const trackDef = TRACKS.find((t) => t.id === event.track)!;

              return (
                <div
                  key={event.id}
                  style={{
                    position: 'absolute',
                    left: `${coord.x}px`,
                    top: `${coord.y}px`,
                    zIndex: isCardActive || isCardSelected ? 25 : 15,
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
