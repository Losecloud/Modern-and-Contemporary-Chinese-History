import React, { useRef, useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { HistoryEvent, TrackId, getCardZIndex } from '../types/history';
import { HISTORY_EVENTS, TRACKS } from '../data/historyData';
import { YEAR_TICKS } from '../utils/canvasLayout';
import { EventCard } from './EventCard';
import { VerticalConnectionsLayer, CardCoord } from './VerticalConnectionsLayer';
import {
  Building2,
  ShieldAlert,
  BookOpen,
  ArrowUp,
  MapPin,
  Clock,
  Globe2,
} from 'lucide-react';

interface VerticalHistoryViewProps {
  searchQuery: string;
  currentMatchedEventId?: string | null;
  searchMatchRank?: { current: number; total: number };
  activeTracks: Set<TrackId>;
  onToggleTrack: (track: TrackId) => void;
  showConnections: boolean;
  isQuizMode: boolean;
  zoomLevel: number;
  onSelectEvent: (event: HistoryEvent) => void;
  onOpenDetailModal: (event: HistoryEvent) => void;
  /** 直接打开该卡片的真题练习弹窗 */
  onOpenPracticeModal?: (event: HistoryEvent) => void;
  /** eventId → 该卡片可练习的真题数量 */
  examCounts?: Record<string, number>;
  onRegisterJumpHandler: (fn: (periodId: number) => void) => void;
  onRegisterNavigateHandler: (fn: (eventId: string) => void) => void;
  onActivePeriodChange?: (periodId: number) => void;
}

// Period start year mapping for Header period button navigation without creating artificial period boxes
const PERIOD_START_YEARS: Record<number, number> = {
  0: 1516,
  1: 1840,
  2: 1919,
  3: 1927,
  4: 1937,
  5: 1945,
  6: 1949,
  7: 1978,
};

export const VerticalHistoryView: React.FC<VerticalHistoryViewProps> = ({
  searchQuery,
  currentMatchedEventId,
  searchMatchRank,
  activeTracks,
  showConnections,
  isQuizMode,
  zoomLevel,
  onSelectEvent,
  onOpenDetailModal,
  onOpenPracticeModal,
  examCounts,
  onRegisterJumpHandler,
  onRegisterNavigateHandler,
  onActivePeriodChange,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [currentYearInView, setCurrentYearInView] = useState<number>(1516);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cardCoords, setCardCoords] = useState<Record<string, CardCoord>>({});
  const [isCompact, setIsCompact] = useState<boolean>(true); // Default to compact mode as requested

  // Set of key years from the horizontal mode's YEAR_TICKS
  const keyYearsSet = useMemo(() => {
    return new Set(YEAR_TICKS.filter((t) => t.isKeyYear).map((t) => t.year));
  }, []);

  const eventIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    HISTORY_EVENTS.forEach((e, idx) => map.set(e.id, idx));
    return map;
  }, []);

  const getZIndexForEvent = (event: HistoryEvent, isCardActive: boolean, isCardSelected: boolean) => {
    const globalIndex = eventIndexMap.get(event.id) ?? 0;
    const isHighlighted = isCardActive || isCardSelected || event.id === currentMatchedEventId;
    return getCardZIndex(event, globalIndex, isCardActive, isCardSelected, isHighlighted);
  };

  // Group all events chronologically by integer year along the continuous timeline
  // Strictly adhering to horizontal timeline's concrete year ticks without inventing period boxes
  const yearRowsData = useMemo(() => {
    const map = new Map<number, HistoryEvent[]>();

    HISTORY_EVENTS.forEach((ev) => {
      const y = Math.floor(ev.year);
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(ev);
    });

    const sortedYears = Array.from(map.keys()).sort((a, b) => a - b);

    return sortedYears.map((year) => {
      const yearEvents = map.get(year) || [];

      // Sort events within year by precise decimal year
      const meetings = yearEvents
        .filter((e) => e.track === 'meeting')
        .sort((a, b) => a.year - b.year);

      const armeds = yearEvents
        .filter((e) => e.track === 'armed')
        .sort((a, b) => a.year - b.year);

      const works = yearEvents
        .filter((e) => e.track === 'works')
        .sort((a, b) => a.year - b.year);

      // Separate works into Upper (史纲思想) and Lower (马原·科学社会主义理论)
      const shigangWorks = works.filter((e) => !e.isScientificSocialism && e.periodId !== 0);
      const marxWorks = works.filter((e) => Boolean(e.isScientificSocialism || e.periodId === 0));

      const isKeyYear = keyYearsSet.has(year);

      return {
        year,
        isKeyYear,
        totalEvents: yearEvents.length,
        meetings,
        armeds,
        shigangWorks,
        marxWorks,
        totalWorks: works.length,
      };
    });
  }, [keyYearsSet]);

  // Measure card coordinates relative to content container for mind map connections layer
  const updateCardCoords = useCallback(() => {
    const container = contentRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newCoords: Record<string, CardCoord> = {};
    const z = zoomLevel && zoomLevel > 0 ? zoomLevel : 1;

    HISTORY_EVENTS.forEach((ev) => {
      const el = document.getElementById(`event-card-${ev.id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        newCoords[ev.id] = {
          x: (rect.left - containerRect.left) / z,
          y: (rect.top - containerRect.top) / z,
          width: rect.width / z,
          height: rect.height / z,
        };
      }
    });

    setCardCoords(newCoords);
  }, [zoomLevel]);

  // Update card coordinates on mount, resize, track toggling, and zoom changes
  useLayoutEffect(() => {
    updateCardCoords();
    const timer = setTimeout(updateCardCoords, 50);
    return () => clearTimeout(timer);
  }, [updateCardCoords, activeTracks, zoomLevel, searchQuery, yearRowsData, isCompact]);

  useEffect(() => {
    const handleResize = () => {
      updateCardCoords();
    };
    window.addEventListener('resize', handleResize);

    let ro: ResizeObserver | null = null;
    if (contentRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateCardCoords();
      });
      ro.observe(contentRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ro) ro.disconnect();
    };
  }, [updateCardCoords]);

  // Jump to specific year row
  const scrollToYear = useCallback((year: number) => {
    const el = document.getElementById(`year-row-${year}`);
    if (el && scrollContainerRef.current) {
      const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      const scrollOffset = elTop - containerTop + scrollContainerRef.current.scrollTop - 60;
      scrollContainerRef.current.scrollTo({
        top: Math.max(0, scrollOffset),
        behavior: 'smooth',
      });
      setCurrentYearInView(year);
    }
  }, []);

  // Jump to period: smoothly scrolls to that period's start year
  const jumpToPeriod = useCallback(
    (periodId: number) => {
      const startYear = PERIOD_START_YEARS[periodId];
      if (startYear !== undefined) {
        scrollToYear(startYear);
        onActivePeriodChange?.(periodId);
      }
    },
    [scrollToYear, onActivePeriodChange]
  );

  // Navigate directly to event card
  const navigateToCard = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    const el = document.getElementById(`event-card-${eventId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

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

  // Register jump & navigate handlers
  useEffect(() => {
    onRegisterJumpHandler(jumpToPeriod);
    onRegisterNavigateHandler(navigateToCard);
  }, [jumpToPeriod, navigateToCard, onRegisterJumpHandler, onRegisterNavigateHandler]);

  // Scroll listener to update scroll progress and active year/period
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const progress = scrollHeight > 0 ? Math.min(1, Math.max(0, scrollTop / scrollHeight)) : 0;
    setScrollProgress(progress);

    // Identify current year in view
    const containerTop = container.getBoundingClientRect().top;
    let activeYear = 1516;
    for (const item of yearRowsData) {
      const el = document.getElementById(`year-row-${item.year}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top - containerTop <= 130) {
          activeYear = item.year;
        }
      }
    }

    if (activeYear !== currentYearInView) {
      setCurrentYearInView(activeYear);
      // Map year to period for Header.tsx synchronization
      let pId = 0;
      if (activeYear >= 1978) pId = 7;
      else if (activeYear >= 1949) pId = 6;
      else if (activeYear >= 1945) pId = 5;
      else if (activeYear >= 1937) pId = 4;
      else if (activeYear >= 1927) pId = 3;
      else if (activeYear >= 1919) pId = 2;
      else if (activeYear >= 1840) pId = 1;
      else pId = 0;

      onActivePeriodChange?.(pId);
    }
  }, [currentYearInView, onActivePeriodChange, yearRowsData]);

  // Smooth scroll to top
  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Search match evaluator
  const isEventMatchingSearch = useCallback(
    (ev: HistoryEvent) => {
      if (!searchQuery.trim()) return false;
      const q = searchQuery.toLowerCase().trim();
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.subtitle?.toLowerCase().includes(q) ||
        ev.dateStr.toLowerCase().includes(q) ||
        ev.examSummary?.toLowerCase().includes(q) ||
        ev.items.some(
          (it) =>
            it.text.toLowerCase().includes(q) ||
            it.highlights.some((h) => h.toLowerCase().includes(q))
        )
      );
    },
    [searchQuery]
  );

  const activeTrackCount = activeTracks.size;

  return (
    <div className="c134">
      {/* Main Continuous Timeline Flow & 3 Columns Area */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="c135"
      >
        {/* Sticky 3-Column Header Bar with Synchronized Timeline Header */}
        <div className="c136 backdrop-blur-md px-4 py-2.5 shadow-xs">
          <div className="flex items-center gap-4 max-w-[1740px] mx-auto w-full">
            {/* Left Timeline Header Notch (Specific Timeline Scale - 从上往下具体时间轴刻度) */}
            <div className="w-12 xl:w-16 shrink-0 flex items-center justify-end gap-1 pr-2 border-r border-slate-200 dark:border-slate-800">
              <Clock className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300 truncate">
                时间刻度
              </span>
            </div>

            {/* Right 3 Track Column Titles */}
            <div
              className={`flex-1 grid gap-4 ${
                activeTrackCount === 1
                  ? 'grid-cols-1'
                  : activeTrackCount === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {/* Column 1: Meeting */}
              {activeTracks.has('meeting') && (
                <div className="c137 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-red-600 text-white">
                      <Building2 className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-red-950 dark:text-red-200">
                      第 1 列 · 核心会议与决策
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-red-700 dark:text-red-300">
                    {HISTORY_EVENTS.filter((e) => e.track === 'meeting').length} 条
                  </span>
                </div>
              )}

              {/* Column 2: Armed */}
              {activeTracks.has('armed') && (
                <div className="c138 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-amber-600 text-white">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      第 2 列 · 武装斗争与战役
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300">
                    {HISTORY_EVENTS.filter((e) => e.track === 'armed').length} 条
                  </span>
                </div>
              )}

              {/* Column 3: Works */}
              {activeTracks.has('works') && (
                <div className="c139 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-emerald-600 text-white">
                      <BookOpen className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                        第 3 列 · 思想理论与著作
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        (史纲上部 · 马原下部)
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {HISTORY_EVENTS.filter((e) => e.track === 'works').length} 条
                  </span>
                </div>
              )}
            </div>

            {/* Density Switcher: 精简模式 (高密度) vs 完整模式 */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shrink-0">
              <button
                onClick={() => setIsCompact(true)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  isCompact
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="精简抬头模式：最大化垂直浏览密度，点击卡片即可查看完整内容"
              >
                精简模式
              </button>
              <button
                onClick={() => setIsCompact(false)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  !isCompact
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="完整卡片模式：展开卡片所有要点与考点"
              >
                完整模式
              </button>
            </div>
          </div>
        </div>

        {/* Content Container (holds SVG Mind Map connections + Timeline rows) */}
        <div
          ref={contentRef}
          className="relative px-4 py-4 max-w-[1740px] mx-auto w-full transition-transform"
          style={{
            zoom: zoomLevel !== 1 ? zoomLevel : undefined,
          }}
        >
          {/* ======================================================== */}
          {/* Mind Map Connections Layer (思维导图连线)                 */}
          {/* ======================================================== */}
          <VerticalConnectionsLayer
            events={HISTORY_EVENTS}
            cardCoords={cardCoords}
            activeEventId={activeEventId}
            selectedEventId={selectedEventId}
            showConnections={showConnections}
            activeTracks={activeTracks}
            onNavigateTo={navigateToCard}
          />

          {/* Continuous Chronological Timeline Rows (左侧具体刻度简练表示，从上往下递进，不新创时期关系) */}
          <div className="space-y-4 relative z-0">
            {yearRowsData.map((row) => {
              const isCurrentViewYear = currentYearInView === row.year;

              return (
                <div
                  key={row.year}
                  id={`year-row-${row.year}`}
                  className="relative flex items-stretch group"
                >
                  {/* Left: Concise Timeline Scale Tick (严格采用横向模式的具体时间轴刻度，简练表示) */}
                  <div className="w-12 xl:w-16 shrink-0 flex items-start justify-end pr-2 relative select-none pt-2.5">
                    {/* Continuous vertical timeline ruler line */}
                    <div className="absolute right-0 top-0 bottom-0 w-[1.5px] bg-slate-200 dark:bg-slate-800" />

                    {/* Ruler tick notch (Horizontal notch line strictly matching horizontal mode ticks) */}
                    <div
                      className={`absolute right-0 top-5 h-[1.5px] transition-all duration-150 ${
                        row.isKeyYear
                          ? isCurrentViewYear
                            ? 'w-4 bg-amber-500'
                            : 'w-3 bg-slate-700 dark:bg-slate-300'
                          : isCurrentViewYear
                          ? 'w-3 bg-amber-500'
                          : 'w-2 bg-slate-300 dark:bg-slate-600'
                      } group-hover:bg-amber-500 group-hover:w-4`}
                    />

                    {/* Key year tick anchor dot */}
                    {row.isKeyYear && (
                      <div
                        className={`absolute right-[-3px] top-[17px] w-1.5 h-1.5 rounded-full ring-2 ring-white dark:ring-slate-900 transition-colors ${
                          isCurrentViewYear
                            ? 'bg-amber-500 ring-amber-200 dark:ring-amber-900'
                            : 'bg-slate-500 dark:bg-slate-400 group-hover:bg-amber-500'
                        }`}
                      />
                    )}

                    {/* Year number (Bold only, no orange text or badge) */}
                    <div className="flex flex-col items-end pr-1">
                      <button
                        onClick={() => scrollToYear(row.year)}
                        className={`font-mono tabular-nums leading-none cursor-pointer transition-colors text-right ${
                          row.isKeyYear
                            ? isCurrentViewYear
                              ? 'text-xs font-bold text-amber-600 dark:text-amber-400'
                              : 'text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600'
                            : isCurrentViewYear
                            ? 'text-xs font-bold text-amber-600 dark:text-amber-400'
                            : 'text-[11px] font-medium text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                        }`}
                        title={`点击对齐到 ${row.year} 年刻度`}
                      >
                        {row.year}
                      </button>
                    </div>
                  </div>

                  {/* Right: 3 Columns Grid for Events at this exact Year */}
                  <div className="flex-1 min-w-0 pl-4 py-1.5 border-b border-dashed border-slate-200/80 dark:border-slate-800/70">
                    <div
                      className={`grid gap-4 items-start ${
                        activeTrackCount === 1
                          ? 'grid-cols-1'
                          : activeTrackCount === 2
                          ? 'grid-cols-2'
                          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      }`}
                    >
                      {/* Column 1: Meeting Events */}
                      {activeTracks.has('meeting') && (
                        <div className="flex flex-col gap-3 min-w-0">
                          {row.meetings.length > 0 ? (
                            row.meetings.map((event) => {
                              const trackDef = TRACKS.find((t) => t.id === event.track)!;
                              const matchesSearch = isEventMatchingSearch(event);
                              const isCardActive = activeEventId === event.id;
                              const isCardSelected = selectedEventId === event.id;
                              const isDimmed = searchQuery.trim() !== '' && !matchesSearch;

                              const zIndex = getZIndexForEvent(event, isCardActive, isCardSelected);
                              return (
                                <div key={event.id} className="w-full relative" style={{ zIndex }}>
                                  <EventCard
                                    event={event}
                                    track={trackDef}
                                    cardWidth="100%"
                                    isCompact={isCompact}
                                    isActive={isCardActive}
                                    isSelected={isCardSelected}
                                    isDimmed={isDimmed}
                                    isQuizMode={isQuizMode}
                                    searchQuery={searchQuery}
                                    isCurrentSearchFocus={event.id === currentMatchedEventId}
                                    searchMatchRank={
                                      event.id === currentMatchedEventId
                                        ? searchMatchRank
                                        : undefined
                                    }
                                    onHover={setActiveEventId}
                                    onSelect={(ev) => {
                                      setSelectedEventId((prev) => (prev === ev.id ? null : ev.id));
                                      onSelectEvent(ev);
                                    }}
                                    onOpenDetail={onOpenDetailModal}
                                    onOpenPractice={onOpenPracticeModal}
                                    examCount={examCounts?.[event.id]}
                                    onNavigateTo={navigateToCard}
                                  />
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-2" />
                          )}
                        </div>
                      )}

                      {/* Column 2: Armed Events */}
                      {activeTracks.has('armed') && (
                        <div className="flex flex-col gap-3 min-w-0">
                          {row.armeds.length > 0 ? (
                            row.armeds.map((event) => {
                              const trackDef = TRACKS.find((t) => t.id === event.track)!;
                              const matchesSearch = isEventMatchingSearch(event);
                              const isCardActive = activeEventId === event.id;
                              const isCardSelected = selectedEventId === event.id;
                              const isDimmed = searchQuery.trim() !== '' && !matchesSearch;

                              const zIndex = getZIndexForEvent(event, isCardActive, isCardSelected);
                              return (
                                <div key={event.id} className="w-full relative" style={{ zIndex }}>
                                  <EventCard
                                    event={event}
                                    track={trackDef}
                                    cardWidth="100%"
                                    isCompact={isCompact}
                                    isActive={isCardActive}
                                    isSelected={isCardSelected}
                                    isDimmed={isDimmed}
                                    isQuizMode={isQuizMode}
                                    searchQuery={searchQuery}
                                    isCurrentSearchFocus={event.id === currentMatchedEventId}
                                    searchMatchRank={
                                      event.id === currentMatchedEventId
                                        ? searchMatchRank
                                        : undefined
                                    }
                                    onHover={setActiveEventId}
                                    onSelect={(ev) => {
                                      setSelectedEventId((prev) => (prev === ev.id ? null : ev.id));
                                      onSelectEvent(ev);
                                    }}
                                    onOpenDetail={onOpenDetailModal}
                                    onOpenPractice={onOpenPracticeModal}
                                    examCount={examCounts?.[event.id]}
                                    onNavigateTo={navigateToCard}
                                  />
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-2" />
                          )}
                        </div>
                      )}

                      {/* Column 3: Works Events (Upper 史纲理论 + Lower 马克思主义思想) */}
                      {activeTracks.has('works') && (
                        <div className="flex flex-col gap-3 min-w-0">
                          {/* Upper: 史纲思想文献 */}
                          {row.shigangWorks.map((event) => {
                            const trackDef = TRACKS.find((t) => t.id === event.track)!;
                            const matchesSearch = isEventMatchingSearch(event);
                            const isCardActive = activeEventId === event.id;
                            const isCardSelected = selectedEventId === event.id;
                            const isDimmed = searchQuery.trim() !== '' && !matchesSearch;

                            const zIndex = getZIndexForEvent(event, isCardActive, isCardSelected);
                            return (
                              <div key={event.id} className="w-full relative" style={{ zIndex }}>
                                <EventCard
                                  event={event}
                                  track={trackDef}
                                  cardWidth="100%"
                                  isCompact={isCompact}
                                  isActive={isCardActive}
                                  isSelected={isCardSelected}
                                  isDimmed={isDimmed}
                                  isQuizMode={isQuizMode}
                                  searchQuery={searchQuery}
                                  isCurrentSearchFocus={event.id === currentMatchedEventId}
                                  searchMatchRank={
                                    event.id === currentMatchedEventId
                                      ? searchMatchRank
                                      : undefined
                                  }
                                  onHover={setActiveEventId}
                                  onSelect={(ev) => {
                                    setSelectedEventId((prev) => (prev === ev.id ? null : ev.id));
                                    onSelectEvent(ev);
                                  }}
                                  onOpenDetail={onOpenDetailModal}
                                  onOpenPractice={onOpenPracticeModal}
                                  examCount={examCounts?.[event.id]}
                                  onNavigateTo={navigateToCard}
                                />
                              </div>
                            );
                          })}

                          {/* Lower: 马克思主义（思想）与科学社会主义理论 (淡灰色不起眼显示) */}
                          {row.marxWorks.length > 0 && (
                            <div
                              className={`flex flex-col gap-2 ${
                                row.shigangWorks.length > 0
                                  ? 'pt-2.5 border-t border-dashed border-slate-300 dark:border-zinc-800'
                                  : ''
                              }`}
                            >
                              {row.shigangWorks.length > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-200/50 dark:bg-zinc-800/60 w-fit text-[10px] text-slate-500 dark:text-zinc-400 select-none">
                                  <Globe2 className="w-3 h-3 text-slate-400" />
                                  <span>↓ 马克思主义（思想）与科学社会主义理论 (下部)</span>
                                </div>
                              )}
                              {row.marxWorks.map((event) => {
                                const trackDef = TRACKS.find((t) => t.id === event.track)!;
                                const matchesSearch = isEventMatchingSearch(event);
                                const isCardActive = activeEventId === event.id;
                                const isCardSelected = selectedEventId === event.id;
                                const isDimmed = searchQuery.trim() !== '' && !matchesSearch;

                                const zIndex = getZIndexForEvent(event, isCardActive, isCardSelected);
                                return (
                                  <div key={event.id} className="w-full relative" style={{ zIndex }}>
                                    <EventCard
                                      event={event}
                                      track={trackDef}
                                      cardWidth="100%"
                                      isCompact={isCompact}
                                      isActive={isCardActive}
                                      isSelected={isCardSelected}
                                      isDimmed={isDimmed}
                                      isQuizMode={isQuizMode}
                                      searchQuery={searchQuery}
                                      isCurrentSearchFocus={event.id === currentMatchedEventId}
                                      searchMatchRank={
                                        event.id === currentMatchedEventId
                                          ? searchMatchRank
                                          : undefined
                                      }
                                      onHover={setActiveEventId}
                                      onSelect={(ev) => {
                                        setSelectedEventId((prev) => (prev === ev.id ? null : ev.id));
                                        onSelectEvent(ev);
                                      }}
                                      onOpenDetail={onOpenDetailModal}
                                      onOpenPractice={onOpenPracticeModal}
                                      examCount={examCounts?.[event.id]}
                                      onNavigateTo={navigateToCard}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {row.totalWorks === 0 && <div className="h-2" />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Quick Scrub Pill (Bottom Right) */}
        <div className="c140 backdrop-blur-md shadow-lg">
          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px] font-mono">
            {currentYearInView} 年刻度 · 浏览进度 {Math.round(scrollProgress * 100)}%
          </span>
          <div className="h-3 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium hover:underline cursor-pointer"
          >
            <ArrowUp className="w-3 h-3" />
            <span>回顶部</span>
          </button>
        </div>
      </main>
    </div>
  );
};
