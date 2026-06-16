import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { BatteryUnitsService } from "./battery-units.service";
import { QueryBatteryUnitsDto } from "./dto/query-battery-units.dto";

@Public()
@ApiTags("battery-units")
@Controller("battery-units")
export class BatteryUnitsController {
  constructor(private readonly batteryUnitsService: BatteryUnitsService) {}

  @Get()
  @ApiOperation({ summary: "List battery units" })
  findMany(@Query() query: QueryBatteryUnitsDto) {
    return this.batteryUnitsService.findMany(query);
  }

  @Get(":id/by-id")
  @ApiOperation({ summary: "Get battery unit by UUID" })
  findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.batteryUnitsService.findById(id);
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get battery unit by slug" })
  findBySlug(@Param("slug") slug: string) {
    return this.batteryUnitsService.findBySlug(slug);
  }
}
