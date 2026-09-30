# LangGraph & Pinecone RAG Chatbot

> An end-to-end Retrieval-Augmented Generation (RAG) application for
> answering questions from the **Agentic AI for Executives** knowledge
> base using **Google Gemini**, **Pinecone**, **LangGraph**,
> **FastAPI**, and a **React/Vite** interface.

------------------------------------------------------------------------

## 1. Project Overview

This project implements a grounded RAG chatbot designed around a fixed
knowledge base: **Agentic AI for Executives** by Konverge.AI & Emergence
AI.

The system is designed to:

-   retrieve relevant knowledge-base content before answering;
-   use vector similarity search through Pinecone;
-   generate answers with Google Gemini;
-   keep generated answers grounded in retrieved context;
-   detect out-of-scope questions and refuse unsupported requests;
-   calculate a confidence score;
-   expose the Python RAG pipeline through a FastAPI REST API;
-   provide a React/Vite web interface for interactive use;
-   provide an ingestion pipeline for converting the source PDF into
    Pinecone vectors;
-   provide a benchmark suite for validating the core RAG scenarios.

### Important implementation note

The repository contains **two related application layers**:

1.  **Python LangGraph + FastAPI implementation** --- the reference
    implementation for the LangGraph RAG pipeline.
2.  **React/Vite + TypeScript server implementation** --- the
    interactive web application and UI. Its server-side RAG workflow is
    implemented in TypeScript rather than using the Python LangGraph
    graph directly.

They share the same overall RAG concepts and Pinecone/Gemini services,
but they are not the same runtime implementation.

------------------------------------------------------------------------

## 2. High-Level Architecture

### Python LangGraph architecture

``` text
                         User Query
                             |
                             v
                    +-------------------+
                    |   Retrieve Node   |
                    | Gemini Embedding  |
                    |     + Pinecone    |
                    +---------+---------+
                              |
                              v
                    +-------------------+
                    | Grade Documents   |
                    | Relevance / Scope |
                    +---------+---------+
                              |
                   +----------+----------+
                   |                     |
              Relevant              Not relevant
                   |                     |
                   v                     v
          +----------------+      +-------------+
          | Generate Node  |      | Refuse Node |
          | Gemini LLM     |      | Safe reject |
          +-------+--------+      +------+------+
                  |                      |
                  v                      |
          +---------------------+        |
          | Grade Groundedness  |        |
          | Hallucination check |        |
          | Confidence score    |        |
          +----------+----------+        |
                     |                   |
                     +---------+---------+
                               |
                               v
                         JSON Response
```

### Web application architecture

``` text
React / Vite UI
       |
       v
Express server
       |
       v
TypeScript RAG workflow
       |
       +--------------------+
       |                    |
       v                    v
Gemini Embeddings       Pinecone
       |                    |
       +---------+----------+
                 |
                 v
          Hybrid Retrieval
     (lexical + vector score)
                 |
                 v
        Relevance / Scope Check
                 |
                 v
           Gemini Generation
                 |
                 v
       Grounded response + metadata
```

------------------------------------------------------------------------

## 3. Core RAG Workflow

The Python implementation uses a LangGraph `StateGraph` to orchestrate
the pipeline.

### Node 1 --- Retrieve

The user query is converted into a vector using:

``` text
gemini-embedding-2-preview
```

The vector is sent to Pinecone and the top matching chunks are retrieved
with metadata such as:

-   chunk ID;
-   page number;
-   source;
-   chunk text;
-   similarity score.

### Node 2 --- Grade Documents

The retrieved context is evaluated for relevance to the question.

The grader determines whether:

-   the retrieved context can answer the question;
-   the question is related to the Agentic AI knowledge base;
-   the query should continue to generation or be rejected.

### Node 3 --- Generate

For relevant queries, Gemini generates an answer using the retrieved
context.

The generation instructions explicitly require the model to:

-   answer from the retrieved knowledge;
-   avoid unsupported external information;
-   avoid extrapolating beyond the supplied context;
-   state when the context is insufficient.

### Node 4 --- Grade Groundedness

The generated answer is checked against the retrieved context.

The system evaluates:

-   whether the answer is grounded;
-   whether unsupported claims were introduced;
-   a confidence score.

The final confidence value combines the groundedness evaluation with the
earlier relevance score.

### Node 5 --- Refuse

If the query is out of scope or insufficiently supported, the workflow
returns a refusal instead of inventing an answer.

Example:

``` text
What is the capital of France?
```

This is outside the Agentic AI knowledge base and should be rejected
rather than answered from general world knowledge.

------------------------------------------------------------------------

## 4. Knowledge Base

The intended source document is:

**Agentic AI for Executives**

The Python ingestion pipeline expects:

