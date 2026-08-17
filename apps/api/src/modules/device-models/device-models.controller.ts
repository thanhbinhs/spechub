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
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { USER_ROLES } from "../../common/constants";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateDeviceModelDto } from "./dto/create-device-model.dto";
import { DeviceModelResponseDto } from "./dto/device-model-response.dto";
import { QueryDeviceModelsDto } from "./dto/query-device-models.dto";
import { UpdateDeviceModelDto } from "./dto/update-device-model.dto";
import { DeviceModelsService } from "./device-models.service";

@ApiTags("device-models")
@Controller("device-models")
export class DeviceModelsController {
  constructor(private readonly deviceModelsService: DeviceModelsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "List device models" })
  @ApiResponse({ status: 200, type: DeviceModelResponseDto, isArray: true })
  findMany(@Query() query: QueryDeviceModelsDto) {
    return this.deviceModelsService.findMany(query);
  }

  @Public()
  @Get("release-statuses")
  @ApiOperation({ summary: "List device release statuses" })
  listReleaseStatuses() {
    return this.deviceModelsService.listReleaseStatuses();
  }

  @Public()
  @Get(":id/by-id")
  @ApiOperation({ summary: "Get device model by UUID" })
  @ApiResponse({ status: 200, type: DeviceModelResponseDto })
  @ApiResponse({ status: 404, description: "Device model not found" })
  findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.deviceModelsService.findById(id);
  }

  @Public()
  @Get(":slug")
  @ApiOperation({ summary: "Get device model by slug" })
  @ApiResponse({ status: 200, type: DeviceModelResponseDto })
  @ApiResponse({ status: 404, description: "Device model not found" })
  findBySlug(@Param("slug") slug: string) {
    return this.deviceModelsService.findBySlug(slug);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Create device model" })
  create(@Body() dto: CreateDeviceModelDto, @CurrentUser("id") userId: string) {
    return this.deviceModelsService.create(dto, userId);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Update device model" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeviceModelDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.deviceModelsService.update(id, dto, userId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Soft-delete device model" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.deviceModelsService.remove(id);
  }
}
