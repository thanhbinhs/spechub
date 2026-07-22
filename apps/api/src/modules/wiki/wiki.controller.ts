import {
  Body,
  Controller,
  Delete,
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
import {
  CurrentUser,
  type AuthUser,
} from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateWikiArticleDto } from "./dto/create-wiki-article.dto";
import { QueryWikiArticlesDto } from "./dto/query-wiki-articles.dto";
import { SubmitWikiRevisionDto } from "./dto/submit-wiki-revision.dto";
import { UpdateWikiArticleDto } from "./dto/update-wiki-article.dto";
import { WikiService } from "./wiki.service";

@ApiTags("wiki")
@Controller("wiki")
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  @Public()
  @Get("articles")
  @ApiOperation({ summary: "List published wiki articles" })
  listPublished(@Query() query: QueryWikiArticlesDto) {
    return this.wikiService.listPublished(query);
  }

  @Public()
  @Get("articles/:slug")
  @ApiOperation({ summary: "Read a published wiki article by slug" })
  findPublished(
    @Param("slug") slug: string,
    @Query("language_code") languageCode?: string,
  ) {
    return this.wikiService.findPublishedBySlug(slug, languageCode);
  }

  @Get("admin/articles")
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR, USER_ROLES.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all wiki articles for moderation" })
  listForModeration(@Query() query: QueryWikiArticlesDto) {
    return this.wikiService.listForModeration(query);
  }

  @Post("articles")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create a wiki article; community submissions enter review",
  })
  create(@Body() dto: CreateWikiArticleDto, @CurrentUser() user: AuthUser) {
    return this.wikiService.create(dto, user);
  }

  @Patch("articles/:id")
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Edit an article and create a revision" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateWikiArticleDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.wikiService.update(id, dto, userId);
  }

  @Post("articles/:id/revisions")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Submit a proposed wiki revision" })
  submitRevision(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: SubmitWikiRevisionDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.wikiService.submitRevision(id, dto, userId);
  }

  @Get("articles/:id/revisions")
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR, USER_ROLES.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List article revision history" })
  listRevisions(@Param("id", ParseUUIDPipe) id: string) {
    return this.wikiService.listRevisions(id);
  }

  @Post("articles/:id/revisions/:revisionId/publish")
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Publish a reviewed revision" })
  publishRevision(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("revisionId", ParseUUIDPipe) revisionId: string,
  ) {
    return this.wikiService.publishRevision(id, revisionId);
  }

  @Delete("articles/:id")
  @HttpCode(HttpStatus.OK)
  @Roles(USER_ROLES.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Archive a wiki article" })
  archive(@Param("id", ParseUUIDPipe) id: string) {
    return this.wikiService.archive(id);
  }
}