``` text
Ebook-Agentic-AI.pdf
```

The ingestion process:

1.  reads the PDF;
2.  extracts page text using `pypdf`;
3.  splits the text into chunks;
4.  preserves page/source metadata;
5.  generates embeddings;
6.  uploads vectors to Pinecone.

### Chunking

The ingestion implementation uses approximately:

``` text
Chunk size: 750 characters
Overlap:    100 characters
```

The design keeps chunks within the requested 500--1000 character range
where possible and attempts to split at natural sentence/newline
boundaries.

### Metadata stored in Pinecone

Each vector contains metadata similar to:

``` json
{
  "chunk_id": "page-1-chunk-0",
  "page": 1,
  "source": "Ebook-Agentic-AI.pdf",
  "text": "..."
}
```

------------------------------------------------------------------------

## 5. Embeddings and Vector Database

### Embedding model

``` text
gemini-embedding-2-preview
```

The project expects a **3072-dimensional** embedding vector.

### Pinecone

Default index name:

``` text
agentic-ai-rag
```

The Pinecone index must be configured with a vector dimension compatible
with the embedding model used by the project.

Do not create a different dimension unless you also change the
embedding/index configuration consistently.

------------------------------------------------------------------------

## 6. LLM / Generation

The Python implementation uses:

``` text
gemini-3.8-flash
```

for:

-   document relevance grading;
-   grounded answer generation;
-   groundedness/hallucination evaluation.

The TypeScript web implementation also contains a resilient model
fallback sequence for generation.

------------------------------------------------------------------------

## 7. API Response Contract

The main Python API returns:

``` json
{
  "query": "What is Agentic AI?",
  "final_answer": "....",
  "retrieved_context_chunks": [
    "....",
    "...."
  ],
  "confidence_score": 0.94
}
```

### Fields

  ----------------------------------------------------------------------------
  Field                        Type                    Description
  ---------------------------- ----------------------- -----------------------
  `query`                      string                  Original user question

  `final_answer`               string                  Grounded answer
                                                       generated by the system

  `retrieved_context_chunks`   array                   Text chunks retrieved
                                                       from Pinecone

  `confidence_score`           number                  Final confidence value
                                                       between 0 and 1
  ----------------------------------------------------------------------------

------------------------------------------------------------------------

## 8. Python API Endpoints

The FastAPI application is located at:

``` text
python_submission/app.py
```

### `GET /`

Returns basic service information.

### `GET /health`

Checks whether the API can access the configured Pinecone index.

Example:

``` text
http://localhost:8000/health
```

### `POST /query`

Accepts:

``` json
{
  "query": "What is the core definition of Agentic AI?"
}
```

Returns the structured RAG response.

### Swagger UI

FastAPI automatically provides interactive API documentation:

``` text
http://localhost:8000/docs
```

------------------------------------------------------------------------

## 9. Project Structure

``` text
.
├── README.md
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── server.ts
│
├── server/
│   ├── pinecone_service.ts
│   └── rag_workflow.ts
│
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   │
│   ├── components/
│   │   ├── ChatWorkbench.tsx
│   │   ├── GithubSubmission.tsx
│   │   ├── GraphVisualizer.tsx
│   │   ├── Header.tsx
│   │   ├── KnowledgeBaseExplorer.tsx
│   │   ├── PineconeManager.tsx
│   │   ├── SimpleChatbot.tsx
│   │   └── ValidationSuite.tsx
│   │
│   └── data/
│       ├── chunker.ts
│       └── ebook_pages.ts
│
└── python_submission/
    ├── README.md
    ├── .env.example
    ├── requirements.txt
    ├── app.py
    ├── ingest.py
    ├── rag_graph.py
    └── test_benchmark.py
```

------------------------------------------------------------------------

## 10. Technologies Used

### Backend / AI

-   Python
-   LangGraph
-   LangChain
-   Google GenAI SDK
-   Gemini
-   Pinecone
-   FastAPI
-   Uvicorn
-   Pydantic
-   pypdf
-   python-dotenv

### Frontend / Web

-   React
-   TypeScript
-   Vite
-   Express
-   Tailwind CSS
-   Motion
-   Lucide React
-   Google GenAI SDK

### Architecture concepts

-   Retrieval-Augmented Generation (RAG)
-   Vector similarity search
-   Hybrid retrieval
-   State-machine orchestration
-   Context grounding
-   Out-of-scope detection
-   Hallucination evaluation
-   Confidence scoring
-   REST API design

------------------------------------------------------------------------

## 11. Local Setup --- Python LangGraph API

### Prerequisites

Recommended:

``` text
Python 3.12
Node.js 22 LTS
npm
Pinecone account
Google AI / Gemini API access
```

