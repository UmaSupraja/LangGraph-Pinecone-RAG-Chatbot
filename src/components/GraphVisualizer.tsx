import React, { useState } from 'react';
import { GitBranch, Layers, ArrowRight, CornerDownRight, CheckCircle2, ShieldAlert, Cpu, Code2 } from 'lucide-react';

interface GraphNode {
  id: string;
  name: string;
  label: string;
  type: 'entry' | 'process' | 'decision' | 'terminal';
  description: string;
  inputs: string[];
  outputs: string[];
  logic: string;
  codeSnippet: string;
}

export const GraphVisualizer: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>('retrieve');

  const nodes: Record<string, GraphNode> = {
    retrieve: {
      id: 'retrieve',
      name: 'retrieve_node',
      label: '1. Retrieve Chunks',
      type: 'process',
      description: 'Generates 3072-dimensional vector embedding using gemini-embedding-2-preview and performs ANN cosine similarity query in Pinecone index agentic-ai-rag.',
      inputs: ['query: str'],
      outputs: ['retrieved_chunks: List[str]', 'retrieved_metadata: List[dict]'],
      logic: 'Query vector matches indexed vectors in Pinecone. Merges with BM25 keyword scoring for high recall across technical terminology.',
      codeSnippet: `def retrieve_node(state: RAGState) -> Dict[str, Any]:
    query_vector = embed_model.embed_query(state["query"]) # 3072 dims
    results = pinecone_index.query(
        vector=query_vector,
        top_k=5,
        include_metadata=True
    )
    return {
        "retrieved_chunks": [m.metadata["text"] for m in results.matches],
        "retrieved_metadata": results.matches
    }`
    },
    grade_documents: {
      id: 'grade_documents',
      name: 'grade_documents_node',
      label: '2. Grade Documents & Scope',
      type: 'decision',
      description: 'Evaluates whether the retrieved context contains relevant facts. Flags out-of-scope queries (e.g. general trivia like capital of France).',
      inputs: ['query: str', 'retrieved_chunks: List[str]'],
      outputs: ['is_relevant: bool', 'relevance_score: float', 'is_out_of_scope: bool'],
      logic: 'Runs an LLM grading pass. If relevance_score < 0.35 or query is unrelated to Agentic AI, routes to refuse_node.',
      codeSnippet: `def grade_documents_node(state: RAGState) -> Dict[str, Any]:
    grade = llm_evaluator.grade(
        query=state["query"],
        context=state["retrieved_chunks"]
    )
    return {
        "is_relevant": grade.is_relevant,
        "relevance_score": grade.score,
        "is_out_of_scope": not grade.is_relevant
    }`
    },
    generate: {
      id: 'generate',
      name: 'generate_node',
      label: '3. Grounded Synthesis',
      type: 'process',
      description: 'Synthesizes an executive, technical answer based SOLELY and STRICTLY on the retrieved eBook chunks with zero external hallucinations.',
      inputs: ['query: str', 'retrieved_chunks: List[str]'],
      outputs: ['final_answer: str'],
      logic: 'Feeds context chunks with strict grounding system instruction. Cites metrics, frameworks (ESAO, BDI, 6 Pillars) accurately.',
      codeSnippet: `def generate_node(state: RAGState) -> Dict[str, Any]:
    prompt = GroundedPrompt(
        context=state["retrieved_chunks"],
        query=state["query"]
    )
    answer = llm.generate(prompt, temperature=0.2)
    return {"final_answer": answer}`
    },
    grade_groundedness: {
      id: 'grade_groundedness',
      name: 'grade_groundedness_node',
      label: '4. Grade Groundedness & Confidence',
      type: 'process',
      description: 'Cross-checks every claim in the generated answer against the source context chunks to calculate a mathematical confidence score (0.0 to 1.0).',
      inputs: ['final_answer: str', 'retrieved_chunks: List[str]'],
      outputs: ['confidence_score: float', 'is_grounded: bool'],
      logic: 'Detects hallucinations. Calculates factual coverage and semantic similarity to source paragraphs.',
      codeSnippet: `def grade_groundedness_node(state: RAGState) -> Dict[str, Any]:
    eval_result = hallucination_grader.evaluate(
        context=state["retrieved_chunks"],
        answer=state["final_answer"]
    )
    confidence = calculate_confidence(eval_result.grounded_ratio)
    return {
        "is_grounded": eval_result.is_grounded,
        "confidence_score": confidence
    }`
    },
    refuse: {
      id: 'refuse',
      name: 'refuse_node',
      label: '3b. Out-of-Scope Refusal',
      type: 'terminal',
      description: 'Strict groundedness fallback. Refuses to answer questions outside the knowledge base of Agentic AI for Executives.',
      inputs: ['query: str'],
      outputs: ['final_answer: str', 'confidence_score: 0.0'],
      logic: 'Returns clear, respectful refusal stating the boundaries of the eBook. Sets confidence_score to 0.0.',
      codeSnippet: `def refuse_node(state: RAGState) -> Dict[str, Any]:
    return {
        "final_answer": "I am unable to answer because this question is outside the scope of 'Agentic AI for Executives'...",
        "confidence_score": 0.0,
        "is_out_of_scope": True
    }`
    }
  };

  const active = nodes[selectedNode] || nodes.retrieve;

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white">LangGraph StateGraph Architecture</h2>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          The system implements a cyclic, state-driven workflow using LangGraph. Each node transforms a typed state dictionary,
          evaluating context relevance before proceeding to generation, and auditing grounding confidence before formatting the final response payload.
        </p>
      </div>

      {/* Visual State Graph Canvas */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-2xl overflow-x-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center justify-between">
          <span>Interactive State Machine (Click any node to inspect logic)</span>
          <span className="text-cyan-400 font-mono">LangGraph 0.2.x</span>
        </div>

        <div className="min-w-[700px] flex flex-col items-center space-y-6 py-4">
          {/* Entry Point */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>START (User Query)</span>
          </div>

          <div className="w-0.5 h-6 bg-slate-700" />

          {/* Node 1: Retrieve */}
          <button
            onClick={() => setSelectedNode('retrieve')}
            className={`w-72 p-4 rounded-xl border text-left transition-all ${
              selectedNode === 'retrieve'
                ? 'bg-cyan-950/70 border-cyan-400 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-950'
                : 'bg-slate-900 border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-sm text-cyan-300">
              <span>retrieve_node</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950 border border-cyan-800 rounded font-mono">
                Pinecone (3072-d)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Embed query & fetch top-k chunks from vector index
            </p>
          </button>

          <div className="w-0.5 h-6 bg-slate-700" />

          {/* Node 2: Grade Documents */}
          <button
            onClick={() => setSelectedNode('grade_documents')}
            className={`w-72 p-4 rounded-xl border text-left transition-all ${
              selectedNode === 'grade_documents'
                ? 'bg-indigo-950/70 border-indigo-400 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-950'
                : 'bg-slate-900 border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-sm text-indigo-300">
              <span>grade_documents_node</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-950 border border-indigo-800 rounded font-mono">
                Relevance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify if context contains answers & filter out-of-scope
            </p>
          </button>

          {/* Conditional Router Junction */}
          <div className="w-full max-w-lg flex flex-col items-center">
            <div className="w-0.5 h-6 bg-slate-700" />
            <div className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-amber-300">
              Conditional Edge: check_relevance_route()
            </div>
            <div className="w-full flex justify-between items-start mt-4 px-8">
              {/* Left Branch: Generate */}
              <div className="flex flex-col items-center space-y-4">
                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> is_relevant == True
                </span>
                <div className="w-0.5 h-4 bg-emerald-700" />
                <button
                  onClick={() => setSelectedNode('generate')}
                  className={`w-64 p-3.5 rounded-xl border text-left transition-all ${
                    selectedNode === 'generate'
                      ? 'bg-purple-950/70 border-purple-400 ring-2 ring-purple-500/50 shadow-lg shadow-purple-950'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-sm text-purple-300">
                    <span>generate_node</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-950 border border-purple-800 rounded font-mono">
                      Gemini LLM
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Synthesize grounded response strictly on context
                  </p>
                </button>

                <div className="w-0.5 h-4 bg-slate-700" />

                <button
                  onClick={() => setSelectedNode('grade_groundedness')}
                  className={`w-64 p-3.5 rounded-xl border text-left transition-all ${
                    selectedNode === 'grade_groundedness'
                      ? 'bg-emerald-950/70 border-emerald-400 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-sm text-emerald-300">
                    <span>grade_groundedness</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-950 border border-emerald-800 rounded font-mono">
                      Score (0-1)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Audit hallucination & compute confidence score
                  </p>
                </button>
              </div>

              {/* Right Branch: Refusal */}
              <div className="flex flex-col items-center space-y-4">
                <span className="text-[10px] text-rose-400 font-mono font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> is_out_of_scope == True
                </span>
                <div className="w-0.5 h-4 bg-rose-700" />
                <button
                  onClick={() => setSelectedNode('refuse')}
                  className={`w-64 p-3.5 rounded-xl border text-left transition-all ${
                    selectedNode === 'refuse'
                      ? 'bg-rose-950/70 border-rose-400 ring-2 ring-rose-500/50 shadow-lg shadow-rose-950'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-sm text-rose-300">
                    <span>refuse_node</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-rose-950 border border-rose-800 rounded font-mono">
                      Score: 0.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Strict refusal for trivia or out-of-scope questions
                  </p>
                </button>
              </div>
            </div>
          </div>

          <div className="w-0.5 h-6 bg-slate-700" />

          {/* Terminal End */}
          <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400 font-bold shadow-lg">
            <span>END: Formatted JSON Output Payload</span>
          </div>
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <span className="text-xs text-cyan-400 font-mono font-semibold uppercase tracking-wider">
              Node Inspector
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">{active.label}</h3>
          </div>
          <span className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
            Node ID: {active.id}
          </span>
        </div>

        <p className="text-sm text-slate-300 mb-5 leading-relaxed">{active.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-xs font-mono">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-bold block mb-1">State Inputs:</span>
            <ul className="list-disc list-inside text-cyan-300 space-y-0.5">
              {active.inputs.map((inp, idx) => (
                <li key={idx}>{inp}</li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-bold block mb-1">State Outputs:</span>
            <ul className="list-disc list-inside text-emerald-300 space-y-0.5">
              {active.outputs.map((out, idx) => (
                <li key={idx}>{out}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Python LangGraph Implementation (rag_graph.py):</span>
          </div>
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed">
            {active.codeSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
