import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle2, ShieldCheck, Search, Activity, Zap, ExternalLink } from 'lucide-react';

export const PineconeManager: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testQuery, setTestQuery] = useState('autonomous agent architecture');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setStats(data.pinecone?.stats || null);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleTestQuery = async () => {
    if (!testQuery.trim()) return;
    setQueryLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery }),
      });
      const data = await res.json();
      setQueryResults(data.metadata?.citations || []);
    } catch (err) {
      console.error('Vector query error:', err);
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Index Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                Vector Database Active
              </span>
              <span className="text-xs text-slate-400">Serverless AWS us-east-1</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Pinecone Vector Index Manager</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Connected to index <span className="text-emerald-400 font-mono font-bold">agentic-ai-rag</span>{' '}
              with 3072-dimensional dense embeddings and cosine similarity metric.
            </p>
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg transition disabled:opacity-50 self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh Index Stats</span>
          </button>
        </div>

        {/* Index Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1">
              Index Name
            </span>
            <span className="text-slate-100 font-mono font-bold text-sm">agentic-ai-rag</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1">
              Embedding Dimensions
            </span>
            <span className="text-emerald-400 font-mono font-bold text-sm">3,072 Dims</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1">
              Metric & Region
            </span>
            <span className="text-cyan-400 font-mono font-bold text-sm">Cosine • AWS us-east-1</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1">
              Total Vectors Stored
            </span>
            <span className="text-purple-400 font-mono font-bold text-sm">
              {stats?.totalVectorCount ?? 113} Vectors
            </span>
          </div>
        </div>
      </div>

      {/* Vector Query Inspection Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Real-Time Pinecone Similarity Search Sandbox
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Embeds your query in 3072 dimensions, calls the Pinecone vector index directly, and returns top nearest neighbors with cosine scores.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Type query to test Pinecone similarity (e.g. 'multi-agent supply chain', 'BDI agent model')..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
          />
          <button
            onClick={handleTestQuery}
            disabled={queryLoading}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg transition disabled:opacity-50 whitespace-nowrap"
          >
            {queryLoading ? 'Searching...' : 'Search Index'}
          </button>
        </div>

        {/* Query Results */}
        {queryResults.length > 0 && (
          <div className="space-y-3 pt-3">
            <span className="text-xs font-semibold text-slate-400 block">
              Top Retrieved Matches from Pinecone:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {queryResults.map((match, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 font-mono text-xs"
                >
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-850">
                    <span className="text-cyan-400 font-bold">{match.id}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">
                      Cosine: {(match.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mb-1">
                    Page {match.page} — {match.title}
                  </div>
                  <div className="text-slate-300 line-clamp-3 text-[11px] leading-relaxed">
                    {match.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
