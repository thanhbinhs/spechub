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
import { USER_ROLES, type UserRole } from "../../common/constants";
import {
  CurrentUser,
  type AuthUser,
} from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AlertsService } from "./alerts.service";
import { CreatePriceAlertDto } from "./dto/create-price-alert.dto";
import { UpdatePriceAlertDto } from "./dto/update-price-alert.dto";

@ApiTags("alerts")
@ApiBearerAuth()
@Controller("alerts")
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: "List my price alerts" })
  findMany(@CurrentUser("id") userId: string) {
    return this.alertsService.findMany(userId);
  }

  @Post()
  @ApiOperation({ summary: "Create price alert" })
  create(@CurrentUser("id") userId: string, @Body() dto: CreatePriceAlertDto) {
    return this.alertsService.create(userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update price alert" })
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePriceAlertDto,
  ) {
    return this.alertsService.update(user.id, user.role as UserRole, id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Deactivate price alert" })
  remove(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.alertsService.remove(user.id, user.role as UserRole, id);
  }

  @Post("check")
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Manually check active price alerts" })
  checkActiveAlerts() {
    return this.alertsService.checkActiveAlerts();
  }
}
