import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@spechub/database";
import { USER_ROLES } from "../../common/constants";
import { PrismaService } from "../../prisma/prisma.service";
import type {
  CreateCatalogEvidenceClaimDto,
  ListCatalogEvidenceClaimsDto,
  ResolveCatalogEvidenceClaimDto,
} from "./dto/catalog-studio.dto";

type ClaimSourceType = CreateCatalogEvidenceClaimDto["source_type"];
type ClaimKind = CreateCatalogEvidenceClaimDto["claim_kind"];
type ClaimTarget = {
  catalog_draft_id?: string;
  entity_table?: string;
  entity_id?: string;
};

type InitialClaimInput = {
  target: ClaimTarget;
  field_path: string;
  value: unknown;
  display_value: string;
  source_type: ClaimSourceType;
  source_label: string;
  source_url?: string;
  source_id?: string;
  source_title?: string;
  evidence_excerpt?: string;
  claim_kind: ClaimKind;
  scope_region?: string;
  scope_sku?: string;
  confidence?: number;
  methodology?: string;
  tested_at?: Date;
  retrieved_at?: Date;
  created_by_user_id?: string;
  detect_conflicts?: boolean;
};

const SOURCE_POLICIES: Record<
  ClaimSourceType,
  { kind: ClaimKind; trust: number; maxConfidence: number }
> = {
  official: { kind: "declared", trust: 5, maxConfidence: 0.98 },
  certification: { kind: "declared", trust: 5, maxConfidence: 0.95 },
  lab: { kind: "measured", trust: 4, maxConfidence: 0.92 },
  benchmark: { kind: "benchmark", trust: 4, maxConfidence: 0.9 },
  retail: { kind: "commercial", trust: 2, maxConfidence: 0.7 },
  editorial: { kind: "editorial", trust: 3, maxConfidence: 0.75 },
};

const CLAIM_SELECT = {
  id: true,
  catalog_draft_id: true,
  entity_table: true,
  entity_id: true,
  field_path: true,
  value_json: true,
  display_value: true,
  claim_kind: true,
  scope_region: true,
  scope_sku: true,
  methodology: true,
  tested_at: true,
  retrieved_at: true,
  evidence_excerpt: true,
  confidence: true,
  status: true,
  resolution_note: true,
  reviewed_at: true,
  created_at: true,
  updated_at: true,
  source: {
    select: {
      id: true,
      name: true,
      slug: true,
      source_type: true,
      trust_level: true,
      base_url: true,
    },
  },
  citation: {
    select: {
      id: true,
      url: true,
      title: true,
      published_at: true,
      retrieved_at: true,
      excerpt: true,
    },
  },
  created_by: {
    select: { id: true, display_name: true, username: true, email: true },
  },
  reviewed_by: {
    select: { id: true, display_name: true, username: true, email: true },
  },
} satisfies Prisma.catalog_attribute_claimsSelect;

