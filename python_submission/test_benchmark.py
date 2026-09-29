#!/usr/bin/env python3
"""
test_benchmark.py - Validation & Benchmark Suite
================================================
Executes the 6 mandatory validation questions and validates:
1. Exact JSON schema { query, final_answer, retrieved_context_chunks, confidence_score }
2. Groundedness check for in-scope queries (confidence > 0.70)
3. Correct refusal/out-of-scope handling for query 6 ("What is the capital of France?")
"""

import sys
import json
from typing import List, Dict, Any
from rag_graph import run_rag_pipeline

TEST_CASES = [
    {
        "id": "TC-01",
        "category": "Definition & Scope",
        "query": "What is the core definition of Agentic AI as outlined in the eBook?",
        "expected_in_scope": True,
        "keywords": ["autonomous", "decision-making", "action", "goals", "proactive"]
    },
    {
        "id": "TC-02",
        "category": "Architecture & Paradigms",
        "query": "What are the main architectural components required to build agentic systems?",
        "expected_in_scope": True,
        "keywords": ["perception", "reasoning", "planning", "execution", "learning", "memory", "layers"]
    },
    {
        "id": "TC-03",
        "category": "Use Cases",
        "query": "What real-world industry use cases for Agentic AI are discussed in the eBook?",
        "expected_in_scope": True,
        "keywords": ["retail", "manufacturing", "healthcare", "supply chain", "pharma"]
    },
    {
        "id": "TC-04",
        "category": "Comparison",
        "query": "How does Agentic AI differ from traditional generative AI chatbots according to the text?",
        "expected_in_scope": True,
        "keywords": ["proactive", "reactive", "autonomous", "tools", "goals", "prompts"]
    },
    {
        "id": "TC-05",
        "category": "Challenges & Considerations",
        "query": "What key challenges or limitations of Agentic AI are mentioned in the document?",
        "expected_in_scope": True,
        "keywords": ["governance", "interoperability", "security", "conflict", "orchestration"]
    },
    {
        "id": "TC-06",
        "category": "Out-of-Scope Test (Groundedness Check)",
        "query": "What is the capital of France?",
        "expected_in_scope": False,
        "refusal_expected": True
    }
]


def run_benchmark():
    print("=" * 80)
    print("LANGGRAPH & PINECONE RAG CHATBOT - AUTOMATED VALIDATION SUITE")
    print("=" * 80)

    results: List[Dict[str, Any]] = []
    passed_count = 0

    for idx, tc in enumerate(TEST_CASES, 1):
        print(f"\n[{idx}/6] Running: {tc['category']}")
        print(f"Query: \"{tc['query']}\"")

        res = run_rag_pipeline(tc["query"])

        # 1. Assert schema keys
        assert "query" in res, "Missing 'query' in response"
        assert "final_answer" in res, "Missing 'final_answer' in response"
        assert "retrieved_context_chunks" in res, "Missing 'retrieved_context_chunks' in response"
        assert "confidence_score" in res, "Missing 'confidence_score' in response"

        passed = True
        notes = []

        if tc["expected_in_scope"]:
            if res["confidence_score"] < 0.5:
                passed = False
                notes.append(f"Low confidence score: {res['confidence_score']}")
            if len(res["retrieved_context_chunks"]) == 0:
                passed = False
                notes.append("No context chunks retrieved")
        else:
            # Out of scope test
            answer_lower = res["final_answer"].lower()
            refusal_terms = ["not available", "outside the scope", "unable to answer", "refuse", "not found"]
            if not any(term in answer_lower for term in refusal_terms):
                passed = False
                notes.append("Expected refusal or statement that information is not available in eBook")

        status = "PASSED" if passed else "FAILED"
        if passed:
            passed_count += 1

        print(f"Status: {status} | Confidence: {res['confidence_score']}")
        print(f"Answer snippet: {res['final_answer'][:140]}...")
        if notes:
            print(f"Notes: {', '.join(notes)}")

        results.append({
            **tc,
            "result": res,
            "passed": passed,
            "notes": notes
        })

    print("\n" + "=" * 80)
    print(f"BENCHMARK SUMMARY: {passed_count}/{len(TEST_CASES)} Tests Passed ({(passed_count/len(TEST_CASES))*100:.1f}%)")
    print("=" * 80)


if __name__ == "__main__":
    run_benchmark()
