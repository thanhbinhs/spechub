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
const vector = vectorToPgVector(createLocalEmbedding(sample));

console.log(
  JSON.stringify(
    {
      service: "@spechub/ai-service",
      status: "ready",
      embedding_model: LOCAL_EMBEDDING_MODEL,
      sample_dimensions: createLocalEmbedding(sample).length,
      sample_vector_preview: vector.slice(0, 80),
    },
    null,
    2,
  ),
);
