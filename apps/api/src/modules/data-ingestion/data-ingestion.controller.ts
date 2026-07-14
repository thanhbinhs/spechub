import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { USER_ROLES } from "../../common/constants";
import { Roles } from "../../common/decorators/roles.decorator";
import { DataIngestionService } from "./data-ingestion.service";
import { CreateDataSourceDto } from "./dto/create-data-source.dto";
import { CreateRawPageDto } from "./dto/create-raw-page.dto";
import { QueryRawPagesDto } from "./dto/query-raw-pages.dto";
import { ReviewRawPageDto } from "./dto/review-raw-page.dto";
import { UpdateDataSourceDto } from "./dto/update-data-source.dto";

@ApiTags("data-ingestion")
@ApiBearerAuth()
@Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
@Controller("data-ingestion")
export class DataIngestionController {
  constructor(private readonly dataIngestionService: DataIngestionService) {}

  @Get("sources")
  @ApiOperation({ summary: "List crawler data sources" })
  listSources() {
    return this.dataIngestionService.listSources();
  }

  @Post("sources")
  @ApiOperation({ summary: "Create crawler data source" })
  createSource(@Body() dto: CreateDataSourceDto) {
    return this.dataIngestionService.createSource(dto);
  }

  @Patch("sources/:id")
  @ApiOperation({ summary: "Update crawler data source" })
  updateSource(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateDataSourceDto,
  ) {
    return this.dataIngestionService.updateSource(id, dto);
  }

  @Get("raw-pages")
  @ApiOperation({ summary: "List raw crawler pages" })
  listRawPages(@Query() query: QueryRawPagesDto) {
    return this.dataIngestionService.listRawPages(query);
  }

  @Get("review-queue")
  @ApiOperation({ summary: "List raw pages waiting for review" })
  listReviewQueue(@Query() query: QueryRawPagesDto) {
    const reviewQuery = Object.assign(new QueryRawPagesDto(), query, {
      status: query.status ?? "needs_review",
    });
    return this.dataIngestionService.listRawPages(reviewQuery);
  }

  @Get("raw-pages/:id")
  @ApiOperation({ summary: "Get raw crawler page" })
  getRawPage(@Param("id", ParseUUIDPipe) id: string) {
    return this.dataIngestionService.getRawPage(id);
  }

  @Post("raw-pages")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Upsert raw crawler page" })
  upsertRawPage(@Body() dto: CreateRawPageDto) {
    return this.dataIngestionService.upsertRawPage(dto);
  }

  @Patch("raw-pages/:id/review")
  @ApiOperation({ summary: "Review raw crawler page" })
  reviewRawPage(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ReviewRawPageDto,
  ) {
    return this.dataIngestionService.reviewRawPage(id, dto);
  }
}
