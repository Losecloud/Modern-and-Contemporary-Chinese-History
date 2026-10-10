import React from 'react';
import { TrackId } from '../types/history';
import { TRACKS } from '../data/historyData';
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  GitBranch,
  HelpCircle,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface WorkspaceToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  matchingCount: number;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  activeTracks: Set<TrackId>;
  onToggleTrack: (track: TrackId) => void;
  onSelectAllTracks: () => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  showConnections: boolean;
  onToggleConnections: () => void;
  isQuizMode: boolean;
  onToggleQuizMode: () => void;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  searchQuery,
  onSearchChange,
  matchingCount,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
  activeTracks,
  onToggleTrack,
  onSelectAllTracks,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  showConnections,
  onToggleConnections,
  isQuizMode,
  onToggleQuizMode,
}) => {
  const isAllTracksActive = activeTracks.size === TRACKS.length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 shrink-0 z-30">
      {/* Search Input with Dynamic Match Navigation */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                  onPrevMatch();
                } else {
                  onNextMatch();
                }
              }
            }}
            placeholder="搜索史实、文献、考点原话..."
            className="w-56 sm:w-64 pl-8 pr-7 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="清除搜索"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Match Count & Stepper Navigation */}
        {searchQuery && (
          matchingCount > 0 ? (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300 text-[11px] shadow-2xs">
              <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                {currentMatchIndex + 1} / {matchingCount}
              </span>
              <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-1">
                <button
                  onClick={onPrevMatch}
                  className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer transition-colors text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  title="上一个匹配结果 (Shift+Enter)"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onNextMatch}
                  className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer transition-colors text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  title="下一个匹配结果 (Enter)"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 font-mono">
              无匹配结果
            </span>
          )
        )}
      </div>

      {/* Track Filters (Horizontal swimlane toggles) */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
        <button
          onClick={onSelectAllTracks}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
            isAllTracksActive
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          全部轨道
        </button>
        {TRACKS.map((t) => {
          const isActive = activeTracks.has(t.id);
          return (
            <button
              key={t.id}
              onClick={() => onToggleTrack(t.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                isActive
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: t.dotColor }}
              />
              <span>{t.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* Modes & View Controls */}
      <div className="flex items-center gap-2">
        {/* Mind map connections toggle */}
        <button
          onClick={onToggleConnections}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            showConnections
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
          title="开关思维导图因果分支连线"
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>导图连线</span>
        </button>

        {/* Quiz mode toggle */}
        <button
          onClick={onToggleQuizMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            isQuizMode
              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700 text-red-900 dark:text-red-200'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
          title="背诵自测模式：模糊遮挡加粗高亮考点"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>考点背诵自测</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Zoom controls */}
        <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
          <button
            onClick={onZoomOut}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-2 tabular-nums font-semibold select-none">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 ml-0.5 cursor-pointer"
            title="重置缩放"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
