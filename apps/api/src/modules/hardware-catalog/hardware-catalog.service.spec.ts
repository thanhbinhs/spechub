import { BadRequestException } from "@nestjs/common";
import { HardwareCatalogService } from "./hardware-catalog.service";

describe("HardwareCatalogService", () => {
  const prisma = {
    organizations: { findFirst: jest.fn() },
    cpus: { create: jest.fn(), findFirst: jest.fn() },
    chipsets: { create: jest.fn() },
  };

  let service: HardwareCatalogService;

  beforeEach(() => {
    jest.clearAllMocks();
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
        }),
      }),
    );
  });

  it("requires a manufacturer and chip kind for a chipset", async () => {
    await expect(
      service.createModule({
        kind: "chipset",
        name: "Example SoC",
        slug: "example-soc",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.chipsets.create).not.toHaveBeenCalled();
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
});
