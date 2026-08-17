import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsIn,
  IsInt,
  IsMimeType,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class CatalogSearchDto {
  @ApiProperty({ example: "SM-S928B" })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  q!: string;
}

export const QUICK_INTAKE_ENTITY_TYPES = ["device", "hardware-module"] as const;

export const QUICK_INTAKE_INPUT_TYPES = ["url", "text", "csv"] as const;

export const QUICK_INTAKE_HARDWARE_KINDS = [
  "chipset",
  "cpu",
  "gpu",
  "npu",
  "modem",
  "memory-standard",
  "storage-standard",
  "operating-system",
] as const;

export const CATALOG_CLAIM_TARGET_TABLES = [
  "device_models",
  "device_variants",
  "chipsets",
  "cpus",
  "gpus",
  "npus",
  "modems",
  "memory_standards",
  "storage_standards",
  "operating_systems",
] as const;

export const CATALOG_CLAIM_SOURCE_TYPES = [
  "official",
  "certification",
  "lab",
  "benchmark",
  "retail",
  "editorial",
] as const;

export const CATALOG_CLAIM_KINDS = [
  "declared",
  "measured",
  "benchmark",
  "commercial",
  "editorial",
] as const;

export const CATALOG_CLAIM_STATUSES = [
  "candidate",
  "accepted",
  "conflict",
  "rejected",
  "stale",
] as const;

/**
 * A source is always retained with a quick intake. This permits editors to
 * verify extracted values before a draft becomes a published catalog record.
 */
export class PreviewQuickIntakeDto {
  @ApiProperty({ enum: QUICK_INTAKE_ENTITY_TYPES })
  @IsIn(QUICK_INTAKE_ENTITY_TYPES)
  entity_type!: (typeof QUICK_INTAKE_ENTITY_TYPES)[number];

  @ApiPropertyOptional({ enum: QUICK_INTAKE_HARDWARE_KINDS })
  @IsOptional()
  @IsIn(QUICK_INTAKE_HARDWARE_KINDS)
  hardware_kind?: (typeof QUICK_INTAKE_HARDWARE_KINDS)[number];

  @ApiProperty({ enum: QUICK_INTAKE_INPUT_TYPES })
  @IsIn(QUICK_INTAKE_INPUT_TYPES)
  input_type!: (typeof QUICK_INTAKE_INPUT_TYPES)[number];

  @ApiProperty({
    description:
      "URL Tech Specs chính thức được hỗ trợ, thông số dán thủ công hoặc CSV tương thích RFC 4180. URL không thuộc nguồn chính thức sẽ bị từ chối.",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500_000)
  value!: string;

  @ApiPropertyOptional({
    description: "A human-readable label for pasted or CSV data.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  source_label?: string;
}

export class QuickIntakeDraftItemDto {
  @ApiProperty({ enum: QUICK_INTAKE_ENTITY_TYPES })
  @IsIn(QUICK_INTAKE_ENTITY_TYPES)
  draft_type!: (typeof QUICK_INTAKE_ENTITY_TYPES)[number];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ type: "object", additionalProperties: true })
  @IsObject()
  payload!: Record<string, unknown>;
}

export class CreateQuickIntakeDraftsDto {
  @ApiProperty({ type: [QuickIntakeDraftItemDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => QuickIntakeDraftItemDto)
  items!: QuickIntakeDraftItemDto[];
}

export class CreateCatalogEvidenceClaimDto {
  @ApiPropertyOptional({ description: "Draft đang được biên tập." })
  @IsOptional()
  @IsUUID("4")
  catalog_draft_id?: string;

  @ApiPropertyOptional({ enum: CATALOG_CLAIM_TARGET_TABLES })
  @IsOptional()
  @IsIn(CATALOG_CLAIM_TARGET_TABLES)
  entity_table?: (typeof CATALOG_CLAIM_TARGET_TABLES)[number];

  @ApiPropertyOptional({ description: "ID entity đã xuất bản." })
  @IsOptional()
  @IsUUID("4")
  entity_id?: string;

  @ApiProperty({ example: "display.brightness_peak_nits" })
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*){0,7}$/)
  @MaxLength(180)
  field_path!: string;

  @ApiProperty({
    description:
      "Giá trị gốc có thể là chuỗi, số, boolean hoặc object có cấu trúc.",
  })
  @IsDefined()
  value!: unknown;

