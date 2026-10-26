import React from 'react';
import { TrackId } from '../types/history';
import { TRACKS } from '../data/historyData';
import { TRACK_Y_POSITIONS, WORKS_MARXISM_Y } from '../utils/canvasLayout';

interface TrackHeaderProps {
  activeTracks: Set<TrackId>;
  eventCounts: Record<TrackId, number>;
  scrollLeft?: number;
}

export const TrackHeader = React.memo<TrackHeaderProps>(({
  activeTracks,
  scrollLeft = 0,
}) => {
  return (
    <div className="absolute left-0 top-0 pointer-events-none select-none z-10 w-full h-full">
      {TRACKS.map((track) => {
        const yConfig = TRACK_Y_POSITIONS[track.id];
        const isVisible = activeTracks.has(track.id);

        if (!isVisible || !yConfig) return null;

        return (
          <React.Fragment key={track.id}>
            <div
              style={{
                position: 'absolute',
                left: `${Math.max(16, scrollLeft + 16)}px`,
                top: `${yConfig.y + 20}px`,
                zIndex: 12,
                width: '26px',
              }}
              className="c142 backdrop-blur-xs shadow-2xs"
            >
              {/* Minimal subtle dot indicating track color */}
              <span
                className="w-1.5 h-1.5 rounded-full mb-2 shrink-0 opacity-80"
                style={{ backgroundColor: track.dotColor }}
              />

              {/* Minimal unobtrusive vertical text in a single column */}
              <span
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'upright',
                }}
                className="c144 tracking-[0.2em] leading-none"
              >
                {track.name}
              </span>
            </div>

            {/* If track is works (row 3), also render the lower sub-lane vertical title for Marxism thought */}
            {track.id === 'works' && (
              <div
                style={{
                  position: 'absolute',
                  left: `${Math.max(16, scrollLeft + 16)}px`,
                  top: `${WORKS_MARXISM_Y + 20}px`,
                  zIndex: 12,
                  width: '26px',
                }}
                className="c143 backdrop-blur-xs shadow-2xs"
              >
                {/* Low-saturation subtle gray dot */}
                <span className="w-1.5 h-1.5 rounded-full mb-2 shrink-0 opacity-70 bg-slate-400 dark:bg-zinc-500" />

                {/* Minimal unobtrusive vertical label for Marxism lower sub-lane */}
                <span
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'upright',
                  }}
                  className="c145 tracking-[0.2em] leading-none"
                >
                  马原·科学社会主义理论
                </span>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});
