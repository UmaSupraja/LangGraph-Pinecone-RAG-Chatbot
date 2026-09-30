LangGraph & Pinecone RAG Chatbot

View the Live LangGraph & Pinecone RAG Chatbot!

An intelligent Retrieval-Augmented Generation (RAG) chatbot built using Google Gemini, Pinecone, LangGraph, React, TypeScript, and Express.

The application is grounded in the "Agentic AI for Executives" eBook and retrieves relevant knowledge from the configured vector database before generating grounded responses.

Features

Retrieval-Augmented Generation (RAG)

Google Gemini-powered response generation

Gemini text embeddings

Pinecone vector database

LangGraph workflow orchestration

Semantic document retrieval

Document relevance grading

Question scope validation

Grounded response generation

Groundedness validation

Source page references

Out-of-scope question handling

React + TypeScript user interface

Express backend API

Production deployment on Render

Python LangGraph + FastAPI reference implementation

System Architecture

The application consists of a React frontend, Express backend, LangGraph RAG workflow, Google Gemini, and Pinecone.

                    User
                     │
                     ▼
          React + TypeScript UI
                     │
                     ▼
             Express Backend
                     │
                     ▼
          LangGraph RAG Workflow
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
   Query Processing        Pinecone Search
                                │
                                ▼
                       Relevant Documents
                                │
                                ▼
                       Relevance Grading
                                │
                                ▼
                         Scope Validation
                                │
                                ▼
                       Gemini Generation
                                │
                                ▼
                      Groundedness Check
                                │
                                ▼
                         Final Response
                                │
                                ▼
                       Answer + Sources

Project Structure

LangGraph-Pinecone-RAG-Chatbot/

│
├── src/
│   ├── components/
│   │   └── ChatWorkbench.tsx
│   │
│   └── data/
│       └── ebook_pages.ts
│
├── server/
│   ├── rag_workflow.ts
│   └── pinecone_service.ts
│
├── python_submission/
│   └── Python LangGraph + FastAPI implementation
│
├── server.ts
├── package.json
├── vite.config.ts
├── .env.example
├── .gitignore
└── README.md

Technologies Used

Technology

Purpose

React

Frontend User Interface

TypeScript

Application Development

Vite

Frontend Development and Build Tool

Express

Backend API Server

LangGraph

RAG Workflow Orchestration

Google Gemini

Embeddings and Response Generation

Pinecone

Vector Database and Similarity Search

Python

Reference RAG Implementation

FastAPI

Python API

dotenv

Environment Variable Management

Knowledge Base

The chatbot is grounded in the eBook:

Agentic AI for Executives

The project stores page-level eBook content and uses vector retrieval to identify the most relevant information for a user's question.

The configured Pinecone index is:

agentic-ai-rag

The embedding model used by the current TypeScript implementation is:

gemini-embedding-2-preview

with a vector dimension of:

3072

Retrieval-Augmented Generation (RAG)

The chatbot follows a structured RAG workflow.

Step 1 — User Question

The user submits a question through the React interface.

Step 2 — Query Processing

The question is processed by the backend RAG workflow.

Step 3 — Vector Retrieval

The query is embedded and relevant content is retrieved from Pinecone using vector similarity search.

Step 4 — Document Grading

Retrieved documents are evaluated for relevance to the user's question.

Step 5 — Scope Validation

The workflow checks whether the question can be answered using the configured knowledge base.

Step 6 — Response Generation

Relevant context is provided to Google Gemini, which generates a response grounded in the retrieved content.

Step 7 — Groundedness Validation

The generated response is checked against the retrieved context.

Step 8 — Final Response

The validated response is returned to the frontend together with source page references.

User Workflow

Enter Question
       │
       ▼
Query Processing
       │
       ▼
Generate Embedding
       │
       ▼
Pinecone Similarity Search
       │
       ▼
Retrieve Relevant Documents
       │
       ▼
Grade Document Relevance
       │
       ▼
Check Question Scope
       │
       ▼
Generate Grounded Response
       │
       ▼
Validate Groundedness
       │
       ▼
Display Answer + Sources

Grounding and Scope Control

The chatbot is designed to answer questions supported by its configured knowledge base.

The workflow includes relevance and scope checks before response generation.

For example, a question unrelated to the configured eBook can be rejected rather than answered using unsupported information.

Question:
What is the capital of France?

Result:
The question is outside the scope of the available knowledge base.

This helps reduce unsupported responses and keeps the chatbot focused on its intended domain.

Response Sources

The chatbot returns relevant source page references along with the generated answer.

This allows users to identify which parts of the eBook were used as supporting context for the response.

Application

The frontend provides a chat-based interface where users can:

Enter questions

Receive AI-generated responses

View retrieved source references

Ask follow-up questions

Interact with the RAG-powered assistant

Installation

Clone Repository

git clone https://github.com/UmaSupraja/LangGraph-Pinecone-RAG-Chatbot.git

cd LangGraph-Pinecone-RAG-Chatbot

Install Dependencies

npm install

Configure Environment Variables

Create a .env file in the project root.

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
PINECONE_API_KEY=YOUR_PINECONE_API_KEY
PINECONE_INDEX_NAME=agentic-ai-rag
PINECONE_HOST=YOUR_PINECONE_HOST
APP_URL=http://localhost:3000

Do not commit the .env file to GitHub.

Run Development Server

npm run dev

The Vite development server will provide the local application URL.

Production Build

Build the frontend and backend with:

npm run build

The production build bundles the Express server and frontend assets for deployment.

Run Production Server

npm start

The Express server serves the production frontend and API.

API

Chat Endpoint

POST /api/chat

Example request:

{
  "message": "What is Agentic AI?"
}

The backend processes the question through the RAG workflow and returns the generated response with relevant source information.

Python Reference Implementation

The project also contains a Python-based RAG implementation using:

LangGraph

LangChain

Google Gemini

Pinecone

FastAPI

Uvicorn

The Python implementation provides a reference workflow for the same RAG concept, while the deployed application uses the TypeScript + Express implementation.

Deployment

The current full-stack application is deployed on Render.

View the Live LangGraph & Pinecone RAG Chatbot!

GitHub Repository

https://github.com/UmaSupraja/LangGraph-Pinecone-RAG-Chatbot

Security

API credentials are loaded through environment variables rather than being stored in application source code.

The repository uses:

.env
.env.example
.gitignore

The .env file should remain local and should never be committed to the repository.

For any credential that has previously been exposed, revoke or rotate it before using the project in a new environment.

Project Status

The application is currently deployed and available through the Render production URL.

The deployed system includes:

React + TypeScript frontend

Express backend

LangGraph RAG workflow

Google Gemini

Pinecone retrieval

Source references

Scope control

Grounded response validation

Future Enhancements

Conversation memory

Streaming responses

Persistent chat history

Authentication

Additional knowledge sources

Improved retrieval evaluation

Advanced RAG evaluation metrics

Expanded document ingestion

Additional deployment options

Author

Supraja Putrevu

B.Tech – Computer Science & Engineering (Data Science)

AI | Machine Learning | RAG | Software Development

GitHub: https://github.com/UmaSupraja
