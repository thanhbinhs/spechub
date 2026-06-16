import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { CameraModulesService } from "./camera-modules.service";
import { QueryCameraModulesDto } from "./dto/query-camera-modules.dto";

@Public()
@ApiTags("camera-modules")
@Controller("camera-modules")
export class CameraModulesController {
  constructor(private readonly cameraModulesService: CameraModulesService) {}

  @Get()
  @ApiOperation({ summary: "List camera modules" })
  findMany(@Query() query: QueryCameraModulesDto) {
    return this.cameraModulesService.findMany(query);
  }

  @Get(":id/by-id")
  @ApiOperation({ summary: "Get camera module by UUID" })
  findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.cameraModulesService.findById(id);
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get camera module by slug" })
  findBySlug(@Param("slug") slug: string) {
    return this.cameraModulesService.findBySlug(slug);
  }
}
