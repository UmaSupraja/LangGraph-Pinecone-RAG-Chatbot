LangGraph & Pinecone RAG Chatbot

An end-to-end Retrieval-Augmented Generation (RAG) chatbot grounded in the Agentic AI for Executives knowledge base by Konverge.AI & Emergence AI.

The project combines Google Gemini, Pinecone, LangGraph concepts, TypeScript/Express, React/Vite, and a separate Python LangGraph + FastAPI reference implementation.


Production: https://langgraph-pinecone-rag-chatbot.onrender.com/

The production application is deployed on Render and uses the TypeScript/Express implementation.

📌 Project Overview

This project implements a grounded RAG system designed around a fixed knowledge base:

Agentic AI for Executives

The system:

Retrieves relevant knowledge-base content before answering.

Uses Gemini embeddings with Pinecone vector search.

Generates answers with Google Gemini.

Keeps answers grounded in retrieved context.

Detects out-of-scope questions and refuses unsupported requests.

Evaluates answer groundedness.

Produces a confidence score.

Provides a React/Vite interactive web interface.

Includes a Python LangGraph + FastAPI reference implementation.

Includes an ingestion pipeline for converting the source PDF into Pinecone vectors.

Includes benchmark/validation scenarios for core RAG behavior.

Important implementation note

The repository contains two related application layers:

Python LangGraph + FastAPI — reference implementation for the LangGraph RAG pipeline.

React/Vite + TypeScript/Express — the production web application and UI. Its server-side RAG workflow is implemented in TypeScript rather than running the Python LangGraph graph directly.

They share the same RAG concepts, Gemini services, Pinecone index, and knowledge-base approach, but they are not the same runtime implementation.

🏗️ Architecture

Production Web Application

                    User
                      |
                      v
             React / Vite UI
                      |
                      v
               Express Server
                      |
                      v
           TypeScript RAG Workflow
                      |
          +-----------+-----------+
          |                       |
          v                       v
   Gemini Embeddings          Pinecone
          |                       |
          +-----------+-----------+
                      |
                      v
             Hybrid Retrieval
        (lexical + vector scoring)
                      |
                      v
             Relevance / Scope
                  Check
                      |
          +-----------+-----------+
          |                       |
       Relevant              Out of scope
          |                       |
          v                       v
   Gemini Generation          Refusal
          |
          v
    Groundedness Check
          |
          v
   Final Answer + Metadata

Python LangGraph Reference Workflow

User Query
    |
    v
Retrieve
(Gemini Embedding + Pinecone)
    |
    v
Grade Documents
(Relevance / Scope)
    |
    +----------------------+
    |                      |
 Relevant              Not Relevant
    |                      |
    v                      v
Generate                 Refuse
    |
    v
Grade Groundedness
(Hallucination Check)
    |
    v
Confidence Score
    |
    v
JSON Response

🔄 Core RAG Workflow

1. Retrieve

The user query is converted into an embedding using:

gemini-embedding-2-preview

The embedding is searched against Pinecone to retrieve relevant chunks containing metadata such as:

Chunk ID

Page number

Source

Chunk text

Similarity score

2. Grade Documents

The retrieved context is evaluated for:

Relevance to the question.

Whether the query belongs to the Agentic AI knowledge domain.

Whether the retrieved material is sufficient to continue.

3. Generate

For supported queries, Gemini generates an answer using the retrieved context.

The generation workflow is designed to:

Answer from retrieved knowledge.

Avoid unsupported external information.

Avoid extrapolating beyond supplied context.

State when the available context is insufficient.

4. Grade Groundedness

The generated answer is evaluated against the retrieved context.

The system checks:

Whether the answer is grounded.

Whether unsupported claims were introduced.

A groundedness/relevance-based confidence score.

5. Refuse

If the question is outside the supported knowledge base or the retrieved context is insufficient, the system returns a refusal instead of inventing an answer.

Example:

What is the capital of France?

This is outside the Agentic AI knowledge base and should be rejected.

📚 Knowledge Base

The intended source document is:

Agentic AI for Executives

The Python ingestion pipeline expects:

python_submission/Ebook-Agentic-AI.pdf

Ingestion pipeline

PDF
 |
 v
Page Text Extraction
 |
 v
Chunking
 |
 v
Gemini Embeddings
 |
 v
3072-dimensional Vectors
 |
 v
Pinecone Upsert

Chunking

The ingestion implementation uses approximately:

Chunk size: 750 characters
Overlap:    100 characters

The implementation attempts to preserve natural sentence/newline boundaries.

Pinecone metadata

Each vector contains metadata similar to:

{
  "chunk_id": "page-1-chunk-0",
  "page": 1,
  "source": "Ebook-Agentic-AI.pdf",
  "text": "..."
}

