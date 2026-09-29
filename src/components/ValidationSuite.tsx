import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileCode2,
  Copy,
  Check,
} from 'lucide-react';
import { PRESET_QUERIES } from './ChatWorkbench.tsx';

interface TestResult {
  id: string;
  tag: string;
  query: string;
  isOutOfScope: boolean;
  status: 'idle' | 'running' | 'passed' | 'failed';
  response?: {
    query: string;
    final_answer: string;
    retrieved_context_chunks: string[];
    confidence_score: number;
    metadata: {
      is_grounded: boolean;
      is_out_of_scope: boolean;
      duration_ms: number;
    };
  };
  notes?: string;
}

export const ValidationSuite: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>(
    PRESET_QUERIES.map((q, idx) => ({
      id: `TC-0${idx + 1}`,
      tag: q.tag,
      query: q.query,
      isOutOfScope: q.isOutOfScope,
      status: 'idle',
    }))
  );

  const [isRunningAll, setIsRunningAll] = useState(false);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const runSingleTest = async (testIndex: number) => {
    setTests((prev) =>
      prev.map((t, i) => (i === testIndex ? { ...t, status: 'running' } : t))
    );

    const testItem = tests[testIndex];

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testItem.query }),
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();
      let passed = true;
      let notes = '';

      if (testItem.isOutOfScope) {
        // Must refuse or state out of scope
        const ansLower = data.final_answer.toLowerCase();
        const hasRefusal =
          ansLower.includes('unable to answer') ||
          ansLower.includes('outside the scope') ||
          ansLower.includes('not available') ||
          ansLower.includes('not found') ||
          data.metadata?.is_out_of_scope;

        if (hasRefusal) {
          passed = true;
          notes = 'Correctly refused out-of-scope query without hallucinations.';
        } else {
          passed = false;
          notes = 'Failed: Model answered out-of-scope query instead of refusing.';
        }
      } else {
        // In-scope must have chunks and reasonable confidence
        if (data.confidence_score >= 0.6 && data.retrieved_context_chunks.length > 0) {
          passed = true;
          notes = `Grounded in ${data.retrieved_context_chunks.length} chunks. Confidence: ${data.confidence_score.toFixed(2)}`;
        } else {
          passed = false;
          notes = `Low confidence or missing chunks (Score: ${data.confidence_score})`;
        }
      }

      setTests((prev) =>
        prev.map((t, i) =>
          i === testIndex
            ? {
                ...t,
                status: passed ? 'passed' : 'failed',
                response: data,
                notes,
              }
            : t
        )
      );
    } catch (err: any) {
      setTests((prev) =>
        prev.map((t, i) =>
          i === testIndex
            ? {
                ...t,
                status: 'failed',
                notes: `Error: ${err.message}`,
              }
            : t
        )
      );
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (let i = 0; i < tests.length; i++) {
      await runSingleTest(i);
    }
    setIsRunningAll(false);
  };

  const copyPayload = (test: TestResult) => {
    if (!test.response) return;
    const payload = {
      query: test.response.query,
      final_answer: test.response.final_answer,
      retrieved_context_chunks: test.response.retrieved_context_chunks,
      confidence_score: test.response.confidence_score,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(test.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const passedCount = tests.filter((t) => t.status === 'passed').length;
  const completedCount = tests.filter(
    (t) => t.status === 'passed' || t.status === 'failed'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                Evaluation & Testing Suite
              </span>
              <span className="text-xs text-slate-400">Section 4 Requirements Matrix</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Automated Validation Benchmark (6 Mandatory Queries)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Verifies factual extraction, strict knowledge boundaries, hallucination avoidance,
              and the mandatory out-of-scope refusal behavior on general trivia.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runAllTests}
              disabled={isRunningAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-lg shadow-md transition disabled:opacity-50"
            >
              {isRunningAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Running All Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run All 6 Tests</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar & Counter */}
        {completedCount > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-300 font-medium">
                Test Progress: {completedCount} of 6 Completed
              </span>
              <span className="text-emerald-400 font-bold font-mono">
                {passedCount} Passed ({((passedCount / 6) * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(completedCount / 6) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Test Cases List */}
      <div className="space-y-3">
        {tests.map((test, index) => {
          const isExpanded = expandedTest === test.id;

          return (
            <div
              key={test.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md transition"
            >
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="mt-0.5 sm:mt-0">
                    {test.status === 'passed' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                    {test.status === 'failed' && (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    )}
                    {test.status === 'running' && (
                      <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                    )}
                    {test.status === 'idle' && (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {test.id}
                      </span>
                      <span className="text-xs font-semibold text-cyan-400">
                        {test.tag}
                      </span>
                      {test.isOutOfScope && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-rose-950 text-rose-300 border border-rose-800 rounded font-semibold">
                          Out-of-Scope Test
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-200 mt-0.5">
                      "{test.query}"
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {test.response && (
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-400">Score:</span>
                      <span
                        className={`font-bold ${
                          test.response.confidence_score >= 0.8
                            ? 'text-emerald-400'
                            : test.response.confidence_score >= 0.5
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {test.response.confidence_score.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => runSingleTest(index)}
                    disabled={test.status === 'running' || isRunningAll}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 border border-slate-700 rounded-md transition disabled:opacity-50"
                  >
                    {test.status === 'running' ? 'Testing...' : 'Run Test'}
                  </button>

                  {test.response && (
                    <button
                      onClick={() => setExpandedTest(isExpanded ? null : test.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 rounded"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Notes bar if completed */}
              {test.notes && (
                <div
                  className={`px-4 py-1.5 text-xs border-t border-b ${
                    test.status === 'passed'
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                  }`}
                >
                  <span className="font-semibold">{test.status.toUpperCase()}:</span> {test.notes}
                </div>
              )}

              {/* Expandable Details & Payload */}
              {isExpanded && test.response && (
                <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-4">
                  {/* Answer Preview */}
                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-1">
                      Synthesized Answer:
                    </div>
                    <div className="text-xs text-slate-200 bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed font-sans">
                      {test.response.final_answer}
                    </div>
                  </div>

                  {/* Standard Output JSON */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
                      <div className="flex items-center gap-1.5">
                        <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Returned JSON Response Payload:</span>
                      </div>
                      <button
                        onClick={() => copyPayload(test)}
                        className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        {copiedId === test.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === test.id ? 'Copied' : 'Copy Payload'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto">
                      {JSON.stringify(
                        {
                          query: test.response.query,
                          final_answer: test.response.final_answer,
                          retrieved_context_chunks: test.response.retrieved_context_chunks,
                          confidence_score: test.response.confidence_score,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
