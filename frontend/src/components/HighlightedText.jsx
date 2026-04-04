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
    parts.push({ type: 'highlight', content: match.claim, correction: match.correction, confidence: match.confidence, source: match.source, id: match.id });
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
            <span key={`mark-${part.id}-${i}`} className="block w-full my-6 bg-transparent">
              <span className="text-red-700 bg-red-50 font-bold px-2 py-1 rounded shadow-sm border border-red-100">
                {part.content}
              </span>
              <div className="mt-3 p-5 bg-green-50 border-l-4 border-green-500 rounded-r-xl shadow-sm font-sans text-base leading-relaxed">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-green-200/60">
                  <span className="font-bold text-green-800 uppercase tracking-widest text-xs">AI Correction</span>
                  {part.confidence && (
                    <span className="inline-block bg-green-200/80 text-green-900 font-bold px-3 py-1 rounded-full text-xs box-border">
                      {part.confidence}% Confidence
                    </span>
                  )}
                </div>
                <p className="text-green-950 font-medium text-lg">{part.correction}</p>
                {part.source && (
                  <div className="mt-3 text-green-800 text-sm bg-green-100/50 p-3 rounded-lg">
                    <strong className="block text-xs uppercase tracking-wide text-green-700 mb-1">Source</strong>
                    {part.source}
                  </div>
                )}
              </div>
            </span>
          );
        }
      })}
    </div>
  );
}
