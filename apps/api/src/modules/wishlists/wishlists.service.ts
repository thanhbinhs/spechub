import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@spechub/database";
import { USER_ROLES, type UserRole } from "../../common/constants";
import { PrismaService } from "../../prisma/prisma.service";
import { AddWishlistItemDto } from "./dto/add-wishlist-item.dto";
import { CreateWishlistDto } from "./dto/create-wishlist.dto";
import { SyncResearchWorkspaceDto } from "./dto/sync-research-workspace.dto";
import { UpdateWishlistDto } from "./dto/update-wishlist.dto";

const DEFAULT_WISHLIST_NAME = "Default";
const COMPARE_WISHLIST_NAME = "__SpecHub Research Compare__";

const WISHLIST_SELECT = {
  id: true,
  user_id: true,
  name: true,
  is_public: true,
  created_at: true,
  items: {
    select: {
      id: true,
      wishlist_id: true,
      device_variant_id: true,
      notes: true,
      added_at: true,
      device_variant: {
        select: {
          id: true,
          variant_name: true,
          sku_code: true,
          market_name: true,
          color_name: true,
          color_hex: true,
          launch_price: true,
          currency: {
            select: {
              id: true,
              code: true,
              symbol: true,
              decimal_digits: true,
            },
          },
          device_model: {
            select: {
              id: true,
              name: true,
              slug: true,
              cover_image_url: true,
              product_family: {
                select: {
                  brand_org: {
                    select: {
                      name: true,
                      short_name: true,
                      slug: true,
                    },
                  },
                  device_category: {
                    select: { id: true, name: true, slug: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ added_at: "desc" as const }],
  },
  _count: {
    select: {
      items: true,
    },
  },
} satisfies Prisma.wishlistsSelect;

const WISHLIST_ITEM_SELECT = {
  id: true,
  wishlist_id: true,
  device_variant_id: true,
  notes: true,
  added_at: true,
  device_variant: WISHLIST_SELECT.items.select.device_variant,
} satisfies Prisma.wishlist_itemsSelect;

export type WishlistItem = Prisma.wishlistsGetPayload<{
  select: typeof WISHLIST_SELECT;
}>;

export type WishlistEntry = Prisma.wishlist_itemsGetPayload<{
  select: typeof WISHLIST_ITEM_SELECT;
}>;

@Injectable()
export class WishlistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(userId: string): Promise<{ data: WishlistItem[] }> {
    const wishlists = await this.prisma.wishlists.findMany({
      where: { user_id: userId, name: { not: COMPARE_WISHLIST_NAME } },
      select: WISHLIST_SELECT,
      orderBy: [{ created_at: "asc" }],
    });

    return { data: wishlists };
  }

  async create(userId: string, dto: CreateWishlistDto): Promise<WishlistItem> {
    return this.prisma.wishlists.create({
      data: {
        user_id: userId,
        name: dto.name?.trim() || "Default",
        is_public: dto.is_public ?? false,
      },
      select: WISHLIST_SELECT,
    });
  }

  async update(
    userId: string,
    role: UserRole,
    id: string,
    dto: UpdateWishlistDto,
  ): Promise<WishlistItem> {
    await this.ensureWritable(userId, role, id);

    return this.prisma.wishlists.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() || "Default" }),
        ...(dto.is_public !== undefined && { is_public: dto.is_public }),
      },
      select: WISHLIST_SELECT,
    });
  }

  async remove(userId: string, role: UserRole, id: string) {
    await this.ensureWritable(userId, role, id);

    await this.prisma.$transaction([
      this.prisma.wishlist_items.deleteMany({ where: { wishlist_id: id } }),
      this.prisma.wishlists.delete({ where: { id } }),
    ]);

    return { data: { id, deleted: true } };
  }

  async addItem(
    userId: string,
    role: UserRole,
    wishlistId: string,
    dto: AddWishlistItemDto,
  ): Promise<WishlistEntry> {
    await this.ensureWritable(userId, role, wishlistId);
    await this.ensureVariant(dto.device_variant_id);

    return this.prisma.wishlist_items.upsert({
      where: {
        wishlist_id_device_variant_id: {
          wishlist_id: wishlistId,
          device_variant_id: dto.device_variant_id,
        },
      },
      update: {
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      create: {
        wishlist_id: wishlistId,
        device_variant_id: dto.device_variant_id,
        notes: dto.notes,
      },
      select: WISHLIST_ITEM_SELECT,
    });
  }

  async addDefaultItem(
    userId: string,
    dto: AddWishlistItemDto,
  ): Promise<WishlistEntry> {
    await this.ensureVariant(dto.device_variant_id);
    const wishlist = await this.findOrCreateDefaultWishlist(userId);
    return this.addItem(userId, USER_ROLES.READER, wishlist.id, dto);
  }

  async syncWorkspace(userId: string, dto: SyncResearchWorkspaceDto) {
    const savedItems = uniqueSavedItems(dto.saved_items ?? []);
    const compareVariantIds = [...new Set(dto.compare_variant_ids ?? [])].slice(
      0,
      2,
    );
    const variantIds = [
      ...new Set([
        ...savedItems.map((item) => item.device_variant_id),
        ...compareVariantIds,
      ]),
    ];
    await this.ensureVariants(variantIds);

    const [savedWishlist, compareWishlist] = await Promise.all([
      this.findOrCreateWishlist(userId, DEFAULT_WISHLIST_NAME),
      this.findOrCreateWishlist(userId, COMPARE_WISHLIST_NAME),
    ]);

    if (dto.mode === "replace") {
      await Promise.all([
        this.prisma.wishlist_items.deleteMany({
          where: {
            wishlist_id: savedWishlist.id,
            ...(savedItems.length
              ? {
                  device_variant_id: {
                    notIn: savedItems.map((item) => item.device_variant_id),
                  },
                }
              : {}),
          },
        }),
        this.prisma.wishlist_items.deleteMany({
          where: {
            wishlist_id: compareWishlist.id,
            ...(compareVariantIds.length
              ? { device_variant_id: { notIn: compareVariantIds } }
              : {}),
          },
        }),
      ]);
    }

    await Promise.all([
      ...savedItems.map((item) =>
        this.prisma.wishlist_items.upsert({
          where: {
            wishlist_id_device_variant_id: {
              wishlist_id: savedWishlist.id,
              device_variant_id: item.device_variant_id,
            },
          },
          update:
            dto.mode === "replace" || cleanNotes(item.notes)
              ? { notes: cleanNotes(item.notes) }
              : {},
          create: {
            wishlist_id: savedWishlist.id,
            device_variant_id: item.device_variant_id,
            notes: cleanNotes(item.notes),
          },
          select: { id: true },
        }),
      ),
      ...compareVariantIds.map((deviceVariantId) =>
        this.prisma.wishlist_items.upsert({
          where: {
            wishlist_id_device_variant_id: {
              wishlist_id: compareWishlist.id,
              device_variant_id: deviceVariantId,
            },
          },
          update: {},
          create: {
            wishlist_id: compareWishlist.id,
            device_variant_id: deviceVariantId,
          },
          select: { id: true },
        }),
      ),
    ]);

    const [saved, compare] = await Promise.all([
      this.prisma.wishlists.findUnique({
        where: { id: savedWishlist.id },
        select: WISHLIST_SELECT,
      }),
      this.prisma.wishlists.findUnique({
        where: { id: compareWishlist.id },
        select: WISHLIST_SELECT,
      }),
    ]);

    return {
      data: {
        saved_items: saved?.items ?? [],
        compare_items: compare?.items ?? [],
        synced_at: new Date().toISOString(),
      },
      meta: { mode: dto.mode },
    };
  }

  async removeItem(
    userId: string,
    role: UserRole,
    wishlistId: string,
    itemId: string,
  ) {
    await this.ensureWritable(userId, role, wishlistId);
    const item = await this.prisma.wishlist_items.findFirst({
      where: { id: itemId, wishlist_id: wishlistId },
      select: { id: true },
    });

    if (!item) {
      throw new NotFoundException(`Wishlist item ${itemId} not found`);
    }

    await this.prisma.wishlist_items.delete({ where: { id: itemId } });
    return { data: { id: itemId, deleted: true } };
  }

  private async findOrCreateDefaultWishlist(userId: string) {
    const existing = await this.prisma.wishlists.findFirst({
      where: { user_id: userId, name: DEFAULT_WISHLIST_NAME },
      select: { id: true },
    });

    if (existing) return existing;

    return this.prisma.wishlists.create({
      data: { user_id: userId, name: DEFAULT_WISHLIST_NAME },
      select: { id: true },
    });
  }

  private async findOrCreateWishlist(userId: string, name: string) {
    const existing = await this.prisma.wishlists.findFirst({
      where: { user_id: userId, name },
      select: { id: true },
    });
    if (existing) return existing;
    return this.prisma.wishlists.create({
      data: { user_id: userId, name },
      select: { id: true },
    });
  }

  private async ensureWritable(
    userId: string,
    role: UserRole,
    wishlistId: string,
  ) {
    const wishlist = await this.prisma.wishlists.findUnique({
      where: { id: wishlistId },
      select: { id: true, user_id: true },
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist ${wishlistId} not found`);
    }

    if (wishlist.user_id !== userId && role !== USER_ROLES.ADMIN) {
      throw new ForbiddenException("You do not own this wishlist");
    }
  }

  private async ensureVariant(deviceVariantId: string) {
    const variant = await this.prisma.device_variants.findFirst({
      where: { id: deviceVariantId, deleted_at: null },
      select: { id: true },
    });

    if (!variant) {
      throw new NotFoundException(
        `Device variant ${deviceVariantId} not found`,
      );
    }
  }

  private async ensureVariants(deviceVariantIds: string[]) {
    if (!deviceVariantIds.length) return;
    const variants = await this.prisma.device_variants.findMany({
      where: { id: { in: deviceVariantIds }, deleted_at: null },
      select: { id: true },
    });
    if (variants.length !== deviceVariantIds.length) {
      throw new BadRequestException(
        "Workspace contains one or more unavailable device variants",
      );
    }
  }
}

function uniqueSavedItems(items: SyncResearchWorkspaceDto["saved_items"] = []) {
  return [
    ...new Map(items.map((item) => [item.device_variant_id, item])).values(),
  ];
}

function cleanNotes(notes: string | undefined) {
  const value = notes?.trim();
  return value || null;
}
