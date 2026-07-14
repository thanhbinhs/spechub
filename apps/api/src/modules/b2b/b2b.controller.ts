import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { ApiKeyAuthGuard } from "../api-keys/api-key-auth.guard";
import { DeviceModelsService } from "../device-models/device-models.service";
import { QueryDeviceModelsDto } from "../device-models/dto/query-device-models.dto";
import { DeviceVariantsService } from "../device-variants/device-variants.service";

@ApiTags("b2b")
@ApiSecurity("x-api-key")
@Public()
@UseGuards(ApiKeyAuthGuard)
@Controller("b2b")
export class B2bController {
  constructor(
    private readonly deviceModelsService: DeviceModelsService,
    private readonly deviceVariantsService: DeviceVariantsService,
  ) {}

  @Get("device-models")
  @ApiOperation({ summary: "B2B catalog: list device models" })
  listDeviceModels(@Query() query: QueryDeviceModelsDto) {
    return this.deviceModelsService.findMany(query);
  }

  @Get("device-models/:slug")
  @ApiOperation({ summary: "B2B catalog: get a device model" })
  getDeviceModel(@Param("slug") slug: string) {
    return this.deviceModelsService.findBySlug(slug);
  }

  @Get("device-variants/:id")
  @ApiOperation({ summary: "B2B catalog: get a device variant" })
  getDeviceVariant(@Param("id", ParseUUIDPipe) id: string) {
    return this.deviceVariantsService.findById(id);
  }
}
