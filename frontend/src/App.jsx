import React, { useState, useEffect } from 'react';
import { Loader2, Search, Zap, CheckCircle2 } from 'lucide-react';
import './index.css';

// TODO: Import your SpacetimeDB module bindings here once generated
// import { Annotations } from './module_bindings/annotations.js';

// Component to render text with highlighted claims
const HighlightedText = ({ text, annotations }) => {
  if (!text) return null;
  if (!annotations || annotations.length === 0) return <p className="text-lg leading-relaxed font-serif text-gray-800 whitespace-pre-wrap">{text}</p>;

  let parts = [];
  let currentIndex = 0;
  
  // Find all matches with their start indexes.
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

  // Sort by start index
  matches.sort((a, b) => a.startIdx - b.startIdx);

  // Filter overlapping matches
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
              {/* Tooltip */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-gray-900 text-white text-sm rounded-xl opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all duration-200 shadow-2xl z-20 font-sans pointer-events-none text-left leading-snug tracking-normal">
                <span className="block font-semibold mb-1 text-yellow-300 text-xs tracking-wider uppercase">AI Correction</span>
                <span className="block text-base">{part.correction}</span>
                {part.confidence && (
                  <span className="block mt-3 pt-2 border-t border-gray-700/50 text-xs text-gray-400 capitalize">
                    Confidence: <span className="text-white font-medium">{part.confidence}</span>
                  </span>
                )}
                {/* Arrow */}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></span>
              </span>
            </mark>
          );
        }
      })}
    </div>
  );
};

export default function App() {
  const [articleText, setArticleText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [scannedText, setScannedText] = useState("");
  const [error, setError] = useState(null);

  // --- SpacetimeDB Multiplayer Real-time Listener ---
  useEffect(() => {
    // This callback fires whenever a new row is inserted into the Annotations table
    const onAnnotationsInsert = (ctx, newRow) => {
      // Assuming newRow has standard column names (content, annotations, etc.)
      const incomingText = newRow.content || newRow.text || "";
      const incomingAnnotations = newRow.annotations || newRow.results || [];
      
      // Automatically update the editor's text
      setArticleText(incomingText);
      // Update annotations array
      setAnnotations(incomingAnnotations);
      // This immediately un-hides the Reading View, skipping the manual 'Scan Article' button click
      setScannedText(incomingText);
    };

    // Subscribes to the insert event on the Annotations table
    // Uncomment these below lines once your bindings are imported:
    // Annotations.onInsert(onAnnotationsInsert);

    // Cleanup subscription when the component unmounts
    return () => {
      // Annotations.removeOnInsert(onAnnotationsInsert);
    };
  }, []);

  const handleScan = async () => {
    if (!articleText.trim()) return;
    
    setIsScanning(true);
    setError(null);
    setScannedText("");
    
    try {
      const response = await fetch('http://localhost:3000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: "Live Scan",
          content: articleText
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      // Usually { annotations: [...] }
      const receivedAnnotations = Array.isArray(data) ? data : (data.annotations || []);
      
      setAnnotations(receivedAnnotations);
      setScannedText(articleText);
    } catch (err) {
      console.error(err);
      setError("Failed to scan article. Is the backend running on port 3000?");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 font-sans selection:bg-yellow-200">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 px-8 py-5 flex items-center gap-3">
        <div className="bg-yellow-400 p-2 rounded-xl">
          <Zap className="w-5 h-5 text-gray-900 fill-gray-900" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Live Lens</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 flex flex-col gap-12">
        {/* Editor Section */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">Scan & Verify</h2>
            <p className="text-xl text-gray-500 font-light">Paste your article below to instantly highlight and check claims with AI.</p>
          </div>
          
          <div className="relative group">
            <textarea 
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
              placeholder="Paste article text here... (e.g. 'The ocean is actually made of blue Gatorade.')"
              className="w-full min-h-[220px] p-6 text-lg border-2 border-gray-200 rounded-2xl resize-y focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 transition-all shadow-sm placeholder:text-gray-400 font-serif leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            <button 
              onClick={handleScan}
              disabled={isScanning || !articleText.trim()}
              className="inline-flex items-center gap-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-medium px-8 py-4 rounded-full shadow-md hover:shadow-xl transition-all active:scale-[0.98] text-lg"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Text...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Scan Article
                </>
              )}
            </button>
            
            {error && (
              <span className="text-red-500 font-medium px-4 py-2 bg-red-50 rounded-lg">{error}</span>
            )}
          </div>
        </section>

        {/* Reading View Section */}
        {scannedText && (
          <section className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out relative">
            <div className="absolute -left-8 top-0 bottom-0 w-1.5 bg-yellow-400 rounded-full hidden sm:block"></div>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-8">
              <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-yellow-500" />
                Reading View
              </h3>
              <span className="text-sm font-semibold bg-gray-100 text-gray-700 px-4 py-2 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                {annotations.length} claim(s) found
              </span>
            </div>
            
            <article className="prose prose-xl max-w-none">
              <HighlightedText text={scannedText} annotations={annotations} />
            </article>
          </section>
        )}
      </main>
    </div>
  );
}