The original PDF binary is not included in the repository package. A fresh ingestion therefore requires an authorized copy of the source PDF.

🧠 Embeddings & Vector Database

Embedding Model

gemini-embedding-2-preview

Expected vector dimension:

3072

Pinecone

Default index:

agentic-ai-rag

The Pinecone index dimension must match the embedding model configuration.

🤖 LLM / Generation

The Python implementation uses:

gemini-3.8-flash

for:

Document relevance grading

Grounded answer generation

Groundedness/hallucination evaluation

The TypeScript production implementation also uses a resilient generation-model fallback sequence.

🌐 API Response Contract

The Python API returns a structured response similar to:

{
  "query": "What is Agentic AI?",
  "final_answer": "...",
  "retrieved_context_chunks": [
    "...",
    "..."
  ],
  "confidence_score": 0.94
}

Response fields

Field

Type

Description

query

string

Original user question

final_answer

string

Grounded answer generated by the system

retrieved_context_chunks

array

Text chunks retrieved from Pinecone

confidence_score

number

Final confidence value between 0 and 1

🐍 Python FastAPI API

The Python API is located at:

python_submission/app.py

GET /

Returns basic service information.

GET /health

Checks whether the API can access the configured Pinecone index.

Example:

http://localhost:8000/health

POST /query

Accepts:

{
  "query": "What is the core definition of Agentic AI?"
}

Returns the structured RAG response.

Swagger UI

FastAPI automatically provides:

http://localhost:8000/docs

📁 Project Structure

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

🛠️ Technologies Used

AI / Backend

Python

LangGraph

LangChain

Google GenAI SDK

Google Gemini

Pinecone

FastAPI

Uvicorn

Pydantic

pypdf

python-dotenv

Frontend / Web

React

TypeScript

Vite

Express

Tailwind CSS

Motion

Lucide React

Google GenAI SDK

Architecture Concepts

Retrieval-Augmented Generation (RAG)

Vector similarity search

Hybrid retrieval

State-based orchestration

Context grounding

Out-of-scope detection

Hallucination evaluation

Confidence scoring

REST API design

AI system validation

⚙️ Local Setup — Python LangGraph API

Prerequisites

Recommended:

Python 3.12
Node.js 22 LTS
npm
Pinecone account
Google AI / Gemini API access

Python 3.14 may work for individual packages, but Python 3.12 is recommended for a predictable LangChain/LangGraph environment.

1. Create a virtual environment

Windows PowerShell:

python -m venv venv
.\venv\Scripts\Activate.ps1

2. Upgrade pip

python -m pip install --upgrade pip

3. Install Python dependencies

pip install -r python_submission\requirements.txt

4. Configure environment variables

Create a .env file using .env.example as a template:

GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PINECONE_API_KEY="YOUR_PINECONE_API_KEY"
PINECONE_INDEX_NAME="agentic-ai-rag"

Never commit real API keys to GitHub.

5. Run the Python API

cd python_submission
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

Open:

http://localhost:8000/docs

📥 Data Ingestion

The ingestion script is:

python_submission/ingest.py

Place the authorized source PDF at:

python_submission/Ebook-Agentic-AI.pdf

Run:

cd python_submission
python ingest.py

The script performs:

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

A fresh user must provide the authorized source PDF before running ingestion unless the target Pinecone index has already been populated.

💻 Run the React Web Application

From the project root:

npm install
npm run dev

The application is served by:

server.ts

Expected local URL:

http://localhost:3000

Frontend environment

The TypeScript server uses the root .env.

Example:

GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PINECONE_API_KEY="YOUR_PINECONE_API_KEY"
PINECONE_INDEX_NAME="agentic-ai-rag"
PINECONE_HOST="YOUR_PINECONE_INDEX_HOST"
PORT=3000

✨ Frontend Features

Chat Workbench

Interactive question-and-answer interface for the RAG system.

Graph Visualizer

Visualizes the RAG execution flow and node states.

Knowledge Base Explorer

Provides visibility into the indexed knowledge base.

Pinecone Manager

Provides Pinecone/index-related visibility.

Validation Suite

Provides UI-oriented validation for expected RAG scenarios.

Simple Chatbot

Provides a simplified conversational interface.

🧪 Benchmark / Validation

The Python benchmark is:

python_submission/test_benchmark.py

Run:

cd python_submission
python test_benchmark.py

Validation categories include:

Definition and scope of Agentic AI.

Agentic system architecture and paradigms.

Real-world Agentic AI use cases.

Agentic AI versus traditional/Generative AI chatbots.

Challenges, limitations, and governance.

Out-of-scope query rejection.

Example in-scope query

What are the six pillars of Agentic AI?

Example out-of-scope query

What is the capital of France?

The second query should be rejected because it is not supported by the target knowledge base.

