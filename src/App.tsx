/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { HistoryEvent, TrackId } from './types/history';
import { HISTORY_EVENTS } from './data/historyData';
import { Header, type MainView } from './components/Header';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { HistoryCanvas } from './components/HistoryCanvas';
import { VerticalHistoryView } from './components/VerticalHistoryView';
import { EventDetailModal } from './components/EventDetailModal';
import { StudyGuideModal } from './components/StudyGuideModal';
import { computeExamCounts, loadExamQuestions } from './utils/examQuiz';
import {
  loadCardWidthOverrides,
  saveCardWidthOverrides,
  loadCardXOverrides,
  saveCardXOverrides,
} from './utils/canvasLayout';

export default function App() {
  const [mainView, setMainView] = useState<MainView>('canvas');
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const practiceFrameRef = useRef<HTMLIFrameElement | null>(null);

  // 主题同步：外层 html.dark + 持久化 + 通知内嵌真题页
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('app-theme', theme);
    } catch {
      // 本地存储不可用时忽略
    }
    practiceFrameRef.current?.contentWindow?.postMessage({ type: 'theme', theme }, '*');
  }, [theme]);

  const syncThemeToPractice = () => {
    practiceFrameRef.current?.contentWindow?.postMessage({ type: 'theme', theme }, '*');
  };

  // 真题数量：等首屏渲染完成后再载入题库并批量匹配，避免拖慢启动
  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(() => {
      loadExamQuestions()
        .then((all) => {
          if (alive) setExamCounts(computeExamCounts(HISTORY_EVENTS, all));
        })
        .catch(() => {
          // 题库不可用时卡片不显示数量，不影响浏览
        });
    }, 400);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  const openDetail = (ev: HistoryEvent, practice: boolean) => {
    setDetailPractice(practice);
    setSelectedEvent(ev);
  };

  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTracks, setActiveTracks] = useState<Set<TrackId>>(
    new Set<TrackId>(['meeting', 'armed', 'works'])
  );
  const [showConnections, setShowConnections] = useState(true);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);
  /** 详情弹窗是否直接落在真题练习页 */
  const [detailPractice, setDetailPractice] = useState(false);
  const [examCounts, setExamCounts] = useState<Record<string, number>>({});
  const [isStudyGuideOpen, setIsStudyGuideOpen] = useState(false);
  const [activePeriodId, setActivePeriodId] = useState<number>(1);

  // 编辑模式：拖拽调整卡片宽度，点击 √ 保存到 localStorage
  const [isEditMode, setIsEditMode] = useState(false);
  const [cardWidths, setCardWidths] = useState<Record<string, number>>(() =>
    loadCardWidthOverrides()
  );
  /** groupId → 编辑模式左右拖拽后的卡片左边界 X */
  const [cardXs, setCardXs] = useState<Record<string, number>>(() => loadCardXOverrides());

  const handleToggleEditMode = () => {
    setIsEditMode((prev) => {
      if (prev) {
        saveCardWidthOverrides(cardWidths);
        saveCardXOverrides(cardXs);
      }
      return !prev;
    });
  };

  const handleResizeCard = (eventId: string, width: number) => {
    setCardWidths((prev) => ({ ...prev, [eventId]: width }));
  };

  const handleMoveCard = (groupId: string, x: number) => {
    setCardXs((prev) => (prev[groupId] === x ? prev : { ...prev, [groupId]: x }));
  };

  // References to canvas jump and navigate methods
  const jumpHandlerRef = useRef<((periodId: number) => void) | null>(null);
  const navigateHandlerRef = useRef<((eventId: string) => void) | null>(null);

  // Track filter toggling
  const handleToggleTrack = (trackId: TrackId) => {
    setActiveTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        if (next.size > 1) {
          next.delete(trackId);
        }
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const handleSelectAllTracks = () => {
    setActiveTracks(new Set(['meeting', 'armed', 'works']));
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(1.4, Number((prev + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.65, Number((prev - 0.1).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  // Filtered matching events for search
  const matchingEvents = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return HISTORY_EVENTS.filter((e) => {
      if (e.title.toLowerCase().includes(q)) return true;
      if (e.subtitle?.toLowerCase().includes(q)) return true;
      if (e.dateStr.toLowerCase().includes(q)) return true;
      if (e.examSummary?.toLowerCase().includes(q)) return true;
      return e.items.some(
        (it) =>
          it.text.toLowerCase().includes(q) ||
          it.highlights.some((h) => h.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  const [searchMatchIndex, setSearchMatchIndex] = useState(0);

  // Jump to first matching event immediately when search query changes
  useEffect(() => {
    if (searchQuery.trim() && matchingEvents.length > 0) {
      setSearchMatchIndex(0);
      const firstEvent = matchingEvents[0];
      // Automatically ensure target event's track is enabled
      setActiveTracks((prev) => {
        if (!prev.has(firstEvent.track)) {
          const next = new Set(prev);
          next.add(firstEvent.track);
          return next;
        }
        return prev;
      });
      navigateHandlerRef.current?.(firstEvent.id);
    }
  }, [searchQuery, matchingEvents]);

  const handleNextSearchMatch = () => {
    if (matchingEvents.length === 0) return;
    const nextIdx = (searchMatchIndex + 1) % matchingEvents.length;
    setSearchMatchIndex(nextIdx);
    const target = matchingEvents[nextIdx];
    setActiveTracks((prev) => {
      if (!prev.has(target.track)) {
        const next = new Set(prev);
        next.add(target.track);
        return next;
      }
      return prev;
    });
    navigateHandlerRef.current?.(target.id);
  };

  const handlePrevSearchMatch = () => {
    if (matchingEvents.length === 0) return;
    const prevIdx = (searchMatchIndex - 1 + matchingEvents.length) % matchingEvents.length;
    setSearchMatchIndex(prevIdx);
    const target = matchingEvents[prevIdx];
    setActiveTracks((prev) => {
      if (!prev.has(target.track)) {
        const next = new Set(prev);
        next.add(target.track);
        return next;
      }
      return prev;
    });
    navigateHandlerRef.current?.(target.id);
  };

  const handleJumpToPeriod = (periodId: number) => {
    if (jumpHandlerRef.current) {
      jumpHandlerRef.current(periodId);
    }
  };

  const handleNavigateToEvent = (eventId: string) => {
    if (navigateHandlerRef.current) {
      navigateHandlerRef.current(eventId);
    }
    const found = HISTORY_EVENTS.find((e) => e.id === eventId);
    if (found) {
      setSelectedEvent(found);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* 3-Zone Top Bar Contract */}
      <Header
        view={mainView}
        onViewChange={setMainView}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onOpenStudyGuide={() => setIsStudyGuideOpen(true)}
        isEditMode={isEditMode}
        onToggleEditMode={handleToggleEditMode}
      />

      {mainView === 'practice' ? (
        /* 真题练习：沿用知政真题应用，仅载入 2007—2026 纯真题数据 */
        <iframe
          ref={practiceFrameRef}
          src="./practice/index.html"
          title="考研政治真题练习"
          onLoad={syncThemeToPractice}
          className="flex-1 w-full border-0 bg-white dark:bg-slate-900"
        />
      ) : (
        <>
      {/* Workspace Toolbar with Stepper Search & Layout Mode Switcher */}
      <WorkspaceToolbar
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        matchingCount={matchingEvents.length}
        currentMatchIndex={searchMatchIndex}
        onNextMatch={handleNextSearchMatch}
        onPrevMatch={handlePrevSearchMatch}
        activeTracks={activeTracks}
        onToggleTrack={handleToggleTrack}
        onSelectAllTracks={handleSelectAllTracks}
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        showConnections={showConnections}
        onToggleConnections={() => setShowConnections((prev) => !prev)}
        isQuizMode={isQuizMode}
        onToggleQuizMode={() => setIsQuizMode((prev) => !prev)}
        activePeriodId={activePeriodId}
        onJumpToPeriod={(id) => {
          setActivePeriodId(id);
          handleJumpToPeriod(id);
        }}
      />

      {/* Main View: Horizontal Panoramic Timeline Canvas OR Vertical Progressive 3-Column View */}
      {layoutMode === 'horizontal' ? (
        <HistoryCanvas
          searchQuery={searchQuery}
          currentMatchedEventId={matchingEvents[searchMatchIndex]?.id}
          searchMatchRank={
            matchingEvents.length > 0
              ? { current: searchMatchIndex + 1, total: matchingEvents.length }
              : undefined
          }
          activeTracks={activeTracks}
          onToggleTrack={handleToggleTrack}
          showConnections={showConnections}
          isQuizMode={isQuizMode}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          onActivePeriodChange={(id) => setActivePeriodId(id)}
          onSelectEvent={(_ev) => {
            // Selecting card body only traces mind map in canvas, does not pop modal
          }}
          onOpenDetailModal={(ev) => openDetail(ev, false)}
          onOpenPracticeModal={(ev) => openDetail(ev, true)}
          examCounts={examCounts}
          onRegisterJumpHandler={(fn) => {
            jumpHandlerRef.current = fn;
          }}
          onRegisterNavigateHandler={(fn) => {
            navigateHandlerRef.current = fn;
          }}
          isEditMode={isEditMode}
          cardWidths={cardWidths}
          onResizeCard={handleResizeCard}
          cardXs={cardXs}
          onMoveCard={handleMoveCard}
        />
      ) : (
        <VerticalHistoryView
          searchQuery={searchQuery}
          currentMatchedEventId={matchingEvents[searchMatchIndex]?.id}
          searchMatchRank={
            matchingEvents.length > 0
              ? { current: searchMatchIndex + 1, total: matchingEvents.length }
              : undefined
          }
          activeTracks={activeTracks}
          onToggleTrack={handleToggleTrack}
          showConnections={showConnections}
          isQuizMode={isQuizMode}
          zoomLevel={zoomLevel}
          onActivePeriodChange={(id) => setActivePeriodId(id)}
          onSelectEvent={(_ev) => {
            // Selecting card body traces mind map in vertical view
          }}
          onOpenDetailModal={(ev) => openDetail(ev, false)}
          onOpenPracticeModal={(ev) => openDetail(ev, true)}
          examCounts={examCounts}
          onRegisterJumpHandler={(fn) => {
            jumpHandlerRef.current = fn;
          }}
          onRegisterNavigateHandler={(fn) => {
            navigateHandlerRef.current = fn;
          }}
        />
      )}
        </>
      )}

      {/* Deep-reading and examination breakdown Modal */}
      {selectedEvent && (
        <EventDetailModal
          key={`${selectedEvent.id}:${detailPractice ? 'practice' : 'detail'}`}
          event={selectedEvent}
          initialPracticeMode={detailPractice}
          onClose={() => setSelectedEvent(null)}
          onNavigateTo={handleNavigateToEvent}
        />
      )}

      {/* Study & Mind-Map Guide Modal */}
      <StudyGuideModal
        isOpen={isStudyGuideOpen}
        onClose={() => setIsStudyGuideOpen(false)}
        onJumpToPeriod={handleJumpToPeriod}
        onSelectEvent={handleNavigateToEvent}
      />
    </div>
  );
}
