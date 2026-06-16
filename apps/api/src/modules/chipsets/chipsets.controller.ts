import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { ChipsetsService } from "./chipsets.service";
import { ChipsetResponseDto } from "./dto/chipset-response.dto";
import { QueryChipsetsDto } from "./dto/query-chipsets.dto";

@Public()
@ApiTags("chipsets")
@Controller("chipsets")
export class ChipsetsController {
  constructor(private readonly chipsetsService: ChipsetsService) {}

  @Get()
  @ApiOperation({ summary: "List chipsets" })
  @ApiResponse({ status: 200, type: ChipsetResponseDto, isArray: true })
  findMany(@Query() query: QueryChipsetsDto) {
    return this.chipsetsService.findMany(query);
  }

  @Get(":id/by-id")
  @ApiOperation({ summary: "Get chipset by UUID" })
  @ApiResponse({ status: 200, type: ChipsetResponseDto })
  @ApiResponse({ status: 404, description: "Chipset not found" })
  findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.chipsetsService.findById(id);
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get chipset by slug" })
  @ApiResponse({ status: 200, type: ChipsetResponseDto })
  @ApiResponse({ status: 404, description: "Chipset not found" })
  findBySlug(@Param("slug") slug: string) {
    return this.chipsetsService.findBySlug(slug);
  }
}
