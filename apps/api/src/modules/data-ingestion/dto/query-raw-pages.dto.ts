import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, IsUUID } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";
import { RAW_PAGE_STATUSES, type RawPageStatus } from "./raw-page-status";

export class QueryRawPagesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RAW_PAGE_STATUSES })
  @IsOptional()
  @IsIn(RAW_PAGE_STATUSES)
  status?: RawPageStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  source_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  device_model_id?: string;

  @ApiPropertyOptional({ example: "iphone" })
  @IsOptional()
  @IsString()
  q?: string;
}
