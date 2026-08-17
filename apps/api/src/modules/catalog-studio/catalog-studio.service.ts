import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from "@nestjs/common";
import { Prisma } from "@spechub/database";
import type { Readable } from "node:stream";
import { USER_ROLES } from "../../common/constants";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CompleteMediaUploadDto,
  CompleteCatalogDraftDto,
  CreateCatalogDraftDto,
  CreateMediaUploadDto,
  CreateScoringProfileDto,
  RestoreCatalogDraftDto,
  UpdateCatalogDraftDto,
} from "./dto/catalog-studio.dto";
import { CatalogEvidenceService } from "./catalog-evidence.service";
import { StorageSigningService } from "./storage-signing.service";

const DRAFT_SELECT = {
  id: true,
  draft_type: true,
  entity_table: true,
  entity_id: true,
  owner_user_id: true,
  title: true,
  step_key: true,
  status: true,
  revision: true,
  payload: true,
  validation_errors: true,
  last_autosaved_at: true,
  published_at: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.catalog_draftsSelect;

const SCORING_PROFILE_SELECT = {
  id: true,
  name: true,
  version: true,
  status: true,
  effective_from: true,
  created_at: true,
  updated_at: true,
  device_category: {
    select: { id: true, name: true, slug: true },
  },
  modules: {
    select: {
      id: true,
      module_key: true,
      label: true,
      description: true,
      weight_percent: true,
      display_order: true,
      metrics: {
        select: {
          id: true,
          metric_key: true,
          label: true,
          weight_percent: true,
          min_value: true,
          max_value: true,
          direction: true,
          scale: true,
          unit: true,
          display_order: true,
        },
        orderBy: { display_order: "asc" as const },
      },
    },
    orderBy: { display_order: "asc" as const },
  },
} satisfies Prisma.scoring_profilesSelect;

const MEDIA_ENTITY_TABLES = new Set([
  "organizations",
  "device_models",
  "device_variants",
  "product_families",
  "chipsets",
  "cpus",
  "gpus",
  "npus",
  "modems",
  "memory_standards",
  "storage_standards",
  "operating_systems",
  "camera_modules",
  "display_units",
  "battery_units",
]);

type ValidationIssue = {
  path: string;
  severity: "error" | "warning";
  message: string;
};

@Injectable()
export class CatalogStudioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageSigning: StorageSigningService,
    private readonly catalogEvidence: CatalogEvidenceService,
  ) {}

  async smartSearch(query: string) {
    const q = query.trim();
    const normalized = this.normalizeSearch(q);
    const models = await this.prisma.device_models.findMany({
      where: {
        deleted_at: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { internal_codename: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
          {
            aliases: {
              some: {
                OR: [
                  { alias: { contains: q, mode: "insensitive" } },
                  {
                    normalized_alias: {
                      contains: normalized,
                      mode: "insensitive",
                    },
                  },
                ],
              },
            },
          },
          {
            device_variants: {
              some: {
                deleted_at: null,
                OR: [
                  { sku_code: { contains: q, mode: "insensitive" } },
                  { market_name: { contains: q, mode: "insensitive" } },
                  { variant_name: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        internal_codename: true,
        summary: true,
        cover_image_url: true,
        product_family: {
          select: {
            name: true,
            brand_org: { select: { name: true, slug: true } },
            device_category: { select: { name: true, slug: true } },
          },
        },
        aliases: {
          select: { alias: true, alias_type: true, region_code: true },
          orderBy: { alias: "asc" },
        },
        device_variants: {
          where: {
            deleted_at: null,
            OR: [
              { sku_code: { contains: q, mode: "insensitive" } },
              { market_name: { contains: q, mode: "insensitive" } },
              { variant_name: { contains: q, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            variant_name: true,
            sku_code: true,
            market_name: true,
          },
          take: 5,
        },
      },
      orderBy: [{ name: "asc" }],
      take: 20,
    });
    return {
      data: models,
      meta: {
        query: q,
        count: models.length,
        searchable_fields: [
          "model",
          "codename",
          "sku",
          "marketing_name",
          "alias",
        ],
      },
    };
  }

  async chipsetBundle(id: string) {
    const chipset = await this.prisma.chipsets.findFirst({
      where: { id, deleted_at: null },
      select: {
        id: true,
        name: true,
        slug: true,
        chip_kind: true,
        process_node: {
          select: {
            id: true,
            name: true,
            node_nm: true,
            foundry: { select: { id: true, name: true, slug: true } },
          },
        },
        chipset_cpu_links: {
          select: {
            is_primary: true,
            cpu: {
              select: {
                id: true,
                name: true,
                slug: true,
                core_count: true,
                thread_count: true,
              },
            },
          },
          orderBy: { is_primary: "desc" },
        },
        chipset_gpu_links: {
          select: {
            is_primary: true,
            gpu: {
              select: {
                id: true,
                name: true,
                slug: true,
                clock_mhz: true,
              },
            },
          },
          orderBy: { is_primary: "desc" },
        },
        chipset_npu_links: {
          select: {
            is_primary: true,
            npu: {
              select: {
                id: true,
                name: true,
                slug: true,
                tops: true,
                tops_int8: true,
              },
            },
          },
          orderBy: { is_primary: "desc" },
        },
        chipset_modem_links: {
          select: {
            is_primary: true,
            is_integrated: true,
            modem: {
              select: {
                id: true,
                name: true,
                slug: true,
                supports_mmwave: true,
                supports_satellite: true,
              },
            },
          },
          orderBy: { is_primary: "desc" },
        },
      },
    });
    if (!chipset) {
      throw new NotFoundException(`Chipset ${id} not found`);
    }
    return {
      data: {
        chipset: {
          id: chipset.id,
          name: chipset.name,
          slug: chipset.slug,
          chip_kind: chipset.chip_kind,
          process_node: chipset.process_node,
        },
        suggested_links: {
          cpus: chipset.chipset_cpu_links.map((link) => ({
            ...link.cpu,
            is_primary: link.is_primary,
          })),
          gpus: chipset.chipset_gpu_links.map((link) => ({
            ...link.gpu,
            is_primary: link.is_primary,
          })),
          npus: chipset.chipset_npu_links.map((link) => ({
            ...link.npu,
            is_primary: link.is_primary,
          })),
          modems: chipset.chipset_modem_links.map((link) => ({
            ...link.modem,
            is_primary: link.is_primary,
            is_integrated: link.is_integrated,
          })),
        },
      },
    };
  }

  listDrafts(userId: string, role: string) {
    return this.prisma.catalog_drafts.findMany({
      where: this.draftAccessWhere(userId, role),
      select: DRAFT_SELECT,
      orderBy: { updated_at: "desc" },
      take: 100,
    });
  }

  async getDraft(id: string, userId: string, role: string) {
    const draft = await this.prisma.catalog_drafts.findFirst({
      where: { id, ...this.draftAccessWhere(userId, role) },
      select: DRAFT_SELECT,
    });
    if (!draft) throw new NotFoundException(`Catalog draft ${id} not found`);
    return draft;
  }

  async createDraft(dto: CreateCatalogDraftDto, userId: string) {
    const payload = dto.payload as Prisma.InputJsonObject;
    const issues = this.validateDraft(dto.draft_type, dto.payload);
    const draft = await this.prisma.$transaction(async (tx) =>
      tx.catalog_drafts.create({
        data: {
          draft_type: dto.draft_type,
          entity_table: dto.entity_table?.trim() || null,
          entity_id: dto.entity_id?.trim() || null,
          owner_user_id: userId,
          title: dto.title.trim(),
          step_key: dto.step_key?.trim() || "general",
          payload,
          validation_errors: issues as unknown as Prisma.InputJsonValue,
          last_autosaved_at: new Date(),
          versions: {
            create: {
              revision: 1,
              actor_user_id: userId,
              payload,
              change_summary: "Khởi tạo bản nháp",
            },
          },
        },
        select: DRAFT_SELECT,
      }),
    );
    await this.catalogEvidence.createInitialClaimsFromDraft(
      draft.id,
      dto.payload,
      userId,
    );
    return draft;
  }

  async updateDraft(
    id: string,
    dto: UpdateCatalogDraftDto,
    userId: string,
    role: string,
  ) {
    const current = await this.getDraft(id, userId, role);
    const issues = this.validateDraft(current.draft_type, dto.payload);
    const payload = dto.payload as Prisma.InputJsonObject;
    const nextRevision = dto.expected_revision + 1;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.catalog_drafts.updateMany({
        where: {
          id,
          revision: dto.expected_revision,
          ...this.draftAccessWhere(userId, role),
        },
        data: {
          payload,
          revision: { increment: 1 },
          validation_errors: issues as unknown as Prisma.InputJsonValue,
          last_autosaved_at: new Date(),
          ...(dto.title !== undefined && { title: dto.title.trim() }),
          ...(dto.step_key !== undefined && {
            step_key: dto.step_key.trim(),
          }),
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          "Bản nháp đã thay đổi ở phiên làm việc khác. Hãy tải revision mới trước khi lưu lại.",
        );
      }
      await tx.catalog_draft_versions.create({
        data: {
          catalog_draft_id: id,
          revision: nextRevision,
          actor_user_id: userId,
          payload,
          change_summary:
            dto.change_summary?.trim() ||
            `Tự động lưu bước ${dto.step_key ?? current.step_key}`,
        },
      });
      return tx.catalog_drafts.findUniqueOrThrow({
        where: { id },
        select: DRAFT_SELECT,
      });
    });
  }

  async draftHistory(id: string, userId: string, role: string) {
    await this.getDraft(id, userId, role);
    return this.prisma.catalog_draft_versions.findMany({
      where: { catalog_draft_id: id },
      select: {
        id: true,
        revision: true,
        change_summary: true,
        created_at: true,
        actor: {
          select: { id: true, display_name: true, username: true, email: true },
        },
      },
      orderBy: { revision: "desc" },
    });
  }

  async restoreDraft(
    id: string,
    dto: RestoreCatalogDraftDto,
    userId: string,
    role: string,
  ) {
    const current = await this.getDraft(id, userId, role);
    const version = await this.prisma.catalog_draft_versions.findUnique({
      where: {
        catalog_draft_id_revision: {
          catalog_draft_id: id,
          revision: dto.restore_revision,
        },
      },
      select: { payload: true },
    });
    if (!version) {
      throw new NotFoundException(
        `Revision ${dto.restore_revision} của draft ${id} không tồn tại`,
      );
    }
    const payload = version.payload as Prisma.InputJsonValue;
    const issues = this.validateDraft(
      current.draft_type,
      version.payload as Record<string, unknown>,
    );
    const nextRevision = dto.expected_revision + 1;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.catalog_drafts.updateMany({
        where: {
          id,
          revision: dto.expected_revision,
          ...this.draftAccessWhere(userId, role),
        },
        data: {
          payload,
          revision: { increment: 1 },
          validation_errors: issues as unknown as Prisma.InputJsonValue,
          last_autosaved_at: new Date(),
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          "Không thể hoàn tác vì bản nháp đã có revision mới.",
        );
      }
      await tx.catalog_draft_versions.create({
        data: {
          catalog_draft_id: id,
          revision: nextRevision,
          actor_user_id: userId,
          payload,
          change_summary: `Khôi phục từ revision ${dto.restore_revision}`,
        },
      });
      return tx.catalog_drafts.findUniqueOrThrow({
        where: { id },
        select: DRAFT_SELECT,
      });
    });
  }

  async validateStoredDraft(id: string, userId: string, role: string) {
    const draft = await this.getDraft(id, userId, role);
    const issues = this.validateDraft(
      draft.draft_type,
      draft.payload as Record<string, unknown>,
    );
    return {
      data: {
        draft_id: id,
        revision: draft.revision,
        valid: issues.every((issue) => issue.severity !== "error"),
        issues,
      },
    };
  }

  async completeDraft(
    id: string,
    dto: CompleteCatalogDraftDto,
    userId: string,
    role: string,
  ) {
    await this.getDraft(id, userId, role);
    const draft = await this.prisma.catalog_drafts.update({
      where: { id },
      data: {
        entity_table: dto.entity_table,
        entity_id: dto.entity_id,
        status: "published",
        published_at: new Date(),
      },
      select: DRAFT_SELECT,
    });
    await this.catalogEvidence.attachDraftClaims(
      id,
      dto.entity_table,
      dto.entity_id,
    );
    return draft;
  }

  entityHistory(entityTable: string, entityId: string) {
    const allowed = new Set([
      "device_models",
      "device_variants",
      "chipsets",
      "cpus",
      "gpus",
      "npus",
      "modems",
      "memory_standards",
      "storage_standards",
      "operating_systems",
    ]);
    if (!allowed.has(entityTable)) {
      throw new BadRequestException(`Không hỗ trợ lịch sử cho ${entityTable}.`);
    }
    return this.prisma.catalog_entity_versions.findMany({
      where: { entity_table: entityTable, entity_id: entityId },
      select: {
        id: true,
        version: true,
        action: true,
        change_set: true,
        created_at: true,
        actor: {
          select: { id: true, display_name: true, username: true, email: true },
        },
      },
      orderBy: { version: "desc" },
    });
  }

  listScoringProfiles() {
    return this.prisma.scoring_profiles.findMany({
      select: SCORING_PROFILE_SELECT,
      orderBy: [{ device_category: { name: "asc" } }, { version: "desc" }],
    });
  }

  async createScoringProfile(
    categoryId: string,
    dto: CreateScoringProfileDto,
    userId: string,
  ) {
    this.assertScoringProfile(dto);
    return this.prisma.$transaction(async (tx) => {
      const category = await tx.device_categories.findFirst({
        where: { id: categoryId, deleted_at: null },
        select: { id: true },
      });
      if (!category) {
        throw new NotFoundException(`Device category ${categoryId} not found`);
      }
      const latest = await tx.scoring_profiles.aggregate({
        where: { device_category_id: categoryId },
        _max: { version: true },
      });
      return tx.scoring_profiles.create({
        data: {
          device_category_id: categoryId,
          name: dto.name.trim(),
          version: (latest._max.version ?? 0) + 1,
          created_by_user_id: userId,
          modules: {
            create: dto.modules.map((module, moduleIndex) => ({
              module_key: module.key,
              label: module.label.trim(),
              description: module.description?.trim() || null,
              weight_percent: module.weight,
              display_order: moduleIndex,
              metrics: {
                create: module.metrics.map((metric, metricIndex) => ({
                  metric_key: metric.key,
                  label: metric.label.trim(),
                  weight_percent: metric.weight,
                  min_value: metric.min,
                  max_value: metric.max,
                  direction: metric.direction ?? "higher",
                  scale: metric.scale ?? "linear",
                  unit: metric.unit?.trim() || null,
                  display_order: metricIndex,
                })),
              },
            })),
          },
        },
        select: SCORING_PROFILE_SELECT,
      });
    });
  }

  async publishScoringProfile(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.scoring_profiles.findUnique({
        where: { id },
        select: { id: true, device_category_id: true, status: true },
      });
      if (!profile) {
        throw new NotFoundException(`Scoring profile ${id} not found`);
      }
      if (profile.status === "published") {
        return tx.scoring_profiles.findUniqueOrThrow({
          where: { id },
          select: SCORING_PROFILE_SELECT,
        });
      }
      await tx.scoring_profiles.updateMany({
        where: {
          device_category_id: profile.device_category_id,
          status: "published",
          id: { not: id },
        },
        data: { status: "archived" },
      });
      return tx.scoring_profiles.update({
        where: { id },
        data: { status: "published", effective_from: new Date() },
        select: SCORING_PROFILE_SELECT,
      });
    });
  }

  async createMediaUpload(dto: CreateMediaUploadDto) {
    if (!MEDIA_ENTITY_TABLES.has(dto.entity_table)) {
      throw new BadRequestException(
        `Không hỗ trợ đính kèm media cho ${dto.entity_table}.`,
      );
    }
    const maxBytes =
      dto.asset_type === "image" ? 25 * 1024 * 1024 : 2 * 1024 * 1024 * 1024;
    if (dto.file_size_bytes > maxBytes) {
      throw new PayloadTooLargeException(
        dto.asset_type === "image"
          ? "Ảnh không được vượt quá 25 MB."
          : "Video không được vượt quá 2 GB.",
      );
    }
    if (
      (dto.asset_type === "image" && !dto.mime_type.startsWith("image/")) ||
      (dto.asset_type === "video" && !dto.mime_type.startsWith("video/"))
    ) {
      throw new BadRequestException(
        "asset_type không khớp với MIME type của tệp.",
      );
    }
    const storage = this.storageSigning.storageMetadata();
    const objectKey = this.storageSigning.createObjectKey(
      dto.entity_table,
      dto.filename,
    );
    const result = await this.prisma.$transaction(async (tx) => {
      await this.assertMediaEntityExists(tx, dto.entity_table, dto.entity_id);
      if (dto.is_primary) {
        await tx.entity_media.updateMany({
          where: {
            entity_table: dto.entity_table,
            entity_id: dto.entity_id,
            role: dto.role,
          },
          data: { is_primary: false },
        });
      }
      return tx.media_assets.create({
        data: {
          asset_type: dto.asset_type,
          storage_provider: storage.provider,
          storage_bucket: storage.bucket,
          object_key: objectKey,
          original_filename: dto.filename,
          upload_status: "pending",
          mime_type: dto.mime_type,
          width_px: dto.width_px,
          height_px: dto.height_px,
          duration_ms: dto.duration_ms,
          file_size_bytes: dto.file_size_bytes,
          alt_text: dto.alt_text?.trim() || null,
          entity_media: {
            create: {
              entity_table: dto.entity_table,
              entity_id: dto.entity_id,
              role: dto.role,
              is_primary: dto.is_primary ?? false,
            },
          },
        },
        select: {
          id: true,
          asset_type: true,
          object_key: true,
          mime_type: true,
          upload_status: true,
          file_size_bytes: true,
        },
      });
    });
    return {
      data: {
        ...result,
        file_size_bytes: result.file_size_bytes?.toString() ?? null,
        upload_url: this.storageSigning.createUploadUrl(result.id, objectKey),
        expires_in_seconds: 900,
        public_url: this.storageSigning.publicUrl(objectKey),
      },
    };
  }

  async uploadLocalMediaContent(
    id: string,
    expiresAt: number,
    token: string,
    contentType: string | undefined,
    body: Readable,
  ) {
    const current = await this.prisma.media_assets.findUnique({
      where: { id },
      select: {
        id: true,
        asset_type: true,
        storage_provider: true,
        object_key: true,
        upload_status: true,
        mime_type: true,
        file_size_bytes: true,
      },
    });
    if (!current) throw new NotFoundException(`Media asset ${id} not found`);
    if (
      current.storage_provider !== "local" ||
      !current.object_key ||
      !current.file_size_bytes
    ) {
      throw new BadRequestException(
        "Media asset này không sử dụng kho lưu trữ cục bộ.",
      );
    }
    if (current.upload_status !== "pending") {
      throw new ConflictException("Media asset đã được tải lên trước đó.");
    }
    const normalizedContentType = contentType?.split(";")[0]?.trim();
    if (
      current.mime_type &&
      normalizedContentType &&
      current.mime_type !== normalizedContentType
    ) {
      throw new BadRequestException(
        `MIME type không khớp: nhận ${normalizedContentType}, dự kiến ${current.mime_type}.`,
      );
    }
    this.storageSigning.verifyLocalUploadToken(
      current.id,
      current.object_key,
      expiresAt,
      token,
    );
    const maxBytes =
      current.asset_type === "image"
        ? 25 * 1024 * 1024
        : 2 * 1024 * 1024 * 1024;
    const saved = await this.storageSigning.writeLocalObject(
      current.object_key,
      body,
      Number(current.file_size_bytes),
      maxBytes,
    );
    await this.prisma.media_assets.update({
      where: { id },
      data: {
        checksum_sha256: saved.checksumSha256,
        cdn_url: saved.publicUrl,
      },
    });
    return {
      data: {
        id,
        received_bytes: saved.receivedBytes,
        checksum_sha256: saved.checksumSha256,
      },
    };
  }

  async completeMediaUpload(id: string, dto: CompleteMediaUploadDto) {
    const current = await this.prisma.media_assets.findUnique({
      where: { id },
      select: {
        id: true,
        upload_status: true,
        storage_provider: true,
        object_key: true,
      },
    });
    if (!current) throw new NotFoundException(`Media asset ${id} not found`);
    if (current.upload_status === "ready") {
      return { data: current };
    }
    if (
      current.storage_provider === "local" &&
      (!current.object_key ||
        !this.storageSigning.localObjectExists(current.object_key))
    ) {
      throw new BadRequestException(
        "Chưa nhận được nội dung tệp trong kho lưu trữ cục bộ.",
      );
    }
    const updated = await this.prisma.media_assets.update({
      where: { id },
      data: {
        upload_status: "ready",
        checksum_sha256: dto.checksum_sha256,
        cdn_url:
          current.storage_provider === "local" && current.object_key
            ? this.storageSigning.publicUrl(current.object_key)
            : undefined,
      },
      select: {
        id: true,
        asset_type: true,
        storage_provider: true,
        storage_bucket: true,
        object_key: true,
        mime_type: true,
        width_px: true,
        height_px: true,
        duration_ms: true,
        file_size_bytes: true,
        checksum_sha256: true,
        upload_status: true,
      },
    });
    return {
      data: {
        ...updated,
        duration_ms: updated.duration_ms?.toString() ?? null,
        file_size_bytes: updated.file_size_bytes?.toString() ?? null,
      },
    };
  }

  private async assertMediaEntityExists(
    tx: Prisma.TransactionClient,
    entityTable: string,
    entityId: string,
  ) {
    let entity: { id: string } | null = null;
    switch (entityTable) {
      case "organizations":
        entity = await tx.organizations.findFirst({
          where: { id: entityId, deleted_at: null },
          select: { id: true },
        });
        break;
      case "device_models":
        entity = await tx.device_models.findFirst({
          where: { id: entityId, deleted_at: null },
          select: { id: true },
        });
        break;
      case "device_variants":
        entity = await tx.device_variants.findFirst({
          where: { id: entityId, deleted_at: null },
          select: { id: true },
        });
        break;
      case "product_families":
        entity = await tx.product_families.findFirst({
          where: { id: entityId, deleted_at: null },
          select: { id: true },
        });
        break;
      case "chipsets":
        entity = await tx.chipsets.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        break;
      case "cpus":
        entity = await tx.cpus.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        break;
      case "gpus":
        entity = await tx.gpus.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        break;
      case "npus":
        entity = await tx.npus.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        break;
      case "modems":
        entity = await tx.modems.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        break;
      case "memory_standards":
        entity = await tx.memory_standards.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        break;
      case "storage_standards":
        entity = await tx.storage_standards.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        break;
      case "operating_systems":
        entity = await tx.operating_systems.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        break;
      case "camera_modules":
        entity = await tx.camera_modules.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        break;
      case "display_units":
        entity = await tx.display_units.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        break;
      case "battery_units":
        entity = await tx.battery_units.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        break;
    }
    if (!entity) {
      throw new BadRequestException(
        `Không thể đính kèm media: ${entityTable}/${entityId} không tồn tại.`,
      );
    }
  }

  private draftAccessWhere(
    userId: string,
    role: string,
  ): Prisma.catalog_draftsWhereInput {
    return role === USER_ROLES.ADMIN ? {} : { owner_user_id: userId };
  }

  private normalizeSearch(value: string) {
    return value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  private validateDraft(
    draftType: string,
    payload: Record<string, unknown>,
  ): ValidationIssue[] {
    if (draftType !== "device") return [];
    const issues: ValidationIssue[] = [];
    const required: Array<[string, string]> = [
      ["general.name", "Cần tên thiết bị."],
      ["general.slug", "Cần slug thiết bị."],
      ["general.product_family_id", "Cần dòng sản phẩm."],
      ["general.release_status_id", "Cần trạng thái phát hành."],
      ["model.variant_name", "Cần tên phiên bản thương mại."],
    ];
    for (const [path, message] of required) {
      if (!this.valueAtPath(payload, path)) {
        issues.push({ path, severity: "error", message });
      }
    }
    const summary = this.valueAtPath(payload, "description.summary");
    if (typeof summary === "string" && summary.length > 600) {
      issues.push({
        path: "description.summary",
        severity: "error",
        message: "Tóm tắt trên card không được vượt quá 600 ký tự.",
      });
    }
    for (const path of [
      "hardware.chipset_id",
      "display.display_unit_id",
      "camera.systems",
      "battery.battery_unit_id",
      "software.launch_os_version_id",
      "media.cover_filename",
    ]) {
      if (!this.valueAtPath(payload, path)) {
        issues.push({
          path,
          severity: "warning",
          message: `Nên hoàn thiện ${path.split(".")[0]} trước khi xuất bản.`,
        });
      }
    }
    const sectionKeys = new Set(
      Array.isArray(this.valueAtPath(payload, "description.sections"))
        ? (
            this.valueAtPath(payload, "description.sections") as Array<
              Record<string, unknown>
            >
          )
            .map((section) => section.section_key)
            .filter((value): value is string => typeof value === "string")
        : [],
    );
    for (const sectionKey of [
      "overview",
      "design",
      "performance",
      "camera",
      "battery",
      "display",
      "software",
      "highlights",
      "drawbacks",
      "audience",
    ]) {
      if (!sectionKeys.has(sectionKey)) {
        issues.push({
          path: `description.sections.${sectionKey}`,
          severity: "warning",
          message: `Thiếu phần nội dung ${sectionKey}.`,
        });
      }
    }
    return issues;
  }

  private valueAtPath(payload: Record<string, unknown>, path: string) {
    return path.split(".").reduce<unknown>((value, key) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return undefined;
      }
      return (value as Record<string, unknown>)[key];
    }, payload);
  }

  private assertScoringProfile(dto: CreateScoringProfileDto) {
    if (!dto.modules.length) {
      throw new BadRequestException(
        "Công thức chấm điểm cần ít nhất một nhóm.",
      );
    }
    const moduleKeys = new Set<string>();
    const moduleWeight = dto.modules.reduce(
      (total, module) => total + module.weight,
      0,
    );
    if (Math.abs(moduleWeight - 100) > 0.001) {
      throw new BadRequestException(
        `Tổng trọng số nhóm phải bằng 100; hiện tại ${moduleWeight}.`,
      );
    }
    for (const module of dto.modules) {
      if (moduleKeys.has(module.key)) {
        throw new BadRequestException(`Nhóm ${module.key} bị trùng.`);
      }
      moduleKeys.add(module.key);
      if (!module.metrics.length) {
        throw new BadRequestException(
          `Nhóm ${module.key} cần ít nhất một chỉ số.`,
        );
      }
      const metricKeys = new Set<string>();
      const metricWeight = module.metrics.reduce(
        (total, metric) => total + metric.weight,
        0,
      );
      if (Math.abs(metricWeight - 100) > 0.001) {
        throw new BadRequestException(
          `Tổng trọng số chỉ số của ${module.key} phải bằng 100; hiện tại ${metricWeight}.`,
        );
      }
      for (const metric of module.metrics) {
        if (metricKeys.has(metric.key)) {
          throw new BadRequestException(
            `Chỉ số ${module.key}/${metric.key} bị trùng.`,
          );
        }
        if (metric.max <= metric.min) {
          throw new BadRequestException(
            `Khoảng chuẩn hóa ${module.key}/${metric.key} không hợp lệ.`,
          );
        }
        metricKeys.add(metric.key);
      }
    }
  }
}