@Injectable()
export class CatalogEvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  async createClaim(
    dto: CreateCatalogEvidenceClaimDto,
    userId: string,
    role: string,
  ) {
    const target = await this.assertTarget(dto, userId, role);
    const sourceUrl = this.assertPublicCitationUrl(dto.source_url);
    this.assertSourcePolicy(dto.source_type, dto.claim_kind, dto);
    return this.createClaimRecord({
      target,
      field_path: dto.field_path,
      value: dto.value,
      display_value: dto.display_value?.trim() || this.displayValue(dto.value),
      source_type: dto.source_type,
      source_label: dto.source_label,
      source_url: sourceUrl.href,
      source_title: dto.source_title,
      evidence_excerpt: dto.evidence_excerpt,
      claim_kind: dto.claim_kind,
      scope_region: dto.scope_region,
      scope_sku: dto.scope_sku,
      methodology: dto.methodology,
      tested_at: dto.tested_at ? new Date(dto.tested_at) : undefined,
      confidence: dto.confidence,
      created_by_user_id: userId,
    });
  }

  async listClaims(
    query: ListCatalogEvidenceClaimsDto,
    userId: string,
    role: string,
  ) {
    const target = await this.assertTarget(query, userId, role);
    const claims = await this.findClaims(target, query.status);
    return { data: claims };
  }

  async coverage(
    query: ListCatalogEvidenceClaimsDto,
    userId: string,
    role: string,
  ) {
    const target = await this.assertTarget(query, userId, role);
    const claims = await this.findClaims(target);
    const fields = new Map<string, (typeof claims)[number]>();
    const priority: Record<string, number> = {
      accepted: 5,
      conflict: 4,
      candidate: 3,
      stale: 2,
      rejected: 1,
    };
    for (const claim of claims) {
      const current = fields.get(claim.field_path);
      if (
        !current ||
        priority[claim.status] > priority[current.status] ||
        (priority[claim.status] === priority[current.status] &&
          claim.created_at > current.created_at)
      ) {
        fields.set(claim.field_path, claim);
      }
    }
    const counts = claims.reduce(
      (result, claim) => {
        result[claim.status] = (result[claim.status] ?? 0) + 1;
        return result;
      },
      {} as Record<string, number>,
    );
    return {
      data: {
        target,
        summary: {
          fields: fields.size,
          claims: claims.length,
          accepted: counts.accepted ?? 0,
          candidates: counts.candidate ?? 0,
          conflicts: counts.conflict ?? 0,
          stale: counts.stale ?? 0,
          rejected: counts.rejected ?? 0,
        },
        fields: Array.from(fields.entries())
          .map(([field_path, claim]) => ({
            field_path,
            status: claim.status,
            display_value: claim.display_value,
            source: claim.source.name,
            confidence: claim.confidence,
            claim_count: claims.filter((item) => item.field_path === field_path)
              .length,
          }))
          .sort((left, right) =>
            left.field_path.localeCompare(right.field_path),
          ),
      },
    };
  }

  async resolveClaim(
    id: string,
    dto: ResolveCatalogEvidenceClaimDto,
    userId: string,
    role: string,
  ) {
    const claim = await this.prisma.catalog_attribute_claims.findUnique({
      where: { id },
      select: {
        id: true,
        catalog_draft_id: true,
        entity_table: true,
        entity_id: true,
        field_path: true,
        value_json: true,
        claim_kind: true,
        scope_region: true,
        scope_sku: true,
      },
    });
    if (!claim) throw new NotFoundException("Không tìm thấy bằng chứng.");
    await this.assertTarget(
      claim.catalog_draft_id
        ? { catalog_draft_id: claim.catalog_draft_id }
        : {
            entity_table: claim.entity_table ?? undefined,
            entity_id: claim.entity_id ?? undefined,
          },
      userId,
      role,
    );

    if (dto.status === "accepted" && claim.claim_kind === "declared") {
      const conflicts = await this.conflictingClaims(claim, claim.id);
      if (conflicts.length) {
        throw new ConflictException(
          "Trường này vẫn có bằng chứng khác giá trị. Hãy từ chối hoặc đánh dấu cũ các bằng chứng còn lại trước khi chấp nhận.",
        );
      }
    }
    return this.prisma.catalog_attribute_claims.update({
      where: { id },
      data: {
        status: dto.status,
        resolution_note: dto.resolution_note?.trim() || null,
        reviewed_by_user_id: userId,
        reviewed_at: new Date(),
      },
      select: CLAIM_SELECT,
    });
  }

  async attachDraftClaims(
    draftId: string,
    entityTable: string,
    entityId: string,
  ) {
    await this.prisma.catalog_attribute_claims.updateMany({
      where: { catalog_draft_id: draftId },
      data: { entity_table: entityTable, entity_id: entityId },
    });
  }

  async createInitialClaimsFromDraft(
    draftId: string,
    payload: Record<string, unknown>,
    userId: string,
  ) {
    const provenance = asRecord(payload.provenance);
    const source = asRecord(provenance?.source);
    const fields = asRecord(provenance?.fields);
    if (!source || !fields) return;
    const inputType = stringValue(source.input_type);
    const sourceType: ClaimSourceType =
      inputType === "url" ? "official" : "editorial";
    const sourceLabel =
      stringValue(source.label) ||
      (sourceType === "official" ? "Nguồn chính thức" : "Nguồn nhập thủ công");
    const sourceUrl = stringValue(source.url) || undefined;
    const retrievedAt = dateValue(source.retrieved_at) ?? new Date();
    const hardware = asRecord(payload.hardware_module);
    const model = asRecord(payload.model);
    const importedSku = asRecord(fields.sku_code);
    const scopeSku =
      stringValue(model?.sku_code) ||
      stringValue(importedSku?.value) ||
      undefined;
    const claimSource = await this.ensureSource(
      sourceType,
      sourceLabel,
      sourceUrl,
    );

    for (const [field, item] of Object.entries(fields)) {
      const evidence = asRecord(item);
      const value = stringValue(evidence?.value);
      const confidence = numberValue(evidence?.confidence);
      if (!value || !confidence || isDerivedQuickIntakeField(field)) continue;
      await this.createClaimRecord({
        target: { catalog_draft_id: draftId },
        field_path: quickIntakeFieldPath(field, Boolean(hardware)),
        value,
        display_value: value,
        source_type: sourceType,
        source_label: sourceLabel,
        source_url: sourceUrl,
        source_id: claimSource.id,
        evidence_excerpt: stringValue(evidence?.source_excerpt),
        claim_kind: sourceType === "official" ? "declared" : "editorial",
        scope_sku: scopeSku,
        confidence,
        methodology:
          sourceType === "official"
            ? "Trích xuất từ trang Tech Specs chính thức; chờ biên tập viên xác nhận."
            : "Giá trị được nhập thủ công; chờ biên tập viên xác nhận.",
        retrieved_at: retrievedAt,
        created_by_user_id: userId,
        detect_conflicts: false,
      });
    }
  }

  private async createClaimRecord(input: InitialClaimInput) {
    const source = input.source_id
      ? { id: input.source_id }
      : await this.ensureSource(
          input.source_type,
          input.source_label,
          input.source_url,
        );
    const citation = await this.prisma.citations.create({
      data: {
        source_id: source.id,
        url: input.source_url || null,
        title: input.source_title?.trim() || null,
        retrieved_at: input.retrieved_at ?? new Date(),
        excerpt: input.evidence_excerpt?.trim() || null,
      },
      select: { id: true },
    });
    const conflicts =
      input.claim_kind === "declared" && input.detect_conflicts !== false
        ? await this.conflictingClaims(
            {
              ...input.target,
              field_path: input.field_path,
              value_json: input.value as Prisma.JsonValue,
              claim_kind: input.claim_kind,
              scope_region: input.scope_region?.trim() || null,
              scope_sku: input.scope_sku?.trim() || null,
            },
            undefined,
          )
        : [];
    if (conflicts.length) {
      await this.prisma.catalog_attribute_claims.updateMany({
        where: { id: { in: conflicts.map((claim) => claim.id) } },
        data: { status: "conflict" },
      });
    }
    const policy = SOURCE_POLICIES[input.source_type];
    return this.prisma.catalog_attribute_claims.create({
      data: {
        ...input.target,
        field_path: input.field_path.trim(),
        value_json: input.value as Prisma.InputJsonValue,
        display_value: input.display_value.trim() || null,
        claim_kind: input.claim_kind,
        source_id: source.id,
        citation_id: citation.id,
        scope_region: input.scope_region?.trim().toUpperCase() || null,
        scope_sku: input.scope_sku?.trim() || null,
        methodology: input.methodology?.trim() || null,
        tested_at: input.tested_at ?? null,
        retrieved_at: input.retrieved_at ?? new Date(),
        evidence_excerpt: input.evidence_excerpt?.trim() || null,
        confidence: this.confidenceFor(input.confidence, policy.maxConfidence),
        status: conflicts.length ? "conflict" : "candidate",
        created_by_user_id: input.created_by_user_id ?? null,
      },
      select: CLAIM_SELECT,
    });
  }

  private async findClaims(target: ClaimTarget, status?: string) {
    return this.prisma.catalog_attribute_claims.findMany({
      where: {
        ...this.targetWhere(target),
        ...(status ? { status } : {}),
      },
      select: CLAIM_SELECT,
      orderBy: [{ field_path: "asc" }, { created_at: "desc" }],
    });
  }

  private async conflictingClaims(
    claim: {
      catalog_draft_id?: string | null;
      entity_table?: string | null;
      entity_id?: string | null;
      field_path: string;
      value_json: Prisma.JsonValue;
      claim_kind: string;
      scope_region?: string | null;
      scope_sku?: string | null;
    },
    excludedId?: string,
  ) {
    const target: ClaimTarget = claim.catalog_draft_id
      ? { catalog_draft_id: claim.catalog_draft_id }
      : {
          entity_table: claim.entity_table ?? undefined,
          entity_id: claim.entity_id ?? undefined,
        };
    const candidates = await this.prisma.catalog_attribute_claims.findMany({
      where: {
        ...this.targetWhere(target),
        field_path: claim.field_path,
        claim_kind: claim.claim_kind,
        scope_region: claim.scope_region?.trim().toUpperCase() || null,
        scope_sku: claim.scope_sku?.trim() || null,
        status: { in: ["candidate", "accepted", "conflict"] },
        ...(excludedId ? { id: { not: excludedId } } : {}),
      },
      select: { id: true, value_json: true },
    });
    const value = this.canonicalValue(claim.value_json);
    return candidates.filter(
      (candidate) => this.canonicalValue(candidate.value_json) !== value,
    );
  }

  private async assertTarget(
    target: ClaimTarget,
    userId: string,
    role: string,
  ): Promise<ClaimTarget> {
    const draftId = target.catalog_draft_id?.trim();
    const entityTable = target.entity_table?.trim();
    const entityId = target.entity_id?.trim();
    const hasDraft = Boolean(draftId);
    const hasEntity = Boolean(entityTable || entityId);
    if (hasDraft === hasEntity || (hasEntity && (!entityTable || !entityId))) {
      throw new BadRequestException(
        "Bằng chứng phải gắn với đúng một draft hoặc một entity đã xuất bản.",
      );
    }
    if (draftId) {
      const draft = await this.prisma.catalog_drafts.findFirst({
        where: {
          id: draftId,
          ...(role === USER_ROLES.ADMIN ? {} : { owner_user_id: userId }),
        },
        select: { id: true },
      });
      if (!draft)
        throw new NotFoundException(
          "Không tìm thấy hoặc không có quyền với draft.",
        );
      return { catalog_draft_id: draftId };
    }
    await this.assertEntityExists(entityTable!, entityId!);
    return { entity_table: entityTable!, entity_id: entityId! };
  }

  private async assertEntityExists(entityTable: string, entityId: string) {
    const select = { id: true } as const;
    let entity: { id: string } | null;
    switch (entityTable) {
      case "device_models":
        entity = await this.prisma.device_models.findFirst({
          where: { id: entityId, deleted_at: null },
          select,
        });
        break;
      case "device_variants":
        entity = await this.prisma.device_variants.findFirst({
          where: { id: entityId, deleted_at: null },
          select,
        });
        break;
      case "chipsets":
        entity = await this.prisma.chipsets.findFirst({
          where: { id: entityId, deleted_at: null },
          select,
        });
        break;
      case "cpus":
        entity = await this.prisma.cpus.findUnique({
          where: { id: entityId },
          select,
        });
        break;
      case "gpus":
        entity = await this.prisma.gpus.findUnique({
          where: { id: entityId },
          select,
        });
        break;
      case "npus":
        entity = await this.prisma.npus.findUnique({
          where: { id: entityId },
          select,
        });
        break;
      case "modems":
        entity = await this.prisma.modems.findUnique({
          where: { id: entityId },
          select,
        });
        break;
      case "memory_standards":
        entity = await this.prisma.memory_standards.findUnique({
          where: { id: entityId },
          select,
        });
        break;
      case "storage_standards":
        entity = await this.prisma.storage_standards.findUnique({
          where: { id: entityId },
          select,
        });
        break;
      case "operating_systems":
        entity = await this.prisma.operating_systems.findUnique({
          where: { id: entityId },
          select,
        });
        break;
      default:
        throw new BadRequestException(
          `Không hỗ trợ evidence cho ${entityTable}.`,
        );
    }
    if (!entity) throw new NotFoundException("Entity đích không tồn tại.");
  }

  private targetWhere(target: ClaimTarget) {
    if (target.catalog_draft_id) {
      return { catalog_draft_id: target.catalog_draft_id };
    }
    return {
      entity_table: target.entity_table,
      entity_id: target.entity_id,
    };
  }

  private async ensureSource(
    sourceType: ClaimSourceType,
    sourceLabel: string,
    sourceUrl?: string,
  ) {
    const label = sourceLabel.trim();
    const parsed = sourceUrl ? new URL(sourceUrl) : null;
    const slug = ["claim", sourceType, this.slugify(parsed?.hostname || label)]
      .filter(Boolean)
      .join("-")
      .slice(0, 180);
    const existing = await this.prisma.sources.findFirst({
      where: { OR: [{ slug }, { name: label }] },
      select: { id: true },
    });
    if (existing) return existing;
    try {
      return await this.prisma.sources.create({
        data: {
          name: label,
          slug,
          source_type: sourceType,
          base_url: parsed?.origin ?? null,
          trust_level: SOURCE_POLICIES[sourceType].trust,
          description: "Nguồn được tạo từ evidence trong Catalog Studio.",
        },
        select: { id: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const source = await this.prisma.sources.findFirst({
          where: { OR: [{ slug }, { name: label }] },
          select: { id: true },
        });
        if (source) return source;
      }
      throw error;
    }
  }

  private assertSourcePolicy(
    sourceType: ClaimSourceType,
    claimKind: ClaimKind,
    dto: CreateCatalogEvidenceClaimDto,
  ) {
    const expected = SOURCE_POLICIES[sourceType].kind;
    if (claimKind !== expected) {
      throw new BadRequestException(
        `Nguồn ${sourceType} chỉ được dùng cho claim ${expected}.`,
      );
    }
    if (["lab", "benchmark"].includes(sourceType) && !dto.methodology?.trim()) {
      throw new BadRequestException(
        "Nguồn đo lường/benchmark phải ghi phương pháp hoặc môi trường kiểm thử.",
      );
    }
    if (sourceType === "benchmark" && !dto.tested_at) {
      throw new BadRequestException(
        "Benchmark phải có ngày kiểm thử để tránh so sánh kết quả lỗi thời.",
      );
    }
    if (sourceType === "retail" && !dto.scope_region?.trim()) {
      throw new BadRequestException(
        "Nguồn bán lẻ phải chỉ rõ khu vực áp dụng.",
      );
    }
  }

  private assertPublicCitationUrl(value: string) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new BadRequestException("URL bằng chứng không hợp lệ.");
    }
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !url.hostname
    ) {
      throw new BadRequestException(
        "URL bằng chứng phải là HTTPS công khai và không chứa thông tin đăng nhập.",
      );
    }
    return url;
  }

  private confidenceFor(value: number | undefined, max: number) {
    const proposed = value ?? max;
    return new Prisma.Decimal(Math.max(0, Math.min(max, proposed)).toFixed(2));
  }

  private canonicalValue(value: unknown) {
    return JSON.stringify(sortJson(value));
  }

  private displayValue(value: unknown) {
    if (typeof value === "string") return value.slice(0, 1000);
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    return this.canonicalValue(value).slice(0, 1000);
  }

  private slugify(value: string) {
    return value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 120);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function dateValue(value: unknown) {
  const date = typeof value === "string" ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, sortJson(item)]),
  );
}

function isDerivedQuickIntakeField(field: string) {
  return ["kind", "slug", "chipset_id", "product_family_id"].includes(field);
}

function quickIntakeFieldPath(field: string, hardware: boolean) {
  if (hardware) return `hardware_module.${field}`;
  const mapped: Record<string, string> = {
    name: "general.name",
    summary: "general.summary",
    variant_name: "model.variant_name",
    sku_code: "model.sku_code",
    market_name: "model.market_name",
    announcement_date: "model.announcement_date",
    release_date: "model.release_date",
    chipset: "hardware.chipset_label",
    memory_capacity_gb: "configuration.memory_capacity_gb",
    storage_capacity_gb: "configuration.storage_capacity_gb",
    display_size_inch: "display.size_inch",
    display_refresh_rate_hz: "display.refresh_rate_hz",
    resolution_width: "display.resolution_width",
    resolution_height: "display.resolution_height",
    battery_capacity_mah: "battery.capacity_mah",
    wired_charging_w: "battery.wired_charging_w",
    rear_main_megapixel: "camera.rear_main.effective_megapixel",
  };
  return mapped[field] ?? `intake.${field}`;
}
