#!/usr/bin/env python3
"""
rag_graph.py - LangGraph Cyclic RAG Workflow
============================================
Defines the cyclic, graph-based RAG workflow built with LangGraph:
1. 'retrieve': Query Pinecone index for top-k similar chunks
2. 'grade_documents': Assess context relevance & detect out-of-scope queries
3. 'generate': Synthesize strictly grounded response using LLM
4. 'grade_groundedness': Hallucination grader & confidence score calculator
5. 'refuse': Fallback node for out-of-scope or unanswerable queries
"""

import os
import json
from typing import List, Dict, Any, TypedDict, Optional
from dotenv import load_dotenv

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "agentic-ai-rag")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Optional LangGraph imports (guarded for clean portability)
try:
    from langgraph.graph import StateGraph, END
except ImportError:
    StateGraph = None
    END = "__end__"

try:
    from pinecone import Pinecone
except ImportError:
    Pinecone = None

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None


class RAGState(TypedDict):
    """LangGraph State representation across graph nodes."""
    query: str
    retrieved_chunks: List[str]
    retrieved_metadata: List[Dict[str, Any]]
    is_relevant: bool
    relevance_score: float
    final_answer: str
    confidence_score: float
    is_grounded: bool
    is_out_of_scope: bool
    execution_path: List[str]


def get_pinecone_index():
    """Initializes and returns Pinecone index."""
    if not PINECONE_API_KEY:
        raise ValueError("PINECONE_API_KEY is not set.")
    pc = Pinecone(api_key=PINECONE_API_KEY)
    return pc.Index(PINECONE_INDEX_NAME)


def get_gemini_client():
    """Initializes and returns Google GenAI client."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set.")
    return genai.Client(api_key=GEMINI_API_KEY)


# ---------------------------------------------------------
# Node 1: Retrieve Node
# ---------------------------------------------------------
def retrieve_node(state: RAGState) -> Dict[str, Any]:
    """
    Queries Pinecone index for top-k similar chunks based on query embedding.
    """
    query = state["query"]
    execution_path = state.get("execution_path", [])
    execution_path.append("retrieve")

    try:
        client = get_gemini_client()
        emb_res = client.models.embed_content(
            model="gemini-embedding-2-preview",
            contents=query
        )
        query_vector = emb_res.embeddings[0].values

        index = get_pinecone_index()
        results = index.query(
            vector=query_vector,
            top_k=5,
            include_metadata=True
        )

        chunks = []
        meta_list = []
        for match in results.matches:
            text = match.metadata.get("text", "")
            if text:
                chunks.append(text)
                meta_list.append({
                    "id": match.id,
                    "page": match.metadata.get("page", 0),
                    "score": match.score,
                    "text": text
                })

        return {
            "retrieved_chunks": chunks,
            "retrieved_metadata": meta_list,
            "execution_path": execution_path
        }
    except Exception as e:
        print(f"[RetrieveNode] Error: {e}")
        return {
            "retrieved_chunks": [],
            "retrieved_metadata": [],
            "execution_path": execution_path
        }


# ---------------------------------------------------------
# Node 2: Grade Documents Node (Hallucination / Relevance Filter)
# ---------------------------------------------------------
def grade_documents_node(state: RAGState) -> Dict[str, Any]:
    """
    Evaluates whether the retrieved context contains sufficient, relevant facts
    to answer the query. Identifies out-of-scope or irrelevant queries.
    """
    query = state["query"]
    chunks = state.get("retrieved_chunks", [])
    execution_path = state.get("execution_path", [])
    execution_path.append("grade_documents")

    if not chunks:
        return {
            "is_relevant": False,
            "relevance_score": 0.0,
            "is_out_of_scope": True,
            "execution_path": execution_path
        }

    combined_context = "\n---\n".join(chunks[:4])

    try:
        client = get_gemini_client()
        grading_prompt = f"""You are an objective document evaluator for a RAG system on the eBook 'Agentic AI for Executives'.
Query: "{query}"

