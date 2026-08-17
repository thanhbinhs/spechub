import { config } from "dotenv";
import {
  createLocalEmbedding,
  LOCAL_EMBEDDING_MODEL,
  vectorToPgVector,
} from "@spechub/ai-core";

config({
  path: [".env.local", ".env", "../../.env.local", "../../.env"],
});

const sample = process.argv.slice(2).join(" ") || "SpecHub AI service ready";
const sampleEmbedding = createLocalEmbedding(sample);
const vector = vectorToPgVector(sampleEmbedding);
const configuredAnswerProvider = process.env.AI_PROVIDER ?? "local";
const answerEndpoint =
  process.env.AI_CHAT_BASE_URL ?? "https://api.openai.com/v1";
const answerProvider =
  configuredAnswerProvider === "ollama" || isOllamaEndpoint(answerEndpoint)
    ? "ollama"
    : configuredAnswerProvider;
const answerModel =
  answerProvider === "ollama" || answerProvider === "openai"
    ? (process.env.AI_OPENAI_MODEL ?? "gpt-4o-mini")
    : answerProvider === "anthropic"
      ? (process.env.AI_ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest")
      : "local-rag-v1";
const embeddingProvider = process.env.AI_EMBEDDING_PROVIDER ?? "local";
const embeddingModel =
  embeddingProvider === "openai"
    ? (process.env.AI_OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small")
    : LOCAL_EMBEDDING_MODEL;

console.log(
  JSON.stringify(
    {
      service: "@spechub/ai-service",
      status: "ready",
      role: "embedding diagnostics only",
      answer_generation: {
        handled_by: "@spechub/api",
        provider: answerProvider,
        configured_provider: configuredAnswerProvider,
        model: answerModel,
        endpoint: answerEndpoint,
      },
      retrieval_embedding: {
        configured_provider: embeddingProvider,
        configured_model: embeddingModel,
        diagnostic_provider: "local",
        diagnostic_model: LOCAL_EMBEDDING_MODEL,
        purpose: "catalog retrieval only; it does not generate chat answers",
        sample_dimensions: sampleEmbedding.length,
        sample_vector_preview: vector.slice(0, 80),
      },
    },
    null,
    2,
  ),
);

function isOllamaEndpoint(value: string) {
  try {
    const url = new URL(value);
    return (
      (url.hostname === "127.0.0.1" || url.hostname === "localhost") &&
      url.port === "11434"
    );
  } catch {
    return false;
  }
}
