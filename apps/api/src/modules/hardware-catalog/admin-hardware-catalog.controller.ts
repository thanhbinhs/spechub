import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { USER_ROLES } from "../../common/constants";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateHardwareModuleDto } from "./dto/create-hardware-module.dto";
import {
  CreateOperatingSystemVersionDto,
  CreateOsUiLayerVersionDto,
} from "./dto/create-software-catalog.dto";
import { UpdateHardwareModuleDto } from "./dto/update-hardware-module.dto";
import { HardwareCatalogService } from "./hardware-catalog.service";

@ApiTags("admin-hardware-catalog")
@ApiBearerAuth()
@Controller("admin/hardware")
export class AdminHardwareCatalogController {
  constructor(
    private readonly hardwareCatalogService: HardwareCatalogService,
  ) {}

  @Get("benchmarks/:targetType")
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "List benchmark definitions for a hardware target" })
  listBenchmarks(@Param("targetType") targetType: string) {
    return this.hardwareCatalogService.listBenchmarks(targetType);
  }

  @Post("modules")
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: "Admin: create a core hardware module" })
  createModule(@Body() dto: CreateHardwareModuleDto) {
    return this.hardwareCatalogService.createModule(dto);
  }

  @Post("operating-system-versions")
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Create an operating system release" })
  createOperatingSystemVersion(@Body() dto: CreateOperatingSystemVersionDto) {
    return this.hardwareCatalogService.createOperatingSystemVersion(dto);
  }

  @Post("os-ui-layer-versions")
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Create an operating system UI layer release" })
  createOsUiLayerVersion(@Body() dto: CreateOsUiLayerVersionDto) {
    return this.hardwareCatalogService.createOsUiLayerVersion(dto);
  }

  @Patch("modules/:kind/:id")
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: "Admin: update a core hardware module" })
  updateModule(
    @Param("kind") kind: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateHardwareModuleDto,
  ) {
    return this.hardwareCatalogService.updateModule(kind, id, dto);
  }

  @Delete("modules/:kind/:id")
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: "Admin: delete an unused core hardware module" })
  removeModule(
    @Param("kind") kind: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.hardwareCatalogService.removeModule(kind, id);
  }
}
