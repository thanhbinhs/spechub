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
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CompareDeviceVariantsDto } from "./dto/compare-device-variants.dto";
import { CreateDeviceVariantDto } from "./dto/create-device-variant.dto";
import { DeviceVariantResponseDto } from "./dto/device-variant-response.dto";
import { QueryDeviceVariantsDto } from "./dto/query-device-variants.dto";
import { UpdateDeviceVariantDto } from "./dto/update-device-variant.dto";
import { DeviceVariantsService } from "./device-variants.service";

@ApiTags("device-variants")
@Controller("device-variants")
export class DeviceVariantsController {
  constructor(private readonly deviceVariantsService: DeviceVariantsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "List device variants" })
  @ApiResponse({ status: 200, type: DeviceVariantResponseDto, isArray: true })
  findMany(@Query() query: QueryDeviceVariantsDto) {
    return this.deviceVariantsService.findMany(query);
  }

  @Public()
  @Get("currencies")
  @ApiOperation({ summary: "List currencies for device variants" })
  listCurrencies() {
    return this.deviceVariantsService.listCurrencies();
  }

  @Public()
  @Get("benchmarks")
  @ApiOperation({ summary: "List benchmark definitions for performance input" })
  listBenchmarks() {
    return this.deviceVariantsService.listBenchmarks();
  }

  @Public()
  @Get("compare")
  @ApiOperation({ summary: "Compare 2 to 4 device variants" })
  @ApiResponse({ status: 200, type: DeviceVariantResponseDto, isArray: true })
  compare(@Query() query: CompareDeviceVariantsDto) {
    return this.deviceVariantsService.compare(query.ids);
  }

  @Public()
  @Get(":id/by-id")
  @ApiOperation({ summary: "Get device variant by UUID" })
  @ApiResponse({ status: 200, type: DeviceVariantResponseDto })
  @ApiResponse({ status: 404, description: "Device variant not found" })
  findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.deviceVariantsService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Create device variant" })
  create(@Body() dto: CreateDeviceVariantDto) {
    return this.deviceVariantsService.create(dto);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Update device variant" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeviceVariantDto,
  ) {
    return this.deviceVariantsService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Soft-delete device variant" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.deviceVariantsService.remove(id);
  }
}
