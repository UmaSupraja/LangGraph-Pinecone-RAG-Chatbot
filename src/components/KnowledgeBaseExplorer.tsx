import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, Layers, FileText, ChevronRight, Hash } from 'lucide-react';
import { EBOOK_PAGES } from '../data/ebook_pages.ts';
import { getAllChunks, type TextChunk } from '../data/chunker.ts';

export const KnowledgeBaseExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'pages' | 'chunks'>('pages');
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [allChunks, setAllChunks] = useState<TextChunk[]>([]);

  useEffect(() => {
    setAllChunks(getAllChunks());
  }, []);

  const chapters = [
    { id: 'all', label: 'All 60 Pages' },
    { id: 'Preface', label: 'Preface' },
    { id: 'Chapter 01', label: '01. Intro to Agentic AI' },
    { id: 'Chapter 02', label: '02. Anatomy of Agentic AI' },
    { id: 'Chapter 03', label: '03. Multi-Agent Systems' },
    { id: 'Chapter 04', label: '04. Orchestrating MAS' },
    { id: 'Chapter 05', label: '05. Your Readiness' },
    { id: 'Chapter 06', label: '06. Practical Applications' },
  ];

  const filteredPages = EBOOK_PAGES.filter((page) => {
    const matchesChapter =
      selectedChapter === 'all' ||
      (page.chapter && page.chapter.toLowerCase().includes(selectedChapter.toLowerCase()));
    const matchesSearch =
      !searchTerm ||
      page.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (page.title && page.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesChapter && matchesSearch;
  });

  const filteredChunks = allChunks.filter((chunk) => {
    const matchesChapter =
      selectedChapter === 'all' ||
      (chunk.chapter && chunk.chapter.toLowerCase().includes(selectedChapter.toLowerCase()));
    const matchesSearch =
      !searchTerm ||
      chunk.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chunk.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesChapter && matchesSearch;
  });

  const currentPageData = EBOOK_PAGES.find((p) => p.page === selectedPage) || EBOOK_PAGES[0];
  const pageChunks = allChunks.filter((c) => c.page === selectedPage);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800">
                Knowledge Base Ingestion
              </span>
              <span className="text-xs text-slate-400">PDF: Ebook-Agentic-AI.pdf</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Agentic AI for Executives — Full Text & Chunk Explorer
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Published by Konverge.AI & Emergence AI. Complete corpus of 60 pages partitioned into{' '}
              {allChunks.length} standard segments (500–1000 characters with 100 char overlap).
            </p>
          </div>

          {/* Toggle between Pages & Chunks */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setViewMode('pages')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                viewMode === 'pages'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Page Reader (60)</span>
            </button>
            <button
              onClick={() => setViewMode('chunks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                viewMode === 'chunks'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Chunk Inspector ({allChunks.length})</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search across all 60 pages (e.g. BDI, Factory 4.0, ESAO, Orchestrator, McKinsey)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {chapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedChapter(ch.id)}
                className={`px-2.5 py-1.5 text-xs rounded-md whitespace-nowrap transition border ${
                  selectedChapter === ch.id
                    ? 'bg-amber-950 border-amber-700 text-amber-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'pages' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Page Selector Sidebar */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 max-h-[680px] overflow-y-auto">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Pages ({filteredPages.length})</span>
              <span className="text-[10px] text-slate-500 font-mono">1 to 60</span>
            </div>
            <div className="space-y-1.5">
              {filteredPages.map((p) => {
                const isCurrent = p.page === selectedPage;
                return (
                  <button
                    key={p.page}
                    onClick={() => setSelectedPage(p.page)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between group ${
                      isCurrent
                        ? 'bg-amber-950/50 border-amber-600 text-amber-200 font-semibold shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-6 h-6 rounded bg-slate-800 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                        {p.page}
                      </span>
                      <span className="truncate">{p.title || `Page ${p.page}`}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isCurrent ? 'text-amber-400' : 'text-slate-600 group-hover:text-slate-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Page Reader View */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-amber-400 font-semibold uppercase">
                  Page {currentPageData.page} of 60 {currentPageData.chapter && `• ${currentPageData.chapter}`}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {currentPageData.title || `Page ${currentPageData.page}`}
                </h3>
              </div>
              <div className="text-right text-xs font-mono text-slate-400">
                <div>{currentPageData.text.length} characters</div>
                <div className="text-amber-400">{pageChunks.length} Chunks Indexed</div>
              </div>
            </div>

            {/* Extracted Text */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans max-h-[460px] overflow-y-auto">
              {currentPageData.text}
            </div>

            {/* Associated Chunks for this page */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                Pinecone Chunks from Page {currentPageData.page}:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pageChunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between text-cyan-400 font-bold mb-1">
                      <span>{chunk.id}</span>
                      <span className="text-slate-400">{chunk.charCount} chars</span>
                    </div>
                    <div className="text-slate-400 line-clamp-2">{chunk.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Chunk Inspector View */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>
              All Text Chunks ({filteredChunks.length} Chunks • 500-1000 Chars • 100 Overlap)
            </span>
            <span className="text-amber-400 font-mono">Pinecone Vector Payload</span>
          </div>

          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {filteredChunks.map((chunk, idx) => (
              <div
                key={chunk.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs hover:border-slate-700 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{chunk.id}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      Page {chunk.page}
                    </span>
                    <span className="text-slate-400 text-[11px] truncate max-w-xs">{chunk.title}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Size: <span className="text-amber-300 font-bold">{chunk.charCount}</span> chars
                  </div>
                </div>
                <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {chunk.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
