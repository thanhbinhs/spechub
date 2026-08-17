import { Injectable, Logger } from "@nestjs/common";
import { chunkText, type RagChunk, type RagEntityType } from "@spechub/ai-core";
import { PrismaService } from "../../prisma/prisma.service";

type KnowledgeRecord = Record<string, unknown>;

type KnowledgeRow = {
  record: KnowledgeRecord;
};

type KnowledgeSource = {
  table: string;
  entityType: RagEntityType;
  where?: string;
  index?: boolean;
};

type LoadedKnowledgeRecord = {
  source: KnowledgeSource;
  record: KnowledgeRecord;
};

export type KnowledgeIndexSnapshot = {
  chunks: RagChunk[];
  recordCount: number;
  sourceCount: number;
  recordsByType: Record<string, number>;
};

const HARDWARE_ROUTE_BY_TABLE: Record<string, string> = {
  battery_units: "battery",
  camera_modules: "camera",
  chipsets: "chipset",
  cpus: "cpu",
  display_units: "display",
  gpus: "gpu",
  memory_standards: "memory-standard",
  modems: "modem",
  npus: "npu",
  operating_systems: "operating-system",
  storage_standards: "storage-standard",
};

const HARDWARE_TABLES = new Set(Object.keys(HARDWARE_ROUTE_BY_TABLE));

const PUBLIC_CATALOG_TABLES = [
  "languages",
  "translations",
  "release_statuses",
  "currencies",
  "sources",
  "citations",
  "media_assets",
  "entity_media",
  "tags",
  "entity_tags",
  "units",
  "organizations",
  "device_categories",
  "regions",
  "product_families",
  "device_variants",
  "device_model_aliases",
  "device_editorial_sections",
  "variant_price_history",
  "variant_physical_specs",
  "variant_io_specs",
  "variant_thermal_specs",
  "model_lineage",
  "model_similarity",
  "technology_families",
  "architectures",
  "process_nodes",
  "camera_roles",
  "display_technologies",
  "battery_chemistries",
  "network_generations",
  "chipsets",
  "cpus",
  "cpu_clusters",
  "gpus",
  "npus",
  "modems",
  "camera_sensors",
  "camera_modules",
  "display_units",
  "battery_units",
  "memory_standards",
  "storage_standards",
  "operating_systems",
  "os_versions",
  "os_ui_layers",
  "os_ui_layer_versions",
  "cellular_bands",
  "wifi_bands",
  "certifications",
  "cpu_capabilities",
  "cpu_capability_links",
  "gpu_apis",
  "gpu_api_support",
  "npu_precision_capabilities",
  "camera_features",
  "camera_module_feature_links",
  "camera_video_modes",
  "camera_module_video_modes",
  "hdr_standards",
  "display_hdr_support",
  "color_gamuts",
  "display_color_gamut_support",
  "charging_protocols",
  "battery_charging_protocols",
  "connectivity_features",
  "chipset_cpu_links",
  "chipset_gpu_links",
  "chipset_npu_links",
  "chipset_modem_links",
  "camera_module_sensor_links",
  "variant_chipsets",
  "variant_cpus",
  "variant_gpus",
  "variant_npus",
  "variant_modems",
  "variant_displays",
  "variant_batteries",
  "variant_camera_systems",
  "variant_camera_modules",
  "variant_memory_configs",
  "variant_storage_configs",
  "variant_wifi_bands",
  "variant_operating_systems",
  "variant_software_profiles",
  "variant_connectivity_support",
  "variant_module_scores",
  "variant_score_metric_inputs",
  "variant_scorecards",
  "variant_scorecard_modules",
  "scoring_profiles",
  "scoring_profile_modules",
  "scoring_profile_metrics",
  "variant_cellular_band_support",
  "variant_certifications",
  "variant_region_availability",
  "software_features",
  "variant_software_features",
  "feature_definitions",
  "device_variant_features",
  "benchmarks",
  "benchmark_runs",
  "device_variant_benchmarks",
  "chipset_benchmarks",
  "cpu_benchmarks",
  "gpu_benchmarks",
  "npu_benchmarks",
] as const;

