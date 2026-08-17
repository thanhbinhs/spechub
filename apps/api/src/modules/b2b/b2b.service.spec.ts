import { BadRequestException } from "@nestjs/common";
import { B2bService } from "./b2b.service";

describe("B2bService", () => {
  const modelId = "11111111-1111-4111-8111-111111111111";
  const variantId = "22222222-2222-4222-8222-222222222222";
  const changedAt = new Date("2026-08-09T02:00:00.000Z");
  const prisma = {
    device_models: { findMany: jest.fn() },
    device_variants: { findMany: jest.fn() },
  };
  const deviceModelsService = { findById: jest.fn() };
  const deviceVariantsService = { findById: jest.fn() };
  let service: B2bService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new B2bService(
      prisma as any,
      deviceModelsService as any,
      deviceVariantsService as any,
    );
  });

  it("advertises the discoverable contract and sync limits", () => {
    expect(service.getCatalogInfo()).toMatchObject({
      contract_version: "2026-08-09",
      synchronization: {
        changes_path: "/b2b/catalog/changes",
        resolve_path: "/b2b/catalog/records",
      },
      limits: { changes_page_size: 100, resolve_batch_size: 50 },
    });
  });

  it("creates deterministic upsert events and a continuation cursor", async () => {
    prisma.device_models.findMany.mockResolvedValue([
      { id: modelId, updated_at: changedAt, deleted_at: null },
    ]);
    prisma.device_variants.findMany.mockResolvedValue([
      {
        id: variantId,
        updated_at: changedAt,
        deleted_at: null,
        device_model: { deleted_at: null },
      },
    ]);

    const result = await service.listChanges({ limit: 1 });

    expect(result.data).toEqual([
      {
        entity_type: "device_model",
        id: modelId,
        operation: "upsert",
        changed_at: changedAt,
      },
    ]);
    expect(result.meta.has_more).toBe(true);
    expect(result.meta.next_cursor).toEqual(expect.any(String));
    expect(prisma.device_models.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ updated_at: "asc" }, { id: "asc" }],
        take: 2,
        where: expect.objectContaining({ updated_at: { lte: expect.any(Date) } }),
      }),
    );
  });

  it("emits a tombstone when a catalog resource has been soft-deleted", async () => {
    prisma.device_models.findMany.mockResolvedValue([
      { id: modelId, updated_at: changedAt, deleted_at: changedAt },
    ]);
    prisma.device_variants.findMany.mockResolvedValue([]);

    const result = await service.listChanges({ limit: 100 });

    expect(result.data[0]).toMatchObject({
      entity_type: "device_model",
      id: modelId,
      operation: "delete",
    });
    expect(result.meta.has_more).toBe(false);
  });

  it("rejects malformed cursors before querying the catalog", async () => {
    await expect(
      service.listChanges({ cursor: "not-a-cursor", limit: 100 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.device_models.findMany).not.toHaveBeenCalled();
  });

  it("resolves active records in batch and reports missing records without failing", async () => {
    prisma.device_models.findMany.mockResolvedValue([{ id: modelId }]);
    prisma.device_variants.findMany.mockResolvedValue([]);
    deviceModelsService.findById.mockResolvedValue({ id: modelId, slug: "pixel-10" });

    const result = await service.resolveRecords({
      records: [
        { entity_type: "device_model", id: modelId },
        { entity_type: "device_model", id: modelId },
        { entity_type: "device_variant", id: variantId },
      ],
    });

    expect(result.data).toEqual([
      {
        entity_type: "device_model",
        id: modelId,
        record: { id: modelId, slug: "pixel-10" },
      },
    ]);
    expect(result.missing).toEqual([
      { entity_type: "device_variant", id: variantId },
    ]);
    expect(deviceVariantsService.findById).not.toHaveBeenCalled();
  });
});
