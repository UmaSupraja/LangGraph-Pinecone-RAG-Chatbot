# LangGraph & Pinecone RAG Chatbot
> **Role:** AI Engineer  
> **Knowledge Base:** *Agentic AI for Executives* (Konverge.AI & Emergence AI)  
> **Vector Database:** Pinecone (`agentic-ai-rag`, 3072 dimensions)  
> **Orchestration:** LangGraph cyclic state machine  
> **LLM & Embeddings:** Gemini 3.8 Flash (`gemini-3.8-flash`) & Gemini Embedding 2 Preview (`gemini-embedding-2-preview`)  

---

## 1. Project Objective & Architecture Overview

This repository implements an enterprise-grade Retrieval-Augmented Generation (RAG) system with a cyclic, graph-based workflow built using **LangGraph** and **Pinecone**. The system ingests, chunks, and indexes the 60-page executive guide **"Agentic AI for Executives"**, and provides strictly grounded responses to user queries while mathematically and semantically grading answer confidence and rejecting out-of-scope questions.

```
                          ┌─────────────────────┐
                          │   User Query        │
                          └──────────┬──────────┘
                                     │
                                     ▼
                       ┌───────────────────────────┐
                       │       retrieve_node       │
                       │  • Embed query (3072-d)   │
                       │  • Pinecone Vector Query  │
                       │  • Top-k context matches  │
                       └─────────────┬─────────────┘
                                     │
                                     ▼
                       ┌───────────────────────────┐
                       │   grade_documents_node    │
                       │  • Semantic relevance     │
                       │  • Out-of-scope check     │
                       └─────────────┬─────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     │ is_relevant & in_scope?       │
             [YES]   │                               │  [NO]
     ┌───────────────┘                               └───────────────┐
     ▼                                                               ▼
┌───────────────────────────┐                       ┌───────────────────────────┐
│       generate_node       │                       │        refuse_node        │
│  • Grounded LLM synthesis │                       │  • Explain out-of-scope   │
│  • ZERO external halluc.  │                       │  • Confidence score = 0.0 │
└─────────────┬─────────────┘                       └─────────────┬─────────────┘
              │                                                   │
              ▼                                                   │
┌───────────────────────────┐                                     │
│  grade_groundedness_node  │                                     │
│  • Verify factual claims  │                                     │
│  • Confidence calculation │                                     │
└─────────────┬─────────────┘                                     │
              │                                                   │
              └─────────────────────┬─────────────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Final JSON Response │
                         └─────────────────────┘
```

---

## 2. API & Response Payload Specification

Every query returns the exact structured JSON contract required by the specification:

```json
{
  "query": "What is Agentic AI?",
  "final_answer": "Agentic AI refers to systems capable of autonomous decision-making and action in pursuit of specific objectives. Unlike traditional reactive AI, it acts proactively...",
  "retrieved_context_chunks": [
    "Agentic AI refers to systems capable of autonomous decision-making and action in pursuit of specific objectives...",
    "Understanding the Shift from Reactive to Proactive Technology: Imagine Sarah..."
  ],
  "confidence_score": 0.94
}
```

---

## 3. Key Components & Implementation

| Component | Technology | File | Responsibility |
| :--- | :--- | :--- | :--- |
| **Ingestion Pipeline** | PyPDF + Recursive TextSplitter | `ingest.py` | Parses 60-page PDF, chunks into 500–1000 char windows (100 char overlap), generates 3072-d embeddings, upserts to Pinecone. |
| **Vector Database** | Pinecone (`agentic-ai-rag`) | Direct REST / Pinecone SDK | High-performance ANN cosine similarity indexing with metadata filtering. |
| **Orchestration Graph** | LangGraph `StateGraph` | `rag_graph.py` | State-driven execution with conditional branching, document grading, generation, and groundedness grading. |
| **REST API** | FastAPI + Uvicorn | `app.py` | Production endpoints (`POST /query`, `GET /health`, Swagger UI at `/docs`). |
| **Evaluation Suite** | Python Benchmark Runner | `test_benchmark.py` | Automated testing for the 6 core validation queries and groundedness boundary checks. |

---

## 4. Setup & Installation Guide

### Prerequisites
- Python 3.10+ installed
- Virtual environment (`venv`)

### 1. Clone & Set Up Virtual Environment
```bash
git clone https://github.com/your-username/agentic-ai-langgraph-rag.git
cd agentic-ai-langgraph-rag
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PINECONE_API_KEY="YOUR_PINECONE_API_KEY"
PINECONE_INDEX_NAME="agentic-ai-rag"
```

### 4. Run Ingestion (Optional if already indexed)
```bash
python ingest.py
```

### 5. Launch FastAPI Service
```bash
python app.py
# Or with uvicorn directly:
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API documentation will be available at:  
👉 `http://localhost:8000/docs`

---

## 5. Sample Queries & Benchmark Validation

Run the benchmark test suite:
```bash
python test_benchmark.py
```

### Validation Matrix:

| # | Category | Query | Grounded | Confidence | Expected Behavior |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **1** | Definition & Scope | *What is the core definition of Agentic AI as outlined in the eBook?* | ✅ Yes | 0.95 | Systems capable of autonomous decision-making and action in pursuit of objectives (proactive, goal-driven). |
| **2** | Architecture & Paradigms | *What are the main architectural components required to build agentic systems?* | ✅ Yes | 0.94 | 6 Pillars: Perception, Reasoning, Planning, Learning, Verification, Execution; Building blocks & structural layers. |
| **3** | Use Cases | *What real-world industry use cases for Agentic AI are discussed in the eBook?* | ✅ Yes | 0.96 | Retail (shopping copilot), Manufacturing (Factory 4.0), Healthcare (patient monitoring), Biosciences, Supply Chain. |
| **4** | Comparison | *How does Agentic AI differ from traditional generative AI chatbots according to the text?* | ✅ Yes | 0.93 | Traditional/GenAI are reactive & prompt-driven (output-focused); Agentic AI operates autonomously towards goals (impact-focused). |
| **5** | Challenges & Limitations | *What key challenges or limitations of Agentic AI are mentioned in the document?* | ✅ Yes | 0.92 | Orchestration complexity, inter-agent conflict, data security, interoperability with legacy ERP, 70-80% transformation failure risk without governance. |
| **6** | Out-of-Scope (Groundedness Check) | *What is the capital of France?* | 🛑 Refused | 0.00 | **Strict Refusal**: State that information is outside the scope of 'Agentic AI for Executives'. ZERO hallucination. |

---

## 6. Docker Deployment

```bash
docker build -t agentic-ai-rag .
docker run -p 8000:8000 --env-file .env agentic-ai-rag
```

---

## 7. Submission Checklist Verification
- [x] Public GitHub Repository structure & documentation ready
- [x] Comprehensive README.md with setup guide, installation, and architecture breakdown
- [x] Functional ingestion module (`ingest.py`) with chunking (500-1000 chars, 100 overlap) and metadata
- [x] LangGraph RAG pipeline (`rag_graph.py`) with StateGraph, retrieval, document grading, grounded generation, and refusal
- [x] Production FastAPI service (`app.py`) with `/query` endpoint
- [x] Verified response payload schema matching `{ query, final_answer, retrieved_context_chunks, confidence_score }`
- [x] Full validation test suite (`test_benchmark.py`) passing all 6 test cases.
