import { NotFoundException } from "@nestjs/common";
import { DeviceModelsService } from "./device-models.service";

describe("DeviceModelsService", () => {
  const model = {
    id: "model-1",
    name: "iPhone 16 Pro",
    slug: "iphone-16-pro",
    product_family_id: "family-1",
  };

  const prisma = {
    device_models: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    entity_media: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };

  let service: DeviceModelsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.entity_media.findMany.mockResolvedValue([]);
    service = new DeviceModelsService(prisma as any);
  });

  it("filters device models by brand, category, family and release status", async () => {
    prisma.device_models.findMany.mockResolvedValue([model]);
    prisma.device_models.count.mockResolvedValue(1);

    await service.findMany({
      brand_slug: "apple",
      category_slug: "smartphone",
      family_slug: "iphone-16-series",
      release_status: "released",
      q: "iphone",
    } as any);

    expect(prisma.device_models.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deleted_at: null,
          release_status: { code: "released" },
          product_family: expect.objectContaining({
            slug: "iphone-16-series",
            brand_org: expect.objectContaining({ slug: "apple" }),
            device_category: expect.objectContaining({ slug: "smartphone" }),
          }),
          OR: expect.any(Array),
        }),
      }),
    );
  });

  it("searches by product family and brand names", async () => {
    prisma.device_models.findMany.mockResolvedValue([model]);
    prisma.device_models.count.mockResolvedValue(1);

    await service.findMany({ q: "Apple" } as any);

    expect(prisma.device_models.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            {
              product_family: {
                deleted_at: null,
                OR: expect.arrayContaining([
                  { name: { contains: "Apple", mode: "insensitive" } },
                  expect.objectContaining({
                    brand_org: expect.objectContaining({
                      deleted_at: null,
                      OR: expect.arrayContaining([
                        { name: { contains: "Apple", mode: "insensitive" } },
                      ]),
                    }),
                  }),
                ]),
              },
            },
          ]),
        }),
      }),
    );
  });

  it("finds a model by slug", async () => {
    prisma.device_models.findFirst.mockResolvedValue(model);

    await expect(service.findBySlug("iphone-16-pro")).resolves.toEqual({
      ...model,
      media: [],
    });
  });

  it("returns ready images and videos for a device detail", async () => {
    prisma.device_models.findFirst.mockResolvedValue(model);
    prisma.entity_media.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          entity_id: model.id,
          role: "review",
          display_order: 0,
          is_primary: false,
          media_asset: {
            id: "media-1",
            asset_type: "video",
            url: null,
            cdn_url: null,
            object_key: "device_models/2026/07/review.mp4",
            mime_type: "video/mp4",
            alt_text: null,
            caption: "Video review",
            width_px: 1920,
            height_px: 1080,
            duration_ms: BigInt(120000),
            file_size_bytes: BigInt(1024),
            original_filename: "review.mp4",
          },
        },
      ]);
    const mediaService = new DeviceModelsService(
      prisma as any,
      {
        get: jest.fn().mockReturnValue("https://cdn.example.com"),
      } as any,
    );

    const result = await mediaService.findBySlug("iphone-16-pro");

    expect(result.media).toEqual([
      expect.objectContaining({
        asset_type: "video",
        url: "https://cdn.example.com/device_models/2026/07/review.mp4",
        duration_ms: "120000",
      }),
    ]);
  });

  it("throws when a model is missing", async () => {
    prisma.device_models.findFirst.mockResolvedValue(null);

    await expect(service.findById("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
