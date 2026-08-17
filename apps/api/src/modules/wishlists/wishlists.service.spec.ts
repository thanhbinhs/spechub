import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { USER_ROLES } from "../../common/constants";
import { WishlistsService } from "./wishlists.service";

describe("WishlistsService", () => {
  const wishlist = {
    id: "wishlist-1",
    user_id: "user-1",
    name: "Default",
    is_public: false,
  };
  const wishlistItem = {
    id: "item-1",
    wishlist_id: "wishlist-1",
    device_variant_id: "variant-1",
    notes: "Watching this",
  };

  const prisma = {
    wishlists: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    wishlist_items: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    device_variants: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };

  let service: WishlistsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WishlistsService(prisma as any);
  });

  it("adds a variant to the user's default wishlist", async () => {
    prisma.device_variants.findFirst.mockResolvedValue({ id: "variant-1" });
    prisma.wishlists.findFirst.mockResolvedValue(null);
    prisma.wishlists.create.mockResolvedValue({ id: "wishlist-1" });
    prisma.wishlists.findUnique.mockResolvedValue(wishlist);
    prisma.wishlist_items.upsert.mockResolvedValue(wishlistItem);

    await expect(
      service.addDefaultItem("user-1", {
        device_variant_id: "variant-1",
        notes: "Watching this",
      }),
    ).resolves.toBe(wishlistItem);

    expect(prisma.wishlists.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { user_id: "user-1", name: "Default" },
      }),
    );
    expect(prisma.wishlist_items.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          wishlist_id_device_variant_id: {
            wishlist_id: "wishlist-1",
            device_variant_id: "variant-1",
          },
        },
      }),
    );
  });

  it("blocks updates from non-owners", async () => {
    prisma.wishlists.findUnique.mockResolvedValue({
      id: "wishlist-1",
      user_id: "owner-1",
    });

    await expect(
      service.update("user-2", USER_ROLES.READER, "wishlist-1", {
        name: "New name",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("throws when adding a missing variant", async () => {
    prisma.device_variants.findFirst.mockResolvedValue(null);

    await expect(
      service.addDefaultItem("user-1", {
        device_variant_id: "missing",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("merges the local research workspace without deleting cloud items", async () => {
    prisma.device_variants.findMany.mockResolvedValue([
      { id: "11111111-1111-4111-8111-111111111111" },
      { id: "22222222-2222-4222-8222-222222222222" },
    ]);
    prisma.wishlists.findFirst
      .mockResolvedValueOnce({ id: "saved-list" })
      .mockResolvedValueOnce({ id: "compare-list" });
    prisma.wishlist_items.upsert.mockResolvedValue({ id: "item" });
    prisma.wishlists.findUnique
      .mockResolvedValueOnce({ items: [{ id: "saved-item" }] })
      .mockResolvedValueOnce({ items: [{ id: "compare-item" }] });

    const result = await service.syncWorkspace("user-1", {
      mode: "merge",
      saved_items: [
        {
          device_variant_id: "11111111-1111-4111-8111-111111111111",
          notes: "  Check battery life  ",
        },
      ],
      compare_variant_ids: ["22222222-2222-4222-8222-222222222222"],
    });

    expect(prisma.wishlist_items.deleteMany).not.toHaveBeenCalled();
    expect(prisma.wishlist_items.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.wishlist_items.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { notes: "Check battery life" },
      }),
    );
    expect(result.data.saved_items).toEqual([{ id: "saved-item" }]);
    expect(result.data.compare_items).toEqual([{ id: "compare-item" }]);
  });

  it("replaces an empty local workspace after initial synchronization", async () => {
    prisma.wishlists.findFirst
      .mockResolvedValueOnce({ id: "saved-list" })
      .mockResolvedValueOnce({ id: "compare-list" });
    prisma.wishlists.findUnique
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [] });

    await service.syncWorkspace("user-1", {
      mode: "replace",
      saved_items: [],
      compare_variant_ids: [],
    });

    expect(prisma.wishlist_items.deleteMany).toHaveBeenNthCalledWith(1, {
      where: { wishlist_id: "saved-list" },
    });
    expect(prisma.wishlist_items.deleteMany).toHaveBeenNthCalledWith(2, {
      where: { wishlist_id: "compare-list" },
    });
  });

  it("rejects workspace entries that no longer exist in the catalog", async () => {
    prisma.device_variants.findMany.mockResolvedValue([]);

    await expect(
      service.syncWorkspace("user-1", {
        mode: "merge",
        saved_items: [
          {
            device_variant_id: "11111111-1111-4111-8111-111111111111",
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
