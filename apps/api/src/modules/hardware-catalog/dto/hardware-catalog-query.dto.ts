import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";

export class HardwareCatalogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: "snapdragon" })
  @IsOptional()
  @IsString()
  q?: string;
}
