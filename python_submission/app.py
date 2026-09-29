#!/usr/bin/env python3
"""
app.py - FastAPI Production Service for LangGraph RAG Chatbot
=============================================================
Exposes REST endpoints adhering to the exact required JSON specification:
POST /query -> { query, final_answer, retrieved_context_chunks, confidence_score }
GET /health -> System health and Pinecone connection status
"""

import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from rag_graph import run_rag_pipeline, get_pinecone_index

load_dotenv()

app = FastAPI(
    title="LangGraph & Pinecone RAG API",
    description="Production-grade RAG Chatbot powered by LangGraph, Pinecone, and Gemini for 'Agentic AI for Executives'",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str = Field(..., example="What is the core definition of Agentic AI as outlined in the eBook?")


class QueryResponse(BaseModel):
    query: str
    final_answer: str
    retrieved_context_chunks: List[str]
    confidence_score: float


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "LangGraph & Pinecone RAG API",
        "document": "Agentic AI for Executives (Konverge.AI & Emergence AI)",
        "docs_url": "/docs"
    }


@app.get("/health")
def health():
    try:
        index = get_pinecone_index()
        stats = index.describe_index_stats()
        return {
            "status": "healthy",
            "pinecone_connected": True,
            "index_stats": stats
        }
    except Exception as e:
        return {
            "status": "degraded",
            "pinecone_connected": False,
            "error": str(e)
        }


@app.post("/query", response_model=QueryResponse)
def query_endpoint(req: QueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    try:
        result = run_rag_pipeline(req.query)
        return QueryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
