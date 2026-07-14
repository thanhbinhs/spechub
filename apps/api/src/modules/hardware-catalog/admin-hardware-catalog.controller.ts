import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { USER_ROLES } from "../../common/constants";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateHardwareModuleDto } from "./dto/create-hardware-module.dto";
import { HardwareCatalogService } from "./hardware-catalog.service";

@ApiTags("admin-hardware-catalog")
@ApiBearerAuth()
@Controller("admin/hardware")
export class AdminHardwareCatalogController {
  constructor(
    private readonly hardwareCatalogService: HardwareCatalogService,
  ) {}

  @Post("modules")
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: "Admin: create a core hardware module" })
  createModule(@Body() dto: CreateHardwareModuleDto) {
    return this.hardwareCatalogService.createModule(dto);
  }
}
