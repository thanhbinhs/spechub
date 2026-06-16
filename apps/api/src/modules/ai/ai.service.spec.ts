import { AiService } from "./ai.service";

describe("AiService", () => {
  const model = {
    id: "model-1",
    name: "iPhone 16 Pro",
    slug: "iphone-16-pro",
    description: "Flagship smartphone with Apple A18 Pro chipset.",
    announcement_date: new Date("2024-09-09T00:00:00.000Z"),
    release_date: new Date("2024-09-20T00:00:00.000Z"),
    generation_label: "16 Pro",
    product_family: {
      id: "family-1",
      name: "iPhone 16 Series",
      slug: "iphone-16-series",
      brand_org: {
        id: "org-1",
        name: "Apple Inc.",
        slug: "apple",
        short_name: "Apple",
      },
      device_category: {
        id: "category-1",
        name: "Smartphone",
        slug: "smartphone",
      },
    },
    release_status: {
      code: "released",
      name: "Released",
    },
    device_variants: [
      {
        id: "variant-1",
        variant_name: "256GB",
        market_name: "Global",
        sku_code: "A3293",
        color_name: "Natural Titanium",
        launch_date: new Date("2024-09-20T00:00:00.000Z"),
        launch_price: "1099.00",
        is_default: true,
        notes: null,
        currency: {
          code: "USD",
          symbol: "$",
        },
        variant_physical_specs: {
          height_mm: "149.6",
          width_mm: "71.5",
          thickness_mm: "8.25",
          weight_g: "199",
          frame_material: "Titanium",
          back_material: "Glass",
          front_glass: "Ceramic Shield",
          ingress_protection: "IP68",
        },
        variant_chipsets: [
          {
            chip_role: "main",
            is_primary: true,
            chipset: {
              id: "chipset-1",
              name: "Apple A18 Pro",
              slug: "apple-a18-pro",
              model_code: "A18 Pro",
              chip_kind: "soc",
              integrated_5g: true,
              max_ram_gb: 8,
              manufacturer: {
                name: "Apple Inc.",
                short_name: "Apple",
                slug: "apple",
              },
            },
          },
        ],
        variant_displays: [
          {
            display_role: "main",
            display_order: 1,
            display_unit: {
              id: "display-1",
              name: "Super Retina XDR",
              slug: "super-retina-xdr",
              size_inch: "6.3",
              resolution_width: 1206,
              resolution_height: 2622,
              refresh_rate_hz: 120,
              brightness_peak_nits: 2000,
              hdr_formats: "HDR10, Dolby Vision",
              display_technology: {
                name: "OLED",
                slug: "oled",
              },
            },
          },
        ],
        variant_batteries: [
          {
            battery_role: "main",
            is_primary: true,
            battery_unit: {
              id: "battery-1",
              name: "iPhone 16 Pro battery",
              slug: "iphone-16-pro-battery",
              capacity_mah: 3582,
              energy_wh: "13.94",
              wired_charging_w: 30,
              wireless_charging_w: 25,
              removable: false,
            },
          },
        ],
      },
    ],
  };

  const prisma = {
    device_models: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    ai_query_cache: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
    $transaction: jest.fn(),
  };

  let service: AiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiService(prisma as any);
  });

  it("searches catalog data when the vector index is empty", async () => {
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model]);

    const result = await service.search({
      q: "a18 pro battery",
      top_k: 3,
    });

    expect(result.meta.source).toBe("catalog_fallback");
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        entityId: "model-1",
        slug: "iphone-16-pro",
      }),
    );
  });

  it("answers with citations and writes cache", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model]);

    const result = await service.ask({
      question: "Which iPhone has Apple A18 Pro?",
      top_k: 3,
    });

    expect(result.data.cached).toBe(false);
    expect(result.data.citations[0]).toEqual(
      expect.objectContaining({
        entity_id: "model-1",
        slug: "iphone-16-pro",
      }),
    );
    expect(prisma.ai_query_cache.upsert).toHaveBeenCalled();
  });
});