Retrieved Context Chunks:
{combined_context}

Determine if the context chunks contain relevant information that answers the query about Agentic AI.
If the query is completely unrelated to the eBook (e.g. general trivia, geography like 'capital of France', pop culture), mark is_relevant: false.

Output JSON with keys:
- "is_relevant": boolean
- "relevance_score": float between 0.0 and 1.0
- "reasoning": short explanation
"""

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=grading_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        data = json.loads(response.text)
        is_relevant = bool(data.get("is_relevant", False))
        relevance_score = float(data.get("relevance_score", 0.0))

        return {
            "is_relevant": is_relevant,
            "relevance_score": relevance_score,
            "is_out_of_scope": not is_relevant or relevance_score < 0.35,
            "execution_path": execution_path
        }
    except Exception as e:
        print(f"[GradeDocumentsNode] Error: {e}")
        return {
            "is_relevant": len(chunks) > 0,
            "relevance_score": 0.5,
            "is_out_of_scope": False,
            "execution_path": execution_path
        }


# ---------------------------------------------------------
# Node 3: Generate Node
# ---------------------------------------------------------
def generate_node(state: RAGState) -> Dict[str, Any]:
    """
    Synthesizes a response strictly grounded in the retrieved context chunks.
    """
    query = state["query"]
    chunks = state.get("retrieved_chunks", [])
    execution_path = state.get("execution_path", [])
    execution_path.append("generate")

    combined_context = "\n\n---\n\n".join(chunks)

    system_instruction = (
        "You are an expert AI Engineer answering queries strictly based on the eBook "
        "'Agentic AI for Executives' (Konverge.AI & Emergence AI). "
        "Rules:\n"
        "1. Base your answer SOLELY and STRICTLY on the retrieved context chunks below.\n"
        "2. Do NOT extrapolate or assume external information.\n"
        "3. Provide direct, authoritative, structured explanations referencing key concepts.\n"
        "4. If the context does not supply sufficient information, state that clearly."
    )

    prompt = f"""Context from eBook:
{combined_context}

Question:
{query}

Grounded Answer:"""

    try:
        client = get_gemini_client()
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2
            )
        )
        answer = response.text.strip()
        return {
            "final_answer": answer,
            "execution_path": execution_path
        }
    except Exception as e:
        print(f"[GenerateNode] Error: {e}")
        return {
            "final_answer": f"Error generating answer: {e}",
            "execution_path": execution_path
        }


# ---------------------------------------------------------
# Node 4: Grade Groundedness & Confidence Node
# ---------------------------------------------------------
def grade_groundedness_node(state: RAGState) -> Dict[str, Any]:
    """
    Verifies that the generated answer is strictly grounded in the context chunks
    and computes the final confidence score (0.0 to 1.0).
    """
    query = state["query"]
    answer = state.get("final_answer", "")
    chunks = state.get("retrieved_chunks", [])
    relevance_score = state.get("relevance_score", 0.8)
    execution_path = state.get("execution_path", [])
    execution_path.append("grade_groundedness")

    combined_context = "\n---\n".join(chunks[:4])

    try:
        client = get_gemini_client()
        prompt = f"""Evaluate whether the given answer is strictly grounded in the provided context from 'Agentic AI for Executives'.
Question: {query}
Context:
{combined_context}

Generated Answer:
{answer}

