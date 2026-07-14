import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from "class-validator";
import { RAW_PAGE_STATUSES, type RawPageStatus } from "./raw-page-status";

export class CreateRawPageDto {
  @ApiProperty()
  @IsUUID("4")
  source_id!: string;

  @ApiProperty({ example: "https://www.gsmarena.com/apple_iphone_16_pro-13315.php" })
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  raw_html?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  raw_text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  parsed_data?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: RAW_PAGE_STATUSES, default: "pending" })
  @IsOptional()
  @IsIn(RAW_PAGE_STATUSES)
  status?: RawPageStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  device_model_id?: string;
}
