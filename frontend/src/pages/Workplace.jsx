import React, { useState, useEffect } from 'react';
import { Loader2, Search, CheckCircle2 } from 'lucide-react';
import HighlightedText from '../components/HighlightedText';
import { DbConnection } from '../module_bindings/index.ts';

export default function Workplace() {
  const [articleText, setArticleText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [scannedText, setScannedText] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const conn = DbConnection.builder()
      .withUri('http://127.0.0.1:3000')
      .withDatabaseName('live-lens-db')
      .onConnect(() => {
        console.log("Connected to SpacetimeDB (Workplace)");
      })
      .build();

    const sub = conn.subscriptionBuilder()
      .onApplied(() => {})
      .subscribe("SELECT * FROM GlobalScan");

    const onGlobalScanInsert = (ctx, row) => {
      const text = row.articleText || row.article_text || "";
      const annotationsStr = row.annotationsJson || row.annotations_json || "[]";

      let parsedAnnotations = [];
      try {
        parsedAnnotations = typeof annotationsStr === 'string' ? JSON.parse(annotationsStr) : annotationsStr;
      } catch (e) {
        console.error("Parse error:", e);
      }

      setArticleText(text);
      setAnnotations(parsedAnnotations);
      setScannedText(text);
      setIsScanning(false);
    };

    const insertCallbackObj = conn.db.GlobalScan.onInsert(onGlobalScanInsert);

    return () => {
      conn.db.GlobalScan.removeOnInsert(insertCallbackObj);
      conn.disconnect();
    };
  }, []);

  const handleScan = async () => {
    if (!articleText.trim()) return;

    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "Live Scan",
          content: articleText
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to scan article. Please try again.");
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
    </div>
  );
}
