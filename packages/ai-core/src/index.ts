export const EMBEDDING_DIMENSIONS = 1536;
export const LOCAL_EMBEDDING_MODEL = "local-hash-embedding-v1";
export const LOCAL_RAG_MODEL = "local-rag-v1";

export type RagEntityType =
  | "device_model"
  | "device_variant"
  | "hardware_module"
  | "product_family"
  | "raw_page"
  | "wiki_article"
  | "organization"
  | "catalog_reference";

export type RagChunk = {
  entityType: RagEntityType;
  entityId: string;
  chunkText: string;
  chunkIndex: number;
  title?: string | null;
  slug?: string | null;
  score?: number | null;
};

export type AiCitation = {
  entity_type: RagEntityType;
  entity_id: string;
  title?: string | null;
  slug?: string | null;
  excerpt: string;
  score?: number | null;
};

export type ChunkTextOptions = {
  maxChars?: number;
};

export function createLocalEmbedding(
  text: string,
  dimensions = EMBEDDING_DIMENSIONS,
): number[] {
  const vector = Array.from({ length: dimensions }, () => 0);
  const tokens = tokenize(text);

  for (const token of tokens) {
    addToken(vector, token, 1);
  }

  for (let index = 0; index < tokens.length - 1; index += 1) {
    addToken(vector, `${tokens[index]}_${tokens[index + 1]}`, 0.65);
  }

  return normalizeVector(vector);
}

export function vectorToPgVector(vector: number[]): string {
  return `[${vector.map((value) => Number(value.toFixed(8))).join(",")}]`;
}

export function tokenize(text: string): string[] {
  return (
    text
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .toLowerCase()
      .match(/[a-z0-9]+/g) ?? []
  );
}

export function chunkText(
  text: string,
  options: ChunkTextOptions = {},
): string[] {
  const maxChars = options.maxChars ?? 1_400;
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (!current) {
      current = paragraph;
      continue;
    }

    if (`${current}\n\n${paragraph}`.length <= maxChars) {
      current = `${current}\n\n${paragraph}`;
      continue;
    }

    chunks.push(current);
    current = paragraph;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.flatMap((chunk) => splitOversizedChunk(chunk, maxChars));
}

export function makeExcerpt(
  text: string,
  query: string,
  maxLength = 280,
): string {
  const queryTokens = new Set(tokenize(query));
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const sentence =
    sentences.find((candidate) =>
      tokenize(candidate).some((token) => queryTokens.has(token)),
    ) ??
    sentences[0] ??
    text;

  return trimText(sentence, maxLength);
}

export function trimText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;

  const shortened = normalized.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  const body = lastSpace > 80 ? shortened.slice(0, lastSpace) : shortened;
  return `${body.trim()}...`;
}

function addToken(vector: number[], token: string, weight: number) {
  const hash = hashToken(token);
  const index = hash % vector.length;
  const sign = hash & 1 ? 1 : -1;
  const lengthBoost = 1 + Math.min(token.length, 20) / 40;
  vector[index] = (vector[index] ?? 0) + sign * weight * lengthBoost;
}

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0),
  );

  if (!magnitude) return vector;
  return vector.map((value) => value / magnitude);
}

function splitOversizedChunk(chunk: string, maxChars: number): string[] {
  if (chunk.length <= maxChars) return [chunk];

  const sentences = chunk
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const parts: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (!current) {
      current = sentence;
      continue;
    }

    if (`${current} ${sentence}`.length <= maxChars) {
      current = `${current} ${sentence}`;
      continue;
    }

    parts.push(current);
    current = sentence;
  }

  if (current) parts.push(current);

  return parts.length
    ? parts
    : Array.from({ length: Math.ceil(chunk.length / maxChars) }, (_, index) =>
        chunk.slice(index * maxChars, (index + 1) * maxChars),
      );
}
