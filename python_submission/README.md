# Python LangGraph & Pinecone RAG Submission

### Python Assessment Implementation

This directory contains the Python implementation of the RAG solution developed for the assessment. It focuses on building a grounded question-answering workflow using **LangGraph**, **Pinecone**, **Google Gemini**, and **FastAPI**.

The knowledge base is the **"Agentic AI for Executives"** eBook.

---

## Objective

The Python solution is designed to:

- Retrieve relevant information from the configured knowledge base.
- Use Pinecone for semantic vector search.
- Orchestrate retrieval, grading, generation, and refusal using LangGraph.
- Generate answers grounded in the retrieved context.
- Validate the groundedness of generated responses.
- Reject questions that are outside the supported knowledge base.
- Expose the RAG workflow through a FastAPI service.

---

## Python RAG Workflow

The workflow follows this general sequence:

```text
User Question
      │
      ▼
Query Embedding
      │
      ▼
Pinecone Retrieval
      │
      ▼
Document Relevance Grading
      │
      ├───────────────┐
      │ Relevant      │ Not Relevant / Out of Scope
      ▼               ▼
Generate Answer     Refuse Answer
      │
      ▼
Groundedness Grading
      │
      ▼
Final Response
