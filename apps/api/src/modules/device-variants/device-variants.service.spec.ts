import { BadRequestException, NotFoundException } from "@nestjs/common";
import { parseSpecificationNumber } from "@spechub/utils";
import { DeviceVariantsService } from "./device-variants.service";

describe("DeviceVariantsService", () => {
  const variantA = { id: "variant-a", variant_name: "256GB Natural Titanium" };
  const variantB = { id: "variant-b", variant_name: "512GB Black Titanium" };

  const prisma: any = {
    device_models: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    device_variants: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    currencies: {
      findMany: jest.fn(),
    },
    benchmarks: {
      findMany: jest.fn(),
    },
    scoring_profiles: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    variant_scorecards: {
      upsert: jest.fn(),
    },
    variant_scorecard_modules: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    display_technologies: {
      upsert: jest.fn(),
    },
    display_units: {
      create: jest.fn(),
    },
    battery_units: {
      create: jest.fn(),
    },
    camera_roles: {
      upsert: jest.fn(),
    },
    camera_modules: {
      create: jest.fn(),
    },
    variant_camera_modules: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    variant_camera_systems: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    catalog_entity_versions: {
      create: jest.fn(),
    },
    $transaction: jest.fn((operations: any) =>
      typeof operations === "function"
        ? operations(prisma)
        : Promise.all(operations),
    ),
  };

  let service: DeviceVariantsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.device_models.findFirst.mockResolvedValue({
      product_family: {
        device_category: { slug: "smartphone" },
      },
    });
    prisma.scoring_profiles.findFirst.mockResolvedValue(null);
    prisma.variant_scorecards.upsert.mockResolvedValue({ id: "scorecard-1" });
    prisma.variant_scorecard_modules.deleteMany.mockResolvedValue({ count: 0 });
    prisma.variant_scorecard_modules.createMany.mockResolvedValue({ count: 8 });
    const lastSavedVariant = async () => {
      const updateResult = prisma.device_variants.update.mock.results.at(-1);
      const createResult = prisma.device_variants.create.mock.results.at(-1);
      const value = updateResult?.value ?? createResult?.value ?? variantA;
      return {
        ...(await value),
        device_model_id: (await value)?.device_model_id ?? "model-1",
      };
    };
    prisma.device_variants.findUniqueOrThrow.mockImplementation(
      lastSavedVariant,
    );
    prisma.device_variants.findFirst.mockImplementation(lastSavedVariant);
    service = new DeviceVariantsService(prisma as any);
  });

  it("accepts Vietnamese and international numeric notation without changing the value", () => {
    expect(parseSpecificationNumber("6,7")).toBe(6.7);
    expect(parseSpecificationNumber("5,000")).toBe(5000);
    expect(parseSpecificationNumber("1.234,5")).toBe(1234.5);
    expect(parseSpecificationNumber("1.2.3")).toBeUndefined();
  });

  it("lists variants by model slug", async () => {
    prisma.device_variants.findMany.mockResolvedValue([variantA]);
    prisma.device_variants.count.mockResolvedValue(1);

    await service.findMany({
      model_slug: "iphone-16-pro",
      default_only: true,
    } as any);

    expect(prisma.device_variants.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          device_variant_benchmarks: expect.any(Object),
          variant_scorecards: expect.any(Object),
        }),
        where: expect.objectContaining({
          deleted_at: null,
          is_default: true,
          device_model: {
            slug: "iphone-16-pro",
            deleted_at: null,
          },
        }),
      }),
    );
  });

  it("searches variants by their device model name or slug", async () => {
    prisma.device_variants.findMany.mockResolvedValue([variantA, variantB]);
    prisma.device_variants.count.mockResolvedValue(2);

    await service.findMany({ q: "iPhone" } as any);

    expect(prisma.device_variants.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            {
              device_model: {
                deleted_at: null,
                OR: [
                  { name: { contains: "iPhone", mode: "insensitive" } },
                  { slug: { contains: "iPhone", mode: "insensitive" } },
                ],
              },
            },
          ]),
        }),
      }),
    );
  });

  it("searches variants by chipset name or model code", async () => {
    prisma.device_variants.findMany.mockResolvedValue([variantA]);
    prisma.device_variants.count.mockResolvedValue(1);

    await service.findMany({ q: "Snapdragon 8 Elite" } as any);

    expect(prisma.device_variants.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            {
              variant_chipsets: {
                some: {
                  chipset: {
                    deleted_at: null,
                    OR: [
                      {
                        name: {
                          contains: "Snapdragon 8 Elite",
                          mode: "insensitive",
                        },
                      },
                      {
                        model_code: {
                          contains: "Snapdragon 8 Elite",
                          mode: "insensitive",
                        },
                      },
                    ],
                  },
                },
              },
            },
          ]),
        }),
      }),
    );
  });

  it("keeps chipset performance benchmarks out of the device form", async () => {
    prisma.benchmarks.findMany.mockResolvedValue([]);

    await service.listBenchmarks();

    expect(prisma.benchmarks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          target_type: "device_variant",
          benchmark_type: { notIn: ["cpu", "gpu", "npu", "system"] },
        },
      }),
    );
  });

  it("compares variants while preserving requested order", async () => {
    prisma.device_variants.findMany.mockResolvedValue([variantB, variantA]);

    await expect(service.compare(["variant-a", "variant-b"])).resolves.toEqual({
      data: [variantA, variantB],
    });
    expect(prisma.device_variants.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          variant_module_scores: expect.objectContaining({
            select: expect.objectContaining({
              module_kind: true,
              score: true,
              score_source: true,
            }),
          }),
        }),
      }),
    );
  });

  it("rejects compare requests with fewer than 2 unique ids", async () => {
    await expect(
      service.compare(["variant-a", "variant-a"]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("throws when any compare variant is missing", async () => {
    prisma.device_variants.findMany.mockResolvedValue([variantA]);

    await expect(
      service.compare(["variant-a", "variant-b"]),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("creates optional physical, I/O, and thermal specification records with a variant", async () => {
    prisma.device_variants.create.mockResolvedValue(variantA);

    await expect(
      service.create({
        device_model_id: "model-1",
        variant_name: "256GB Global",
        release_status_id: 1,
        physical_specs: { height_mm: 149.6, weight_g: 199 },
        io_specs: { sim_slots: 2, esim_supported: true },
        thermal_specs: { cooling_type: "vapor_chamber", vc_area_mm2: 4000 },
      }),
    ).resolves.toEqual({ ...variantA, device_model_id: "model-1" });

    expect(prisma.device_variants.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          device_model_id: "model-1",
          variant_name: "256GB Global",
          is_default: false,
          variant_physical_specs: {
            create: { height_mm: 149.6, weight_g: 199 },
          },
          variant_io_specs: {
            create: { sim_slots: 2, esim_supported: true },
          },
          variant_thermal_specs: {
            create: { cooling_type: "Vapor chamber", vc_area_mm2: 4000 },
          },
        }),
      }),
    );
    expect(prisma.variant_scorecards.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          score_version: "automatic-device-score-v1.0.0",
          score_source: "specification_model",
          factors: expect.objectContaining({
            calculation_mode: "automatic_from_composed_device",
          }),
        }),
      }),
    );
  });

  it("creates a device model and its initial variant in one transaction", async () => {
    const model = {
      id: "model-1",
      name: "Galaxy S26 Ultra",
      slug: "galaxy-s26-ultra",
      aliases: [],
      editorial_sections: [],
    };
    prisma.device_models.create.mockResolvedValue(model);
    prisma.device_variants.create.mockResolvedValue({
      ...variantA,
      device_model_id: model.id,
    });
    prisma.catalog_entity_versions.create.mockResolvedValue({
      id: "version-1",
    });

    await expect(
      service.createWithDeviceModel(
        {
          model: {
            product_family_id: "family-1",
            name: model.name,
            slug: model.slug,
            release_status_id: 1,
            summary: "A".repeat(80),
            description: "B".repeat(240),
            aliases: [{ alias: "Galaxy S26U", alias_type: "marketing" }],
          },
          variant: {
            variant_name: "12GB / 256GB",
            release_status_id: 1,
          },
        },
        "user-1",
      ),
    ).resolves.toEqual({
      model,
      variant: {
        ...variantA,
        device_model_id: model.id,
      },
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.device_models.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: model.name,
          aliases: {
            create: [
              expect.objectContaining({
                alias: "Galaxy S26U",
                normalized_alias: "galaxy s26u",
              }),
            ],
          },
        }),
      }),
    );
    expect(prisma.device_variants.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          device_model_id: model.id,
          variant_name: "12GB / 256GB",
          is_default: true,
        }),
      }),
    );
    expect(prisma.catalog_entity_versions.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entity_table: "device_models",
        entity_id: model.id,
        actor_user_id: "user-1",
      }),
    });
  });

  it("keeps model and variant creation in the same rollback boundary", async () => {
    prisma.device_models.create.mockResolvedValue({
      id: "model-rollback",
      name: "Rollback phone",
      slug: "rollback-phone",
      aliases: [],
      editorial_sections: [],
    });
    prisma.device_variants.create.mockRejectedValue(
      new Error("inline display could not be created"),
    );

    await expect(
      service.createWithDeviceModel({
        model: {
          product_family_id: "family-1",
          name: "Rollback phone",
          slug: "rollback-phone",
          release_status_id: 1,
          summary: "A".repeat(80),
          description: "B".repeat(240),
        },
        variant: {
          variant_name: "Default",
          release_status_id: 1,
        },
      }),
    ).rejects.toThrow("inline display could not be created");

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.catalog_entity_versions.create).not.toHaveBeenCalled();
  });

  it("assigns CPU, GPU, RAM, and storage modules while creating a variant", async () => {
    prisma.device_variants.create.mockResolvedValue(variantA);

    await service.create({
      device_model_id: "model-1",
      variant_name: "16GB / 512GB",
      release_status_id: 1,
      hardware_components: {
        cpus: [{ module_id: "cpu-1" }],
        gpus: [{ module_id: "gpu-1", role: "integrated" }],
        memory: [
          {
            memory_standard_id: "memory-1",
            capacity_gb: 16,
            speed_mhz: 8533,
          },
        ],
        storage: [
          {
            storage_standard_id: "storage-1",
            total_capacity_gb: 512,
          },
        ],
      },
      module_scores: [
        {
          module_kind: "cpu",
          module_id: "cpu-1",
          score: 88.5,
        },
        {
          module_kind: "gpu",
          module_id: "gpu-1",
          score: 84,
          rationale: "Kết quả kiểm chứng nội bộ",
        },
      ],
    });

    expect(prisma.device_variants.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          variant_cpus: {
            create: [{ cpu_id: "cpu-1", cpu_role: "main", is_primary: true }],
          },
          variant_gpus: {
            create: [
              {
                gpu_id: "gpu-1",
                gpu_role: "integrated",
                is_primary: true,
              },
            ],
          },
          variant_memory_configs: {
            create: [
              expect.objectContaining({
                memory_standard_id: "memory-1",
                capacity_gb: 16,
                is_primary: true,
              }),
            ],
          },
          variant_storage_configs: {
            create: [
              expect.objectContaining({
                storage_standard_id: "storage-1",
                total_capacity_gb: 512,
                is_expandable: false,
              }),
            ],
          },
          variant_module_scores: {
            create: [
              expect.objectContaining({
                module_kind: "cpu",
                module_id: "cpu-1",
                score: 88.5,
                score_source: "manual_admin",
                score_version: "manual-admin-v1",
              }),
              expect.objectContaining({
                module_kind: "gpu",
                module_id: "gpu-1",
                score: 84,
                rationale: "Kết quả kiểm chứng nội bộ",
              }),
            ],
          },
        }),
      }),
    );
  });

  it("normalizes directly entered display, camera, and battery specifications", async () => {
    prisma.display_technologies.upsert.mockResolvedValue({
      id: "display-tech-1",
    });
    prisma.display_units.create.mockResolvedValue({ id: "display-1" });
    prisma.battery_units.create.mockResolvedValue({ id: "battery-1" });
    prisma.camera_roles.upsert.mockResolvedValue({ id: "camera-role-1" });
    prisma.camera_modules.create.mockResolvedValue({ id: "camera-1" });
    prisma.variant_camera_systems.create.mockResolvedValue({
      id: "camera-system-1",
    });
    prisma.device_variants.create.mockResolvedValue(variantA);
    prisma.device_variants.findUniqueOrThrow.mockResolvedValue({
      ...variantA,
      device_model_id: "model-1",
    });

    await service.create({
      device_model_id: "model-1",
      variant_name: "  256GB   Global  ",
      release_status_id: 1,
      physical_specs: {
        ingress_protection: "ip 68",
      },
      io_specs: {
        sim_type: "nano sim + e sim",
      },
      thermal_specs: {
        cooling_type: "vapour chamber",
      },
      inline_modules: {
        display: {
          technology: " ltpo-oled ",
          size_inch: 6.7,
          refresh_rate_hz: 120,
          aspect_ratio: "19,5 / 9",
          color_gamut: "dci p3",
          hdr_formats: "dolby vision / hdr10+",
        },
        cameras: [
          {
            role: "main",
            effective_megapixel: 50,
            aperture: "F 1,8",
            has_ois: true,
            video_capabilities: "4k60fps; 1080P@30FPS",
          },
        ],
        battery: {
          capacity_mah: 5000,
          wired_charging_w: 45,
          wired_charging_protocol: "usb-pd / pps",
          wireless_charging_protocol: "qi 2",
        },
      },
    });

    expect(prisma.display_technologies.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "ltpo-oled" },
        create: { name: "LTPO OLED", slug: "ltpo-oled" },
      }),
    );
    expect(prisma.display_units.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          display_technology_id: "display-tech-1",
          size_inch: 6.7,
          refresh_rate_hz: 120,
          aspect_ratio: "19.5:9",
          color_gamut: "DCI-P3",
          hdr_formats: "HDR10+, Dolby Vision",
        }),
      }),
    );
    expect(prisma.camera_modules.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          effective_megapixel: 50,
          aperture: "f/1.8",
          has_ois: true,
          video_capabilities: "4K 60 fps, 1080p 30 fps",
        }),
      }),
    );
    expect(prisma.battery_units.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          wired_charging_protocol: "USB PD PPS",
          wireless_charging_protocol: "Qi2",
        }),
      }),
    );
    expect(prisma.device_variants.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          variant_name: "256GB Global",
          variant_physical_specs: {
            create: expect.objectContaining({ ingress_protection: "IP68" }),
          },
          variant_io_specs: {
            create: expect.objectContaining({ sim_type: "Nano-SIM + eSIM" }),
          },
          variant_thermal_specs: {
            create: expect.objectContaining({
              cooling_type: "Vapor chamber",
            }),
          },
        }),
      }),
    );
    expect(prisma.device_variants.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          variant_displays: {
            create: [
              {
                display_unit_id: "display-1",
                display_role: "main",
                display_order: 1,
              },
            ],
          },
          variant_batteries: {
            create: [
              {
                battery_unit_id: "battery-1",
                battery_role: "main",
                is_primary: true,
              },
            ],
          },
        }),
      }),
    );
    expect(prisma.variant_camera_modules.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          camera_module_id: "camera-1",
          role: "main",
          position: "rear",
          is_primary: true,
        }),
      ],
    });
  });

  it("preserves existing module scores when unrelated variant fields change", async () => {
    prisma.device_variants.findFirst.mockResolvedValue({
      ...variantA,
      device_model_id: "model-1",
      device_variant_benchmarks: [],
    });
    prisma.device_variants.update.mockResolvedValue(variantA);

    await service.update("variant-a", {
      notes: "Cập nhật ghi chú",
    });

    expect(
      prisma.device_variants.update.mock.calls[0][0].data,
    ).not.toHaveProperty("variant_module_scores");
  });

  it("creates device scores with their benchmark environment", async () => {
    prisma.device_variants.create.mockResolvedValue(variantA);

    await service.create({
      device_model_id: "model-1",
      variant_name: "256GB Global",
      release_status_id: 1,
      performance_results: [
        {
          benchmark_id: "11111111-1111-4111-8111-111111111111",
          score: 2847,
          subscore_name: "single_core",
          os_version: "Android 16",
          app_version: "6.4.0",
          power_mode: "performance",
          ambient_temp_c: 25,
          is_thermal_throttled: false,
        },
      ],
    });

    expect(prisma.device_variants.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          device_variant_benchmarks: {
            create: [
              expect.objectContaining({
                benchmark: {
                  connect: {
                    id: "11111111-1111-4111-8111-111111111111",
                  },
                },
                score: 2847,
                subscore_name: "single_core",
                benchmark_run: {
                  create: expect.objectContaining({
                    os_version: "Android 16",
                    app_version: "6.4.0",
                    power_mode: "performance",
                    ambient_temp_c: 25,
                    is_thermal_throttled: false,
                  }),
                },
              }),
            ],
          },
        }),
      }),
    );
  });

  it("lists currencies for the detailed variant form", async () => {
    prisma.currencies.findMany.mockResolvedValue([{ id: 1, code: "USD" }]);

    await expect(service.listCurrencies()).resolves.toEqual([
      { id: 1, code: "USD" },
    ]);
  });
});
