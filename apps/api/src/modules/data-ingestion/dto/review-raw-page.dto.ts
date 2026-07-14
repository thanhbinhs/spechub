import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { RAW_PAGE_STATUSES, type RawPageStatus } from "./raw-page-status";

export class ReviewRawPageDto {
  @ApiProperty({ enum: RAW_PAGE_STATUSES, example: "approved" })
  @IsIn(RAW_PAGE_STATUSES)
  status!: RawPageStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  parsed_data?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  device_model_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  error_message?: string;
}