const PUBLIC_KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  // Device models are loaded only to resolve foreign keys. Their richer,
  // relation-aware chunks are produced by AiService.
  {
    table: "device_models",
    entityType: "device_model",
    index: false,
  },
  ...PUBLIC_CATALOG_TABLES.map((table) => ({
    table,
    entityType: knowledgeEntityType(table),
  })),
  {
    table: "wiki_articles",
    entityType: "wiki_article",
    where: "record.status = 'published'",
  },
  {
    table: "affiliate_partners",
    entityType: "catalog_reference",
    where: "record.is_active = TRUE AND record.is_trusted = TRUE",
  },
  {
    table: "affiliate_links",
    entityType: "catalog_reference",
    where:
      "record.sync_status = 'success' AND EXISTS (SELECT 1 FROM affiliate_partners partner WHERE partner.id = record.partner_id AND partner.is_active = TRUE AND partner.is_trusted = TRUE)",
  },
  {
    table: "affiliate_price_history",
    entityType: "catalog_reference",
    where:
      "EXISTS (SELECT 1 FROM affiliate_links link JOIN affiliate_partners partner ON partner.id = link.partner_id WHERE link.id = record.affiliate_link_id AND link.sync_status = 'success' AND partner.is_active = TRUE AND partner.is_trusted = TRUE)",
  },
  {
    table: "subscription_plans",
    entityType: "catalog_reference",
    where: "record.is_active = TRUE",
  },
];

const HIDDEN_FIELD_PATTERN =
  /(^id$|password|secret|token|hash|email|recipient|ip_address|user_agent|owner_user_id|author_user_id|actor_user_id|stripe_|sync_error|error_message|raw_html|body_html|deleted_at|created_at|updated_at|current_revision_id|view_count|commission_rate)/i;

const LOW_VALUE_FIELD_PATTERN =
  /(_url$|image_|logo_|cover_|object_key|file_size|checksum|upload_status)/i;

