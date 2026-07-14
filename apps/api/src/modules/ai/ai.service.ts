import { createHash, randomUUID } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import {
  AiCitation,
  chunkText,
  makeExcerpt,
  RagChunk,
  tokenize,
  trimText,
  vectorToPgVector,
} from "@spechub/ai-core";
import { Prisma } from "@spechub/database";
import { PrismaService } from "../../prisma/prisma.service";
import { AiProviderService } from "./ai-provider.service";
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

type RetrievalSource = "vector" | "catalog_fallback" | "cache";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly prisma: PrismaService;
  private readonly aiProvider: AiProviderService;

  constructor(prisma: PrismaService, aiProvider?: AiProviderService) {
    this.prisma = prisma;
    this.aiProvider = aiProvider ?? new AiProviderService();
  }

  async ask(dto: AskAiDto) {
    const question = dto.question.trim();
    const topK = dto.top_k ?? 5;
    const queryHash = this.hashQuery(question, topK);
    const cached = await this.getCachedAnswer(queryHash);

    if (cached) return cached;

    const { chunks, source } = await this.retrieveChunks(question, topK);
    const citations = chunks.map((chunk) => this.toCitation(chunk, question));
    const generated = await this.aiProvider
      .generateAnswer({ question, chunks, citations })
      .catch((error) => {
        this.logger.warn(`AI provider answer skipped: ${String(error)}`);
        return null;
      });
    const answer = generated?.answer ?? this.composeAnswer(question, chunks);
    const modelName = generated?.modelName ?? this.aiProvider.ragModelName;

    await this.writeCache(
      queryHash,
      question,
      answer,
      citations,
      modelName,
    ).catch((error) => {
      this.logger.warn(`AI cache write skipped: ${String(error)}`);
    });

    return {
      data: {
        question,
        answer,
        citations,
        contexts: chunks,
        cached: false,
        model_name: modelName,
      },
      meta: {
        source,
        top_k: topK,
        embedding_model: this.aiProvider.embeddingModelName,
        rag_provider: generated?.provider ?? "local",
      },
    };
  }

  async search(query: QueryAiSearchDto) {
    const q = query.q.trim();
    const topK = query.top_k ?? 5;
    const { chunks, source } = await this.retrieveChunks(q, topK);

    return {
      data: chunks.map((chunk) => ({
        ...chunk,
        excerpt: makeExcerpt(chunk.chunkText, q),
      })),
      meta: {
        query: q,
        top_k: topK,
        source,
        embedding_model: this.aiProvider.embeddingModelName,
      },
    };
  }

  async getEmbeddingStats() {
    const [rows, deviceModels] = await Promise.all([
      this.readEmbeddingStats(),
      this.prisma.device_models.count({ where: { deleted_at: null } }),
    ]);
    const totalChunks = rows.reduce(
      (sum, row) => sum + this.numberValue(row.chunks),
      0,
    );

    return {
      data: {
        total_chunks: totalChunks,
        indexed_device_models: await this.countIndexedDeviceModels(),
        device_models: deviceModels,
        indexes: rows.map((row) => ({
          model_name: row.model_name,
          entity_type: row.entity_type,
          chunks: this.numberValue(row.chunks),
        })),
      },
      meta: {
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
      await tx.ai_query_cache.deleteMany({
        where: {
          model_name: this.aiProvider.ragModelName,
        },
      });

      for (const embeddedChunk of embeddedChunks) {
        await tx.$executeRawUnsafe(
          `INSERT INTO embeddings
            (id, entity_type, entity_id, chunk_text, chunk_index, embedding, model_name)
           VALUES ($1::uuid, $2, $3, $4, $5, $6::vector, $7)`,
          randomUUID(),
          embeddedChunk.chunk.entityType,
          embeddedChunk.chunk.entityId,
          embeddedChunk.chunk.chunkText,
          embeddedChunk.chunk.chunkIndex,
          embeddedChunk.embedding,
          embeddedChunk.modelName,
        );
      }
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
      await tx.ai_query_cache.deleteMany({
        where: {
          model_name: this.aiProvider.ragModelName,
        },
      });

      for (const embeddedChunk of embeddedChunks) {
        await tx.$executeRawUnsafe(
          `INSERT INTO embeddings
            (id, entity_type, entity_id, chunk_text, chunk_index, embedding, model_name)
           VALUES ($1::uuid, $2, $3, $4, $5, $6::vector, $7)`,
          randomUUID(),
          embeddedChunk.chunk.entityType,
          embeddedChunk.chunk.entityId,
          embeddedChunk.chunk.chunkText,
          embeddedChunk.chunk.chunkIndex,
          embeddedChunk.embedding,
          embeddedChunk.modelName,
        );
      }
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

  private async retrieveChunks(query: string, topK: number) {
    const indexedChunks = await this.countIndexedChunks();

    if (indexedChunks > 0) {
      const vectorChunks = await this.retrieveVectorChunks(query, topK).catch(
        (error) => {
          this.logger.warn(`Vector retrieval skipped: ${String(error)}`);
          return [];
        },
      );

      if (vectorChunks.length) {
        return { chunks: vectorChunks, source: "vector" as RetrievalSource };
      }
    }

    return {
      chunks: await this.retrieveCatalogFallback(query, topK),
      source: "catalog_fallback" as RetrievalSource,
    };
  }

  private async embedChunks(chunks: RagChunk[]) {
    const embeddedChunks: Array<{
      chunk: RagChunk;
      embedding: string;
      modelName: string;
    }> = [];

    for (const chunk of chunks) {
      const embeddingResult = await this.aiProvider.embedText(chunk.chunkText);
      embeddedChunks.push({
        chunk,
        embedding: vectorToPgVector(embeddingResult.vector),
        modelName: embeddingResult.modelName,
      });
    }

    return embeddedChunks;
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
          COALESCE(dm.name, rp.url) AS title,
          COALESCE(dm.slug, rp.url) AS slug
        FROM embeddings e
        LEFT JOIN device_models dm
          ON e.entity_type = 'device_model'
          AND e.entity_id = dm.id::text
        LEFT JOIN raw_pages rp
          ON e.entity_type = 'raw_page'
          AND e.entity_id = rp.id::text
        WHERE e.model_name = $2
        ORDER BY e.embedding <=> $1::vector
        LIMIT $3`,
      embedding,
      embeddingResult.modelName,
      topK,
    );

    return rows.map((row) => ({
      entityType: row.entity_type === "raw_page" ? "raw_page" : "device_model",
      entityId: row.entity_id,
      chunkText: row.chunk_text,
      chunkIndex: row.chunk_index,
      title: row.title,
      slug: row.slug,
      score: row.score === null ? null : Number(row.score),
    }));
  }

  private async retrieveCatalogFallback(
    query: string,
    topK: number,
  ): Promise<RagChunk[]> {
    const terms = tokenize(query)
      .filter((term) => term.length > 1)
      .slice(0, 8);
    const searchTerms = terms.length ? terms : [query];
    const models = await this.prisma.device_models.findMany({
      where: {
        deleted_at: null,
        OR: searchTerms.flatMap((term) => this.buildCatalogWhere(term)),
      },
      select: AI_DEVICE_MODEL_SELECT,
      take: Math.max(topK, 5),
      orderBy: [{ release_date: "desc" }, { name: "asc" }],
    });
    const queryTokens = new Set(terms);

    return models
      .flatMap((model) => this.buildModelChunks(model))
      .map((chunk) => ({
        ...chunk,
        score: this.scoreChunk(chunk.chunkText, queryTokens),
      }))
      .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))
      .slice(0, topK);
  }

  private buildCatalogWhere(term: string): Prisma.device_modelsWhereInput[] {
    const contains = { contains: term, mode: "insensitive" as const };

    return [
      { name: contains },
      { slug: contains },
      { generation_label: contains },
      { description: contains },
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
    const title = `${brand} ${model.name}`;
    const lines: string[] = [];

    this.addLine(lines, "Device", model.name);
    this.addLine(lines, "Brand", brand);
    this.addLine(lines, "Family", model.product_family.name);
    this.addLine(lines, "Category", model.product_family.device_category.name);
    this.addLine(lines, "Generation", model.generation_label);
    this.addLine(lines, "Status", model.release_status.name);
    this.addLine(lines, "Announced", model.announcement_date);
    this.addLine(lines, "Released", model.release_date);
    this.addLine(lines, "Description", model.description);

    for (const variant of model.device_variants) {
      lines.push("");
      this.addLine(lines, "Variant", variant.variant_name);
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
      this.addLine(lines, "Display", this.formatDisplays(variant));
      this.addLine(lines, "Battery", this.formatBatteries(variant));
      this.addLine(
        lines,
        "Physical",
        this.formatPhysicalSpecs(variant.variant_physical_specs),
      );
      this.addLine(lines, "Notes", variant.notes);
    }

    return chunkText(lines.join("\n"), { maxChars: 1_600 }).map(
      (text, index) => ({
        entityType: "device_model",
        entityId: model.id,
        chunkText: text,
        chunkIndex: index,
        title,
        slug: model.slug,
      }),
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
      ? `${page.device_model.name} source page`
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

  private composeAnswer(question: string, chunks: RagChunk[]): string {
    if (!chunks.length) {
      return `I could not find matching catalog data for "${question}" in the current SpecHub index.`;
    }

    const lead = chunks[0];
    const contextLines = chunks
      .slice(0, 3)
      .map((chunk, index) => {
        const title = chunk.title ?? chunk.entityId;
        return `${index + 1}. ${title}: ${makeExcerpt(
          chunk.chunkText,
          question,
          220,
        )}`;
      })
      .join("\n");

    return [
      `Based on the current SpecHub catalog, the strongest match is ${lead.title ?? lead.entityId}.`,
      "",
      contextLines,
      "",
      "This answer is generated from indexed catalog fields only; citations point to the source chunks used.",
    ].join("\n");
  }

  private toCitation(chunk: RagChunk, query: string): AiCitation {
    return {
      entity_type: chunk.entityType,
      entity_id: chunk.entityId,
      title: chunk.title,
      slug: chunk.slug,
      excerpt: makeExcerpt(chunk.chunkText, query),
      score: chunk.score,
    };
  }

  private scoreChunk(text: string, queryTokens: Set<string>): number {
    if (!queryTokens.size) return 0;

    const tokens = tokenize(text);
    const matches = tokens.filter((token) => queryTokens.has(token)).length;
    return matches / queryTokens.size;
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

  private async getCachedAnswer(queryHash: string) {
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

    return {
      data: {
        question: cached.query_text,
        answer: cached.answer_text,
        citations: cached.citations as unknown as AiCitation[],
        contexts: [],
        cached: true,
        model_name: cached.model_name,
      },
      meta: {
        source: "cache" as RetrievalSource,
        embedding_model: this.aiProvider.embeddingModelName,
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

  private hashQuery(question: string, topK: number): string {
    return createHash("sha256")
      .update(
        `${this.aiProvider.ragModelName}:${topK}:${question.toLowerCase()}`,
      )
      .digest("hex");
  }

  private formatChipsets(
    variant: AiDeviceModel["device_variants"][number],
  ): string | null {
    const chipsets = variant.variant_chipsets.map((link) => {
      const chipset = link.chipset;
      const maker =
        chipset.manufacturer.short_name ?? chipset.manufacturer.name;
      const details = [
        chipset.model_code,
        chipset.integrated_5g ? "integrated 5G" : null,
        chipset.max_ram_gb ? `up to ${chipset.max_ram_gb}GB RAM` : null,
      ].filter(Boolean);

      return `${link.chip_role}: ${chipset.name} by ${maker}${
        details.length ? ` (${details.join(", ")})` : ""
      }`;
    });

    return chipsets.length ? chipsets.join("; ") : null;
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
          ? `${display.brightness_peak_nits} nits peak`
          : null,
        display.hdr_formats,
      ].filter(Boolean);

      return `${link.display_role}: ${details.join(", ")}`;
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
        battery.wired_charging_w ? `${battery.wired_charging_w}W wired` : null,
        battery.wireless_charging_w
          ? `${battery.wireless_charging_w}W wireless`
          : null,
        battery.removable ? "removable" : null,
      ].filter(Boolean);

      return `${link.battery_role}: ${details.join(", ")}`;
    });

    return batteries.length ? batteries.join("; ") : null;
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
      physical.frame_material ? `${physical.frame_material} frame` : null,
      physical.back_material ? `${physical.back_material} back` : null,
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
}
