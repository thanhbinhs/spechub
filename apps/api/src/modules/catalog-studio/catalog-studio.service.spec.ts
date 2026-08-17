import { BadRequestException, ConflictException } from "@nestjs/common";
import { CatalogStudioService } from "./catalog-studio.service";

describe("CatalogStudioService", () => {
  const tx = {
    catalog_drafts: {
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    catalog_draft_versions: {
      create: jest.fn(),
    },
    device_models: {
      findFirst: jest.fn(),
    },
    organizations: {
      findFirst: jest.fn(),
    },
    modems: {
      findUnique: jest.fn(),
    },
  };
  const prisma = {
    catalog_drafts: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const storage = {
    storageMetadata: jest.fn(() => ({
      provider: "r2",
      bucket: "spechub",
      cdnBaseUrl: "https://cdn.example.test",
    })),
    createObjectKey: jest.fn(() => "device_models/2026/07/file.webp"),
    createPresignedPutUrl: jest.fn(() => "https://storage.example.test/put"),
  };
  const evidence = {
    createInitialClaimsFromDraft: jest.fn(),
    attachDraftClaims: jest.fn(),
  };
  let service: CatalogStudioService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CatalogStudioService(
      prisma as any,
      storage as any,
      evidence as any,
    );
  });

  it("rejects a stale autosave revision without writing history", async () => {
    prisma.catalog_drafts.findFirst.mockResolvedValue({
      id: "draft-1",
      draft_type: "device",
      step_key: "model",
      revision: 3,
      payload: {},
    });
    tx.catalog_drafts.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.updateDraft(
        "draft-1",
        {
          expected_revision: 2,
          payload: {},
          step_key: "hardware",
        },
        "user-1",
        "editor",
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.catalog_draft_versions.create).not.toHaveBeenCalled();
  });

  it("rejects scoring profiles whose module weights do not total 100", async () => {
    await expect(
      service.createScoringProfile(
        "category-1",
        {
          name: "Invalid",
          modules: [
            {
              key: "performance",
              label: "Hiệu năng",
              weight: 80,
              metrics: [
                {
                  key: "cpu",
                  label: "CPU",
                  weight: 100,
                  min: 0,
                  max: 100,
                },
              ],
            },
          ],
        },
        "user-1",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects media links to unsupported entity tables", async () => {
    await expect(
      service.createMediaUpload({
        filename: "file.webp",
        mime_type: "image/webp",
        asset_type: "image",
        file_size_bytes: 1024,
        entity_table: "unknown_table",
        entity_id: "entity-1",
        role: "cover",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.storageMetadata).not.toHaveBeenCalled();
  });

  it("checks the target entity before creating a media record", async () => {
    tx.device_models.findFirst.mockResolvedValue(null);

    await expect(
      service.createMediaUpload({
        filename: "file.webp",
        mime_type: "image/webp",
        asset_type: "image",
        file_size_bytes: 1024,
        entity_table: "device_models",
        entity_id: "missing-model",
        role: "cover",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("accepts organizations as media targets and checks that they exist", async () => {
    tx.organizations.findFirst.mockResolvedValue(null);

    await expect(
      service.createMediaUpload({
        filename: "logo.webp",
        mime_type: "image/webp",
        asset_type: "image",
        file_size_bytes: 1024,
        entity_table: "organizations",
        entity_id: "missing-organization",
        role: "logo",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.organizations.findFirst).toHaveBeenCalledWith({
      where: { id: "missing-organization", deleted_at: null },
      select: { id: true },
    });
  });

  it("accepts modem image targets and checks that the module exists", async () => {
    tx.modems.findUnique.mockResolvedValue(null);

    await expect(
      service.createMediaUpload({
        filename: "modem.webp",
        mime_type: "image/webp",
        asset_type: "image",
        file_size_bytes: 1024,
        entity_table: "modems",
        entity_id: "missing-modem",
        role: "hero",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.modems.findUnique).toHaveBeenCalledWith({
      where: { id: "missing-modem" },
      select: { id: true },
    });
  });
});
