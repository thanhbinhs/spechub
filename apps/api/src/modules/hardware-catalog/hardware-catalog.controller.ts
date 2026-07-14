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

  @Get("wireless-standards")
  @ApiOperation({ summary: "List wireless standards" })
  listWirelessStandards(@Query() query: HardwareCatalogQueryDto) {
    return this.hardwareCatalogService.listWirelessStandards(query);
  }

  @Get("port-standards")
  @ApiOperation({ summary: "List port standards" })
  listPortStandards(@Query() query: HardwareCatalogQueryDto) {
    return this.hardwareCatalogService.listPortStandards(query);
  }

  @Get("sensors")
  @ApiOperation({ summary: "List hardware sensor modules" })
  listSensors(@Query() query: HardwareCatalogQueryDto) {
    return this.hardwareCatalogService.listSensors(query);
  }

  @Get(":kind/:slug")
  @ApiOperation({ summary: "Get a hardware module and devices using it" })
  findByKindAndSlug(@Param("kind") kind: string, @Param("slug") slug: string) {
    return this.hardwareCatalogService.findByKindAndSlug(kind, slug);
  }
}
