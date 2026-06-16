import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";

export class QueryChipsetsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: "snapdragon" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: "qualcomm" })
  @IsOptional()
  @IsString()
  manufacturer_slug?: string;

  @ApiPropertyOptional({ example: "soc" })
  @IsOptional()
  @IsString()
  chip_kind?: string;
}
