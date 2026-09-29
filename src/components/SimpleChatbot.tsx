import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BookOpen,
} from 'lucide-react';

interface Citation {
  id: string;
  page: number;
  title: string;
  score: number;
  text: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: Citation[];
  retrieved_context_chunks?: string[];
  confidence_score?: number;
}

const STARTER_PROMPTS = [
  { label: '👋 Say Hello', text: 'Hello!' },
  { label: '💡 What is Agentic AI?', text: 'What is the core definition of Agentic AI as outlined in the eBook?' },
  { label: '⚖️ LLMs vs Agentic AI', text: 'How does Agentic AI differ from traditional generative AI chatbots according to the text?' },
  { label: '🏛️ 6 Core Pillars', text: 'What are the main architectural components and pillars required to build agentic systems?' },
  { label: '📦 Supply Chain MAS', text: 'How does a Multi-Agent System (MAS) handle supply chain crises according to the eBook?' },
  { label: '📊 Organizational Readiness', text: 'How should an organization assess its readiness for adopting Agentic AI?' },
];

export const SimpleChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Hello! 👋 Welcome to the **Agentic AI Chatbot**.\n\nI am here to answer any questions about the 60-page eBook: **'Agentic AI for Executives'** (by Konverge.AI & Emergence AI).\n\nYou can ask me about:\n• What Agentic AI is and how it compares to Generative AI\n• The core pillars: Perception, Reasoning, Planning, Learning, Verification, Execution\n• Multi-Agent Systems (MAS) and orchestration\n• Real-world use cases in retail, healthcare, manufacturing, and finance\n• Readiness frameworks for organizations\n\nOr feel free to just say hello!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCitationId, setExpandedCitationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputText).trim();
    if (!q || isLoading) return;

    const userMsgId = 'msg-' + Date.now();
    const newUserMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'assistant',
        text: data.final_answer || 'No answer generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: data.metadata?.citations || [],
        retrieved_context_chunks: data.retrieved_context_chunks || [],
        confidence_score: data.confidence_score,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'assistant',
        text: 'Sorry, I encountered an error while searching the document. Please try again in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: "Hello again! 👋 Chat has been cleared. What would you like to ask about Agentic AI?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Clean Chat Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100 text-base">Agentic AI Chatbot</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Sourced from: <strong>Agentic AI for Executives (60 Pages)</strong></span>
            </p>
          </div>
        </div>

        <button
          onClick={resetChat}
          className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium"
          title="Start new conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
              }`}
            >
              {/* Message text with formatting */}
              <div className="whitespace-pre-line space-y-2">
                {msg.text.split('\n\n').map((paragraph, idx) => {
                  return (
                    <p key={idx} className="leading-relaxed">
                      {paragraph.split('**').map((chunk, cIdx) =>
                        cIdx % 2 === 1 ? (
                          <strong key={cIdx} className="font-semibold text-white">
                            {chunk}
                          </strong>
                        ) : (
                          chunk
                        )
                      )}
                    </p>
                  );
                })}
              </div>

              {/* Citations & Evidence (for assistant responses that queried the PDF) */}
              {msg.sender === 'assistant' && msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setExpandedCitationId(
                          expandedCitationId === msg.id ? null : msg.id
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>
                        Sourced from PDF Pages:{' '}
                        {Array.from(new Set(msg.citations.map((c) => c.page))).join(', ')}
                      </span>
                      {expandedCitationId === msg.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded PDF Excerpts */}
                  {expandedCitationId === msg.id && (
                    <div className="space-y-2 pt-1.5">
                      {msg.citations.map((citation, citIdx) => (
                        <div
                          key={citIdx}
                          className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-3 text-xs text-slate-300"
                        >
                          <div className="font-medium text-blue-300 mb-1">
                            Page {citation.page} • {citation.title}
                          </div>
                          <p className="text-slate-400 italic text-[11px] leading-relaxed line-clamp-4">
                            "{citation.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action footer */}
              <div className="flex items-center justify-between mt-2 pt-1.5 text-[11px] text-slate-400">
                <span>{msg.timestamp}</span>

                <button
                  onClick={() => copyToClipboard(msg.text, msg.id)}
                  className="hover:text-slate-200 flex items-center gap-1 transition"
                  title="Copy response text"
                >
                  {copiedId === msg.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3.5 justify-start">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-1">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-tl-none p-4 text-sm text-slate-300 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-75"></div>
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-150"></div>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Searching eBook knowledge base & preparing answer...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips */}
      {messages.length <= 2 && (
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold shrink-0">
            Suggested:
          </span>
          {STARTER_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.text)}
              disabled={isLoading}
              className="text-xs whitespace-nowrap bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white px-3 py-1.5 rounded-full border border-slate-700 transition shrink-0 flex items-center gap-1"
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center gap-2"
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about Agentic AI (e.g. 'Hi', 'What is Agentic AI?', 'What are the 4 types of agents?')..."
            disabled={isLoading}
            className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl shadow-md transition shrink-0"
            title="Send Message"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>

        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500">
          <span>Answers are strictly based on the Agentic AI eBook.</span>
          <span className="hidden sm:inline">Press Enter to send</span>
        </div>
      </div>
    </div>
  );
};