@Injectable()
export class AiKnowledgeService {
  private readonly logger = new Logger(AiKnowledgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  get sourceCount() {
    return PUBLIC_KNOWLEDGE_SOURCES.filter((source) => source.index !== false)
      .length;
  }

  async createSnapshot(): Promise<KnowledgeIndexSnapshot> {
    const records: LoadedKnowledgeRecord[] = [];

    for (const source of PUBLIC_KNOWLEDGE_SOURCES) {
      const rows = await this.readSource(source);
      records.push(
        ...rows.map((row) => ({
          source,
          record: row.record,
        })),
      );
    }

    const labelsById = this.buildLabelsById(records);
    const chunks = records.flatMap(({ source, record }) =>
      source.index === false
        ? []
        : this.buildRecordChunks(source, record, labelsById),
    );
    const indexedRecords = records.filter(
      ({ source }) => source.index !== false,
    );
    const recordsByType = indexedRecords.reduce<Record<string, number>>(
      (counts, { source }) => {
        counts[source.entityType] = (counts[source.entityType] ?? 0) + 1;
        return counts;
      },
      {},
    );

    return {
      chunks,
      recordCount: indexedRecords.length,
      sourceCount: this.sourceCount,
      recordsByType,
    };
  }

  private async readSource(source: KnowledgeSource): Promise<KnowledgeRow[]> {
    // Table names and predicates only come from the immutable allowlist above.
    // The generic JSON projection keeps this index compatible with additive
    // catalog schema changes without granting the model arbitrary SQL access.
    const predicates = [
      "(to_jsonb(record)->>'deleted_at') IS NULL",
      source.where,
    ].filter(Boolean);
    const sql = `SELECT to_jsonb(record) AS record
      FROM "${source.table}" AS record
      WHERE ${predicates.join(" AND ")}`;

    return this.prisma.$queryRawUnsafe<KnowledgeRow[]>(sql).catch((error) => {
      this.logger.warn(
        `AI knowledge source '${source.table}' skipped: ${String(error)}`,
      );
      return [];
    });
  }

  private buildLabelsById(records: LoadedKnowledgeRecord[]) {
    const candidates = new Map<string, Set<string>>();

    for (const { source, record } of records) {
      const id = this.scalarText(record.id);
      const label = this.primaryLabel(source.table, record);
      if (!id || !label) continue;
      const labels = candidates.get(id) ?? new Set<string>();
      labels.add(label);
      candidates.set(id, labels);
    }

    const labelsById = new Map<string, string>();
    for (const [id, labels] of candidates) {
      if (labels.size === 1) labelsById.set(id, [...labels][0]!);
    }

    // A variant name alone is ambiguous. Enrich it with its parent model so
    // junction records become readable evidence such as
    // "iPhone 16 Pro — 256GB ↔ USB-C".
    for (const { source, record } of records) {
      if (source.table !== "device_variants") continue;
      const id = this.scalarText(record.id);
      const modelId = this.scalarText(record.device_model_id);
      const variant = this.scalarText(record.variant_name);
      const model = modelId ? labelsById.get(modelId) : undefined;
      if (id && model && variant) labelsById.set(id, `${model} — ${variant}`);
    }

    return labelsById;
  }

  private buildRecordChunks(
    source: KnowledgeSource,
    record: KnowledgeRecord,
    labelsById: Map<string, string>,
  ): RagChunk[] {
    const id = this.scalarText(record.id);
    if (!id) return [];

    const title = this.recordTitle(source.table, record, labelsById);
    const slug = this.recordSlug(source.table, record);
    const lines = [
      `Title: ${title}`,
      slug ? `Slug: ${slug}` : null,
      `Record type: ${this.humanize(source.table)}`,
      `Source table: ${source.table}`,
    ].filter((line): line is string => Boolean(line));

    for (const [key, value] of Object.entries(record)) {
      if (
        key === "slug" ||
        HIDDEN_FIELD_PATTERN.test(key) ||
        LOW_VALUE_FIELD_PATTERN.test(key) ||
        value === null ||
        value === undefined ||
        value === ""
      ) {
        continue;
      }

      const rendered = this.renderValue(key, value, labelsById);
      if (!rendered) continue;
      lines.push(`${this.humanize(key)}: ${rendered}`);
    }

    const header = [
      `Title: ${title}`,
      slug ? `Slug: ${slug}` : null,
      `Record type: ${this.humanize(source.table)}`,
    ]
      .filter(Boolean)
      .join("\n");
    return chunkText(lines.join("\n"), { maxChars: 1_600 }).map(
      (text, chunkIndex) => ({
        entityType: source.entityType,
        entityId: id,
        chunkText: text.startsWith("Title:") ? text : `${header}\n${text}`,
        chunkIndex,
        title,
        slug,
      }),
    );
  }

  private recordTitle(
    table: string,
    record: KnowledgeRecord,
    labelsById: Map<string, string>,
  ) {
    const ownLabel = this.primaryLabel(table, record);
    if (ownLabel) return ownLabel;

    const relatedLabels = Object.entries(record)
      .filter(([key]) => key.endsWith("_id"))
      .flatMap(([, value]) => {
        const id = this.scalarText(value);
        const label = id ? labelsById.get(id) : undefined;
        return label ? [label] : [];
      })
      .slice(0, 3);

    return relatedLabels.length
      ? `${this.humanize(table)}: ${relatedLabels.join(" ↔ ")}`
      : this.humanize(table);
  }

  private primaryLabel(table: string, record: KnowledgeRecord) {
    const preferredKeys =
      table === "device_variants"
        ? ["variant_name", "sku_code"]
        : ["title", "name", "product_title", "code", "slug", "version_name"];

    for (const key of preferredKeys) {
      const value = this.scalarText(record[key]);
      if (value) return value;
    }
    return null;
  }

  private recordSlug(table: string, record: KnowledgeRecord) {
    const slug = this.scalarText(record.slug);
    if (!slug) return null;
    const hardwareKind = HARDWARE_ROUTE_BY_TABLE[table];
    return hardwareKind ? `${hardwareKind}/${slug}` : slug;
  }

  private renderValue(
    key: string,
    value: unknown,
    labelsById: Map<string, string>,
  ): string | null {
    if (key.endsWith("_id")) {
      const id = this.scalarText(value);
      return (id && labelsById.get(id)) ?? null;
    }
    if (Array.isArray(value)) {
      return value.length
        ? value.map((item) => this.renderPrimitive(item)).join(", ")
        : null;
    }
    if (typeof value === "object") {
      const rendered = JSON.stringify(value);
      return rendered === "{}" || rendered === "[]" ? null : rendered;
    }
    return this.renderPrimitive(value);
  }

  private renderPrimitive(value: unknown) {
    if (typeof value === "boolean") return value ? "yes" : "no";
    return this.scalarText(value);
  }

  private scalarText(value: unknown): string | null {
    if (typeof value === "string") return value.trim() || null;
    if (typeof value === "number" || typeof value === "bigint") {
      return String(value);
    }
    return null;
  }

  private humanize(value: string) {
    return value
      .replace(/_id$/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }
}

function knowledgeEntityType(table: string): RagEntityType {
  if (table === "organizations") return "organization";
  if (table === "product_families") return "product_family";
  if (table === "device_variants") return "device_variant";
  if (HARDWARE_TABLES.has(table)) return "hardware_module";
  return "catalog_reference";
}