🧩 Example Questions

In-scope

What is Agentic AI?

What are the six pillars of Agentic AI?

How does Agentic AI differ from traditional generative AI chatbots?

What are the major challenges of implementing Agentic AI?

What industries are discussed as Agentic AI use cases?

Out-of-scope

What is the capital of France?

What is today's weather?

Give me a cake recipe.

The system is designed to avoid answering unrelated questions from general model knowledge.

🛡️ Grounding & Hallucination Control

The project uses multiple controls rather than relying only on an LLM prompt.

Retrieval grounding

Answers are generated from retrieved knowledge-base chunks.

Relevance grading

The system checks whether retrieved material is relevant to the user's query.

Scope filtering

Unrelated questions can be routed to a refusal path.

Groundedness grading

The generated answer is evaluated against retrieved context.

Confidence score

The final score combines the groundedness evaluation with context relevance.

Retrieve
   ↓
Relevant?
   ├── No → Refuse
   └── Yes
        ↓
     Generate
        ↓
 Groundedness Check
        ↓
 Final Response

🔐 Security & Secrets

Never commit API keys or other credentials.

Do not commit:

.env

or any file containing real credentials.

Use:

.env.example

with placeholders only:

GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PINECONE_API_KEY="YOUR_PINECONE_API_KEY"
PINECONE_INDEX_NAME="agentic-ai-rag"

If a real API key has previously been exposed in source control, logs, screenshots, or a public repository, revoke/rotate it and replace it with a new credential.

🚀 Production Deployment

The current production web application is deployed on Render.

Production URL

https://langgraph-pinecone-rag-chatbot.onrender.com/

Production architecture

Internet
   |
   v
React / Vite Web Client
   |
   v
Express Server
   |
   v
TypeScript RAG Workflow
   |
   +------------------+
   |                  |
   v                  v
Gemini             Pinecone
   |                  |
   +--------+---------+
            |
            v
     Grounded RAG Response

The production service builds the Vite frontend and bundles the TypeScript server before starting the application.

Production build

npm run build

Production start

npm start

The application runs the bundled server from:

dist/server.js

🔧 Common Setup Issues

ModuleNotFoundError

Make sure the virtual environment is active:

.\venv\Scripts\Activate.ps1

Then install:

pip install -r python_submission\requirements.txt

npm dependency conflict

If npm reports a Vite/esbuild peer-dependency conflict, use the dependency versions defined by the project and reinstall:

npm install

Pinecone connection failure

Check:

PINECONE_API_KEY
PINECONE_INDEX_NAME
PINECONE_HOST

Also verify that:

The Pinecone index exists.

The index dimension matches the embedding configuration.

The index contains vectors generated from the intended knowledge base.

Empty retrieval results

The Pinecone index must already contain embeddings generated from the same knowledge base and compatible embedding model.

Ingestion cannot find the PDF

Place the authorized source document at:

python_submission/Ebook-Agentic-AI.pdf

Then run:

python ingest.py

📊 What This Project Demonstrates

This project demonstrates practical implementation of:

RAG architecture

Document ingestion

Semantic embeddings

Vector databases

Pinecone retrieval

LangGraph state-based orchestration

LLM-based generation

Document relevance grading

Groundedness verification

Hallucination reduction

Confidence scoring

Out-of-scope query handling

FastAPI API development

React/TypeScript application development

AI system validation and benchmarking

Production deployment

⚡ Quick Start

React / Production Web Application

npm install
npm run dev

Open:

http://localhost:3000

Python API

python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r python_submission\requirements.txt
cd python_submission
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

Open:

http://localhost:8000/docs

📌 Project Status

The repository currently contains:

Production React/Vite frontend

TypeScript/Express server

TypeScript RAG workflow

Python LangGraph reference workflow

Pinecone service integration

Gemini integration

PDF ingestion pipeline

FastAPI API

Validation/benchmark code

Production Render deployment

For a clean fresh installation, provide:

Your own Gemini API key.

Your own Pinecone API key.

A correctly configured Pinecone index.

The authorized source PDF if fresh ingestion is required.

The repository should be treated as application source code to configure and run, not as a distribution of third-party API credentials.

👩‍💻 Author

Supraja Putrevu

B.Tech – Computer Science & Engineering (Data Science)

Python Developer | AI Enthusiast | Data Science | Machine Learning

GitHub: https://github.com/UmaSupraja

Project: LangGraph & Pinecone RAG Chatbot

Primary Focus

Retrieval-Augmented Generation, agentic workflow orchestration, vector search, grounded generation, evaluation, and AI application development.

📄 License / Source Material

This repository contains application code and project configuration. The source eBook is not redistributed as part of the repository.

Users should provide and use the source document only when they have the appropriate authorization to do so.
