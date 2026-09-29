/**
 * Service to interact directly with Pinecone Vector Database via REST API
 */

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || 'pcsk_ZkQ5P_Pqes6VQ7oo1i8Hw5zoPKDQgfbqnx6tr13R7kvDe8iTbsqgpWjxEx29xxePWcrQW';
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'agentic-ai-rag';
const PINECONE_HOST = process.env.PINECONE_HOST || 'https://agentic-ai-rag-jvp8j9d.svc.aped-4627-b74a.pinecone.io';

export interface PineconeMatch {
  id: string;
  score: number;
  metadata?: {
    chunk_id?: string;
    page?: number;
    source?: string;
    text?: string;
    title?: string;
  };
}

export interface PineconeStats {
  namespaces: Record<string, { vectorCount: number }>;
  indexFullness: number;
  totalVectorCount: number;
  dimension: number;
}

export async function getPineconeStats(): Promise<PineconeStats> {
  const res = await fetch(`${PINECONE_HOST}/describe_index_stats`, {
    headers: {
      'Api-Key': PINECONE_API_KEY,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pinecone stats failed (${res.status}): ${errText}`);
  }

  return (await res.json()) as PineconeStats;
}

export async function queryPinecone(
  vector: number[],
  topK = 5,
  namespace = ''
): Promise<PineconeMatch[]> {
  const res = await fetch(`${PINECONE_HOST}/query`, {
    method: 'POST',
    headers: {
      'Api-Key': PINECONE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vector,
      topK,
      includeMetadata: true,
      namespace: namespace || undefined,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pinecone query failed (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { matches?: PineconeMatch[] };
  return data.matches || [];
}

export async function upsertPinecone(
  vectors: Array<{
    id: string;
    values: number[];
    metadata: Record<string, any>;
  }>,
  namespace = ''
): Promise<{ upsertedCount: number }> {
  const res = await fetch(`${PINECONE_HOST}/vectors/upsert`, {
    method: 'POST',
    headers: {
      'Api-Key': PINECONE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vectors,
      namespace: namespace || undefined,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pinecone upsert failed (${res.status}): ${errText}`);
  }

  return (await res.json()) as { upsertedCount: number };
}
