import { NotFoundException } from "@nestjs/common";
import { DataIngestionService } from "./data-ingestion.service";

describe("DataIngestionService", () => {
  const rawPage = {
    id: "raw-page-1",
    source_id: "source-1",
    url: "https://example.com/device",
    status: "needs_review",
  };

  const prisma = {
    data_sources: {
      findUnique: jest.fn(),
    },
    raw_pages: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: DataIngestionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DataIngestionService(prisma as any);
  });

  it("upserts raw pages after validating the data source", async () => {
    prisma.data_sources.findUnique.mockResolvedValue({ id: "source-1" });
    prisma.raw_pages.upsert.mockResolvedValue(rawPage);

    await expect(
      service.upsertRawPage({
        source_id: "source-1",
        url: "https://example.com/device",
        raw_text: "Device specs",
        status: "needs_review",
      }),
    ).resolves.toBe(rawPage);

    expect(prisma.raw_pages.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { url: "https://example.com/device" },
        update: expect.objectContaining({
          raw_text: "Device specs",
          status: "needs_review",
        }),
      }),
    );
  });

  it("rejects raw page upsert when the source is missing", async () => {
    prisma.data_sources.findUnique.mockResolvedValue(null);

    await expect(
      service.upsertRawPage({
        source_id: "missing",
        url: "https://example.com/device",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("marks reviewed pages as parsed when approved", async () => {
    prisma.raw_pages.findUnique.mockResolvedValue(rawPage);
    prisma.raw_pages.update.mockResolvedValue({ ...rawPage, status: "approved" });

    await service.reviewRawPage("raw-page-1", {
      status: "approved",
      parsed_data: { name: "iPhone 16 Pro" },
    });

    expect(prisma.raw_pages.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "raw-page-1" },
        data: expect.objectContaining({
          status: "approved",
          parsed_at: expect.any(Date),
        }),
      }),
    );
  });
});
