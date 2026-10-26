import React from 'react';

interface HighlightTextProps {
  text: string;
  highlights: string[];
  trackId: string;
  searchQuery?: string;
  isQuizMode?: boolean;
  isScientificSocialism?: boolean;
}

export const HighlightSearch: React.FC<{ text: string; query?: string }> = ({ text, query }) => {
  if (!query || !query.trim() || !text) {
    return <>{text}</>;
  }

  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  if (parts.length === 1) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, index) => {
        if (part.toLowerCase() === q.toLowerCase()) {
          return (
            <mark
              key={index}
              className="c97"
            >
              {part}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
};

export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  highlights,
  trackId,
  searchQuery,
  isQuizMode = false,
  isScientificSocialism = false,
}) => {
  if (!text) return null;

  // If no syllabus highlights, simply render with search query highlighting
  if (!highlights || highlights.length === 0) {
    return <HighlightSearch text={text} query={searchQuery} />;
  }

  // Create regex pattern to match any syllabus highlight phrases
  const escaped = highlights
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escaped.length === 0) {
    return <HighlightSearch text={text} query={searchQuery} />;
  }

  const regex = new RegExp(`(${escaped.join('|')})`, 'g');
  const parts = text.split(regex);

  const getHighlightStyle = () => {
    if (isScientificSocialism) {
      return 'font-semibold text-slate-800 dark:text-zinc-200 bg-slate-200/90 dark:bg-zinc-700/60 px-1 py-0.5 rounded shadow-2xs border-b border-slate-300 dark:border-zinc-600';
    }
    switch (trackId) {
      case 'meeting':
        return 'font-bold text-red-950 dark:text-red-100 bg-red-100/90 dark:bg-red-900/40 px-1 py-0.5 rounded shadow-xs border-b border-red-300 dark:border-red-700/60';
      case 'armed':
        return 'font-bold text-amber-950 dark:text-amber-100 bg-amber-100/90 dark:bg-amber-900/40 px-1 py-0.5 rounded shadow-xs border-b border-amber-300 dark:border-amber-700/60';
      case 'works':
      default:
        return 'font-bold text-emerald-950 dark:text-emerald-100 bg-emerald-100/90 dark:bg-emerald-900/40 px-1 py-0.5 rounded shadow-xs border-b border-emerald-300 dark:border-emerald-700/60';
    }
  };

  return (
    <span>
      {parts.map((part, index) => {
        const isMatch = highlights.includes(part);
        if (isMatch) {
          if (isQuizMode) {
            return (
              <span
                key={index}
                className="c98"
                title="点击或悬停显示考点"
              >
                <span className="c99">
                  <HighlightSearch text={part} query={searchQuery} />
                </span>
                <span className="c100">
                  [考点]
                </span>
              </span>
            );
          }

          return (
            <mark
              key={index}
              className={`${getHighlightStyle()} transition-colors duration-150`}
            >
              <HighlightSearch text={part} query={searchQuery} />
            </mark>
          );
        }
        return <HighlightSearch key={index} text={part} query={searchQuery} />;
      })}
    </span>
  );
};
