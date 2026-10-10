/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { HistoryEvent, TrackId } from './types/history';
import { HISTORY_EVENTS } from './data/historyData';
import { Header } from './components/Header';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { HistoryCanvas } from './components/HistoryCanvas';
import { EventDetailModal } from './components/EventDetailModal';
import { StudyGuideModal } from './components/StudyGuideModal';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTracks, setActiveTracks] = useState<Set<TrackId>>(
    new Set<TrackId>(['meeting', 'armed', 'works'])
  );
  const [showConnections, setShowConnections] = useState(true);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);
  const [isStudyGuideOpen, setIsStudyGuideOpen] = useState(false);
  const [activePeriodId, setActivePeriodId] = useState<number>(1);

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
        activePeriodId={activePeriodId}
        onJumpToPeriod={(id) => {
          setActivePeriodId(id);
          handleJumpToPeriod(id);
        }}
        onOpenStudyGuide={() => setIsStudyGuideOpen(true)}
      />

      {/* Workspace Toolbar with Stepper Search */}
      <WorkspaceToolbar
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
      />

      {/* Main Horizontal Timeline Canvas */}
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
        onOpenDetailModal={(ev) => setSelectedEvent(ev)}
        onRegisterJumpHandler={(fn) => {
          jumpHandlerRef.current = fn;
        }}
        onRegisterNavigateHandler={(fn) => {
          navigateHandlerRef.current = fn;
        }}
      />

      {/* Deep-reading and examination breakdown Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
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
