import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { UserRole } from "../../common/constants";
import {
  CurrentUser,
  type AuthUser,
} from "../../common/decorators/current-user.decorator";
import { AddWishlistItemDto } from "./dto/add-wishlist-item.dto";
import { CreateWishlistDto } from "./dto/create-wishlist.dto";
import { SyncResearchWorkspaceDto } from "./dto/sync-research-workspace.dto";
import { UpdateWishlistDto } from "./dto/update-wishlist.dto";
import { WishlistsService } from "./wishlists.service";

@ApiTags("wishlists")
@ApiBearerAuth()
@Controller("wishlists")
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  @ApiOperation({ summary: "List my wishlists" })
  findMany(@CurrentUser("id") userId: string) {
    return this.wishlistsService.findMany(userId);
  }

  @Post()
  @ApiOperation({ summary: "Create wishlist" })
  create(@CurrentUser("id") userId: string, @Body() dto: CreateWishlistDto) {
    return this.wishlistsService.create(userId, dto);
  }

  @Post("workspace/sync")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Merge or replace the signed-in research workspace",
  })
  syncWorkspace(
    @CurrentUser("id") userId: string,
    @Body() dto: SyncResearchWorkspaceDto,
  ) {
    return this.wishlistsService.syncWorkspace(userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update wishlist" })
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateWishlistDto,
  ) {
    return this.wishlistsService.update(
      user.id,
      user.role as UserRole,
      id,
      dto,
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete wishlist" })
  remove(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.wishlistsService.remove(user.id, user.role as UserRole, id);
  }

  @Post("default/items")
  @ApiOperation({ summary: "Add item to default wishlist" })
  addDefaultItem(
    @CurrentUser("id") userId: string,
    @Body() dto: AddWishlistItemDto,
  ) {
    return this.wishlistsService.addDefaultItem(userId, dto);
  }

  @Post(":id/items")
  @ApiOperation({ summary: "Add item to wishlist" })
  addItem(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddWishlistItemDto,
  ) {
    return this.wishlistsService.addItem(
      user.id,
      user.role as UserRole,
      id,
      dto,
    );
  }

  @Delete(":id/items/:itemId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove item from wishlist" })
  removeItem(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("itemId", ParseUUIDPipe) itemId: string,
  ) {
    return this.wishlistsService.removeItem(
      user.id,
      user.role as UserRole,
      id,
      itemId,
    );
  }
}
