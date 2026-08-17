import { BadRequestException, ConflictException } from "@nestjs/common";
import { CatalogEvidenceService } from "./catalog-evidence.service";

describe("CatalogEvidenceService", () => {
  const prisma = {
    catalog_drafts: { findFirst: jest.fn() },
    sources: { findFirst: jest.fn(), create: jest.fn() },
    citations: { create: jest.fn() },
    catalog_attribute_claims: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  let service: CatalogEvidenceService;

  const officialClaim = (value: string) => ({
    catalog_draft_id: "2e2cb4ef-cd84-4df6-a7e9-7f92055b084e",
    field_path: "display.brightness_peak_nits",
    value,
    display_value: `${value} nits`,
    source_type: "official" as const,
    source_label: "Example official specifications",
    source_url: "https://www.example.com/specifications",
    claim_kind: "declared" as const,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.catalog_drafts.findFirst.mockResolvedValue({ id: "draft-1" });
    prisma.sources.findFirst.mockResolvedValue({ id: "source-1" });
    prisma.citations.create.mockResolvedValue({ id: "citation-1" });
    prisma.catalog_attribute_claims.create.mockImplementation(({ data }) => ({
      id: "claim-new",
      ...data,
      source: { id: "source-1", name: "Example official specifications" },
      citation: { id: "citation-1" },
    }));
    service = new CatalogEvidenceService(prisma as any);
  });

  it("marks incompatible declared values as a conflict instead of overwriting", async () => {
    prisma.catalog_attribute_claims.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "claim-existing", value_json: "1600" }]);

    const first = await service.createClaim(
      officialClaim("1600"),
      "editor-1",
      "editor",
    );
    const second = await service.createClaim(
      officialClaim("1750"),
      "editor-1",
      "editor",
    );

    expect(first.status).toBe("candidate");
    expect(second.status).toBe("conflict");
    expect(prisma.catalog_attribute_claims.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["claim-existing"] } },
      data: { status: "conflict" },
    });
  });

  it("requires methodology for lab evidence", async () => {
    await expect(
      service.createClaim(
        {
          ...officialClaim("12 hours"),
          source_type: "lab",
          claim_kind: "measured",
          source_label: "Example Lab",
        },
        "editor-1",
        "editor",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.citations.create).not.toHaveBeenCalled();
  });

  it("does not accept a declared claim while a different claim remains", async () => {
    prisma.catalog_attribute_claims.findUnique.mockResolvedValue({
      id: "claim-1",
      catalog_draft_id: "2e2cb4ef-cd84-4df6-a7e9-7f92055b084e",
      entity_table: null,
      entity_id: null,
      field_path: "display.brightness_peak_nits",
      value_json: "1600",
      claim_kind: "declared",
      scope_region: null,
      scope_sku: null,
    });
    prisma.catalog_attribute_claims.findMany.mockResolvedValue([
      { id: "claim-2", value_json: "1750" },
    ]);

    await expect(
      service.resolveClaim(
        "claim-1",
        { status: "accepted" },
        "editor-1",
        "editor",
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.catalog_attribute_claims.update).not.toHaveBeenCalled();
  });
});