Python 3.14 may work for individual packages, but Python 3.12 is
recommended for a more predictable LangChain/LangGraph environment.

### Create a virtual environment

Windows PowerShell:

``` powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Upgrade pip:

``` powershell
python -m pip install --upgrade pip
```

Install dependencies:

``` powershell
pip install -r python_submission\requirements.txt
```

### Configure environment variables

Create a `.env` file using the example as a template:

``` env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PINECONE_API_KEY="YOUR_PINECONE_API_KEY"
PINECONE_INDEX_NAME="agentic-ai-rag"
```

Never commit real API keys to GitHub.

### Run the API

``` powershell
cd python_submission
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Open:

``` text
http://localhost:8000/docs
```

------------------------------------------------------------------------

## 12. Data Ingestion

The ingestion script is:

``` text
python_submission/ingest.py
```

Place the source PDF where the script expects it:

``` text
python_submission/Ebook-Agentic-AI.pdf
```

Then run:

``` powershell
cd python_submission
python ingest.py
```

The script:

``` text
PDF
 ↓
Text extraction
 ↓
Chunking
 ↓
Gemini embeddings
 ↓
3072-dimensional vectors
 ↓
Pinecone upsert
```

### Important repository note

The supplied project package does not include the original PDF binary.
Therefore, a fresh user must provide the authorized source PDF before
running ingestion, unless the target Pinecone index has already been
populated.

The ingestion script also contains a fallback path for:

``` text
src/data/ebook_pages.json
```

but that JSON corpus is not present in the supplied project package.

------------------------------------------------------------------------

## 13. Run the React Web Application

From the project root:

``` powershell
npm install
npm run dev
```

The development server is started by:

``` text
server.ts
```

The application is expected to be available at:

``` text
http://localhost:3000
```

### Frontend environment

The TypeScript server uses the root `.env`.

Use your own credentials:

``` env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PINECONE_API_KEY="YOUR_PINECONE_API_KEY"
PINECONE_INDEX_NAME="agentic-ai-rag"
PINECONE_HOST="YOUR_PINECONE_INDEX_HOST"
PORT=3000
```

------------------------------------------------------------------------

## 14. Frontend Features

The React application includes UI components for:

### Chat Workbench

Interactive question-and-answer interface for the RAG system.

### Graph Visualizer

Visualizes the RAG execution flow and node states.

### Knowledge Base Explorer

Displays information about the indexed knowledge base.

### Pinecone Manager

Provides Pinecone/index-related visibility in the application.

### Validation Suite

Provides a UI-oriented validation experience for the expected RAG
scenarios.

### Simple Chatbot

Provides a simplified conversational interface.

------------------------------------------------------------------------

## 15. Benchmark / Validation Suite

The Python benchmark is:

``` text
python_submission/test_benchmark.py
```

Run:

``` powershell
cd python_submission
python test_benchmark.py
```

The intended validation categories include:

1.  Definition and scope of Agentic AI.
2.  Agentic system architecture and paradigms.
3.  Real-world Agentic AI use cases.
4.  Agentic AI versus traditional/Generative AI chatbots.
5.  Challenges, limitations, and governance.
6.  Out-of-scope query rejection.

Example in-scope query:

``` text
What are the six pillars of Agentic AI?
```

Example out-of-scope query:

``` text
What is the capital of France?
```

The second query should be rejected because it is not supported by the
target knowledge base.

------------------------------------------------------------------------

## 16. Example API Request

Using PowerShell:

``` powershell
Invoke-RestMethod `
  -Uri "http://localhost:8000/query" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"query":"What is the core definition of Agentic AI?"}'
```

Example response shape:

``` json
{
  "query": "What is the core definition of Agentic AI?",
  "final_answer": "....",
  "retrieved_context_chunks": [
    "...."
  ],
  "confidence_score": 0.94
}
```

------------------------------------------------------------------------

## 17. Example Questions

### In-scope

``` text
What is Agentic AI?
```

``` text
What are the six pillars of Agentic AI?
```

``` text
How does Agentic AI differ from traditional generative AI chatbots?
```

``` text
What are the major challenges of implementing Agentic AI?
```

``` text
What industries are discussed as Agentic AI use cases?
```

### Out-of-scope

``` text
What is the capital of France?
```

``` text
What is today's weather?
```

``` text
Give me a cake recipe.
```

The system is designed to avoid answering unrelated questions from
general model knowledge.

------------------------------------------------------------------------

## 18. Grounding and Hallucination Control

The project uses multiple controls rather than relying only on the LLM
prompt.

### Retrieval grounding

Answers are generated from retrieved knowledge-base chunks.

### Relevance grading

The system checks whether retrieved material is relevant to the user's
query.

### Scope filtering

Unrelated questions can be routed to a refusal path.

### Groundedness grading

The generated answer is evaluated against the retrieved context.

### Confidence score

The final score is derived from the groundedness evaluation and context
relevance.

This creates the following safety-oriented flow:

``` text
Retrieve
   ↓
