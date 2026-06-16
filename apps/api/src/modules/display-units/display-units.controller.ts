import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { DisplayUnitsService } from "./display-units.service";
import { QueryDisplayUnitsDto } from "./dto/query-display-units.dto";

@Public()
@ApiTags("display-units")
@Controller("display-units")
export class DisplayUnitsController {
  constructor(private readonly displayUnitsService: DisplayUnitsService) {}

  @Get()
  @ApiOperation({ summary: "List display units" })
  findMany(@Query() query: QueryDisplayUnitsDto) {
    return this.displayUnitsService.findMany(query);
  }

  @Get(":id/by-id")
  @ApiOperation({ summary: "Get display unit by UUID" })
  findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.displayUnitsService.findById(id);
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get display unit by slug" })
  findBySlug(@Param("slug") slug: string) {
    return this.displayUnitsService.findBySlug(slug);
  }
}
