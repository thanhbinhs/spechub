import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import type { Readable } from "node:stream";
import { USER_ROLES } from "../../common/constants";
import {
  CurrentUser,
  type AuthUser,
} from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CatalogStudioService } from "./catalog-studio.service";
import { CatalogEvidenceService } from "./catalog-evidence.service";
import { QuickCatalogIntakeService } from "./quick-catalog-intake.service";
import {
  CatalogSearchDto,
  CompleteCatalogDraftDto,
  CreateCatalogEvidenceClaimDto,
  CompleteMediaUploadDto,
  CreateQuickIntakeDraftsDto,
  CreateCatalogDraftDto,
  CreateMediaUploadDto,
  CreateScoringProfileDto,
  ListCatalogEvidenceClaimsDto,
  PreviewQuickIntakeDto,
  RestoreCatalogDraftDto,
  ResolveCatalogEvidenceClaimDto,
  UpdateCatalogDraftDto,
} from "./dto/catalog-studio.dto";

@ApiTags("catalog-studio")
@ApiBearerAuth()
@Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
@Controller("admin/catalog-studio")
export class CatalogStudioController {
  constructor(
    private readonly catalogStudio: CatalogStudioService,
    private readonly quickCatalogIntake: QuickCatalogIntakeService,
    private readonly catalogEvidence: CatalogEvidenceService,
  ) {}

  @Get("search")
  @ApiOperation({
    summary: "Smart search theo model, codename, SKU, marketing name và alias",
  })
  smartSearch(@Query() query: CatalogSearchDto) {
    return this.catalogStudio.smartSearch(query.q);
  }

  @Post("quick-intake/preview")
  @ApiOperation({
    summary:
      "Đọc URL Tech Specs chính thức, văn bản hoặc CSV; chuẩn hóa dữ liệu và đề xuất bản nháp có bằng chứng nguồn",
  })
  previewQuickIntake(@Body() dto: PreviewQuickIntakeDto) {
    return this.quickCatalogIntake.preview(dto);
  }

  @Post("quick-intake/drafts")
  @ApiOperation({
    summary: "Lưu các mục đã chọn từ nhập nhanh thành bản nháp cần duyệt",
  })
  async createQuickIntakeDrafts(
    @Body() dto: CreateQuickIntakeDraftsDto,
    @CurrentUser("id") userId: string,
  ) {
    const drafts = await Promise.all(
      dto.items.map((item) =>
        this.catalogStudio.createDraft(
          {
            draft_type: item.draft_type,
            title: item.title,
            step_key: "quick-review",
            payload: item.payload,
          },
          userId,
        ),
      ),
    );
    return { data: drafts };
  }

  @Get("evidence/claims")
  @ApiOperation({
    summary: "Danh sách bằng chứng theo trường của draft hoặc entity catalog",
  })
  listEvidenceClaims(
    @Query() query: ListCatalogEvidenceClaimsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogEvidence.listClaims(query, user.id, user.role);
  }

  @Get("evidence/coverage")
  @ApiOperation({
    summary: "Tổng hợp độ phủ, bằng chứng chờ duyệt và xung đột theo trường",
  })
  evidenceCoverage(
    @Query() query: ListCatalogEvidenceClaimsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogEvidence.coverage(query, user.id, user.role);
  }

  @Post("evidence/claims")
  @ApiOperation({
    summary: "Ghi nhận bằng chứng bổ sung; không tự động ghi đè catalog",
  })
  createEvidenceClaim(
    @Body() dto: CreateCatalogEvidenceClaimDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogEvidence.createClaim(dto, user.id, user.role);
  }

  @Patch("evidence/claims/:id")
  @ApiOperation({
    summary: "Chấp nhận, từ chối hoặc đánh dấu cũ một bằng chứng",
  })
  resolveEvidenceClaim(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ResolveCatalogEvidenceClaimDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogEvidence.resolveClaim(id, dto, user.id, user.role);
  }

  @Get("chipsets/:id/bundle")
  @ApiOperation({
    summary: "Trả về CPU, GPU, NPU và modem đã liên kết với chipset",
  })
  chipsetBundle(@Param("id", ParseUUIDPipe) id: string) {
    return this.catalogStudio.chipsetBundle(id);
  }

  @Get("drafts")
  @ApiOperation({ summary: "Danh sách bản nháp có thể tiếp tục chỉnh sửa" })
  listDrafts(@CurrentUser() user: AuthUser) {
    return this.catalogStudio.listDrafts(user.id, user.role);
  }

