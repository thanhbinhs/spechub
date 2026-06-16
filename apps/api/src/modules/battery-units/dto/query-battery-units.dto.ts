import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";

export class QueryBatteryUnitsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: "5000" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: "li-ion" })
  @IsOptional()
  @IsString()
  chemistry_slug?: string;
}
