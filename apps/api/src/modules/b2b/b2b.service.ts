import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DeviceModelsService } from "../device-models/device-models.service";
import { DeviceVariantsService } from "../device-variants/device-variants.service";
import {
  type B2bCatalogRecordReferenceDto,
  type B2bEntityType,
  type QueryB2bCatalogChangesDto,
  type ResolveB2bCatalogRecordsDto,
} from "./dto/b2b-catalog.dto";

const B2B_CONTRACT_VERSION = "2026-08-09";

type B2bChangeOperation = "upsert" | "delete";

type B2bChangeCandidate = {
  entity_type: B2bEntityType;
  id: string;
  operation: B2bChangeOperation;
  changed_at: Date;
};

type B2bChangePosition = {
  changed_at: string;
  entity_type: B2bEntityType;
  id: string;
};

type B2bSyncCursor = {
  version: 1;
  since: string | null;
  through?: string;
  after?: B2bChangePosition;
};

@Injectable()
export class B2bService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deviceModelsService: DeviceModelsService,
    private readonly deviceVariantsService: DeviceVariantsService,
  ) {}

  getCatalogInfo() {
    return {
      contract_version: B2B_CONTRACT_VERSION,
      resources: [
        {
          entity_type: "device_model",
          list_path: "/b2b/device-models",
          detail_path: "/b2b/device-models/{slug}",
        },
        {
          entity_type: "device_variant",
          list_path: "/b2b/device-variants",
          detail_path: "/b2b/device-variants/{id}",
        },
      ],
      synchronization: {
        changes_path: "/b2b/catalog/changes",
        resolve_path: "/b2b/catalog/records",
        cursor: "Opaque cursor. Persist and pass next_cursor until the next sync run.",
        deletion: "Delete events are tombstones; remove the resource from the local copy.",
      },
      limits: {
        changes_page_size: 100,
        resolve_batch_size: 50,
      },
    };
  }

  async listChanges(query: QueryB2bCatalogChangesDto) {
    const cursor = this.readCursor(query.cursor);
    const since = cursor?.since ? this.readCursorDate(cursor.since) : undefined;
    const through = cursor?.through
      ? this.readCursorDate(cursor.through)
      : new Date();
    const after = cursor?.after;
    const limit = query.limit ?? 100;

    if (after && !cursor?.through) {
      throw new BadRequestException("Invalid B2B sync cursor");
    }

    const [models, variants] = await Promise.all([
      this.prisma.device_models.findMany({
        where: this.changeWhere(since, through, after, "device_model"),
        select: {
          id: true,
          updated_at: true,
          deleted_at: true,
        },
        orderBy: [{ updated_at: "asc" }, { id: "asc" }],
        take: limit + 1,
      }),
      this.prisma.device_variants.findMany({
        where: this.changeWhere(since, through, after, "device_variant"),
        select: {
          id: true,
          updated_at: true,
          deleted_at: true,
          device_model: { select: { deleted_at: true } },
        },
        orderBy: [{ updated_at: "asc" }, { id: "asc" }],
        take: limit + 1,
      }),
    ]);

    const candidates: B2bChangeCandidate[] = [
      ...models.map((model) => ({
        entity_type: "device_model" as const,
        id: model.id,
        operation: model.deleted_at ? ("delete" as const) : ("upsert" as const),
        changed_at: model.updated_at,
      })),
      ...variants.map((variant) => ({
        entity_type: "device_variant" as const,
        id: variant.id,
        operation:
          variant.deleted_at || variant.device_model.deleted_at
            ? ("delete" as const)
            : ("upsert" as const),
        changed_at: variant.updated_at,
      })),
    ].sort((left, right) => this.compareCandidates(left, right));

    const page = candidates.slice(0, limit);
    const hasMore = candidates.length > limit;
    const last = page.at(-1);
    const continuation: B2bSyncCursor = hasMore && last
      ? {
          version: 1,
          since: cursor?.since ?? null,
          through: through.toISOString(),
          after: this.toPosition(last),
        }
      : { version: 1, since: through.toISOString() };

    return {
      data: page.map((change) => ({
        entity_type: change.entity_type,
        id: change.id,
        operation: change.operation,
        changed_at: change.changed_at,
      })),
      meta: {
        contract_version: B2B_CONTRACT_VERSION,
        snapshot_at: through.toISOString(),
        has_more: hasMore,
        next_cursor: this.writeCursor(continuation),
      },
    };
  }

  async resolveRecords(dto: ResolveB2bCatalogRecordsDto) {
    const records = this.uniqueRecords(dto.records);
    const modelIds = records
      .filter((record) => record.entity_type === "device_model")
      .map((record) => record.id);
    const variantIds = records
      .filter((record) => record.entity_type === "device_variant")
      .map((record) => record.id);

    const [models, variants] = await Promise.all([
      this.prisma.device_models.findMany({
        where: { id: { in: modelIds }, deleted_at: null },
        select: { id: true },
      }),
      this.prisma.device_variants.findMany({
        where: {
          id: { in: variantIds },
          deleted_at: null,
          device_model: { deleted_at: null },
        },
        select: { id: true },
      }),
    ]);
    const available = new Set([
      ...models.map((model) => `device_model:${model.id}`),
      ...variants.map((variant) => `device_variant:${variant.id}`),
    ]);
    const found = records.filter((record) =>
      available.has(`${record.entity_type}:${record.id}`),
    );
    const data = await Promise.all(
      found.map(async (record) => ({
        entity_type: record.entity_type,
        id: record.id,
        record:
          record.entity_type === "device_model"
            ? await this.deviceModelsService.findById(record.id)
            : await this.deviceVariantsService.findById(record.id),
      })),
    );

    return {
      data,
      missing: records
        .filter((record) => !available.has(`${record.entity_type}:${record.id}`))
        .map((record) => ({
          entity_type: record.entity_type,
          id: record.id,
        })),
    };
  }

  private changeWhere(
    since: Date | undefined,
    through: Date,
    after: B2bChangePosition | undefined,
    entityType: B2bEntityType,
  ) {
    if (after) {
      const afterDate = this.readCursorDate(after.changed_at);
      const entityComparison = this.compareEntityTypes(
        after.entity_type,
        entityType,
      );
      const equalTimestampCondition =
        entityComparison === 0
          ? { id: { gt: after.id } }
          : entityComparison < 0
            ? {}
            : { id: { in: [] } };

      return {
        updated_at: { lte: through },
        OR: [
          { updated_at: { gt: afterDate } },
          { updated_at: afterDate, ...equalTimestampCondition },
        ],
      };
    }

    return {
      updated_at: {
        ...(since && { gt: since }),
        lte: through,
      },
    };
  }

  private uniqueRecords(records: B2bCatalogRecordReferenceDto[]) {
    const seen = new Set<string>();
    return records.filter((record) => {
      const key = `${record.entity_type}:${record.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private compareCandidates(left: B2bChangeCandidate, right: B2bChangeCandidate) {
    const timestampDifference =
      left.changed_at.getTime() - right.changed_at.getTime();
    if (timestampDifference !== 0) return timestampDifference;

    const entityDifference = this.compareEntityTypes(
      left.entity_type,
      right.entity_type,
    );
    if (entityDifference !== 0) return entityDifference;
    return left.id.localeCompare(right.id);
  }

  private compareEntityTypes(left: B2bEntityType, right: B2bEntityType) {
    const order: Record<B2bEntityType, number> = {
      device_model: 0,
      device_variant: 1,
    };
    return order[left] - order[right];
  }

  private toPosition(change: B2bChangeCandidate): B2bChangePosition {
    return {
      changed_at: change.changed_at.toISOString(),
      entity_type: change.entity_type,
      id: change.id,
    };
  }

  private readCursor(rawCursor: string | undefined): B2bSyncCursor | null {
    if (!rawCursor) return null;

    try {
      const cursor = JSON.parse(
        Buffer.from(rawCursor, "base64url").toString("utf8"),
      ) as Partial<B2bSyncCursor>;
      const validSince = cursor.since === null || typeof cursor.since === "string";
      const validThrough =
        cursor.through === undefined || typeof cursor.through === "string";
      const validAfter =
        cursor.after === undefined ||
        (typeof cursor.after === "object" &&
          cursor.after !== null &&
          typeof cursor.after.changed_at === "string" &&
          (cursor.after.entity_type === "device_model" ||
            cursor.after.entity_type === "device_variant") &&
          typeof cursor.after.id === "string");
      if (
        cursor.version !== 1 ||
        !validSince ||
        !validThrough ||
        !validAfter ||
        (cursor.after && !cursor.through)
      ) {
        throw new Error("invalid cursor");
      }
      if (cursor.since) this.readCursorDate(cursor.since);
      if (cursor.through) this.readCursorDate(cursor.through);
      if (cursor.after) this.readCursorDate(cursor.after.changed_at);
      return cursor as B2bSyncCursor;
    } catch {
      throw new BadRequestException("Invalid B2B sync cursor");
    }
  }

  private readCursorDate(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException("Invalid B2B sync cursor");
    }
    return parsed;
  }

  private writeCursor(cursor: B2bSyncCursor) {
    return Buffer.from(JSON.stringify(cursor)).toString("base64url");
  }
}
