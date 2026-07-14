import { ForbiddenException, NotFoundException } from "@nestjs/common";
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
});
