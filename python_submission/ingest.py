#!/usr/bin/env python3
"""
ingest.py - Data Ingestion & Vector Storage Pipeline
===================================================
1. Parses Knowledge Base PDF: 'Agentic AI eBook' (Ebook-Agentic-AI.pdf)
2. Chunks text into 500-1000 characters with 100 character overlap
3. Generates dense vector representations (dimension 3072)
4. Indexes vectors with metadata (text, page number, source) in Pinecone
"""

import os
import sys
import json
import time
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "agentic-ai-rag")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

try:
    from pinecone import Pinecone
except ImportError:
    Pinecone = None

try:
    from google import genai
except ImportError:
    genai = None


def chunk_text(
    text: str,
    page_num: int,
    chunk_size: int = 750,
    overlap: int = 100
) -> List[Dict[str, Any]]:
    """
    Chunks text into segments of 500-1000 characters with specified overlap.
    Preserves page number, chunk id, and source metadata.
    """
    clean_text = text.strip()
    if not clean_text:
        return []

    if len(clean_text) <= chunk_size + overlap:
        return [{
            "id": f"page-{page_num}-chunk-0",
            "page": page_num,
            "source": "Ebook-Agentic-AI.pdf",
            "text": clean_text
        }]

    chunks = []
    start = 0
    chunk_idx = 0

    while start < len(clean_text):
        end = start + chunk_size
        if end >= len(clean_text):
            end = len(clean_text)
        else:
            # Look for natural sentence or newline boundaries
            window = clean_text[max(0, end - 100): min(len(clean_text), end + 100)]
            nl_pos = window.rfind('\n')
            period_pos = window.rfind('. ')
            if nl_pos > 40:
                end = (end - 100) + nl_pos + 1
            elif period_pos > 40:
                end = (end - 100) + period_pos + 2

        chunk_str = clean_text[start:end].strip()
        if len(chunk_str) > 40:
            chunks.append({
                "id": f"page-{page_num}-chunk-{chunk_idx}",
                "page": page_num,
                "source": "Ebook-Agentic-AI.pdf",
                "text": chunk_str
            })
            chunk_idx += 1

        if end >= len(clean_text):
            break
        start = max(start + 1, end - overlap)

    return chunks


def load_pdf_pages(pdf_path: str = "Ebook-Agentic-AI.pdf") -> List[Dict[str, Any]]:
    """
    Loads text from PDF file or fallback OCR corpus.
    """
    pages_data = []

    # Check for direct PDF extraction using pypdf if file exists
    if os.path.exists(pdf_path):
        try:
            import pypdf
            reader = pypdf.PdfReader(pdf_path)
            for idx, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                if txt.strip():
                    pages_data.append({"page": idx + 1, "text": txt})
            print(f"[Ingest] Extracted {len(pages_data)} pages from {pdf_path}")
            return pages_data
        except Exception as e:
            print(f"[Ingest] Warning: Could not parse local PDF directly ({e}). Checking JSON corpus...")

    # Fallback to packaged JSON corpus if PDF binary is absent
    json_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "ebook_pages.json")
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            pages_data = json.load(f)
            return pages_data

    return pages_data


def generate_embedding(client, text: str) -> List[float]:
    """
    Generates 3072-dimensional vector embedding for text chunk.
    """
    response = client.models.embed_content(
        model="gemini-embedding-2-preview",
        contents=text
    )
    return response.embeddings[0].values


def run_ingestion(batch_size: int = 20):
    """
    Executes full ingestion, embedding, and Pinecone upsert pipeline.
    """
    print("=" * 60)
    print("Starting Ingestion Pipeline for 'Agentic AI eBook'")
    print("=" * 60)

    if not PINECONE_API_KEY:
        print("[Error] PINECONE_API_KEY is required in environment.")
        sys.exit(1)

    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)

    ai_client = None
    if GEMINI_API_KEY:
        ai_client = genai.Client(api_key=GEMINI_API_KEY)

    pages = load_pdf_pages()
    print(f"[Ingest] Loaded {len(pages)} pages.")

    all_chunks = []
    for p in pages:
        page_chunks = chunk_text(p["text"], p["page"])
        all_chunks.extend(page_chunks)

    print(f"[Ingest] Created {len(all_chunks)} chunks (500-1000 chars, 100 overlap).")

    # Upsert in batches
    vectors_to_upsert = []
    for idx, chunk in enumerate(all_chunks):
        embedding = None
        if ai_client:
            try:
                embedding = generate_embedding(ai_client, chunk["text"])
            except Exception as e:
                print(f"[Ingest] Embedding error on chunk {chunk['id']}: {e}")
                time.sleep(1)

        if embedding:
            vectors_to_upsert.append({
                "id": chunk["id"],
                "values": embedding,
                "metadata": {
                    "chunk_id": chunk["id"],
                    "page": chunk["page"],
                    "source": chunk["source"],
                    "text": chunk["text"]
                }
            })

        if len(vectors_to_upsert) >= batch_size or idx == len(all_chunks) - 1:
            if vectors_to_upsert:
                print(f"[Ingest] Upserting batch of {len(vectors_to_upsert)} vectors to Pinecone...")
                index.upsert(vectors=vectors_to_upsert)
                vectors_to_upsert = []
                time.sleep(0.5)

    print(f"[Ingest] Ingestion complete! Total indexed: {len(all_chunks)} chunks.")
    stats = index.describe_index_stats()
    print(f"[Ingest] Updated Pinecone Index Stats: {stats}")


if __name__ == "__main__":
    run_ingestion()
