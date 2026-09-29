import React from 'react';
import { Network, Database, Cpu, BookOpen, GitBranch, CheckCircle2, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  activeTab: 'chat' | 'benchmark' | 'graph' | 'knowledge' | 'pinecone' | 'github';
  setActiveTab: (tab: 'chat' | 'benchmark' | 'graph' | 'knowledge' | 'pinecone' | 'github') => void;
  systemHealth: {
    ready: boolean;
    totalChunks: number;
    pineconeStats?: any;
  } | null;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, systemHealth }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-3">
          {/* Brand & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">LangGraph & Pinecone RAG</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  AI Engineer Submission
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Grounded Knowledge Base: <span className="text-slate-200 font-medium">Agentic AI for Executives</span> (Konverge.AI & Emergence AI)
              </p>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pinecone:</span>
              <span className="text-emerald-400 font-mono font-medium">agentic-ai-rag (3072-d)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
              <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
              <span>Graph:</span>
              <span className="text-indigo-400 font-medium">LangGraph Cyclic</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>eBook:</span>
              <span className="text-amber-300 font-mono font-medium">{systemHealth?.totalChunks || 108} Chunks / 60 Pages</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 border-t border-slate-800/80 pt-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-slate-800/60 text-cyan-400 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Chat & Workbench</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'benchmark'
                ? 'bg-slate-800/60 text-cyan-400 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Validation Suite (6 Cases)</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
              Groundedness
            </span>
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'graph'
                ? 'bg-slate-800/60 text-cyan-400 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30'
            }`}
          >
            <GitBranch className="w-4 h-4 text-indigo-400" />
            <span>LangGraph Flow Visualizer</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'knowledge'
                ? 'bg-slate-800/60 text-cyan-400 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Knowledge Base Explorer (60 Pages)</span>
          </button>

          <button
            onClick={() => setActiveTab('pinecone')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'pinecone'
                ? 'bg-slate-800/60 text-cyan-400 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Pinecone Vector Index</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'github'
                ? 'bg-slate-800/60 text-cyan-400 border-cyan-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30'
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>GitHub Submission Center</span>
          </button>
        </div>
      </div>
    </header>
  );
};
