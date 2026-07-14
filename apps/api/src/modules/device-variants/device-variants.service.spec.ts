import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DeviceVariantsService } from "./device-variants.service";

describe("DeviceVariantsService", () => {
  const variantA = { id: "variant-a", variant_name: "256GB Natural Titanium" };
  const variantB = { id: "variant-b", variant_name: "512GB Black Titanium" };

  const prisma = {
    device_variants: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    currencies: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };

  let service: DeviceVariantsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DeviceVariantsService(prisma as any);
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

  it("compares variants while preserving requested order", async () => {
    prisma.device_variants.findMany.mockResolvedValue([variantB, variantA]);

    await expect(service.compare(["variant-a", "variant-b"])).resolves.toEqual({
      data: [variantA, variantB],
    });
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
    ).resolves.toBe(variantA);

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
            create: { cooling_type: "vapor_chamber", vc_area_mm2: 4000 },
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
