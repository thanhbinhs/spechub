import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { USER_ROLES } from "../../common/constants";
import {
  CurrentUser,
  type AuthUser,
} from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { OptionalJwtAuthGuard } from "../../common/guards/optional-jwt-auth.guard";
import { AffiliateService } from "./affiliate.service";
import {
  CreateAffiliateLinkDto,
  QueryAffiliateLinksDto,
} from "./dto/create-affiliate-link.dto";
import { CreateAffiliatePartnerDto } from "./dto/create-affiliate-partner.dto";
import { TrackAffiliateClickDto } from "./dto/track-affiliate-click.dto";
import { UpdateAffiliateLinkDto } from "./dto/update-affiliate-link.dto";
import { UpdateAffiliatePartnerDto } from "./dto/update-affiliate-partner.dto";

@ApiTags("affiliate")
@Controller("affiliate")
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Public()
  @Get("partners")
  @ApiOperation({ summary: "List affiliate partners" })
  listPartners() {
    return this.affiliateService.listPartners();
  }

  @Post("partners")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Create affiliate partner" })
  createPartner(@Body() dto: CreateAffiliatePartnerDto) {
    return this.affiliateService.createPartner(dto);
  }

  @Patch("partners/:id")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Update affiliate partner" })
  updatePartner(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAffiliatePartnerDto,
  ) {
    return this.affiliateService.updatePartner(id, dto);
  }

  @Public()
  @Get("links")
  @ApiOperation({ summary: "List affiliate buy links" })
  listLinks(@Query() query: QueryAffiliateLinksDto) {
    return this.affiliateService.listLinks(query);
  }

  @Post("links/sync")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Refresh prices for active marketplace links" })
  syncAllLinks() {
    return this.affiliateService.syncAllLinks();
  }

  @Post("links/:id/sync")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({
    summary: "Refresh one marketplace price from API or JSON-LD",
  })
  syncLink(@Param("id", ParseUUIDPipe) id: string) {
    return this.affiliateService.syncLink(id);
  }

  @Public()
  @Get("links/:id")
  @ApiOperation({ summary: "Get affiliate buy link" })
  findLink(@Param("id", ParseUUIDPipe) id: string) {
    return this.affiliateService.findLink(id);
  }

  @Post("links")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Create affiliate buy link" })
  createLink(@Body() dto: CreateAffiliateLinkDto) {
    return this.affiliateService.createLink(dto);
  }

  @Patch("links/:id")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Update affiliate buy link" })
  updateLink(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAffiliateLinkDto,
  ) {
    return this.affiliateService.updateLink(id, dto);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post("links/:id/click")
  @ApiOperation({ summary: "Track affiliate click" })
  trackClick(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TrackAffiliateClickDto,
    @Req() req: FastifyRequest & { user?: AuthUser },
    @CurrentUser() user?: AuthUser,
  ) {
    return this.affiliateService.trackClick(id, dto, {
      userId: user?.id ?? req.user?.id,
      ipAddress: req.ip,
      userAgent: this.headerValue(req.headers["user-agent"]),
      referrer: this.headerValue(req.headers.referer),
    });
  }

  private headerValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
  }
}
