import { Prisma } from "@spechub/database";
import { PrismaService } from "../../prisma/prisma.service";
import {
  HardwareCatalogService,
  type HardwareModuleDetail,
} from "../hardware-catalog/hardware-catalog.service";
import { AiProviderService } from "./ai-provider.service";
import { HardwareResearchService } from "./hardware-research.service";

describe("HardwareResearchService", () => {
  const family = {
    id: "family-a",
    name: "Test Series",
    slug: "test-series",
    brand_org: {
      name: "Test Brand",
      short_name: "Test",
      slug: "test-brand",
    },
    device_category: { name: "Smartphone", slug: "smartphone" },
  };
  const devices = [
    device("variant-a", "model-a", "Phone A"),
    device("variant-b", "model-b", "Phone B"),
    device("variant-c", "model-c", "Phone C"),
  ];
  const hardwareModule: HardwareModuleDetail = {
    kind: "memory-standard",
    id: "memory-1",
    name: "LPDDR5X",
    slug: "lpddr5x",
    description: null,
    organization: null,
    specs: {
      memory_type: "LPDDR",
      generation: "5X",
      max_data_rate_mtps: 8533,
      bandwidth_gbps: null,
    },
    devices,
    research: {
      variant_count: 3,
      product_count: 3,
      brand_count: 1,
      category_count: 1,
      priced_variant_count: 0,
      spec_field_count: 4,
      populated_spec_field_count: 3,
      completeness_percent: 75,
      missing_specs: ["bandwidth_gbps"],
      representative_variant_ids: ["variant-a", "variant-b", "variant-c"],
      product_lines: [],
    },
  };

  const hardwareCatalogService = {
    findByKindAndSlug: jest.fn(),
  };
  const aiProvider = {
    ragModelName: "local-rag-v1",
    generateAnswer: jest.fn(),
  };
  const prisma = {
    device_variant_benchmarks: {
      findMany: jest.fn(),
    },
  };

  let service: HardwareResearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    hardwareCatalogService.findByKindAndSlug.mockResolvedValue(hardwareModule);
    aiProvider.generateAnswer.mockResolvedValue(null);
    prisma.device_variant_benchmarks.findMany.mockResolvedValue([]);
    service = new HardwareResearchService(
      hardwareCatalogService as unknown as HardwareCatalogService,
      aiProvider as unknown as AiProviderService,
      prisma as unknown as PrismaService,
    );
  });

  it("does not rank devices when the database has no benchmark evidence", async () => {
    const result = await service.research("memory-standard", "lpddr5x", {});

    expect(result.data.assessment_status).toBe("insufficient_data");
    expect(result.data.coverage).toEqual(
      expect.objectContaining({
        linked_device_count: 3,
        benchmarked_device_count: 0,
        comparable_device_count: 0,
        comparable_metric_count: 0,
      }),
    );
    expect(
      result.data.device_assessments.every(
        (assessment) =>
          assessment.rank === null && assessment.effectiveness_score === null,
      ),
    ).toBe(true);
    expect(result.data.summary).toContain("Chưa thể kết luận");
    expect(aiProvider.generateAnswer).not.toHaveBeenCalled();
  });

  it("ranks device variants only from comparable higher-is-better results", async () => {
    prisma.device_variant_benchmarks.findMany.mockResolvedValue([
      benchmarkRecord("variant-a", 40),
      benchmarkRecord("variant-b", 50),
      benchmarkRecord("variant-c", 25),
    ]);

    const result = await service.research("memory-standard", "lpddr5x", {});

    expect(result.data.assessment_status).toBe("measured");
    expect(result.data.coverage.comparable_metric_count).toBe(1);
    expect(
      result.data.device_assessments.map((assessment) => ({
        variant: assessment.device.variant_id,
        rank: assessment.rank,
        score: assessment.effectiveness_score,
      })),
    ).toEqual([
      { variant: "variant-b", rank: 1, score: 100 },
      { variant: "variant-a", rank: 2, score: 80 },
      { variant: "variant-c", rank: 3, score: 50 },
    ]);
    expect(result.data.compare_variant_ids).toEqual([
      "variant-b",
      "variant-a",
      "variant-c",
    ]);
  });

  it("honors lower-is-better benchmark direction", async () => {
    prisma.device_variant_benchmarks.findMany.mockResolvedValue([
      benchmarkRecord("variant-a", 100, {
        benchmarkName: "Memory Latency",
        benchmarkSlug: "memory-latency",
        higherIsBetter: false,
      }),
      benchmarkRecord("variant-b", 80, {
        benchmarkName: "Memory Latency",
        benchmarkSlug: "memory-latency",
        higherIsBetter: false,
      }),
      benchmarkRecord("variant-c", 120, {
        benchmarkName: "Memory Latency",
        benchmarkSlug: "memory-latency",
        higherIsBetter: false,
      }),
    ]);

    const result = await service.research("memory-standard", "lpddr5x", {});

    expect(result.data.device_assessments[0]).toEqual(
      expect.objectContaining({
        rank: 1,
        effectiveness_score: 100,
        device: expect.objectContaining({ variant_id: "variant-b" }),
      }),
    );
    expect(result.data.device_assessments[1]?.effectiveness_score).toBe(80);
  });

  it("keeps results unranked when test conditions are incompatible", async () => {
    prisma.device_variant_benchmarks.findMany.mockResolvedValue([
      benchmarkRecord("variant-a", 40, { appVersion: "1.0" }),
      benchmarkRecord("variant-b", 50, { appVersion: "2.0" }),
    ]);

    const result = await service.research("memory-standard", "lpddr5x", {});

    expect(result.data.assessment_status).toBe("partial");
    expect(result.data.coverage.benchmarked_device_count).toBe(2);
    expect(result.data.coverage.comparable_metric_count).toBe(0);
    expect(
      result.data.device_assessments.filter(
        (assessment) => assessment.status === "partial",
      ),
    ).toHaveLength(2);
    expect(result.data.compare_variant_ids).toEqual([]);
  });

  it("compares chart aggregates without inventing an ambient temperature", async () => {
    prisma.device_variant_benchmarks.findMany.mockResolvedValue([
      benchmarkRecord("variant-a", 40, { aggregate: true }),
      benchmarkRecord("variant-b", 50, { aggregate: true }),
    ]);

    const result = await service.research("memory-standard", "lpddr5x", {});

    expect(result.data.assessment_status).toBe("measured");
    expect(result.data.coverage.comparable_metric_count).toBe(1);
    expect(result.data.device_assessments[0]).toEqual(
      expect.objectContaining({
        rank: 1,
        effectiveness_score: 100,
        device: expect.objectContaining({ variant_id: "variant-b" }),
      }),
    );
    expect(
      result.data.device_assessments[0]?.benchmark_results[0]?.conditions,
    ).toEqual(
      expect.objectContaining({
        recorded: true,
        ambient_temp_c: null,
        power_mode: "aggregate",
      }),
    );
  });

  it("uses AI only to explain a measured ranking with valid citations", async () => {
    prisma.device_variant_benchmarks.findMany.mockResolvedValue([
      benchmarkRecord("variant-a", 40),
      benchmarkRecord("variant-b", 50),
    ]);
    aiProvider.generateAnswer.mockResolvedValue({
      answer:
        "Phone B có kết quả đo tương đối cao hơn trong nhóm đối chiếu [2].",
      modelName: "test-model",
      provider: "openai",
    });

    const result = await service.research("memory-standard", "lpddr5x", {
      question: "Thiết bị nào khai thác bộ nhớ tốt hơn?",
    });

    expect(result.data.summary).toContain("[2]");
    expect(result.meta).toEqual(
      expect.objectContaining({
        generated_by: "hybrid",
        rag_provider: "openai",
        model_name: "test-model",
      }),
    );
    expect(aiProvider.generateAnswer).toHaveBeenCalledTimes(1);
  });

  function device(variantId: string, modelId: string, modelName: string) {
    return {
      variant_id: variantId,
      variant_name: `${modelName} 256 GB`,
      market_name: "Global",
      color_name: null,
      color_hex: null,
      launch_price: null,
      is_default: true,
      currency: null,
      device_model: {
        id: modelId,
        name: modelName,
        slug: modelName.toLowerCase().replaceAll(" ", "-"),
        generation_label: null,
        release_date: new Date("2025-01-01T00:00:00.000Z"),
        product_family: family,
      },
    };
  }

  function benchmarkRecord(
    variantId: string,
    score: number,
    options: {
      benchmarkName?: string;
      benchmarkSlug?: string;
      higherIsBetter?: boolean;
      appVersion?: string;
      aggregate?: boolean;
    } = {},
  ) {
    const benchmarkName = options.benchmarkName ?? "Memory Bandwidth";
    const benchmarkSlug = options.benchmarkSlug ?? "memory-bandwidth";
    return {
      id: `${benchmarkSlug}-${variantId}`,
      device_variant_id: variantId,
      score: new Prisma.Decimal(score),
      subscore_name: "overall",
      tested_at: new Date("2026-01-01T00:00:00.000Z"),
      benchmark: {
        id: `${benchmarkSlug}-id`,
        name: benchmarkName,
        slug: benchmarkSlug,
        benchmark_type: "memory",
        target_type: "device_variant",
        version: "1.0",
        higher_is_better: options.higherIsBetter ?? true,
        unit: { name: "gigabyte per second", symbol: "GB/s" },
      },
      benchmark_run: {
        id: `run-${variantId}`,
        tested_at: new Date("2026-01-01T00:00:00.000Z"),
        test_environment_note: options.aggregate
          ? "same aggregate chart protocol"
          : "same lab protocol",
        ambient_temp_c: options.aggregate ? null : new Prisma.Decimal(24),
        os_version: "Test OS 1",
        app_version: options.appVersion ?? "1.0",
        driver_version: "1.0",
        is_thermal_throttled: false,
        power_mode: options.aggregate ? "aggregate" : "balanced",
        source: null,
        citation: null,
      },
      source: {
        id: "source-1",
        name: "Independent Lab",
        slug: "independent-lab",
        source_type: "review",
        base_url: "https://example.com",
        trust_level: 4,
      },
    };
  }
});
