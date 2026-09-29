import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { executeRAGWorkflow } from './server/rag_workflow.ts';
import { getPineconeStats } from './server/pinecone_service.ts';
import { getAllChunks } from './src/data/chunker.ts';
import { EBOOK_PAGES } from './src/data/ebook_pages.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json());

// API Endpoints
app.get('/api/health', async (_req, res) => {
  try {
    const pcStats = await getPineconeStats();
    res.json({
      status: 'healthy',
      service: 'LangGraph & Pinecone RAG API',
      knowledge_base: 'Agentic AI for Executives (Konverge.AI & Emergence AI)',
      pages_count: EBOOK_PAGES.length,
      chunks_count: getAllChunks().length,
      pinecone: {
        index_name: process.env.PINECONE_INDEX_NAME || 'agentic-ai-rag',
        ready: true,
        stats: pcStats,
      },
    });
  } catch (err: any) {
    res.json({
      status: 'degraded',
      service: 'LangGraph & Pinecone RAG API',
      knowledge_base: 'Agentic AI for Executives (Konverge.AI & Emergence AI)',
      pages_count: EBOOK_PAGES.length,
      chunks_count: getAllChunks().length,
      pinecone: {
        index_name: process.env.PINECONE_INDEX_NAME || 'agentic-ai-rag',
        ready: false,
        error: err.message,
      },
    });
  }
});

// Chat & Query execution endpoint returning the exact required payload
app.post('/api/chat', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  try {
    const result = await executeRAGWorkflow(query.trim());
    return res.json(result);
  } catch (err: any) {
    console.error('[API /api/chat Error]:', err);
    return res.status(500).json({
      error: 'Failed to process RAG query',
      details: err?.message || String(err),
    });
  }
});

// Chunks list for Knowledge Base Explorer
app.get('/api/chunks', (_req, res) => {
  const chunks = getAllChunks();
  res.json({
    total: chunks.length,
    pages_count: EBOOK_PAGES.length,
    chunks,
    pages: EBOOK_PAGES.map((p) => ({
      page: p.page,
      title: p.title || `Page ${p.page}`,
      chapter: p.chapter || 'Overview',
      char_count: p.text.length,
    })),
  });
});

// Pre-packaged Validation Tests for Benchmark Runner
const BENCHMARK_CASES = [
  {
    id: 'TC-01',
    category: 'Definition & Scope',
    query: 'What is the core definition of Agentic AI as outlined in the eBook?',
    expected_in_scope: true,
  },
  {
    id: 'TC-02',
    category: 'Architecture & Paradigms',
    query: 'What are the main architectural components required to build agentic systems?',
    expected_in_scope: true,
  },
  {
    id: 'TC-03',
    category: 'Use Cases',
    query: 'What real-world industry use cases for Agentic AI are discussed in the eBook?',
    expected_in_scope: true,
  },
  {
    id: 'TC-04',
    category: 'Comparison',
    query: 'How does Agentic AI differ from traditional generative AI chatbots according to the text?',
    expected_in_scope: true,
  },
  {
    id: 'TC-05',
    category: 'Challenges & Considerations',
    query: 'What key challenges or limitations of Agentic AI are mentioned in the document?',
    expected_in_scope: true,
  },
  {
    id: 'TC-06',
    category: 'Out-of-Scope Test (Groundedness Check)',
    query: 'What is the capital of France?',
    expected_in_scope: false,
  },
];

app.get('/api/benchmark-cases', (_req, res) => {
  res.json(BENCHMARK_CASES);
});

// Repository Files exporter for GitHub submission
app.get('/api/repo-files', (_req, res) => {
  const files: Record<string, string> = {};
  const repoDir = path.join(__dirname, 'python_submission');

  try {
    if (fs.existsSync(repoDir)) {
      const dirFiles = fs.readdirSync(repoDir);
      for (const file of dirFiles) {
        const fullPath = path.join(repoDir, file);
        if (fs.statSync(fullPath).isFile()) {
          files[file] = fs.readFileSync(fullPath, 'utf-8');
        }
      }
    }
  } catch (err: any) {
    console.error('Error reading repo files:', err);
  }

  res.json({ files });
});

async function startServer() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] LangGraph & Pinecone RAG running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
