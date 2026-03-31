import type { EmbeddingModel, LanguageModel } from "ai";

export type SearchStrategy = "hybrid" | "semantic" | "combined";

export interface SelectOptions {
  maxTools?: number;
  alwaysActive?: string[];
  threshold?: number;
  /** When true, returns fewer than maxTools if there's a large score gap. Default: true */
  adaptive?: boolean;
  /** Per-call override of relatedTools. Fully replaces the index-level map when provided. */
  relatedTools?: Record<string, string[]>;
}

export interface SearchResult {
  name: string;
  score: number;
}

export interface SearchEngine {
  search(query: string, maxResults: number): SearchResult[] | Promise<SearchResult[]>;
  init?(): Promise<void>;
}

export interface EmbeddingCacheOptions {
  load(): Promise<number[][] | null>;
  save(embeddings: number[][]): Promise<void>;
}

export interface ToolIndexOptions {
  strategy?: SearchStrategy;
  embeddingModel?: EmbeddingModel;
  embeddingCache?: EmbeddingCacheOptions;
  rerankerModel?: LanguageModel;
  enrichDescriptions?: boolean;
  /** Map of tool name → tool names that should be included whenever the key tool is selected. */
  relatedTools?: Record<string, string[]>;
}

export interface ToolDescription {
  name: string;
  text: string;
}

export interface EvalTestCase {
  query: string;
  expected: string;
  alternatives?: string[];
}

export interface EvalResult {
  top1: number;
  top3: number;
  top5: number;
  avgLatencyMs: number;
  total: number;
  misses: Array<{
    query: string;
    expected: string;
    got: string[];
  }>;
}
