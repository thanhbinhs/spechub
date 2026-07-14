import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";

export class QueryCitationsDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  source_id?: string;

  @ApiPropertyOptional({ example: "iphone" })
  @IsOptional()
  @IsString()
  q?: string;
}
