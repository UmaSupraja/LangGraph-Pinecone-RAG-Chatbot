import { EBOOK_PAGES, type EbookPage } from './ebook_pages.ts';

export interface TextChunk {
  id: string;
  page: number;
  source: string;
  title: string;
  chapter: string;
  text: string;
  charCount: number;
}

/**
 * Splits text into segments between 500 and 1000 characters with 100 character overlap
 */
export function chunkPage(
  page: EbookPage,
  targetChunkSize = 750,
  overlap = 100
): TextChunk[] {
  const text = page.text.trim();
  if (!text) return [];

  // If text is already under targetChunkSize + overlap, keep as single chunk
  if (text.length <= 800) {
    return [
      {
        id: `page-${page.page}-chunk-0`,
        page: page.page,
        source: 'Ebook-Agentic-AI.pdf',
        title: page.title || `Page ${page.page}`,
        chapter: page.chapter || 'Overview',
        text,
        charCount: text.length,
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + targetChunkSize;

    if (endIndex >= text.length) {
      endIndex = text.length;
    } else {
      // Find a clean boundary (newline or period) near target
      const lookaheadRange = text.substring(endIndex - 100, Math.min(endIndex + 100, text.length));
      const naturalBreak = lookaheadRange.lastIndexOf('\n');
      const periodBreak = lookaheadRange.lastIndexOf('. ');

      if (naturalBreak !== -1 && naturalBreak > 40) {
        endIndex = (endIndex - 100) + naturalBreak + 1;
      } else if (periodBreak !== -1 && periodBreak > 40) {
        endIndex = (endIndex - 100) + periodBreak + 2;
      }
    }

    const chunkText = text.substring(startIndex, endIndex).trim();
    if (chunkText.length > 50) {
      chunks.push({
        id: `page-${page.page}-chunk-${chunkIndex}`,
        page: page.page,
        source: 'Ebook-Agentic-AI.pdf',
        title: page.title || `Page ${page.page}`,
        chapter: page.chapter || 'Overview',
        text: chunkText,
        charCount: chunkText.length,
      });
      chunkIndex++;
    }

    if (endIndex >= text.length) {
      break;
    }

    // Move next start with overlap
    startIndex = Math.max(startIndex + 1, endIndex - overlap);
  }

  return chunks;
}

export function getAllChunks(): TextChunk[] {
  const all: TextChunk[] = [];
  for (const page of EBOOK_PAGES) {
    all.push(...chunkPage(page));
  }
  return all;
}
