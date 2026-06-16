import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";

export class QueryCameraModulesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: "sony" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: "main" })
  @IsOptional()
  @IsString()
  role_code?: string;
}
