import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { HardwareCatalogQueryDto } from "./dto/hardware-catalog-query.dto";
import { HardwareCatalogService } from "./hardware-catalog.service";

@Public()
@ApiTags("hardware-catalog")
@Controller("hardware")
export class HardwareCatalogController {
  constructor(
    private readonly hardwareCatalogService: HardwareCatalogService,
  ) {}

  @Get("cpus")
  @ApiOperation({ summary: "List CPU modules" })
  listCpus(@Query() query: HardwareCatalogQueryDto) {
    return this.hardwareCatalogService.listCpus(query);
  }

  @Get("gpus")
  @ApiOperation({ summary: "List GPU modules" })
  listGpus(@Query() query: HardwareCatalogQueryDto) {
    return this.hardwareCatalogService.listGpus(query);
  }

  @Get("npus")
  @ApiOperation({ summary: "List NPU modules" })
  listNpus(@Query() query: HardwareCatalogQueryDto) {
    return this.hardwareCatalogService.listNpus(query);
  }

  @Get("modems")
  @ApiOperation({ summary: "List modem modules" })
  listModems(@Query() query: HardwareCatalogQueryDto) {
    return this.hardwareCatalogService.listModems(query);
  }

  @Get("memory-standards")
  @ApiOperation({ summary: "List RAM and memory standards" })
  listMemoryStandards(@Query() query: HardwareCatalogQueryDto) {
    return this.hardwareCatalogService.listMemoryStandards(query);
  }

  @Get("storage-standards")
  @ApiOperation({ summary: "List storage standards" })
  listStorageStandards(@Query() query: HardwareCatalogQueryDto) {
    return this.hardwareCatalogService.listStorageStandards(query);
  }

  @Get("operating-systems")
  @ApiOperation({ summary: "List operating systems" })
  listOperatingSystems(@Query() query: HardwareCatalogQueryDto) {
    return this.hardwareCatalogService.listOperatingSystems(query);
  }

  @Get("operating-system-versions")
  @ApiOperation({ summary: "List concrete operating system versions" })
  listOperatingSystemVersions(@Query() query: HardwareCatalogQueryDto) {
    return this.hardwareCatalogService.listOperatingSystemVersions(query);
  }

  @Get("os-ui-layers")
  @ApiOperation({ summary: "List operating system UI layers" })
  listOsUiLayers(@Query() query: HardwareCatalogQueryDto) {
    return this.hardwareCatalogService.listOsUiLayers(query);
  }

  @Get("os-ui-layer-versions")
  @ApiOperation({ summary: "List operating system UI layer versions" })
  listOsUiLayerVersions(@Query() query: HardwareCatalogQueryDto) {
    return this.hardwareCatalogService.listOsUiLayerVersions(query);
  }

  @Get(":kind/:slug")
  @ApiOperation({ summary: "Get a hardware module and devices using it" })
  findByKindAndSlug(@Param("kind") kind: string, @Param("slug") slug: string) {
    return this.hardwareCatalogService.findByKindAndSlug(kind, slug);
  }
}
