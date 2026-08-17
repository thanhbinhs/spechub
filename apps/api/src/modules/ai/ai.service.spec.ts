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
        variant_module_scores: [
          {
            module_kind: "chipset",
            score: "91.2",
            score_source: "configuration_model",
            rationale: "Flagship chipset",
          },
          {
            module_kind: "cpu",
            score: "92.0",
            score_source: "configuration_model",
            rationale: "High-end CPU",
          },
          {
            module_kind: "gpu",
            score: "91.0",
            score_source: "configuration_model",
            rationale: "High-end GPU",
          },
          {
            module_kind: "memory-standard",
            score: "90.0",
            score_source: "configuration_model",
            rationale: "Fast memory",
          },
          {
            module_kind: "storage-standard",
            score: "90.0",
            score_source: "configuration_model",
            rationale: "Fast storage",
          },
        ],
        variant_cpus: [
          {
            is_primary: true,
            cpu: {
              name: "Apple A18 Pro CPU",
              core_count: 6,
              thread_count: 6,
              cpu_clusters: [],
            },
          },
        ],
        variant_gpus: [
          {
            is_primary: true,
            gpu: {
              name: "Apple A18 Pro GPU",
              compute_units: 6,
              clock_mhz: null,
              fp32_gflops: null,
              ray_tracing_support: true,
            },
          },
        ],
        variant_npus: [],
        variant_memory_configs: [
          {
            capacity_gb: 8,
            speed_mhz: null,
            bandwidth_gbps: null,
            is_primary: true,
            memory_standard: {
              name: "LPDDR5X",
              generation: "5X",
              max_data_rate_mtps: 8533,
            },
          },
        ],
        variant_storage_configs: [
          {
            total_capacity_gb: 256,
            is_expandable: false,
            expansion_max_gb: null,
            storage_standard: {
              name: "NVMe",
              generation: null,
              sequential_read_mbps: null,
              sequential_write_mbps: null,
            },
          },
        ],
        variant_camera_systems: [],
        variant_operating_systems: [],
        device_variant_benchmarks: [
          {
            score: "3444",
            subscore_name: "single_core",
            benchmark: {
              name: "Geekbench 6 CPU",
              slug: "geekbench-6-cpu",
              benchmark_type: "cpu",
              version: "6",
              higher_is_better: true,
              unit: { symbol: "points" },
            },
          },
          {
            score: "8641",
            subscore_name: "multi_core",
            benchmark: {
              name: "Geekbench 6 CPU",
              slug: "geekbench-6-cpu",
              benchmark_type: "cpu",
              version: "6",
              higher_is_better: true,
              unit: { symbol: "points" },
            },
          },
        ],
      },
    ],
  };
  const galaxyModel = {
    ...model,
    id: "model-2",
    name: "Galaxy S25 Ultra",
    slug: "galaxy-s25-ultra",
    description: "Flagship smartphone with Snapdragon 8 Elite.",
    product_family: {
      ...model.product_family,
      id: "family-2",
      name: "Galaxy S25 Series",
      slug: "galaxy-s25-series",
      brand_org: {
        id: "org-2",
        name: "Samsung Electronics",
        slug: "samsung",
        short_name: "Samsung",
      },
    },
    device_variants: [
      {
        ...model.device_variants[0],
        id: "variant-2",
        variant_name: "256GB Titanium Silverblue",
        launch_price: "1299.00",
        variant_chipsets: [
          {
            chip_role: "main",
            is_primary: true,
            chipset: {
              ...model.device_variants[0]!.variant_chipsets[0]!.chipset,
              id: "chipset-2",
              name: "Snapdragon 8 Elite",
              slug: "snapdragon-8-elite",
              model_code: "SM8750-AB",
              manufacturer: {
                name: "Qualcomm",
                short_name: "Qualcomm",
                slug: "qualcomm",
              },
            },
          },
        ],
        variant_batteries: [
          {
            battery_role: "main",
            is_primary: true,
            battery_unit: {
              ...model.device_variants[0]!.variant_batteries[0]!.battery_unit,
              id: "battery-2",
              name: "Galaxy S25 Ultra battery",
              slug: "galaxy-s25-ultra-battery",
              capacity_mah: 5000,
            },
          },
        ],
        variant_module_scores:
          model.device_variants[0]!.variant_module_scores.map((score) => ({
            ...score,
            score: "94.0",
          })),
        device_variant_benchmarks: [
          {
            score: "2847",
            subscore_name: "single_core",
            benchmark: {
              name: "Geekbench 6 CPU",
              slug: "geekbench-6-cpu",
              benchmark_type: "cpu",
              version: "6",
              higher_is_better: true,
              unit: { symbol: "points" },
            },
          },
          {
            score: "9396",
            subscore_name: "multi_core",
            benchmark: {
              name: "Geekbench 6 CPU",
              slug: "geekbench-6-cpu",
              benchmark_type: "cpu",
              version: "6",
              higher_is_better: true,
              unit: { symbol: "points" },
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
    raw_pages: {
      findMany: jest.fn(),
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

  it("answers chipset usage questions from matching device records, not generic hardware chunks", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.device_models.findMany.mockResolvedValue([model, galaxyModel]);

    const result = await service.ask({
      question: "Snapdragon 8 Elite được dùng trên những thiết bị nào?",
      top_k: 3,
    });

    expect(result.meta.source).toBe("catalog_fallback");
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
    expect(result.data.citations.map((citation) => citation.title)).toEqual([
      "Samsung Galaxy S25 Ultra",
    ]);
    expect(result.data.answer).toContain("## Thiết bị dùng phần cứng được hỏi");
    expect(result.data.answer).toContain("Samsung Galaxy S25 Ultra");
    expect(result.data.answer).toContain("Snapdragon 8 Elite");
    expect(result.data.answer).not.toContain("Apple iPhone 16 Pro");
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

  it("builds a grounded Vietnamese comparison from benchmark data", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model, galaxyModel]);

    const result = await service.ask({
      question: "So sánh iPhone 16 Pro và Galaxy S25 Ultra",
      top_k: 6,
    });

    expect(result.meta.intent).toBe("compare");
    expect(result.data.answer).toContain("## So sánh nhanh");
    expect(result.data.answer).toContain("| Phiên bản đối chiếu |");
    expect(result.data.answer).toContain("| Ra mắt |");
    expect(result.data.answer).toContain("| Benchmark |");
    expect(result.data.answer).toContain("Geekbench 6 CPU");
    expect(result.data.answer).toContain("cùng benchmark");
    expect(result.data.answer).not.toContain("configuration modules");
    expect(result.data.answer).not.toMatch(/\bcores\b|\bthreads\b/);
    expect(result.data.answer).toContain("[1]");
    expect(result.data.answer).toContain("## Nên chọn máy nào?");
    expect(result.data.answer).toMatch(/\| Chipset \|.*\[1\].*\[2\]/);
    expect(result.data.citations.map((citation) => citation.title)).toEqual([
      "Apple iPhone 16 Pro",
      "Samsung Galaxy S25 Ultra",
    ]);
    expect(result.data.citations[0]?.excerpt).toContain("Phiên bản:");
    expect(result.data.citations[0]?.excerpt).toContain("Benchmark:");
    expect(result.data.follow_up_questions).toHaveLength(3);
  });

  it("analyzes the iQOO-style trade-offs without inventing an overall score", () => {
    const chunks = [
      {
        entityType: "device_model" as const,
        entityId: "neo-9",
        chunkIndex: 0,
        title: "Vivo iQOO Neo 9",
        chunkText: [
          "Device: iQOO Neo 9",
          "Released: 2023-12-30",
          "Variant: Snapdragon 8 Gen 2",
          "Default variant: no",
          "Chipset: Chính: Snapdragon 8 Gen 2 của Qualcomm",
          "GPU: Adreno 740",
          "Memory: 16GB LPDDR5X",
          "Storage: 512GB UFS 4.0",
          "Display: Chính: 6.78 inch, AMOLED, 2800x1260, 144Hz, LTPO",
          "Battery: Chính: 5160 mAh, 120W có dây",
          "Camera: Sau: Chính: Sony IMX920 (50MP, OIS), Góc siêu rộng: 8MP; Trước: 16MP",
          "Thermal: vapor_chamber, buồng hơi 6043 mm²",
          "Physical: 190 g, 7.99 mm",
        ].join("\n"),
        score: 0.95,
      },
      {
        entityType: "device_model" as const,
        entityId: "iqoo-11s",
        chunkIndex: 0,
        title: "Vivo iQOO 11S",
        chunkText: [
          "Device: iQOO 11S",
          "Released: 2023-07-04",
          "Variant: 16GB / 512GB",
          "Default variant: yes",
          "Chipset: Chính: Snapdragon 8 Gen 2 của Qualcomm",
          "GPU: Adreno 740",
          "Memory: 16GB LPDDR5X",
          "Storage: 512GB UFS 4.0",
          "Display: Chính: 6.78 inch, Samsung E6 AMOLED, 3200x1440, 144Hz, LTPO",
          "Battery: Chính: 4700 mAh, 200W có dây",
          "Camera: Sau: Chính: Sony IMX866 (50MP, OIS), Góc siêu rộng: 8MP, Chụp xa: 13MP (2x quang học); Trước: 16MP",
          "Physical: 206.5 g, 8.4 mm",
        ].join("\n"),
        score: 0.95,
      },
    ];

    const answer = (service as any).composeAnswer(
      "So sánh Vivo iQOO Neo 9 bản Snapdragon 8 Gen 2 và Vivo iQOO 11S",
      chunks,
      { intent: "compare", priorities: [], useCases: [] },
    );

    expect(answer).toContain("nền tảng phần cứng tương đồng");
    expect(answer).toContain("không đủ để khẳng định hiệu năng thực tế");
    expect(answer).toContain("3200x1440 so với 2800x1260");
    expect(answer).toContain("5.160 mAh so với 4.700 mAh");
    expect(answer).toContain("200 W so với 120 W");
    expect(answer).toContain("mô-đun chụp xa hoặc tiềm vọng");
    expect(answer).toContain("## Nên chọn máy nào?");
    expect(answer).not.toMatch(/⭐|\b\d+(?:[.,]\d+)?\/10\b/);
  });

  it("keeps every selected device's retrieved evidence together for a comparison", () => {
    const chunks = [
      {
        entityType: "device_model" as const,
        entityId: "iphone",
        chunkIndex: 0,
        title: "Apple iPhone 16 Pro",
        chunkText: "Device: iPhone 16 Pro\nBrand: Apple",
      },
      {
        entityType: "device_model" as const,
        entityId: "iphone",
        chunkIndex: 1,
        title: "Apple iPhone 16 Pro",
        chunkText: "Variant: 256GB\nBattery: 3582 mAh, 30W wired charging",
      },
      {
        entityType: "device_model" as const,
        entityId: "galaxy",
        chunkIndex: 0,
        title: "Samsung Galaxy S25 Ultra",
        chunkText: "Device: Galaxy S25 Ultra\nBrand: Samsung",
      },
      {
        entityType: "device_model" as const,
        entityId: "galaxy",
        chunkIndex: 1,
        title: "Samsung Galaxy S25 Ultra",
        chunkText: "Variant: 256GB\nBattery: 5000 mAh, 45W wired charging",
      },
    ];

    const focused = (service as any).focusChunks(
      "So sánh iPhone 16 Pro và Galaxy S25 Ultra về pin",
      {
        intent: "compare",
        priorities: ["battery"],
        useCases: [],
      },
      chunks,
      4,
    );

    expect(focused).toHaveLength(2);
    expect(focused[0]?.chunkText).toContain("3582 mAh");
    expect(focused[1]?.chunkText).toContain("5000 mAh");
    expect(focused[0]?.chunkText).toContain("Device: iPhone 16 Pro");
    expect(focused[1]?.chunkText).toContain("Device: Galaxy S25 Ultra");
  });

  it("selects the explicitly requested hardware variant instead of the default variant", () => {
    const chunks = [
      {
        entityType: "device_model" as const,
        entityId: "neo-9",
        chunkIndex: 0,
        title: "Vivo iQOO Neo 9",
        chunkText:
          "Device: iQOO Neo 9\nReleased: 2023-12-30\nDescription: Gaming phone",
        score: 0.9,
      },
      {
        entityType: "device_model" as const,
        entityId: "neo-9",
        chunkIndex: 1,
        title: "Vivo iQOO Neo 9",
        chunkText:
          "Variant: Dimensity\nDefault variant: yes\nChipset: MediaTek Dimensity 9300",
        score: 0.8,
      },
      {
        entityType: "device_model" as const,
        entityId: "neo-9",
        chunkIndex: 2,
        title: "Vivo iQOO Neo 9",
        chunkText:
          "Variant: Snapdragon\nDefault variant: no\nChipset: Qualcomm Snapdragon 8 Gen 2\nBattery: 5160 mAh, 120W có dây",
        score: 0.85,
      },
      {
        entityType: "device_model" as const,
        entityId: "iqoo-11s",
        chunkIndex: 0,
        title: "Vivo iQOO 11S",
        chunkText: "Device: iQOO 11S\nReleased: 2023-07-04",
        score: 0.9,
      },
      {
        entityType: "device_model" as const,
        entityId: "iqoo-11s",
        chunkIndex: 1,
        title: "Vivo iQOO 11S",
        chunkText:
          "Variant: 256GB\nDefault variant: yes\nChipset: Qualcomm Snapdragon 8 Gen 2",
        score: 0.9,
      },
    ];

    const focused = (service as any).focusChunks(
      "So sánh iQOO Neo 9 bản Snapdragon 8 Gen 2 và iQOO 11S",
      { intent: "compare", priorities: [], useCases: [] },
      chunks,
      6,
    );

    expect(focused).toHaveLength(2);
    expect(focused[0]?.chunkText).toContain("Variant: Snapdragon");
    expect(focused[0]?.chunkText).toContain("5160 mAh");
    expect(focused[0]?.chunkText).not.toContain("Variant: Dimensity");
    expect(focused[0]?.chunkText).toContain("Released: 2023-12-30");
  });

  it("filters deleted, unapproved, and unpublished records from vector retrieval", async () => {
    const provider = {
      embeddingModelName: "local-hash-embedding-v1",
      embedText: jest.fn().mockResolvedValue({
        vector: [0.1, 0.2],
        modelName: "local-hash-embedding-v1",
        provider: "local",
      }),
    };
    const vectorService = new AiService(prisma as any, provider as any);
    prisma.$queryRawUnsafe.mockReset().mockResolvedValue([]);

    await (vectorService as any).retrieveVectorChunks("OLED", 3);

    const [sql] = prisma.$queryRawUnsafe.mock.calls[0] as [string];
    expect(sql).toContain("dm.deleted_at IS NULL");
    expect(sql).toContain("rp.status = 'approved'");
    expect(sql).toContain("wa.status = 'published'");
  });

  it("prioritizes both fully mentioned devices over a partial name match", async () => {
    const iphone16Model = {
      ...model,
      id: "model-3",
      name: "iPhone 16",
      slug: "iphone-16",
      generation_label: "16",
      device_variants: [
        {
          ...model.device_variants[0],
          id: "variant-3",
          variant_name: "128GB",
        },
      ],
    };
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.device_models.findMany.mockResolvedValue([
      iphone16Model,
      model,
      galaxyModel,
    ]);

    const result = await service.ask({
      question: "So sánh iPhone 16 Pro và Galaxy S25 Ultra về pin",
      top_k: 7,
    });

    expect(result.data.citations.map((citation) => citation.title)).toEqual([
      "Apple iPhone 16 Pro",
      "Samsung Galaxy S25 Ultra",
    ]);
    expect(result.data.answer).not.toContain("Apple iPhone 16** [2]");
  });

  it.each([
    "So sánh iPhone 14 Pro Max và iPhone 16 Plus",
    "so sánh 14 prm và 16 plus",
    "so sánh 14prm với 16+",
  ])("resolves both exact iPhone models for: %s", async (question) => {
    const iphone16Model = {
      ...model,
      id: "iphone-16-model",
      name: "iPhone 16",
      slug: "iphone-16",
      generation_label: "16",
      device_variants: [
        {
          ...model.device_variants[0],
          id: "iphone-16-variant",
          variant_name: "128GB",
        },
      ],
    };
    const iphone16PlusModel = {
      ...model,
      id: "iphone-16-plus-model",
      name: "iPhone 16 Plus",
      slug: "iphone-16-plus",
      generation_label: "16 Plus",
      device_variants: [
        {
          ...model.device_variants[0],
          id: "iphone-16-plus-variant",
          variant_name: "128GB",
        },
      ],
    };
    const iphone16ProMaxModel = {
      ...model,
      id: "iphone-16-pro-max-model",
      name: "iPhone 16 Pro Max",
      slug: "iphone-16-pro-max",
      generation_label: "16 Pro Max",
      device_variants: [
        {
          ...model.device_variants[0],
          id: "iphone-16-pro-max-variant",
          variant_name: "256GB",
        },
      ],
    };
    const iphone14ProMaxModel = {
      ...model,
      id: "iphone-14-pro-max-model",
      name: "iPhone 14 Pro Max",
      slug: "iphone-14-pro-max",
      generation_label: "14 Pro Max",
      release_date: new Date("2022-09-16T00:00:00.000Z"),
      device_variants: [
        {
          ...model.device_variants[0],
          id: "iphone-14-pro-max-variant",
          variant_name: "128GB",
        },
      ],
    };
    const iphone14ProModel = {
      ...model,
      id: "iphone-14-pro-model",
      name: "iPhone 14 Pro",
      slug: "iphone-14-pro",
      generation_label: "14 Pro",
      release_date: new Date("2022-09-16T00:00:00.000Z"),
      device_variants: [
        {
          ...model.device_variants[0],
          id: "iphone-14-pro-variant",
          variant_name: "128GB",
        },
      ],
    };
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.device_models.findMany.mockResolvedValue([
      iphone16Model,
      iphone16ProMaxModel,
      iphone14ProModel,
      iphone16PlusModel,
      iphone14ProMaxModel,
    ]);

    const result = await service.ask({ question, top_k: 6 });

    expect(result.data.citations.map((citation) => citation.title)).toEqual([
      "Apple iPhone 14 Pro Max",
      "Apple iPhone 16 Plus",
    ]);
    expect(result.data.answer).toContain("Apple iPhone 14 Pro Max");
    expect(result.data.answer).toContain("Apple iPhone 16 Plus");
    expect(result.data.answer).not.toContain("Apple iPhone 16 và");
    expect(prisma.device_models.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 250 }),
    );
  });

  it("ranks devices using the requested structured metric", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model, galaxyModel]);

    const result = await service.ask({
      question: "Thiết bị nào có pin lớn nhất?",
      top_k: 5,
    });

    expect(result.meta.intent).toBe("ranking");
    expect(result.data.answer).toContain(
      "Bản ghi đang dẫn đầu là **Samsung Galaxy S25 Ultra**",
    );
    expect(result.data.answer).toContain("5000 mAh");
  });

  it("turns a use-case request into reasoned, conditional advice", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.device_models.findMany.mockResolvedValue([model, galaxyModel]);

    const result = await service.ask({
      question:
        "Tư vấn iPhone 16 Pro hay Galaxy S25 Ultra để chơi game và pin tốt",
      top_k: 6,
    });

    expect(result.meta.intent).toBe("recommendation");
    expect(result.data.answer).toContain("## Gợi ý ngắn");
    expect(result.data.answer).toContain("chơi game");
    expect(result.data.answer).toContain("Vì sao và đánh đổi");
    expect(result.data.answer).toContain("lợi thế trong đúng phép đo này");
    expect(result.data.answer).toContain(
      "Dung lượng không đồng nghĩa thời lượng sử dụng",
    );
    expect(result.data.answer).toContain("Còn thiếu để chốt");
    expect(result.data.citations.map((citation) => citation.title)).toEqual(
      expect.arrayContaining([
        "Apple iPhone 16 Pro",
        "Samsung Galaxy S25 Ultra",
      ]),
    );
  });

  it("answers a focused lookup without dumping unrelated specifications", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model]);

    const result = await service.ask({
      question: "Pin và sạc của iPhone 16 Pro thế nào?",
      top_k: 3,
    });

    expect(result.data.answer).toContain(
      "## Trả lời theo tiêu chí bạn quan tâm",
    );
    expect(result.data.answer).toContain("**Pin và sạc:**");
    expect(result.data.answer).toContain(
      "không phải phép đo thời lượng sử dụng thực tế",
    );
    expect(result.data.answer).not.toContain("**Camera:**");
    expect(result.data.answer).not.toContain("**Giá ra mắt:**");
  });

  it("resolves an anaphoric follow-up against the prior catalog turn", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model, galaxyModel]);

    const result = await service.ask({
      question: "Còn pin thì sao?",
      top_k: 6,
      history: [
        {
          role: "user",
          content: "So sánh iPhone 16 Pro và Galaxy S25 Ultra",
        },
        {
          role: "assistant",
          content: "Mình đã so sánh hai thiết bị theo dữ liệu SpecHub.",
        },
      ],
    });

    expect(result.meta.intent).toBe("compare");
    expect(result.meta.contextual_follow_up).toBe(true);
    expect(result.data.answer).toContain("## So sánh nhanh");
    expect(result.data.answer).toContain("| Pin |");
    expect(result.data.citations.map((citation) => citation.title)).toEqual([
      "Apple iPhone 16 Pro",
      "Samsung Galaxy S25 Ultra",
    ]);
  });

  it("keeps the original devices and current comparison criterion across multiple turns", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model, galaxyModel]);

    const result = await service.ask({
      question: "Giá thì sao?",
      top_k: 6,
      history: [
        {
          role: "user",
          content: "So sánh iPhone 16 Pro và Galaxy S25 Ultra",
        },
        {
          role: "assistant",
          content: "Mình đã đối chiếu các thông số chính.",
        },
        { role: "user", content: "Còn pin thì sao?" },
        {
          role: "assistant",
          content: "Galaxy có dung lượng pin công bố lớn hơn.",
        },
      ],
    });

    expect(result.meta.intent).toBe("compare");
    expect(result.meta.contextual_follow_up).toBe(true);
    expect(result.data.citations.map((citation) => citation.title)).toEqual([
      "Apple iPhone 16 Pro",
      "Samsung Galaxy S25 Ultra",
    ]);
    expect(result.data.answer).toContain("| Giá ra mắt |");
    expect(result.data.answer).not.toContain("| Pin |");
  });

  it("starts a new lookup when a short question names a device explicitly", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model, galaxyModel]);

    const result = await service.ask({
      question: "Giá Galaxy S25 Ultra?",
      top_k: 6,
      history: [
        {
          role: "user",
          content: "So sánh iPhone 16 Pro và Galaxy S25 Ultra",
        },
        { role: "assistant", content: "Đã so sánh pin của cả hai." },
      ],
    });

    expect(result.meta.intent).toBe("lookup");
    expect(result.meta.contextual_follow_up).toBe(false);
    expect(result.data.citations.map((citation) => citation.title)).toEqual([
      "Samsung Galaxy S25 Ultra",
    ]);
  });

  it("uses the latest named catalog topic as the anchor for later follow-ups", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model, galaxyModel]);

    const result = await service.ask({
      question: "Giá thì sao?",
      top_k: 6,
      history: [
        { role: "user", content: "Pin iPhone 16 Pro thế nào?" },
        { role: "assistant", content: "Pin công bố là 3582 mAh." },
        {
          role: "user",
          content: "So sánh Galaxy S25 Ultra và iPhone 16 Pro",
        },
        { role: "assistant", content: "Đã chuyển sang so sánh hai mẫu này." },
      ],
    });

    expect(result.meta.intent).toBe("compare");
    expect(result.meta.contextual_follow_up).toBe(true);
    expect(result.data.citations.map((citation) => citation.title)).toEqual([
      "Samsung Galaxy S25 Ultra",
      "Apple iPhone 16 Pro",
    ]);
    expect(result.data.answer).toContain("| Giá ra mắt |");
  });

  it("passes the established conversation to the grounded answer provider", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model, galaxyModel]);
    const provider = {
      ragModelName: "external-test-model",
      embeddingModelName: "local-hash-embedding-v1",
      generateAnswer: jest.fn().mockResolvedValue(null),
    };
    const contextualService = new AiService(prisma as any, provider as any);
    const history = [
      {
        role: "user" as const,
        content: "So sánh iPhone 16 Pro và Galaxy S25 Ultra",
      },
      { role: "assistant" as const, content: "Đã so sánh tổng quan." },
    ];

    await contextualService.ask({
      question: "Hiệu năng?",
      top_k: 6,
      history,
    });

    expect(provider.generateAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation: history,
        decisionContext: expect.objectContaining({
          intent: "compare",
          priorities: ["performance"],
        }),
      }),
    );
  });

  it("preserves prior catalog context in the streaming follow-up path", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model, galaxyModel]);
    const events: Array<{ type: string; [key: string]: unknown }> = [];

    const result = await service.streamAsk(
      {
        question: "Pin của cả hai thì sao?",
        top_k: 6,
        history: [
          {
            role: "user",
            content: "So sánh iPhone 16 Pro và Galaxy S25 Ultra",
          },
        ],
      },
      (event) => {
        events.push(event);
      },
    );

    expect(result.meta.intent).toBe("compare");
    expect(result.meta.contextual_follow_up).toBe(true);
    expect(events.find((event) => event.type === "context")?.meta).toEqual(
      expect.objectContaining({
        intent: "compare",
        contextual_follow_up: true,
      }),
    );
  });

  it("locks an exact model lookup to the longest mentioned product name", async () => {
    const iphone16ProMax = {
      ...model,
      id: "model-pro-max",
      name: "iPhone 16 Pro Max",
      slug: "iphone-16-pro-max",
      generation_label: "16 Pro Max",
      device_variants: [
        {
          ...model.device_variants[0],
          id: "variant-pro-max",
          variant_name: "256GB Pro Max",
          variant_batteries: [
            {
              ...model.device_variants[0].variant_batteries[0],
              battery_unit: {
                ...model.device_variants[0].variant_batteries[0].battery_unit,
                id: "battery-pro-max",
                name: "iPhone 16 Pro Max battery",
                capacity_mah: 4685,
              },
            },
          ],
        },
      ],
    };
    const iphone16 = {
      ...model,
      id: "model-iphone-16",
      name: "iPhone 16",
      slug: "iphone-16",
      generation_label: "16",
    };
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.device_models.findMany.mockResolvedValue([
      model,
      iphone16,
      iphone16ProMax,
    ]);

    const result = await service.ask({
      question: "iPhone 16 Pro Max có gì?",
      top_k: 5,
    });

    expect(result.meta.intent).toBe("lookup");
    expect(result.data.citations).toHaveLength(1);
    expect(result.data.citations[0]?.title).toBe("Apple iPhone 16 Pro Max");
    expect(result.data.answer).toContain("4685 mAh");
    expect(result.data.answer).not.toContain("3582 mAh");
    expect(result.data.answer).not.toContain("### Apple iPhone 16 Pro [");
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it("rejects provider answers with invalid citations", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model]);
    const provider = {
      ragModelName: "external-test-model",
      embeddingModelName: "local-hash-embedding-v1",
      generateAnswer: jest.fn().mockResolvedValue({
        answer: "A fabricated answer with an invalid citation [99].",
        modelName: "external-test-model",
        provider: "openai",
      }),
    };
    const guardedService = new AiService(prisma as any, provider as any);

    const result = await guardedService.ask({
      question: "Thông tin iPhone 16 Pro",
      top_k: 3,
    });

    expect(result.meta.rag_provider).toBe("local");
    expect(result.data.answer).toContain(
      "## Apple iPhone 16 Pro: tổng quan nhanh",
    );
    expect(result.data.answer).not.toContain("[99]");
  });

  it("does not cache a validated answer while Ollama is configured", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model]);
    const provider = {
      ragModelName: "qwen2.5:3b",
      embeddingModelName: "local-hash-embedding-v1",
      answerProviderName: "ollama",
      generateAnswer: jest.fn().mockResolvedValue({
        answer: "iPhone 16 Pro dùng Apple A18 Pro [1].",
        modelName: "qwen2.5:3b",
        provider: "ollama",
      }),
    };
    const guardedService = new AiService(prisma as any, provider as any);

    const result = await guardedService.ask({
      question: "Pin iPhone 16 Pro thế nào?",
      top_k: 3,
    });

    expect(result.meta.rag_provider).toBe("ollama");
    expect(result.data.warnings).toEqual([]);
    expect(prisma.ai_query_cache.upsert).not.toHaveBeenCalled();
  });

  it("treats 'đánh giá' as a broad overview instead of a price-only request", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model]);

    const result = await service.ask({
      question: "Đánh giá iPhone 16 Pro",
      top_k: 3,
    });

    expect(result.meta.intent).toBe("lookup");
    expect(result.data.answer).toContain(
      "## Apple iPhone 16 Pro: tổng quan nhanh",
    );
    expect(result.data.answer).toContain("**Chipset:**");
    expect(result.data.answer).toContain("**Màn hình:**");
    expect(result.data.answer).toContain("**Pin và sạc:**");
    expect(result.data.answer).toContain("**Giá ra mắt:**");
  });

  it("indexes only raw pages that have been approved", async () => {
    prisma.raw_pages.findMany.mockResolvedValue([]);
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        $executeRawUnsafe: jest.fn(),
        ai_query_cache: { deleteMany: jest.fn() },
      }),
    );

    await service.indexRawPages();

    expect(prisma.raw_pages.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "approved" }),
      }),
    );
  });

  it("clears every answer cache entry after a partial knowledge reindex", async () => {
    const deleteMany = jest.fn();
    prisma.raw_pages.findMany.mockResolvedValue([]);
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        $executeRawUnsafe: jest.fn(),
        ai_query_cache: { deleteMany },
      }),
    );

    await service.indexRawPages();

    expect(deleteMany).toHaveBeenCalledWith({});
  });

  it("streams a validated provider answer once without restarting it", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model]);
    const provider = {
      ragModelName: "qwen2.5:3b",
      embeddingModelName: "local-hash-embedding-v1",
      answerProviderName: "ollama",
      generateAnswerStream: jest.fn(
        async (
          _input: unknown,
          callbacks: { onDelta: (text: string) => Promise<void> },
        ) => {
          await callbacks.onDelta("iPhone 16 Pro dùng ");
          await callbacks.onDelta("Apple A18 Pro [1].");
          return {
            answer: "iPhone 16 Pro dùng Apple A18 Pro [1].",
            modelName: "qwen2.5:3b",
            provider: "ollama",
          };
        },
      ),
    };
    const streamingService = new AiService(prisma as any, provider as any);
    const events: Array<{ type: string; [key: string]: unknown }> = [];

    const result = await streamingService.streamAsk(
      {
        question: "iPhone 16 Pro dùng chipset gì?",
        top_k: 3,
      },
      (event) => {
        events.push(event);
      },
    );

    const contextIndex = events.findIndex((event) => event.type === "context");
    const deltaIndex = events.findIndex((event) => event.type === "delta");
    expect(contextIndex).toBeGreaterThanOrEqual(0);
    expect(deltaIndex).toBeGreaterThan(contextIndex);
    expect(events.filter((event) => event.type === "delta")).toEqual([
      {
        type: "delta",
        text: "iPhone 16 Pro dùng ",
      },
      {
        type: "delta",
        text: "Apple A18 Pro [1].",
      },
    ]);
    expect(events.some((event) => event.type === "reset")).toBe(false);
    expect(
      events.some(
        (event) => event.type === "status" && event.stage === "verifying",
      ),
    ).toBe(false);
    expect(
      events.some(
        (event) =>
          event.type === "status" && event.message === "Trợ lý đang trả lời...",
      ),
    ).toBe(true);
    expect(
      JSON.stringify(events.filter((event) => event.type === "status")),
    ).not.toContain("qwen2.5:3b");
    expect(events.at(-1)).toEqual(expect.objectContaining({ type: "result" }));
    expect(result.data.answer).toBe("iPhone 16 Pro dùng Apple A18 Pro [1].");
  });

  it("does not cache a streamed fallback after Ollama returns no validated answer", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model]);
    const provider = {
      ragModelName: "qwen2.5:3b",
      embeddingModelName: "local-hash-embedding-v1",
      answerProviderName: "ollama",
      generateAnswerStream: jest.fn(
        async (
          _input: unknown,
          callbacks: { onDelta: (text: string) => Promise<void> },
        ) => {
          await callbacks.onDelta("Câu trả lời Ollama bị từ chối.");
          return null;
        },
      ),
    };
    const streamingService = new AiService(prisma as any, provider as any);
    const events: Array<{ type: string; [key: string]: unknown }> = [];

    const result = await streamingService.streamAsk(
      { question: "iPhone 16 Pro dùng chipset gì?", top_k: 3 },
      (event) => {
        events.push(event);
      },
    );

    expect(result.meta.rag_provider).toBe("local");
    expect(prisma.ai_query_cache.upsert).not.toHaveBeenCalled();
    expect(events.filter((event) => event.type === "delta")).toEqual([
      { type: "delta", text: "Câu trả lời Ollama bị từ chối." },
      { type: "delta", text: result.data.answer },
    ]);
    expect(events.filter((event) => event.type === "reset")).toEqual([
      { type: "reset", reason: "fallback" },
    ]);
  });

  it("streams a cached answer once without calling retrieval or the provider", async () => {
    const provider = {
      ragModelName: "local-rag-v1",
      embeddingModelName: "local-hash-embedding-v1",
      answerProviderName: "local",
      generateAnswerStream: jest.fn(),
    };
    prisma.ai_query_cache.findUnique.mockResolvedValue({
      query_text: "iPhone 16 Pro dùng chipset gì?",
      answer_text: "iPhone 16 Pro dùng Apple A18 Pro [1].",
      citations: [
        {
          entity_type: "device_model",
          entity_id: "model-1",
          title: "Apple iPhone 16 Pro",
          excerpt: "Chipset: Apple A18 Pro",
          slug: "iphone-16-pro",
          score: 0.9,
        },
      ],
      model_name: "local-rag-v1",
      expires_at: new Date(Date.now() + 60_000),
    });
    prisma.ai_query_cache.update.mockResolvedValue({});
    const streamingService = new AiService(prisma as any, provider as any);
    const events: Array<{ type: string; [key: string]: unknown }> = [];

    const result = await streamingService.streamAsk(
      { question: "iPhone 16 Pro dùng chipset gì?", top_k: 3 },
      (event) => {
        events.push(event);
      },
    );

    expect(provider.generateAnswerStream).not.toHaveBeenCalled();
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
    expect(prisma.device_models.findMany).not.toHaveBeenCalled();
    expect(events.map((event) => event.type)).toEqual([
      "status",
      "delta",
      "result",
    ]);
    expect(events[1]).toEqual({
      type: "delta",
      text: "iPhone 16 Pro dùng Apple A18 Pro [1].",
    });
    expect(result.data.cached).toBe(true);
  });

  it("stops a streamed answer without emitting fallback, complete, or result events", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([model]);
    const abortController = new AbortController();
    const provider = {
      ragModelName: "qwen2.5:3b",
      embeddingModelName: "local-hash-embedding-v1",
      answerProviderName: "ollama",
      generateAnswerStream: jest.fn(
        async (
          _input: unknown,
          callbacks: { onDelta: (text: string) => Promise<void> },
          signal: AbortSignal,
        ) => {
          await callbacks.onDelta("Câu trả lời đang dở dang");
          abortController.abort(new Error("user stopped the answer"));
          signal.throwIfAborted();
          return null;
        },
      ),
    };
    const streamingService = new AiService(prisma as any, provider as any);
    const events: Array<{ type: string; [key: string]: unknown }> = [];

    await expect(
      streamingService.streamAsk(
        { question: "iPhone 16 Pro dùng chipset gì?", top_k: 3 },
        (event) => {
          events.push(event);
        },
        abortController.signal,
      ),
    ).rejects.toThrow();

    expect(events).toContainEqual({
      type: "delta",
      text: "Câu trả lời đang dở dang",
    });
    expect(events.some((event) => event.type === "reset")).toBe(false);
    expect(events.some((event) => event.type === "result")).toBe(false);
    expect(
      events.some(
        (event) => event.type === "status" && event.stage === "complete",
      ),
    ).toBe(false);
  });

  it("returns the grounded fallback immediately when no database context exists", async () => {
    prisma.ai_query_cache.findUnique.mockResolvedValue(null);
    prisma.ai_query_cache.upsert.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 0 }]);
    prisma.device_models.findMany.mockResolvedValue([]);
    const provider = {
      ragModelName: "qwen2.5:3b",
      embeddingModelName: "local-hash-embedding-v1",
      answerProviderName: "ollama",
      generateAnswerStream: jest.fn(),
      generateConversationAnswerStream: jest.fn().mockResolvedValue(null),
    };
    const streamingService = new AiService(prisma as any, provider as any);
    const events: Array<{ type: string; [key: string]: unknown }> = [];

    const result = await streamingService.streamAsk(
      {
        question: "Có mẫu laptop nào?",
        top_k: 3,
      },
      (event) => {
        events.push(event);
      },
    );

    expect(provider.generateAnswerStream).not.toHaveBeenCalled();
    expect(provider.generateConversationAnswerStream).not.toHaveBeenCalled();
    expect(events.some((event) => event.type === "delta")).toBe(true);
    expect(events.some((event) => event.type === "result")).toBe(true);
    expect(result.meta.rag_provider).toBe("local");
    expect(result.data.model_name).toBe("local-rag-v1");
    expect(result.data.answer).toContain("Chưa tìm thấy dữ liệu phù hợp");
  });

  it("uses Ollama for a simple general question without querying the database", async () => {
    const provider = {
      ragModelName: "qwen2.5:3b",
      embeddingModelName: "local-hash-embedding-v1",
      answerProviderName: "ollama",
      generateAnswerStream: jest.fn(),
      generateConversationAnswerStream: jest.fn(
        async (
          _question: string,
          callbacks: { onDelta: (text: string) => Promise<void> },
        ) => {
          await callbacks.onDelta("1 + 1 ");
          await callbacks.onDelta("bằng 2.");
          return {
            answer: "1 + 1 bằng 2.",
            modelName: "qwen2.5:3b",
            provider: "ollama",
          };
        },
      ),
    };
    const streamingService = new AiService(prisma as any, provider as any);
    const events: Array<{ type: string; [key: string]: unknown }> = [];

    const result = await streamingService.streamAsk(
      {
        question: "1 + 1 bằng mấy?",
        top_k: 3,
      },
      (event) => {
        events.push(event);
      },
    );

    expect(provider.generateAnswerStream).not.toHaveBeenCalled();
    expect(provider.generateConversationAnswerStream).toHaveBeenCalled();
    expect(prisma.ai_query_cache.findUnique).not.toHaveBeenCalled();
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
    expect(prisma.device_models.findMany).not.toHaveBeenCalled();
    expect(result.data.answer).toBe("1 + 1 bằng 2.");
    expect(result.data.model_name).toBe("qwen2.5:3b");
    expect(result.meta.rag_provider).toBe("ollama");
    expect(result.meta.intent).toBe("conversation");
    expect(result.meta.confidence).toBe(100);
    expect(result.data.warnings).toEqual([]);
    expect(
      events
        .filter((event) => event.type === "delta")
        .map((event) => event.text),
    ).toEqual(["1 + 1 ", "bằng 2."]);
    expect(
      events.some(
        (event) =>
          event.type === "status" && event.message === "Trợ lý đang trả lời...",
      ),
    ).toBe(true);
  });

  it("answers a simple greeting immediately without querying the database", async () => {
    const events: Array<{ type: string; [key: string]: unknown }> = [];

    const result = await service.streamAsk(
      {
        question: "xin chào",
        top_k: 3,
      },
      (event) => {
        events.push(event);
      },
    );

    expect(prisma.ai_query_cache.findUnique).not.toHaveBeenCalled();
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
    expect(prisma.device_models.findMany).not.toHaveBeenCalled();
    expect(result.data.answer).toContain("Xin chào");
    expect(result.meta.intent).toBe("conversation");
    expect(result.meta.source).toBe("conversation");
    expect(result.meta.confidence).toBe(100);
    expect(events.map((event) => event.type)).toEqual([
      "status",
      "context",
      "delta",
      "status",
      "result",
    ]);
  });

  it("answers a general request for help without querying the database", async () => {
    const result = await service.ask({
      question: "giúp tôi được không",
      top_k: 3,
    });

    expect(prisma.ai_query_cache.findUnique).not.toHaveBeenCalled();
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
    expect(prisma.device_models.findMany).not.toHaveBeenCalled();
    expect(result.data.answer).toContain("Tất nhiên");
    expect(result.meta.intent).toBe("conversation");
    expect(result.meta.confidence).toBe(100);
  });

  it("routes an identity question to Ollama and streams its answer", async () => {
    const provider = {
      ragModelName: "qwen2.5:3b",
      embeddingModelName: "local-hash-embedding-v1",
      answerProviderName: "ollama",
      generateConversationAnswerStream: jest.fn(
        async (
          _question: string,
          callbacks: { onDelta: (text: string) => Promise<void> },
        ) => {
          await callbacks.onDelta("Mình là ");
          await callbacks.onDelta("SpecHub AI.");
          return {
            answer: "Mình là SpecHub AI.",
            modelName: "qwen2.5:3b",
            provider: "ollama",
          };
        },
      ),
    };
    const streamingService = new AiService(prisma as any, provider as any);
    const events: Array<{ type: string; [key: string]: unknown }> = [];

    const result = await streamingService.streamAsk(
      {
        question: "bạn tên là gì",
        top_k: 3,
      },
      (event) => {
        events.push(event);
      },
    );

    expect(provider.generateConversationAnswerStream).toHaveBeenCalledWith(
      "bạn tên là gì",
      expect.any(Object),
      undefined,
    );
    expect(prisma.ai_query_cache.findUnique).not.toHaveBeenCalled();
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
    expect(result.data.answer).toBe("Mình là SpecHub AI.");
    expect(result.data.model_name).toBe("qwen2.5:3b");
    expect(result.meta.rag_provider).toBe("ollama");
    expect(result.meta.intent).toBe("conversation");
    expect(
      events
        .filter((event) => event.type === "delta")
        .map((event) => event.text),
    ).toEqual(["Mình là ", "SpecHub AI."]);
  });
});
