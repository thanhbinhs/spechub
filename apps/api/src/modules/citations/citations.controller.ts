import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { USER_ROLES } from "../../common/constants";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CitationsService } from "./citations.service";
import { CreateCitationDto } from "./dto/create-citation.dto";
import { CreateSourceDto } from "./dto/create-source.dto";
import { QueryCitationsDto } from "./dto/query-citations.dto";
import { UpdateCitationDto } from "./dto/update-citation.dto";
import { UpdateSourceDto } from "./dto/update-source.dto";

@ApiTags("citations")
@Controller("citations")
export class CitationsController {
  constructor(private readonly citationsService: CitationsService) {}

  @Public()
  @Get("sources")
  @ApiOperation({ summary: "List citation sources" })
  listSources() {
    return this.citationsService.listSources();
  }

  @Post("sources")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Create citation source" })
  createSource(@Body() dto: CreateSourceDto) {
    return this.citationsService.createSource(dto);
  }

  @Patch("sources/:id")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Update citation source" })
  updateSource(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateSourceDto,
  ) {
    return this.citationsService.updateSource(id, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: "List citations" })
  listCitations(@Query() query: QueryCitationsDto) {
    return this.citationsService.listCitations(query);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get citation" })
  findCitation(@Param("id", ParseUUIDPipe) id: string) {
    return this.citationsService.findCitation(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Create citation" })
  createCitation(@Body() dto: CreateCitationDto) {
    return this.citationsService.createCitation(dto);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Update citation" })
  updateCitation(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCitationDto,
  ) {
    return this.citationsService.updateCitation(id, dto);
  }
}