Relevant?
   ├── No → Refuse
   └── Yes
          ↓
       Generate
          ↓
   Groundedness check
          ↓
    Final response
```

------------------------------------------------------------------------

## 19. Security and Secrets

### Never commit API keys

Do not commit:

``` text
.env
```

or any file containing real credentials.

Use:

``` text
.env.example
```

with placeholders only:

``` env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PINECONE_API_KEY="YOUR_PINECONE_API_KEY"
PINECONE_INDEX_NAME="agentic-ai-rag"
```

If a real API key has previously been exposed in source control, logs,
screenshots, or a public repository, revoke/rotate it and replace it
with a new credential.

------------------------------------------------------------------------

## 20. Common Setup Issues

### `ModuleNotFoundError`

Make sure the virtual environment is active:

``` powershell
.\venv\Scripts\Activate.ps1
```

Then install:

``` powershell
pip install -r python_submission\requirements.txt
```

### `npm ERESOLVE`

The frontend has Vite/esbuild peer-dependency requirements. If npm
reports a Vite/esbuild conflict, install a compatible esbuild release or
use the project's dependency versions consistently before retrying
`npm install`.

### Pinecone connection failure

Check:

``` text
PINECONE_API_KEY
PINECONE_INDEX_NAME
PINECONE_HOST
```

and verify that the index exists and its vector dimension matches the
embedding model.

### Empty retrieval results

The Pinecone index must already contain embeddings generated from the
same knowledge base and compatible embedding model.

### Ingestion cannot find the PDF

Place the authorized source document at:

``` text
python_submission/Ebook-Agentic-AI.pdf
```

and rerun:

``` powershell
python ingest.py
```

------------------------------------------------------------------------

## 21. Production Considerations

Before production deployment, the following should be addressed:

-   store secrets only in the deployment platform's secret manager;
-   remove any hardcoded credentials;
-   restrict CORS instead of using `allow_origins=["*"]`;
-   add authentication/authorization if the API is not public;
-   add request rate limiting;
-   add structured application logging;
-   add retry/backoff handling for model and Pinecone failures;
-   validate Pinecone index configuration at startup;
-   monitor model/API quota usage;
-   add automated tests for retrieval and refusal behavior;
-   pin dependency versions for reproducible deployments.

------------------------------------------------------------------------

## 22. Deployment Concept

A production deployment can be structured as:

``` text
                    Internet
                       |
                       v
                React Web Client
                       |
                       v
                 FastAPI API
                       |
             +---------+---------+
             |                   |
             v                   v
          Gemini             Pinecone
             |                   |
             +---------+---------+
                       |
                       v
                 RAG Response
```

The React application and Python API can be deployed separately, or the
application can be packaged according to the deployment environment.

------------------------------------------------------------------------

## 23. What This Project Demonstrates

This project demonstrates practical implementation of:

-   RAG architecture;
-   document ingestion;
-   semantic embeddings;
-   vector databases;
-   Pinecone retrieval;
-   LangGraph state-based orchestration;
-   LLM-based generation;
-   document relevance grading;
-   groundedness verification;
-   hallucination reduction;
-   confidence scoring;
-   out-of-scope query handling;
-   FastAPI API development;
-   React/TypeScript application development;
-   AI system validation and benchmarking.

------------------------------------------------------------------------

## 24. Quick Start

### Python API

``` powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r python_submission\requirements.txt

cd python_submission
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Open:

``` text
http://localhost:8000/docs
```

### React application

From the project root:

``` powershell
npm install
npm run dev
```

Open:

``` text
http://localhost:3000
```

------------------------------------------------------------------------

## 25. Project Status

The repository contains the implementation, frontend, Python LangGraph
workflow, ingestion pipeline, API layer, and validation code.

For a clean fresh installation, the user must provide:

-   their own Gemini API key;
-   their own Pinecone API key;
-   a correctly configured Pinecone index;
-   the authorized source PDF if a fresh ingestion is required.

The existing source package should be treated as code to configure and
run, not as a distribution of third-party API credentials.

------------------------------------------------------------------------

## 26. Author / Project Role
### Author
**Supraja Putrevu**

B.Tech – Computer Science & Engineering (Data Science)

Python Developer | AI Enthusiast | Data Science | Machine Learning

GitHub: https://github.com/UmaSupraja


**Project:** LangGraph & Pinecone RAG Chatbot

**Primary focus:** Retrieval-Augmented Generation, agentic workflow
orchestration, vector search, grounded generation, evaluation, and AI
application development.
