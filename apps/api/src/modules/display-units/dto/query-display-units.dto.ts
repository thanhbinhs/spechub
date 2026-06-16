import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";

export class QueryDisplayUnitsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: "ltpo" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: "ltpo-oled" })
  @IsOptional()
  @IsString()
  technology_slug?: string;
}
