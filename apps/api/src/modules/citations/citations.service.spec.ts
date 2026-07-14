import { NotFoundException } from "@nestjs/common";
import { CitationsService } from "./citations.service";

describe("CitationsService", () => {
  const citation = {
    id: "citation-1",
    source_id: "source-1",
    title: "Official specs",
  };

  const prisma = {
    sources: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    citations: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: CitationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CitationsService(prisma as any);
  });

  it("creates citations after validating the source", async () => {
    prisma.sources.findUnique.mockResolvedValue({ id: "source-1" });
    prisma.citations.create.mockResolvedValue(citation);

    await expect(
      service.createCitation({
        source_id: "source-1",
        title: "Official specs",
      }),
    ).resolves.toBe(citation);

    expect(prisma.citations.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source_id: "source-1",
          title: "Official specs",
          retrieved_at: expect.any(Date),
        }),
      }),
    );
  });

  it("rejects citation creation when the source is missing", async () => {
    prisma.sources.findUnique.mockResolvedValue(null);

    await expect(
      service.createCitation({
        source_id: "missing",
        title: "Official specs",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("loads public citation sources", async () => {
    prisma.sources.findMany.mockResolvedValue([{ id: "source-1" }]);

    await expect(service.listSources()).resolves.toEqual({
      data: [{ id: "source-1" }],
    });
  });
});
