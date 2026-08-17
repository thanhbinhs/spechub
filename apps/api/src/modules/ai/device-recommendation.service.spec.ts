import { Prisma } from "@spechub/database";
import { PrismaService } from "../../prisma/prisma.service";
import { DeviceRecommendationService } from "./device-recommendation.service";

describe("DeviceRecommendationService", () => {
  const prisma = {
    device_models: {
      findMany: jest.fn(),
    },
  };

  let service: DeviceRecommendationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DeviceRecommendationService(
      prisma as unknown as PrismaService,
    );
  });

  it("returns three ranked choices and strictly excludes unmet requirements", async () => {
    prisma.device_models.findMany.mockResolvedValue([
      model("a", 899, 82, "oled"),
      model("b", 749, 91, "amoled"),
      model("c", 699, 75, "ips"),
      model("d", 949, 78, "oled"),
    ]);

    const result = await service.recommend({
      category_slug: "smartphone",
      budget_max: 1_000,
      currency_code: "usd",
      operating_system: "android",
      use_cases: ["gaming"],
      priorities: ["performance"],
      must_haves: ["oled", "high_refresh", "5g"],
      min_storage_gb: 256,
      limit: 3,
    });

    expect(result.data.recommendations).toHaveLength(3);
    expect(result.data.recommendations[0]?.model.slug).toBe("phone-b");
    expect(
      result.data.recommendations.every((item) => item.reasons.length > 0),
    ).toBe(true);
    expect(
      result.data.recommendations.every((item) =>
        item.matched_requirements.includes("Màn hình OLED"),
      ),
    ).toBe(true);
    expect(result.meta).toEqual(
      expect.objectContaining({
        candidate_count: 4,
        eligible_count: 3,
        returned_count: 3,
        excluded_count: 1,
        scoring_version: "needs-match-v1",
      }),
    );
  });

  it("does not silently relax budget currency or hard requirements", async () => {
    prisma.device_models.findMany.mockResolvedValue([
      model("a", 899, 82, "oled"),
    ]);

    const result = await service.recommend({
      category_slug: "smartphone",
      budget_max: 25_000_000,
      currency_code: "VND",
      operating_system: "ios",
      use_cases: ["photography"],
      must_haves: ["wireless_charging"],
    });

    expect(result.data.recommendations).toEqual([]);
    expect(result.meta.eligible_count).toBe(0);
    expect(result.meta.excluded_count).toBe(1);
  });
});

function model(
  id: string,
  price: number,
  performance: number,
  display: string,
) {
  return {
    id: `model-${id}`,
    name: `Phone ${id.toUpperCase()}`,
    slug: `phone-${id}`,
    summary: `Test phone ${id}`,
    cover_image_url: null,
    release_date: new Date("2026-01-01T00:00:00.000Z"),
    product_family: {
      id: "family-1",
      name: "Test phones",
      slug: "test-phones",
      brand_org: {
        id: "brand-1",
        name: "Test Brand",
        short_name: "Test",
        slug: "test-brand",
      },
      device_category: {
        id: "category-1",
        name: "Smartphone",
        slug: "smartphone",
      },
    },
    release_status: { id: 1, code: "released", name: "Released" },
    device_variants: [
      {
        id: `variant-${id}`,
        variant_name: "256 GB",
        market_name: "Global",
        color_name: "Black",
        color_hex: "#111111",
        launch_price: new Prisma.Decimal(price),
        launch_date: new Date("2026-01-01T00:00:00.000Z"),
        is_default: true,
        currency: { code: "USD", symbol: "$", decimal_digits: 0 },
        variant_physical_specs: {
          weight_g: new Prisma.Decimal(185),
          thickness_mm: new Prisma.Decimal(8),
        },
        variant_module_scores: [],
        variant_scorecards: [
          {
            overall_score: new Prisma.Decimal(performance),
            coverage_percent: new Prisma.Decimal(92),
            score_source: "catalog_scorecard",
            module_scores: [
              scoreModule("performance", "Hiệu năng", performance),
              scoreModule("display", "Màn hình", display === "ips" ? 64 : 88),
              scoreModule("battery", "Pin", 80),
              scoreModule("memory-storage", "Bộ nhớ", 82),
              scoreModule("software", "Phần mềm", 76),
            ],
          },
        ],
        variant_chipsets: [
          {
            chipset: {
              integrated_5g: true,
              chipset_modem_links: [],
            },
          },
        ],
        variant_modems: [],
        variant_displays: [
          {
            display_unit: {
              refresh_rate_hz: 120,
              brightness_peak_nits: 1_800,
              display_technology: { name: display, slug: display },
            },
          },
        ],
        variant_batteries: [
          {
            battery_unit: {
              capacity_mah: 5_000,
              energy_wh: null,
              wired_charging_w: 65,
              wireless_charging_w: 15,
            },
          },
        ],
        variant_camera_modules: [
          {
            camera_module: {
              effective_megapixel: new Prisma.Decimal(50),
              optical_zoom: new Prisma.Decimal(3),
              has_ois: true,
            },
          },
        ],
        variant_storage_configs: [
          {
            total_capacity_gb: 256,
            is_expandable: false,
            expansion_max_gb: null,
          },
        ],
        variant_operating_systems: [
          {
            is_default: true,
            promised_major_updates: 4,
            promised_security_years: 5,
            os_version: {
              version_name: "16",
              operating_system: {
                name: "Android",
                slug: "android",
                os_family: "android",
              },
            },
          },
        ],
        software_profile: null,
      },
    ],
  };
}

function scoreModule(key: string, name: string, score: number) {
  return {
    module_key: key,
    module_name: name,
    score: new Prisma.Decimal(score),
    coverage_percent: new Prisma.Decimal(90),
    rationale: `${name} được chấm ${score}/100.`,
  };
}
