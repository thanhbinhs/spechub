import { SearchService } from "./search.service";

describe("SearchService", () => {
  const prisma = {
    device_models: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };
  const config = {
    get: jest.fn((_key: string, fallback?: string) => fallback),
  };

  let service: SearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SearchService(prisma as any, config as any);
    prisma.device_models.findMany.mockResolvedValue([]);
    prisma.device_models.count.mockResolvedValue(0);
  });

  it("finds device models through their chipset, CPU, or GPU", async () => {
    await service.search({ q: "Snapdragon 8 Elite" } as any);

    expect(prisma.device_models.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            {
              device_variants: {
                some: {
                  deleted_at: null,
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
                    {
                      variant_cpus: {
                        some: {
                          cpu: {
                            name: {
                              contains: "Snapdragon 8 Elite",
                              mode: "insensitive",
                            },
                          },
                        },
                      },
                    },
                    {
                      variant_gpus: {
                        some: {
                          gpu: {
                            name: {
                              contains: "Snapdragon 8 Elite",
                              mode: "insensitive",
                            },
                          },
                        },
                      },
                    },
                  ]),
                },
              },
            },
          ]),
        }),
      }),
    );
  });
});