  @ApiPropertyOptional({ example: "1,600 nits" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  display_value?: string;

  @ApiProperty({ enum: CATALOG_CLAIM_SOURCE_TYPES })
  @IsIn(CATALOG_CLAIM_SOURCE_TYPES)
  source_type!: (typeof CATALOG_CLAIM_SOURCE_TYPES)[number];

  @ApiProperty({ example: "DXOMARK Display" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  source_label!: string;

  @ApiProperty({ example: "https://example.com/review/device" })
  @IsString()
  @Matches(/^https:\/\//i, {
    message: "source_url phải là URL HTTPS.",
  })
  @MaxLength(2_000)
  source_url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  source_title?: string;

  @ApiPropertyOptional({ example: "Peak brightness: 1,600 nits" })
  @IsOptional()
  @IsString()
  @MaxLength(4_000)
  evidence_excerpt?: string;

  @ApiProperty({ enum: CATALOG_CLAIM_KINDS })
  @IsIn(CATALOG_CLAIM_KINDS)
  claim_kind!: (typeof CATALOG_CLAIM_KINDS)[number];

  @ApiPropertyOptional({ example: "VN" })
  @IsOptional()
  @Matches(/^[A-Za-z0-9-]{2,20}$/)
  scope_region?: string;

  @ApiPropertyOptional({ example: "SM-S928B" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  scope_sku?: string;

  @ApiPropertyOptional({
    example: "Đo ở 150 nit, Wi-Fi bật, firmware 1.0.4.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(4_000)
  methodology?: string;

  @ApiPropertyOptional({ example: "2026-08-09" })
  @IsOptional()
  @IsDateString()
  tested_at?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 1, example: 0.92 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

export class ListCatalogEvidenceClaimsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  catalog_draft_id?: string;

  @ApiPropertyOptional({ enum: CATALOG_CLAIM_TARGET_TABLES })
  @IsOptional()
  @IsIn(CATALOG_CLAIM_TARGET_TABLES)
  entity_table?: (typeof CATALOG_CLAIM_TARGET_TABLES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  entity_id?: string;

  @ApiPropertyOptional({ enum: CATALOG_CLAIM_STATUSES })
  @IsOptional()
  @IsIn(CATALOG_CLAIM_STATUSES)
  status?: (typeof CATALOG_CLAIM_STATUSES)[number];
}

export class ResolveCatalogEvidenceClaimDto {
  @ApiProperty({ enum: ["accepted", "rejected", "stale"] })
  @IsIn(["accepted", "rejected", "stale"])
  status!: "accepted" | "rejected" | "stale";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolution_note?: string;
}

export class CreateCatalogDraftDto {
  @ApiProperty({ enum: ["device", "hardware-module", "scoring-profile"] })
  @IsIn(["device", "hardware-module", "scoring-profile"])
  draft_type!: string;

  @ApiProperty({ example: "Galaxy S26 Ultra" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: "device_models" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  entity_table?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entity_id?: string;

  @ApiPropertyOptional({ example: "general" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  step_key?: string;

  @ApiProperty({ type: "object", additionalProperties: true })
  @IsObject()
  payload!: Record<string, unknown>;
}

export class UpdateCatalogDraftDto {
  @ApiProperty({
    description:
      "Revision hiện tại trên client. Server từ chối nếu draft đã được lưu ở nơi khác.",
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expected_revision!: number;

  @ApiProperty({ type: "object", additionalProperties: true })
  @IsObject()
  payload!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  step_key?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  change_summary?: string;
}

export class RestoreCatalogDraftDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expected_revision!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  restore_revision!: number;
}

export class CompleteCatalogDraftDto {
  @ApiProperty()
  @IsUUID("4")
  entity_id!: string;

  @ApiProperty({ example: "device_models" })
  @IsString()
  @IsIn([
    "device_models",
    "chipsets",
    "cpus",
    "gpus",
    "npus",
    "modems",
    "memory_standards",
    "storage_standards",
    "operating_systems",
  ])
  entity_table!: string;
}

export class ScoringMetricInputDto {
  @ApiProperty({ example: "cpu_single" })
  @IsString()
  @Matches(/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/)
  @MaxLength(80)
  key!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  weight!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  min!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  max!: number;

  @ApiPropertyOptional({ enum: ["higher", "lower"] })
  @IsOptional()
  @IsIn(["higher", "lower"])
  direction?: "higher" | "lower";

  @ApiPropertyOptional({ enum: ["linear", "log"] })
  @IsOptional()
  @IsIn(["linear", "log"])
  scale?: "linear" | "log";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  unit?: string;
}

export class ScoringModuleInputDto {
  @ApiProperty({ example: "performance" })
  @IsString()
  @Matches(/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/)
  @MaxLength(60)
  key!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  weight!: number;

  @ApiProperty({ type: [ScoringMetricInputDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ScoringMetricInputDto)
  metrics!: ScoringMetricInputDto[];
}

export class CreateScoringProfileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ type: [ScoringModuleInputDto] })
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ScoringModuleInputDto)
  modules!: ScoringModuleInputDto[];
}

export class CreateMediaUploadDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename!: string;

  @ApiProperty({ example: "image/webp" })
  @IsMimeType()
  mime_type!: string;

  @ApiProperty({ enum: ["image", "video"] })
  @IsIn(["image", "video"])
  asset_type!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  file_size_bytes!: number;

  @ApiProperty()
  @IsString()
  @MaxLength(80)
  entity_table!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  entity_id!: string;

  @ApiProperty({ example: "cover" })
  @IsString()
  @MaxLength(40)
  role!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alt_text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  width_px?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  height_px?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration_ms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}

export class CompleteMediaUploadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  checksum_sha256?: string;
}
