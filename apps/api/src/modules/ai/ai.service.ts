import { createHash, randomUUID } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import {
  AiCitation,
  chunkText,
  LOCAL_RAG_MODEL,
  makeExcerpt,
  RagChunk,
  tokenize,
  trimText,
  vectorToPgVector,
} from "@spechub/ai-core";
import { Prisma } from "@spechub/database";
import { PrismaService } from "../../prisma/prisma.service";
import { AiKnowledgeService } from "./ai-knowledge.service";
import {
  AiProviderService,
  type AiConversationMessage,
} from "./ai-provider.service";
import { AskAiDto } from "./dto/ask-ai.dto";
import { QueryAiSearchDto } from "./dto/query-ai-search.dto";

const AI_DEVICE_MODEL_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  announcement_date: true,
  release_date: true,
  generation_label: true,
  product_family: {
    select: {
      id: true,
      name: true,
      slug: true,
      brand_org: {
        select: {
          id: true,
          name: true,
          slug: true,
          short_name: true,
        },
      },
      device_category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
  release_status: {
    select: {
      code: true,
      name: true,
    },
  },
  device_variants: {
    where: {
      deleted_at: null,
    },
    select: {
      id: true,
      variant_name: true,
      market_name: true,
      sku_code: true,
      color_name: true,
      launch_date: true,
      launch_price: true,
      is_default: true,
      notes: true,
      currency: {
        select: {
          code: true,
          symbol: true,
        },
      },
      variant_physical_specs: {
        select: {
          height_mm: true,
          width_mm: true,
          thickness_mm: true,
          weight_g: true,
          frame_material: true,
          back_material: true,
          front_glass: true,
          ingress_protection: true,
        },
      },
      variant_chipsets: {
        select: {
          chip_role: true,
          is_primary: true,
          chipset: {
            select: {
              id: true,
              name: true,
              slug: true,
              model_code: true,
              chip_kind: true,
              integrated_5g: true,
              max_ram_gb: true,
              manufacturer: {
                select: {
                  name: true,
                  short_name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: [{ is_primary: "desc" as const }],
      },
      variant_displays: {
        select: {
          display_role: true,
          display_order: true,
          display_unit: {
            select: {
              id: true,
              name: true,
              slug: true,
              size_inch: true,
              resolution_width: true,
              resolution_height: true,
              refresh_rate_hz: true,
              brightness_peak_nits: true,
              hdr_formats: true,
              display_technology: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: [{ display_order: "asc" as const }],
      },
      variant_batteries: {
        select: {
          battery_role: true,
          is_primary: true,
          battery_unit: {
            select: {
              id: true,
              name: true,
              slug: true,
              capacity_mah: true,
              energy_wh: true,
              wired_charging_w: true,
              wireless_charging_w: true,
              removable: true,
            },
          },
        },
        orderBy: [{ is_primary: "desc" as const }],
      },
      variant_cpus: {
        select: {
          is_primary: true,
          cpu: {
            select: {
              name: true,
              core_count: true,
              thread_count: true,
              cpu_clusters: {
                select: {
                  cluster_name: true,
                  core_count: true,
                  clock_ghz: true,
                },
                orderBy: [{ cluster_order: "asc" as const }],
              },
            },
          },
        },
        orderBy: [{ is_primary: "desc" as const }],
      },
      variant_gpus: {
        select: {
          is_primary: true,
          gpu: {
            select: {
              name: true,
              compute_units: true,
              clock_mhz: true,
              fp32_gflops: true,
              ray_tracing_support: true,
            },
          },
        },
        orderBy: [{ is_primary: "desc" as const }],
      },
      variant_npus: {
        select: {
          is_primary: true,
          npu: {
            select: {
              name: true,
              tops: true,
              tops_int4: true,
              tops_fp16: true,
            },
          },
        },
        orderBy: [{ is_primary: "desc" as const }],
      },
      variant_memory_configs: {
        select: {
          capacity_gb: true,
          bandwidth_gbps: true,
          is_primary: true,
          memory_standard: {
            select: {
              name: true,
              generation: true,
              max_data_rate_mtps: true,
            },
          },
        },
        orderBy: [
          { is_primary: "desc" as const },
          { capacity_gb: "desc" as const },
        ],
      },
      variant_storage_configs: {
        select: {
          total_capacity_gb: true,
          is_expandable: true,
          expansion_max_gb: true,
          storage_standard: {
            select: {
              name: true,
              generation: true,
              interface: true,
            },
          },
        },
        orderBy: [{ total_capacity_gb: "desc" as const }],
      },
      variant_camera_systems: {
        select: {
          position: true,
          variant_camera_modules: {
            select: {
              is_primary: true,
              role: true,
              camera_module: {
                select: {
                  name: true,
                  effective_megapixel: true,
                  aperture: true,
                  optical_zoom: true,
                  has_ois: true,
                },
              },
            },
            orderBy: [{ module_order: "asc" as const }],
          },
        },
      },
      variant_operating_systems: {
        select: {
          is_default: true,
          promised_major_updates: true,
          promised_security_years: true,
          os_version: {
            select: {
              version_name: true,
              operating_system: {
                select: {
                  name: true,
                },
              },
            },
          },
          ui_layer_version: {
            select: {
              version_name: true,
              ui_layer: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [{ is_default: "desc" as const }],
      },
      device_variant_benchmarks: {
        select: {
          score: true,
          subscore_name: true,
          benchmark: {
            select: {
              name: true,
              slug: true,
              benchmark_type: true,
              version: true,
              higher_is_better: true,
              unit: {
                select: {
                  symbol: true,
                },
              },
            },
          },
        },
        orderBy: [{ benchmark: { name: "asc" as const } }],
      },
    },
    orderBy: [
      { is_default: "desc" as const },
      { launch_date: "asc" as const },
      { variant_name: "asc" as const },
    ],
  },
} satisfies Prisma.device_modelsSelect;

const AI_RAW_PAGE_SELECT = {
  id: true,
  url: true,
  raw_text: true,
  parsed_data: true,
  status: true,
  crawled_at: true,
  parsed_at: true,
  source: {
    select: {
      id: true,
      name: true,
      slug: true,
      reliability: true,
    },
  },
  device_model: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.raw_pagesSelect;

type AiDeviceModel = Prisma.device_modelsGetPayload<{
  select: typeof AI_DEVICE_MODEL_SELECT;
}>;

type AiRawPage = Prisma.raw_pagesGetPayload<{
  select: typeof AI_RAW_PAGE_SELECT;
}>;

type RetrievedChunkRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  chunk_text: string;
  chunk_index: number;
  model_name: string;
  score: number | string | null;
  title: string | null;
  slug: string | null;
};

type EmbeddingStatsRow = {
  model_name: string;
  entity_type: string;
  chunks: bigint | number | string;
};

type CountRow = {
  count: bigint | number | string;
};

type EmbeddedChunk = {
  chunk: RagChunk;
  embedding: string;
  modelName: string;
};

type RetrievalSource =
  | "hybrid"
  | "vector"
  | "catalog_fallback"
  | "cache"
  | "conversation";
type AiIntent =
  | "compare"
  | "ranking"
  | "recommendation"
  | "lookup"
  | "conversation";
type RankingMetric =
  | "battery"
  | "performance"
  | "price"
  | "refresh_rate"
  | "weight";
type DecisionPriority =
  | "performance"
  | "battery"
  | "camera"
  | "display"
  | "price"
  | "portability"
  | "software"
  | "storage";
type DeviceUseCase =
  | "gaming"
  | "photography"
  | "productivity"
  | "travel"
  | "long_term"
  | "value";
type AnswerConfidence = "high" | "medium" | "low";
type AiStreamStage =
  | "cache"
  | "retrieving"
  | "grounding"
  | "generating"
  | "verifying"
  | "complete";

export type AiStreamEvent =
  | {
      type: "status";
      stage: AiStreamStage;
      message: string;
    }
  | {
      type: "context";
      citations: AiCitation[];
      contexts: RagChunk[];
      grounded_draft: string;
      meta: {
        source: RetrievalSource;
        intent: AiIntent;
        top_k: number;
        contextual_follow_up?: boolean;
      };
    }
  | {
      type: "delta";
      text: string;
    }
  | {
      type: "reset";
      reason: "repair" | "fallback";
    }
  | {
      type: "result";
      response: Awaited<ReturnType<AiService["ask"]>>;
    }
  | {
      type: "error";
      message: string;
    };

export type AiStreamEmitter = (event: AiStreamEvent) => void | Promise<void>;

type QuestionAnalysis = {
  intent: AiIntent;
  rankingMetric?: RankingMetric;
  rankingMode?: "min" | "max";
  priorities: DecisionPriority[];
  useCases: DeviceUseCase[];
};

type QuestionResolution = {
  effectiveQuestion: string;
  history: AiConversationMessage[];
  isContextualFollowUp: boolean;
  anchorQuestion?: string;
};

type CatalogEntity = {
  entityId: string;
  title: string;
  citation: number;
  text: string;
};

const AI_ANSWER_VERSION = "knowledge-agent-v22-grounded-provider-cache";
const DEVICE_QUERY_TOKEN_ALIASES: Record<string, readonly string[]> = {
  prm: ["pro", "max"],
  promax: ["pro", "max"],
  pls: ["plus"],
};
const DEVICE_FAMILY_QUERY_TOKENS = new Set([
  "airpods",
  "galaxy",
  "iphone",
  "ipad",
  "kindle",
  "macbook",
  "matepad",
  "pixel",
  "redmi",
  "surface",
  "thinkpad",
]);
const QUERY_STOP_WORDS = new Set([
  "ai",
  "anh",
  "ban",
  "cai",
  "cac",
  "cho",
  "co",
  "cua",
  "device",
  "giup",
  "hay",
  "la",
  "may",
  "mot",
  "nao",
  "nhung",
  "the",
  "thiet",
  "toi",
  "trong",
  "va",
  "voi",
  "which",
  "what",
  "the",
  "and",
  "for",
  "me",
  "please",
  "sanh",
  "so",
]);
const HARDWARE_USAGE_QUERY_TOKENS = new Set([
  "duoc",
  "dung",
  "tren",
  "thiet",
  "bi",
  "may",
  "dien",
  "thoai",
  "laptop",
  "tablet",
  "products",
  "product",
  "devices",
  "used",
  "use",
  "using",
  "with",
]);

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly prisma: PrismaService;
  private readonly aiProvider: AiProviderService;
  private readonly knowledgeService: AiKnowledgeService;

  constructor(
    prisma: PrismaService,
    aiProvider?: AiProviderService,
    knowledgeService?: AiKnowledgeService,
  ) {
    this.prisma = prisma;
    this.aiProvider = aiProvider ?? new AiProviderService();
    this.knowledgeService =
      knowledgeService ?? new AiKnowledgeService(this.prisma);
  }

  async ask(dto: AskAiDto) {
    const question = dto.question.trim();
    const topK = dto.top_k ?? 5;
    const resolution = this.resolveQuestion(question, dto.history);
    const analysis = this.analyzeResolvedQuestion(question, resolution);
    if (analysis.intent === "conversation") {
      const generated = await this.generateConversationAnswer(
        question,
        resolution.history,
      );
      return this.conversationResponse(question, topK, generated);
    }
    const queryHash = this.hashQuery(resolution.effectiveQuestion, topK);
    const cached = await this.getCachedAnswer(queryHash, {
      question,
      isContextualFollowUp: resolution.isContextualFollowUp,
      analysis,
    });

    if (cached) return cached;

    const { chunks: retrievedChunks, source } = await this.retrieveChunks(
      resolution.effectiveQuestion,
      topK,
    );
    const chunks = this.focusChunks(
      resolution.effectiveQuestion,
      analysis,
      retrievedChunks,
      topK,
    );
    const citations = chunks.map((chunk) =>
      this.toCitation(chunk, resolution.effectiveQuestion),
    );
    const groundedDraft = this.composeAnswer(
      resolution.effectiveQuestion,
      chunks,
      analysis,
    );
    const providerAnswer = chunks.length
      ? await this.aiProvider
          .generateAnswer({
            question: resolution.effectiveQuestion,
            chunks,
            citations,
            groundedDraft,
            conversation: resolution.history,
            decisionContext: {
              intent: analysis.intent,
              priorities: analysis.priorities,
              useCases: analysis.useCases,
            },
          })
          .catch((error) => {
            this.logger.warn(`AI provider answer skipped: ${String(error)}`);
            return null;
          })
      : null;
    const generated =
      providerAnswer &&
      this.hasValidCitations(providerAnswer.answer, citations.length)
        ? providerAnswer
        : null;
    if (providerAnswer && !generated) {
      this.logger.warn(
        "AI provider answer rejected because its citations were missing or invalid",
      );
    }
    const answer = generated?.answer ?? groundedDraft;
    const modelName = generated?.modelName ?? LOCAL_RAG_MODEL;
    const confidence = this.answerConfidence(
      analysis,
      chunks,
      citations.length,
    );
    const followUpQuestions = this.followUpQuestions(analysis, chunks);
    const warnings = this.answerWarnings(chunks, generated !== null);

    if (this.shouldCacheAnswer(generated)) {
      await this.writeCache(
        queryHash,
        question,
        answer,
        citations,
        modelName,
      ).catch((error) => {
        this.logger.warn(`AI cache write skipped: ${String(error)}`);
      });
    }

    return {
      data: {
        question,
        answer,
        citations,
        contexts: chunks,
        cached: false,
        model_name: modelName,
        follow_up_questions: followUpQuestions,
        warnings,
      },
      meta: {
        source,
        top_k: topK,
        embedding_model: this.aiProvider.embeddingModelName,
        rag_provider: generated?.provider ?? "local",
        intent: analysis.intent,
        contextual_follow_up: resolution.isContextualFollowUp,
        confidence: confidence.score,
        confidence_label: confidence.label,
        answer_version: AI_ANSWER_VERSION,
      },
    };
  }

  async streamAsk(dto: AskAiDto, emit: AiStreamEmitter, signal?: AbortSignal) {
    const question = dto.question.trim();
    const topK = dto.top_k ?? 5;
    const resolution = this.resolveQuestion(question, dto.history);
    const analysis = this.analyzeResolvedQuestion(question, resolution);
    if (analysis.intent === "conversation") {
      const fallbackResponse = this.conversationResponse(question, topK);
      let streamedProviderText = false;
      await emit({
        type: "status",
        stage: "generating",
        message: "Trợ lý đang trả lời...",
      });
      await emit({
        type: "context",
        citations: [],
        contexts: [],
        grounded_draft: fallbackResponse.data.answer,
        meta: {
          source: "conversation",
          intent: "conversation",
          top_k: topK,
          contextual_follow_up: false,
        },
      });
      signal?.throwIfAborted();
      const generated = await this.generateConversationAnswerStream(
        question,
        {
          // Forward tokens as they arrive so the UI does not wait for the full
          // response. Conversation answers do not use RAG grounding repairs.
          onDelta: async (text) => {
            if (!text) return;
            streamedProviderText = true;
            await emit({ type: "delta", text });
          },
        },
        signal,
        resolution.history,
      );
      signal?.throwIfAborted();
      const response = this.conversationResponse(question, topK, generated);
      if (!generated && streamedProviderText) {
        await emit({ type: "reset", reason: "fallback" });
      }
      if (!streamedProviderText || !generated) {
        await emit({ type: "delta", text: response.data.answer });
      }
      await emit({
        type: "status",
        stage: "complete",
        message: generated
          ? "Đã hoàn tất câu trả lời."
          : "Đã dùng phản hồi dự phòng nội bộ.",
      });
      await emit({ type: "result", response });
      return response;
    }
    const queryHash = this.hashQuery(resolution.effectiveQuestion, topK);

    await emit({
      type: "status",
      stage: "cache",
      message: "Đang kiểm tra câu trả lời đã có...",
    });
    const cached = await this.getCachedAnswer(queryHash, {
      question,
      isContextualFollowUp: resolution.isContextualFollowUp,
      analysis,
    });
    if (cached) {
      signal?.throwIfAborted();
      await emit({ type: "delta", text: cached.data.answer });
      await emit({ type: "result", response: cached });
      return cached;
    }

    await emit({
      type: "status",
      stage: "retrieving",
      message: "Đang tìm dữ liệu liên quan trong SpecHub...",
    });
    const { chunks: retrievedChunks, source } = await this.retrieveChunks(
      resolution.effectiveQuestion,
      topK,
    );
    signal?.throwIfAborted();
    const chunks = this.focusChunks(
      resolution.effectiveQuestion,
      analysis,
      retrievedChunks,
      topK,
    );
    const citations = chunks.map((chunk) =>
      this.toCitation(chunk, resolution.effectiveQuestion),
    );
    const groundedDraft = this.composeAnswer(
      resolution.effectiveQuestion,
      chunks,
      analysis,
    );

    await emit({
      type: "status",
      stage: "grounding",
      message: `Đã tìm thấy ${citations.length} nguồn phù hợp. Đang cấu trúc câu trả lời...`,
    });
    await emit({
      type: "context",
      citations,
      contexts: chunks,
      grounded_draft: groundedDraft,
      meta: {
        source,
        intent: analysis.intent,
        top_k: topK,
        contextual_follow_up: resolution.isContextualFollowUp,
      },
    });

    let providerAnswer = null;
    let streamedProviderText = false;
    if (chunks.length) {
      await emit({
        type: "status",
        stage: "generating",
        message: "Trợ lý đang trả lời...",
      });
      providerAnswer = await this.aiProvider
        .generateAnswerStream(
          {
            question: resolution.effectiveQuestion,
            chunks,
            citations,
            groundedDraft,
            conversation: resolution.history,
            decisionContext: {
              intent: analysis.intent,
              priorities: analysis.priorities,
              useCases: analysis.useCases,
            },
          },
          {
            // Stream every provider token immediately. A draft that later fails
            // grounding is replaced once by the deterministic catalog answer;
            // we intentionally never launch a second model response mid-stream.
            onDelta: async (text) => {
              if (!text) return;
              streamedProviderText = true;
              await emit({ type: "delta", text });
            },
          },
          signal,
        )
        .catch((error) => {
          if (signal?.aborted) throw error;
          this.logger.warn(`Streaming AI provider skipped: ${String(error)}`);
          return null;
        });
    }
    signal?.throwIfAborted();
    const generated =
      providerAnswer &&
      this.hasValidCitations(providerAnswer.answer, citations.length)
        ? providerAnswer
        : null;
    const answer = generated?.answer ?? groundedDraft;
    const modelName = generated?.modelName ?? LOCAL_RAG_MODEL;
    const confidence = this.answerConfidence(
      analysis,
      chunks,
      citations.length,
    );
    const response = {
      data: {
        question,
        answer,
        citations,
        contexts: chunks,
        cached: false,
        model_name: modelName,
        follow_up_questions: this.followUpQuestions(analysis, chunks),
        warnings: this.answerWarnings(chunks, generated !== null),
      },
      meta: {
        source,
        top_k: topK,
        embedding_model: this.aiProvider.embeddingModelName,
        rag_provider: generated?.provider ?? ("local" as const),
        intent: analysis.intent,
        contextual_follow_up: resolution.isContextualFollowUp,
        confidence: confidence.score,
        confidence_label: confidence.label,
        answer_version: AI_ANSWER_VERSION,
      },
    };

    if (!generated && streamedProviderText) {
      await emit({ type: "reset", reason: "fallback" });
    }
    if (!streamedProviderText || !generated) {
      await emit({ type: "delta", text: answer });
    }

    if (this.shouldCacheAnswer(generated)) {
      await this.writeCache(
        queryHash,
        question,
        answer,
        citations,
        modelName,
      ).catch((error) => {
        this.logger.warn(`AI cache write skipped: ${String(error)}`);
      });
    }
    await emit({
      type: "status",
      stage: "complete",
      message: "Đã hoàn tất câu trả lời.",
    });
    await emit({ type: "result", response });
    return response;
  }

  async search(query: QueryAiSearchDto) {
    const q = query.q.trim();
    const topK = query.top_k ?? 5;
    const analysis = this.analyzeQuestion(q);
    const { chunks, source } = await this.retrieveChunks(q, topK);

    return {
      data: chunks.map((chunk) => ({
        ...chunk,
        excerpt: this.contextExcerpt(chunk, q),
      })),
      meta: {
        query: q,
        top_k: topK,
        source,
        embedding_model: this.aiProvider.embeddingModelName,
        intent: analysis.intent,
      },
    };
  }

  async getEmbeddingStats() {
    const [
      rows,
      deviceModels,
      indexedDeviceModels,
      indexedKnowledgeRecords,
      answerProviderStatus,
    ] = await Promise.all([
      this.readEmbeddingStats(),
      this.prisma.device_models.count({ where: { deleted_at: null } }),
      this.countIndexedDeviceModels(),
      this.countIndexedKnowledgeRecords(),
      this.aiProvider.getAnswerProviderStatus(),
    ]);
    const totalChunks = rows.reduce(
      (sum, row) => sum + this.numberValue(row.chunks),
      0,
    );

    return {
      data: {
        total_chunks: totalChunks,
        indexed_device_models: indexedDeviceModels,
        device_models: deviceModels,
        indexed_knowledge_records: indexedKnowledgeRecords,
        knowledge_sources: this.knowledgeService.sourceCount + 2,
        indexes: rows.map((row) => ({
          model_name: row.model_name,
          entity_type: row.entity_type,
          chunks: this.numberValue(row.chunks),
        })),
      },
      meta: {
        rag_provider: this.aiProvider.answerProviderName,
        rag_model: this.aiProvider.ragModelName,
        provider_status: answerProviderStatus,
        embedding_provider: this.aiProvider.embeddingProvider,
        embedding_model: this.aiProvider.embeddingModelName,
      },
    };
  }

  async indexDeviceModels() {
    const embeddingModel = this.aiProvider.embeddingModelName;
    const models = await this.prisma.device_models.findMany({
      where: {
        deleted_at: null,
      },
      select: AI_DEVICE_MODEL_SELECT,
      orderBy: [{ release_date: "desc" }, { name: "asc" }],
    });
    const chunks = models.flatMap((model) => this.buildModelChunks(model));
    const embeddedChunks = await this.embedChunks(chunks);

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        "DELETE FROM embeddings WHERE entity_type = $1 AND model_name = $2",
        "device_model",
        embeddingModel,
      );
      await tx.ai_query_cache.deleteMany({});

      await this.insertEmbeddedChunks(tx, embeddedChunks);
    });

    return {
      data: {
        indexed_models: models.length,
        indexed_chunks: chunks.length,
        model_name: embeddingModel,
      },
      meta: {
        entity_type: "device_model",
      },
    };
  }

  async indexRawPages() {
    const embeddingModel = this.aiProvider.embeddingModelName;
    const pages = await this.prisma.raw_pages.findMany({
      where: {
        status: "approved",
        OR: [
          { raw_text: { not: null } },
          { parsed_data: { not: Prisma.JsonNull } },
        ],
      },
      select: AI_RAW_PAGE_SELECT,
      orderBy: [{ parsed_at: "desc" }, { crawled_at: "desc" }],
    });
    const chunks = pages.flatMap((page) => this.buildRawPageChunks(page));
    const embeddedChunks = await this.embedChunks(chunks);

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        "DELETE FROM embeddings WHERE entity_type = $1 AND model_name = $2",
        "raw_page",
        embeddingModel,
      );
      await tx.ai_query_cache.deleteMany({});

      await this.insertEmbeddedChunks(tx, embeddedChunks);
    });

    return {
      data: {
        indexed_raw_pages: pages.length,
        indexed_chunks: chunks.length,
        model_name: embeddingModel,
      },
      meta: {
        entity_type: "raw_page",
      },
    };
  }

  async indexKnowledgeBase() {
    const embeddingModel = this.aiProvider.embeddingModelName;
    const [models, pages, knowledge] = await Promise.all([
      this.prisma.device_models.findMany({
        where: {
          deleted_at: null,
        },
        select: AI_DEVICE_MODEL_SELECT,
        orderBy: [{ release_date: "desc" }, { name: "asc" }],
      }),
      this.prisma.raw_pages.findMany({
        where: {
          status: "approved",
          OR: [
            { raw_text: { not: null } },
            { parsed_data: { not: Prisma.JsonNull } },
          ],
        },
        select: AI_RAW_PAGE_SELECT,
        orderBy: [{ parsed_at: "desc" }, { crawled_at: "desc" }],
      }),
      this.knowledgeService.createSnapshot(),
    ]);
    const deviceChunks = models.flatMap((model) =>
      this.buildModelChunks(model),
    );
    const rawPageChunks = pages.flatMap((page) =>
      this.buildRawPageChunks(page),
    );
    const chunks = [...deviceChunks, ...rawPageChunks, ...knowledge.chunks];
    const embeddedChunks = await this.embedChunks(chunks);

    await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(
          "DELETE FROM embeddings WHERE model_name = $1",
          embeddingModel,
        );
        await tx.ai_query_cache.deleteMany({});
        await this.insertEmbeddedChunks(tx, embeddedChunks);
      },
      {
        maxWait: 10_000,
        timeout: 120_000,
      },
    );

    return {
      data: {
        indexed_device_models: models.length,
        indexed_raw_pages: pages.length,
        indexed_knowledge_records: knowledge.recordCount,
        indexed_chunks: chunks.length,
        knowledge_sources: knowledge.sourceCount + 2,
        records_by_type: {
          device_model: models.length,
          raw_page: pages.length,
          ...knowledge.recordsByType,
        },
        model_name: embeddingModel,
      },
      meta: {
        scope: "approved_internal_knowledge",
        excluded:
          "users, credentials, API keys, billing, logs, drafts, private engagement data",
      },
    };
  }

  private async retrieveChunks(query: string, topK: number) {
    const analysis = this.analyzeQuestion(query);
    if (
      analysis.intent === "compare" ||
      analysis.intent === "ranking" ||
      analysis.intent === "recommendation"
    ) {
      return {
        chunks: this.diversifyChunks(
          await this.retrieveCatalogFallback(query, topK * 3),
          topK,
        ),
        source: "catalog_fallback" as RetrievalSource,
      };
    }

    let lookupCatalogChunks: RagChunk[] | undefined;
    if (analysis.intent === "lookup") {
      lookupCatalogChunks = await this.retrieveCatalogFallback(query, topK * 3);
      const exactLookupChunks = this.focusExplicitLookupChunks(
        query,
        lookupCatalogChunks,
        topK,
      );
      if (exactLookupChunks) {
        return {
          chunks: exactLookupChunks,
          source: "catalog_fallback" as RetrievalSource,
        };
      }
      if (this.isHardwareUsageQuestion(query)) {
        const matchingDeviceChunks = this.filterHardwareUsageChunks(
          lookupCatalogChunks,
          query,
        );
        if (matchingDeviceChunks.length) {
          return {
            chunks: this.diversifyChunks(matchingDeviceChunks, topK),
            source: "catalog_fallback" as RetrievalSource,
          };
        }
      }
    }

    const indexedChunks = await this.countIndexedChunks();

    if (indexedChunks > 0) {
      const [vectorChunks, catalogChunks] = await Promise.all([
        this.retrieveVectorChunks(query, topK * 3).catch((error) => {
          this.logger.warn(`Vector retrieval skipped: ${String(error)}`);
          return [];
        }),
        lookupCatalogChunks ?? this.retrieveCatalogFallback(query, topK * 3),
      ]);
      const hybridChunks = this.mergeHybridChunks(
        vectorChunks,
        catalogChunks,
        topK,
      );

      if (hybridChunks.length) {
        return {
          chunks: hybridChunks,
          source:
            vectorChunks.length && catalogChunks.length
              ? ("hybrid" as RetrievalSource)
              : vectorChunks.length
                ? ("vector" as RetrievalSource)
                : ("catalog_fallback" as RetrievalSource),
        };
      }
    }

    return {
      chunks: this.diversifyChunks(
        lookupCatalogChunks ??
          (await this.retrieveCatalogFallback(query, topK * 3)),
        topK,
      ),
      source: "catalog_fallback" as RetrievalSource,
    };
  }

  private async embedChunks(chunks: RagChunk[]) {
    const embeddedChunks: EmbeddedChunk[] = [];

    for (let offset = 0; offset < chunks.length; offset += 64) {
      const batch = chunks.slice(offset, offset + 64);
      const embeddingResults = await this.aiProvider.embedTexts(
        batch.map((chunk) => chunk.chunkText),
      );
      if (embeddingResults.length !== batch.length) {
        throw new Error(
          `Embedding provider returned ${embeddingResults.length} vectors for ${batch.length} chunks`,
        );
      }
      batch.forEach((chunk, index) => {
        const embeddingResult = embeddingResults[index]!;
        embeddedChunks.push({
          chunk,
          embedding: vectorToPgVector(embeddingResult.vector),
          modelName: embeddingResult.modelName,
        });
      });
    }

    return embeddedChunks;
  }

  private async insertEmbeddedChunks(
    tx: Prisma.TransactionClient,
    embeddedChunks: EmbeddedChunk[],
  ) {
    for (let offset = 0; offset < embeddedChunks.length; offset += 100) {
      const batch = embeddedChunks.slice(offset, offset + 100);
      const parameters = batch.flatMap((embeddedChunk) => [
        randomUUID(),
        embeddedChunk.chunk.entityType,
        embeddedChunk.chunk.entityId,
        embeddedChunk.chunk.chunkText,
        embeddedChunk.chunk.chunkIndex,
        embeddedChunk.embedding,
        embeddedChunk.modelName,
      ]);
      const values = batch
        .map((_, index) => {
          const parameter = index * 7;
          return `($${parameter + 1}::uuid, $${parameter + 2}, $${parameter + 3}, $${parameter + 4}, $${parameter + 5}, $${parameter + 6}::vector, $${parameter + 7})`;
        })
        .join(", ");
      await tx.$executeRawUnsafe(
        `INSERT INTO embeddings
          (id, entity_type, entity_id, chunk_text, chunk_index, embedding, model_name)
         VALUES ${values}`,
        ...parameters,
      );
    }
  }

  private async retrieveVectorChunks(
    query: string,
    topK: number,
  ): Promise<RagChunk[]> {
    const embeddingResult = await this.aiProvider.embedText(query);
    const embedding = vectorToPgVector(embeddingResult.vector);
    const rows = await this.prisma.$queryRawUnsafe<RetrievedChunkRow[]>(
      `SELECT
          e.id,
          e.entity_type,
          e.entity_id,
          e.chunk_text,
          e.chunk_index,
          e.model_name,
          1 - (e.embedding <=> $1::vector) AS score,
          COALESCE(dm.name, rp.url, wa.title) AS title,
          COALESCE(dm.slug, rp.url, wa.slug) AS slug
        FROM embeddings e
        LEFT JOIN device_models dm
          ON e.entity_type = 'device_model'
          AND e.entity_id = dm.id::text
        LEFT JOIN raw_pages rp
          ON e.entity_type = 'raw_page'
          AND e.entity_id = rp.id::text
        LEFT JOIN wiki_articles wa
          ON e.entity_type = 'wiki_article'
          AND e.entity_id = wa.id::text
        WHERE e.model_name = $2
          AND (
            (e.entity_type = 'device_model' AND dm.id IS NOT NULL AND dm.deleted_at IS NULL)
            OR (e.entity_type = 'raw_page' AND rp.id IS NOT NULL AND rp.status = 'approved')
            OR (e.entity_type = 'wiki_article' AND wa.id IS NOT NULL AND wa.status = 'published' AND wa.deleted_at IS NULL)
            OR e.entity_type NOT IN ('device_model', 'raw_page', 'wiki_article')
          )
        ORDER BY e.embedding <=> $1::vector
        LIMIT $3`,
      embedding,
      embeddingResult.modelName,
      topK,
    );

    return rows.map((row) => ({
      entityType: this.ragEntityType(row.entity_type),
      entityId: row.entity_id,
      chunkText: row.chunk_text,
      chunkIndex: row.chunk_index,
      title:
        row.title ??
        this.extractField(row.chunk_text, "Title") ??
        row.entity_id,
      slug: row.slug ?? this.extractField(row.chunk_text, "Slug"),
      score: row.score === null ? null : Number(row.score),
    }));
  }

  private async retrieveCatalogFallback(
    query: string,
    topK: number,
  ): Promise<RagChunk[]> {
    const analysis = this.analyzeQuestion(query);
    const terms = this.meaningfulQueryTerms(query);
    const searchTerms = terms.length ? terms : [query];
    const discoveryQuery =
      analysis.intent === "ranking" || analysis.intent === "recommendation";
    const models = await this.prisma.device_models.findMany({
      where: {
        deleted_at: null,
        ...(!discoveryQuery && {
          OR: searchTerms.flatMap((term) => this.buildCatalogWhere(term)),
        }),
      },
      select: AI_DEVICE_MODEL_SELECT,
      take:
        discoveryQuery || analysis.intent === "compare"
          ? 250
          : Math.max(topK * 5, 25),
      orderBy: [{ release_date: "desc" }, { name: "asc" }],
    });
    const queryTokens = new Set(terms);
    const lookupModels =
      analysis.intent === "lookup"
        ? this.focusExplicitLookupModels(models, query)
        : models;
    const rankedModels = this.rankModelsForQuestion(
      lookupModels,
      analysis,
      query,
    );
    const maximumMentionScore = Math.max(
      0,
      ...rankedModels.map((model) => this.modelMentionScore(model, query)),
    );
    const modelChunks = rankedModels.flatMap((model, modelIndex) =>
      this.buildModelChunks(model).map((chunk) => {
        const normalizedMention = maximumMentionScore
          ? this.modelMentionScore(model, query) / maximumMentionScore
          : 0;
        const contentScore = this.scoreChunk(
          chunk.chunkText,
          queryTokens,
          chunk.title,
        );
        const mentionWeight = analysis.intent === "compare" ? 0.65 : 0.35;
        return {
          ...chunk,
          score: discoveryQuery
            ? Math.min(
                1,
                Math.max(
                  0.35,
                  1 - modelIndex / Math.max(rankedModels.length, 1),
                ) *
                  0.9 +
                  (/^Variant:\s+/im.test(chunk.chunkText) ? 0.1 : 0),
              )
            : contentScore * (1 - mentionWeight) +
              normalizedMention * mentionWeight,
        };
      }),
    );

    return this.diversifyChunks(
      modelChunks.sort((left, right) => (right.score ?? 0) - (left.score ?? 0)),
      topK,
    );
  }

  private buildCatalogWhere(term: string): Prisma.device_modelsWhereInput[] {
    const contains = { contains: term, mode: "insensitive" as const };

    return [
      { name: contains },
      { slug: contains },
      { generation_label: contains },
      { description: contains },
      {
        aliases: {
          some: {
            OR: [{ alias: contains }, { normalized_alias: contains }],
          },
        },
      },
      {
        product_family: {
          name: contains,
        },
      },
      {
        product_family: {
          brand_org: {
            name: contains,
          },
        },
      },
      {
        product_family: {
          device_category: {
            name: contains,
          },
        },
      },
      {
        device_variants: {
          some: {
            deleted_at: null,
            OR: [
              { variant_name: contains },
              { sku_code: contains },
              { market_name: contains },
              {
                variant_chipsets: {
                  some: {
                    chipset: {
                      name: contains,
                    },
                  },
                },
              },
              {
                variant_displays: {
                  some: {
                    display_unit: {
                      name: contains,
                    },
                  },
                },
              },
              {
                variant_batteries: {
                  some: {
                    battery_unit: {
                      name: contains,
                    },
                  },
                },
              },
              {
                variant_cpus: {
                  some: {
                    cpu: {
                      name: contains,
                    },
                  },
                },
              },
              {
                variant_gpus: {
                  some: {
                    gpu: {
                      name: contains,
                    },
                  },
                },
              },
              {
                variant_npus: {
                  some: {
                    npu: {
                      name: contains,
                    },
                  },
                },
              },
              {
                variant_memory_configs: {
                  some: {
                    memory_standard: {
                      name: contains,
                    },
                  },
                },
              },
              {
                variant_storage_configs: {
                  some: {
                    storage_standard: {
                      name: contains,
                    },
                  },
                },
              },
            ],
          },
        },
      },
    ];
  }

  private buildModelChunks(model: AiDeviceModel): RagChunk[] {
    const brand =
      model.product_family.brand_org.short_name ??
      model.product_family.brand_org.name;
    const normalizedBrand = tokenize(brand).join(" ");
    const normalizedName = tokenize(model.name).join(" ");
    const title = normalizedName.startsWith(normalizedBrand)
      ? model.name
      : `${brand} ${model.name}`;
    const identityLines: string[] = [];

    this.addLine(identityLines, "Device", model.name);
    this.addLine(identityLines, "Brand", brand);
    this.addLine(identityLines, "Family", model.product_family.name);
    this.addLine(
      identityLines,
      "Category",
      this.localizeCategory(
        model.product_family.device_category.slug,
        model.product_family.device_category.name,
      ),
    );
    this.addLine(identityLines, "Generation", model.generation_label);
    this.addLine(
      identityLines,
      "Status",
      this.localizeReleaseStatus(
        model.release_status.code,
        model.release_status.name,
      ),
    );
    this.addLine(identityLines, "Announced", model.announcement_date);
    this.addLine(identityLines, "Released", model.release_date);
    this.addLine(
      identityLines,
      "Description",
      this.localizeDescription(model.description),
    );

    const sections = [
      identityLines.join("\n"),
      ...model.device_variants.map((variant) => {
        const lines = [
          `Device: ${model.name}`,
          `Brand: ${brand}`,
          `Variant: ${variant.variant_name}`,
          `Default variant: ${variant.is_default ? "yes" : "no"}`,
        ];
        this.addLine(lines, "Market", variant.market_name);
        this.addLine(lines, "SKU", variant.sku_code);
        this.addLine(lines, "Color", variant.color_name);
        this.addLine(lines, "Launch date", variant.launch_date);
        this.addLine(
          lines,
          "Launch price",
          this.formatPrice(variant.launch_price, variant.currency?.code),
        );
        this.addLine(lines, "Chipset", this.formatChipsets(variant));
        this.addLine(lines, "CPU", this.formatCpus(variant));
        this.addLine(lines, "GPU", this.formatGpus(variant));
        this.addLine(lines, "NPU", this.formatNpus(variant));
        this.addLine(lines, "Memory", this.formatMemory(variant));
        this.addLine(lines, "Storage", this.formatStorage(variant));
        this.addLine(lines, "Benchmarks", this.formatBenchmarks(variant));
        this.addLine(lines, "Display", this.formatDisplays(variant));
        this.addLine(lines, "Battery", this.formatBatteries(variant));
        this.addLine(lines, "Camera", this.formatCameras(variant));
        this.addLine(lines, "Software", this.formatSoftware(variant));
        this.addLine(
          lines,
          "Physical",
          this.formatPhysicalSpecs(variant.variant_physical_specs),
        );
        this.addLine(lines, "Notes", variant.notes);
        return lines.join("\n");
      }),
    ].filter(Boolean);
    let chunkIndex = 0;

    return sections.flatMap((section) =>
      chunkText(section, { maxChars: 1_800 }).map((text) => ({
        entityType: "device_model" as const,
        entityId: model.id,
        chunkText: text,
        chunkIndex: chunkIndex++,
        title,
        slug: model.slug,
      })),
    );
  }

  private buildRawPageChunks(page: AiRawPage): RagChunk[] {
    const lines = [
      `Source: ${page.source.name}`,
      `URL: ${page.url}`,
      page.device_model ? `Device model: ${page.device_model.name}` : null,
      `Status: ${page.status}`,
      page.raw_text,
      page.parsed_data ? JSON.stringify(page.parsed_data) : null,
    ].filter(Boolean);
    const title = page.device_model
      ? `${page.device_model.name} — trang nguồn`
      : page.url;

    return chunkText(lines.join("\n\n"), { maxChars: 1_600 }).map(
      (text, index) => ({
        entityType: "raw_page",
        entityId: page.id,
        chunkText: text,
        chunkIndex: index,
        title,
        slug: page.url,
      }),
    );
  }

  private resolveQuestion(
    question: string,
    rawHistory?: Array<{ role: string; content: string }>,
  ): QuestionResolution {
    const history = (rawHistory ?? [])
      .flatMap((message): AiConversationMessage[] => {
        const content = message.content?.trim();
        if (
          !content ||
          (message.role !== "user" && message.role !== "assistant")
        ) {
          return [];
        }
        return [{ role: message.role, content }];
      })
      .slice(-16);
    const priorCatalogQuestion = this.findCatalogAnchor(history);
    const isContextualFollowUp = Boolean(
      priorCatalogQuestion && this.isContextualFollowUp(question),
    );

    return {
      history,
      isContextualFollowUp,
      anchorQuestion: isContextualFollowUp ? priorCatalogQuestion : undefined,
      effectiveQuestion: isContextualFollowUp
        ? [
            `Đề bài hoặc thiết bị đã chọn từ đầu cuộc trò chuyện: ${priorCatalogQuestion}`,
            `Yêu cầu hiện tại: ${question}`,
          ].join("\n\n")
        : question,
    };
  }

  private findCatalogAnchor(history: AiConversationMessage[]) {
    let anchor: string | undefined;
    for (const message of history) {
      if (
        message.role !== "user" ||
        this.analyzeQuestion(message.content).intent === "conversation"
      ) {
        continue;
      }

      // A full, named request begins a fresh catalog topic. Implicit follow-up
      // questions keep the established anchor, even after several turns.
      if (!anchor || !this.isContextualFollowUp(message.content)) {
        anchor = message.content;
      }
    }
    return anchor;
  }

  private analyzeResolvedQuestion(
    question: string,
    resolution: QuestionResolution,
  ): QuestionAnalysis {
    const current = this.analyzeQuestion(question);
    if (!resolution.isContextualFollowUp || !resolution.anchorQuestion) {
      return current;
    }

    const anchor = this.analyzeQuestion(resolution.anchorQuestion);
    const inheritedIntent =
      current.intent === "lookup" && anchor.intent !== "conversation"
        ? anchor.intent
        : current.intent;

    return {
      ...current,
      intent: inheritedIntent,
      priorities: current.priorities.length
        ? current.priorities
        : anchor.priorities,
      useCases: current.useCases.length ? current.useCases : anchor.useCases,
    };
  }

  private isContextualFollowUp(question: string) {
    const normalized = tokenize(question).join(" ");
    const startsWithContextReference =
      /^(?:con|con ve|the con|the thi|con cai|what about|how about|and)\b/.test(
        normalized,
      );
    const containsContextReference =
      /\b(?:ca hai|hai may|2 may|cai nay|cai kia|may nay|may kia|thiet bi nay|thiet bi kia|both devices|these devices|that device)\b/.test(
        normalized,
      );
    if (startsWithContextReference || containsContextReference) return true;

    if (this.hasExplicitCatalogEntityReference(normalized)) return false;

    // Short criterion-only questions ("Giá thì sao?", "Hiệu năng?") are
    // normally a continuation.  We only activate this when a catalog anchor
    // exists, so standalone questions keep their original meaning.
    const analysis = this.analyzeQuestion(question);
    return tokenize(question).length <= 10 && analysis.priorities.length > 0;
  }

  private hasExplicitCatalogEntityReference(normalizedQuestion: string) {
    return /\b(?:iphone|ipad|macbook|galaxy|pixel|xiaomi|redmi|oppo|vivo|oneplus|realme|huawei|honor|nokia|motorola|asus|acer|dell|lenovo|thinkpad|surface|msi|qualcomm|snapdragon|mediatek|dimensity|intel|amd|ryzen|geforce|radeon|apple|samsung)\b/.test(
      normalizedQuestion,
    );
  }

  private async generateConversationAnswer(
    question: string,
    history: AiConversationMessage[],
  ) {
    try {
      return history.length
        ? await this.aiProvider.generateConversationAnswer(question, history)
        : await this.aiProvider.generateConversationAnswer(question);
    } catch (error) {
      this.logger.warn(`Conversation provider skipped: ${String(error)}`);
      return null;
    }
  }

  private async generateConversationAnswerStream(
    question: string,
    callbacks: {
      onDelta: (text: string) => void | Promise<void>;
    },
    signal: AbortSignal | undefined,
    history: AiConversationMessage[],
  ) {
    try {
      return history.length
        ? await this.aiProvider.generateConversationAnswerStream(
            question,
            callbacks,
            signal,
            history,
          )
        : await this.aiProvider.generateConversationAnswerStream(
            question,
            callbacks,
            signal,
          );
    } catch (error) {
      if (signal?.aborted) throw error;
      this.logger.warn(
        `Streaming conversation provider skipped: ${String(error)}`,
      );
      return null;
    }
  }

  private composeAnswer(
    question: string,
    chunks: RagChunk[],
    analysis: QuestionAnalysis,
  ): string {
    if (!chunks.length) {
      return [
        "## Chưa tìm thấy dữ liệu phù hợp",
        "",
        `SpecHub chưa có đủ bản ghi để trả lời chắc chắn câu hỏi “${question}”.`,
        "",
        "Bạn có thể thử ghi rõ tên thiết bị, mô-đun, chủ đề Wiki, nguồn dữ liệu hoặc tiêu chí cần tra cứu.",
      ].join("\n");
    }

    const entities = this.catalogEntities(chunks);
    if (analysis.intent === "compare" && entities.length >= 2) {
      return this.composeComparisonAnswer(
        this.orderEntitiesByMention(entities, question).slice(0, 2),
        analysis,
      );
    }
    if (
      analysis.intent === "ranking" &&
      analysis.rankingMetric &&
      entities.length
    ) {
      return this.composeRankingAnswer(entities, analysis.rankingMetric);
    }
    if (analysis.intent === "recommendation" && entities.length) {
      return this.composeRecommendationAnswer(question, entities, analysis);
    }

    return this.composeCatalogAnswer(question, entities, chunks, analysis);
  }

  private conversationResponse(
    question: string,
    topK: number,
    generated?: {
      answer: string;
      modelName: string;
      provider: "local" | "ollama" | "openai" | "anthropic";
    } | null,
  ) {
    const configuredProvider = this.aiProvider.answerProviderName;
    return {
      data: {
        question,
        answer: generated?.answer ?? this.composeConversationAnswer(question),
        citations: [],
        contexts: [],
        cached: false,
        model_name: generated?.modelName ?? LOCAL_RAG_MODEL,
        follow_up_questions: [
          "SpecHub có thể giúp tôi những gì?",
          "Tôi có thể hỏi về những loại thiết bị nào?",
          "Làm thế nào để so sánh hai thiết bị?",
        ],
        warnings:
          !generated && configuredProvider !== "local"
            ? [
                `Không thể nhận phản hồi từ ${configuredProvider === "ollama" ? "Ollama" : "model đã cấu hình"}; SpecHub đang dùng câu trả lời dự phòng nội bộ.`,
              ]
            : [],
      },
      meta: {
        source: "conversation" as RetrievalSource,
        top_k: topK,
        embedding_model: this.aiProvider.embeddingModelName,
        rag_provider: generated?.provider ?? ("local" as const),
        intent: "conversation" as AiIntent,
        contextual_follow_up: false,
        confidence: 100,
        confidence_label: "high" as AnswerConfidence,
        answer_version: AI_ANSWER_VERSION,
      },
    };
  }

  private composeConversationAnswer(question: string) {
    const normalized = tokenize(question).join(" ");
    if (/\b(cam on|thank you|thanks)\b/.test(normalized)) {
      return "Rất vui được hỗ trợ bạn! Khi cần, bạn có thể hỏi mình về thiết bị, phần cứng, benchmark hoặc nhờ so sánh các sản phẩm trong SpecHub.";
    }
    if (/\b(tam biet|bye|goodbye)\b/.test(normalized)) {
      return "Tạm biệt bạn! Khi cần tra cứu hoặc so sánh thiết bị, SpecHub AI luôn sẵn sàng hỗ trợ.";
    }
    if (/\b(ban khoe khong|khoe khong|how are you)\b/.test(normalized)) {
      return "Mình vẫn ổn và sẵn sàng hỗ trợ bạn. Hôm nay bạn muốn tra cứu hay so sánh thiết bị nào?";
    }
    if (
      /\b(giup toi duoc khong|ban giup toi duoc khong|co the giup toi khong|toi can giup do|toi can ho tro|hay giup toi|can you help me|could you help me|help me)\b/.test(
        normalized,
      )
    ) {
      return "Tất nhiên! Bạn cứ cho mình biết điều bạn đang cần. Mình có thể trả lời câu hỏi thông thường hoặc tra cứu, giải thích và so sánh dữ liệu thiết bị trong SpecHub.";
    }
    if (
      /\b(ban la ai|ai la gi|spechub ai la gi|ban ten la gi|ten ban la gi|what is your name|who are you)\b/.test(
        normalized,
      )
    ) {
      return "Mình là SpecHub AI, trợ lý tri thức giúp tìm kiếm, tổng hợp và giải thích dữ liệu về thiết bị, phần cứng, benchmark, Wiki và các nguồn đã được duyệt.";
    }
    if (
      /\b(ban co the lam gi|giup duoc gi|co the hoi gi|how can you help)\b/.test(
        normalized,
      )
    ) {
      return "Mình có thể tra cứu thông số, giải thích phần cứng, tổng hợp benchmark, so sánh thiết bị và đưa ra gợi ý dựa trên dữ liệu đã được duyệt trong SpecHub.";
    }
    return "Xin chào! Mình là trợ lý tri thức SpecHub. Bạn có thể hỏi mình về thiết bị, phần cứng, benchmark hoặc nhờ so sánh sản phẩm.";
  }

  private toCitation(chunk: RagChunk, query: string): AiCitation {
    return {
      entity_type: chunk.entityType,
      entity_id: chunk.entityId,
      title: chunk.title,
      slug: chunk.slug,
      excerpt: this.contextExcerpt(chunk, query),
      score: chunk.score,
    };
  }

  private contextExcerpt(chunk: RagChunk, query: string) {
    if (chunk.entityType !== "device_model") {
      return this.localizeContextExcerpt(makeExcerpt(chunk.chunkText, query));
    }
    const analysis = this.analyzeQuestion(query);
    const priorityLabels = analysis.priorities.flatMap((priority) => {
      const labels: Record<DecisionPriority, string[]> = {
        performance: ["Benchmarks", "CPU", "GPU", "Memory"],
        battery: ["Battery"],
        camera: ["Camera"],
        display: ["Display"],
        price: ["Launch price"],
        portability: ["Physical"],
        software: ["Software"],
        storage: ["Storage"],
      };
      return labels[priority];
    });
    const preferredLabels = priorityLabels.length
      ? ["Variant", ...new Set(priorityLabels)]
      : analysis.rankingMetric === "battery"
        ? ["Battery", "Variant", "Benchmarks"]
        : analysis.rankingMetric === "performance"
          ? ["Benchmarks", "CPU", "GPU", "Memory"]
          : analysis.rankingMetric === "price"
            ? ["Launch price", "Variant", "Benchmarks"]
            : ["Variant", "Chipset", "Benchmarks", "Display", "Battery"];
    const lines = chunk.chunkText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    const selected = preferredLabels.flatMap((label) => {
      const line = lines.find((candidate) =>
        candidate.toLowerCase().startsWith(`${label.toLowerCase()}:`),
      );
      return line ? [line] : [];
    });
    const excerpt = selected.length
      ? trimText(selected.slice(0, 3).join(" · "), 300)
      : makeExcerpt(chunk.chunkText, query);
    return this.localizeContextExcerpt(excerpt);
  }

  private scoreChunk(
    text: string,
    queryTokens: Set<string>,
    title?: string | null,
  ): number {
    if (!queryTokens.size) return 0;

    const tokens = tokenize(text);
    const tokenSet = new Set(tokens);
    const titleTokenSet = new Set(tokenize(title ?? ""));
    const uniqueMatches = [...queryTokens].filter((token) =>
      tokenSet.has(token),
    ).length;
    const titleMatches = [...queryTokens].filter((token) =>
      titleTokenSet.has(token),
    ).length;
    const coverage = uniqueMatches / queryTokens.size;
    const titleCoverage = titleMatches / queryTokens.size;
    const density = Math.min(
      1,
      tokens.filter((token) => queryTokens.has(token)).length /
        Math.max(tokens.length * 0.08, 1),
    );
    const structuredSpecBoost = /^Variant:\s+/im.test(text) ? 0.12 : 0;
    const defaultVariantBoost = /^Default variant:\s+yes$/im.test(text)
      ? 0.1
      : 0;
    const queryPhrase = [...queryTokens].join(" ");
    const titleTokens = tokenize(title ?? "");
    const titlePhrase = titleTokens.join(" ");
    const productPhrase = titleTokens.slice(1).join(" ");
    const exactTitleBoost =
      (titlePhrase.length > 2 && queryPhrase.includes(titlePhrase)) ||
      (productPhrase.length > 2 && queryPhrase.includes(productPhrase))
        ? 0.28
        : 0;

    return Math.min(
      1,
      coverage * 0.65 +
        titleCoverage * 0.3 +
        density * 0.05 +
        structuredSpecBoost +
        defaultVariantBoost +
        exactTitleBoost,
    );
  }

  private meaningfulQueryTerms(query: string): string[] {
    return this.normalizeDeviceQuery(query)
      .split(" ")
      .filter((term) => term.length > 1 && !QUERY_STOP_WORDS.has(term))
      .slice(0, 12);
  }

  private normalizeDeviceQuery(query: string) {
    const tokens = tokenize(query.replace(/(\d)\s*\+/g, "$1 plus"));
    return tokens
      .flatMap((token) => {
        const compactProMax = token.match(/^(\d{1,2})(?:prm|promax|pm)$/);
        if (compactProMax) return [compactProMax[1]!, "pro", "max"];
        const compactPlus = token.match(/^(\d{1,2})(?:plus|pls)$/);
        if (compactPlus) return [compactPlus[1]!, "plus"];
        return DEVICE_QUERY_TOKEN_ALIASES[token] ?? [token];
      })
      .join(" ");
  }

  private mentionTokenPhrases(value: string) {
    const tokens = tokenize(value);
    const phrases = [tokens];
    if (tokens.length > 1) phrases.push(tokens.slice(1));
    if (
      tokens.length > 2 &&
      !DEVICE_FAMILY_QUERY_TOKENS.has(tokens[0]!) &&
      DEVICE_FAMILY_QUERY_TOKENS.has(tokens[1]!)
    ) {
      phrases.push(tokens.slice(2));
    }
    return phrases.filter(
      (phrase, index, phrases) =>
        phrase.length > 0 &&
        phrases.findIndex(
          (candidate) => candidate.join(" ") === phrase.join(" "),
        ) === index,
    );
  }

  private analyzeQuestion(question: string): QuestionAnalysis {
    const normalized = tokenize(question).join(" ");
    if (this.isConversationQuestion(normalized)) {
      return {
        intent: "conversation",
        priorities: [],
        useCases: [],
      };
    }
    const useCases = this.detectUseCases(normalized);
    const priorities = this.detectPriorities(normalized, useCases);
    const baseAnalysis = { priorities, useCases };
    if (/\b(so sanh|doi dau|compare|versus|vs)\b/.test(normalized)) {
      return { intent: "compare", ...baseAnalysis };
    }

    const superlative =
      /\b(lon nhat|cao nhat|tot nhat|manh nhat|re nhat|nhe nhat|thap nhat|dat nhat|largest|biggest|best|fastest|cheapest|lightest|highest|lowest)\b/.test(
        normalized,
      );
    if (superlative && /\b(pin|battery)\b/.test(normalized)) {
      return {
        intent: "ranking",
        rankingMetric: "battery",
        rankingMode: "max",
        ...baseAnalysis,
      };
    }
    if (
      superlative &&
      /\b(hieu nang|performance|benchmark|manh)\b/.test(normalized)
    ) {
      return {
        intent: "ranking",
        rankingMetric: "performance",
        rankingMode: "max",
        ...baseAnalysis,
      };
    }
    if (superlative && /\b(tan so quet|refresh|hz)\b/.test(normalized)) {
      return {
        intent: "ranking",
        rankingMetric: "refresh_rate",
        rankingMode: "max",
        ...baseAnalysis,
      };
    }
    if (
      superlative &&
      /\b(khoi luong|can nang|nhe|weight)\b/.test(normalized)
    ) {
      return {
        intent: "ranking",
        rankingMetric: "weight",
        rankingMode: "min",
        ...baseAnalysis,
      };
    }
    if (superlative && /\b(gia|price|re|dat)\b/.test(normalized)) {
      return {
        intent: "ranking",
        rankingMetric: "price",
        rankingMode: /\b(dat nhat|cao nhat|highest)\b/.test(normalized)
          ? "max"
          : "min",
        ...baseAnalysis,
      };
    }
    if (
      /\b(nen mua|tu van|phu hop|goi y|recommend|recommendation|should buy)\b/.test(
        normalized,
      )
    ) {
      return { intent: "recommendation", ...baseAnalysis };
    }
    if (
      (superlative && priorities.length > 0) ||
      (useCases.length > 0 &&
        /\b(may nao|thiet bi nao|chon|mua|goi y|which)\b/.test(normalized))
    ) {
      return { intent: "recommendation", ...baseAnalysis };
    }
    return { intent: "lookup", ...baseAnalysis };
  }

  private isConversationQuestion(normalized: string) {
    return (
      /^(xin chao|xin chao ban|chao|chao ban|chao spechub|chao buoi sang|chao buoi toi|hello|hi|hey|alo|cam on|cam on ban|thanks|thank you|tam biet|bye|goodbye)$/.test(
        normalized,
      ) ||
      /\b(ban la ai|ai la gi|spechub ai la gi|ban ten la gi|ten ban la gi|what is your name|who are you|ban co the lam gi|giup duoc gi|co the hoi gi|how can you help|giup toi duoc khong|ban giup toi duoc khong|co the giup toi khong|toi can giup do|toi can ho tro|hay giup toi|can you help me|could you help me|help me|ban khoe khong|khoe khong|how are you)\b/.test(
        normalized,
      ) ||
      !this.hasCatalogQuestionSignal(normalized)
    );
  }

  private isHardwareUsageQuestion(question: string) {
    const normalized = tokenize(question).join(" ");
    const asksForDevices =
      /\b(?:thiet bi nao|may nao|dien thoai nao|laptop nao|tablet nao|which devices?|devices? use|used in|products? use)\b/.test(
        normalized,
      );
    const mentionsHardware =
      /\b(?:chip|chipset|cpu|gpu|npu|soc|snapdragon|dimensity|exynos|ryzen|intel|geforce|radeon)\b/.test(
        normalized,
      );
    return asksForDevices && mentionsHardware;
  }

  private hardwareUsageTerms(question: string) {
    return this.meaningfulQueryTerms(question).filter(
      (term) => !HARDWARE_USAGE_QUERY_TOKENS.has(term),
    );
  }

  private filterHardwareUsageChunks(chunks: RagChunk[], question: string) {
    const terms = this.hardwareUsageTerms(question);
    if (!terms.length) return [];

    return chunks.filter((chunk) => {
      if (chunk.entityType !== "device_model") return false;
      const evidence = ["Chipset", "CPU", "GPU", "NPU"]
        .map((field) => this.extractField(chunk.chunkText, field))
        .filter(Boolean)
        .join(" ");
      const evidenceTokens = new Set(tokenize(evidence));
      return terms.every((term) => evidenceTokens.has(term));
    });
  }

  private hasCatalogQuestionSignal(normalized: string) {
    return /\b(thiet bi|device|model|mau may|san pham|dien thoai|phone|smartphone|laptop|tablet|may tinh|dong ho|tai nghe|phan cung|hardware|mo dun|module|chip|chipset|cpu|gpu|npu|ram|bo nho|storage|ssd|man hinh|display|oled|amoled|lcd|pin|battery|sac|charging|camera|benchmark|geekbench|antutu|hieu nang|performance|tan so quet|refresh rate|gia|price|mua|recommend|tu van|so sanh|compare|versus|wiki|nguon du lieu|catalog|danh muc|thong so|spec|cau hinh|iphone|ipad|macbook|galaxy|pixel|xiaomi|redmi|oppo|vivo|oneplus|realme|huawei|honor|nokia|motorola|asus|acer|dell|lenovo|thinkpad|surface|msi|qualcomm|snapdragon|mediatek|dimensity|intel|amd|ryzen|geforce|radeon|apple|samsung)\b/.test(
      normalized,
    );
  }

  private detectUseCases(normalizedQuestion: string): DeviceUseCase[] {
    const detected: DeviceUseCase[] = [];
    const add = (useCase: DeviceUseCase, pattern: RegExp) => {
      if (pattern.test(normalizedQuestion)) detected.push(useCase);
    };

    add("gaming", /\b(game|gaming|choi game|esport|fps|do hoa nang)\b/);
    add(
      "photography",
      /\b(camera|chup anh|quay phim|video|zoom|chan dung|vlog)\b/,
    );
    add(
      "productivity",
      /\b(cong viec|lam viec|van phong|hoc tap|lap trinh|productivity|office)\b/,
    );
    add("travel", /\b(du lich|di chuyen|cong tac|travel|nhe gon|nho gon)\b/);
    add(
      "long_term",
      /\b(lau dai|ben lau|cap nhat lau|dung nhieu nam|long term|future proof)\b/,
    );
    add(
      "value",
      /\b(gia tri|dang tien|tiet kiem|sinh vien|gia tot|value|budget)\b/,
    );

    return [...new Set(detected)];
  }

  private detectPriorities(
    normalizedQuestion: string,
    useCases: DeviceUseCase[],
  ): DecisionPriority[] {
    const detected: DecisionPriority[] = [];
    const add = (priority: DecisionPriority, pattern: RegExp) => {
      if (pattern.test(normalizedQuestion)) detected.push(priority);
    };

    add(
      "performance",
      /\b(hieu nang|benchmark|cpu|gpu|npu|manh|nhanh|performance)\b/,
    );
    add("battery", /\b(pin|thoi luong|sac|battery|charging)\b/);
    add(
      "camera",
      /\b(camera|chup anh|quay phim|video|zoom|chan dung|megapixel)\b/,
    );
    add(
      "display",
      /\b(man hinh|tan so quet|do sang|oled|refresh|display|hz)\b/,
    );
    const normalizedWithoutReviewPhrase = normalizedQuestion.replace(
      /\b(danh gia|review)\b/g,
      " ",
    );
    if (
      /\b(gia|ngan sach|re|dat|price|budget|dang tien)\b/.test(
        normalizedWithoutReviewPhrase,
      )
    ) {
      detected.push("price");
    }
    add(
      "portability",
      /\b(nhe|nho gon|di chuyen|du lich|khoi luong|weight|portable)\b/,
    );
    add(
      "software",
      /\b(phan mem|cap nhat|bao mat|he dieu hanh|software|update|os)\b/,
    );
    add("storage", /\b(luu tru|bo nho trong|dung luong|the nho|storage)\b/);

    const useCasePriorities: Record<DeviceUseCase, DecisionPriority[]> = {
      gaming: ["performance", "display", "battery"],
      photography: ["camera", "storage", "battery"],
      productivity: ["performance", "battery", "software", "portability"],
      travel: ["battery", "portability", "camera"],
      long_term: ["software", "performance", "battery"],
      value: ["price", "performance", "battery"],
    };
    for (const useCase of useCases) {
      detected.push(...useCasePriorities[useCase]);
    }

    return [...new Set(detected)];
  }

  private rankModelsForQuestion(
    models: AiDeviceModel[],
    analysis: QuestionAnalysis,
    question: string,
  ) {
    if (analysis.intent === "compare") {
      return [...models].sort(
        (left, right) =>
          this.modelMentionScore(right, question) -
          this.modelMentionScore(left, question),
      );
    }
    if (
      analysis.intent === "recommendation" &&
      analysis.priorities.length > 0
    ) {
      return this.rankModelsForRecommendation(
        models,
        analysis.priorities,
        question,
      );
    }
    if (analysis.intent === "recommendation") {
      return [...models].sort(
        (left, right) =>
          this.modelMentionScore(right, question) -
          this.modelMentionScore(left, question),
      );
    }
    if (!analysis.rankingMetric) return models;
    const mode = analysis.rankingMode ?? "max";
    const performanceBenchmarkKey =
      analysis.rankingMetric === "performance"
        ? this.sharedPerformanceBenchmarkKey(models)
        : undefined;

    return [...models].sort((left, right) => {
      const leftValue = this.modelRankingValue(
        left,
        analysis.rankingMetric!,
        performanceBenchmarkKey,
      );
      const rightValue = this.modelRankingValue(
        right,
        analysis.rankingMetric!,
        performanceBenchmarkKey,
      );
      if (leftValue === undefined && rightValue === undefined) return 0;
      if (leftValue === undefined) return 1;
      if (rightValue === undefined) return -1;
      return mode === "max" ? rightValue - leftValue : leftValue - rightValue;
    });
  }

  private rankModelsForRecommendation(
    models: AiDeviceModel[],
    priorities: DecisionPriority[],
    question: string,
  ) {
    const sharedBenchmarkKey = this.sharedPerformanceBenchmarkKey(models);
    const scores = new Map<string, { points: number; weight: number }>();

    priorities.forEach((priority, priorityIndex) => {
      const direction =
        priority === "price" || priority === "portability" ? "min" : "max";
      const values = models
        .map((model) => ({
          model,
          value: this.modelDecisionValue(model, priority, sharedBenchmarkKey),
        }))
        .filter(
          (
            entry,
          ): entry is {
            model: AiDeviceModel;
            value: number;
          } => entry.value !== undefined,
        );
      if (!values.length) return;
      const minimum = Math.min(...values.map(({ value }) => value));
      const maximum = Math.max(...values.map(({ value }) => value));
      const priorityWeight = Math.max(1, priorities.length - priorityIndex);

      for (const { model, value } of values) {
        const normalized =
          maximum === minimum
            ? 0.5
            : direction === "max"
              ? (value - minimum) / (maximum - minimum)
              : (maximum - value) / (maximum - minimum);
        const current = scores.get(model.id) ?? { points: 0, weight: 0 };
        current.points += normalized * priorityWeight;
        current.weight += priorityWeight;
        scores.set(model.id, current);
      }
    });

    const totalWeight = priorities.reduce(
      (sum, _, index) => sum + Math.max(1, priorities.length - index),
      0,
    );
    const score = (model: AiDeviceModel) => {
      const current = scores.get(model.id);
      const mentionScore = this.modelMentionScore(model, question);
      if (!current || !totalWeight) return mentionScore * 2 - 1;
      const evidenceCompleteness = current.weight / totalWeight;
      return (
        mentionScore * 2 +
        (current.points / current.weight) * (0.65 + evidenceCompleteness * 0.35)
      );
    };

    return [...models].sort(
      (left, right) =>
        score(right) - score(left) ||
        Number(right.release_date ?? 0) - Number(left.release_date ?? 0),
    );
  }

  private modelMentionScore(model: AiDeviceModel, question: string) {
    const questionTokens = new Set(
      this.normalizeDeviceQuery(question).split(" "),
    );
    const exactMentionLength = this.modelExplicitMentionLength(model, question);
    const identityTokens = new Set(
      tokenize(
        [
          model.name,
          model.product_family.name,
          model.product_family.brand_org.name,
          model.product_family.brand_org.short_name,
        ]
          .filter(Boolean)
          .join(" "),
      ).filter((token) => token.length > 1),
    );
    if (!identityTokens.size) return 0;
    const matches = [...identityTokens].filter((token) =>
      questionTokens.has(token),
    ).length;
    return exactMentionLength * 10 + matches / identityTokens.size;
  }

  private focusExplicitLookupModels(models: AiDeviceModel[], question: string) {
    const scores = models.map((model) => ({
      model,
      score: this.modelExplicitMentionLength(model, question),
    }));
    const strongest = Math.max(0, ...scores.map(({ score }) => score));
    return strongest
      ? scores
          .filter(({ score }) => score === strongest)
          .map(({ model }) => model)
      : models;
  }

  private modelExplicitMentionLength(model: AiDeviceModel, question: string) {
    const normalizedQuestion = this.normalizeDeviceQuery(question);
    const brand =
      model.product_family.brand_org.short_name ??
      model.product_family.brand_org.name;
    return [model.name, `${brand} ${model.name}`]
      .flatMap((value) => this.mentionTokenPhrases(value))
      .reduce((longest, tokens) => {
        return normalizedQuestion.includes(tokens.join(" "))
          ? Math.max(longest, tokens.length)
          : longest;
      }, 0);
  }

  private modelDecisionValue(
    model: AiDeviceModel,
    priority: DecisionPriority,
    sharedBenchmarkKey?: string,
  ): number | undefined {
    const variant = model.device_variants[0];
    if (!variant) return undefined;
    if (priority === "performance") {
      return this.modelRankingValue(model, "performance", sharedBenchmarkKey);
    }
    if (priority === "battery") {
      return this.modelRankingValue(model, "battery");
    }
    if (priority === "price") {
      return this.modelRankingValue(model, "price");
    }
    if (priority === "display") {
      return this.modelRankingValue(model, "refresh_rate");
    }
    if (priority === "portability") {
      return this.modelRankingValue(model, "weight");
    }
    if (priority === "storage") {
      const capacities = variant.variant_storage_configs.map(
        (storage) => storage.total_capacity_gb,
      );
      return capacities.length ? Math.max(...capacities) : undefined;
    }
    if (priority === "software") {
      const support = variant.variant_operating_systems.map((system) =>
        Math.max(
          system.promised_security_years ?? 0,
          system.promised_major_updates ?? 0,
        ),
      );
      return support.length ? Math.max(...support) : undefined;
    }

    const cameras = variant.variant_camera_systems.flatMap(
      (system) => system.variant_camera_modules,
    );
    if (!cameras.length) return undefined;
    return cameras.reduce((score, link) => {
      const camera = link.camera_module;
      return (
        score +
        (this.optionalNumber(camera.effective_megapixel) ?? 0) +
        (camera.has_ois ? 12 : 0) +
        (this.optionalNumber(camera.optical_zoom) ?? 0) * 8
      );
    }, 0);
  }

  private modelRankingValue(
    model: AiDeviceModel,
    metric: RankingMetric,
    performanceBenchmarkKey?: string,
  ) {
    const variant = model.device_variants[0];
    if (!variant) return undefined;

    if (metric === "battery") {
      return variant.variant_batteries[0]?.battery_unit.capacity_mah;
    }
    if (metric === "price") {
      return this.optionalNumber(variant.launch_price);
    }
    if (metric === "refresh_rate") {
      return (
        variant.variant_displays[0]?.display_unit.refresh_rate_hz ?? undefined
      );
    }
    if (metric === "weight") {
      return this.optionalNumber(variant.variant_physical_specs?.weight_g);
    }
    if (!performanceBenchmarkKey) return undefined;
    const benchmark = variant.device_variant_benchmarks.find(
      (result) =>
        this.performanceBenchmarkKey(result) === performanceBenchmarkKey,
    );
    if (!benchmark) return undefined;
    const score = this.optionalNumber(benchmark.score);
    if (score === undefined) return undefined;
    return benchmark.benchmark.higher_is_better ? score : -score;
  }

  private sharedPerformanceBenchmarkKey(models: AiDeviceModel[]) {
    const coverage = new Map<string, number>();

    for (const model of models) {
      const variant = model.device_variants[0];
      if (!variant) continue;
      const keys = new Set(
        variant.device_variant_benchmarks.map((result) =>
          this.performanceBenchmarkKey(result),
        ),
      );
      for (const key of keys) {
        coverage.set(key, (coverage.get(key) ?? 0) + 1);
      }
    }

    return [...coverage.entries()]
      .filter(([, count]) => count >= 2)
      .sort(
        ([leftKey, leftCount], [rightKey, rightCount]) =>
          rightCount - leftCount ||
          this.performanceBenchmarkPriority(leftKey) -
            this.performanceBenchmarkPriority(rightKey),
      )[0]?.[0];
  }

  private performanceBenchmarkKey(
    result: AiDeviceModel["device_variants"][number]["device_variant_benchmarks"][number],
  ) {
    return [
      result.benchmark.slug,
      result.benchmark.version ?? "",
      (result.subscore_name ?? "overall").toLowerCase(),
    ].join(":");
  }

  private performanceBenchmarkPriority(key: string) {
    if (key.includes("antutu") && /(?:overall|total|tong)(?::|$)/.test(key)) {
      return 0;
    }
    if (
      key.includes("geekbench") &&
      /(?:multi[_-]core|da[_-]nhan)(?::|$)/.test(key)
    ) {
      return 10;
    }
    if (
      key.includes("geekbench") &&
      /(?:single[_-]core|don[_-]nhan)(?::|$)/.test(key)
    ) {
      return 11;
    }
    if (key.includes("3dmark")) return 20;
    return 50;
  }

  private mergeHybridChunks(
    vectorChunks: RagChunk[],
    catalogChunks: RagChunk[],
    topK: number,
  ) {
    const fused = new Map<
      string,
      { chunk: RagChunk; fusionScore: number; bestScore: number }
    >();
    const add = (chunks: RagChunk[], weight: number) => {
      chunks.forEach((chunk, index) => {
        const key = `${chunk.entityType}:${chunk.entityId}:${chunk.chunkIndex}`;
        const current = fused.get(key) ?? {
          chunk,
          fusionScore: 0,
          bestScore: 0,
        };
        current.fusionScore += weight / (20 + index + 1);
        current.bestScore = Math.max(
          current.bestScore,
          Math.max(0, Math.min(1, Number(chunk.score ?? 0))),
        );
        if ((chunk.score ?? 0) > (current.chunk.score ?? 0)) {
          current.chunk = chunk;
        }
        fused.set(key, current);
      });
    };
    // Exact device lookups are handled before hybrid retrieval. For the
    // remaining knowledge questions, semantic evidence must be allowed to
    // outrank a merely token-matched device row.
    add(catalogChunks, 0.4);
    add(vectorChunks, 0.6);
    const maxFusion = 1 / 21;
    const ranked = [...fused.values()]
      .sort(
        (left, right) =>
          right.fusionScore - left.fusionScore ||
          right.bestScore - left.bestScore,
      )
      .map(({ chunk, fusionScore, bestScore }) => ({
        ...chunk,
        score: Math.min(1, (fusionScore / maxFusion) * 0.8 + bestScore * 0.2),
      }));

    return this.diversifyChunks(ranked, topK);
  }

  private diversifyChunks(chunks: RagChunk[], limit: number) {
    const selected: RagChunk[] = [];
    const seenEntities = new Set<string>();

    for (const chunk of chunks) {
      const key = `${chunk.entityType}:${chunk.entityId}`;
      if (seenEntities.has(key)) continue;
      selected.push(chunk);
      seenEntities.add(key);
      if (selected.length >= limit) return selected;
    }
    for (const chunk of chunks) {
      if (selected.includes(chunk)) continue;
      selected.push(chunk);
      if (selected.length >= limit) break;
    }
    return selected;
  }

  private catalogEntities(chunks: RagChunk[]): CatalogEntity[] {
    const entities = new Map<string, CatalogEntity>();
    chunks.forEach((chunk, index) => {
      if (chunk.entityType !== "device_model") return;
      const current = entities.get(chunk.entityId);
      if (current) {
        current.text = `${current.text}\n${chunk.chunkText}`;
        return;
      }
      entities.set(chunk.entityId, {
        entityId: chunk.entityId,
        title: chunk.title ?? chunk.entityId,
        citation: index + 1,
        text: chunk.chunkText,
      });
    });
    return [...entities.values()];
  }

  private focusChunks(
    question: string,
    analysis: QuestionAnalysis,
    chunks: RagChunk[],
    topK: number,
  ) {
    if (analysis.intent === "lookup") {
      return (
        this.focusExplicitLookupChunks(question, chunks, topK) ??
        chunks.slice(0, topK)
      );
    }
    if (analysis.intent !== "compare") return chunks.slice(0, topK);
    const entities = this.selectComparisonEntities(
      this.catalogEntities(chunks),
      question,
    );
    return entities.flatMap((entity) => {
      const entityChunks = chunks
        .filter(
          (candidate) =>
            candidate.entityType === "device_model" &&
            candidate.entityId === entity.entityId,
        )
        .sort((left, right) => left.chunkIndex - right.chunkIndex)
        .slice(0, Math.max(2, Math.ceil(topK / 2)));
      const first = entityChunks[0];
      if (!first) return [];

      return [
        {
          ...first,
          chunkIndex: 0,
          chunkText: entityChunks.map((chunk) => chunk.chunkText).join("\n"),
          score: Math.max(
            ...entityChunks.map((chunk) => Number(chunk.score ?? 0)),
          ),
        },
      ];
    });
  }

  private focusExplicitLookupChunks(
    question: string,
    chunks: RagChunk[],
    topK: number,
  ): RagChunk[] | null {
    const entities = this.catalogEntities(chunks);
    const target = this.selectMentionedEntities(entities, question, 1)[0];
    if (!target) return null;
    const normalizedQuestion = this.normalizeDeviceQuery(question);
    if (this.entityMentionStrength(target.title, normalizedQuestion) === 0) {
      return null;
    }

    const targetChunks = chunks
      .filter(
        (chunk) =>
          chunk.entityType === "device_model" &&
          chunk.entityId === target.entityId,
      )
      .sort((left, right) => left.chunkIndex - right.chunkIndex)
      .slice(0, topK);
    const first = targetChunks[0];
    if (!first) return null;

    return [
      {
        ...first,
        chunkIndex: 0,
        chunkText: targetChunks.map((chunk) => chunk.chunkText).join("\n"),
        score: Math.max(
          ...targetChunks.map((chunk) => Number(chunk.score ?? 0)),
        ),
      },
    ];
  }

  private selectMentionedEntities(
    entities: CatalogEntity[],
    question: string,
    limit: number,
  ) {
    const normalizedQuestion = this.normalizeDeviceQuery(question);
    const selected = [...entities]
      .sort(
        (left, right) =>
          this.entityMentionStrength(right.title, normalizedQuestion) -
          this.entityMentionStrength(left.title, normalizedQuestion),
      )
      .slice(0, limit);
    return this.orderEntitiesByMention(selected, question);
  }

  private selectComparisonEntities(
    entities: CatalogEntity[],
    question: string,
  ) {
    const segments = this.normalizeDeviceQuery(question)
      .split(/\b(?:and|hay|va|versus|voi|vs|with)\b/)
      .map((segment) => segment.trim())
      .filter(Boolean)
      .slice(0, 2);
    const selected: CatalogEntity[] = [];

    for (const segment of segments) {
      const candidate = entities
        .filter((entity) => !selected.includes(entity))
        .map((entity) => ({
          entity,
          strength: this.entityMentionStrength(entity.title, segment),
          position: this.entityMentionPosition(entity.title, segment),
        }))
        .filter(({ strength }) => strength > 0)
        .sort(
          (left, right) =>
            right.strength - left.strength || left.position - right.position,
        )[0]?.entity;
      if (candidate) selected.push(candidate);
    }

    if (selected.length < 2) {
      const fallback = this.selectMentionedEntities(entities, question, 2);
      for (const entity of fallback) {
        if (!selected.includes(entity)) selected.push(entity);
        if (selected.length === 2) break;
      }
    }
    return selected.slice(0, 2);
  }

  private orderEntitiesByMention(entities: CatalogEntity[], question: string) {
    const normalizedQuestion = this.normalizeDeviceQuery(question);
    return [...entities].sort((left, right) => {
      return (
        this.entityMentionPosition(left.title, normalizedQuestion) -
        this.entityMentionPosition(right.title, normalizedQuestion)
      );
    });
  }

  private entityMentionPosition(title: string, normalizedQuestion: string) {
    const phrases = this.mentionTokenPhrases(title)
      .map((tokens) => tokens.join(" "))
      .filter((phrase) => phrase.length > 1);
    const positions = phrases
      .map((phrase) => normalizedQuestion.indexOf(phrase))
      .filter((position) => position >= 0);
    return positions.length ? Math.min(...positions) : Number.MAX_SAFE_INTEGER;
  }

  private entityMentionStrength(title: string, normalizedQuestion: string) {
    const phrases = this.mentionTokenPhrases(title);
    return phrases.reduce((strongest, phrase) => {
      return normalizedQuestion.includes(phrase.join(" "))
        ? Math.max(strongest, phrase.length)
        : strongest;
    }, 0);
  }

  private composeComparisonAnswer(
    entities: CatalogEntity[],
    analysis: QuestionAnalysis,
  ) {
    const [left, right] = entities;
    if (!left || !right) return "";
    const criteria = [
      ["Giá ra mắt", ["price"], "Launch price"],
      ["Chipset", ["performance"], "Chipset"],
      ["CPU", ["performance"], "CPU"],
      ["GPU / NPU", ["performance"], "GPU", "NPU"],
      ["RAM", ["performance"], "Memory"],
      ["Lưu trữ", ["storage"], "Storage"],
      ["Benchmark", ["performance"], "Benchmarks"],
      ["Màn hình", ["display"], "Display"],
      ["Pin", ["battery"], "Battery"],
      ["Camera", ["camera"], "Camera"],
      ["Phần mềm", ["software"], "Software"],
      ["Kích thước / khối lượng", ["portability"], "Physical"],
    ] as const;
    const relevantCriteria = analysis.priorities.length
      ? criteria.filter(([, priorities]) =>
          priorities.some((priority) =>
            analysis.priorities.includes(priority as DecisionPriority),
          ),
        )
      : criteria;
    const rows = relevantCriteria.flatMap(([label, , ...fields]) => {
      const leftValue = fields
        .map((field) => this.extractField(left.text, field))
        .filter(Boolean)
        .join("; ");
      const rightValue = fields
        .map((field) => this.extractField(right.text, field))
        .filter(Boolean)
        .join("; ");
      return leftValue || rightValue
        ? [
            `| ${label} | ${this.markdownCell(leftValue)} | ${this.markdownCell(rightValue)} |`,
          ]
        : [];
    });
    const highlights = this.comparisonHighlights(
      left,
      right,
      analysis.priorities,
    );

    return [
      "## So sánh nhanh",
      "",
      `Đối chiếu **${left.title}** [${left.citation}] và **${right.title}** [${right.citation}] từ dữ liệu cấu hình hiện có:`,
      "",
      `| Tiêu chí | ${this.markdownCell(left.title)} | ${this.markdownCell(right.title)} |`,
      "|---|---|---|",
      ...rows,
      "",
      "## Điểm đáng chú ý",
      "",
      ...(highlights.length
        ? highlights.map((highlight) => `- ${highlight}`)
        : [
            "- Dữ liệu hiện tại đủ để đối chiếu thông số, nhưng chưa đủ phép đo chung để kết luận tuyệt đối.",
          ]),
      "",
      "> Hiệu năng chỉ được kết luận khi hai thiết bị có cùng benchmark, cùng phiên bản và cùng hạng mục. Điểm cấu hình nội bộ không được dùng thay kết quả đo.",
      "",
      this.comparisonVerdict(left, right, analysis, highlights),
    ].join("\n");
  }

  private composeRankingAnswer(
    entities: CatalogEntity[],
    metric: RankingMetric,
  ) {
    const field = this.rankingField(metric);
    const label = this.rankingLabel(metric);
    const rows = entities.slice(0, 5).map((entity, index) => {
      const value = this.extractField(entity.text, field);
      return `| ${index + 1} | **${this.markdownCell(entity.title)}** [${entity.citation}] | ${this.markdownCell(value)} |`;
    });
    const leader = entities[0];

    return [
      `## Xếp hạng theo ${label.toLowerCase()}`,
      "",
      leader
        ? `Bản ghi đang dẫn đầu là **${leader.title}** [${leader.citation}] theo dữ liệu hiện có trong SpecHub.`
        : "Chưa xác định được thiết bị dẫn đầu.",
      "",
      `| Hạng | Thiết bị | ${label} |`,
      "|---:|---|---|",
      ...rows,
      "",
      "> Kết quả chỉ xếp hạng các phiên bản có dữ liệu tương ứng và sử dụng phiên bản mặc định của mỗi mẫu máy.",
    ].join("\n");
  }

  private composeCatalogAnswer(
    question: string,
    entities: CatalogEntity[],
    chunks: RagChunk[],
    analysis: QuestionAnalysis,
  ) {
    if (!entities.length) {
      const excerpts = chunks
        .slice(0, 3)
        .map(
          (chunk, index) =>
            `- **${chunk.title ?? chunk.entityId}** [${index + 1}]: ${makeExcerpt(
              chunk.chunkText,
              question,
              240,
            )}`,
        );
      return ["## Kết quả tra cứu", "", ...excerpts].join("\n");
    }

    if (this.isHardwareUsageQuestion(question)) {
      const terms = this.hardwareUsageTerms(question);
      const matches = entities.filter((entity) => {
        const evidence = ["Chipset", "CPU", "GPU", "NPU"]
          .map((field) => this.extractField(entity.text, field))
          .filter(Boolean)
          .join(" ");
        const evidenceTokens = new Set(tokenize(evidence));
        return terms.every((term) => evidenceTokens.has(term));
      });
      if (matches.length) return this.composeHardwareUsageAnswer(matches);
    }

    if (entities.length === 1 && analysis.priorities.length === 0) {
      return this.composeDeviceOverview(entities[0]);
    }

    const requestedFields = this.answerFields(analysis.priorities);
    const sections = entities.slice(0, 4).flatMap((entity) => {
      const details = requestedFields
        .map(([label, field]) => [label, this.extractField(entity.text, field)])
        .filter((item): item is [string, string] => Boolean(item[1]));
      return [
        `### ${entity.title} [${entity.citation}]`,
        "",
        ...details
          .slice(0, 6)
          .map(([label, value]) => `- **${label}:** ${value}`),
        "",
      ];
    });

    return [
      analysis.priorities.length
        ? "## Trả lời theo tiêu chí bạn quan tâm"
        : "## Kết quả từ danh mục SpecHub",
      "",
      ...sections,
      ...this.lookupInterpretations(entities, analysis),
      analysis.priorities.length
        ? "Các nhận định trên chỉ dựa vào trường dữ liệu có trong SpecHub; phần còn thiếu không được suy đoán."
        : "Nếu mục tiêu là chọn mua, hãy cho biết nhu cầu chính và ngân sách để mình cân nhắc đánh đổi thay vì chỉ liệt kê thông số.",
    ].join("\n");
  }

  private composeHardwareUsageAnswer(entities: CatalogEntity[]) {
    return [
      "## Thiết bị dùng phần cứng được hỏi",
      "",
      `SpecHub tìm thấy ${entities.length} thiết bị có mô-đun phần cứng khớp trực tiếp với câu hỏi.`,
      "",
      ...entities.slice(0, 10).map((entity) => {
        const chipset = this.extractField(entity.text, "Chipset");
        return `- **${entity.title}** — ${chipset ? `Chipset: ${chipset}` : "Đã có bản ghi mô-đun phần cứng khớp"} [${entity.citation}]`;
      }),
      "",
      "Danh sách chỉ gồm các model có liên kết phần cứng phù hợp trong dữ liệu SpecHub hiện có.",
    ].join("\n");
  }

  private composeDeviceOverview(entity: CatalogEntity) {
    const citation = `[${entity.citation}]`;
    const details = [
      ["Chipset", this.extractField(entity.text, "Chipset")],
      ["CPU", this.extractField(entity.text, "CPU")],
      [
        "GPU / NPU",
        [
          this.extractField(entity.text, "GPU"),
          this.extractField(entity.text, "NPU"),
        ]
          .filter(Boolean)
          .join("; "),
      ],
      ["RAM", this.extractField(entity.text, "Memory")],
      ["Lưu trữ", this.extractField(entity.text, "Storage")],
      ["Benchmark", this.extractField(entity.text, "Benchmarks")],
      ["Màn hình", this.extractField(entity.text, "Display")],
      ["Pin và sạc", this.extractField(entity.text, "Battery")],
      ["Camera", this.extractField(entity.text, "Camera")],
      ["Phần mềm", this.extractField(entity.text, "Software")],
      ["Thiết kế", this.extractField(entity.text, "Physical")],
      ["Giá ra mắt", this.extractField(entity.text, "Launch price")],
    ].filter((item): item is [string, string] => Boolean(item[1]));
    const interpretationNotes: string[] = [];
    if (this.extractField(entity.text, "Battery")) {
      interpretationNotes.push(
        `Dung lượng mAh cho biết kích thước pin, không tự nó chứng minh thời lượng sử dụng thực tế ${citation}.`,
      );
    }
    if (this.extractField(entity.text, "Camera")) {
      interpretationNotes.push(
        `Thông số MP, khẩu độ, OIS và zoom mô tả phần cứng; chất lượng ảnh thực tế còn cần phép thử chung ${citation}.`,
      );
    }

    return [
      `## ${entity.title}: tổng quan nhanh`,
      "",
      `SpecHub hiện có các thông tin chính sau cho đúng model **${entity.title}** ${citation}:`,
      "",
      ...details.map(
        ([label, value]) => `- **${label}:** ${value} ${citation}`,
      ),
      ...(interpretationNotes.length
        ? [
            "",
            "## Cách hiểu nhanh",
            "",
            ...interpretationNotes.map((note) => `- ${note}`),
          ]
        : []),
      "",
      "Nếu bạn đang cân nhắc mua máy, hãy cho biết ngân sách và nhu cầu chính để mình đánh giá các điểm mạnh, hạn chế và lựa chọn thay thế phù hợp.",
    ].join("\n");
  }

  private composeRecommendationAnswer(
    question: string,
    entities: CatalogEntity[],
    analysis: QuestionAnalysis,
  ) {
    const candidates = this.orderEntitiesByMention(entities, question).slice(
      0,
      3,
    );
    const priorities = analysis.priorities.length
      ? analysis.priorities
      : ([
          "price",
          "performance",
          "battery",
          "camera",
        ] satisfies DecisionPriority[]);
    const fields = this.answerFields(priorities).slice(0, 5);
    const header = candidates
      .map((candidate) => this.markdownCell(candidate.title))
      .join(" | ");
    const rows = fields.map(([label, field]) => {
      const values = candidates.map((candidate) =>
        this.markdownCell(this.extractField(candidate.text, field)),
      );
      return `| ${label} | ${values.join(" | ")} |`;
    });
    const divider = ["---", ...candidates.map(() => "---")].join("|");
    const [left, right] = candidates;
    const tradeoffs =
      left && right
        ? this.comparisonHighlights(left, right, priorities).slice(0, 5)
        : [];
    const provisionalWinner =
      left && right
        ? this.provisionalRecommendation(left, right, priorities)
        : null;

    return [
      "## Gợi ý ngắn",
      "",
      provisionalWinner ??
        (candidates[0]
          ? `SpecHub tìm thấy **${candidates[0].title}** [${candidates[0].citation}] cùng các ứng viên liên quan, nhưng chưa có đủ phép đo chung để chọn một thiết bị thắng có cơ sở.`
          : "Chưa có đủ dữ liệu để đưa ra gợi ý."),
      "",
      analysis.useCases.length
        ? `Mình đang ưu tiên các yếu tố liên quan đến **${analysis.useCases
            .map((useCase) => this.useCaseLabel(useCase))
            .join(", ")}**.`
        : "Đây là gợi ý tạm thời vì câu hỏi chưa nêu rõ cách sử dụng chính.",
      "",
      `| Tiêu chí | ${header} |`,
      `|${divider}|`,
      ...rows,
      "",
      "## Vì sao và đánh đổi",
      "",
      ...(tradeoffs.length
        ? tradeoffs.map((tradeoff) => `- ${tradeoff}`)
        : [
            "- Chưa có đủ dữ liệu định lượng có thể so sánh trực tiếp để xác định lợi thế rõ ràng.",
          ]),
      "",
      this.recommendationFollowUp(analysis),
    ].join("\n");
  }

  private comparisonHighlights(
    left: CatalogEntity,
    right: CatalogEntity,
    priorities: DecisionPriority[] = [],
  ) {
    const considered = priorities.length
      ? priorities
      : ([
          "performance",
          "battery",
          "display",
          "price",
          "portability",
        ] satisfies DecisionPriority[]);

    return considered.flatMap((priority) => {
      const comparison = this.comparePriority(left, right, priority);
      return comparison ? [comparison.text] : [];
    });
  }

  private comparePriority(
    left: CatalogEntity,
    right: CatalogEntity,
    priority: DecisionPriority,
  ): { winner: CatalogEntity; text: string } | null {
    if (priority === "camera") return null;
    if (priority === "performance") {
      const sharedBenchmark = this.sharedEntityBenchmark(left, right);
      if (!sharedBenchmark || sharedBenchmark.left === sharedBenchmark.right) {
        return null;
      }
      const winner =
        sharedBenchmark.left > sharedBenchmark.right ? left : right;
      const loser = winner === left ? right : left;
      const winnerValue =
        winner === left ? sharedBenchmark.left : sharedBenchmark.right;
      const loserValue =
        winner === left ? sharedBenchmark.right : sharedBenchmark.left;
      const difference = this.percentDifference(winnerValue, loserValue);
      return {
        winner,
        text: `**${winner.title}** có điểm **${sharedBenchmark.label}** cao hơn (${this.formatNumber(winnerValue)} so với ${this.formatNumber(loserValue)}${difference ? `, khoảng ${difference}%` : ""}) [${winner.citation}][${loser.citation}]. Đây là lợi thế trong đúng phép đo này, không đại diện cho mọi tác vụ.`,
      };
    }

    const metric =
      priority === "battery"
        ? "battery"
        : priority === "display"
          ? "refresh_rate"
          : priority === "price"
            ? "price"
            : priority === "portability"
              ? "weight"
              : undefined;
    const leftValue = metric
      ? this.entityMetricValue(left, metric)
      : this.entityPriorityValue(left, priority);
    const rightValue = metric
      ? this.entityMetricValue(right, metric)
      : this.entityPriorityValue(right, priority);
    if (
      leftValue === undefined ||
      rightValue === undefined ||
      leftValue === rightValue
    ) {
      return null;
    }
    if (priority === "price" && !this.hasComparableCurrencies(left, right)) {
      return null;
    }

    const lowerIsBetter = priority === "price" || priority === "portability";
    const leftWins = lowerIsBetter
      ? leftValue < rightValue
      : leftValue > rightValue;
    const winner = leftWins ? left : right;
    const loser = leftWins ? right : left;
    const winnerValue = leftWins ? leftValue : rightValue;
    const loserValue = leftWins ? rightValue : leftValue;
    const difference = this.percentDifference(
      lowerIsBetter ? loserValue : winnerValue,
      lowerIsBetter ? winnerValue : loserValue,
    );
    const comparisonText: Record<
      Exclude<DecisionPriority, "performance" | "camera">,
      { label: string; unit: string; caveat?: string }
    > = {
      battery: {
        label: "dung lượng pin danh định cao hơn",
        unit: "mAh",
        caveat:
          "Dung lượng không đồng nghĩa thời lượng sử dụng sẽ dài hơn cùng tỷ lệ.",
      },
      display: {
        label: "tần số quét cao hơn",
        unit: "Hz",
      },
      price: {
        label: "giá ra mắt thấp hơn",
        unit: this.entityCurrency(left) ?? "",
      },
      portability: {
        label: "khối lượng nhẹ hơn",
        unit: "g",
      },
      software: {
        label: "thời gian hỗ trợ được cam kết dài hơn",
        unit: "năm",
      },
      storage: {
        label: "mức lưu trữ cao hơn trong bản ghi",
        unit: "GB",
      },
    };
    const copy = comparisonText[priority];

    return {
      winner,
      text: `**${winner.title}** có ${copy.label} (${this.formatNumber(winnerValue)}${copy.unit ? ` ${copy.unit}` : ""} so với ${this.formatNumber(loserValue)}${copy.unit ? ` ${copy.unit}` : ""}${difference ? `, chênh khoảng ${difference}%` : ""}) [${winner.citation}][${loser.citation}].${copy.caveat ? ` ${copy.caveat}` : ""}`,
    };
  }

  private comparisonVerdict(
    left: CatalogEntity,
    right: CatalogEntity,
    analysis: QuestionAnalysis,
    highlights: string[],
  ) {
    if (!analysis.priorities.length) {
      return [
        "## Kết luận",
        "",
        highlights.length
          ? `Chưa có một thiết bị thắng tuyệt đối: **${left.title}** và **${right.title}** mạnh ở các mặt khác nhau. Hãy chọn theo tiêu chí quan trọng nhất với bạn.`
          : "Dữ liệu hiện có phù hợp để đối chiếu cấu hình, nhưng chưa đủ để đưa ra người thắng có cơ sở.",
      ].join("\n");
    }
    return [
      "## Kết luận theo nhu cầu",
      "",
      this.provisionalRecommendation(left, right, analysis.priorities) ??
        "Các tiêu chí bạn nêu chưa tạo ra lợi thế đủ rõ trong dữ liệu hiện có.",
    ].join("\n");
  }

  private provisionalRecommendation(
    left: CatalogEntity,
    right: CatalogEntity,
    priorities: DecisionPriority[],
  ) {
    const evaluations = priorities.map((priority) => ({
      priority,
      decision: this.comparePriority(left, right, priority),
    }));
    const decisions = evaluations
      .map(({ decision }) => decision)
      .filter(
        (
          result,
        ): result is {
          winner: CatalogEntity;
          text: string;
        } => Boolean(result),
      );
    if (!decisions.length) return null;
    const missingPriorities = evaluations
      .filter(({ decision }) => !decision)
      .map(({ priority }) => this.priorityLabel(priority));
    const evidenceCaveat = missingPriorities.length
      ? ` Chưa đủ dữ liệu so sánh trực tiếp về ${missingPriorities.join(", ")}.`
      : "";
    const wins = new Map<string, number>();
    for (const decision of decisions) {
      wins.set(
        decision.winner.entityId,
        (wins.get(decision.winner.entityId) ?? 0) + 1,
      );
    }
    const leftWins = wins.get(left.entityId) ?? 0;
    const rightWins = wins.get(right.entityId) ?? 0;
    if (leftWins === rightWins) {
      return `Chưa có lựa chọn thắng rõ: **${left.title}** và **${right.title}** đang chia nhau lợi thế theo các tiêu chí có thể đo trực tiếp [${left.citation}][${right.citation}].${evidenceCaveat}`;
    }
    const winner = leftWins > rightWins ? left : right;
    const loser = winner === left ? right : left;
    return `Với phần tiêu chí có thể đo trực tiếp, **${winner.title}** là lựa chọn tạm thời hợp lý hơn **${loser.title}** [${winner.citation}][${loser.citation}].${evidenceCaveat}`;
  }

  private sharedEntityBenchmark(
    left: CatalogEntity,
    right: CatalogEntity,
  ): { label: string; left: number; right: number } | null {
    const leftBenchmarks = this.entityBenchmarks(left);
    const rightBenchmarks = this.entityBenchmarks(right);
    const shared = [...leftBenchmarks.keys()]
      .filter((key) => rightBenchmarks.has(key))
      .sort(
        (leftKey, rightKey) =>
          this.performanceBenchmarkPriority(leftKey) -
          this.performanceBenchmarkPriority(rightKey),
      )[0];
    if (!shared) return null;
    const leftResult = leftBenchmarks.get(shared);
    const rightResult = rightBenchmarks.get(shared);
    if (!leftResult || !rightResult) return null;
    return {
      label: leftResult.label,
      left: leftResult.value,
      right: rightResult.value,
    };
  }

  private entityBenchmarks(entity: CatalogEntity) {
    const benchmarks = new Map<string, { label: string; value: number }>();
    const value = this.extractField(entity.text, "Benchmarks");
    if (!value) return benchmarks;
    for (const entry of value.split(";")) {
      const match = entry
        .trim()
        .match(/^(.+?):\s*(-?\d+(?:[.,]\d+)?)\s*([^\d]*)$/);
      if (!match?.[1] || !match[2]) continue;
      const label = match[1].trim();
      const unit = (match[3] ?? "").trim().toLowerCase();
      const key = `${tokenize(label).join("-")}:${unit}`;
      const number = this.optionalNumber(match[2].replace(",", "."));
      if (number !== undefined) {
        benchmarks.set(key, { label, value: number });
      }
    }
    return benchmarks;
  }

  private entityPriorityValue(
    entity: CatalogEntity,
    priority: DecisionPriority,
  ) {
    const field =
      priority === "software"
        ? "Software"
        : priority === "storage"
          ? "Storage"
          : null;
    if (!field) return undefined;
    const value = this.extractField(entity.text, field);
    if (!value) return undefined;
    const unitPattern = priority === "software" ? "năm" : "GB";
    const matches = [
      ...value.matchAll(
        new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${unitPattern}`, "gi"),
      ),
    ];
    const values = matches
      .map((match) => this.optionalNumber(match[1]?.replace(",", ".")))
      .filter((item): item is number => item !== undefined);
    return values.length ? Math.max(...values) : undefined;
  }

  private answerFields(
    priorities: DecisionPriority[],
  ): Array<[string, string]> {
    const mapping: Record<DecisionPriority, [string, string]> = {
      performance: ["Benchmark hiệu năng", "Benchmarks"],
      battery: ["Pin và sạc", "Battery"],
      camera: ["Camera", "Camera"],
      display: ["Màn hình", "Display"],
      price: ["Giá ra mắt", "Launch price"],
      portability: ["Kích thước / khối lượng", "Physical"],
      software: ["Phần mềm / cập nhật", "Software"],
      storage: ["Lưu trữ", "Storage"],
    };
    const selected = priorities.length
      ? priorities.map((priority) => mapping[priority])
      : [
          ["Chipset", "Chipset"],
          ["Benchmark", "Benchmarks"],
          ["Màn hình", "Display"],
          ["Pin", "Battery"],
          ["Camera", "Camera"],
          ["Giá ra mắt", "Launch price"],
        ];
    return selected.filter(
      (field, index) =>
        selected.findIndex((candidate) => candidate[1] === field[1]) === index,
    ) as Array<[string, string]>;
  }

  private lookupInterpretations(
    entities: CatalogEntity[],
    analysis: QuestionAnalysis,
  ) {
    if (!analysis.priorities.length || !entities.length) return [];
    const notes: string[] = [];
    if (analysis.priorities.includes("battery")) {
      notes.push(
        "Dung lượng mAh là chỉ dấu về kích thước pin, không phải phép đo thời lượng sử dụng thực tế.",
      );
    }
    if (analysis.priorities.includes("camera")) {
      notes.push(
        "Số MP, khẩu độ, OIS và zoom mô tả phần cứng; chúng chưa đủ để kết luận chất lượng ảnh tổng thể.",
      );
    }
    if (analysis.priorities.includes("performance")) {
      notes.push(
        "Chỉ nên so điểm hiệu năng khi benchmark, phiên bản và hạng mục đo giống nhau.",
      );
    }
    return notes.length
      ? ["## Cách hiểu kết quả", "", ...notes.map((note) => `- ${note}`), ""]
      : [];
  }

  private recommendationFollowUp(analysis: QuestionAnalysis) {
    if (!analysis.priorities.length) {
      return "**Để chốt lựa chọn:** hãy cho biết ngân sách và 1–2 nhu cầu quan trọng nhất, chẳng hạn chơi game, chụp ảnh, pin lâu hoặc máy nhẹ.";
    }
    if (!analysis.priorities.includes("price")) {
      return "**Còn thiếu để chốt:** ngân sách hoặc mức chênh giá bạn sẵn sàng trả.";
    }
    return "**Còn thiếu để chốt:** hệ điều hành/hệ sinh thái bạn ưu tiên và mức độ quan trọng của từng tiêu chí.";
  }

  private useCaseLabel(useCase: DeviceUseCase) {
    const labels: Record<DeviceUseCase, string> = {
      gaming: "chơi game",
      photography: "chụp ảnh / quay video",
      productivity: "làm việc / học tập",
      travel: "di chuyển / du lịch",
      long_term: "sử dụng lâu dài",
      value: "tối ưu chi phí",
    };
    return labels[useCase];
  }

  private priorityLabel(priority: DecisionPriority) {
    const labels: Record<DecisionPriority, string> = {
      performance: "hiệu năng",
      battery: "pin",
      camera: "camera",
      display: "màn hình",
      price: "giá",
      portability: "tính cơ động",
      software: "hỗ trợ phần mềm",
      storage: "lưu trữ",
    };
    return labels[priority];
  }

  private percentDifference(higher: number, lower: number) {
    if (!lower || higher <= lower) return null;
    return Math.round(((higher - lower) / lower) * 1_000) / 10;
  }

  private formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 2,
    }).format(value);
  }

  private hasComparableCurrencies(left: CatalogEntity, right: CatalogEntity) {
    const leftCurrency = this.entityCurrency(left);
    const rightCurrency = this.entityCurrency(right);
    return (
      (!leftCurrency && !rightCurrency) ||
      (leftCurrency !== null && leftCurrency === rightCurrency)
    );
  }

  private entityCurrency(entity: CatalogEntity) {
    const price = this.extractField(entity.text, "Launch price");
    return price?.match(/\b([A-Z]{3})\b/)?.[1] ?? null;
  }

  private entityMetricValue(entity: CatalogEntity, metric: RankingMetric) {
    const value = this.extractField(entity.text, this.rankingField(metric));
    if (!value) return undefined;
    if (metric === "weight") {
      const matches = [...value.matchAll(/(\d+(?:[.,]\d+)?)\s*g\b/gi)];
      return this.optionalNumber(matches.at(-1)?.[1]?.replace(",", "."));
    }
    const match =
      metric === "battery"
        ? value.match(/(\d+(?:[.,]\d+)?)\s*mAh/i)
        : metric === "refresh_rate"
          ? value.match(/(\d+(?:[.,]\d+)?)\s*Hz/i)
          : value.match(/(\d+(?:[.,]\d+)?)/);
    return this.optionalNumber(match?.[1]?.replace(",", "."));
  }

  private extractField(text: string, label: string): string | null {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return (
      text.match(new RegExp(`^${escaped}:\\s*(.+)$`, "im"))?.[1]?.trim() ?? null
    );
  }

  private rankingField(metric: RankingMetric) {
    if (metric === "battery") return "Battery";
    if (metric === "performance") return "Benchmarks";
    if (metric === "price") return "Launch price";
    if (metric === "refresh_rate") return "Display";
    return "Physical";
  }

  private rankingLabel(metric: RankingMetric) {
    if (metric === "battery") return "Dung lượng pin";
    if (metric === "performance") return "Benchmark hiệu năng";
    if (metric === "price") return "Giá ra mắt";
    if (metric === "refresh_rate") return "Tần số quét";
    return "Khối lượng";
  }

  private markdownCell(value?: string | null) {
    return value ? trimText(value, 180).replace(/\|/g, "\\|") : "Chưa có";
  }

  private answerConfidence(
    analysis: QuestionAnalysis,
    chunks: RagChunk[],
    citationCount: number,
  ): { score: number; label: AnswerConfidence } {
    if (!chunks.length || !citationCount) return { score: 20, label: "low" };
    const uniqueEntities = new Set(
      chunks.map((chunk) => `${chunk.entityType}:${chunk.entityId}`),
    ).size;
    const averageScore =
      chunks.reduce(
        (sum, chunk) =>
          sum + Math.max(0, Math.min(1, Number(chunk.score ?? 0.5))),
        0,
      ) / chunks.length;
    const evidenceFit =
      analysis.intent === "compare"
        ? Math.min(1, uniqueEntities / 2)
        : Math.min(1, uniqueEntities / 3);
    const score = Math.round(
      Math.min(0.96, 0.4 + averageScore * 0.35 + evidenceFit * 0.25) * 100,
    );
    return {
      score,
      label: score >= 80 ? "high" : score >= 58 ? "medium" : "low",
    };
  }

  private followUpQuestions(
    analysis: QuestionAnalysis,
    chunks: RagChunk[],
  ): string[] {
    const titles = this.catalogEntities(chunks)
      .map((entity) => entity.title)
      .slice(0, 2);
    if (analysis.intent === "compare" && titles.length === 2) {
      return [
        `So sánh camera và pin của ${titles[0]} với ${titles[1]}`,
        `Máy nào phù hợp chơi game hơn: ${titles[0]} hay ${titles[1]}?`,
        `Phân tích chênh lệch giá của ${titles[0]} và ${titles[1]}`,
      ];
    }
    if (analysis.intent === "ranking") {
      return [
        "So sánh chi tiết hai thiết bị đứng đầu",
        "Thiết bị nào cân bằng hiệu năng và pin tốt nhất?",
        "Gợi ý thiết bị phù hợp với ngân sách của tôi",
      ];
    }
    if (!titles.length) {
      const knowledgeTitles = [
        ...new Set(
          chunks.flatMap((chunk) => (chunk.title ? [chunk.title] : [])),
        ),
      ].slice(0, 2);
      if (knowledgeTitles.length) {
        return [
          `Tóm tắt các dữ liệu liên quan đến ${knowledgeTitles[0]}`,
          knowledgeTitles[1]
            ? `So sánh thông tin về ${knowledgeTitles[0]} và ${knowledgeTitles[1]}`
            : `Những bản ghi nào liên quan trực tiếp đến ${knowledgeTitles[0]}?`,
          `Nguồn và dữ liệu nào đang hỗ trợ kết luận về ${knowledgeTitles[0]}?`,
        ];
      }
    }
    return [
      titles.length === 2
        ? `So sánh ${titles[0]} và ${titles[1]}`
        : "So sánh hai thiết bị phổ biến",
      "Thiết bị nào có hiệu năng cao nhất?",
      "Thiết bị nào có pin lớn nhất?",
    ];
  }

  private answerWarnings(chunks: RagChunk[], providerUsed: boolean) {
    if (!chunks.length) {
      return providerUsed
        ? []
        : ["Không tìm thấy bằng chứng phù hợp trong danh mục hiện tại."];
    }
    if (!providerUsed) {
      const configuredProvider = this.aiProvider.answerProviderName ?? "local";
      return [
        configuredProvider === "local"
          ? "Câu trả lời được tổng hợp trực tiếp từ database SpecHub, không bổ sung kiến thức bên ngoài."
          : `Phản hồi từ ${configuredProvider === "ollama" ? "Ollama" : "model đã cấu hình"} không vượt qua kiểm tra dữ liệu; SpecHub hiển thị bản trả lời dự phòng chỉ dùng dữ liệu đã xác minh.`,
      ];
    }
    return [];
  }

  private hasValidCitations(answer: string, citationCount: number) {
    if (!citationCount) return true;
    const citations = [...answer.matchAll(/\[(\d+)\]/g)].map((match) =>
      Number(match[1]),
    );
    return (
      citations.length > 0 &&
      citations.every((citation) => citation >= 1 && citation <= citationCount)
    );
  }

  private async readEmbeddingStats(): Promise<EmbeddingStatsRow[]> {
    return this.prisma
      .$queryRawUnsafe<EmbeddingStatsRow[]>(
        `SELECT model_name, entity_type, COUNT(*) AS chunks
       FROM embeddings
       GROUP BY model_name, entity_type
       ORDER BY model_name, entity_type`,
      )
      .catch((error) => {
        this.logger.warn(`Embedding stats unavailable: ${String(error)}`);
        return [];
      });
  }

  private async countIndexedDeviceModels(): Promise<number> {
    const rows = await this.prisma
      .$queryRawUnsafe<CountRow[]>(
        `SELECT COUNT(DISTINCT entity_id) AS count
       FROM embeddings
       WHERE entity_type = $1 AND model_name = $2`,
        "device_model",
        this.aiProvider.embeddingModelName,
      )
      .catch(() => [{ count: 0 }]);

    return this.numberValue(rows[0]?.count ?? 0);
  }

  private async countIndexedKnowledgeRecords(): Promise<number> {
    const rows = await this.prisma
      .$queryRawUnsafe<CountRow[]>(
        `SELECT COUNT(DISTINCT entity_type || ':' || entity_id) AS count
       FROM embeddings
       WHERE model_name = $1
         AND entity_type NOT IN ('device_model', 'raw_page')`,
        this.aiProvider.embeddingModelName,
      )
      .catch(() => [{ count: 0 }]);

    return this.numberValue(rows[0]?.count ?? 0);
  }

  private async countIndexedChunks(): Promise<number> {
    const rows = await this.prisma
      .$queryRawUnsafe<CountRow[]>(
        `SELECT COUNT(*) AS count
       FROM embeddings
       WHERE model_name = $1`,
        this.aiProvider.embeddingModelName,
      )
      .catch(() => [{ count: 0 }]);

    return this.numberValue(rows[0]?.count ?? 0);
  }

  private async getCachedAnswer(
    queryHash: string,
    context?: {
      question: string;
      isContextualFollowUp: boolean;
      analysis: QuestionAnalysis;
    },
  ) {
    const cached = await this.prisma.ai_query_cache.findUnique({
      where: { query_hash: queryHash },
    });

    if (!cached) return null;
    if (cached.expires_at && cached.expires_at < new Date()) return null;

    await this.prisma.ai_query_cache.update({
      where: { query_hash: queryHash },
      data: {
        hit_count: { increment: 1 },
      },
    });

    const citations = cached.citations as unknown as AiCitation[];
    const chunks: RagChunk[] = citations.map((citation, index) => ({
      entityType: citation.entity_type,
      entityId: citation.entity_id,
      chunkText: citation.excerpt,
      chunkIndex: index,
      title: citation.title,
      slug: citation.slug,
      score: citation.score,
    }));
    const analysis =
      context?.analysis ?? this.analyzeQuestion(cached.query_text);
    const confidence = this.answerConfidence(
      analysis,
      chunks,
      citations.length,
    );

    return {
      data: {
        question: context?.question ?? cached.query_text,
        answer: cached.answer_text,
        citations,
        contexts: [],
        cached: true,
        model_name: cached.model_name,
        follow_up_questions: this.followUpQuestions(analysis, chunks),
        warnings: [],
      },
      meta: {
        source: "cache" as RetrievalSource,
        embedding_model: this.aiProvider.embeddingModelName,
        rag_provider: "cache",
        intent: analysis.intent,
        contextual_follow_up: context?.isContextualFollowUp ?? false,
        confidence: confidence.score,
        confidence_label: confidence.label,
        answer_version: AI_ANSWER_VERSION,
      },
    };
  }

  private async writeCache(
    queryHash: string,
    question: string,
    answer: string,
    citations: AiCitation[],
    modelName: string,
  ) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000);

    await this.prisma.ai_query_cache.upsert({
      where: { query_hash: queryHash },
      update: {
        answer_text: answer,
        citations: citations as unknown as Prisma.InputJsonValue,
        model_name: modelName,
        expires_at: expiresAt,
      },
      create: {
        query_hash: queryHash,
        query_text: question,
        answer_text: answer,
        citations: citations as unknown as Prisma.InputJsonValue,
        model_name: modelName,
        expires_at: expiresAt,
      },
    });
  }

  private shouldCacheAnswer(_generated: {
    answer: string;
    modelName: string;
    provider: "local" | "ollama" | "openai" | "anthropic";
  } | null) {
    // Model-backed answers are intentionally never cached. Besides keeping a
    // newly updated catalog from being shadowed by a seven-day answer, this
    // guarantees that an Ollama-configured request actually reaches Ollama
    // rather than silently appearing as a cached/local response. The
    // deterministic local mode remains cacheable by design.
    return (this.aiProvider.answerProviderName ?? "local") === "local";
  }

  private hashQuery(question: string, topK: number): string {
    return createHash("sha256")
      .update(
        `${AI_ANSWER_VERSION}:${this.aiProvider.ragModelName}:${this.aiProvider.embeddingModelName}:${topK}:${question.toLowerCase()}`,
      )
      .digest("hex");
  }

  private formatChipsets(
    variant: AiDeviceModel["device_variants"][number],
  ): string | null {
    const chipsets = variant.variant_chipsets.map((link) => {
      const chipset = link.chipset;
      const maker =
        chipset.manufacturer?.short_name ??
        chipset.manufacturer?.name ??
        "nhà sản xuất chưa xác định";
      const details = [
        chipset.model_code,
        chipset.integrated_5g ? "tích hợp 5G" : null,
        chipset.max_ram_gb
          ? `hỗ trợ tối đa ${chipset.max_ram_gb} GB RAM`
          : null,
      ].filter(Boolean);

      return `${this.localizeRole(link.chip_role)}: ${chipset.name} của ${maker}${
        details.length ? ` (${details.join(", ")})` : ""
      }`;
    });

    return chipsets.length ? chipsets.join("; ") : null;
  }

  private formatCpus(
    variant: AiDeviceModel["device_variants"][number],
  ): string | null {
    const cpus = variant.variant_cpus.map(({ cpu }) => {
      const clusters = cpu.cpu_clusters
        .map((cluster) => {
          const clock = this.textValue(cluster.clock_ghz);
          return `${cluster.core_count}x ${cluster.cluster_name}${clock ? ` @ ${clock}GHz` : ""}`;
        })
        .join(", ");
      const details = [
        cpu.core_count ? `${cpu.core_count} nhân` : null,
        cpu.thread_count ? `${cpu.thread_count} luồng` : null,
        clusters || null,
      ].filter(Boolean);
      return details.length ? `${cpu.name} (${details.join(", ")})` : cpu.name;
    });
    return cpus.length ? cpus.join("; ") : null;
  }

  private formatGpus(
    variant: AiDeviceModel["device_variants"][number],
  ): string | null {
    const gpus = variant.variant_gpus.map(({ gpu }) => {
      const details = [
        gpu.compute_units ? `${gpu.compute_units} đơn vị tính toán` : null,
        gpu.clock_mhz ? `${gpu.clock_mhz}MHz` : null,
        gpu.fp32_gflops
          ? `${this.textValue(gpu.fp32_gflops)} GFLOPS FP32`
          : null,
        gpu.ray_tracing_support ? "hỗ trợ dò tia" : null,
      ].filter(Boolean);
      return details.length ? `${gpu.name} (${details.join(", ")})` : gpu.name;
    });
    return gpus.length ? gpus.join("; ") : null;
  }

  private formatNpus(
    variant: AiDeviceModel["device_variants"][number],
  ): string | null {
    const npus = variant.variant_npus.map(({ npu }) => {
      const details = [
        npu.tops ? `${this.textValue(npu.tops)} TOPS` : null,
        npu.tops_int4 ? `${this.textValue(npu.tops_int4)} TOPS INT4` : null,
        npu.tops_fp16 ? `${this.textValue(npu.tops_fp16)} TOPS FP16` : null,
      ].filter(Boolean);
      return details.length ? `${npu.name} (${details.join(", ")})` : npu.name;
    });
    return npus.length ? npus.join("; ") : null;
  }

  private formatMemory(
    variant: AiDeviceModel["device_variants"][number],
  ): string | null {
    const configs = variant.variant_memory_configs.map((memory) => {
      const details = [
        `${memory.capacity_gb}GB`,
        memory.memory_standard.name,
        memory.memory_standard.max_data_rate_mtps
          ? `tối đa ${memory.memory_standard.max_data_rate_mtps}MT/s`
          : null,
        memory.bandwidth_gbps
          ? `${this.textValue(memory.bandwidth_gbps)}GB/s`
          : null,
      ].filter(Boolean);
      return details.join(" ");
    });
    return configs.length ? configs.join("; ") : null;
  }

  private formatStorage(
    variant: AiDeviceModel["device_variants"][number],
  ): string | null {
    const configs = variant.variant_storage_configs.map((storage) => {
      const details = [
        `${storage.total_capacity_gb}GB`,
        storage.storage_standard.name,
        storage.storage_standard.interface,
        storage.is_expandable
          ? `có thể mở rộng${
              storage.expansion_max_gb
                ? ` đến ${storage.expansion_max_gb} GB`
                : ""
            }`
          : null,
      ].filter(Boolean);
      return details.join(" ");
    });
    return configs.length ? configs.join("; ") : null;
  }

  private formatDisplays(
    variant: AiDeviceModel["device_variants"][number],
  ): string | null {
    const displays = variant.variant_displays.map((link) => {
      const display = link.display_unit;
      const size = this.textValue(display.size_inch);
      const resolution =
        display.resolution_width && display.resolution_height
          ? `${display.resolution_width}x${display.resolution_height}`
          : null;
      const details = [
        size ? `${size} inch` : null,
        display.display_technology.name,
        resolution,
        display.refresh_rate_hz ? `${display.refresh_rate_hz}Hz` : null,
        display.brightness_peak_nits
          ? `${display.brightness_peak_nits} nit tối đa`
          : null,
        display.hdr_formats,
      ].filter(Boolean);

      return `${this.localizeRole(link.display_role)}: ${details.join(", ")}`;
    });

    return displays.length ? displays.join("; ") : null;
  }

  private formatBatteries(
    variant: AiDeviceModel["device_variants"][number],
  ): string | null {
    const batteries = variant.variant_batteries.map((link) => {
      const battery = link.battery_unit;
      const details = [
        `${battery.capacity_mah} mAh`,
        battery.energy_wh ? `${this.textValue(battery.energy_wh)} Wh` : null,
        battery.wired_charging_w ? `${battery.wired_charging_w}W có dây` : null,
        battery.wireless_charging_w
          ? `${battery.wireless_charging_w}W không dây`
          : null,
        battery.removable ? "có thể tháo rời" : null,
      ].filter(Boolean);

      return `${this.localizeRole(link.battery_role)}: ${details.join(", ")}`;
    });

    return batteries.length ? batteries.join("; ") : null;
  }

  private formatCameras(
    variant: AiDeviceModel["device_variants"][number],
  ): string | null {
    const systems = variant.variant_camera_systems.map((system) => {
      const modules = system.variant_camera_modules.map((link) => {
        const camera = link.camera_module;
        const details = [
          camera.effective_megapixel
            ? `${this.textValue(camera.effective_megapixel)}MP`
            : null,
          camera.aperture
            ? camera.aperture.toLowerCase().startsWith("f/")
              ? camera.aperture
              : `f/${camera.aperture}`
            : null,
          camera.optical_zoom
            ? `${this.textValue(camera.optical_zoom)}x quang học`
            : null,
          camera.has_ois ? "OIS" : null,
        ].filter(Boolean);
        return `${this.localizeRole(link.role)}: ${this.localizeModuleName(
          camera.name,
        )}${details.length ? ` (${details.join(", ")})` : ""}`;
      });
      return `${this.localizeRole(system.position)}: ${modules.join(", ")}`;
    });
    return systems.length ? systems.join("; ") : null;
  }

  private formatSoftware(
    variant: AiDeviceModel["device_variants"][number],
  ): string | null {
    const systems = variant.variant_operating_systems.map((link) => {
      const os = link.os_version;
      const ui = link.ui_layer_version;
      const details = [
        `${os.operating_system.name} ${os.version_name}`,
        ui ? `${ui.ui_layer.name} ${ui.version_name}` : null,
        link.promised_major_updates
          ? `cam kết ${link.promised_major_updates} bản cập nhật lớn`
          : null,
        link.promised_security_years
          ? `${link.promised_security_years} năm cập nhật bảo mật`
          : null,
      ].filter(Boolean);
      return details.join(", ");
    });
    return systems.length ? systems.join("; ") : null;
  }

  private formatBenchmarks(
    variant: AiDeviceModel["device_variants"][number],
  ): string | null {
    const benchmarks = variant.device_variant_benchmarks.map((result) => {
      const label = [
        result.benchmark.name,
        result.benchmark.version &&
        !result.benchmark.name.includes(result.benchmark.version)
          ? result.benchmark.version
          : null,
        this.localizeBenchmarkSubscore(result.subscore_name),
      ]
        .filter(Boolean)
        .join(" · ");
      return `${label}: ${this.textValue(result.score)}${
        result.benchmark.unit?.symbol
          ? ` ${this.localizeBenchmarkUnit(result.benchmark.unit.symbol)}`
          : " điểm"
      }`;
    });
    return benchmarks.length ? benchmarks.join("; ") : null;
  }

  private localizeBenchmarkSubscore(value?: string | null) {
    if (!value) return "Tổng";
    const labels: Record<string, string> = {
      overall: "Tổng",
      total: "Tổng",
      single_core: "Đơn nhân",
      multi_core: "Đa nhân",
      cpu: "CPU",
      gpu: "GPU",
      opencl: "OpenCL",
      memory: "Bộ nhớ",
      ux: "Trải nghiệm",
    };
    return labels[value.toLowerCase()] ?? value;
  }

  private localizeBenchmarkUnit(value: string) {
    return /^(points?|pts?)$/i.test(value) ? "điểm" : value;
  }

  private formatPhysicalSpecs(
    physical:
      | AiDeviceModel["device_variants"][number]["variant_physical_specs"]
      | null,
  ): string | null {
    if (!physical) return null;

    const dimensions =
      physical.height_mm && physical.width_mm && physical.thickness_mm
        ? `${this.textValue(physical.height_mm)} x ${this.textValue(
            physical.width_mm,
          )} x ${this.textValue(physical.thickness_mm)} mm`
        : null;
    const details = [
      dimensions,
      physical.weight_g ? `${this.textValue(physical.weight_g)} g` : null,
      physical.frame_material
        ? `khung ${this.localizeMaterial(physical.frame_material)}`
        : null,
      physical.back_material
        ? `mặt lưng ${this.localizeMaterial(physical.back_material)}`
        : null,
      physical.front_glass,
      physical.ingress_protection,
    ].filter(Boolean);

    return details.length ? details.join(", ") : null;
  }

  private formatPrice(
    price: AiDeviceModel["device_variants"][number]["launch_price"],
    currencyCode?: string | null,
  ): string | null {
    const value = this.textValue(price);
    if (!value) return null;
    return currencyCode ? `${value} ${currencyCode}` : value;
  }

  private localizeContextExcerpt(value: string) {
    const labels: Array<[string, string]> = [
      ["Default variant", "Phiên bản mặc định"],
      ["Benchmarks", "Benchmark"],
      ["Launch price", "Giá ra mắt"],
      ["Launch date", "Ngày ra mắt"],
      ["Device model", "Mẫu thiết bị"],
      ["Device", "Thiết bị"],
      ["Variant", "Phiên bản"],
      ["Brand", "Hãng"],
      ["Family", "Dòng sản phẩm"],
      ["Category", "Danh mục"],
      ["Generation", "Thế hệ"],
      ["Status", "Trạng thái"],
      ["Announced", "Công bố"],
      ["Released", "Phát hành"],
      ["Description", "Mô tả"],
      ["Market", "Thị trường"],
      ["Color", "Màu sắc"],
      ["Memory", "RAM"],
      ["Storage", "Lưu trữ"],
      ["Display", "Màn hình"],
      ["Battery", "Pin"],
      ["Camera", "Máy ảnh"],
      ["Software", "Phần mềm"],
      ["Physical", "Kích thước và vật liệu"],
      ["Source", "Nguồn"],
    ];
    let localized = value;
    for (const [source, target] of labels) {
      localized = localized.replace(
        new RegExp(`(^|[·\\n]\\s*)${source}:`, "gi"),
        `$1${target}:`,
      );
    }
    return localized
      .replace(/\bPhiên bản mặc định:\s*yes\b/gi, "Phiên bản mặc định: có")
      .replace(/\bPhiên bản mặc định:\s*no\b/gi, "Phiên bản mặc định: không");
  }

  private localizeCategory(slug?: string | null, name?: string | null) {
    const labels: Record<string, string> = {
      smartphone: "Điện thoại",
      tablet: "Máy tính bảng",
      laptop: "Máy tính xách tay",
      smartwatch: "Đồng hồ thông minh",
      earbuds: "Tai nghe không dây",
      television: "TV thông minh",
      "gaming-handheld": "Máy chơi game cầm tay",
      "e-reader": "Máy đọc sách điện tử",
    };
    return (
      labels[this.normalizedLabel(slug)] ??
      labels[this.normalizedLabel(name)] ??
      name ??
      "Thiết bị"
    );
  }

  private localizeReleaseStatus(code?: string | null, name?: string | null) {
    const labels: Record<string, string> = {
      released: "Đã phát hành",
      available: "Đang bán",
      announced: "Đã công bố",
      upcoming: "Sắp ra mắt",
      rumored: "Tin đồn",
      discontinued: "Ngừng kinh doanh",
      delayed: "Hoãn phát hành",
      cancelled: "Đã hủy",
      canceled: "Đã hủy",
    };
    return (
      labels[this.normalizedLabel(code)] ??
      labels[this.normalizedLabel(name)] ??
      name ??
      "Chưa xác định"
    );
  }

  private localizeRole(role?: string | null) {
    if (!role) return "Chính";
    const labels: Record<string, string> = {
      main: "Chính",
      soc: "SoC",
      application: "Ứng dụng",
      primary: "Chính",
      secondary: "Phụ",
      internal: "Tích hợp",
      external: "Ngoài",
      front: "Trước",
      rear: "Sau",
      cover: "Màn hình ngoài",
      inner: "Màn hình trong",
      outer: "Màn hình ngoài",
      ultrawide: "Góc siêu rộng",
      "ultra-wide": "Góc siêu rộng",
      telephoto: "Chụp xa",
      periscope: "Tiềm vọng",
      selfie: "Chụp trước",
    };
    return labels[this.normalizedLabel(role)] ?? role;
  }

  private localizeMaterial(material: string) {
    const labels: Record<string, string> = {
      aluminum: "nhôm",
      aluminium: "nhôm",
      titanium: "titan",
      glass: "kính",
      plastic: "nhựa",
      ceramic: "gốm",
      "stainless-steel": "thép không gỉ",
      steel: "thép",
      magnesium: "magie",
      composite: "vật liệu tổng hợp",
    };
    return labels[this.normalizedLabel(material)] ?? material;
  }

  private localizeModuleName(name?: string | null) {
    if (!name) return "Máy ảnh";
    const exactLabels: Record<string, string> = {
      "ambient-light-sensor": "Cảm biến ánh sáng môi trường",
      "heart-rate-sensor": "Cảm biến nhịp tim",
      "temperature-sensor": "Cảm biến nhiệt độ",
      barometer: "Khí áp kế",
      accelerometer: "Gia tốc kế",
      gyroscope: "Con quay hồi chuyển",
      magnetometer: "Từ kế",
      "proximity-sensor": "Cảm biến tiệm cận",
      "fingerprint-sensor": "Cảm biến vân tay",
      "embedded-memory": "Bộ nhớ tích hợp",
      "apple-unified-memory": "Bộ nhớ hợp nhất Apple",
    };
    const exact = exactLabels[this.normalizedLabel(name)];
    if (exact) return exact;

    return name
      .replace(/^(.+?)\s+rear camera$/i, "Camera sau $1")
      .replace(/^(.+?)\s+front camera$/i, "Camera trước $1")
      .replace(/^(.+?)\s+ultrawide camera$/i, "Camera góc siêu rộng $1")
      .replace(/^(.+?)\s+telephoto camera$/i, "Camera chụp xa $1")
      .replace(/^(.+?)\s+firmware$/i, "Phần mềm hệ thống $1")
      .replace(/^(.+?)\s+cover display$/i, "Màn hình ngoài $1")
      .replace(/^(.+?)\s+display$/i, "Màn hình $1")
      .replace(/^(.+?\d+MP)\s+telephoto$/i, "$1 chụp xa")
      .replace(/^(.+?\d+MP)\s+wide$/i, "$1 góc rộng");
  }

  private localizeDescription(value?: string | null) {
    if (!value) return value;
    return value
      .replace(/\bCamera phone\b/gi, "Điện thoại chụp ảnh")
      .replace(/\bUltrabook\b/gi, "Máy tính xách tay siêu mỏng nhẹ")
      .replace(/\bLaptop\b/g, "Máy tính xách tay")
      .replace(/\bTablet\b/g, "Máy tính bảng")
      .replace(/\bSmartwatch\b/g, "Đồng hồ thông minh")
      .replace(/\bFlagship\b/g, "Mẫu cao cấp")
      .replace(/\bcamera tele\b/gi, "camera chụp xa")
      .replace(/\bPC gaming\b/gi, "máy chơi game PC");
  }

  private normalizedLabel(value?: string | null) {
    return (
      value
        ?.trim()
        .toLowerCase()
        .replace(/[\s_]+/g, "-") ?? ""
    );
  }

  private addLine(lines: string[], label: string, value: unknown) {
    const text = this.textValue(value);
    if (!text) return;
    lines.push(`${label}: ${text}`);
  }

  private textValue(value: unknown): string | null {
    if (value === null || value === undefined || value === "") return null;

    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    if (typeof value === "string") {
      return trimText(value, 600);
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (typeof value === "object" && "toString" in value) {
      const text = String(value);
      return text === "[object Object]" ? null : text;
    }

    return String(value);
  }

  private numberValue(value: bigint | number | string): number {
    return typeof value === "bigint" ? Number(value) : Number(value);
  }

  private ragEntityType(value: string): RagChunk["entityType"] {
    const allowed = new Set<RagChunk["entityType"]>([
      "device_model",
      "device_variant",
      "hardware_module",
      "product_family",
      "raw_page",
      "wiki_article",
      "organization",
      "catalog_reference",
    ]);
    return allowed.has(value as RagChunk["entityType"])
      ? (value as RagChunk["entityType"])
      : "catalog_reference";
  }

  private optionalNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === "") return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }
}