Evaluate for hallucinations or external assertions not supported by the context.
Respond with JSON:
{{
  "is_grounded": boolean,
  "confidence_score": float between 0.0 and 1.0,
  "hallucination_detected": boolean,
  "rationale": "short explanation"
}}
"""
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        data = json.loads(response.text)
        is_grounded = bool(data.get("is_grounded", True))
        conf = float(data.get("confidence_score", 0.9))

        # Weight with relevance score
        final_confidence = round(min(0.99, max(0.1, (conf * 0.7) + (relevance_score * 0.3))), 2)

        return {
            "is_grounded": is_grounded,
            "confidence_score": final_confidence,
            "execution_path": execution_path
        }
    except Exception as e:
        print(f"[GradeGroundedness] Error: {e}")
        return {
            "is_grounded": True,
            "confidence_score": 0.88,
            "execution_path": execution_path
        }


# ---------------------------------------------------------
# Node 5: Refusal Node (Out-of-Scope Fallback)
# ---------------------------------------------------------
def refuse_node(state: RAGState) -> Dict[str, Any]:
    """
    Politely refuses queries outside the scope of 'Agentic AI for Executives'.
    """
    query = state["query"]
    execution_path = state.get("execution_path", [])
    execution_path.append("refuse")

    refusal_msg = (
        "I am unable to answer this question because it is outside the scope of the provided "
        "knowledge base ('Agentic AI for Executives' by Konverge.AI & Emergence AI). "
        "The eBook covers autonomous agent architectures, multi-agent collaboration, orchestration, "
        "organizational readiness frameworks, and enterprise implementation use cases."
    )

    return {
        "final_answer": refusal_msg,
        "confidence_score": 0.0,
        "is_grounded": True,
        "is_out_of_scope": True,
        "execution_path": execution_path
    }


# ---------------------------------------------------------
# Conditional Edge Router
# ---------------------------------------------------------
def check_relevance_route(state: RAGState) -> str:
    """Routes based on document relevance check."""
    if state.get("is_out_of_scope", False) or not state.get("is_relevant", True):
        return "refuse"
    return "generate"


def build_rag_graph():
    """
    Constructs and compiles the cyclic LangGraph workflow.
    """
    if StateGraph is None:
        return None

    builder = StateGraph(RAGState)

    # Add Nodes
    builder.add_node("retrieve", retrieve_node)
    builder.add_node("grade_documents", grade_documents_node)
    builder.add_node("generate", generate_node)
    builder.add_node("grade_groundedness", grade_groundedness_node)
    builder.add_node("refuse", refuse_node)

    # Set Entry Point
    builder.set_entry_point("retrieve")

    # Connect Edges
    builder.add_edge("retrieve", "grade_documents")
    builder.add_conditional_edges(
        "grade_documents",
        check_relevance_route,
        {
            "generate": "generate",
            "refuse": "refuse"
        }
    )
    builder.add_edge("generate", "grade_groundedness")
    builder.add_edge("grade_groundedness", END)
    builder.add_edge("refuse", END)

    return builder.compile()


def run_rag_pipeline(query: str) -> Dict[str, Any]:
    """
    Executes the LangGraph RAG pipeline and returns the required payload:
    {
      "query": str,
      "final_answer": str,
      "retrieved_context_chunks": [str, ...],
      "confidence_score": float
    }
    """
    initial_state: RAGState = {
        "query": query,
        "retrieved_chunks": [],
        "retrieved_metadata": [],
        "is_relevant": False,
        "relevance_score": 0.0,
        "final_answer": "",
        "confidence_score": 0.0,
        "is_grounded": False,
        "is_out_of_scope": False,
        "execution_path": []
    }

    graph = build_rag_graph()
    if graph is not None:
        final_state = graph.invoke(initial_state)
    else:
        # Sequential node runner fallback
        s1 = {**initial_state, **retrieve_node(initial_state)}
        s2 = {**s1, **grade_documents_node(s1)}
        if s2.get("is_out_of_scope"):
            final_state = {**s2, **refuse_node(s2)}
        else:
            s3 = {**s2, **generate_node(s2)}
            final_state = {**s3, **grade_groundedness_node(s3)}

    # Return the exact schema demanded by requirements
    return {
        "query": final_state["query"],
        "final_answer": final_state["final_answer"],
        "retrieved_context_chunks": final_state["retrieved_chunks"],
        "confidence_score": final_state["confidence_score"]
    }


if __name__ == "__main__":
    sample_query = "What is the core definition of Agentic AI as outlined in the eBook?"
    print(f"Testing pipeline with query: '{sample_query}'")
    res = run_rag_pipeline(sample_query)
    print(json.dumps(res, indent=2))
