import React from 'react';

export default function HighlightedText({ text, annotations }) {
  if (!text) return null;
  if (!annotations || annotations.length === 0) return <p className="text-lg leading-relaxed font-serif text-gray-800 whitespace-pre-wrap">{text}</p>;

  let parts = [];
  let currentIndex = 0;

  let matches = [];
  annotations.forEach((anno, index) => {
    let startIdx = text.indexOf(anno.claim);
    if (startIdx !== -1) {
      matches.push({
        ...anno,
        startIdx,
        endIdx: startIdx + anno.claim.length,
        id: index
      });
    }
  });

  matches.sort((a, b) => a.startIdx - b.startIdx);

  let validMatches = [];
  let lastEnd = 0;
  matches.forEach(m => {
    if (m.startIdx >= lastEnd) {
      validMatches.push(m);
      lastEnd = m.endIdx;
    }
  });

  validMatches.forEach(match => {
    if (match.startIdx > currentIndex) {
      parts.push({ type: 'text', content: text.substring(currentIndex, match.startIdx) });
    }
    parts.push({ type: 'highlight', content: match.claim, correction: match.correction, confidence: match.confidence, id: match.id });
    currentIndex = match.endIdx;
  });

  if (currentIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(currentIndex) });
  }

  return (
    <div className="text-xl leading-loose font-serif text-gray-900 whitespace-pre-wrap transition-all">
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i}>{part.content}</span>;
        } else {
          return (
            <mark
              key={`mark-${part.id}-${i}`}
              className="relative group bg-yellow-200/80 hover:bg-yellow-300 transition-colors duration-200 cursor-help rounded px-1 py-0.5 inline-block text-gray-900"
            >
              {part.content}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-gray-900 text-white text-sm rounded-xl opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all duration-200 shadow-2xl z-20 font-sans pointer-events-none text-left leading-snug tracking-normal">
                <span className="block font-semibold mb-1 text-yellow-300 text-xs tracking-wider uppercase">AI Correction</span>
                <span className="block text-base">{part.correction}</span>
                {part.confidence && (
                  <span className="block mt-3 pt-2 border-t border-gray-700/50 text-xs text-gray-400 capitalize">
                    Confidence: <span className="text-white font-medium">{part.confidence}</span>
                  </span>
                )}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></span>
              </span>
            </mark>
          );
        }
      })}
    </div>
  );
}
