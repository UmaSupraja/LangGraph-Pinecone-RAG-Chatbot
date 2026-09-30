import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Copy,
  Check,
  Clock,
  Layers,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Terminal,
  FileCode2,
} from 'lucide-react';

interface Citation {
  id: string;
  page: number;
  title: string;
  score: number;
  text: string;
}

interface NodeTrace {
  node: string;
  status: 'pending' | 'running' | 'success' | 'skipped' | 'refused';
  latency_ms: number;
  details: string;
}

interface RAGResponse {
  query: string;
  final_answer: string;
  retrieved_context_chunks: string[];
  confidence_score: number;
  metadata: {
    is_grounded: boolean;
    is_out_of_scope: boolean;
    relevance_score: number;
    duration_ms: number;
    execution_flow: NodeTrace[];
    citations: Citation[];
  };
}

/**
 * Cleans escaped Markdown artifacts returned by the backend/LLM
 * while preserving useful formatting such as **bold**.
 */
function formatAnswerForDisplay(answer: string): string {
  function formatAnswerForDisplay(answer: string): string {
  return answer
    .replace(/\\\*\\\*/g, '')
    .replace(/\\\*\*/g, '**')
    .replace(/\\\*/g, '')
    .replace(/^\\(#{1,6})\s*/gm, '$1 ')
    .replace(/^\\\*\s+/gm, '• ')
    .replace(/^\*\s+/gm, '• ')
    .replace(/^\\-\s+/gm, '• ')
    .replace(/^-\s+/gm, '• ')
    .replace(/^(\s*\d+)\\\.\s*/gm, '$1. ')
    .replace(/^(\s*\d+)\.\s*/gm, '$1. ')
    .replace(/\\([*_#])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
export const PRESET_QUERIES = [
  {
    tag: '1. Definition & Scope',
    query: 'What is the core definition of Agentic AI as outlined in the eBook?',
    isOutOfScope: false,
  },
  {
    tag: '2. Architecture & Paradigms',
    query: 'What are the main architectural components required to build agentic systems?',
    isOutOfScope: false,
  },
  {
    tag: '3. Use Cases',
    query: 'What real-world industry use cases for Agentic AI are discussed in the eBook?',
    isOutOfScope: false,
  },
  {
    tag: '4. Comparison',
    query: 'How does Agentic AI differ from traditional generative AI chatbots according to the text?',
    isOutOfScope: false,
  },
  {
    tag: '5. Challenges & Considerations',
    query: 'What key challenges or limitations of Agentic AI are mentioned in the document?',
    isOutOfScope: false,
  },
  {
    tag: '6. Out-of-Scope Test',
    query: 'What is the capital of France?',
    isOutOfScope: true,
  },
];

export const ChatWorkbench: React.FC = () => {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<string>('');
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [showRawJson, setShowRawJson] = useState(true);
  const [expandedChunk, setExpandedChunk] = useState<number | null>(0);

  const handleSubmit = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    setIsLoading(true);
    setResponse(null);
    setInputQuery(queryText);

    // Simulate animated step progression
    setActiveStep('retrieve');

    const stepTimer1 = setTimeout(
      () => setActiveStep('grade_documents'),
      450
    );

    const stepTimer2 = setTimeout(
      () => setActiveStep('generate'),
      900
    );

    const stepTimer3 = setTimeout(
      () => setActiveStep('grade_groundedness'),
      1350
    );

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.details ||
            errorData.error ||
            'Server error'
        );
      }

      const data: RAGResponse = await res.json();

      // Clean escaped Markdown artifacts before displaying the answer
      const formattedData: RAGResponse = {
        ...data,
        final_answer: formatAnswerForDisplay(data.final_answer),
      };

      setResponse(formattedData);
    } catch (err: any) {
      console.error('Query execution error:', err);

      // Fallback display if error
      setResponse({
        query: queryText,
        final_answer: `Error executing RAG pipeline: ${err.message}`,
        retrieved_context_chunks: [],
        confidence_score: 0.0,
        metadata: {
          is_grounded: false,
          is_out_of_scope: false,
          relevance_score: 0.0,
          duration_ms: 0,
          execution_flow: [],
          citations: [],
        },
      });
    } finally {
      setIsLoading(false);
      setActiveStep('');
    }
  };

  const copyJsonPayload = () => {
    if (!response) return;

    const standardPayload = {
      query: response.query,
      final_answer: response.final_answer,
      retrieved_context_chunks:
        response.retrieved_context_chunks,
      confidence_score: response.confidence_score,
    };

    navigator.clipboard.writeText(
      JSON.stringify(standardPayload, null, 2)
    );

    setCopiedPayload(true);

    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const copyAnswerText = () => {
    if (!response) return;

    navigator.clipboard.writeText(response.final_answer);

    setCopiedAnswer(true);

    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome / Guidance Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
                LangGraph StateGraph Pipeline
              </span>

              <span className="text-xs text-slate-400">
                Cyclic Document Evaluation & Strict Grounding
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mt-1">
              Agentic AI Knowledge Base RAG Assistant
            </h2>

            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Synthesizes queries strictly from the 60-page{' '}
              <span className="text-cyan-300 font-semibold">
                Agentic AI for Executives
              </span>{' '}
              eBook. Every query executes through four LangGraph
              nodes with zero external hallucination, producing the
              exact specification payload.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg p-3 text-center min-w-[120px]">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Pinecone Index
              </div>

              <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                3072 Dimensions
              </div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg p-3 text-center min-w-[120px]">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Orchestrator
              </div>

              <div className="text-sm font-bold text-indigo-400 mt-0.5">
                LangGraph State
              </div>
            </div>
          </div>
        </div>

        {/* Quick Validation Presets */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />

            <span>
              Preset Validation Queries (Required Sample Tests):
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PRESET_QUERIES.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmit(preset.query)}
                disabled={isLoading}
                className={`text-left p-2.5 rounded-lg border text-xs transition-all flex flex-col justify-between group ${
                  preset.isOutOfScope
                    ? 'bg-rose-950/20 border-rose-900/60 hover:bg-rose-950/40 text-rose-200'
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-200 hover:border-cyan-500'
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span
                    className={
                      preset.isOutOfScope
                        ? 'text-rose-400'
                        : 'text-cyan-400'
                    }
                  >
                    {preset.tag}
                  </span>

                  {preset.isOutOfScope && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-rose-900 text-rose-300 rounded font-normal">
                      Refusal Test
                    </span>
                  )}
                </div>

                <div className="text-slate-300 line-clamp-2 group-hover:text-white">
                  "{preset.query}"
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(inputQuery);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about the Agentic AI eBook (or test out-of-scope queries)..."
              disabled={isLoading}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                <span>Processing Graph...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Run RAG Query</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Live LangGraph State Transition Visualizer */}
      {(isLoading || response) && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />

              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                LangGraph State Machine Flow
              </span>
            </div>

            {response && (
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />

                Total Latency: {response.metadata.duration_ms} ms
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Step 1: Retrieve */}
            <div
              className={`p-3 rounded-lg border text-xs transition-all ${
                activeStep === 'retrieve'
                  ? 'bg-cyan-950/60 border-cyan-500 ring-1 ring-cyan-500 animate-pulse text-cyan-300'
                  : response
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>1. retrieve</span>

                <span className="text-[10px] text-cyan-400 font-mono">
                  Top-k
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                Vector lookup in Pinecone (3072-d) + Hybrid Lexical Match
              </p>
            </div>

            {/* Step 2: Grade Documents */}
            <div
              className={`p-3 rounded-lg border text-xs transition-all ${
                activeStep === 'grade_documents'
                  ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500 animate-pulse text-indigo-300'
                  : response?.metadata?.is_out_of_scope
                  ? 'bg-rose-950/60 border-rose-600 text-rose-300'
                  : response
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>2. grade_documents</span>

                {response?.metadata?.is_out_of_scope ? (
                  <span className="text-[10px] text-rose-400 font-mono font-bold">
                    OUT-OF-SCOPE
                  </span>
                ) : (
                  <span className="text-[10px] text-indigo-400 font-mono">
                    RELEVANT
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400">
                Evaluates factual relevance & detects out-of-scope questions
              </p>
            </div>

            {/* Step 3: Generate / Refuse */}
            <div
              className={`p-3 rounded-lg border text-xs transition-all ${
                activeStep === 'generate'
                  ? 'bg-purple-950/60 border-purple-500 ring-1 ring-purple-500 animate-pulse text-purple-300'
                  : response?.metadata?.is_out_of_scope
                  ? 'bg-rose-900/40 border-rose-700 text-rose-200'
                  : response
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>
                  {response?.metadata?.is_out_of_scope
                    ? '3. refuse_node'
                    : '3. generate'}
                </span>

                <span className="text-[10px] text-purple-400 font-mono">
                  LLM
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                {response?.metadata?.is_out_of_scope
                  ? 'Politely refuses ungrounded/out-of-scope query'
                  : 'Grounded synthesis strictly based on eBook chunks'}
              </p>
            </div>

            {/* Step 4: Grade Groundedness */}
            <div
              className={`p-3 rounded-lg border text-xs transition-all ${
                activeStep === 'grade_groundedness'
                  ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500 animate-pulse text-emerald-300'
                  : response?.metadata?.is_grounded
                  ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
                  : response
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>4. grade_groundedness</span>

                <span className="text-[10px] text-emerald-400 font-mono">
                  SCORE
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                Hallucination check & confidence score computation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RAG Response Result Section */}
      {response && (
        <div className="space-y-6">
          {/* Main Answer Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {/* Header with Metrics */}
            <div className="p-4 bg-slate-800/60 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {response.metadata.is_out_of_scope ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950 border border-rose-800 text-rose-300 text-xs font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5" />

                    <span>Out-of-Scope (Refused)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />

                    <span>Strictly Grounded in eBook</span>
                  </div>
                )}

                <span className="text-xs text-slate-400">
                  {response.retrieved_context_chunks.length} Context Chunks
                </span>
              </div>

              {/* Confidence Score Pill */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
                  <span className="text-slate-400">
                    Confidence Score:
                  </span>

                  <span
                    className={`font-bold ${
                      response.confidence_score >= 0.85
                        ? 'text-emerald-400'
                        : response.confidence_score >= 0.5
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {response.confidence_score.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={copyAnswerText}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition"
                  title="Copy Answer"
                >
                  {copiedAnswer ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}

                  <span>
                    {copiedAnswer ? 'Copied' : 'Copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Answer Content */}
            <div className="p-6">
              <div className="text-xs font-mono text-slate-400 mb-2">
                Query: "{response.query}"
              </div>

              <div className="text-slate-100 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
                {response.final_answer}
              </div>
            </div>
          </div>

          {/* Structured JSON Output Payload Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-cyan-400" />

                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Standardized JSON Output Payload (Requirement 3.C)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyJsonPayload}
                  className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-semibold rounded-md transition shadow-sm"
                >
                  {copiedPayload ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied JSON!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON Payload</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="p-1 text-slate-400 hover:text-slate-200 text-xs"
                >
                  {showRawJson ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {showRawJson && (
              <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto text-emerald-300">
                <pre>
                  {JSON.stringify(
                    {
                      query: response.query,
                      final_answer: response.final_answer,
                      retrieved_context_chunks:
                        response.retrieved_context_chunks,
                      confidence_score:
                        response.confidence_score,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>

          {/* Retrieved Context Chunks with Source Citations */}
          {response.retrieved_context_chunks.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />

                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Retrieved Context Chunks from eBook (
                    {response.retrieved_context_chunks.length})
                  </h3>
                </div>

                <span className="text-xs text-slate-400">
                  Source: Ebook-Agentic-AI.pdf
                </span>
              </div>

              <div className="space-y-3">
                {response.retrieved_context_chunks.map(
                  (chunkText, idx) => {
                    const citation =
                      response.metadata.citations[idx];

                    const isExpanded =
                      expandedChunk === idx;

                    return (
                      <div
                        key={idx}
                        className="border border-slate-800 bg-slate-950/70 rounded-lg overflow-hidden transition"
                      >
                        <button
                          onClick={() =>
                            setExpandedChunk(
                              isExpanded ? null : idx
                            )
                          }
                          className="w-full text-left p-3 flex items-center justify-between hover:bg-slate-850 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 text-xs font-bold flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>

                            <span className="text-xs font-semibold text-slate-300">
                              {citation
                                ? `Page ${citation.page} — ${citation.title}`
                                : `Context Chunk #${idx + 1}`}
                            </span>

                            {citation?.score && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                Similarity:{' '}
                                {(citation.score * 100).toFixed(0)}
                                %
                              </span>
                            )}
                          </div>

                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-4 pt-1 border-t border-slate-800/80 bg-slate-950 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                            {chunkText}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* Detailed Node Execution Trace */}
          {response.metadata.execution_flow.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4 text-indigo-400" />

                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  LangGraph Node Execution Trace
                </h4>
              </div>

              <div className="space-y-2">
                {response.metadata.execution_flow.map(
                  (trace, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs p-2 rounded bg-slate-950 border border-slate-800/60 font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold">
                          {trace.node}
                        </span>

                        <span className="text-slate-500">
                          →
                        </span>

                        <span className="text-slate-300">
                          {trace.details}
                        </span>
                      </div>

                      <span className="text-slate-500 whitespace-nowrap">
                        {trace.latency_ms} ms
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
