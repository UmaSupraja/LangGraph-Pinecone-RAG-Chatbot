import React from 'react';
import { SimpleChatbot } from './components/SimpleChatbot.tsx';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Clean Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              AI
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-100 tracking-tight leading-none">
                Agentic AI Chatbot
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Grounded in <span className="text-slate-300">Agentic AI for Executives</span> eBook
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chatbot View */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-col">
        <SimpleChatbot />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-center text-xs text-slate-500">
        <p>
          Agentic AI Assistant • Answers strictly based on the 60-Page Agentic AI eBook
        </p>
      </footer>
    </div>
  );
}