  @Post("drafts")
  @ApiOperation({ summary: "Tạo bản nháp wizard và revision đầu tiên" })
  createDraft(
    @Body() dto: CreateCatalogDraftDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.catalogStudio.createDraft(dto, userId);
  }

  @Get("drafts/:id")
  @ApiOperation({ summary: "Đọc trạng thái wizard đã autosave" })
  getDraft(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogStudio.getDraft(id, user.id, user.role);
  }

  @Patch("drafts/:id")
  @ApiOperation({
    summary: "Autosave draft bằng optimistic concurrency control",
  })
  updateDraft(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCatalogDraftDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogStudio.updateDraft(id, dto, user.id, user.role);
  }

  @Get("drafts/:id/history")
  @ApiOperation({ summary: "Lịch sử revision của bản nháp" })
  draftHistory(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogStudio.draftHistory(id, user.id, user.role);
  }

  @Post("drafts/:id/restore")
  @ApiOperation({ summary: "Undo bằng cách khôi phục một revision cũ" })
  restoreDraft(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RestoreCatalogDraftDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogStudio.restoreDraft(id, dto, user.id, user.role);
  }

  @Post("drafts/:id/validate")
  @ApiOperation({
    summary: "Kiểm tra dữ liệu bắt buộc và độ hoàn thiện trước publish",
  })
  validateDraft(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogStudio.validateStoredDraft(id, user.id, user.role);
  }

  @Post("drafts/:id/complete")
  @ApiOperation({
    summary: "Đánh dấu draft đã publish và liên kết với entity đã tạo",
  })
  completeDraft(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CompleteCatalogDraftDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogStudio.completeDraft(id, dto, user.id, user.role);
  }

  @Get("history/:entityTable/:entityId")
  @ApiOperation({ summary: "Lịch sử version của entity đã xuất bản" })
  entityHistory(
    @Param("entityTable") entityTable: string,
    @Param("entityId", ParseUUIDPipe) entityId: string,
  ) {
    return this.catalogStudio.entityHistory(entityTable, entityId);
  }

  @Get("scoring-profiles")
  @ApiOperation({ summary: "Danh sách công thức chấm điểm có version" })
  listScoringProfiles() {
    return this.catalogStudio.listScoringProfiles();
  }

  @Post("scoring-profiles/categories/:categoryId")
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({
    summary: "Tạo revision công thức chấm điểm mới trong Admin",
  })
  createScoringProfile(
    @Param("categoryId", ParseUUIDPipe) categoryId: string,
    @Body() dto: CreateScoringProfileDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.catalogStudio.createScoringProfile(categoryId, dto, userId);
  }

  @Post("scoring-profiles/:id/publish")
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({
    summary: "Publish công thức và archive công thức đang dùng trước đó",
  })
  publishScoringProfile(@Param("id", ParseUUIDPipe) id: string) {
    return this.catalogStudio.publishScoringProfile(id);
  }

  @Post("media/uploads")
  @ApiOperation({
    summary: "Tạo media asset và URL upload trực tiếp lên S3/R2",
  })
  createMediaUpload(@Body() dto: CreateMediaUploadDto) {
    return this.catalogStudio.createMediaUpload(dto);
  }

  @Public()
  @Roles()
  @Put("media/uploads/:id/content")
  @ApiOperation({
    summary: "Nhận nội dung tệp bằng URL ký tạm thời khi dùng local storage",
  })
  uploadLocalMediaContent(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("expires") expiresValue: string,
    @Query("token") token: string,
    @Req() request: FastifyRequest,
  ) {
    const expiresAt = Number(expiresValue);
    const body = request.body as Readable | undefined;
    if (
      !Number.isSafeInteger(expiresAt) ||
      !token ||
      !body ||
      typeof body.pipe !== "function"
    ) {
      throw new BadRequestException(
        "Yêu cầu tải tệp cục bộ không hợp lệ hoặc thiếu chữ ký.",
      );
    }
    return this.catalogStudio.uploadLocalMediaContent(
      id,
      expiresAt,
      token,
      request.headers["content-type"],
      body,
    );
  }

  @Post("media/uploads/:id/complete")
  @ApiOperation({
    summary: "Xác nhận upload hoàn tất; database chỉ giữ object metadata",
  })
  completeMediaUpload(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CompleteMediaUploadDto,
  ) {
    return this.catalogStudio.completeMediaUpload(id, dto);
  }
}
