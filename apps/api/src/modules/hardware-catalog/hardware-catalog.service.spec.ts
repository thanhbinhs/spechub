import { BadRequestException } from "@nestjs/common";
import { HardwareCatalogService } from "./hardware-catalog.service";

describe("HardwareCatalogService", () => {
  const prisma = {
    organizations: { findFirst: jest.fn() },
    cpus: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    gpus: { create: jest.fn(), findFirst: jest.fn() },
    npus: { create: jest.fn(), findFirst: jest.fn() },
    storage_standards: { create: jest.fn() },
    chipsets: { create: jest.fn(), update: jest.fn() },
    benchmarks: { findMany: jest.fn() },
    chipset_benchmarks: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    benchmark_runs: { create: jest.fn(), deleteMany: jest.fn() },
    operating_systems: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    os_versions: { create: jest.fn(), findFirst: jest.fn() },
    os_ui_layers: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    os_ui_layer_versions: { create: jest.fn(), findFirst: jest.fn() },
    module_field_coverage: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(),
  };

  let service: HardwareCatalogService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback: any) => callback(prisma));
    service = new HardwareCatalogService(prisma as any);
  });

  it("creates a CPU with its detailed specifications", async () => {
    prisma.organizations.findFirst.mockResolvedValue({ id: "org-1" });
    prisma.cpus.create.mockResolvedValue({
      id: "cpu-1",
      name: "Cortex-X4",
      slug: "cortex-x4",
      description: "Flagship CPU core",
    });

    await expect(
      service.createModule({
        kind: "cpu",
        name: "Cortex-X4",
        slug: "cortex-x4",
        description: "Flagship CPU core",
        organization_id: "org-1",
        core_count: 1,
        thread_count: 1,
        big_little: true,
        isa_name: "ARMv9",
        microarchitecture: "Cortex-X4",
        core_type: "performance",
        max_frequency_mhz: 3400,
        min_frequency_mhz: 400,
        supports_64bit: true,
        simd_extension: "NEON",
        virtualization: true,
        out_of_order: true,
        smt: false,
        clusters: [
          {
            cluster_name: "Prime",
            core_microarchitecture: "Cortex-X4",
            core_count: 1,
            clock_ghz: 3.4,
            cluster_order: 1,
          },
        ],
        image_url: "https://cdn.example.test/cpus/cortex-x4.webp",
        image_source_url: "https://example.test/cortex-x4",
      }),
    ).resolves.toEqual({
      id: "cpu-1",
      kind: "cpu",
      name: "Cortex-X4",
      slug: "cortex-x4",
      description: "Flagship CPU core",
    });

    expect(prisma.cpus.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          manufacturer_org_id: "org-1",
          core_count: 1,
          thread_count: 1,
          big_little: true,
          isa_name: "ARMv9",
          microarchitecture: "Cortex-X4",
          core_type: "performance",
          max_frequency_mhz: 3400,
          min_frequency_mhz: 400,
          supports_64bit: true,
          simd_extension: "NEON",
          virtualization: true,
          out_of_order: true,
          smt: false,
          cpu_clusters: {
            create: [
              {
                cluster_name: "Prime",
                core_microarchitecture: "Cortex-X4",
                core_count: 1,
                clock_ghz: 3.4,
                cluster_order: 1,
              },
            ],
          },
          image_url: "https://cdn.example.test/cpus/cortex-x4.webp",
          image_source_url: "https://example.test/cortex-x4",
        }),
      }),
    );
  });

  it("stores no TOPS values when a module is not a dedicated NPU", async () => {
    prisma.npus.create.mockResolvedValue({
      id: "npu-1",
      name: "DSP-only AI engine",
      slug: "dsp-only-ai-engine",
      description: "Legacy DSP capability",
    });

    await service.createModule({
      kind: "npu",
      name: "DSP-only AI engine",
      slug: "dsp-only-ai-engine",
      description: "Legacy DSP capability",
      dedicated_npu: false,
      dsp_name: "Hexagon",
      tops: 10,
      tops_int8: 10,
    });

    expect(prisma.npus.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dedicated_npu: false,
          dsp_name: "Hexagon",
          tops: null,
          tops_int8: null,
          tops_int4: null,
          tops_fp16: null,
        }),
      }),
    );
  });

  it("rejects benchmark-like performance values on a storage standard", async () => {
    await expect(
      service.createModule({
        kind: "storage-standard",
        name: "UFS Example",
        slug: "ufs-example",
        description: "Reusable storage protocol capability",
        sequential_read_mbps: 4200,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.storage_standards.create).not.toHaveBeenCalled();
  });

  it("requires a manufacturer and chip kind for a chipset", async () => {
    await expect(
      service.createModule({
        kind: "chipset",
        name: "Example SoC",
        slug: "example-soc",
        description:
          "Nền tảng SoC mẫu dành cho thiết bị di động, mô tả vai trò xử lý trung tâm, khả năng tích hợp các thành phần phần cứng, phạm vi tương thích và giới hạn sử dụng.",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.chipsets.create).not.toHaveBeenCalled();
  });

  it("creates a chipset with its primary component relations", async () => {
    prisma.organizations.findFirst.mockResolvedValue({ id: "org-1" });
    prisma.chipsets.create.mockResolvedValue({
      id: "chipset-1",
      name: "Example SoC",
      slug: "example-soc",
      description: "Example chipset",
    });

    await service.createModule({
      kind: "chipset",
      name: "Example SoC",
      slug: "example-soc",
      description: "Example chipset",
      organization_id: "org-1",
      category: "soc",
      cpu_id: "cpu-1",
      gpu_id: "gpu-1",
      npu_id: "npu-1",
      modem_id: "modem-1",
      modem_is_integrated: false,
    });

    expect(prisma.chipsets.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          chipset_cpu_links: {
            create: { cpu_id: "cpu-1", is_primary: true },
          },
          chipset_gpu_links: {
            create: { gpu_id: "gpu-1", is_primary: true },
          },
          chipset_npu_links: {
            create: { npu_id: "npu-1", is_primary: true },
          },
          chipset_modem_links: {
            create: {
              modem_id: "modem-1",
              is_primary: true,
              is_integrated: false,
            },
          },
        }),
      }),
    );
  });

  it("creates an SoC with inline CPU clusters, GPU, NPU and chipset benchmark", async () => {
    prisma.organizations.findFirst.mockResolvedValue({ id: "org-1" });
    prisma.cpus.findFirst.mockResolvedValue(null);
    prisma.gpus.findFirst.mockResolvedValue(null);
    prisma.npus.findFirst.mockResolvedValue(null);
    prisma.cpus.create.mockResolvedValue({ id: "cpu-inline" });
    prisma.gpus.create.mockResolvedValue({ id: "gpu-inline" });
    prisma.npus.create.mockResolvedValue({ id: "npu-inline" });
    prisma.benchmarks.findMany.mockResolvedValue([{ id: "benchmark-1" }]);
    prisma.chipsets.create.mockResolvedValue({
      id: "chipset-inline",
      name: "Snapdragon 8 Gen 1",
      slug: "snapdragon-8-gen-1",
      description: "Example chipset",
    });

    await service.createModule({
      kind: "chipset",
      name: "Snapdragon 8 Gen 1",
      slug: "snapdragon-8-gen-1",
      description: "Example chipset",
      organization_id: "org-1",
      category: "soc",
      cpu: {
        name: "Kryo CPU (Snapdragon 8 Gen 1)",
        slug: "kryo-cpu-snapdragon-8-gen-1",
        core_count: 8,
        isa_name: "ARMv9-A",
        max_frequency_mhz: 3000,
        clusters: [
          {
            cluster_name: "Prime",
            core_microarchitecture: "Cortex-X2",
            core_count: 1,
            clock_ghz: 3,
          },
          {
            cluster_name: "Performance",
            core_microarchitecture: "Cortex-A710",
            core_count: 3,
            clock_ghz: 2.5,
          },
          {
            cluster_name: "Efficiency",
            core_microarchitecture: "Cortex-A510",
            core_count: 4,
            clock_ghz: 1.8,
          },
        ],
      },
      gpu: {
        name: "Adreno 730",
        slug: "adreno-730-snapdragon-8-gen-1",
        vulkan_version: "1.1",
      },
      npu: {
        name: "Hexagon AI Engine",
        slug: "hexagon-ai-engine-snapdragon-8-gen-1",
        ai_engine_version: "7th Gen Qualcomm AI Engine",
      },
      benchmark_results: [
        {
          benchmark_id: "benchmark-1",
          score: 1_290_942,
          subscore_name: "overall",
        },
      ],
    });

    expect(prisma.cpus.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          core_count: 8,
          cpu_clusters: {
            create: expect.arrayContaining([
              expect.objectContaining({
                core_microarchitecture: "Cortex-X2",
                core_count: 1,
                clock_ghz: 3,
              }),
            ]),
          },
        }),
      }),
    );
    expect(prisma.chipsets.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          chipset_cpu_links: {
            create: { cpu_id: "cpu-inline", is_primary: true },
          },
          chipset_gpu_links: {
            create: { gpu_id: "gpu-inline", is_primary: true },
          },
          chipset_npu_links: {
            create: { npu_id: "npu-inline", is_primary: true },
          },
        }),
      }),
    );
    expect(prisma.chipset_benchmarks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        chipset_id: "chipset-inline",
        benchmark_id: "benchmark-1",
        score: 1_290_942,
        subscore_name: "overall",
      }),
    });
  });

  it("creates a concrete OS version together with an operating system", async () => {
    prisma.operating_systems.create.mockResolvedValue({
      id: "os-1",
      name: "Android 16",
      slug: "android-16",
      description: "Android 16 release",
    });

    await service.createModule({
      kind: "operating-system",
      name: "Android 16",
      slug: "android-16",
      description: "Android 16 release",
      category: "Android",
      initial_release_date: new Date("2025-06-10"),
    });

    expect(prisma.operating_systems.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          os_family: "Android",
          os_versions: {
            create: {
              version_name: "16",
              release_date: new Date("2025-06-10"),
            },
          },
        }),
      }),
    );
  });

  it("creates a selectable version for an existing operating system", async () => {
    prisma.operating_systems.findFirst.mockResolvedValue({
      id: "os-android",
      name: "Android",
      slug: "android",
      os_family: "android",
    });
    prisma.os_versions.findFirst.mockResolvedValue(null);
    prisma.os_versions.create.mockResolvedValue({
      id: "android-16",
      version_name: "16",
      operating_system: { id: "os-android", name: "Android" },
    });

    await service.createOperatingSystemVersion({
      operating_system_id: "os-android",
      version_name: "16",
      codename: "Baklava",
      release_date: new Date("2025-06-10"),
      api_level: 36,
    });

    expect(prisma.os_versions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          operating_system_id: "os-android",
          version_name: "16",
          codename: "Baklava",
          api_level: 36,
        }),
      }),
    );
  });

  it("creates a UI layer and its first selectable version together", async () => {
    prisma.os_ui_layers.findFirst.mockResolvedValue(null);
    prisma.os_ui_layers.create.mockResolvedValue({
      id: "one-ui",
      name: "One UI",
      slug: "one-ui",
    });
    prisma.os_ui_layer_versions.findFirst.mockResolvedValue(null);
    prisma.os_ui_layer_versions.create.mockResolvedValue({
      id: "one-ui-8",
      version_name: "8.0",
      ui_layer: { id: "one-ui", name: "One UI", slug: "one-ui" },
    });

    await service.createOsUiLayerVersion({
      ui_layer: {
        name: "One UI",
        slug: "one-ui",
        base_os_id: "os-android",
      },
      version_name: "8.0",
      base_os_version_id: "android-16",
      release_date: new Date("2025-10-01"),
    });

    expect(prisma.os_ui_layers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "One UI",
          slug: "one-ui",
          base_os_id: "os-android",
        }),
      }),
    );
    expect(prisma.os_ui_layer_versions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ui_layer_id: "one-ui",
          version_name: "8.0",
          base_os_version_id: "android-16",
        }),
      }),
    );
  });

  it("replaces or clears chipset component relations when editing", async () => {
    prisma.chipsets.update.mockResolvedValue({
      id: "chipset-1",
      name: "Example SoC",
      slug: "example-soc",
      description: "Example chipset",
    });

    await service.updateModule("chipset", "chipset-1", {
      cpu_id: "cpu-2",
      gpu_id: null,
      modem_id: "modem-2",
      modem_is_integrated: true,
    });

    expect(prisma.chipsets.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "chipset-1" },
        data: expect.objectContaining({
          chipset_cpu_links: {
            deleteMany: {},
            create: { cpu_id: "cpu-2", is_primary: true },
          },
          chipset_gpu_links: { deleteMany: {} },
          chipset_modem_links: {
            deleteMany: {},
            create: {
              modem_id: "modem-2",
              is_primary: true,
              is_integrated: true,
            },
          },
        }),
      }),
    );
  });

  it("updates an existing CPU module", async () => {
    prisma.organizations.findFirst.mockResolvedValue({ id: "org-1" });
    prisma.cpus.update.mockResolvedValue({
      id: "cpu-1",
      name: "Cortex-X4 Prime",
      slug: "cortex-x4-prime",
      description: "Updated CPU",
    });

    await expect(
      service.updateModule("cpu", "cpu-1", {
        name: "Cortex-X4 Prime",
        slug: "cortex-x4-prime",
        description: "Updated CPU",
        organization_id: "org-1",
        core_count: 2,
        clusters: [
          {
            cluster_name: "Performance",
            core_microarchitecture: "Cortex-X4",
            core_count: 2,
            clock_ghz: 3.5,
            cluster_order: 1,
          },
        ],
      }),
    ).resolves.toEqual({
      id: "cpu-1",
      kind: "cpu",
      name: "Cortex-X4 Prime",
      slug: "cortex-x4-prime",
      description: "Updated CPU",
    });

    expect(prisma.cpus.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cpu-1" },
        data: expect.objectContaining({
          manufacturer_org_id: "org-1",
          core_count: 2,
          cpu_clusters: {
            deleteMany: {},
            create: [
              {
                cluster_name: "Performance",
                core_microarchitecture: "Cortex-X4",
                core_count: 2,
                clock_ghz: 3.5,
                cluster_order: 1,
              },
            ],
          },
        }),
      }),
    );
  });

  it("builds a deduplicated research summary for a hardware module", async () => {
    const deviceVariant = {
      id: "variant-1",
      variant_name: "12 GB / 256 GB",
      market_name: "Global",
      color_name: null,
      color_hex: null,
      launch_price: "999.00",
      is_default: true,
      currency: { code: "USD", symbol: "$", decimal_digits: 2 },
      device_model: {
        id: "model-1",
        name: "Example Phone Pro",
        slug: "example-phone-pro",
        generation_label: "Gen 2",
        release_date: new Date("2025-01-01T00:00:00.000Z"),
        product_family: {
          id: "family-1",
          name: "Example Phone",
          slug: "example-phone",
          brand_org: {
            name: "Example",
            short_name: "Example",
            slug: "example",
          },
          device_category: { name: "Smartphone", slug: "smartphone" },
        },
      },
    };
    const competingVariant = {
      ...deviceVariant,
      id: "variant-2",
      variant_name: "16 GB / 512 GB",
      launch_price: "1099.00",
      device_model: {
        ...deviceVariant.device_model,
        id: "model-2",
        name: "Rival Phone Ultra",
        slug: "rival-phone-ultra",
        generation_label: "2025",
        product_family: {
          ...deviceVariant.device_model.product_family,
          id: "family-2",
          name: "Rival Phone",
          slug: "rival-phone",
          brand_org: {
            name: "Rival",
            short_name: "Rival",
            slug: "rival",
          },
        },
      },
    };
    const alternateVariant = {
      ...deviceVariant,
      id: "variant-3",
      variant_name: "16 GB / 1 TB",
      is_default: false,
    };
    prisma.cpus.findFirst.mockResolvedValue({
      id: "cpu-1",
      name: "Example CPU",
      slug: "example-cpu",
      description: null,
      core_count: 8,
      thread_count: null,
      big_little: true,
      isa_name: "ARMv9",
      manufacturer: {
        id: "org-1",
        name: "Example",
        slug: "example",
        short_name: "Example",
        logo_url: null,
      },
      architecture: null,
      _count: { variant_cpus: 4 },
      cpu_clusters: [],
      variant_cpus: [
        { cpu_role: "main", is_primary: true, device_variant: deviceVariant },
        { cpu_role: "main", is_primary: true, device_variant: deviceVariant },
        {
          cpu_role: "main",
          is_primary: false,
          device_variant: alternateVariant,
        },
        {
          cpu_role: "main",
          is_primary: true,
          device_variant: competingVariant,
        },
      ],
    });

    const result = await service.findByKindAndSlug("cpu", "example-cpu");

    expect(result.devices).toHaveLength(3);
    expect(result.research).toEqual(
      expect.objectContaining({
        variant_count: 3,
        product_count: 2,
        brand_count: 2,
        category_count: 1,
        priced_variant_count: 3,
      }),
    );
    expect(result.research.product_lines).toHaveLength(2);
    expect(result.research.representative_variant_ids).toHaveLength(3);
    expect(result.research.representative_variant_ids).toEqual(
      expect.arrayContaining(["variant-1", "variant-2", "variant-3"]),
    );
    expect(result.research.missing_specs).toContain("thread_count");
  });

  it("shows an explicit availability state for undisclosed module fields", async () => {
    prisma.module_field_coverage.findMany.mockResolvedValue([
      {
        field_key: "thread_count",
        status: "not_disclosed",
        source_url: null,
        notes: "Manufacturer has not published this value.",
      },
    ]);

    const result = await (service as any).withFieldCoverage({
      kind: "cpu",
      id: "cpu-1",
      name: "Example CPU",
      slug: "example-cpu",
      description: null,
      image_url: null,
      image_source_url: null,
      image_is_module: false,
      image_device: null,
      organization: null,
      specs: { core_count: 8, thread_count: null },
      field_coverage: {},
      devices: [],
      research: {},
    });

    expect(result.specs.thread_count).toEqual(
      expect.objectContaining({
        availability_status: "not_disclosed",
        label: "Nhà sản xuất chưa công bố",
      }),
    );
    expect(result.research.completeness_percent).toBe(100);
    expect(result.research.missing_specs).toEqual([]);
  });
});
