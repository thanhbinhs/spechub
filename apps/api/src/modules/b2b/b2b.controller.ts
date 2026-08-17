import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../../common/decorators/public.decorator";
import { ApiKeyAuthGuard } from "../api-keys/api-key-auth.guard";
import { DeviceModelsService } from "../device-models/device-models.service";
import { QueryDeviceModelsDto } from "../device-models/dto/query-device-models.dto";
import { DeviceVariantsService } from "../device-variants/device-variants.service";
import { QueryDeviceVariantsDto } from "../device-variants/dto/query-device-variants.dto";
import {
  QueryB2bCatalogChangesDto,
  ResolveB2bCatalogRecordsDto,
} from "./dto/b2b-catalog.dto";
import { B2bService } from "./b2b.service";

@ApiTags("b2b")
@ApiSecurity("x-api-key")
@Public()
@SkipThrottle()
@UseGuards(ApiKeyAuthGuard)
@Controller("b2b")
export class B2bController {
  constructor(
    private readonly deviceModelsService: DeviceModelsService,
    private readonly deviceVariantsService: DeviceVariantsService,
    private readonly b2bService: B2bService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "B2B catalog contract and synchronization capabilities",
  })
  getCatalogInfo() {
    return this.b2bService.getCatalogInfo();
  }

  @Get("catalog/changes")
  @ApiOperation({
    summary: "Read a cursor-based B2B catalog change feed, including tombstones",
  })
  listChanges(@Query() query: QueryB2bCatalogChangesDto) {
    return this.b2bService.listChanges(query);
  }

  @Post("catalog/records")
  @ApiBody({ type: ResolveB2bCatalogRecordsDto })
  @ApiOperation({
    summary: "Resolve up to 50 B2B catalog records after reading change events",
  })
  resolveRecords(@Body() dto: ResolveB2bCatalogRecordsDto) {
    return this.b2bService.resolveRecords(dto);
  }

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

  @Get("device-variants")
  @ApiOperation({ summary: "B2B catalog: list device variants" })
  listDeviceVariants(@Query() query: QueryDeviceVariantsDto) {
    return this.deviceVariantsService.findMany(query);
  }

  @Get("device-variants/:id")
  @ApiOperation({ summary: "B2B catalog: get a device variant" })
  getDeviceVariant(@Param("id", ParseUUIDPipe) id: string) {
    return this.deviceVariantsService.findById(id);
  }
}
