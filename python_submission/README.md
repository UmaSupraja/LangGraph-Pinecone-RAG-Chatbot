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
```

The workflow uses conditional decisions so that unsupported questions can be refused instead of being answered with unrelated information.

---

## Main Python Components

| File | Purpose |
|---|---|
| `ingest.py` | Processes the source PDF, creates chunks, generates embeddings, and indexes content in Pinecone. |
| `rag_graph.py` | Defines the LangGraph RAG workflow, including retrieval, document grading, generation, refusal, and groundedness validation. |
| `app.py` | Provides the FastAPI service for interacting with the RAG workflow. |
| `test_benchmark.py` | Runs the assessment validation queries and checks the expected RAG/refusal behavior. |

---

## Knowledge Base

The RAG system is grounded in:

**Agentic AI for Executives**

The configured Pinecone index is:

```text
agentic-ai-rag
```

The embedding configuration used by the implementation is:

```text
gemini-embedding-2-preview
```

Vector dimension:

```text
3072
```

---

## Technologies

| Technology | Purpose |
|---|---|
| Python | RAG application implementation |
| LangGraph | Workflow orchestration and conditional execution |
| LangChain | LLM/RAG integration |
| Google Gemini | Embeddings and response generation |
| Pinecone | Vector storage and similarity retrieval |
| FastAPI | REST API service |
| Uvicorn | ASGI server |
| PyPDF | PDF processing |
| Recursive Text Splitting | Document chunking |
| dotenv | Environment variable management |

---

## API

The Python implementation exposes a FastAPI service.

### Query Endpoint

```text
POST /query
```

The endpoint accepts a user question and returns the RAG response.

### Health Endpoint

```text
GET /health
```

FastAPI also provides interactive API documentation at:

```text
http://localhost:8000/docs
```

---

## Validation

The Python implementation includes benchmark queries covering:

1. Agentic AI definition and scope
2. Agentic system architecture
3. Real-world Agentic AI use cases
4. Agentic AI versus traditional generative AI
5. Challenges and limitations
6. An out-of-scope question

The out-of-scope validation uses:

```text
What is the capital of France?
```

The expected behavior is to refuse the question because it is outside the configured **Agentic AI for Executives** knowledge base.

Run the validation with:

```bash
python test_benchmark.py
```

---

## Setup

### 1. Create a Virtual Environment

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
venv\Scripts\activate
```

Activate it on macOS/Linux:

```bash
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file and provide the required credentials:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PINECONE_API_KEY="YOUR_PINECONE_API_KEY"
PINECONE_INDEX_NAME="agentic-ai-rag"
```

Do not commit `.env` or real API credentials to GitHub.

---

## Run the Ingestion Pipeline

If the Pinecone index needs to be populated:

```bash
python ingest.py
```

The ingestion process prepares the source document for retrieval and stores the generated vectors and metadata in Pinecone.

---

## Run the FastAPI Application

```bash
python app.py
```

Or:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Then open:

```text
http://localhost:8000/docs
```

---

## Relationship to the Main Application

The repository also contains a full-stack **React + TypeScript + Express** implementation of the RAG chatbot.

This `python_submission` directory is maintained separately as the **Python assessment implementation** and provides the Python version of the RAG workflow.

---

## Submission Structure

```text
python_submission/
│
├── ingest.py
├── rag_graph.py
├── app.py
├── test_benchmark.py
├── requirements.txt
├── README.md
└── ...
```

---

## Author

**Supraja Putrevu**

B.Tech – Computer Science & Engineering (Data Science)

AI | Machine Learning | RAG | Software Development
