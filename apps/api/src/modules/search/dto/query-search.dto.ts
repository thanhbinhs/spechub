import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";

export class QuerySearchDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: "iphone" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: "apple" })
  @IsOptional()
  @IsString()
  brand_slug?: string;

  @ApiPropertyOptional({ example: "smartphone" })
  @IsOptional()
  @IsString()
  category_slug?: string;
}
